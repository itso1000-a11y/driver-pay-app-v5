import assert from "node:assert/strict";
import { evaluateCompensation } from "../src/rest-engine/compensation.ts";
import { generateWeeklyRestComponentOptions } from "../src/rest-engine/weekly-rest-candidates.ts";
import { solveOneShotWeeklyRestAllocations } from "../src/rest-engine/weekly-rest-allocation.ts";
import { fixedLegalWeekForInstant, formatLondonInstant, resolveLondonWallTime } from "../src/rest-engine/time.ts";
import type { AllocationBranch, RestBoundary, RestInterval, WeeklyRestComponent } from "../src/rest-engine/types.ts";
import { allocationFrontierAlternative } from "../src/rest-engine/allocation-frontier.ts";
import { transitionCompensationFrontier } from "../src/rest-engine/compensation-frontier.ts";
import { createIncrementalCheckpoint, deserializeIncrementalCheckpoint, serializeIncrementalCheckpoint, incrementalCheckpointSource } from "../src/rest-engine/incremental-checkpoint.ts";
import type { ActivityFactInput } from "../src/rest-engine/types.ts";

const H = 60 * 60 * 1000;
const at = (date: string) => resolveLondonWallTime(date, "12:00:00").epochMilliseconds as number;
const boundary = (instant: number, role: RestBoundary["role"]): RestBoundary => {
  const london = formatLondonInstant(instant);
  return { sourceFactIds: ["package"], role, time: resolveLondonWallTime(london.wallDate, london.wallTime), epochMilliseconds: instant };
};
const rest = (id: string, date: string, hours: number): RestInterval => {
  const start = at(date), end = start + hours * H;
  return { restIntervalId: id, startBoundary: boundary(start, "WORK_END"), endBoundary: boundary(end, "WORK_START"), startEpochMilliseconds: start, endEpochMilliseconds: end, observedThroughEpochMilliseconds: end, elapsedMilliseconds: end - start, elapsedRangeMilliseconds: null, supportingFactIds: [id], state: "CLOSED", provenance: "EXPLICIT", reviewStatus: "CLEAR", reviewReasons: [] };
};
function sourceBranch(id: string, interval: RestInterval, reducedHours: number, monday: string): AllocationBranch {
  const start = interval.startEpochMilliseconds as number;
  const component: WeeklyRestComponent = { componentId: `source:${id}`, restIntervalId: interval.restIntervalId, sourceOptionId: `legacy-source:${id}`, componentIndex: 0, startEpochMilliseconds: start, endEpochMilliseconds: start + reducedHours * H, startOffsetMilliseconds: 0, endOffsetMilliseconds: reducedHours * H, durationMilliseconds: reducedHours * H, classification: "REDUCED", role: "COUNTED", provenance: "EXPLICIT", reviewStatus: "CLEAR", reviewReasons: [] };
  const week = fixedLegalWeekForInstant(at(monday));
  return { branchId: `source-branch:${id}`, branchFingerprint: `source-branch:${id}`, components: [component], fixedWeekAssignments: [{ assignmentId: `assignment:${id}`, fixedWeekId: monday, componentId: component.componentId, assignmentRole: "COUNTED_FOR_FIXED_WEEK", weekStartEpochMilliseconds: week.startEpochMilliseconds, weekEndEpochMilliseconds: week.endEpochMilliseconds }], additionalComponents: [], rollingQualifyingRests: [], rollingCycleResets: [], twoWeekEvaluations: [], reviewStatus: "CLEAR", reviewReasons: [], legalState: "COMPLIANT", invalidReasons: [], sourceOptionIds: [component.sourceOptionId] };
}
function allocationFor(interval: RestInterval, monday: string): AllocationBranch {
  const solved = solveOneShotWeeklyRestAllocations([interval], generateWeeklyRestComponentOptions([interval]).options, { asOfEpochMilliseconds: at("2026-04-30"), evaluationWeekIds: [monday], historyStartEpochMilliseconds: at("2026-01-01"), factualCoverageCompleteThroughAsOf: true });
  const branch = solved.branches.find((candidate) => candidate.components.some((component) => component.role === "COUNTED"));
  assert.ok(branch, "real allocation solver must create a counted lineage");
  return branch;
}
function combine(source: AllocationBranch, current: AllocationBranch, id: string): AllocationBranch {
  return { ...current, branchId: `lineage:${id}`, branchFingerprint: `lineage:${id}`, components: [...source.components, ...current.components], fixedWeekAssignments: [...source.fixedWeekAssignments, ...current.fixedWeekAssignments], sourceOptionIds: [...source.sourceOptionIds, ...current.sourceOptionIds] };
}
function packageEvaluation(oldReducedHours: number, totalHours: number, id: string, requireNewDebt = true) {
  const sourceRest = rest(`old:${id}`, "2026-02-02", oldReducedHours);
  const currentRest = rest(`current:${id}`, "2026-02-23", totalHours);
  const debtHours = 45 - oldReducedHours;
  const branch = combine(sourceBranch(id, sourceRest, oldReducedHours, "2026-02-02"), allocationFor(currentRest, "2026-02-23"), id);
  const result = evaluateCompensation([sourceRest, currentRest], [branch], { asOfEpochMilliseconds: at("2026-04-30"), factualCoverageCompleteThroughAsOf: true });
  const match = result.branchEvaluations.find((evaluation) => {
    const old = evaluation.obligations.find((item) => item.sourceRestIntervalId === sourceRest.restIntervalId);
    const block = evaluation.blocks.find((item) => item.obligationId === old?.obligationId && item.restIntervalId === currentRest.restIntervalId);
    const weekly = evaluation.obligations.find((item) => item.sourceRestIntervalId === currentRest.restIntervalId);
    const attachment = evaluation.attachments.find((item) => item.obligationId === old?.obligationId);
    const base = evaluation.attachmentBases.find((item) => item.baseId === attachment?.baseId);
    return old?.requiredCompensationMilliseconds === debtHours * H && block != null && (!requireNewDebt || weekly != null)
      && base != null && base.completionEpochMilliseconds - base.startEpochMilliseconds === (totalHours - debtHours) * H;
  });
  return { sourceRest, currentRest, debtHours, branch, result, match };
}
function assertPackage(oldReducedHours: number, totalHours: number, expectedWeeklyHours: number, expectedNewDebtHours: number | null, label: string) {
  const value = packageEvaluation(oldReducedHours, totalHours, label, expectedNewDebtHours != null);
  if (!value.match) console.log(label, JSON.stringify(value.result.branchEvaluations.map((e) => ({ fp:e.phase4BranchFingerprint, obligations:e.obligations.map(o=>[o.sourceRestIntervalId,o.requiredCompensationMilliseconds]), blocks:e.blocks, bases:e.attachmentBases })),null,2));
  assert.ok(value.match, `${label}: a finite package descendant must complete the full old debt`);
  const evaluation = value.match!;
  const old = evaluation.obligations.find((item) => item.sourceRestIntervalId === value.sourceRest.restIntervalId)!;
  const block = evaluation.blocks.find((item) => item.obligationId === old.obligationId)!;
  const base = evaluation.attachmentBases.find((item) => item.baseId === evaluation.attachments.find((item) => item.obligationId === old.obligationId)!.baseId)!;
  const newDebt = evaluation.obligations.find((item) => item.sourceRestIntervalId === value.currentRest.restIntervalId);
  assert.equal(block.durationMilliseconds, value.debtHours * H, `${label}: C must be full en-bloc`);
  assert.equal(base.baseKind, "WEEKLY_REST_BASE", `${label}: W is the qualifying attachment base`);
  assert.equal(base.completionEpochMilliseconds - base.startEpochMilliseconds, expectedWeeklyHours * H, `${label}: W must be R-C, not an arbitrary 24h minimum`);
  assert.ok(block.startEpochMilliseconds >= base.completionEpochMilliseconds || block.endEpochMilliseconds <= base.startEpochMilliseconds, `${label}: W and C must not overlap`);
  assert.equal(block.durationMilliseconds + (base.completionEpochMilliseconds - base.startEpochMilliseconds), totalHours * H, `${label}: used package is exactly R = W + C`);
  if (expectedNewDebtHours == null) assert.equal(newDebt, undefined, `${label}: a regular W creates no new debt`);
  else assert.equal(newDebt?.requiredCompensationMilliseconds, expectedNewDebtHours * H, `${label}: new debt derives from actual W`);
  assert.equal(evaluation.obligationResults.find((item) => item.obligationId === old.obligationId)?.status, "COMPLETED_ON_TIME", `${label}: old debt is complete`);
  return value;
}

