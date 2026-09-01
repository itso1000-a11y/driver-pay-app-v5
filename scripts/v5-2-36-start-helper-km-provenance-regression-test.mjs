import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/App.tsx', 'utf8');

// Daily HH:MM proposals must not be globally shrunk on mobile. Only contextual
// weekday/time proposals use the compact presentation.
assert.match(app, /time-row--start\.time-row--context-proposal \.time-row__input\{font-size:20px!important/);
assert.doesNotMatch(app, /time-row--start\.time-row--proposal \.time-row__input\{font-size:20px!important/);
assert.match(app, /inlineDailyHint = Boolean\(!invalid && \(visibleHint === t\("from11hRest"\) \|\| visibleHint === t\("from9hRest"\)\)\)/);
assert.match(app, /flowHint = Boolean\(visibleHint && !inlineDailyHint\)/);

// KM provenance is explicit and an untouched carry is independent of Finish time,
// bonuses, Night out and Split. Only Finish KM confirms it.
assert.match(app, /type StartKmEntrySource = "user" \| "suggestedCarry" \| "confirmedCarry"/);
const suggestedBlock = app.match(/const startKmIsSuggested = Boolean\([\s\S]*?\n  \);/);
assert.ok(suggestedBlock, 'startKmIsSuggested block missing');
assert.doesNotMatch(suggestedBlock[0], /dayHasDestructiveWorkData/);
assert.match(suggestedBlock[0], /!currentDay\.finishKm/);
assert.match(suggestedBlock[0], /startKmEntrySource !== "user"/);
assert.match(suggestedBlock[0], /startKmEntrySource !== "confirmedCarry"/);

assert.match(app, /startKm: value, startKmEntrySource: value \? "user" : undefined/);
assert.match(app, /startKmEntrySource: carryWasSuggested \? "confirmedCarry" : day\.startKmEntrySource/);
assert.match(app, /startKmEntrySource: day\.startKmEntrySource === "confirmedCarry" \? "suggestedCarry" : day\.startKmEntrySource/);

// Carry-forward anchor must come only from Finish KM, never a Start-only record.
const lastKnown = app.match(/function findLastKnownKm\(days: DayRecord\[\]\): string \{[\s\S]*?\n\}/);
assert.ok(lastKnown, 'findLastKnownKm function missing');
assert.match(lastKnown[0], /finishKm/);
assert.doesNotMatch(lastKnown[0], /return day\.startKm|if \(day\.startKm\)/);
assert.match(app, /startKmEntrySource: "suggestedCarry"/);
assert.match(app, /candidateSaturdays = new Set<string>\(\)/);
assert.match(app, /candidate < saturdayISO/);
assert.match(app, /readSavedWeekDays\(previousSaturdayISO\)/);

// Model control: start-only days do not move the anchor; a later Finish KM does.
function lastFactualFinish(days) {
  for (let i = days.length - 1; i >= 0; i -= 1) {
    if (days[i].finishKm) return days[i].finishKm;
  }
  return '';
}
const base = [{ finishKm: '336431' }];
assert.equal(lastFactualFinish([...base, { startKm: '336431', finishKm: '' }, { startKm: '336431', finishKm: '' }]), '336431');
assert.equal(lastFactualFinish([...base, { startKm: '400000', finishKm: '' }]), '336431');
assert.equal(lastFactualFinish([...base, { startKm: '336431', finishKm: '336590' }]), '336590');

console.log('v5.2.36 Start helper / KM provenance regression: PASS');
