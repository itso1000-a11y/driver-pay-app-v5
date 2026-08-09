import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const DAY_ORDER = ['mon','tue','wed','thu','fri','sat','sun'];
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

function normalizeTime(value='') {
  const d = String(value).replace(/\D/g,'').slice(0,4);
  if (!d) return '';
  if (d.length === 1) return `0${d}:00`;
  if (d.length === 2) return `${String(Math.min(23, Number(d))).padStart(2,'0')}:00`;
  if (d.length === 3) return `0${d[0]}:${String(Math.min(59, Number(d.slice(1)))).padStart(2,'0')}`;
  return `${String(Math.min(23, Number(d.slice(0,2)))).padStart(2,'0')}:${String(Math.min(59, Number(d.slice(2,4)))).padStart(2,'0')}`;
}
function parseTimeToMinutes(value='') {
  const n = normalizeTime(value); if (!n) return null;
  const [h,m] = n.split(':').map(Number); return h*60+m;
}
function dayStartAbs(day) { const d=new Date(`${day.dateISO}T00:00:00`); return Math.floor(d.getTime()/60000); }
function dayTimeAbs(day,time) { const m=parseTimeToMinutes(time); return m==null?null:dayStartAbs(day)+m; }
function entered(day) {
  const hasRealKmRun = Boolean(day.startKm && day.finishKm && day.finishKm !== day.startKm);
  return Boolean(day.start || day.finish || hasRealKmRun || day.holidayPay || (day.bonuses||[]).length || day.nightOut || day.splitBreak);
}
function chronologicalIndices(days) {
  return days.map((day,index)=>({day,index})).filter(x=>x.day?.dateISO).sort((a,b)=>a.day.dateISO.localeCompare(b.day.dateISO) || DAY_ORDER.indexOf(a.day.id)-DAY_ORDER.indexOf(b.day.id)).map(x=>x.index);
}
function detect(days) {
  const out=[]; let previousFinishAbs=null, previousWorkDateISO=null;
  for (const index of chronologicalIndices(days)) {
    const day=days[index]; if (!day || day.dayType!=='work') continue;
    const start=normalizeTime(day.start||''), finish=normalizeTime(day.finish||'');
    const startAbs=start?dayTimeAbs(day,start):null, finishAbs=finish?dayTimeAbs(day,finish):null;
    if (previousFinishAbs!=null && previousWorkDateISO && startAbs!=null && startAbs>previousFinishAbs) {
      const restMinutes=startAbs-previousFinishAbs;
      if (restMinutes>=24*60) out.push({startAbs:previousFinishAbs,endAbs:startAbs,minutes:restMinutes,reduced:restMinutes<45*60,previousWorkDateISO,nextWorkDateISO:day.dateISO});
    }
    if (finishAbs!=null) { previousFinishAbs=finishAbs; previousWorkDateISO=day.dateISO; continue; }
    if (entered(day)) { previousFinishAbs=null; previousWorkDateISO=null; }
  }
  return out;
}
function buildTimeline(currentDays, archive) {
  const byDate=new Map();
  for (const entry of archive||[]) for (const d of entry?.days||[]) if (d?.dateISO) byDate.set(d.dateISO,d);
  for (const d of currentDays||[]) if (d?.dateISO) byDate.set(d.dateISO,d);
  return [...byDate.values()].sort((a,b)=>a.dateISO.localeCompare(b.dateISO));
}
function cycleSnapshot(currentDays, archive) {
  const timeline=buildTimeline(currentDays,archive); const recognized=detect(timeline); const anchor=recognized.at(-1)||null;
  if (!anchor) return {known:false,anchorRest:null,completedWorkCycles:0,lastCompletedFinishAbs:null};
  let completed=0,last=null;
  for (const day of timeline) {
    if (!day || day.dayType!=='work') continue;
    const ds=dayStartAbs(day); if (ds+24*60<=anchor.endAbs) continue;
    const st=normalizeTime(day.start||''), ft=normalizeTime(day.finish||'');
    const sa=st?dayTimeAbs(day,st):null, fa=ft?dayTimeAbs(day,ft):null;
    if (entered(day) && (sa==null || fa==null || fa<=sa)) return {known:false,anchorRest:anchor,completedWorkCycles:0,lastCompletedFinishAbs:null};
    if (sa==null || fa==null) continue;
    if (sa<anchor.endAbs || fa<=sa) continue;
    completed++; if (last==null || fa>last) last=fa;
  }
  return {known:true,anchorRest:anchor,completedWorkCycles:completed,lastCompletedFinishAbs:last};
}
function cycleSnapshotBeforeDate(currentDays, archive, cutoffDateISO) {
  const priorCurrent=(currentDays||[]).filter(day=>day?.dateISO && day.dateISO<cutoffDateISO);
  const priorArchive=(archive||[]).map(entry=>({...entry,days:(entry?.days||[]).filter(day=>day?.dateISO && day.dateISO<cutoffDateISO)}));
  return cycleSnapshot(priorCurrent,priorArchive);
}

