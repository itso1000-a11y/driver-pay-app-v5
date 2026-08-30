import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appSource = fs.readFileSync(path.join(ROOT, 'src', 'App.tsx'), 'utf8');

function normalizeTime(value = '') {
  const d = String(value).replace(/\D/g, '').slice(0, 4);
  if (!d) return '';
  if (d.length === 1) return `0${d}:00`;
  if (d.length === 2) return `${String(Math.min(23, Number(d))).padStart(2, '0')}:00`;
  if (d.length === 3) return `0${d[0]}:${String(Math.min(59, Number(d.slice(1)))).padStart(2, '0')}`;
  return `${String(Math.min(23, Number(d.slice(0, 2)))).padStart(2, '0')}:${String(Math.min(59, Number(d.slice(2, 4)))).padStart(2, '0')}`;
}
function parseTimeToMinutes(value = '') {
  const normalized = normalizeTime(value);
  if (!normalized) return null;
  const [h, m] = normalized.split(':').map(Number);
  return h * 60 + m;
}
function dayStartAbs(day) {
  return Math.floor(new Date(`${day.dateISO}T00:00:00`).getTime() / 60000);
}
function dayTimeAbs(day, value) {
  const minutes = parseTimeToMinutes(value);
  return minutes == null ? null : dayStartAbs(day) + minutes;
}
function entered(day) {
  const hasRealKmRun = Boolean(day.startKm && day.finishKm && day.finishKm !== day.startKm);
  return Boolean(day.start || day.finish || hasRealKmRun || day.holidayPay || (day.bonuses || []).length || day.nightOut || day.splitBreak);
}
function workedMinutes(day) {
  const start = parseTimeToMinutes(day.start || '');
  const finish = parseTimeToMinutes(day.finish || '');
  return start == null || finish == null || finish <= start ? null : finish - start;
}
function effectiveRestStatus(restMinutes, previousWorked, previousSplit, reducedCount) {
  if (restMinutes == null) return 'pending';
  if (previousSplit && restMinutes >= 9 * 60) return 'split';
  if (restMinutes >= 11 * 60 && (previousWorked == null || previousWorked <= 13 * 60)) return 'good';
  if (restMinutes >= 9 * 60 && reducedCount < 3) return 'reduced';
  return 'violation';
}
function day(dateISO, start = '', finish = '', dayType = 'work') {
  return { dateISO, dayType, start, finish, startKm: '', finishKm: '', holidayPay: '', bonuses: [], nightOut: false, splitBreak: false };
}
function mergeTimeline({ archiveDays = [], savedDays = [], currentDays = [] }) {
  const byDate = new Map();
  for (const d of archiveDays) if (d?.dateISO) byDate.set(d.dateISO, d);
  for (const d of savedDays) if (d?.dateISO) byDate.set(d.dateISO, d);
  for (const d of currentDays) if (d?.dateISO) byDate.set(d.dateISO, d);
  return [...byDate.values()].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
}
function detectWeeklyRests(days) {
  const recognized = [];
  let previousFinishAbs = null;
  let previousWorkDateISO = null;
  for (const d of days) {
    if (!d || d.dayType !== 'work') continue;
    const startAbs = d.start ? dayTimeAbs(d, d.start) : null;
    const finishAbs = d.finish ? dayTimeAbs(d, d.finish) : null;
    if (previousFinishAbs != null && previousWorkDateISO && startAbs != null && startAbs > previousFinishAbs) {
      const restMinutes = startAbs - previousFinishAbs;
      if (restMinutes >= 24 * 60) recognized.push({ startAbs: previousFinishAbs, endAbs: startAbs, previousWorkDateISO, nextWorkDateISO: d.dateISO, minutes: restMinutes, reduced: restMinutes < 45 * 60 });
    }
    if (finishAbs != null) {
      previousFinishAbs = finishAbs;
      previousWorkDateISO = d.dateISO;
    } else if (entered(d)) {
      previousFinishAbs = null;
      previousWorkDateISO = null;
    }
  }
  return recognized;
}
function reducedCountBefore(days, targetDateISO) {
  let reduced = 0;
  let previousCompleted = null;
  let previousFinishAbs = null;
  for (const d of days) {
    if (d.dateISO >= targetDateISO) break;
    if (d.dayType !== 'work') continue;
    const startAbs = d.start ? dayTimeAbs(d, d.start) : null;
    const finishAbs = d.finish ? dayTimeAbs(d, d.finish) : null;
    if (previousCompleted && previousFinishAbs != null && startAbs != null && startAbs > previousFinishAbs) {
      const rest = startAbs - previousFinishAbs;
      if (rest >= 24 * 60) reduced = 0;
      else if (effectiveRestStatus(rest, workedMinutes(previousCompleted), Boolean(previousCompleted.splitBreak), reduced) === 'reduced') reduced += 1;
    }
    if (finishAbs != null) {
      previousCompleted = d;
      previousFinishAbs = finishAbs;
    } else if (entered(d)) {
      previousCompleted = null;
      previousFinishAbs = null;
    }
  }
  return reduced;
}
function cycleSnapshot(days) {
  const rests = detectWeeklyRests(days);
  const anchor = rests.length ? rests[rests.length - 1] : null;
  if (!anchor) return { known: false, completedWorkCycles: 0 };
  let completed = 0;
  for (const d of days) {
    if (d.dayType !== 'work') continue;
    const startAbs = d.start ? dayTimeAbs(d, d.start) : null;
    const finishAbs = d.finish ? dayTimeAbs(d, d.finish) : null;
    if (startAbs == null || finishAbs == null || finishAbs <= startAbs) continue;
    if (startAbs < anchor.endAbs) continue;
    completed += 1;
  }
  return { known: true, completedWorkCycles: completed };
}
function fallbackCandidate({ stored = null, selectedSaturdayISO, previousSaturdayISO, previousAnchor = null, previousClosed = false, previousArchived = false }) {
  const storedApplicable = stored && selectedSaturdayISO >= stored.closingSaturdayISO ? stored : null;
  const hasEndWeekEvidence = previousClosed || previousArchived;
  const previous = hasEndWeekEvidence && previousAnchor ? { closingSaturdayISO: previousSaturdayISO, finishAbs: previousAnchor.finishAbs } : null;
  if (!storedApplicable) return previous;
  if (!previous) return storedApplicable;
  return previous.finishAbs > storedApplicable.finishAbs ? previous : storedApplicable;
}

