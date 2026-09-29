import assert from "node:assert/strict";
import { isCompleteFactualStartInput, selectFinishGuidance } from "../src/finish-guidance.ts";

const HOUR = 60;
const at = (hour: number, minute = 0) => hour * HOUR + minute;
const guidance = (overrides = {}) => selectFinishGuidance({
  factualStartAbsMinutes: at(6),
  hasFactualStart: true,
  reducedDailyRestAvailable: false,
  splitRestAvailable: false,
  ...overrides,
});

// FG01: factual Start 06:00 produces the normal 11h-rest Finish boundary.
assert.deepEqual(guidance(), [{ kind: "DAILY_11", boundaryAbsMinutes: at(19), tone: "success" }]);
// FG02: existing reduced-rest availability exposes the later 9h option.
assert.deepEqual(guidance({ reducedDailyRestAvailable: true }), [
  { kind: "DAILY_11", boundaryAbsMinutes: at(19), tone: "success" },
  { kind: "DAILY_9", boundaryAbsMinutes: at(21), tone: "success" },
]);
// FG03: blocked reduced rest produces no invented 9h option.
assert.equal(guidance().some((item) => item.kind === "DAILY_9"), false);
// FG04: valid Split Rest uses its own later boundary.
assert.deepEqual(guidance({ splitRestAvailable: true }), [
  { kind: "DAILY_11", boundaryAbsMinutes: at(19), tone: "success" },
  { kind: "SPLIT", boundaryAbsMinutes: at(21), tone: "success" },
]);
// FG05: Split Rest remains distinct from a reduced-rest option.
assert.equal(guidance({ splitRestAvailable: true }).some((item) => item.kind === "DAILY_9"), false);
// FG06: no Weekly helper exists in this daily-only slice.
assert.equal(guidance().some((item) => item.kind === "WEEKLY"), false);
// FG07: a partial/non-factual Start emits no guidance and cannot crash.
assert.deepEqual(guidance({ factualStartAbsMinutes: null, hasFactualStart: true }), []);
// FG08: no factual Start produces no pre-Start Finish helper.
assert.deepEqual(guidance({ factualStartAbsMinutes: null, hasFactualStart: false }), []);
// FG09: cross-midnight boundary uses an absolute instant.
assert.equal(guidance({ factualStartAbsMinutes: at(20) })[0].boundaryAbsMinutes, at(33));
// FG10: all first-slice helpers are semantic green.
assert.equal(guidance({ reducedDailyRestAvailable: true }).every((item) => item.tone === "success"), true);
// FG11: no warning or red tone exists in the selector result.
assert.equal(guidance({ splitRestAvailable: true }).some((item) => (item as { tone: string }).tone !== "success"), false);

const fs = await import("node:fs/promises");
const selectorSource = await fs.readFile(new URL("../src/finish-guidance.ts", import.meta.url), "utf8");
const boundarySource = await fs.readFile(new URL("../src/daily-rest-boundaries.ts", import.meta.url), "utf8");
const appSource = await fs.readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
const guidanceUse = appSource.slice(appSource.indexOf("const finishGuidance ="), appSource.indexOf("const weeklyRestTargetIsBeforeSelectedDay"));

// FG12: guidance cannot call the Rest Engine.
assert.equal(/rest-engine/i.test(selectorSource), false);
// FG13-FG14: Start suggestions and Finish guidance share one Daily Rest source.
assert.match(appSource, /getDailyRestStartBoundaries/);
assert.match(selectorSource, /getDailyRestFinishBoundaries/);
assert.doesNotMatch(selectorSource, /DAILY_WINDOW_MINUTES|REGULAR_DAILY_REST_MINUTES|REDUCED_DAILY_REST_MINUTES/);
assert.match(boundarySource, /DAILY_REST_WINDOW_MINUTES/);
// FG15: App retains its existing Start suggestion functions.
assert.match(appSource, /function getSuggestedStartTimesForDay/);
assert.match(appSource, /function getReducedDailyRestCountBeforeDay/);
// FG16: no Weekly or pre-Start deadline state is fed into this selector.
assert.doesNotMatch(guidanceUse, /engineWeeklyRestPlan|weeklyRestDeadline|hasStartSuggestion/);
// FG17: Finish UI wording and its green semantic presentation remain explicit.
assert.match(appSource, /11h rest: finish by \$\{time\}/);
assert.match(appSource, /11ч почивка: приключи до \$\{time\}/);
assert.match(appSource, /color: "#166534"/);
assert.doesNotMatch(selectorSource, /WEEKLY|weeklyRest|warning|danger/);
// FG18: Finish guidance stays read-only; no Finish setter appears in the selector.
assert.doesNotMatch(selectorSource, /set[A-Z]|localStorage|dispatch/);
// FG19-FG22: no Weekly or red/amber helper is rendered by the focused component.
const finishComponent = appSource.slice(appSource.indexOf("function FinishGuidanceLines"), appSource.indexOf("function MiniStat"));
assert.doesNotMatch(finishComponent, /Weekly rest|Седмична почивка|#b45309|#b91c1c/);
assert.doesNotMatch(finishComponent, /item\.tone/);
assert.match(finishComponent, /#166534/);
assert.deepEqual(guidance({ factualStartAbsMinutes: null, hasFactualStart: false, splitRestAvailable: true }), []);

// FG23-FG27: raw Start editing must be complete before App can enable guidance.
assert.equal(isCompleteFactualStartInput("1"), false);
assert.equal(isCompleteFactualStartInput("12"), false);
assert.equal(isCompleteFactualStartInput("123"), false);
assert.equal(isCompleteFactualStartInput("0600"), true);
assert.equal(isCompleteFactualStartInput("06:00"), true);
assert.match(appSource, /isCompleteFactualStartInput\(currentDay\.start \|\| ""\)/);
// FG28: agreed Bulgarian reduced option wording.
assert.match(finishComponent, /9ч вариант: \$\{time\}/);
assert.doesNotMatch(finishComponent, /9ч вариант: приключи до/);

console.log("Finish guidance focused tests: FG01-FG28 PASS");
