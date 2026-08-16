import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync("src/App.tsx", "utf8");

// Exact suggested Start must retain typed provenance.
assert.match(app, /type StartEntrySource = "user" \| "acceptedSuggestion"/);
assert.match(app, /field === "start"[\s\S]*startEntrySource: "user"/);
assert.match(app, /currentDay\.startEntrySource === "acceptedSuggestion"[\s\S]*currentDay\.start === dailyPrimarySuggestedStart/);
assert.match(app, /dailyStartIsManual = Boolean\(displayStartValue && currentDay\.startEntrySource === "user"\)/);

// Reduced-rest allowance must use cross-pay-period timeline and effective classification.
assert.match(app, /function getReducedDailyRestCountBeforeDay\(/);
assert.match(app, /buildWeeklyRestTimelineDays\(currentDays, archive\)/);
assert.match(app, /if \(restMinutes >= 24 \* 60\) \{\s*reducedCount = 0;/);
assert.match(app, /getEffectiveRestStatus\([\s\S]*getWorkedMinutes\(previousCompletedWork\)[\s\S]*previousCompletedWork\.splitBreak[\s\S]*reducedCount/);
assert.match(app, /const reducedCount = getReducedDailyRestCountBeforeDay\(days, Array\.isArray\(archive\) \? archive : \[\], currentDay\)/);

// Split rest must keep the no-reduced-allowance explanation on the factual card.
assert.match(app, /effectiveRestStatus === "split" \? t\("splitRestNotCounted"\)/);

// Grey/archive-like visual must be lifecycle driven, not simply preferred-index driven.
assert.match(app, /Boolean\(currentDay\.completionSource\)[\s\S]*currentDay\.dateISO < todayISO[\s\S]*weekIsClosed[\s\S]*laterFactualStartExists/);
assert.doesNotMatch(app, /currentPos < preferredWorkflowPos[\s\S]*archiveLikeVisual/);

// Go-to-current-week must use active workflow pointer.
assert.match(app, /const activeWorkflowSaturdayISO = getStartupPayrollSaturdayISO\(\)/);
assert.match(app, /currentWeekSaturdayISO !== activeWorkflowSaturdayISO[\s\S]*goToCurrentWeek/);

// Colours are intentionally untouched by this release.
assert.match(app, /linear-gradient\(135deg,#ffffff 0%,#dcfce7 100%\)/);
assert.match(app, /linear-gradient\(135deg,#ffffff 0%,#fef9c3 100%\)/);
assert.match(app, /linear-gradient\(135deg,#ffffff 0%,#fee2e2 100%\)/);

console.log("v5.2.31 rest/state/counter/lifecycle regression: PASS");
