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
// v5.2.23 intentionally supersedes the old voluntary-candidate warning ownership:
// End Week may start a candidate before six cycles, but only factual due-state may
// escalate the Start warning to weekly-rest-required.
assert.match(appSource, /const startRestViolationText = seventhWorkCycleStartViolation[\s\S]*t\("weeklyRestStartRequired"\)[\s\S]*: t\("restNotCompleted"\)/);

// The established Rest Card three-colour engine/palette stays in place.
assert.match(appSource, /const restBeforeColors = getRestCardPalette\(restBeforeMinutes, effectiveRestStatus, reducedCount\);/);
assert.match(appSource, /const activeRestColors = futureDayNoStart \? displayRestColors : \(!displayStartValue \? currentRestPalette : \(weeklyRestPalette \|\| restBeforeColors\)\);/);

// 2) Archived/closed weeks must never enter the Working tomorrow branch.
// v5.2.27: the End Week intent question is independent of the six-cycle warning gate.
assert.match(appSource, /askWorkingTomorrow=\{!weekIsClosed && !archiveMode\}/);
assert.doesNotMatch(appSource, /askWorkingTomorrow=\{!weekIsClosed && !archiveMode && weeklyRestDueByTimeline === false\}/);
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

// 4) v5.2.31 supersedes the old "complete + preferred pointer = grey" rule.
// A day becomes archive-like only after a real lifecycle event: Save & Next,
// calendar passage, closed week, or a factual Start on a later day.
assert.match(appSource, /const laterFactualStartExists = days\.some\([\s\S]*day\.dateISO > currentDay\.dateISO[\s\S]*normalizeTime\(day\.start \|\| ""\)/);
assert.match(appSource, /const pastSavedDayVisual = Boolean\([\s\S]*isDayComplete\(currentDay\)[\s\S]*Boolean\(currentDay\.completionSource\)[\s\S]*currentDay\.dateISO < todayISO[\s\S]*weekIsClosed[\s\S]*laterFactualStartExists[\s\S]*\);/);
assert.doesNotMatch(appSource, /currentPos < preferredWorkflowPos[\s\S]*archiveLikeVisual/);
assert.match(appSource, /const archiveLikeVisual = archiveMode \|\| pastSavedDayVisual \|\| \(softArchiveMode && currentDay\.dateISO < todayISO\);/);
assert.match(appSource, /const softArchiveMode = weekIsClosed && !archiveMode;/);
assert.match(appSource, /const weekLocked = archiveMode && !historicalEditEnabled;/);
assert.match(appSource, /\{archiveMode && <div style=/);
assert.match(appSource, /\.\.\.\(archiveLikeVisual \? \{ background: "#cbd5e1" \} : \{\}\)/);

console.log('v5.2.20 UX / weekly-rest validation regression: PASS');
