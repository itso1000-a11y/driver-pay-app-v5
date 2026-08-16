import fs from "node:fs";
import assert from "node:assert/strict";

const app = fs.readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");

// ROAD-001: mandatory weekly-rest ownership survives factual Start.
assert.match(app, /const weeklyRestAnchor = timelineWeeklyRestPathEligible[\s\S]*\? timelineWeeklyRestAnchor/);
assert.match(app, /const factualStartValue = normalizeTime\(currentDay\.start \|\| ""\)/);
assert.match(app, /const mandatoryWeeklyRestOwnsRestCard = Boolean\(timelineWeeklyRestPathEligible && hasFactualStart\)/);
assert.match(app, /const weeklyRestPalette = \(mandatoryWeeklyRestOwnsRestCard \|\| endWeekWeeklyRestBecameFactual\)/);
assert.match(app, /if \(restMinutes < 24 \* 60\) return \{ \.\.\.statusPalette\("violation"\), label: t\("weeklyRestNotCompleted"\) \};/);

// ROAD-002: 45h target remains attached to the mandatory anchor after Start.
assert.match(app, /const weeklyRestTargets = getWeeklyRestTargets\(weeklyRestAnchor\)/);
assert.match(app, /weeklyRestStartRequired[\s\S]*weeklyRest45Start/);

// ROAD-003: reduced weekly-rest compensation is rendered from factual Start state.
assert.match(app, /hasFactualStart && weeklyRestPalette && restBeforeMinutes != null && restBeforeMinutes >= 24 \* 60 && restBeforeMinutes < 45 \* 60/);
assert.match(app, /compensationRequired/);

// ROAD-004: past day without Start is capped by getRestDisplayEndAbs and labelled as end-of-day rest.
assert.match(app, /return Math\.min\(nowAbs, dayEndAbs\);/);
assert.match(app, /const historicalDayWithoutStart = !hasFactualStart && currentDay\.dateISO < toISODate\(new Date\(\)\)/);
assert.match(app, /label: historicalDayWithoutStart \? t\("restAtEndOfDay"\) : t\("currentRest"\)/);

// ROAD-005: Saturday Save & Next leads to Week View, never auto-calls End Week.
assert.match(app, /if \(day\.id === "sat"\)[\s\S]*setShowWeekView\(true\)/);
const saveAndGo = app.slice(app.indexOf("function saveAndGo()"), app.indexOf("const computedWeek", app.indexOf("function saveAndGo()")));
assert.doesNotMatch(saveAndGo, /endWeek\(/);

// ROAD-006: Working tomorrow is an End Week workflow question, independent of six-cycle due-state.
assert.match(app, /askWorkingTomorrow=\{!weekIsClosed && !archiveMode\}/);
assert.doesNotMatch(app, /askWorkingTomorrow=\{!weekIsClosed && !archiveMode && weeklyRestDueByTimeline === false\}/);

// ROAD-007: direct current-week route is visible only when selected week differs
// from the active application workflow week, not merely from the device calendar week.
assert.match(app, /const activeWorkflowSaturdayISO = getStartupPayrollSaturdayISO\(\)/);
assert.match(app, /!archiveMode && currentWeekSaturdayISO !== activeWorkflowSaturdayISO[\s\S]*goToCurrentWeek/);

console.log("v5.2.27 road-test ownership/workflow regression: PASS");
