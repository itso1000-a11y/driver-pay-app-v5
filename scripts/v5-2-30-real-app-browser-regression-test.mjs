import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HOST='127.0.0.1', PORT=41739, DEBUG=9339;
const base=`http://${HOST}:${PORT}`;
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));

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

const browserPath=resolveBrowser();
const vite=spawnChecked(process.execPath,
  ['node_modules/vite/bin/vite.js','--host',HOST,'--port',String(PORT)],
  {stdio:'ignore'}
);
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'dpa-chrome-'));
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

async function setupStorage(start){
  const mk=(id,dayName,dateISO,startValue='',finish='',dayType='work')=>({
    id,dayName,dateLabel:dateISO,dateISO,start:startValue,finish,startKm:'',finishKm:'',
    holidayPay:'',dayType,splitBreak:false,nightOut:false,bonuses:[]
  });

  const older=[mk('fri','Friday','2026-07-31','06:00','09:00')];
  const prev=[
    mk('mon','Monday','2026-08-03','06:00','18:00'),
    mk('tue','Tuesday','2026-08-04','06:00','18:00'),
    mk('wed','Wednesday','2026-08-05','06:00','18:00'),
    mk('thu','Thursday','2026-08-06','06:00','18:00'),
    mk('fri','Friday','2026-08-07','06:00','18:00'),
    mk('sat','Saturday','2026-08-08','07:00','22:00'),
    mk('sun','Sunday','2026-08-02','','','off')
  ];
  const cur=[
    mk('mon','Monday','2026-08-10','',''),
    mk('tue','Tuesday','2026-08-11','',''),
    mk('wed','Wednesday','2026-08-12','',''),
    mk('thu','Thursday','2026-08-13','',''),
    mk('fri','Friday','2026-08-14','',''),
    mk('sat','Saturday','2026-08-15','',''),
    mk('sun','Sunday','2026-08-09',start,'','work')
  ];

  const items={
    driverPayV4_language:'en',
    archive:JSON.stringify([{days:older},{days:prev}]),
    driverPayV4_activeSaturday:'2026-08-15',
    driverPayV4_closedWeeks:'[]',
    'driverApp_week_2026-08-15':JSON.stringify({days:cur,settings:{},payslipActualWeek:''})
  };

  await setLocalStorageItems(items);
  await reloadAndWait();
  await waitForBodyContains('Driver Pay');
}

