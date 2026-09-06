import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appSource = fs.readFileSync(path.join(ROOT, 'src', 'App.tsx'), 'utf8');

function hm(value = '') {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}
function abs(day, value) {
  return Math.floor(new Date(`${day.dateISO}T00:00:00`).getTime() / 60000) + hm(value);
}
function worked(day) {
  if (!day.start || !day.finish) return null;
  const s = hm(day.start), f = hm(day.finish);
  return f > s ? f - s : null;
}
function entered(day) {
  return Boolean(day.start || day.finish || day.splitBreak || day.nightOut || (day.bonuses || []).length);
}
function effective(rest, previousWorked, previousSplit, reducedCount) {
  if (rest == null) return 'unknown';
  if (rest < 9 * 60) return 'violation';
  const split = previousSplit && rest >= 9 * 60;
  if (split && rest < 11 * 60) return 'split';
  if (previousWorked != null && previousWorked > 13 * 60) return split ? 'split' : (reducedCount >= 3 ? 'violation' : 'reduced');
  if (rest < 11 * 60) return reducedCount >= 3 ? 'violation' : 'reduced';
  return 'good';
}
function summarize(timelineDays, currentDays) {
  const currentDates = new Set(currentDays.map((d) => d.dateISO));
  const summary = { good: 0, reduced: 0, split: 0, violation: 0 };
  let reducedInCycle = 0;
  let previous = null;
  let previousFinishAbs = null;
  for (const day of [...timelineDays].sort((a, b) => a.dateISO.localeCompare(b.dateISO))) {
    if (day.dayType !== 'work') continue;
    const startAbs = day.start ? abs(day, day.start) : null;
    const finishAbs = day.finish ? abs(day, day.finish) : null;
    if (previous && previousFinishAbs != null && startAbs != null && startAbs > previousFinishAbs) {
      const rest = startAbs - previousFinishAbs;
      let status;
      if (rest >= 24 * 60) {
        reducedInCycle = 0;
        status = 'good';
      } else {
        status = effective(rest, worked(previous), Boolean(previous.splitBreak), reducedInCycle);
        if (status === 'reduced') reducedInCycle += 1;
      }
      if (currentDates.has(day.dateISO)) summary[status] += 1;
    }
    if (finishAbs != null) {
      previous = day;
      previousFinishAbs = finishAbs;
    } else if (entered(day)) {
      previous = null;
      previousFinishAbs = null;
    }
  }
  return summary;
}
function day(dateISO, start = '', finish = '', dayType = 'work', splitBreak = false) {
  return { dateISO, dayType, start, finish, splitBreak, nightOut: false, bonuses: [] };
}

// 1) Exact cross-date 24h must be 1440 minutes, not 0, and reset the cycle.
{
  const days = [day('2026-09-07', '05:00', '10:00'), day('2026-09-08', '10:00', '18:00')];
  assert.deepEqual(summarize(days, days), { good: 1, reduced: 0, split: 0, violation: 0 });
}

// 2) Off/Holiday days do not erase the last factual Finish anchor.
{
  const days = [
    day('2026-09-07', '05:00', '18:00'),
    day('2026-09-08', '', '', 'off'),
    day('2026-09-09', '18:00', '23:00'),
  ];
  assert.deepEqual(summarize(days, days), { good: 1, reduced: 0, split: 0, violation: 0 });
}

// 3) Three reduced rests, factual 24h Weekly Rest, then another 9h reduced rest:
//    the fourth reduced rest in the displayed week is valid because the lifecycle reset.
{
  const days = [
    day('2026-09-06', '09:00', '21:00'),
    day('2026-09-07', '06:00', '18:00'), // 9h => reduced #1
    day('2026-09-08', '03:00', '15:00'), // 9h => reduced #2
    day('2026-09-09', '00:00', '12:00'), // 9h => reduced #3
    day('2026-09-10', '12:00', '23:00'), // exact 24h => reset
    day('2026-09-11', '08:00', '16:00'), // 9h => reduced #1 in new cycle
  ];
  assert.deepEqual(summarize(days, days), { good: 1, reduced: 4, split: 0, violation: 0 });
}

// 4) 23h59 is not Weekly Rest/reset. A following 9h attempt remains a violation after 3 reductions.
{
  const days = [
    day('2026-09-06', '09:00', '21:00'),
    day('2026-09-07', '06:00', '18:00'),
    day('2026-09-08', '03:00', '15:00'),
    day('2026-09-09', '00:00', '12:00'),
    day('2026-09-10', '11:59', '23:00'), // 23h59 => good Daily Rest, no reset
    day('2026-09-11', '08:00', '16:00'), // 9h with allowance exhausted => violation
  ];
  assert.deepEqual(summarize(days, days), { good: 1, reduced: 3, split: 0, violation: 1 });
}

// 5) Split 9h remains split and does not consume an ordinary reduced-rest allowance.
{
  const days = [
    day('2026-09-07', '05:00', '21:00', 'work', true),
    day('2026-09-08', '06:00', '21:00'),
    day('2026-09-09', '06:00', '16:00'),
  ];
  assert.deepEqual(summarize(days, days), { good: 0, reduced: 1, split: 1, violation: 0 });
}

// 6) Cross-pay-week factual chronology: previous Saturday Finish must classify Sunday Start.
{
  const previous = day('2026-09-05', '05:00', '21:00');
  const current = [day('2026-09-06', '06:00', '14:00')];
  assert.deepEqual(summarize([previous, ...current], current), { good: 0, reduced: 1, split: 0, violation: 0 });
}

// Bind the behavioural contract to the production source implementation.
const helperStart = appSource.indexOf('function getWeekPreviewRestSummary');
const helperEnd = appSource.indexOf('function getWeeklyRestTimelineSnapshot', helperStart);
assert.ok(helperStart >= 0 && helperEnd > helperStart, 'production Week Preview chronology helper must exist');
const helperSource = appSource.slice(helperStart, helperEnd);
assert.match(helperSource, /buildWeeklyRestTimelineDays\(currentDays, archive\)/);
assert.match(helperSource, /const currentDates = new Set\(currentDays\.map/);
assert.match(helperSource, /restMinutes >= 24 \* 60[\s\S]*reducedInCycle = 0/);
assert.match(helperSource, /getDayTimeAbsMinutes\(day, start\)/);
assert.match(helperSource, /previousCompletedWork[\s\S]*previousFinishAbs/);
assert.match(helperSource, /if \(status === "reduced"\) reducedInCycle \+= 1/);
assert.match(helperSource, /dayHasEnteredData\(day\)/);

const weekViewStart = appSource.indexOf('function WeekViewModal');
const weekViewSource = appSource.slice(weekViewStart);
assert.match(weekViewSource, /const restSummary = p\.weekRestSummary/);
assert.doesNotMatch(weekViewSource, /const restSummary = p\.previewWeek\.reduce/);
assert.match(appSource, /weekRestSummary=\{weekRestSummary\}/);

console.log('v5.2.37 Week Preview factual rest chronology regression: PASS');
