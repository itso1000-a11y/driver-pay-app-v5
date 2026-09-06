import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP_PATH = path.join(ROOT, 'src', 'App.tsx');
const appSource = fs.readFileSync(APP_PATH, 'utf8');

// Visible UI contracts recovered from the v5.2.16-era simple weekly-rest flow.
assert.match(appSource, /\{weeklyRestPlan \? <><WeeklyRestInlineCard plan=\{weeklyRestPlan\} \/>/,
  'Work-day Weekly Rest card must render whenever a plan exists, not only while helper text exists');
assert.doesNotMatch(appSource, /weeklyRestPlan\?\.helper \? <WeeklyRestInlineCard/,
  'The 45h endpoint must not make the entire Weekly Rest card disappear');
assert.match(appSource, /const activeWorkflowSaturdayISO = getStartupPayrollSaturdayISO\(\)/,
  'The current-week route must be anchored to the active workflow week');
assert.match(appSource, /!archiveMode && currentWeekSaturdayISO !== activeWorkflowSaturdayISO[\s\S]*onClick=\{loadCurrentWeek\}[\s\S]*goToCurrentWeek/,
  'A non-current soft archive must expose a direct Go to current week action');
assert.match(appSource, /previousWeekCandidate\.finishAbs > storedApplicable\.finishAbs/,
  'Candidate selection must prefer a newer immediate previous-week factual anchor over stale stored state');

const exportNames = [
  'buildPayrollWeek',
  'getLastCompletedWorkShiftInWeek',
  'getWeeklyRestCandidateForSelectedWeek',
  'getWeeklyRestTargets',
  'getWeeklyRestPlan',
  'getDayTimeAbsMinutes',
];
const instrumented = `${appSource}\nexport { ${exportNames.join(', ')} };\n`;
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'driver-pay-v525-'));
const bundlePath = path.join(tempDir, 'app-instrumented.mjs');

await build({
  stdin: { contents: instrumented, sourcefile: APP_PATH, resolveDir: path.join(ROOT, 'src'), loader: 'tsx' },
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
function setWork(day, start, finish) { day.dayType = 'work'; day.start = start; day.finish = finish; }
function setOff(day) { day.dayType = 'off'; day.start = ''; day.finish = ''; }

// 1. v5.2.33 ownership correction: a normally saved previous week is factual
// chronology, but without End Week/archive evidence it must NOT manufacture
// Weekly Rest proposal ownership. A genuine older stored candidate remains valid.
// Once the immediate previous week is factually closed, its newer anchor may win.
localStorage.clear();
{
  const selectedSaturday = '2030-08-17';
  const previousSaturday = '2030-08-10';
  const storedSaturday = '2030-08-03';
  const previousDays = app.buildPayrollWeek(previousSaturday);
  setWork(dayByName(previousDays, 'Friday'), '08:00', '18:00');
  setOff(dayByName(previousDays, 'Saturday'));
  const freshFinish = app.getDayTimeAbsMinutes(dayByName(previousDays, 'Friday'), '18:00');
  const storedFinish = freshFinish - 7 * 24 * 60;
  localStorage.setItem(`driverApp_week_${previousSaturday}`, JSON.stringify({ days: previousDays }));
  localStorage.setItem('driverPayV4_weeklyRestCandidate', JSON.stringify({
    closingSaturdayISO: storedSaturday,
    finishAbs: storedFinish,
  }));

  const openWeekResolved = app.getWeeklyRestCandidateForSelectedWeek(selectedSaturday);
  assert.ok(openWeekResolved, 'A genuine stored candidate must remain applicable');
  assert.equal(openWeekResolved.closingSaturdayISO, storedSaturday,
    'Normally saved previous week must not manufacture proposal ownership without End Week evidence');
  assert.equal(openWeekResolved.finishAbs, storedFinish,
    'Open/saved previous week must not replace the genuine stored candidate');

  localStorage.setItem('driverPayV4_closedWeeks', JSON.stringify([previousSaturday]));
  const closedWeekResolved = app.getWeeklyRestCandidateForSelectedWeek(selectedSaturday);
  assert.ok(closedWeekResolved, 'Closed previous week must provide a backfill candidate');
  assert.equal(closedWeekResolved.closingSaturdayISO, previousSaturday,
    'With End Week evidence, the newer immediate previous pay-week candidate must win');
  assert.equal(closedWeekResolved.finishAbs, freshFinish,
    'Closed previous-week candidate must use the newer Friday Finish');
}

// 2. A valid weekly-rest plan remains a plan before and after the 45h endpoint.
{
  const saturdayISO = '2030-08-10';
  const days = app.buildPayrollWeek(saturdayISO);
  const friday = dayByName(days, 'Friday');
  setWork(friday, '08:00', '18:00');
  const anchor = { finishAbs: app.getDayTimeAbsMinutes(friday, '18:00') };
  const targets = app.getWeeklyRestTargets(anchor);
  assert.ok(targets);

  const saturday = dayByName(days, 'Saturday');
  setOff(saturday);
  const offPlan = app.getWeeklyRestPlan(anchor, saturday, true, false, 5);
  assert.ok(offPlan, 'Day Off must retain Weekly Rest context');
  assert.equal(offPlan.primaryAbs, targets.fullStart, '45h remains the primary weekly target');

  const laterWeek = app.buildPayrollWeek('2030-08-17');
  const sunday = dayByName(laterWeek, 'Sunday');
  setWork(sunday, '', '');
  const post45Plan = app.getWeeklyRestPlan(anchor, sunday, true, false, 5);
  assert.ok(post45Plan, 'Weekly Rest context must not disappear merely because the 45h endpoint has passed');
  assert.equal(post45Plan.primaryAbs, targets.fullStart, 'Post-45h context keeps the original factual anchor/target');
  assert.equal(sunday.start, '', 'Weekly Rest presentation must never silently save Start');
}

fs.rmSync(tempDir, { recursive: true, force: true });
console.log('PASS v5.2.26 weekly-rest UI contract recovery');
