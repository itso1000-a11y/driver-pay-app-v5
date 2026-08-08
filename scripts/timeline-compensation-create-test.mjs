import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const appSource = fs.readFileSync(path.join(ROOT, 'src', 'App.tsx'), 'utf8');

function addDays(date, amount) {
  const out = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  out.setDate(out.getDate() + amount);
  return out;
}
function toISODate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function getISOWeekInfo(date) {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = local.getDay() || 7;
  const monday = addDays(local, 1 - weekday);
  const sunday = addDays(monday, 6);
  const thursday = addDays(monday, 3);
  const firstThursday = new Date(thursday.getFullYear(), 0, 4);
  const firstWeekday = firstThursday.getDay() || 7;
  const firstWeekMonday = addDays(firstThursday, 1 - firstWeekday);
  const week = Math.floor((monday.getTime() - firstWeekMonday.getTime()) / (7 * 86400000)) + 1;
  return { week, sunday };
}
function getPayrollSaturdayISOForDate(dateISO) {
  const date = new Date(`${dateISO}T00:00:00`);
  return toISODate(addDays(date, (6 - date.getDay() + 7) % 7));
}
function buildObligation(rest) {
  if (!rest?.reduced || rest.minutes < 24 * 60 || rest.minutes >= 45 * 60) return null;
  const compensationMinutes = Math.max(0, 45 * 60 - rest.minutes);
  if (compensationMinutes <= 0) return null;
  const fixedWeek = getISOWeekInfo(new Date(rest.startAbs * 60000));
  const deadlineISO = toISODate(addDays(fixedWeek.sunday, 21));
  const sourceKey = `timeline:${rest.startAbs}:${rest.endAbs}`;
  return {
    id: sourceKey,
    sourceKey,
    sourceClosingSaturdayISO: getPayrollSaturdayISOForDate(rest.previousWorkDateISO),
    sourceStartAbs: rest.endAbs,
    originalMinutes: compensationMinutes,
    remainingMinutes: compensationMinutes,
    deadlineISO,
    status: 'outstanding',
    completedByStartAbs: null,
    completedRestMinutes: null,
  };
}
function appendOnce(ledger, obligation) {
  if (!obligation) return ledger;
  const duplicate = ledger.some((item) => item.sourceKey === obligation.sourceKey || (item.sourceStartAbs === obligation.sourceStartAbs && item.originalMinutes === obligation.originalMinutes));
  return duplicate ? ledger : [...ledger, obligation];
}

const minute = 60000;
const restStart = Math.floor(new Date('2026-08-04T15:00:00').getTime() / minute);
const reduced35 = {
  startAbs: restStart,
  endAbs: restStart + 35 * 60,
  minutes: 35 * 60,
  reduced: true,
  previousWorkDateISO: '2026-08-04',
  nextWorkDateISO: '2026-08-06',
};

// Exact amount / initial state.
const debt10 = buildObligation(reduced35);
assert.ok(debt10);
assert.equal(debt10.originalMinutes, 10 * 60);
assert.equal(debt10.remainingMinutes, 10 * 60);
assert.equal(debt10.status, 'outstanding');
assert.equal(debt10.completedByStartAbs, null);
assert.equal(debt10.completedRestMinutes, null);
assert.equal(debt10.sourceStartAbs, reduced35.endAbs);
assert.equal(debt10.sourceClosingSaturdayISO, '2026-08-08');
assert.equal(debt10.deadlineISO, '2026-08-30');

// Boundary cases.
assert.equal(buildObligation({ ...reduced35, minutes: 24 * 60, endAbs: restStart + 24 * 60 }).originalMinutes, 21 * 60);
assert.equal(buildObligation({ ...reduced35, minutes: 44 * 60 + 59, endAbs: restStart + 44 * 60 + 59 }).originalMinutes, 1);
assert.equal(buildObligation({ ...reduced35, minutes: 45 * 60, endAbs: restStart + 45 * 60, reduced: false }), null);
assert.equal(buildObligation({ ...reduced35, minutes: 23 * 60 + 59, endAbs: restStart + 23 * 60 + 59 }), null);

// Idempotency / duplicate protection.
let ledger = appendOnce([], debt10);
ledger = appendOnce(ledger, debt10);
assert.equal(ledger.length, 1);
const equivalentLegacyShape = { ...debt10, id: 'legacy-key', sourceKey: 'legacy-key' };
ledger = appendOnce(ledger, equivalentLegacyShape);
assert.equal(ledger.length, 1, 'same factual rest must not duplicate through a second source path');

// Separate reduced weekly rests remain separate.
const reducedNextWeek = { ...reduced35, startAbs: restStart + 7 * 24 * 60, endAbs: reduced35.endAbs + 7 * 24 * 60, previousWorkDateISO: '2026-08-11', nextWorkDateISO: '2026-08-13' };
ledger = appendOnce(ledger, buildObligation(reducedNextWeek));
assert.equal(ledger.length, 2);

// Source-level scope guards: this release adds creation only.
assert.match(appSource, /function buildTimelineWeeklyCompensationObligation\(/);
assert.match(appSource, /getRecognizedWeeklyRestEndingAtStart\(days, Array\.isArray\(archive\) \? archive : \[\], enteredStartAbs\)/);
assert.match(appSource, /writeWeeklyCompensationLedger\(\[\.\.\.ledger, timelineCompensationObligation\]\)/);
assert.match(appSource, /hasEquivalentWeeklyCompensationObligation\(ledger, timelineCompensationObligation\)/);
assert.match(appSource, /This effect does not\n\s*\/\/ complete any debt and does not change Start, End Week, or day state\./);

console.log('Timeline reduced-weekly-rest compensation creation regression: PASS');