const d=(dateISO,id,start='',finish='',dayType='work')=>({dateISO,id,start,finish,dayType,startKm:'',finishKm:'',holidayPay:'',bonuses:[],nightOut:false,splitBreak:false});

// Scenario 1/2: cross-week processing must include later repeated weekday IDs.
const archive=[{days:[d('2026-07-20','mon','05:00','15:00'),d('2026-07-21','tue','05:00','15:00'),d('2026-07-22','wed','05:00','15:00'),d('2026-07-23','thu','05:00','15:00'),d('2026-07-24','fri','05:00','15:00')]},{days:[d('2026-07-27','mon','12:00','18:00'),d('2026-07-28','tue','05:00','15:00'),d('2026-07-29','wed','05:00','15:00')]}];
const current=[d('2026-07-30','thu','05:00','15:00'),d('2026-07-31','fri','05:00','15:00'),d('2026-08-01','sat','05:00','15:00')];
const rests=detect(buildTimeline(current,archive));
assert.ok(rests.some(r=>r.nextWorkDateISO==='2026-07-27'), 'later-week weekly rest must be detected');

// Scenario 3: regular mid-week rest resets cycle; five cycles remain five, not older-week total.
const s3Archive=[{days:[d('2026-06-15','mon','05:00','15:20'),d('2026-06-16','tue','','','off'),d('2026-06-17','wed','','','off'),d('2026-06-18','thu','06:30','17:55')]}];
const s3Current=[d('2026-06-19','fri','05:05','17:05'),d('2026-06-20','sat','06:00','14:00'),d('2026-06-21','sun','06:00','14:00'),d('2026-06-22','mon','06:00','14:00')];
const s3=cycleSnapshot(s3Current,s3Archive);
assert.equal(s3.known,true); assert.equal(s3.anchorRest.reduced,false); assert.equal(s3.completedWorkCycles,5);

// Scenario 4: reduced 24h-<45h rest is recognised and resets cycle.
const s4Archive=[{days:[d('2026-07-01','wed','05:00','15:00'),d('2026-07-02','thu','21:00','23:00')]}];
const s4=cycleSnapshot([d('2026-07-03','fri','08:00','16:00')],s4Archive);
assert.equal(s4.known,true); assert.equal(s4.anchorRest.reduced,true); assert.equal(s4.completedWorkCycles,2);

// Scenario 5: touched incomplete Work day makes timeline state unknown; later shifts cannot revive it.
const s5Archive=[{days:[d('2026-07-01','wed','05:00','15:00'),d('2026-07-03','fri','16:00','20:00')]}];
const s5Current=[d('2026-07-04','sat','08:00','16:00'),d('2026-07-05','sun','08:00',''),d('2026-07-06','mon','08:00','16:00'),d('2026-07-07','tue','08:00','16:00'),d('2026-07-08','wed','08:00','16:00'),d('2026-07-09','thu','08:00','16:00'),d('2026-07-10','fri','08:00','16:00'),d('2026-07-11','sat','08:00','16:00')];
const s5=cycleSnapshot(s5Current,s5Archive); assert.equal(s5.known,false);

// Scenario 6: exactly six completed cycles can be identified after latest recognised rest.
const s6Archive=[{days:[d('2026-07-01','wed','05:00','15:00'),d('2026-07-03','fri','16:00','20:00')]}];
const s6Current=['04','05','06','07','08'].map((dd,i)=>d(`2026-07-${dd}`,DAY_ORDER[i],'08:00','16:00'));
const s6=cycleSnapshot(s6Current,s6Archive); assert.equal(s6.known,true); assert.equal(s6.completedWorkCycles,6);