try{
  await waitHttp(base);
  await waitHttp(`http://${HOST}:${DEBUG}/json/version`);

  const pages=await (await fetch(`http://${HOST}:${DEBUG}/json/list`)).json();
  const page=pages.find(p=>p.type==='page' && p.url.startsWith(base)) || pages.find(p=>p.type==='page');
  assert.ok(page?.webSocketDebuggerUrl,'CDP page target not found');

  ws=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res,rej)=>{ws.onopen=res; ws.onerror=rej;});
  ws.onmessage=(e)=>{
    const m=JSON.parse(e.data);
    if(m.method==='Runtime.executionContextCreated'){
      const ctx=m.params?.context;
      if(ctx?.auxData?.isDefault) lastExecutionContextId=ctx.id;
      return;
    }
    if(m.id && pending.has(m.id)){
      const p=pending.get(m.id); pending.delete(m.id);
      m.error ? p.rej(new Error(m.error.message)) : p.res(m.result);
    }
  };

  await cdp('Runtime.enable');
  await cdp('Page.enable');
  await cdp('DOMStorage.enable');
  await cdp('Emulation.setTimezoneOverride',{timezoneId:'UTC'});
  await cdp('Emulation.setDeviceMetricsOverride',{
    width:390,height:844,deviceScaleFactor:1,mobile:true
  });

  // Mandatory weekly-rest ownership on the REAL App.
  for(const [start,must,forbid] of [
    ['13:00',
      ['Weekly rest not completed','15h 00m','Weekly rest required'],
      ['Daily rest','Reduced rest • Left']],
    ['19:00',
      ['Weekly rest not completed','21h 00m','Weekly rest required'],
      ['Daily rest','Reduced rest • Left']],
    ['22:00',
      ['Reduced weekly rest','24h 00m','Compensation due','21h 00m'],
      ['Daily rest']],
  ]){
    await setupStorage(start);
    const txt=await bodyText();
    for(const x of must) assert.ok(txt.includes(x),`${start} missing ${x}\n${txt}`);
    for(const x of forbid) assert.ok(!txt.includes(x),`${start} forbidden ${x}\n${txt}`);
  }

  // Reset fixture for the real Saturday Save & Next / End Week flow.
  await setupStorage('');
  {
    const satFixture={
      days:[
        {id:'mon',dayName:'Monday',dateLabel:'2026-08-10',dateISO:'2026-08-10',start:'',finish:'',startKm:'',finishKm:'',holidayPay:'',dayType:'work',splitBreak:false,nightOut:false,bonuses:[]},
        {id:'tue',dayName:'Tuesday',dateLabel:'2026-08-11',dateISO:'2026-08-11',start:'',finish:'',startKm:'',finishKm:'',holidayPay:'',dayType:'work',splitBreak:false,nightOut:false,bonuses:[]},
        {id:'wed',dayName:'Wednesday',dateLabel:'2026-08-12',dateISO:'2026-08-12',start:'',finish:'',startKm:'',finishKm:'',holidayPay:'',dayType:'work',splitBreak:false,nightOut:false,bonuses:[]},
        {id:'thu',dayName:'Thursday',dateLabel:'2026-08-13',dateISO:'2026-08-13',start:'',finish:'',startKm:'',finishKm:'',holidayPay:'',dayType:'work',splitBreak:false,nightOut:false,bonuses:[]},
        {id:'fri',dayName:'Friday',dateLabel:'2026-08-14',dateISO:'2026-08-14',start:'',finish:'',startKm:'',finishKm:'',holidayPay:'',dayType:'work',splitBreak:false,nightOut:false,bonuses:[]},
        {id:'sat',dayName:'Saturday',dateLabel:'2026-08-15',dateISO:'2026-08-15',start:'07:00',finish:'20:00',startKm:'',finishKm:'',holidayPay:'',dayType:'work',splitBreak:false,nightOut:false,bonuses:[]},
        {id:'sun',dayName:'Sunday',dateLabel:'2026-08-09',dateISO:'2026-08-09',start:'',finish:'',startKm:'',finishKm:'',holidayPay:'',dayType:'off',splitBreak:false,nightOut:false,bonuses:[]}
      ],
      settings:{},
      payslipActualWeek:''
    };
    await cdp('DOMStorage.setDOMStorageItem',{
      storageId:{securityOrigin:base,isLocalStorage:true},
      key:'driverApp_week_2026-08-15',
      value:JSON.stringify(satFixture)
    });
  }
  await reloadAndWait();

  await clickText('Week');
  await clickText('Detailed view');
  await clickContains('Saturday · 2026-08-15');
  await clickText('Save & Next');

  let txt=await bodyText();
  assert.ok(txt.includes('Week Preview'),txt);
  assert.ok(txt.includes('End Week'),txt);
  assert.ok(!txt.includes('Working tomorrow?'),txt);

  await clickText('End Week');
  txt=await waitForBodyContains('End Week Preview');
  assert.ok(txt.includes('End Week Preview'));

  await clickText('Confirm & Close Week');
  txt=await waitForBodyContains('Working tomorrow?');
  assert.ok(txt.includes('Working tomorrow?'),txt);

  console.log(`v5.2.30 REAL APP browser regression: PASS (${browserPath})`);
} finally {
  try{ws?.close()}catch{}
  kill(chrome);
  kill(vite);
  try{fs.rmSync(profile,{recursive:true,force:true})}catch{}
}
