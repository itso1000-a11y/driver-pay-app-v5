import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const appSource = fs.readFileSync(path.join(ROOT, 'src', 'App.tsx'), 'utf8');

function blankDay(id, dayName, dateISO, dayType = dayName === 'Sunday' ? 'off' : 'work') {
  return { id, dayName, dateISO, dateLabel: dateISO, start:'', finish:'', startKm:'', finishKm:'', holidayPay:'', dayType, splitBreak:false, nightOut:false, bonuses:[] };
}
function nextWeekFixture() {
  return [
    blankDay('mon','Monday','2026-08-10'),
    blankDay('tue','Tuesday','2026-08-11'),
    blankDay('wed','Wednesday','2026-08-12'),
    blankDay('thu','Thursday','2026-08-13'),
    blankDay('fri','Friday','2026-08-14'),
    blankDay('sat','Saturday','2026-08-15'),
    blankDay('sun','Sunday','2026-08-09'),
  ];
}
function isEmptyForRemainingClose(d) {
  return !d.start && !d.finish && !d.holidayPay && !(d.bonuses||[]).length && !d.nightOut && !d.splitBreak;
}
function applyNextDayIntent(nextDays, carryKm, intent) {
  const mondayIndex = nextDays.findIndex(d=>d.id==='mon');
  const sundayIndex = nextDays.findIndex(d=>d.id==='sun');
  const targetIndex = intent === 'workTomorrow' && sundayIndex >= 0 ? sundayIndex : mondayIndex;
  const days = nextDays.map((d,index)=>{
    if (index !== targetIndex) return d;
    const withIntent = intent === 'workTomorrow' && isEmptyForRemainingClose(d) ? {...d, dayType:'work'} : d;
    return carryKm && !withIntent.startKm ? {...withIntent,startKm:carryKm} : withIntent;
  });
  return {days,targetIndex};
}

// YES: immediate next calendar day (Sunday in current Sat-ending model) becomes Work.
{
  const {days,targetIndex}=applyNextDayIntent(nextWeekFixture(),'329141','workTomorrow');
  assert.equal(days[targetIndex].id,'sun');
  assert.equal(days[targetIndex].dayType,'work');
  assert.equal(days[targetIndex].startKm,'329141');
  assert.equal(days.find(d=>d.id==='mon').startKm,'');
}

// NO / legacy: current behaviour remains Monday target, Sunday remains Off.
{
  const {days,targetIndex}=applyNextDayIntent(nextWeekFixture(),'329141','legacy');
  assert.equal(days[targetIndex].id,'mon');
  assert.equal(days[targetIndex].startKm,'329141');
  assert.equal(days.find(d=>d.id==='sun').dayType,'off');
}

// Existing/non-empty Sunday must not be reclassified by the intent helper.
{
  const fixture=nextWeekFixture();
  const sun=fixture.find(d=>d.id==='sun');
  sun.start='07:00'; sun.finish='12:00'; sun.dayType='off';
  const {days,targetIndex}=applyNextDayIntent(fixture,'329141','workTomorrow');
  assert.equal(days[targetIndex].id,'sun');
  assert.equal(days[targetIndex].dayType,'off');
  assert.equal(days[targetIndex].start,'07:00');
}

// Source-level ownership/UX guards: prompt only for known-not-due timeline,
// explicit Yes/No branches, no new compensation integration here.
assert.match(appSource,/askWorkingTomorrow=\{!archiveMode && weeklyRestDueByTimeline === false\}/);
assert.match(appSource,/workingTomorrow: "Working tomorrow\?"/);
assert.match(appSource,/workingTomorrowYes: "Yes, work tomorrow"/);
assert.match(appSource,/workingTomorrowNo: "No, start weekly rest"/);
assert.match(appSource,/closeAndExit\("worked", undefined, "workTomorrow"\)/);
assert.match(appSource,/closeAndExit\("worked", undefined, "legacy"\)/);
assert.match(appSource,/function openNextPayPeriod\([^)]*nextDayIntent: "legacy" \| "workTomorrow" = "legacy"/s);
assert.match(appSource,/const targetIndex = nextDayIntent === "workTomorrow" && sundayIndex >= 0 \? sundayIndex : mondayIndex;/);

console.log('End Week next-day intent regression: PASS');
