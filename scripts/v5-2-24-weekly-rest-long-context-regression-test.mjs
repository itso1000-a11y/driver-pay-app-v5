import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const APP_PATH = path.join(ROOT, 'src', 'App.tsx');
const appSource = fs.readFileSync(APP_PATH, 'utf8');

// Structural guards remain useful, but v5.2.24 MUST ALSO execute the real
// weekly-rest helper functions from App.tsx against concrete day/state scenarios.
assert.match(appSource, /function seedWeeklyRestCandidateFromClosedPayPeriod[\s\S]*getLastCompletedWorkShiftInWeek\(finalDays\)[\s\S]*writeWeeklyRestCandidate/);
assert.match(appSource, /const weeklyRestDueByTimeline = weeklyRestCycleSnapshot\.known[\s\S]*completedWorkCycles >= 6/);
assert.match(appSource, /const weeklyValidationTargets = timelineWeeklyRestPathEligible[\s\S]*: null;/);
assert.match(appSource, /currentDay\.dayType === "off" && weeklyRestDisplayPlan && <WeeklyRestInlineCard/);
assert.match(appSource, /const endWeekWeeklyRestBaseActive = Boolean\(legacyWeeklyRestBaseActive && !currentDay\.start\);/);
assert.match(appSource, /const weeklyRestForceReduced = false;/);

assert.doesNotMatch(appSource, /anchor\.finishAbs \+ 72 \* 60/, 'Arbitrary 72h weekly-rest display cutoff must not return');
assert.match(appSource, /function hasFactualWorkStartAfterAbsBeforeDate[\s\S]*startAbs > anchorFinishAbs/);
assert.match(appSource, /weeklyRestCandidateConsumedBeforeCurrent[\s\S]*hasFactualWorkStartAfterAbsBeforeDate/);

// Build an instrumented in-memory copy of the actual App.tsx. The application
// source on disk is NOT modified. This allows the regression to execute the same
// helper functions used by the UI instead of reimplementing them in the test.
const exportNames = [
  'buildPayrollWeek',
  'getLastCompletedWorkShiftInWeek',
  'writeWeeklyRestCandidate',
  'getWeeklyRestCandidateForSelectedWeek',
  'getWeeklyRestTargets',
  'getWeeklyRestPlan',
  'getEffectiveRestStatus',
  'detectQualifyingWeeklyRests',
  'getWeeklyRestCycleSnapshot',
  'getWeeklyRestCycleSnapshotBeforeDate',
  'getDayTimeAbsMinutes',
  'hasFactualWorkStartAfterAbsBeforeDate',
];

const instrumented = `${appSource}\nexport { ${exportNames.join(', ')} };\n`;
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'driver-pay-v524-'));
const bundlePath = path.join(tempDir, 'app-instrumented.mjs');