// Scenario 1: normal saved previous pay week must remain factual chronology even
// without End Week. Two reduced daily rests before Saturday remain counted on Sunday.
const savedPrevious = [
  day('2026-08-27', '05:00', '18:00'),
  day('2026-08-28', '03:00', '15:00'), // 9h rest -> reduced #1
  day('2026-08-29', '00:00', '18:00'), // 9h rest -> reduced #2
];
const current = [day('2026-08-30', '03:00', '12:00')]; // next 9h rest would be #3
const rolloverTimeline = mergeTimeline({ savedDays: savedPrevious, currentDays: current });
assert.equal(reducedCountBefore(rolloverTimeline, '2026-08-30'), 2, 'pay-week rollover must not reset the reduced-rest counter');

// Scenario 2: a factual 24h+ rest spanning a saved-week/current-week boundary is
// recognized as weekly rest; the calendar/pay-week boundary itself is irrelevant.
const weeklySpan = mergeTimeline({
  savedDays: [day('2026-08-29', '00:00', '05:00')],
  currentDays: [day('2026-08-30', '05:00', '12:00')],
});
const recognized = detectWeeklyRests(weeklySpan);
assert.equal(recognized.length, 1);
assert.equal(recognized[0].minutes, 24 * 60);
assert.equal(recognized[0].reduced, true);

// Scenario 3: Weekly Rest cycle ownership also crosses the pay-week boundary. A
// factual 45h rest ends on Wednesday, then four saved-week work cycles plus two
// current-week cycles remain six completed cycles before the selected Tuesday.
const cycleSaved = [
  day('2026-08-17', '05:00', '15:00'),
  day('2026-08-19', '12:00', '18:00'), // 45h factual weekly rest ends here; cycle #1
  day('2026-08-20', '05:00', '15:00'), // #2
  day('2026-08-21', '05:00', '15:00'), // #3
  day('2026-08-22', '05:00', '15:00'), // #4
];
const cycleCurrent = [
  day('2026-08-23', '05:00', '15:00'), // #5
  day('2026-08-24', '05:00', '15:00'), // #6
];
const cycle = cycleSnapshot(mergeTimeline({ savedDays: cycleSaved, currentDays: cycleCurrent }));
assert.equal(cycle.known, true);
assert.equal(cycle.completedWorkCycles, 6, 'six-cycle chronology must survive a pay-week rollover without End Week');

