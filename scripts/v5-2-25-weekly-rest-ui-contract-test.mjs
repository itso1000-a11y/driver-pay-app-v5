import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
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

// 1. Stale stored candidate must not hide the immediate previous pay-week anchor.
localStorage.clear();
{
  const selectedSaturday = '2030-08-17';
  const previousSaturday = '2030-08-10';
  const previousDays = app.buildPayrollWeek(previousSaturday);
  setWork(dayByName(previousDays, 'Friday'), '08:00', '18:00');
  setOff(dayByName(previousDays, 'Saturday'));
  const freshFinish = app.getDayTimeAbsMinutes(dayByName(previousDays, 'Friday'), '18:00');
  localStorage.setItem(`driverApp_week_${previousSaturday}`, JSON.stringify({ days: previousDays }));
  localStorage.setItem('driverPayV4_weeklyRestCandidate', JSON.stringify({
    closingSaturdayISO: '2030-08-03',
    finishAbs: freshFinish - 7 * 24 * 60,
  }));
  const resolved = app.getWeeklyRestCandidateForSelectedWeek(selectedSaturday);
  assert.ok(resolved, 'A current weekend candidate must be resolved');
  assert.equal(resolved.closingSaturdayISO, previousSaturday, 'Immediate previous pay-week candidate must win over stale older storage');
  assert.equal(resolved.finishAbs, freshFinish, 'Resolved candidate must use the newer Friday Finish');
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