function assertOrdinaryReduced(fullHours: number, expectedDebtHours: number, label: string) {
  const currentRest = rest(`ordinary:${label}`, "2026-02-23", fullHours);
  const branch = allocationFor(currentRest, "2026-02-23");
  const component = branch.components.find((item) => item.role === "COUNTED");
  assert.ok(component, `${label}: real solver must materialize a counted component`);
  assert.equal(component!.durationMilliseconds, fullHours * H, `${label}: ordinary counted Reduced uses full factual duration`);
  const result = evaluateCompensation([currentRest], [branch], { asOfEpochMilliseconds: at("2026-04-30"), factualCoverageCompleteThroughAsOf: true });
  const debt = result.branchEvaluations[0]?.obligations.find((item) => item.sourceRestIntervalId === currentRest.restIntervalId);
  assert.equal(debt?.requiredCompensationMilliseconds, expectedDebtHours * H, `${label}: ordinary debt derives from full factual duration`);
}

// A–C: ordinary/no-package single Reduced components retain the full factual duration.
assertOrdinaryReduced(25, 20, "A");
assertOrdinaryReduced(32.5, 12.5, "B");
assertOrdinaryReduced(45 - (1 / 60), 1 / 60, "C");

// D–F: ordinary and package descendants remain distinct for the same factual R.
const ordinaryAndPackage = packageEvaluation(36.5, 32.5, "D");
const ordinaryBranch = ordinaryAndPackage.result.branchEvaluations.find((item) => item.phase4BranchFingerprint === ordinaryAndPackage.branch.branchFingerprint);
assert.ok(ordinaryBranch, "D: ordinary/no-package branch remains independently representable");
const d1 = ordinaryBranch!.obligations.find((item) => item.sourceRestIntervalId === ordinaryAndPackage.sourceRest.restIntervalId)!;
const ordinaryD2 = ordinaryBranch!.obligations.find((item) => item.sourceRestIntervalId === ordinaryAndPackage.currentRest.restIntervalId)!;
assert.equal(d1.requiredCompensationMilliseconds, 8.5 * H, "D: old D1 remains an 8h30 obligation on ordinary branch");
assert.equal(ordinaryD2.requiredCompensationMilliseconds, 12.5 * H, "D: ordinary full 32h30 Reduced creates 12h30 debt");
assert.notEqual(ordinaryBranch!.obligationResults.find((item) => item.obligationId === d1.obligationId)?.status, "COMPLETED_ON_TIME", "D: ordinary branch does not repay D1");
const packageD = assertPackage(36.5, 32.5, 24, 21, "D-package");
assert.ok(packageD.match, "D: package branch remains independently available");
// P1, P2, P3, P4 and P6: semantic boundaries, no minute-by-minute enumeration.
assertPackage(36.5, 32.5, 24, 21, "P1");
assertPackage(36.5, 38.5, 30, 15, "P2");
assertPackage(36.5, 53.5, 45, null, "P3");
assertPackage(36.5, 55, 46.5, null, "P4");
assertPackage(30, 39, 24, 21, "P6");