// Scenarios 7-9 regression guards against silent/duplicate End Week behaviour.
const appSource=fs.readFileSync(path.join(ROOT,'src','App.tsx'),'utf8');
assert.match(appSource,/Week already saved\. No changes\./);
assert.match(appSource,/Changes saved\. Week updated\./);
assert.match(appSource,/Week completed\./);
assert.match(appSource,/if \(existingIndex < 0\) return \[updatedItem, \.\.\.prev\];/);
assert.match(appSource,/prev\.some\(\(item\) => getSaturdayDay\(item\.days \|\| \[\]\)\.dateISO === closingSaturday\) \? prev :/);
// Scenario 11: timeline ownership must survive the actual Start transition.
// Build a factual weekly-rest anchor followed by exactly six completed work cycles.
// The selected seventh Work day is excluded from the ownership snapshot, so adding
// Start to that day must not make the prior weekly-rest decision unknown.
const s11Archive=[{days:[d('2026-07-01','wed','05:00','15:00'),d('2026-07-03','fri','16:00','20:00')]}];
const s11Completed=[
  d('2026-07-04','sat','08:00','16:00'),
  d('2026-07-05','sun','08:00','16:00'),
  d('2026-07-06','mon','08:00','16:00'),
  d('2026-07-07','tue','08:00','16:00'),
  d('2026-07-08','wed','08:00','16:00'),
];
const s11Before=[...s11Completed,d('2026-07-09','thu','','')];
const s11After=[...s11Completed,d('2026-07-09','thu','13:00','')];
const beforeOwnership=cycleSnapshotBeforeDate(s11Before,s11Archive,'2026-07-09');
const afterOwnership=cycleSnapshotBeforeDate(s11After,s11Archive,'2026-07-09');
assert.equal(beforeOwnership.known,true);
assert.equal(beforeOwnership.completedWorkCycles,6);
assert.equal(afterOwnership.known,true);
assert.equal(afterOwnership.completedWorkCycles,6);
assert.equal(afterOwnership.lastCompletedFinishAbs,beforeOwnership.lastCompletedFinishAbs);
assert.equal(afterOwnership.anchorRest.endAbs,beforeOwnership.anchorRest.endAbs);

