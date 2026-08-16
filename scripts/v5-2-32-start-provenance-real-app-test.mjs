import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HOST = '127.0.0.1';
const PORT = 41741;
const DEBUG = 9341;
const base = `http://${HOST}:${PORT}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function localISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function addDaysISO(iso, n) {
  const [y,m,d] = iso.split('-').map(Number);
  const x = new Date(y, m-1, d);
  x.setDate(x.getDate()+n);
  return localISO(x);
}
function currentPayrollSaturdayISO() {
  const today = new Date();
  const x = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  x.setDate(x.getDate() + ((6 - x.getDay() + 7) % 7));
  return localISO(x);
}
function commandExists(cmd) {
  const r = spawnSync(cmd, ['--version'], { stdio: 'ignore' });
  return r.status === 0;
}
function resolveBrowser() {
  const explicit = process.env.CHROME_PATH || process.env.CHROMIUM_PATH;
  if (explicit) {
    if (fs.existsSync(explicit)) return explicit;
    throw new Error(`CHROME_PATH/CHROMIUM_PATH does not exist: ${explicit}`);
  }
  const candidates = [
    'chromium','chromium-browser','google-chrome','google-chrome-stable',
    '/usr/bin/chromium','/usr/bin/google-chrome',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const c of candidates) {
    if (c.includes(path.sep) || /^[A-Za-z]:\\/.test(c)) {
      if (fs.existsSync(c)) return c;
    } else if (commandExists(c)) return c;
  }
  throw new Error('No Chrome/Chromium found. Set CHROME_PATH.');
}
async function waitHttp(url, tries=160) {
  for (let i=0;i<tries;i++) {
    try { const r = await fetch(url); if (r.ok) return; } catch {}
    await sleep(100);
  }
  throw new Error(`timeout waiting for ${url}`);
}
function kill(p) { try { p?.kill('SIGTERM'); } catch {} }

const browserPath = resolveBrowser();
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js','--host',HOST,'--port',String(PORT)], { stdio:'ignore' });
const profile = fs.mkdtempSync(path.join(os.tmpdir(),'dpa-v5232-start-'));
const chrome = spawn(browserPath, [
  '--headless=new','--no-sandbox','--disable-gpu',
  `--remote-debugging-port=${DEBUG}`,
  `--user-data-dir=${profile}`,
  base
], { stdio:'ignore' });

let ws;
let id=0;
const pending = new Map();
let lastExecutionContextId = null;

async function cdp(method, params={}) {
  const mid=++id;
  ws.send(JSON.stringify({id:mid,method,params}));
  return await new Promise((res,rej)=>pending.set(mid,{res,rej}));
}
function formatExceptionDetails(details) {
  if (!details) return 'Runtime.evaluate exception';
  const description = details.exception?.description || details.exception?.value || details.text || 'Runtime.evaluate exception';
  const frames = details.stackTrace?.callFrames || [];
  const stack = frames.map(f=>`  at ${f.functionName || '<anonymous>'} (${f.url || 'eval'}:${f.lineNumber+1}:${f.columnNumber+1})`).join('\n');
  return stack ? `${description}\n${stack}` : String(description);
}
async function evalJS(expression) {
  const r = await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if (r.exceptionDetails) throw new Error(formatExceptionDetails(r.exceptionDetails));
  return r.result?.value;
}
async function bodyText() { return await evalJS('document.body.innerText'); }
async function reloadAndWait() {
  const previous = lastExecutionContextId;
  await cdp('Page.reload',{ignoreCache:true});
  for(let i=0;i<150;i++) {
    if (lastExecutionContextId && lastExecutionContextId !== previous) {
      try {
        const ready=await evalJS('document.readyState');
        if (ready==='interactive' || ready==='complete') return;
      } catch {}
    }
    await sleep(100);
  }
  throw new Error('Timed out waiting for reload');
}
async function setStorage(items) {
  await cdp('DOMStorage.enable');
  const storageId={securityOrigin:base,isLocalStorage:true};
  try { await cdp('DOMStorage.clear',{storageId}); }
  catch {
    await cdp('Page.navigate',{url:base});
    await sleep(300);
    await cdp('DOMStorage.clear',{storageId});
  }
  for (const [key,value] of Object.entries(items)) {
    await cdp('DOMStorage.setDOMStorageItem',{storageId,key,value:String(value)});
  }
}
function mk(id, dayName, dateISO, start='', finish='', extra={}) {
  return {
    id,dayName,dateLabel:dateISO,dateISO,start,finish,startKm:'',finishKm:'',holidayPay:'',
    dayType:'work',splitBreak:false,nightOut:false,bonuses:[],...extra
  };
}
function fixture({ longPrevious=false, oldStart=null }) {
  const sat=currentPayrollSaturdayISO();
  const dates={
    sun:addDaysISO(sat,-6), mon:addDaysISO(sat,-5), tue:addDaysISO(sat,-4), wed:addDaysISO(sat,-3),
    thu:addDaysISO(sat,-2), fri:addDaysISO(sat,-1), sat
  };
  const sundayStart = longPrevious ? '04:00' : '07:00';
  const days=[
    mk('mon','Monday',dates.mon,oldStart || '','', oldStart ? {} : {}),
    mk('tue','Tuesday',dates.tue),
    mk('wed','Wednesday',dates.wed),
    mk('thu','Thursday',dates.thu),
    mk('fri','Friday',dates.fri),
    mk('sat','Saturday',dates.sat),
    mk('sun','Sunday',dates.sun,sundayStart,'18:00'),
  ];
  if (oldStart) delete days[0].startEntrySource;
  return {sat,days};
}
async function loadFixture(opts) {
  const {sat,days}=fixture(opts);
  await setStorage({
    driverPayV4_language:'en',
    archive:'[]',
    driverPayV4_activeSaturday:sat,
    driverPayV4_closedWeeks:'[]',
    [`driverApp_week_${sat}`]:JSON.stringify({days,settings:{},payslipActualWeek:''})
  });
  await reloadAndWait();
  await sleep(300);
  return {sat,days};
}
async function startInputState() {
  return await evalJS(`(()=>{
    const labels=[...document.querySelectorAll('label')];
    const startLabel=labels.find(l=>l.firstElementChild?.textContent?.trim()==='Start');
    const finishLabel=labels.find(l=>l.firstElementChild?.textContent?.trim()==='Finish');
    const start=startLabel?.querySelector('input');
    const finish=finishLabel?.querySelector('input');
    return start ? {
      value:start.value,
      placeholder:start.placeholder,
      color:getComputedStyle(start).color,
      background:getComputedStyle(start).backgroundColor,
      finishFound:Boolean(finish),
      body:document.body.innerText
    } : null;
  })()`);
}
async function typeStartAndBlur(value) {
  return await evalJS(`(()=>{
    const labels=[...document.querySelectorAll('label')];
    const start=labels.find(l=>l.firstElementChild?.textContent?.trim()==='Start')?.querySelector('input');
    const finish=labels.find(l=>l.firstElementChild?.textContent?.trim()==='Finish')?.querySelector('input');
    if(!start || !finish) return false;
    start.focus();
    const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
    setter.call(start,${JSON.stringify(value)});
    start.dispatchEvent(new Event('input',{bubbles:true}));
    start.dispatchEvent(new Event('change',{bubbles:true}));
    finish.focus();
    return true;
  })()`);
}
async function readCurrentWeekStored(sat) {
  return await evalJS(`JSON.parse(localStorage.getItem(${JSON.stringify(`driverApp_week_${sat}`)}) || 'null')`);
}

const results=[];
function record(name, pass, details) {
  results.push({name,pass,details});
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}`);
  if (details) console.log(details);
}