// P5: a full C which leaves less than 24h must not create a partial package.
const noFit = packageEvaluation(36.5, 31, "P5");
assert.equal(noFit.match, undefined, "P5: no partial repayment package may be created");

// P7: each pre-existing allocation lineage remains in the evaluator; repayment does not remove its competitor.
const source = rest("p7-old", "2026-02-02", 36.5), current = rest("p7-current", "2026-02-23", 38.5);
const lineageA = combine(sourceBranch("p7", source, 36.5, "2026-02-02"), allocationFor(current, "2026-02-23"), "p7-a");
const lineageB = { ...lineageA, branchId: "lineage:p7-b", branchFingerprint: "lineage:p7-b" };
const competing = evaluateCompensation([source, current], [lineageA, lineageB], { asOfEpochMilliseconds: at("2026-04-30"), factualCoverageCompleteThroughAsOf: true });
assert.ok(competing.branchEvaluations.some((item) => item.branchId === "lineage:p7-a"));
assert.ok(competing.branchEvaluations.some((item) => item.branchId === "lineage:p7-b"));

// P8/P9: old and new debts are distinct and the paid block is disjoint from W.
const p8 = assertPackage(36.5, 32.5, 24, 21, "P8");
const p8eval = p8.match!;
assert.equal(new Set(p8eval.obligations.map((item) => item.obligationId)).size, 2, "P8: D1 and D2 retain distinct identities");