await build({
  stdin: {
    contents: instrumented,
    sourcefile: APP_PATH,
    resolveDir: path.join(ROOT, 'src'),
    loader: 'tsx',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node18',
  outfile: bundlePath,
  logLevel: 'silent',
});

class MemoryStorage {
  #map = new Map();
  get length() { return this.#map.size; }
  key(index) { return Array.from(this.#map.keys())[index] ?? null; }
  getItem(key) { return this.#map.has(String(key)) ? this.#map.get(String(key)) : null; }
  setItem(key, value) { this.#map.set(String(key), String(value)); }
  removeItem(key) { this.#map.delete(String(key)); }
  clear() { this.#map.clear(); }
}

globalThis.localStorage = new MemoryStorage();
globalThis.window = globalThis.window || {};

const app = await import(`${pathToFileURL(bundlePath).href}?v=${Date.now()}`);

function dayByName(days, name) {
  const day = days.find((item) => item.dayName === name);
  assert.ok(day, `Missing ${name}`);
  return day;
}

function setWork(day, start, finish) {
  day.dayType = 'work';
  day.start = start;
  day.finish = finish;
}

function setOff(day) {
  day.dayType = 'off';
  day.start = '';
  day.finish = '';
}

function seedFromEndWeek(closingSaturdayISO, days) {
  const anchor = app.getLastCompletedWorkShiftInWeek(days);
  assert.ok(anchor, 'End Week must find a last factual Finish');
  app.writeWeeklyRestCandidate({ closingSaturdayISO, finishAbs: anchor.finishAbs });
  const candidate = app.getWeeklyRestCandidateForSelectedWeek(closingSaturdayISO);
  assert.ok(candidate, 'End Week candidate must be readable after seeding');
  assert.equal(candidate.finishAbs, anchor.finishAbs, 'Candidate must anchor to last factual Finish');
  return candidate;
}

// ================================================================
// SCENARIO 1 — NORMAL MON-FRI -> END WEEK -> SATURDAY REST
// ================================================================
localStorage.clear();
{
  const saturdayISO = '2030-08-10'; // Saturday
  const days = app.buildPayrollWeek(saturdayISO);
  setWork(dayByName(days, 'Monday'), '08:00', '17:00');
  setWork(dayByName(days, 'Tuesday'), '08:00', '17:00');
  setWork(dayByName(days, 'Wednesday'), '08:00', '17:00');
  setWork(dayByName(days, 'Thursday'), '08:00', '17:00');
  setWork(dayByName(days, 'Friday'), '08:00', '18:00');
  setOff(dayByName(days, 'Saturday'));

  const candidate = seedFromEndWeek(saturdayISO, days);
  const targets = app.getWeeklyRestTargets(candidate);
  assert.ok(targets);
  assert.equal(targets.reducedStart - candidate.finishAbs, 24 * 60);
  assert.equal(targets.fullStart - candidate.finishAbs, 45 * 60);

  const saturday = dayByName(days, 'Saturday');
  const offPlan = app.getWeeklyRestPlan(candidate, saturday, true, false, 5);
  assert.ok(offPlan, 'Saturday Off must display End Week weekly-rest proposal');
  assert.equal(offPlan.primaryAbs, targets.fullStart, '45h remains primary');
  assert.match(offPlan.helper, /24h option/i, '24h reduced option remains secondary');
  assert.doesNotMatch(`${offPlan.primaryHelp} ${offPlan.helper}`, /weekly rest required/i, 'Five cycles must not create mandatory warning');
  assert.equal(saturday.start, '', 'Proposal must not silently save Start');

  // The plan changes, so Saturday becomes Work before 24h. The weekly-rest
  // candidate remains informational; normal daily-rest validation decides legality.
  saturday.dayType = 'work';
  const workPlan = app.getWeeklyRestPlan(candidate, saturday, true, false, 5);
  assert.ok(workPlan, 'Off -> Work must keep the proposal available before Start');
  assert.equal(saturday.start, '', 'Off -> Work must not auto-save weekly Start');
  const dailyRestMinutes = 12 * 60; // Friday 18:00 -> Saturday 06:00
  const dailyStatus = app.getEffectiveRestStatus(dailyRestMinutes, 10 * 60, false, 0);
  assert.notEqual(dailyStatus, 'violation', 'A daily-legal Start before 24h must not become a false weekly-rest violation');
}

// ================================================================
// SCENARIO 2 — MID-WEEK 45H+ REST, THEN FRI/SAT WORK, END WEEK SAT
// ================================================================
localStorage.clear();
{
  const saturdayISO = '2030-08-10';
  const nextSaturdayISO = '2030-08-17';
  const days = app.buildPayrollWeek(saturdayISO);
  setWork(dayByName(days, 'Monday'), '08:00', '17:00');
  setWork(dayByName(days, 'Tuesday'), '08:00', '10:00');
  setOff(dayByName(days, 'Wednesday'));
  setOff(dayByName(days, 'Thursday'));
  setWork(dayByName(days, 'Friday'), '10:00', '18:00'); // 72h after Tuesday Finish
  setWork(dayByName(days, 'Saturday'), '08:00', '17:00');

  const recognized = app.detectQualifyingWeeklyRests(days);
  assert.ok(recognized.length >= 1, 'Tuesday -> Friday gap must be recognized as weekly rest');
  const midweekRest = recognized[recognized.length - 1];
  assert.ok(midweekRest.minutes >= 45 * 60, 'Mid-week rest must be regular 45h+');
  assert.equal(midweekRest.reduced, false);

  const candidate = seedFromEndWeek(saturdayISO, days);
  const saturday = dayByName(days, 'Saturday');
  assert.equal(candidate.finishAbs, app.getDayTimeAbsMinutes(saturday, '17:00'), 'New End Week candidate starts from Saturday Finish');

  const nextWeek = app.buildPayrollWeek(nextSaturdayISO);
  const sunday = dayByName(nextWeek, 'Sunday');
  setOff(sunday);
  const combined = [...days, ...nextWeek];
  const cycle = app.getWeeklyRestCycleSnapshotBeforeDate(combined, [], sunday.dateISO);
  assert.equal(cycle.known, true, 'Cycle chronology after factual mid-week rest must remain known');
  assert.ok(cycle.anchorRest, 'Earlier factual weekly rest remains legal cycle anchor');
  assert.equal(cycle.anchorRest.endAbs, midweekRest.endAbs, 'End Week must not replace the factual cycle anchor');
  assert.equal(cycle.completedWorkCycles, 2, 'Friday and Saturday are two completed cycles after the mid-week rest');

  const carriedCandidate = app.getWeeklyRestCandidateForSelectedWeek(nextSaturdayISO);
  assert.ok(carriedCandidate, 'Saturday End Week candidate must carry into Sunday/new pay week');
  assert.equal(carriedCandidate.finishAbs, candidate.finishAbs);
  const sundayPlan = app.getWeeklyRestPlan(carriedCandidate, sunday, true, false, cycle.completedWorkCycles);
  assert.ok(sundayPlan, 'Sunday must still show the new informational End Week proposal');
  assert.doesNotMatch(`${sundayPlan.primaryHelp} ${sundayPlan.helper}`, /weekly rest required/i, 'Two cycles must not create mandatory warning');

  sunday.dayType = 'work';
  assert.equal(sunday.start, '', 'Sunday Off -> Work must not auto-save Start');
  const dailyStatus = app.getEffectiveRestStatus(15 * 60, 9 * 60, false, 0);
  assert.notEqual(dailyStatus, 'violation', 'Daily-legal Sunday Start is decided by daily rest, not voluntary weekly candidate');
}

// ================================================================
// SCENARIO 3 — REST ALREADY ACCRUED BEFORE END WEEK
// ================================================================
localStorage.clear();
{
  const saturdayISO = '2030-08-10';
  const nextSaturdayISO = '2030-08-17';
  const days = app.buildPayrollWeek(saturdayISO);
  setWork(dayByName(days, 'Monday'), '08:00', '17:00');
  setWork(dayByName(days, 'Tuesday'), '08:00', '17:00');
  setWork(dayByName(days, 'Wednesday'), '08:00', '12:00');
  setOff(dayByName(days, 'Thursday'));
  setOff(dayByName(days, 'Friday'));
  setOff(dayByName(days, 'Saturday'));

  const candidate = seedFromEndWeek(saturdayISO, days);
  const wednesday = dayByName(days, 'Wednesday');
  assert.equal(candidate.finishAbs, app.getDayTimeAbsMinutes(wednesday, '12:00'), 'End Week must retain accrued rest from Wednesday Finish');
  const targets = app.getWeeklyRestTargets(candidate);
  assert.ok(targets);

  const nextWeek = app.buildPayrollWeek(nextSaturdayISO);
  const sunday = dayByName(nextWeek, 'Sunday');
  setOff(sunday);
  const sundayPlan = app.getWeeklyRestPlan(candidate, sunday, true, false, 0);
  assert.ok(sundayPlan, 'Sunday must retain weekly-rest context');
  assert.equal(sundayPlan.primaryAbs, targets.fullStart, '45h endpoint remains calculated from Wednesday Finish, not End Week press');
  assert.match(sundayPlan.primaryHelp, /weekly rest ended/i, 'Passed 45h endpoint must report Weekly rest ended');

  sunday.dayType = 'work';
  sunday.start = '06:00';
  sunday.finish = '14:00';
  const timeline = app.detectQualifyingWeeklyRests([...days, ...nextWeek]);
  const factual = timeline[timeline.length - 1];
  assert.ok(factual, 'Sunday Start must prove the completed rest fact');
  assert.ok(factual.minutes >= 45 * 60, 'Accrued Wednesday -> Sunday rest must satisfy regular weekly rest');
  assert.equal(factual.reduced, false);
  assert.equal(factual.startAbs, candidate.finishAbs, 'Factual weekly rest must begin at the original Wednesday Finish');
}


// ================================================================
// SCENARIO 4 — LONG CANDIDATE PERSISTS UNTIL REAL START, THEN IS CONSUMED
// ================================================================
localStorage.clear();
{
  const saturdayISO = '2030-08-10';
  const nextSaturdayISO = '2030-08-17';
  const days = app.buildPayrollWeek(saturdayISO);
  setWork(dayByName(days, 'Wednesday'), '08:00', '12:00');
  setOff(dayByName(days, 'Thursday'));
  setOff(dayByName(days, 'Friday'));
  setOff(dayByName(days, 'Saturday'));
  const candidate = seedFromEndWeek(saturdayISO, days);

  const nextWeek = app.buildPayrollWeek(nextSaturdayISO);
  const sunday = dayByName(nextWeek, 'Sunday');
  setOff(sunday);
  const beforeStart = app.hasFactualWorkStartAfterAbsBeforeDate([...days, ...nextWeek], [], candidate.finishAbs, sunday.dateISO);
  assert.equal(beforeStart, false, 'No factual later Start exists before Sunday, so the candidate must remain live');
  const plan = app.getWeeklyRestPlan(candidate, sunday, true, false, 0);
  assert.ok(plan, '72h+ continuous rest must retain weekly-rest context until real Start');
  assert.match(plan.primaryHelp, /weekly rest ended/i);

  sunday.dayType = 'work';
  sunday.start = '06:00';
  sunday.finish = '14:00';
  const monday = dayByName(nextWeek, 'Monday');
  setOff(monday);
  const consumed = app.hasFactualWorkStartAfterAbsBeforeDate([...days, ...nextWeek], [], candidate.finishAbs, monday.dateISO);
  assert.equal(consumed, true, 'Sunday factual Start must consume the old End Week candidate before Monday');
}

fs.rmSync(tempDir, { recursive: true, force: true });
console.log('v5.2.24 long weekly-rest context behavioral scenarios: PASS');
