import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HOST='127.0.0.1', PORT=41751, DEBUG=9351;
const base=`http://${HOST}:${PORT}`;
const expectedAppTitle=`Driver Pay App V${JSON.parse(fs.readFileSync('package.json','utf8')).version}`;
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));

function isoUTC(date){
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')}`;
}
function addDaysISO(iso, days){
  const date=new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate()+days);
  return isoUTC(date);
}
function currentPayrollSaturdayISO(){
  const now=new Date();
  const date=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));
  const delta=(6-date.getUTCDay()+7)%7;
  date.setUTCDate(date.getUTCDate()+delta);
  return isoUTC(date);
}
const fixtureSaturdayISO=currentPayrollSaturdayISO();
const fixtureSundayISO=addDaysISO(fixtureSaturdayISO,-6);


async function waitHttp(url, tries=120){
  for(let i=0;i<tries;i++){
    try{ const r=await fetch(url); if(r.ok)return; }catch{}
    await sleep(100);
  }
  throw new Error(`timeout waiting for ${url}`);
}
function kill(p){ try{p?.kill('SIGTERM')}catch{} }

function commandExists(cmd){
  const r=spawnSync(cmd,['--version'],{stdio:'ignore'});
  return r.status===0;
}
function resolveBrowser(){
  const explicit=process.env.CHROME_PATH || process.env.CHROMIUM_PATH;
  if(explicit){
    if(fs.existsSync(explicit)) return explicit;
    throw new Error(`CHROME_PATH/CHROMIUM_PATH does not exist: ${explicit}`);
  }
  const candidates=[
    'chromium','chromium-browser','google-chrome','google-chrome-stable',
    '/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable','/opt/google/chrome/chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium'
  ];
  for(const c of candidates){
    if(c.includes(path.sep)){
      if(fs.existsSync(c)) return c;
    }else if(commandExists(c)) return c;
  }
  throw new Error(
    'No Chrome/Chromium executable found. Set CHROME_PATH to the browser executable.'
  );
}

function spawnChecked(cmd,args,opts={}){
  const child=spawn(cmd,args,opts);
  child.on('error',(err)=>{
    console.error(`Failed to spawn ${cmd}: ${err.message}`);
  });
  return child;
}

console.log('Phase 8 browser QA: resolving browser');
const browserPath=resolveBrowser();
console.log('Phase 8 browser QA: launching Vite preview');
const vite=spawnChecked(process.execPath,
  ['node_modules/vite/bin/vite.js','preview','--host',HOST,'--port',String(PORT)],
  {stdio:'inherit'}
);
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'dpa-chrome-'));
console.log('Phase 8 browser QA: launching browser');
const chrome=spawnChecked(browserPath,[
  '--headless=new','--no-sandbox','--disable-gpu',
  `--remote-debugging-port=${DEBUG}`,
  `--user-data-dir=${profile}`,
  base
],{stdio:'ignore'});

let ws;
let id=0;
const pending=new Map();
let lastExecutionContextId=null;

async function cdp(method,params={}){
  const mid=++id;
  ws.send(JSON.stringify({id:mid,method,params}));
  return await new Promise((res,rej)=>pending.set(mid,{res,rej}));
}
function formatExceptionDetails(details){
  if(!details) return 'Runtime.evaluate exception';
  const description =
    details.exception?.description ||
    details.exception?.value ||
    details.text ||
    'Runtime.evaluate exception';
  const frames = details.stackTrace?.callFrames || [];
  const stack = frames.map(f=>`  at ${f.functionName || '<anonymous>'} (${f.url || 'eval'}:${f.lineNumber+1}:${f.columnNumber+1})`).join('\n');
  return stack ? `${description}\n${stack}` : String(description);
}
async function evalJS(expression){
  const r=await cdp('Runtime.evaluate',{
    expression,returnByValue:true,awaitPromise:true
  });
  if(r.exceptionDetails) throw new Error(formatExceptionDetails(r.exceptionDetails));
  // cdp() already returns the protocol response's `result` object.
  // Runtime.evaluate's remote value is therefore at r.result.value.
  return r.result?.value;
}
async function bodyText(){ return await evalJS('document.body.innerText'); }