// P10: replaying the same persisted/reconstructed lineage yields identical package meaning and identities.
const p10a = packageEvaluation(36.5, 38.5, "P10").match!;
const p10b = packageEvaluation(36.5, 38.5, "P10").match!;
assert.deepEqual([p10a.phase4BranchFingerprint, p10a.obligations, p10a.blocks, p10a.attachments], [p10b.phase4BranchFingerprint, p10b.obligations, p10b.blocks, p10b.attachments], "P10: reconstructed package lineage is deterministic");
// P10: the persisted frontier retains package descendants without collapsing their lineage.
const p10source = rest("p10-old", "2026-02-02", 36.5), p10current = rest("p10-current", "2026-02-23", 38.5);
const p10branch = combine(sourceBranch("p10-frontier", p10source, 36.5, "2026-02-02"), allocationFor(p10current, "2026-02-23"), "p10-frontier");
const p10transition = transitionCompensationFrontier({ alternatives: [] }, { alternatives: [allocationFrontierAlternative(p10branch)] }, [p10source, p10current], { asOfEpochMilliseconds: at("2026-04-30"), factualCoverageCompleteThroughAsOf: true });
const checkpointFacts: ActivityFactInput[] = [{ factId: "package-checkpoint", sourceRef: { sourceKey: "test", recordId: "package-checkpoint", wallDate: "2026-02-23" }, kind: "OFF", factStatus: "FACTUAL", coverage: "FULL_CIVIL_DAY", completionSource: "user", reviewStatus: "CLEAR", reviewReasons: [] }];
const p10PackageChild = p10transition.packageBranches[0]; assert.ok(p10PackageChild, "P10: a real package refinement must be available for persisted continuation");
const p10PackageFrontier = { alternatives: [allocationFrontierAlternative(p10PackageChild.branch, p10PackageChild.parentAlternativeId)] };
const persisted = createIncrementalCheckpoint({ source: incrementalCheckpointSource(checkpointFacts), finalizedThroughWallDate: "2026-02-23", finalizedAllocationResults: [], finalizedCompensationResults: p10transition.newlyFinalizedCompensationResults, liveAllocationFrontier: p10PackageFrontier, liveCompensationFrontier: p10transition.nextCompensationFrontier, factualCoverageCompleteThroughBoundary: true, reviewReasons: [] });
const restored = deserializeIncrementalCheckpoint(serializeIncrementalCheckpoint(persisted));
assert.ok(restored, "P10: derived package state serializes deterministically");
const continued = transitionCompensationFrontier(restored!.liveCompensationFrontier, restored!.liveAllocationFrontier, [p10source, p10current], { asOfEpochMilliseconds: at("2026-04-30"), factualCoverageCompleteThroughAsOf: true }, restored!.finalizedCompensationResults);
assert.ok(restored!.liveAllocationFrontier.alternatives.every((item:any) => item.packageContinuations.some((value:any) => value.packageContinuationId === p10PackageChild.branch.packageContinuations?.[0]?.packageContinuationId)), "P10: reload preserves the canonical package continuation identity");
assert.equal(continued.newlyFinalizedCompensationResults.filter((item) => item.sourceRestIntervalId === "p10-old").length, 0, "P10: finalized D1 is never re-emitted after reload");
const persistedAgain = createIncrementalCheckpoint({ ...restored!, liveCompensationFrontier: continued.nextCompensationFrontier });
const restoredAgain = deserializeIncrementalCheckpoint(serializeIncrementalCheckpoint(persistedAgain));
assert.ok(restoredAgain, "P10: second checkpoint reload remains valid");
const continuedAgain = transitionCompensationFrontier(restoredAgain!.liveCompensationFrontier, restoredAgain!.liveAllocationFrontier, [p10source, p10current], { asOfEpochMilliseconds: at("2026-04-30"), factualCoverageCompleteThroughAsOf: true }, restoredAgain!.finalizedCompensationResults);
assert.equal(continuedAgain.newlyFinalizedCompensationResults.filter((item) => item.sourceRestIntervalId === "p10-old").length, 0, "P10: finalized D1 is never re-emitted after a second reload");
console.log("P1–P10 PASS — finite branch-correlated R=W+C package alternatives preserve lineages, debt identity and non-overlap");






