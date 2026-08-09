import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const appSource = fs.readFileSync(path.join(ROOT, 'src', 'App.tsx'), 'utf8');

// 1) Existing Start violation UI is reused; only the reason text changes.
assert.match(appSource, /invalid=\{startRestViolation\} errorHint=\{startRestViolationText\}/);
assert.match(appSource, /weeklyRestNotCompleted: "Weekly rest not completed"/);
assert.match(appSource, /weeklyRestStartRequired: "Weekly rest required"/);
assert.match(appSource, /const seventhWorkCycleStartViolation = Boolean\(startRestViolation && timelineWeeklyRestPathEligible\);/);
assert.match(appSource, /const weeklyRestIncompleteStartViolation = Boolean\(startRestViolation && !seventhWorkCycleStartViolation && legacyWeeklyRestBaseActive\);/);
assert.match(appSource, /\? t\("weeklyRestStartRequired"\)[\s\S]*\? t\("weeklyRestNotCompleted"\)[\s\S]*: t\("restNotCompleted"\)/);

// The established Rest Card three-colour engine/palette stays in place.
assert.match(appSource, /const restBeforeColors = getRestCardPalette\(restBeforeMinutes, effectiveRestStatus, reducedCount\);/);
assert.match(appSource, /const activeRestColors = futureDayNoStart \? displayRestColors : \(!displayStartValue \? currentRestPalette : \(weeklyRestPalette \|\| restBeforeColors\)\);/);

// 2) Archived/closed weeks must never enter the Working tomorrow branch.
assert.match(appSource, /askWorkingTomorrow=\{!weekIsClosed && !archiveMode && weeklyRestDueByTimeline === false\}/);
assert.match(appSource, /if \(isWeekClosed\(closingSaturday\)\) \{[\s\S]*setActionMessage\(t\("weekAlreadySaved"\)\); return "unchanged";[\s\S]*setActionMessage\(t\("weekUpdated"\)\);[\s\S]*return "updated";/);

// Feedback remains the accepted wording, but is larger and readable longer.
assert.match(appSource, /Week already saved\. No changes\./);
assert.match(appSource, /Changes saved\. Week updated\./);
assert.match(appSource, /Week completed\./);
assert.match(appSource, /setTimeout\(\(\) => setActionMessage\(""\), 4500\)/);
assert.match(appSource, /fontSize: 15/);
assert.match(appSource, /minWidth: 220/);

// 3) Start km is only a grey suggestion while Finish km is empty.
assert.match(appSource, /const startKmIsSuggested = Boolean\([\s\S]*!currentDay\.finishKm[\s\S]*!dayHasDestructiveWorkData\(currentDay\)[\s\S]*\);/);
assert.match(appSource, /color: startKmIsSuggested \? "#94a3b8" : "#0f172a"/);

// 4) A completed earlier day in the active current week gets archive-like surface
// styling, but archive lock/banner logic remains tied to true archiveMode only.
assert.match(appSource, /const pastSavedDayVisual = Boolean\([\s\S]*!archiveMode[\s\S]*isDayComplete\(currentDay\)[\s\S]*currentPos < preferredWorkflowPos[\s\S]*\);/);
assert.match(appSource, /const archiveLikeVisual = archiveMode \|\| pastSavedDayVisual \|\| \(softArchiveMode && currentDay\.dateISO < toISODate\(new Date\(\)\)\);/);
assert.match(appSource, /const softArchiveMode = weekIsClosed && !archiveMode;/);
assert.match(appSource, /const weekLocked = archiveMode && !historicalEditEnabled;/);
assert.match(appSource, /\{archiveMode && <div style=/);
assert.match(appSource, /\.\.\.\(archiveLikeVisual \? \{ background: "#cbd5e1" \} : \{\}\)/);

// Pure predicate checks for the intended visual boundary.
function isPastSavedVisual({ archiveMode, complete, currentPos, preferredPos }) {
  return Boolean(!archiveMode && complete && currentPos >= 0 && preferredPos >= 0 && currentPos < preferredPos);
}
assert.equal(isPastSavedVisual({ archiveMode:false, complete:true, currentPos:1, preferredPos:2 }), true);
assert.equal(isPastSavedVisual({ archiveMode:false, complete:false, currentPos:1, preferredPos:2 }), false);
assert.equal(isPastSavedVisual({ archiveMode:false, complete:true, currentPos:2, preferredPos:2 }), false);
assert.equal(isPastSavedVisual({ archiveMode:true, complete:true, currentPos:1, preferredPos:2 }), false);

console.log('v5.2.20 UX / weekly-rest validation regression: PASS');