function assertRuntimeEvaluateShape(){
  const simulated={result:{type:'string',value:'Driver Pay'}};
  assert.equal(simulated.result?.value,'Driver Pay');
  assert.equal(simulated.result?.result?.value,undefined);
}
assertRuntimeEvaluateShape();

async function waitForBodyContains(text, tries=80){
  for(let i=0;i<tries;i++){
    try{
      const t=await bodyText();
      if(t.includes(text)) return t;
    }catch{}
    await sleep(100);
  }
  throw new Error(`Timed out waiting for DOM text: ${text}`);
}

async function reloadAndWait(){
  const previous=lastExecutionContextId;
  await cdp('Page.reload',{ignoreCache:true});
  for(let i=0;i<120;i++){
    if(lastExecutionContextId && lastExecutionContextId!==previous){
      try{
        const ready=await evalJS('document.readyState');
        if(ready==='interactive' || ready==='complete') return;
      }catch{}
    }
    await sleep(100);
  }
  throw new Error('Timed out waiting for page reload/new execution context');
}

async function clickText(text){
  const js=`(()=>{const el=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()===${JSON.stringify(text)}); if(!el)return false; el.click(); return true})()`;
  assert.equal(await evalJS(js),true,`button ${text}`);
  await sleep(150);
}
async function clickContains(text){
  const js=`(()=>{const el=[...document.querySelectorAll('button')].find(x=>x.textContent.includes(${JSON.stringify(text)})); if(!el)return false; el.click(); return true})()`;
  assert.equal(await evalJS(js),true,`button containing ${text}`);
  await sleep(150);
}

async function setLocalStorageItems(items){
  await cdp('DOMStorage.enable');
  const storageId={securityOrigin:base,isLocalStorage:true};

  // Clear only the application's origin storage via CDP, not via Runtime.evaluate.
  try{
    await cdp('DOMStorage.clear',{storageId});
  }catch(err){
    // Some Chromium builds can report clear before the origin is initialized.
    // Force one real navigation, then retry.
    await cdp('Page.navigate',{url:base});
    await waitForBodyContains('Driver Pay');
    await cdp('DOMStorage.clear',{storageId});
  }

  for(const [key,value] of Object.entries(items)){
    await cdp('DOMStorage.setDOMStorageItem',{
      storageId,
      key,
      value:String(value)
    });
  }
}

function makeDay(id, dateISO, start='', finish='', dayType='work'){
  const dayName=new Intl.DateTimeFormat('en-GB',{weekday:'long',timeZone:'UTC'}).format(new Date(`${dateISO}T12:00:00Z`));
  return {id,dayName,dateLabel:dateISO,dateISO,start,finish,startKm:'',finishKm:'',holidayPay:'',dayType,splitBreak:false,nightOut:false,bonuses:[],completionSource:start&&finish?'user':undefined};
}
function weekDays(saturday, populated=false){
  const days=[];
  for(let offset=-5;offset<=0;offset++){
    const date=addDaysISO(saturday,offset);
    const work=populated && (offset===-5 || offset===-1);
    days.push(makeDay(`day-${date}`,date,work?'08:00':'',work?'18:00':''));
  }
  days.push(makeDay(`day-${addDaysISO(saturday,-6)}`,addDaysISO(saturday,-6),'','','off'));
  return days;
}
async function inspect(label){
  const result=await evalJS(`(()=>({text:document.body.innerText,width:document.documentElement.scrollWidth,viewport:window.innerWidth,engine:[...document.querySelectorAll('[data-rest-engine]')].map(x=>x.getAttribute('data-rest-engine'))}))()`);
  assert.ok(result.width<=result.viewport+2,`${label}: horizontal overflow ${result.width}/${result.viewport}`);
  return result;
}