try {
  await waitHttp(base);
  await waitHttp(`http://${HOST}:${DEBUG}/json/version`);
  const pages=await (await fetch(`http://${HOST}:${DEBUG}/json/list`)).json();
  const page=pages.find(p=>p.type==='page' && p.url.startsWith(base)) || pages.find(p=>p.type==='page');
  assert.ok(page?.webSocketDebuggerUrl,'CDP page target not found');

  ws=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res,rej)=>{ws.onopen=res; ws.onerror=rej;});
  ws.onmessage=(e)=>{
    const m=JSON.parse(e.data);
    if(m.method==='Runtime.executionContextCreated') {
      const ctx=m.params?.context;
      if(ctx?.auxData?.isDefault) lastExecutionContextId=ctx.id;
      return;
    }
    if(m.id && pending.has(m.id)) {
      const p=pending.get(m.id); pending.delete(m.id);
      m.error ? p.rej(new Error(m.error.message)) : p.res(m.result);
    }
  };
  await cdp('Runtime.enable');
  await cdp('Page.enable');
  await cdp('DOMStorage.enable');
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});

  // 1) Manual Start exactly equals 11h suggestion.
  {
    const {sat}=await loadFixture({longPrevious:false,oldStart:null});
    const before=await startInputState();
    const suggestion=before?.placeholder;
    const expected='05:00';
    if(suggestion!==expected) {
      record('START-003 manual exact 11h suggestion',false,`Expected placeholder ${expected}, got ${suggestion}\n${before?.body || ''}`);
    } else {
      const changed=await typeStartAndBlur(expected);
      await sleep(350);
      const after=await startInputState();
      const stored=await readCurrentWeekStored(sat);
      const mon=stored?.days?.find(d=>d.id==='mon');
      const pass=Boolean(changed && after?.value===expected && mon?.start===expected && mon?.startEntrySource==='user');
      record('START-003 manual exact 11h suggestion',pass,
        `before placeholder=${suggestion}; after value=${after?.value}; stored start=${mon?.start}; startEntrySource=${mon?.startEntrySource}`);
    }
  }

  // 2) Manual Start exactly equals 9h primary suggestion after >13h previous duty.
  {
    const {sat}=await loadFixture({longPrevious:true,oldStart:null});
    const before=await startInputState();
    const suggestion=before?.placeholder;
    const expected='03:00';
    if(suggestion!==expected) {
      record('START-003 manual exact 9h suggestion',false,`Expected placeholder ${expected}, got ${suggestion}\n${before?.body || ''}`);
    } else {
      const changed=await typeStartAndBlur(expected);
      await sleep(350);
      const after=await startInputState();
      const stored=await readCurrentWeekStored(sat);
      const mon=stored?.days?.find(d=>d.id==='mon');
      const pass=Boolean(changed && after?.value===expected && mon?.start===expected && mon?.startEntrySource==='user');
      record('START-003 manual exact 9h suggestion',pass,
        `before placeholder=${suggestion}; after value=${after?.value}; stored start=${mon?.start}; startEntrySource=${mon?.startEntrySource}`);
    }
  }

  // 3) Backward compatibility: old factual Start without startEntrySource, equal to 11h suggestion.
  {
    await loadFixture({longPrevious:false,oldStart:'05:00'});
    const state=await startInputState();
    const pass=state?.value==='05:00';
    record('OLD DATA without startEntrySource — factual Start == 11h suggestion',pass,
      `DOM Start value=${JSON.stringify(state?.value)}; placeholder=${JSON.stringify(state?.placeholder)}\n`+
      `Expected factual value "05:00" to remain visible.\nRest/DOM excerpt:\n${(state?.body || '').slice(0,1400)}`);
  }

  // 4) Backward compatibility: old factual Start without startEntrySource, equal to 9h suggestion.
  {
    await loadFixture({longPrevious:true,oldStart:'03:00'});
    const state=await startInputState();
    const pass=state?.value==='03:00';
    record('OLD DATA without startEntrySource — factual Start == 9h suggestion',pass,
      `DOM Start value=${JSON.stringify(state?.value)}; placeholder=${JSON.stringify(state?.placeholder)}\n`+
      `Expected factual value "03:00" to remain visible.\nRest/DOM excerpt:\n${(state?.body || '').slice(0,1400)}`);
  }

  console.log('\n==================================================');
  console.log('v5.2.32 START PROVENANCE / BACKWARD COMPATIBILITY REAL-APP RESULTS');
  console.log('==================================================');
  for(const r of results) console.log(`${r.pass ? 'PASS' : 'FAIL'} — ${r.name}`);
  const failed=results.filter(r=>!r.pass);
  if(failed.length) {
    console.log('\nFINAL VERDICT: FAIL — application defect reproduced in real App/DOM');
    process.exitCode=2;
  } else {
    console.log(`\nFINAL VERDICT: PASS — START-003 + old-data compatibility (${browserPath})`);
  }
} finally {
  try{ws?.close();}catch{}
  kill(chrome);
  kill(vite);
  try{fs.rmSync(profile,{recursive:true,force:true});}catch{}
}