// The source must use the pre-day snapshot for timeline ownership and still isolate
// the legacy compensation path whenever timeline ownership is active.
assert.match(appSource,/getWeeklyRestCycleSnapshotBeforeDate\(days, Array\.isArray\(archive\) \? archive : \[\], currentDay\.dateISO\)/);
assert.match(appSource,/const timelineWeeklyRestPathEligible = Boolean\(/);
assert.match(appSource,/const legacyWeeklyRestBaseActive = Boolean\(\s*!timelineWeeklyRestPathEligible/);
assert.match(appSource,/if \(timelineWeeklyRestPathEligible\) return;\s*let ledger = readWeeklyCompensationLedger\(\);/);

console.log('Weekly-rest timeline regression: PASS');

// Scenario 12: End Week may close the pay period without forcing weekly rest
// when the factual timeline is known and weekly rest is not yet due.
// The UI must ask the user instead of guessing. "Yes" opens the immediate
// next calendar day (Sunday in the current Sat-ending pay-period model) as Work;
// "No" preserves the legacy weekly-rest flow.
// v5.2.27: the End Week intent question is independent of the six-cycle warning gate.
assert.match(appSource,/askWorkingTomorrow=\{!weekIsClosed && !archiveMode\}/);
assert.doesNotMatch(appSource,/askWorkingTomorrow=\{!weekIsClosed && !archiveMode && weeklyRestDueByTimeline === false\}/);
assert.match(appSource,/workingTomorrow: "Working tomorrow\?"/);
assert.match(appSource,/workingTomorrowYes: "Yes, work tomorrow"/);
assert.match(appSource,/workingTomorrowNo: "No, start weekly rest"/);
assert.match(appSource,/p\.askWorkingTomorrow \? setShowWorkingTomorrowPrompt\(true\) : closeAndExit\("worked"\)/);
assert.match(appSource,/closeAndExit\("worked", undefined, "workTomorrow"\)/);
assert.match(appSource,/closeAndExit\("worked", undefined, "legacy"\)/);
assert.match(appSource,/const targetIndex = nextDayIntent === "workTomorrow" && sundayIndex >= 0 \? sundayIndex : mondayIndex;/);
assert.match(appSource,/nextDayIntent === "workTomorrow" && isEmptyForRemainingClose\(d\) \? \{ \.\.\.d, dayType: "work" as DayType \} : d/);

// Scenario 13: a factual reduced mid-week weekly rest creates exactly one
// outstanding compensation obligation. Regular weekly rest creates none.
function addDaysLocal(date, amount) { const out=new Date(date.getFullYear(),date.getMonth(),date.getDate()); out.setDate(out.getDate()+amount); return out; }
function isoLocal(date) { const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),dd=String(date.getDate()).padStart(2,'0'); return `${y}-${m}-${dd}`; }
function isoWeekInfo(date) {
  const local=new Date(date.getFullYear(),date.getMonth(),date.getDate());
  const weekday=local.getDay()||7; const monday=addDaysLocal(local,1-weekday); const sunday=addDaysLocal(monday,6);
  const thursday=addDaysLocal(monday,3); const firstThursday=new Date(thursday.getFullYear(),0,4); const firstWeekday=firstThursday.getDay()||7;
  const firstWeekMonday=addDaysLocal(firstThursday,1-firstWeekday); const week=Math.floor((monday.getTime()-firstWeekMonday.getTime())/(7*86400000))+1;
  return {week,sunday};
}
function payrollSaturday(dateISO) { const date=new Date(`${dateISO}T00:00:00`); return isoLocal(addDaysLocal(date,(6-date.getDay()+7)%7)); }
function timelineObligation(rest) {
  if (!rest?.reduced || rest.minutes<24*60 || rest.minutes>=45*60) return null;
  const compensationMinutes=Math.max(0,45*60-rest.minutes); if (compensationMinutes<=0) return null;
  const fixed=isoWeekInfo(new Date(rest.startAbs*60000)); const deadlineISO=isoLocal(addDaysLocal(fixed.sunday,21));
  const sourceKey=`timeline:${rest.startAbs}:${rest.endAbs}`;
  return {id:sourceKey,sourceKey,sourceClosingSaturdayISO:payrollSaturday(rest.previousWorkDateISO),sourceStartAbs:rest.endAbs,originalMinutes:compensationMinutes,remainingMinutes:compensationMinutes,deadlineISO,status:'outstanding',completedByStartAbs:null,completedRestMinutes:null};
}
function addObligation(ledger, obligation) {
  if (!obligation) return ledger;
  if (ledger.some(item=>item.sourceKey===obligation.sourceKey || (item.sourceStartAbs===obligation.sourceStartAbs && item.originalMinutes===obligation.originalMinutes))) return ledger;
  return [...ledger,obligation];
}
const reducedFact={startAbs:dayTimeAbs(d('2026-08-04','tue','',''),'15:00'),endAbs:dayTimeAbs(d('2026-08-06','thu','',''),'02:00'),minutes:35*60,reduced:true,previousWorkDateISO:'2026-08-04',nextWorkDateISO:'2026-08-06'};
const reducedDebt=timelineObligation(reducedFact);
assert.ok(reducedDebt);
assert.equal(reducedDebt.originalMinutes,10*60);
assert.equal(reducedDebt.remainingMinutes,10*60);
assert.equal(reducedDebt.status,'outstanding');
assert.equal(reducedDebt.sourceStartAbs,reducedFact.endAbs);
assert.equal(reducedDebt.sourceClosingSaturdayISO,'2026-08-08');
assert.equal(reducedDebt.deadlineISO,'2026-08-30');
let debtLedger=addObligation([],reducedDebt);
debtLedger=addObligation(debtLedger,reducedDebt);
assert.equal(debtLedger.length,1,'same factual reduced rest must not duplicate debt');
const regularFact={...reducedFact,endAbs:reducedFact.startAbs+45*60,minutes:45*60,reduced:false,nextWorkDateISO:'2026-08-06'};
assert.equal(timelineObligation(regularFact),null,'regular weekly rest must not create compensation debt');
const secondReduced={...reducedFact,startAbs:reducedFact.startAbs+7*24*60,endAbs:reducedFact.endAbs+7*24*60,previousWorkDateISO:'2026-08-11',nextWorkDateISO:'2026-08-13'};
debtLedger=addObligation(debtLedger,timelineObligation(secondReduced));
assert.equal(debtLedger.length,2,'separate reduced weekly rests must remain separate obligations');

// Source guards for the v5.2.17 narrow integration: factual timeline rest -> create debt only.
assert.match(appSource,/getRecognizedWeeklyRestEndingAtStart\(days, Array\.isArray\(archive\) \? archive : \[\], enteredStartAbs\)/);
assert.match(appSource,/buildTimelineWeeklyCompensationObligation\(timelineCompletedWeeklyRest\)/);
assert.match(appSource,/if \(archiveMode \|\| typeof window === "undefined" \|\| !timelineCompensationObligation\) return;/);
assert.match(appSource,/writeWeeklyCompensationLedger\(\[\.\.\.ledger, timelineCompensationObligation\]\)/);
assert.match(appSource,/hasEquivalentWeeklyCompensationObligation\(ledger, timelineCompensationObligation\)/);