try{
  await waitHttp(base);
  await waitHttp(`http://${HOST}:${DEBUG}/json/version`);
  const pages=await (await fetch(`http://${HOST}:${DEBUG}/json/list`)).json();
  const page=pages.find(p=>p.type==='page' && p.url.startsWith(base)) || pages.find(p=>p.type==='page');
  assert.ok(page?.webSocketDebuggerUrl,'CDP page target not found');
  ws=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;});
  ws.onmessage=(e)=>{
    const m=JSON.parse(e.data);
    if(m.method==='Runtime.executionContextCreated'){
      const ctx=m.params?.context;
      if(ctx?.auxData?.isDefault) lastExecutionContextId=ctx.id;
      return;
    }
    if(m.id&&pending.has(m.id)){
      const p=pending.get(m.id);pending.delete(m.id);
      m.error?p.rej(new Error(m.error.message)):p.res(m.result);
    }
  };
  await cdp('Runtime.enable');
  await cdp('Page.enable');
  await cdp('DOMStorage.enable');
  await cdp('Emulation.setTimezoneOverride',{timezoneId:'Europe/London'});
  await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});

  const previousSaturday=addDaysISO(fixtureSaturdayISO,-7);
  const current=weekDays(fixtureSaturdayISO);
  const previous=weekDays(previousSaturday,true);
  console.log('Initial browser body:',(await bodyText()).slice(0,300));
  await setLocalStorageItems({
    driverPayV4_language:'en',
    driverPayV4_activeSaturday:fixtureSaturdayISO,
    driverPayV4_closedWeeks:'[]',
    days:JSON.stringify(current),driverApp_days:JSON.stringify(current),
    [`driverApp_week_${fixtureSaturdayISO}`]:JSON.stringify({days:current,settings:{},payslipActualWeek:''}),
    [`driverApp_week_${previousSaturday}`]:JSON.stringify({days:previous,settings:{},payslipActualWeek:''}),
    archive:JSON.stringify([{days:previous}]),
  });
  await reloadAndWait();
  await waitForBodyContains(expectedAppTitle);
  let state=await inspect('mobile main');
  assert.ok(state.text.includes('Rest from previous shift'),state.text);
  assert.ok(!state.text.includes('Compensation due ·'),state.text);
  await clickText('Week');
  state=await inspect('mobile Week Preview');
  assert.ok(state.text.includes('Week Preview'),state.text);
  assert.ok(state.text.includes('End Week'),state.text);
  await clickText('Close');

  await clickContains('Week ending Saturday');
  state=await inspect('mobile week picker');
  assert.ok(state.text.includes('Week ending Saturday'),state.text);
  await clickContains(String(Number(previousSaturday.slice(-2))));
  state=await inspect('historical week');
  assert.ok(state.text.includes('Go to current week'),state.text);
  const liveAfterArchive=await evalJS(`localStorage.getItem('driverApp_days')`);
  assert.equal(liveAfterArchive,JSON.stringify(current),'archive navigation changed live factual rows');
  await clickText('Go to current week');
  state=await inspect('returned current week');
  assert.ok(!state.text.includes('Go to current week'),state.text);

  await cdp('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
  state=await inspect('desktop main');
  assert.ok(state.text.includes('Driver Pay'),state.text);
  await clickText('Week');
  state=await inspect('desktop Week Preview');
  assert.ok(state.text.includes('Week Preview'),state.text);
  await clickText('End Week');
  state=await inspect('End Week confirmation');
  assert.ok(state.text.includes('Close empty week'),state.text);

  await cdp('DOMStorage.setDOMStorageItem',{storageId:{securityOrigin:base,isLocalStorage:true},key:'driverPayV4_language',value:'bg'});
  await reloadAndWait();
  state=await inspect('Bulgarian main');
  assert.ok(state.text.includes('Седмица')||state.text.includes('Почивка'),state.text);
  console.log(`Phase 8 REAL APP mobile/desktop EN/BG browser QA: PASS (${browserPath})`);
} finally {
  try{ws?.close()}catch{}
  kill(chrome);
  kill(vite);
  try{fs.rmSync(profile,{recursive:true,force:true})}catch{}
}
