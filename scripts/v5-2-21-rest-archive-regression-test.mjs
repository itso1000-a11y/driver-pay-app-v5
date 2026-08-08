import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const appSource = fs.readFileSync(path.join(ROOT, 'src', 'App.tsx'), 'utf8');

// Archive lifecycle restored from protected project history:
// current + immediately previous payroll week are soft/editable; older weeks hard-lock.
function isHardArchiveWeek(currentSaturdayISO, selectedSaturdayISO) {
  const current = new Date(`${currentSaturdayISO}T00:00:00`);
  const previous = new Date(current);
  previous.setDate(previous.getDate() - 7);
  const yyyy = previous.getFullYear();
  const mm = String(previous.getMonth() + 1).padStart(2, '0');
  const dd = String(previous.getDate()).padStart(2, '0');
  return selectedSaturdayISO < `${yyyy}-${mm}-${dd}`;
}
assert.equal(isHardArchiveWeek('2026-08-08','2026-08-08'), false, 'current closed week must stay soft');
assert.equal(isHardArchiveWeek('2026-08-08','2026-08-01'), false, 'immediately previous week must stay soft');
assert.equal(isHardArchiveWeek('2026-08-08','2026-07-25'), true, 'older week must use hard archive');
assert.equal(isHardArchiveWeek('2026-08-08','2026-08-15'), false, 'future closed week must not hard-lock');
assert.match(appSource, /function isHardArchiveWeek\(saturdayISO: string\): boolean/);
assert.match(appSource, /const archiveMode = weekIsHistorical && isHardArchiveWeek\(currentWeekSaturdayISO\);/);
assert.match(appSource, /const softArchiveMode = weekIsClosed && !archiveMode;/);
assert.match(appSource, /const weekLocked = archiveMode && !historicalEditEnabled;/);
assert.match(appSource, /askWorkingTomorrow=\{!weekIsClosed && !archiveMode && weeklyRestDueByTimeline === false\}/);

// Same-pay-week End Week candidate must remain available on later calendar days.
assert.match(appSource, /const currentDayAfterWeeklyCandidate = Boolean\([\s\S]*getDayStartAbsMinutes\(currentDay\) >= weeklyRestCandidate\.finishAbs[\s\S]*\);/);
assert.match(appSource, /weeklyRestCandidate &&[\s\S]*currentDayAfterWeeklyCandidate &&[\s\S]*currentDay\.dayType === "work"/);

// Off days may surface the weekly-rest candidate without accepting/saving a Start.
assert.match(appSource, /weeklyRestDisplayActive = Boolean\([\s\S]*currentDay\.dayType === "work" \|\| currentDay\.dayType === "off"/);
assert.match(appSource, /currentDay\.dayType === "off" && weeklyRestDisplayPlan && <WeeklyRestInlineCard plan=\{weeklyRestDisplayPlan\} showPrimary \/>/);
assert.match(appSource, /weeklyRestInProgress: "Weekly rest in progress"/);
assert.match(appSource, /weeklyRestInProgress: "Тече седмична почивка"/);

// Established proposal responsibilities are preserved.
assert.match(appSource, /weeklyRest45Option: "45h weekly"/);
assert.match(appSource, /weeklyRest24Option: "24h option"/);
assert.match(appSource, /weeklyRestEnded: "Weekly rest ended"/);
assert.match(appSource, /weekly45Unavailable: "45h unavailable"/);

// A valid reduced option remains visible through the 24h→45h reduced-rest window.
// Once regular 45h is reached it is no longer a useful reduced option.
function reducedOptionVisible(nowAbs, fullStartAbs, historical=false) {
  return historical || nowAbs < fullStartAbs;
}
assert.equal(reducedOptionVisible(24*60,45*60), true);
assert.equal(reducedOptionVisible(44*60+59,45*60), true);
assert.equal(reducedOptionVisible(45*60,45*60), false);
assert.match(appSource, /const reducedOptionIsActionable = historicalDay \|\| nowAbs < targets\.fullStart;/);

console.log('v5.2.21 soft-archive + weekly-rest visibility regression: PASS');
