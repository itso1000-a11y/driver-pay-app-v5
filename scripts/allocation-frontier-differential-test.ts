import assert from "node:assert/strict";
import type { AllocationBranch, RestBoundary, RestInterval, WeeklyRestAllocationContext, WeeklyRestComponentOption } from "../src/rest-engine/types.ts";
import { allocationFrontierFromBranches, allocationFrontierGenesis, transitionAllocationFrontier } from "../src/rest-engine/allocation-frontier.ts";
import { formatLondonInstant, resolveLondonWallTime } from "../src/rest-engine/time.ts";
import { generateWeeklyRestComponentOptions } from "../src/rest-engine/weekly-rest-candidates.ts";
import { solveOneShotWeeklyRestAllocations, solveSegmentedWeeklyRestAllocations } from "../src/rest-engine/weekly-rest-allocation.ts";

const HOUR = 60 * 60 * 1000;
let passed = 0;
function test(id: string, name: string, body: () => void) { body(); passed += 1; console.log(`PASS ${id} — ${name}`); }
function instant(date: string, time = "00:00:00"): number {
  const value = resolveLondonWallTime(date, time);
  assert.equal(value.resolution, "VALID");
  return value.epochMilliseconds as number;
}
function boundary(epochMilliseconds: number, role: RestBoundary["role"]): RestBoundary {
  const civil = formatLondonInstant(epochMilliseconds);
  return { sourceFactIds: ["differential"], role, time: resolveLondonWallTime(civil.wallDate, civil.wallTime), epochMilliseconds };
}
function rest(id: string, date: string, hours: number, time = "00:00:00"): RestInterval {
  const start = instant(date, time); const end = start + hours * HOUR;
  return { restIntervalId: id, startBoundary: boundary(start, "WORK_END"), endBoundary: boundary(end, "WORK_START"), startEpochMilliseconds: start, endEpochMilliseconds: end, observedThroughEpochMilliseconds: end, elapsedMilliseconds: end - start, elapsedRangeMilliseconds: null, supportingFactIds: [`fact:${id}`], state: "CLOSED", provenance: "EXPLICIT", reviewStatus: "CLEAR", reviewReasons: [] };
}
function context(weeks: string[], asOf: number): WeeklyRestAllocationContext {
  return { evaluationWeekIds: weeks, asOfEpochMilliseconds: asOf, historyStartEpochMilliseconds: instant(weeks[0]), factualCoverageCompleteThroughAsOf: true };
}
function options(intervals: RestInterval[]): WeeklyRestComponentOption[] { return generateWeeklyRestComponentOptions(intervals).options; }
function normalized(branches: readonly AllocationBranch[]) {
  return branches.map((branch) => ({
    components: branch.components.map((item) => [item.componentId, item.restIntervalId, item.classification, item.role, item.sourceOptionId]).sort(),
    assignments: branch.fixedWeekAssignments.map((item) => [item.componentId, item.fixedWeekId]).sort(),
    additional: branch.additionalComponents.map((item) => item.componentId).sort(),
    twoWeek: branch.twoWeekEvaluations.map((item) => [item.evaluationId, item.status, item.countedRoles]).sort(),
    rolling: branch.rollingCycleResets.map((item) => [item.evaluationId, item.status, item.dueEpochMilliseconds]).sort(),
    state: branch.legalState, review: branch.reviewStatus, reasons: [...branch.reviewReasons].sort(),
  })).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}
function differential(intervals: RestInterval[], ctx: WeeklyRestAllocationContext): AllocationBranch[] {
  const sourceOptions = options(intervals);
  const reference = solveOneShotWeeklyRestAllocations(intervals, sourceOptions, ctx);
  const segmented = solveSegmentedWeeklyRestAllocations(intervals, sourceOptions, ctx);
  assert.deepEqual(normalized(segmented.branches), normalized(reference.branches));
  assert.deepEqual(segmented.eliminatedBranchesOrDiagnostics, reference.eliminatedBranchesOrDiagnostics);
  return segmented.branches;
}
const W1 = "2026-02-02"; const W2 = "2026-02-09"; const W3 = "2026-02-16";

test("D1", "single-week real solver differential preserves one regular allocation", () => {
  const branches = differential([rest("d1", "2026-02-03", 45)], context([W1], instant("2026-02-07")));
  assert.ok(branches.some((branch) => branch.components.some((item) => item.classification === "REGULAR" && item.role === "COUNTED")));
});
test("D2", "two-week regular/reduced real solver differential preserves legal alternatives", () => {
  const branches = differential([rest("d2a", "2026-02-03", 45), rest("d2b", "2026-02-10", 30)], context([W1, W2], instant("2026-02-16")));
  assert.ok(branches.some((branch) => branch.fixedWeekAssignments.length === 2));
});
test("D3", "cross-week candidate ownership stays correlated in segmented path", () => {
  const branches = differential([rest("support-a", "2026-02-03", 45), rest("cross", "2026-02-07", 45, "12:00:00"), rest("support-b", "2026-02-10", 45)], context([W1, W2], instant("2026-02-15")));
  const owners = new Set(branches.flatMap((branch) => branch.fixedWeekAssignments.filter((assignment) => branch.components.find((component) => component.componentId === assignment.componentId)?.restIntervalId === "cross").map((assignment) => assignment.fixedWeekId)));
  assert.deepEqual([...owners].sort(), [W1, W2]);
});
test("D4", "reduced seed and collision-safe parent identity retain correlation", () => {
  const branches = differential([rest("d4a", "2026-02-03", 30), rest("d4b", "2026-02-10", 45)], context([W1, W2, W3], instant("2026-02-17")));
  const initial = allocationFrontierFromBranches(branches);
  const first = transitionAllocationFrontier(allocationFrontierGenesis(), initial);
  assert.ok(first.nextFrontier.alternatives.some((item) => item.reducedSourceSeeds.length > 0));
  const parent = first.nextFrontier.alternatives[0];
  const child = { ...parent, parentAlternativeId: parent.alternativeId };
  const second = transitionAllocationFrontier(first.nextFrontier, { alternatives: [child] });
  assert.equal(second.nextFrontier.alternatives.length, 1);
  assert.equal(second.nextFrontier.alternatives[0].alternativeId.startsWith("{"), true);
});
console.log(`allocation differential: ${passed}/4 PASS`);