// Scenario 4: source precedence is archive baseline -> normal saved week -> current.
const archiveCopy = day('2026-08-29', '06:00', '10:00');
const savedCopy = day('2026-08-29', '06:00', '11:00');
const currentCopy = day('2026-08-29', '06:00', '12:00');
assert.equal(mergeTimeline({ archiveDays: [archiveCopy], savedDays: [savedCopy] })[0].finish, '11:00', 'saved editable history must beat stale archive copy');
assert.equal(mergeTimeline({ archiveDays: [archiveCopy], savedDays: [savedCopy], currentDays: [currentCopy] })[0].finish, '12:00', 'current live day must win for the same date');

// Scenario 5: Saved is factual chronology, but Saved alone is not End Week intent.
const anchor = { finishAbs: 123456 };
assert.equal(fallbackCandidate({ selectedSaturdayISO: '2026-09-05', previousSaturdayISO: '2026-08-29', previousAnchor: anchor, previousClosed: false }), null, 'open/saved previous week must not manufacture a Weekly Rest candidate');
assert.deepEqual(fallbackCandidate({ selectedSaturdayISO: '2026-09-05', previousSaturdayISO: '2026-08-29', previousAnchor: anchor, previousClosed: true }), { closingSaturdayISO: '2026-08-29', finishAbs: 123456 }, 'closed legacy week may backfill the End Week candidate');
assert.deepEqual(fallbackCandidate({ selectedSaturdayISO: '2026-09-05', previousSaturdayISO: '2026-08-29', previousAnchor: anchor, previousArchived: true }), { closingSaturdayISO: '2026-08-29', finishAbs: 123456 }, 'legacy archive record is also valid End Week evidence');

// Scenario 6: a genuine stored candidate remains applicable even when the immediately
// previous normally-saved week is not closed.
const stored = { closingSaturdayISO: '2026-08-22', finishAbs: 120000 };
assert.deepEqual(fallbackCandidate({ stored, selectedSaturdayISO: '2026-09-05', previousSaturdayISO: '2026-08-29', previousAnchor: anchor, previousClosed: false }), stored);

// Guards that bind the behavioral scenarios to the production source implementation.
const timelineStart = appSource.indexOf('function readSavedWeeklyRestTimelineDays');
const timelineEnd = appSource.indexOf('function getReducedDailyRestCountBeforeDay', timelineStart);
assert.ok(timelineStart >= 0 && timelineEnd > timelineStart, 'saved-week chronology helper must exist in production source');
const timelineSource = appSource.slice(timelineStart, timelineEnd);
const archivePos = timelineSource.indexOf('for (const entry of Array.isArray(archive) ? archive : [])');
const savedPos = timelineSource.indexOf('for (const day of readSavedWeeklyRestTimelineDays(savedUpperBoundISO))');
const currentPos = timelineSource.indexOf('for (const day of currentDays)');
assert.ok(archivePos >= 0 && savedPos > archivePos && currentPos > savedPos, 'timeline precedence must be archive -> saved -> current');
assert.match(timelineSource, /key\.startsWith\("driverApp_week_"\)/);
assert.match(timelineSource, /day\.dateISO > throughDateISO/);

const candidateStart = appSource.indexOf('function getWeeklyRestCandidateForSelectedWeek');
const candidateEnd = appSource.indexOf('type WeeklyRestInfo', candidateStart);
const candidateSource = appSource.slice(candidateStart, candidateEnd);
assert.match(candidateSource, /previousWeekHasEndWeekEvidence = isWeekClosed\(previousSaturdayISO\) \|\| hasArchivedPayWeekRecord\(previousSaturdayISO\)/);
assert.match(candidateSource, /previousWeekHasEndWeekEvidence \? readSavedWeekDays\(previousSaturdayISO\) : null/);

const beforeDateStart = appSource.indexOf('function getWeeklyRestCycleSnapshotBeforeDate');
const beforeDateEnd = appSource.indexOf('function hasFactualWorkStartAfterAbsBeforeDate', beforeDateStart);
const beforeDateSource = appSource.slice(beforeDateStart, beforeDateEnd);
assert.match(beforeDateSource, /savedThroughDateISO = toISODate\(addDays\(fromISODate\(cutoffDateISO\), -1\)\)/);
assert.match(beforeDateSource, /getWeeklyRestCycleSnapshot\(priorCurrentDays, priorArchive, savedThroughDateISO\)/);

console.log('v5.2.33 saved-week chronology / candidate ownership regression: PASS');
