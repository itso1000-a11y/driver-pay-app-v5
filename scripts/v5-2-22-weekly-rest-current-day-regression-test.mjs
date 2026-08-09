import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const appSource = fs.readFileSync(path.join(ROOT, 'src', 'App.tsx'), 'utf8');

// Regression found by the physical-phone road test after v5.2.21:
// an End Week candidate created on Friday must still be addressable on Saturday
// of the SAME Sunday→Saturday pay week. The day itself decides whether it is
// chronologically after the candidate finish; equality of pay-week Saturday must
// not discard the candidate before that check can run.
assert.match(appSource, /if \(stored && selectedSaturdayISO >= stored\.closingSaturdayISO\) return stored;/);
assert.doesNotMatch(appSource, /if \(stored && selectedSaturdayISO > stored\.closingSaturdayISO\) return stored;/);

// Candidate still cannot leak backwards into Monday–Friday: the existing factual
// chronology gate must remain and compare the selected day's absolute start with
// the real candidate Finish.
assert.match(appSource, /const currentDayAfterWeeklyCandidate = Boolean\([\s\S]*getDayStartAbsMinutes\(currentDay\) >= weeklyRestCandidate\.finishAbs[\s\S]*\);/);

// Suggested != Saved: Day Off/Work transitions must not write the weekly proposal
// into day.start. Work uses the established Start proposal flow; Off may display the
// same weekly-rest information without creating a factual Start.
assert.match(appSource, /currentDay\.dayType === "off" && weeklyRestDisplayPlan && <WeeklyRestInlineCard plan=\{weeklyRestDisplayPlan\} showPrimary \/>/);
assert.match(appSource, /const startFieldPlaceholder = weeklyRestCandidateActive && weeklyRestBasePrimaryStart/);
assert.doesNotMatch(appSource, /dayType:\s*"work",\s*start:\s*day\.start\s*\|\|\s*weeklyRest/);

// Preserve the accepted proposal vocabulary / lifecycle.
assert.match(appSource, /weeklyRest45Option: "45h weekly"/);
assert.match(appSource, /weeklyRest24Option: "24h option"/);
assert.match(appSource, /weeklyRestEnded: "Weekly rest ended"/);
assert.match(appSource, /weeklyRestInProgress: "Weekly rest in progress"/);
assert.match(appSource, /weekly45Unavailable: "45h unavailable"/);

// Soft-close must not make TODAY (or a future day) look archived. Archive-like
// styling is reserved for a true hard archive, a previously saved past day, or a
// soft-closed day whose calendar date is already in the past.
assert.match(appSource, /const archiveLikeVisual = archiveMode \|\| pastSavedDayVisual \|\| \(softArchiveMode && currentDay\.dateISO < toISODate\(new Date\(\)\)\);/);
assert.doesNotMatch(appSource, /const archiveLikeVisual = archiveMode \|\| softArchiveMode \|\| pastSavedDayVisual;/);

// Hard archive protection itself remains untouched.
assert.match(appSource, /const archiveMode = weekIsHistorical && isHardArchiveWeek\(currentWeekSaturdayISO\);/);
assert.match(appSource, /const weekLocked = archiveMode && !historicalEditEnabled;/);

// Later v5.2.15+ factual due-gate ownership must remain in place. End Week does not
// manufacture a weekly-rest requirement when the factual timeline says it is not due.
assert.match(appSource, /const weeklyRestDueByTimeline = weeklyRestCycleSnapshot\.known[\s\S]*completedWorkCycles >= 6/);
assert.match(appSource, /weeklyRestDueByTimeline == null \|\| weeklyRestDueByTimeline/);

console.log('v5.2.22 weekly-rest same-pay-week + current-day visual regression: PASS');
