import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const appSource = fs.readFileSync(path.join(ROOT, 'src', 'App.tsx'), 'utf8');

// Regression found by the physical-phone road test after v5.2.21:
// an End Week candidate created on Friday must still be addressable on Saturday
// of the SAME Sunday→Saturday pay week.
//
// v5.2.25 / WR-009 supersedes the old unconditional stored-candidate preference:
// when both a stored candidate and a newer previous-week candidate are applicable,
// select the candidate with the later factual Finish. This preserves the original
// same-pay-week rule while preventing stale storage from hiding newer chronology.
assert.match(appSource, /const storedApplicable =\s*stored && selectedSaturdayISO >= stored\.closingSaturdayISO[\s\S]*\? stored[\s\S]*: null;/);
assert.match(appSource, /if \(!storedApplicable\) return previousWeekCandidate;/);
assert.match(appSource, /if \(!previousWeekCandidate\) return storedApplicable;/);
assert.match(appSource, /return previousWeekCandidate\.finishAbs > storedApplicable\.finishAbs[\s\S]*\? previousWeekCandidate[\s\S]*: storedApplicable;/);
assert.doesNotMatch(appSource, /if \(stored && selectedSaturdayISO >= stored\.closingSaturdayISO\) return stored;/);
assert.doesNotMatch(appSource, /if \(stored && selectedSaturdayISO > stored\.closingSaturdayISO\) return stored;/);

// Candidate still cannot leak backwards into Monday–Friday: the existing factual
// chronology gate must remain and compare the selected day's absolute start with
// the real candidate Finish.
assert.match(appSource, /const currentDayAfterWeeklyCandidate = Boolean\([\s\S]*getDayStartAbsMinutes\(currentDay\) >= weeklyRestCandidate\.finishAbs[\s\S]*\);/);

// Suggested != Saved: Day Off/Work transitions must not write the weekly proposal
// into day.start. Work uses the established Start proposal flow; Off may display the
// same weekly-rest information without creating a factual Start.
assert.match(appSource, /currentDay\.dayType === "off" && weeklyRestDisplayPlan && <WeeklyRestInlineCard plan=\{weeklyRestDisplayPlan\} \/>/);
assert.match(appSource, /const startFieldPlaceholder = weeklyRestCandidateActive && weeklyRestBasePrimaryStart/);
assert.doesNotMatch(appSource, /dayType:\s*"work",\s*start:\s*day\.start\s*\|\|\s*weeklyRest/);

// Preserve the accepted proposal vocabulary / lifecycle.
assert.match(appSource, /weeklyRest45Option: "45h weekly"/);
assert.match(appSource, /weeklyRest24Option: "24h option"/);
assert.match(appSource, /weeklyRestEnded: "Weekly rest ended"/);
assert.match(appSource, /weeklyRest45Start: "45h Start"/);
assert.match(appSource, /weekly45Unavailable: "45h unavailable"/);

// v5.2.31: current active day stays live until a real lifecycle event.
// Soft archive still greys only days whose calendar date is already in the past.
assert.match(appSource, /const todayISO = toISODate\(new Date\(\)\);/);
assert.match(appSource, /const archiveLikeVisual = archiveMode \|\| pastSavedDayVisual \|\| \(softArchiveMode && currentDay\.dateISO < todayISO\);/);
assert.doesNotMatch(appSource, /const archiveLikeVisual = archiveMode \|\| softArchiveMode \|\| pastSavedDayVisual;/);

// Hard archive protection itself remains untouched.
assert.match(appSource, /const archiveMode = weekIsHistorical && isHardArchiveWeek\(currentWeekSaturdayISO\);/);
assert.match(appSource, /const weekLocked = archiveMode && !historicalEditEnabled;/);

// Later v5.2.15+ factual due-gate ownership remains for warnings, but v5.2.23
// deliberately stops using it to suppress an End Week weekly-rest proposal.
assert.match(appSource, /const weeklyRestDueByTimeline = weeklyRestCycleSnapshot\.known[\s\S]*completedWorkCycles >= 6/);
assert.doesNotMatch(appSource, /weeklyRestCandidate && currentDayAfterWeeklyCandidate && \(weeklyRestDueByTimeline == null \|\| weeklyRestDueByTimeline\)/);

console.log('v5.2.22 weekly-rest same-pay-week + current-day visual regression: PASS');
