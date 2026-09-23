import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  type AllocationBranch,
  type CompensationEvaluationContext,
  type RestBoundary,
  type RestInterval,
  type WeeklyRestComponent,
} from "../src/rest-engine/types.ts";
import { evaluateCompensation } from "../src/rest-engine/compensation.ts";
import { compensationDeadlineForWeek, fixedLegalWeekForInstant, formatLondonInstant, resolveLondonWallTime } from "../src/rest-engine/time.ts";

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;
let passed = 0;
const selectedTestIds = new Set((process.env.PHASE5_TEST_IDS ?? "").split(",").map((item) => item.trim()).filter(Boolean));

function test(id: string, name: string, body: () => void) {
  if (selectedTestIds.size && !selectedTestIds.has(id)) return;
  body();
  passed += 1;
  console.log(`PASS ${id} — ${name}`);
}

function instant(date: string, time = "00:00:00"): number {
  const value = resolveLondonWallTime(date, time);
  assert.equal(value.resolution, "VALID");
  return value.epochMilliseconds as number;
}

function boundary(epochMilliseconds: number, role: RestBoundary["role"]): RestBoundary {
  const civil = formatLondonInstant(epochMilliseconds);
  return { sourceFactIds: ["phase5-fixture"], role, time: resolveLondonWallTime(civil.wallDate, civil.wallTime), epochMilliseconds };
}

function rest(id: string, start: number, duration: number, review = false): RestInterval {
  const end = start + duration;
  return {
    restIntervalId: id,
    startBoundary: boundary(start, "WORK_END"),
    endBoundary: boundary(end, "WORK_START"),
    startEpochMilliseconds: start,
    endEpochMilliseconds: end,
    observedThroughEpochMilliseconds: end,
    elapsedMilliseconds: duration,
    elapsedRangeMilliseconds: null,
    supportingFactIds: [`fact:${id}`],
    state: "CLOSED",
    provenance: "EXPLICIT",
    reviewStatus: review ? "REVIEW_REQUIRED" : "CLEAR",
    reviewReasons: review ? ["Fixture chronology requires review."] : [],
  };
}

function openRest(id: string, start: number, observedDuration: number): RestInterval {
  const observed = start + observedDuration;
  return {
    ...rest(id, start, observedDuration),
    endBoundary: null,
    endEpochMilliseconds: null,
    observedThroughEpochMilliseconds: observed,
    state: "OPEN",
  };
}

function unresolvedEndRest(id: string, start: number, wallDate: string, wallTime: string, observedThrough: number): RestInterval {
  const unresolved = resolveLondonWallTime(wallDate, wallTime);
  assert.equal(unresolved.resolution, "AMBIGUOUS_FOLD");
  const durations = unresolved.candidates.map((candidate) => candidate.epochMilliseconds - start).filter((duration) => duration > 0);
  assert.ok(durations.length);
  return {
    ...rest(id, start, Math.min(...durations), true),
    endBoundary: { sourceFactIds: [`fact:${id}:end`], role: "WORK_START", time: unresolved, epochMilliseconds: null },
    endEpochMilliseconds: null,
    observedThroughEpochMilliseconds: observedThrough,
    elapsedMilliseconds: null,
    elapsedRangeMilliseconds: { minimum: Math.min(...durations), maximum: Math.max(...durations) },
    state: "CLOSED",
  };
}

function unresolvedStartRest(id: string, wallDate: string, wallTime: string, end: number): RestInterval {
  const unresolved = resolveLondonWallTime(wallDate, wallTime);
  assert.equal(unresolved.resolution, "AMBIGUOUS_FOLD");
  const durations = unresolved.candidates.map((candidate) => end - candidate.epochMilliseconds).filter((duration) => duration > 0);
  assert.ok(durations.length);
  return {
    ...rest(id, end - Math.min(...durations), Math.min(...durations), true),
    startBoundary: { sourceFactIds: [`fact:${id}:start`], role: "WORK_END", time: unresolved, epochMilliseconds: null },
    startEpochMilliseconds: null,
    endBoundary: boundary(end, "WORK_START"),
    endEpochMilliseconds: end,
    observedThroughEpochMilliseconds: end,
    elapsedMilliseconds: null,
    elapsedRangeMilliseconds: { minimum: Math.min(...durations), maximum: Math.max(...durations) },
    state: "CLOSED",
  };
}

function nonexistentGapEndRest(id: string, start: number, wallDate: string, wallTime: string, observedThrough: number): RestInterval {
  const gap = resolveLondonWallTime(wallDate, wallTime);
  assert.equal(gap.resolution, "NONEXISTENT_GAP");
  assert.equal(gap.epochMilliseconds, null);
  assert.equal(gap.candidates.length, 0);
  return {
    ...rest(id, start, HOUR, true),
    endBoundary: { sourceFactIds: [`fact:${id}:end`], role: "WORK_START", time: gap, epochMilliseconds: null },
    endEpochMilliseconds: null,
    observedThroughEpochMilliseconds: observedThrough,
    elapsedMilliseconds: null,
    elapsedRangeMilliseconds: null,
    state: "CLOSED",
  };
}

function nonexistentGapStartRest(id: string, wallDate: string, wallTime: string, end: number): RestInterval {
  const gap = resolveLondonWallTime(wallDate, wallTime);
  assert.equal(gap.resolution, "NONEXISTENT_GAP");
  assert.equal(gap.epochMilliseconds, null);
  assert.equal(gap.candidates.length, 0);
  return {
    ...rest(id, end - HOUR, HOUR, true),
    startBoundary: { sourceFactIds: [`fact:${id}:start`], role: "WORK_END", time: gap, epochMilliseconds: null },
    startEpochMilliseconds: null,
    endBoundary: boundary(end, "WORK_START"),
    endEpochMilliseconds: end,
    observedThroughEpochMilliseconds: end,
    elapsedMilliseconds: null,
    elapsedRangeMilliseconds: null,
    state: "CLOSED",
  };
}

function component(
  id: string,
  restIntervalId: string,
  start: number,
  duration: number,
  classification: WeeklyRestComponent["classification"],
  role: WeeklyRestComponent["role"] = "COUNTED",
): WeeklyRestComponent {
  return {
    componentId: id,
    restIntervalId,
    sourceOptionId: `option:${id}`,
    componentIndex: 0,
    startEpochMilliseconds: start,
    endEpochMilliseconds: start + duration,
    startOffsetMilliseconds: 0,
    endOffsetMilliseconds: duration,
    durationMilliseconds: duration,
    classification,
    role,
    provenance: "EXPLICIT",
    reviewStatus: "CLEAR",
    reviewReasons: [],
  };
}

function branch(id: string, values: Array<{ component: WeeklyRestComponent; weekId?: string }>, review = false): AllocationBranch {
  const components = values.map((item) => item.component);
  const assignments = values.filter((item) => item.weekId && item.component.role === "COUNTED").map((item) => {
    const week = fixedLegalWeekForInstant(instant(item.weekId as string));
    return {
      assignmentId: `assignment:${id}:${item.component.componentId}:${item.weekId}`,
      fixedWeekId: item.weekId as string,
      componentId: item.component.componentId,
      assignmentRole: "COUNTED_FOR_FIXED_WEEK" as const,
      weekStartEpochMilliseconds: week.startEpochMilliseconds,
      weekEndEpochMilliseconds: week.endEpochMilliseconds,
    };
  });
  return {
    branchId: id,
    branchFingerprint: `fingerprint:${id}`,
    components,
    fixedWeekAssignments: assignments,
    additionalComponents: components.filter((item) => item.role === "ADDITIONAL"),
    rollingQualifyingRests: [],
    rollingCycleResets: [],
    twoWeekEvaluations: [],
    reviewStatus: review ? "REVIEW_REQUIRED" : "CLEAR",
    reviewReasons: review ? ["Fixture branch requires review."] : [],
    legalState: review ? "REVIEW" : "COMPLIANT",
    invalidReasons: [],
    sourceOptionIds: components.map((item) => item.sourceOptionId),
  };
}

const W1 = "2026-02-02";
const W2 = "2026-02-09";

function sourceBranch(id: string, duration: number, weekId = W1, role: WeeklyRestComponent["role"] = "COUNTED") {
  const start = instant(weekId, "12:00:00");
  const value = component(`component:${id}`, `source-rest:${id}`, start, duration, duration >= 45 * HOUR ? "REGULAR" : "REDUCED", role);
  return { component: value, branch: branch(`branch:${id}`, [{ component: value, weekId }]) };
}

function context(asOf: number, complete = true): CompensationEvaluationContext {
  return { asOfEpochMilliseconds: asOf, factualCoverageCompleteThroughAsOf: complete };
}

function firstEvaluation(result: ReturnType<typeof evaluateCompensation>) {
  assert.ok(result.branchEvaluations[0]);
  return result.branchEvaluations[0];
}

function regularBaseBranch(id: string, sources: Array<{ component: WeeklyRestComponent; weekId: string }>, repayment: RestInterval) {
  const regular = component(`component:${id}:regular-base`, repayment.restIntervalId, repayment.startEpochMilliseconds as number, 45 * HOUR, "REGULAR", "ADDITIONAL");
  return branch(`branch:${id}`, [...sources, { component: regular }]);
}

function evaluationWithOrdinaryRepayment(sourceHours: number, repaymentHours: number, id: string) {
  const source = sourceBranch(id, sourceHours * HOUR);
  const repayment = rest(`repayment:${id}`, instant("2026-02-10"), repaymentHours * HOUR);
  return { source, repayment, result: evaluateCompensation([repayment], [source.branch], context(instant("2026-02-20"))) };
}

test("T100", "counted 24h reduced Weekly Rest creates one obligation", () => {
  const source = sourceBranch("t100", 24 * HOUR);
  assert.equal(firstEvaluation(evaluateCompensation([], [source.branch], context(instant("2026-02-20")))).obligations.length, 1);
});

test("T101", "additional 24h reduced candidate creates no obligation", () => {
  const source = sourceBranch("t101", 24 * HOUR, W1, "ADDITIONAL");
  assert.equal(firstEvaluation(evaluateCompensation([], [source.branch], context(instant("2026-02-20")))).obligations.length, 0);
});

test("T102", "counted regular Weekly Rest creates no obligation", () => {
  const source = sourceBranch("t102", 45 * HOUR);
  assert.equal(firstEvaluation(evaluateCompensation([], [source.branch], context(instant("2026-02-20")))).obligations.length, 0);
});

test("T103", "24h reduced creates 21h compensation", () => {
  const source = sourceBranch("t103", 24 * HOUR);
  assert.equal(firstEvaluation(evaluateCompensation([], [source.branch], context(instant("2026-02-20")))).obligations[0].requiredCompensationMilliseconds, 21 * HOUR);
});

test("T104", "32h reduced creates 13h compensation", () => {
  const source = sourceBranch("t104", 32 * HOUR);
  assert.equal(firstEvaluation(evaluateCompensation([], [source.branch], context(instant("2026-02-20")))).obligations[0].requiredCompensationMilliseconds, 13 * HOUR);
});

test("T105", "44h59m reduced creates one minute compensation", () => {
  const source = sourceBranch("t105", 45 * HOUR - MINUTE);
  assert.equal(firstEvaluation(evaluateCompensation([], [source.branch], context(instant("2026-02-20")))).obligations[0].requiredCompensationMilliseconds, MINUTE);
});

test("T106", "source week comes from Phase 4 assignment", () => {
  const value = component("cross-source", "cross-source-rest", instant("2026-02-01", "12:00:00"), 35 * HOUR, "REDUCED");
  const valueBranch = branch("branch:t106", [{ component: value, weekId: W1 }]);
  const obligation = firstEvaluation(evaluateCompensation([], [valueBranch], context(instant("2026-02-20")))).obligations[0];
  assert.equal(obligation.sourceFixedWeekId, W1);
  assert.notEqual(fixedLegalWeekForInstant(value.startEpochMilliseconds).weekId, obligation.sourceFixedWeekId);
});

test("T107", "deadline is end of third following fixed week", () => {
  const source = sourceBranch("t107", 35 * HOUR);
  const obligation = firstEvaluation(evaluateCompensation([], [source.branch], context(instant("2026-02-20")))).obligations[0];
  assert.equal(obligation.deadlineFixedWeekId, "2026-03-02");
  assert.equal(obligation.deadlineEpochMilliseconds, instant("2026-03-02"));
});

test("T108", "deadline uses London civil weeks across DST", () => {
  const source = sourceBranch("t108", 35 * HOUR, "2026-03-16");
  const obligation = firstEvaluation(evaluateCompensation([], [source.branch], context(instant("2026-04-01")))).obligations[0];
  assert.equal(obligation.deadlineEpochMilliseconds, instant("2026-04-13"));
  assert.equal(obligation.deadlineEpochMilliseconds - instant("2026-03-16"), 671 * HOUR);
});

test("T109", "cross-week owners preserve branch-local deadlines", () => {
  const value = component("cross-owner", "cross-owner-rest", instant("2026-02-08"), 35 * HOUR, "REDUCED");
  const branches = [branch("branch:t109:w1", [{ component: value, weekId: W1 }]), branch("branch:t109:w2", [{ component: value, weekId: W2 }])];
  const result = evaluateCompensation([], branches, context(instant("2026-02-20")));
  assert.deepEqual([...new Set(result.branchEvaluations.map((item) => item.obligations[0].deadlineFixedWeekId))].sort(), ["2026-03-02", "2026-03-09"]);
});

test("T110", "repayment fit does not choose a favourable Phase 4 branch", () => {
  const a = sourceBranch("t110-a", 35 * HOUR).branch;
  const b = sourceBranch("t110-b", 40 * HOUR).branch;
  const repayment = rest("t110-repayment", instant("2026-02-10"), 14 * HOUR);
  const result = evaluateCompensation([repayment], [a, b], context(instant("2026-02-20")));
  assert.deepEqual([...new Set(result.branchEvaluations.map((item) => item.branchId))].sort(), [a.branchId, b.branchId].sort());
  assert.ok(result.branchEvaluations.some((item) => item.branchId === a.branchId && item.blocks.length === 0));
  assert.ok(result.branchEvaluations.some((item) => item.branchId === b.branchId && item.blocks.length === 1));
});

test("T111", "obligation must exist before repayment rest begins", () => {
  const source = sourceBranch("t111", 35 * HOUR);
  const repayment = rest("early-repayment", source.component.endEpochMilliseconds - HOUR, 19 * HOUR);
  assert.ok(evaluateCompensation([repayment], [source.branch], context(instant("2026-02-20"))).branchEvaluations.every((item) => item.blocks.length === 0));
});

test("T112", "source RestInterval cannot repay its own obligation", () => {
  const source = sourceBranch("t112", 35 * HOUR);
  const same = rest(source.component.restIntervalId, source.component.startEpochMilliseconds, 60 * HOUR);
  assert.ok(evaluateCompensation([same], [source.branch], context(instant("2026-02-20"))).branchEvaluations.every((item) => item.blocks.length === 0));
});

test("T113", "10h debt plus 9h base plus 10h block is valid", () => {
  const fixture = evaluationWithOrdinaryRepayment(35, 19, "t113");
  assert.ok(fixture.result.branchEvaluations.some((item) => item.blocks[0]?.durationMilliseconds === 10 * HOUR && item.attachmentBases[0]?.minimumRequiredMilliseconds === 9 * HOUR));
});

test("T114", "two 5h capacities cannot repay one 10h obligation", () => {
  const source = sourceBranch("t114", 35 * HOUR);
  const rests = [rest("five-a", instant("2026-02-10"), 14 * HOUR), rest("five-b", instant("2026-02-12"), 14 * HOUR)];
  assert.ok(evaluateCompensation(rests, [source.branch], context(instant("2026-02-20"))).branchEvaluations.every((item) => item.blocks.length === 0));
});

test("T115", "18h is insufficient for 9h base plus 10h compensation", () => {
  assert.ok(evaluationWithOrdinaryRepayment(35, 18, "t115").result.branchEvaluations.every((item) => item.blocks.length === 0));
});

function weeklyRepaymentFixture(id: string, totalHours: number, sourceHours = 35) {
  const source = sourceBranch(`${id}:source`, sourceHours * HOUR);
  const repayment = rest(`${id}:repayment`, instant("2026-02-10"), totalHours * HOUR);
  const valueBranch = regularBaseBranch(id, [{ component: source.component, weekId: W1 }], repayment);
  return { source, repayment, branch: valueBranch, result: evaluateCompensation([repayment], [valueBranch], context(instant("2026-02-20"))) };
}

test("T116", "45h regular Weekly Rest has no 10h compensation capacity", () => {
  assert.ok(weeklyRepaymentFixture("t116", 45).result.branchEvaluations.every((item) => item.blocks.length === 0));
});

test("T117", "55h regular-rest package supports 45h base plus 10h", () => {
  const fixture = weeklyRepaymentFixture("t117", 55);
  assert.ok(fixture.result.branchEvaluations.some((item) => item.blocks[0]?.durationMilliseconds === 10 * HOUR));
});

test("T118", "compensation block does not overlap reserved Weekly Rest", () => {
  const fixture = weeklyRepaymentFixture("t118", 55);
  const evaluation = fixture.result.branchEvaluations.find((item) => item.blocks.length === 1) as ReturnType<typeof firstEvaluation>;
  const baseComponent = fixture.branch.components.find((item) => item.restIntervalId === fixture.repayment.restIntervalId) as WeeklyRestComponent;
  assert.ok(evaluation.blocks[0].startEpochMilliseconds >= baseComponent.endEpochMilliseconds);
});

test("T119", "Weekly Rest minimum may be base while block stays additional", () => {
  const fixture = weeklyRepaymentFixture("t119", 55);
  const evaluation = fixture.result.branchEvaluations.find((item) => item.blocks.length === 1) as ReturnType<typeof firstEvaluation>;
  assert.equal(evaluation.attachmentBases[0].baseKind, "WEEKLY_REST_BASE");
  assert.ok(evaluation.attachmentBases[0].sourceWeeklyComponentId);
  assert.notEqual(evaluation.blocks[0].startEpochMilliseconds, evaluation.attachmentBases[0].startEpochMilliseconds);
});

test("T120", "one block cannot repay two obligations", () => {
  const fixture = weeklyRepaymentFixture("t120", 55);
  const evaluation = fixture.result.branchEvaluations.find((item) => item.blocks.length === 1) as ReturnType<typeof firstEvaluation>;
  assert.equal(new Set(evaluation.blocks.map((item) => item.obligationId)).size, evaluation.blocks.length);
});

function multiDebtFixture(id: string, extraHours: number, equalDeadline = false, ordinary = false) {
  const aStart = instant("2026-02-03");
  const bStart = equalDeadline ? instant("2026-02-06") : instant("2026-02-10");
  const a = component(`${id}:a`, `${id}:source-a`, aStart, 35 * HOUR, "REDUCED");
  const b = component(`${id}:b`, `${id}:source-b`, bStart, 40 * HOUR, "REDUCED");
  const repayment = rest(`${id}:repayment`, instant("2026-02-17"), (ordinary ? 9 : 45) * HOUR + extraHours * HOUR);
  const values: Array<{ component: WeeklyRestComponent; weekId?: string }> = [{ component: a, weekId: W1 }, { component: b, weekId: equalDeadline ? W1 : W2 }];
  if (!ordinary) values.push({ component: component(`${id}:base`, repayment.restIntervalId, repayment.startEpochMilliseconds as number, 45 * HOUR, "REGULAR", "ADDITIONAL") });
  const valueBranch = branch(`branch:${id}`, values);
  return { a, b, repayment, branch: valueBranch, result: evaluateCompensation([repayment], [valueBranch], context(instant("2026-02-25"))) };
}

test("T121", "separate obligations receive separate non-overlapping blocks", () => {
  const evaluation = multiDebtFixture("t121", 15).result.branchEvaluations.find((item) => item.blocks.length === 2) as ReturnType<typeof firstEvaluation>;
  assert.equal(new Set(evaluation.blocks.map((item) => item.obligationId)).size, 2);
  assert.ok(evaluation.blocks[0].endEpochMilliseconds <= evaluation.blocks[1].startEpochMilliseconds);
});

test("T122", "earliest deadline has priority when it fits", () => {
  const fixture = multiDebtFixture("t122", 10);
  const evaluation = fixture.result.branchEvaluations.find((item) => item.blocks.length === 1) as ReturnType<typeof firstEvaluation>;
  assert.equal(evaluation.blocks[0].obligationId, evaluation.obligations[0].obligationId);
});

test("T123", "equal deadline uses oldest source first", () => {
  const fixture = multiDebtFixture("t123", 10, true);
  const evaluation = fixture.result.branchEvaluations.find((item) => item.blocks.length === 1) as ReturnType<typeof firstEvaluation>;
  assert.equal(evaluation.blocks[0].obligationId, evaluation.obligations.find((item) => item.sourceComponentId === fixture.a.componentId)?.obligationId);
});

test("T124", "7h capacity skips earlier 10h and clears later 5h", () => {
  const fixture = multiDebtFixture("t124", 7);
  const evaluation = fixture.result.branchEvaluations.find((item) => item.blocks.length === 1) as ReturnType<typeof firstEvaluation>;
  assert.equal(evaluation.blocks[0].durationMilliseconds, 5 * HOUR);
  assert.equal(evaluation.obligationResults.find((item) => item.obligationId !== evaluation.blocks[0].obligationId)?.remainingCompensationMilliseconds, 10 * HOUR);
  assert.equal(evaluation.unallocatedCapacity[0].unusedCompensationMilliseconds, 2 * HOUR);
});

test("T125", "12h capacity clears earlier 10h and leaves later 5h", () => {
  const evaluation = multiDebtFixture("t125", 12).result.branchEvaluations.find((item) => item.blocks.length === 1) as ReturnType<typeof firstEvaluation>;
  assert.equal(evaluation.blocks[0].durationMilliseconds, 10 * HOUR);
  assert.equal(evaluation.obligationResults.find((item) => item.obligationId !== evaluation.blocks[0].obligationId)?.remainingCompensationMilliseconds, 5 * HOUR);
  assert.equal(evaluation.unallocatedCapacity[0].unusedCompensationMilliseconds, 2 * HOUR);
});

test("T126", "15h capacity clears both obligations", () => {
  const evaluation = multiDebtFixture("t126", 15).result.branchEvaluations.find((item) => item.blocks.length === 2) as ReturnType<typeof firstEvaluation>;
  assert.equal(evaluation.blocks.reduce((sum, item) => sum + item.durationMilliseconds, 0), 15 * HOUR);
});

test("T127", "insufficient capacity never partially reduces obligation", () => {
  const evaluation = multiDebtFixture("t127", 7).result.branchEvaluations.find((item) => item.blocks.length === 1) as ReturnType<typeof firstEvaluation>;
  const ten = evaluation.obligations.find((item) => item.requiredCompensationMilliseconds === 10 * HOUR) as NonNullable<typeof evaluation.obligations[number]>;
  assert.equal(evaluation.obligationResults.find((item) => item.obligationId === ten.obligationId)?.remainingCompensationMilliseconds, 10 * HOUR);
});

test("T128", "one regular Weekly Rest base carries multiple blocks", () => {
  const evaluation = multiDebtFixture("t128", 15).result.branchEvaluations.find((item) => item.blocks.length === 2) as ReturnType<typeof firstEvaluation>;
  assert.equal(new Set(evaluation.attachments.map((item) => item.baseId)).size, 1);
  assert.equal(evaluation.attachmentBases[0].sharedForMultipleBlocks, true);
});

test("T129", "ordinary 9h base is not shared across multiple debts", () => {
  const evaluation = multiDebtFixture("t129", 15, false, true).result.branchEvaluations.find((item) => item.blocks.length === 1) as ReturnType<typeof firstEvaluation>;
  assert.equal(evaluation.blocks.length, 1);
  assert.ok(evaluation.diagnostics.some((item) => item.code === "ORDINARY_SHARED_BASE_UNSUPPORTED"));
});

test("T130", "alternative branch debts are not summed", () => {
  const a = sourceBranch("t130-a", 35 * HOUR).branch;
  const b = sourceBranch("t130-b", 35 * HOUR).branch;
  const result = evaluateCompensation([], [a, b], context(instant("2026-02-20")));
  assert.ok(result.branchEvaluations.every((item) => item.obligations.length === 1));
});

test("T131", "branch source alternatives remain branch-local", () => {
  const a = sourceBranch("t131-a", 35 * HOUR).branch;
  const b = sourceBranch("t131-b", 35 * HOUR).branch;
  const result = evaluateCompensation([], [a, b], context(instant("2026-02-20")));
  for (const evaluation of result.branchEvaluations) assert.ok(evaluation.obligations.every((item) => item.branchId === evaluation.branchId));
});

test("T132", "equivalent public outcome can converge without losing provenance", () => {
  const a = sourceBranch("t132-a", 35 * HOUR).branch;
  const b = sourceBranch("t132-b", 35 * HOUR).branch;
  const result = evaluateCompensation([], [a, b], context(instant("2026-02-20")));
  assert.ok(result.convergences.some((item) => item.branchIds.includes(a.branchId) && item.branchIds.includes(b.branchId)));
  assert.deepEqual(new Set(result.branchEvaluations.map((item) => item.obligations[0].sourceComponentId).filter(Boolean)).size, 2);
});

test("T133", "historical source correction rebuilds obligations", () => {
  const oldBranch = sourceBranch("historical-old", 35 * HOUR).branch;
  const corrected = sourceBranch("historical-corrected", 35 * HOUR).branch;
  const oldResult = evaluateCompensation([], [oldBranch], context(instant("2026-02-20")));
  const newResult = evaluateCompensation([], [corrected], context(instant("2026-02-20")));
  assert.ok(JSON.stringify(oldResult).includes("historical-old"));
  assert.equal(JSON.stringify(newResult).includes("historical-old"), false);
});

function deadlineFixture(id: string, start: number, duration: number, review = false, open = false) {
  const source = sourceBranch(`${id}:source`, 35 * HOUR);
  const repayment = open ? openRest(`${id}:repayment`, start, duration) : rest(`${id}:repayment`, start, duration, review);
  const result = evaluateCompensation([repayment], [source.branch], context(Math.max(repayment.observedThroughEpochMilliseconds, instant("2026-03-02") + HOUR)));
  return { source, repayment, result, deadline: instant("2026-03-02") };
}

test("T134", "Case A base and full block complete by deadline", () => {
  const deadline = instant("2026-03-02");
  const fixture = deadlineFixture("t134", deadline - 20 * HOUR, 19 * HOUR);
  assert.ok(fixture.result.branchEvaluations.some((item) => item.attachments[0]?.deadlineCase === "CASE_A" && item.attachments[0]?.status === "COMPLETED_ON_TIME"));
});

test("T135", "Case A exact deadline equality is on time", () => {
  const deadline = instant("2026-03-02");
  const fixture = deadlineFixture("t135", deadline - 19 * HOUR, 19 * HOUR);
  assert.ok(fixture.result.branchEvaluations.some((item) => item.attachments[0]?.packageCompletionEpochMilliseconds === deadline && item.attachments[0]?.status === "COMPLETED_ON_TIME"));
});

test("T136", "ongoing rest with threshold accrued is provisional", () => {
  const deadline = instant("2026-03-02");
  const fixture = deadlineFixture("t136", deadline - 24 * HOUR, 20 * HOUR, false, true);
  assert.ok(fixture.result.branchEvaluations.some((item) => item.attachments[0]?.status === "THRESHOLD_REACHED_PROVISIONAL"));
});

test("T137", "Case B is explicit unresolved attachment deadline", () => {
  const deadline = instant("2026-03-02");
  const fixture = deadlineFixture("t137", deadline - 10 * HOUR, 19 * HOUR);
  assert.ok(fixture.result.branchEvaluations.some((item) => item.attachments[0]?.deadlineCase === "CASE_B" && item.attachments[0]?.status === "UNRESOLVED_ATTACHMENT_DEADLINE"));
});

test("T138", "Case B is not automatically completed", () => {
  const deadline = instant("2026-03-02");
  const evaluation = deadlineFixture("t138", deadline - 10 * HOUR, 19 * HOUR).result.branchEvaluations.find((item) => item.attachments[0]?.deadlineCase === "CASE_B") as ReturnType<typeof firstEvaluation>;
  assert.notEqual(evaluation.attachments[0].status, "COMPLETED_ON_TIME");
});

test("T139", "Case B is not automatically overdue", () => {
  const deadline = instant("2026-03-02");
  const evaluation = deadlineFixture("t139", deadline - 10 * HOUR, 19 * HOUR).result.branchEvaluations.find((item) => item.attachments[0]?.deadlineCase === "CASE_B") as ReturnType<typeof firstEvaluation>;
  assert.notEqual(evaluation.attachments[0].status, "OVERDUE");
});

test("T140", "Case C incomplete block at deadline is overdue", () => {
  const deadline = instant("2026-03-02");
  const fixture = deadlineFixture("t140", deadline - 18 * HOUR, 19 * HOUR);
  assert.ok(fixture.result.branchEvaluations.some((item) => item.attachments[0]?.deadlineCase === "CASE_C" && item.attachments[0]?.status === "OVERDUE"));
});

test("T141", "REVIEW uncertainty prevents strong overdue", () => {
  const deadline = instant("2026-03-02");
  const source = sourceBranch("t141", 35 * HOUR);
  const repayment = rest("t141-review", deadline - 19 * HOUR, 19 * HOUR, true);
  const result = firstEvaluation(evaluateCompensation([repayment], [source.branch], context(deadline + HOUR)));
  assert.equal(result.obligationResults[0].status, "REVIEW");
  assert.equal(result.obligationResults.some((item) => item.status === "OVERDUE"), false);
});

test("T142", "package completion is max of base and block completion", () => {
  const fixture = evaluationWithOrdinaryRepayment(35, 19, "t142");
  for (const evaluation of fixture.result.branchEvaluations) {
    const relation = evaluation.attachments[0];
    const base = evaluation.attachmentBases.find((item) => item.baseId === relation.baseId) as NonNullable<typeof evaluation.attachmentBases[number]>;
    const block = evaluation.blocks.find((item) => item.blockId === relation.blockId) as NonNullable<typeof evaluation.blocks[number]>;
    assert.equal(relation.packageCompletionEpochMilliseconds, Math.max(base.completionEpochMilliseconds, block.endEpochMilliseconds));
  }
});

test("T143", "planned future rest cannot repay", () => {
  const source = sourceBranch("t143", 35 * HOUR);
  const asOf = instant("2026-02-15");
  const future = rest("planned-future", instant("2026-02-16"), 19 * HOUR);
  assert.ok(evaluateCompensation([future], [source.branch], context(asOf)).branchEvaluations.every((item) => item.blocks.length === 0));
});

test("T144", "REVIEW_ONLY repayment cannot confirm completion", () => {
  const source = sourceBranch("t144", 35 * HOUR);
  const repayment = rest("review-repayment", instant("2026-02-10"), 19 * HOUR, true);
  const evaluation = firstEvaluation(evaluateCompensation([repayment], [source.branch], context(instant("2026-03-03"))));
  assert.equal(evaluation.blocks.length, 0);
  assert.equal(evaluation.obligationResults[0].status, "REVIEW");
});

test("T145", "pay and workflow metadata do not affect result", () => {
  const source = sourceBranch("t145", 35 * HOUR);
  const repayment = rest("neutral-repayment", instant("2026-02-10"), 19 * HOUR);
  const base = evaluateCompensation([repayment], [source.branch], context(instant("2026-02-20")));
  const decorated = evaluateCompensation([{ ...repayment, payWeek: "x", endWeek: true } as RestInterval], [{ ...source.branch, archive: true, screen: "preview", employer: "x" } as AllocationBranch], { ...context(instant("2026-02-20")), financialWeek: "x" } as CompensationEvaluationContext);
  assert.deepEqual(decorated, base);
});

test("T146", "pure engine has no ledger localStorage or Date.now", () => {
  const source = readFileSync(new URL("../src/rest-engine/compensation.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /localStorage|Date\.now|ledger/i);
});

test("T147", "compensation evaluation does not mutate Phase 4 branch", () => {
  const source = sourceBranch("t147", 35 * HOUR);
  const before = structuredClone(source.branch);
  evaluateCompensation([rest("t147-repayment", instant("2026-02-10"), 19 * HOUR)], [source.branch], context(instant("2026-02-20")));
  assert.deepEqual(source.branch, before);
});

test("T148", "IDs and allocation results are deterministic", () => {
  const fixture = weeklyRepaymentFixture("t148", 55);
  assert.deepEqual(evaluateCompensation([fixture.repayment], [fixture.branch], context(instant("2026-02-20"))), evaluateCompensation([structuredClone(fixture.repayment)], [structuredClone(fixture.branch)], context(instant("2026-02-20"))));
});

test("T149", "equivalent placements canonicalise without losing provenance", () => {
  const fixture = weeklyRepaymentFixture("t149", 55);
  const base = evaluateCompensation([fixture.repayment], [fixture.branch], context(instant("2026-02-20")));
  const duplicated = evaluateCompensation([fixture.repayment, structuredClone(fixture.repayment)], [fixture.branch], context(instant("2026-02-20")));
  assert.deepEqual(duplicated, base);
  assert.ok(duplicated.branchEvaluations.every((item) => item.obligations.every((value) => value.sourceComponentId && value.sourceRestIntervalId)));
});

test("T150", "long-rest allocation remains bounded", () => {
  const source = sourceBranch("t150", 24 * HOUR);
  const long = rest("t150-long", instant("2026-02-10"), 1000 * 24 * HOUR);
  const result = evaluateCompensation([long], [source.branch], context(long.endEpochMilliseconds as number));
  assert.ok(result.branchEvaluations.length <= 2);
  assert.ok(result.branchEvaluations.every((item) => item.blocks.length <= 1));
  assert.doesNotMatch(readFileSync(new URL("../src/rest-engine/compensation.ts", import.meta.url), "utf8"), /for\s*\([^)]*(minute|millisecond)/i);
});

test("T151", "earlier REVIEW repayment prevents false later overdue", () => {
  const deadline = instant("2026-03-02");
  const source = sourceBranch("t151", 35 * HOUR);
  const possibleOnTime = rest("t151-review-before-deadline", deadline - 30 * HOUR, 19 * HOUR, true);
  const clearLate = rest("t151-clear-late", deadline + HOUR, 19 * HOUR);
  const result = evaluateCompensation([possibleOnTime, clearLate], [source.branch], context(deadline + 24 * HOUR));
  assert.ok(result.branchEvaluations.every((item) => item.obligationResults[0]?.status === "REVIEW"));
  assert.ok(result.branchEvaluations.every((item) => item.attachments[0]?.status !== "OVERDUE"));
  assert.ok(result.branchEvaluations.every((item) => item.blocks.every((block) => block.restIntervalId === clearLate.restIntervalId)));
  assert.ok(result.branchEvaluations.every((item) => item.obligationResults[0]?.reviewReasons.includes("Fixture chronology requires review.")));
  assert.ok(result.branchEvaluations.every((item) => item.diagnostics.some((value) => value.code === "REPAYMENT_REVIEW_REQUIRED" && value.sourceIds.includes(possibleOnTime.restIntervalId))));

  const possibleCaseB = rest("t151-review-crossing-deadline", deadline - 10 * HOUR, 19 * HOUR, true);
  const crossingResult = evaluateCompensation([possibleCaseB, clearLate], [source.branch], context(deadline + 24 * HOUR));
  assert.ok(crossingResult.branchEvaluations.every((item) => item.obligationResults[0]?.status === "REVIEW"));
  assert.ok(crossingResult.branchEvaluations.every((item) => item.attachments[0]?.status !== "OVERDUE"));
});

test("T152", "incomplete factual coverage prevents false overdue", () => {
  const deadline = instant("2026-03-02");
  const source = sourceBranch("t152", 35 * HOUR);
  const clearLate = rest("t152-clear-late", deadline + HOUR, 19 * HOUR);
  const result = evaluateCompensation([clearLate], [source.branch], context(deadline + 24 * HOUR, false));
  assert.ok(result.branchEvaluations.every((item) => item.obligationResults[0]?.status === "REVIEW"));
  assert.ok(result.branchEvaluations.every((item) => item.attachments[0]?.deadlineCase === "CASE_C" && item.attachments[0]?.status === "REVIEW"));
  assert.ok(result.branchEvaluations.every((item) => item.obligationResults[0]?.reviewReasons.some((reason) => /coverage/i.test(reason))));
});

test("T153", "genuine complete-coverage late repayment remains overdue", () => {
  const deadline = instant("2026-03-02");
  const source = sourceBranch("t153", 35 * HOUR);
  const clearLate = rest("t153-clear-late", deadline + HOUR, 19 * HOUR);
  const result = evaluateCompensation([clearLate], [source.branch], context(deadline + 24 * HOUR, true));
  assert.ok(result.branchEvaluations.every((item) => item.attachments[0]?.deadlineCase === "CASE_C" && item.attachments[0]?.status === "OVERDUE"));
  assert.ok(result.branchEvaluations.every((item) => item.obligationResults[0]?.status === "OVERDUE"));
});

test("T154", "confirmed on-time completion is not downgraded by unrelated REVIEW", () => {
  const deadline = instant("2026-03-02");
  const source = sourceBranch("t154", 35 * HOUR);
  const reviewed = rest("t154-review", deadline - 50 * HOUR, 19 * HOUR, true);
  const clearOnTime = rest("t154-clear-on-time", deadline - 20 * HOUR, 19 * HOUR);
  const result = evaluateCompensation([reviewed, clearOnTime], [source.branch], context(deadline + HOUR, true));
  assert.ok(result.branchEvaluations.every((item) => item.attachments[0]?.deadlineCase === "CASE_A" && item.attachments[0]?.status === "COMPLETED_ON_TIME"));
  assert.ok(result.branchEvaluations.every((item) => item.obligationResults[0]?.status === "COMPLETED_ON_TIME"));
  assert.ok(result.branchEvaluations.every((item) => item.diagnostics.some((value) => value.code === "REPAYMENT_REVIEW_REQUIRED")));
});

test("T155", "REVIEW occurring only after deadline does not erase certain overdue", () => {
  const deadline = instant("2026-03-02");
  const source = sourceBranch("t155", 35 * HOUR);
  const reviewedLate = rest("t155-review-after-deadline", deadline + HOUR, 19 * HOUR, true);
  const clearLate = rest("t155-clear-late", deadline + 25 * HOUR, 19 * HOUR);
  const result = evaluateCompensation([reviewedLate, clearLate], [source.branch], context(deadline + 48 * HOUR, true));
  assert.ok(result.branchEvaluations.every((item) => item.attachments[0]?.deadlineCase === "CASE_C" && item.attachments[0]?.status === "OVERDUE"));
  assert.ok(result.branchEvaluations.every((item) => item.obligationResults[0]?.status === "OVERDUE"));
  assert.ok(result.branchEvaluations.every((item) => item.diagnostics.some((value) => value.code === "REPAYMENT_REVIEW_REQUIRED" && value.sourceIds.includes(reviewedLate.restIntervalId))));
});

test("T156", "unresolved end boundary prevents false overdue", () => {
  const deadline = instant("2026-10-26");
  const source = sourceBranch("t156", 35 * HOUR, "2026-09-28");
  const unresolved = unresolvedEndRest("t156-unresolved-end", instant("2026-10-24", "06:30:00"), "2026-10-25", "01:30:00", deadline + 24 * HOUR);
  const result = evaluateCompensation([unresolved], [source.branch], context(deadline + 24 * HOUR, true));
  assert.ok(result.branchEvaluations.every((item) => item.blocks.length === 0));
  assert.ok(result.branchEvaluations.every((item) => item.obligationResults[0]?.status === "REVIEW"));
  assert.ok(result.branchEvaluations.every((item) => item.obligationResults[0]?.reviewReasons.includes("Fixture chronology requires review.")));
  assert.ok(result.branchEvaluations.every((item) => item.obligationResults[0]?.status !== "OVERDUE"));
});

test("T157", "unresolved start boundary prevents false overdue", () => {
  const deadline = instant("2026-10-26");
  const source = sourceBranch("t157", 35 * HOUR, "2026-09-28");
  const unresolved = unresolvedStartRest("t157-unresolved-start", "2026-10-25", "01:30:00", instant("2026-10-25", "20:30:00"));
  const result = evaluateCompensation([unresolved], [source.branch], context(deadline + 24 * HOUR, true));
  assert.ok(result.branchEvaluations.every((item) => item.blocks.length === 0));
  assert.ok(result.branchEvaluations.every((item) => item.obligationResults[0]?.status === "REVIEW"));
  assert.ok(result.branchEvaluations.every((item) => item.obligationResults[0]?.reviewReasons.includes("Fixture chronology requires review.")));
});

test("T158", "unresolved boundary proven irrelevant does not erase genuine overdue", () => {
  const deadline = instant("2026-03-02");
  const source = sourceBranch("t158", 35 * HOUR);
  const irrelevant = unresolvedStartRest("t158-irrelevant", "2026-10-25", "01:30:00", instant("2026-10-25", "10:00:00"));
  const clearLate = rest("t158-clear-late", deadline + HOUR, 19 * HOUR);
  const result = evaluateCompensation([irrelevant, clearLate], [source.branch], context(instant("2026-10-26"), true));
  assert.ok(result.branchEvaluations.every((item) => item.attachments[0]?.deadlineCase === "CASE_C" && item.attachments[0]?.status === "OVERDUE"));
  assert.ok(result.branchEvaluations.every((item) => item.obligationResults[0]?.status === "OVERDUE"));
});

test("T159", "confirmed Case A wins over separate unresolved-boundary REVIEW", () => {
  const deadline = instant("2026-10-26");
  const source = sourceBranch("t159", 35 * HOUR, "2026-09-28");
  const clearOnTime = rest("t159-clear-on-time", instant("2026-10-23"), 19 * HOUR);
  const unresolved = unresolvedStartRest("t159-unresolved", "2026-10-25", "01:30:00", instant("2026-10-25", "20:30:00"));
  const result = evaluateCompensation([clearOnTime, unresolved], [source.branch], context(deadline + HOUR, true));
  assert.ok(result.branchEvaluations.every((item) => item.attachments[0]?.deadlineCase === "CASE_A" && item.attachments[0]?.status === "COMPLETED_ON_TIME"));
  assert.ok(result.branchEvaluations.every((item) => item.obligationResults[0]?.status === "COMPLETED_ON_TIME"));
  assert.ok(result.branchEvaluations.every((item) => item.diagnostics.some((value) => value.code === "REPAYMENT_REVIEW_REQUIRED" && value.sourceIds.includes(unresolved.restIntervalId))));
});

test("T160", "open ongoing rest keeps provisional threshold semantics", () => {
  const deadline = instant("2026-03-02");
  const source = sourceBranch("t160", 35 * HOUR);
  const ongoing = openRest("t160-open", deadline - 24 * HOUR, 20 * HOUR);
  const result = evaluateCompensation([ongoing], [source.branch], context(deadline + HOUR, true));
  assert.ok(result.branchEvaluations.every((item) => item.attachments[0]?.deadlineCase === "CASE_A" && item.attachments[0]?.status === "THRESHOLD_REACHED_PROVISIONAL"));
  assert.ok(result.branchEvaluations.every((item) => item.obligationResults[0]?.status === "THRESHOLD_REACHED_PROVISIONAL"));
});

test("T161", "NONEXISTENT_GAP prevents false strong overdue", () => {
  const deadline = instant("2026-03-30");
  const source = sourceBranch("t161", 35 * HOUR, "2026-03-02");
  const gapReview = nonexistentGapEndRest("t161-gap", instant("2026-03-28", "06:00:00"), "2026-03-29", "01:30:00", deadline + 24 * HOUR);
  const result = evaluateCompensation([gapReview], [source.branch], context(deadline + 24 * HOUR, true));
  assert.equal(gapReview.endBoundary?.time?.resolution, "NONEXISTENT_GAP");
  assert.equal(gapReview.endEpochMilliseconds, null);
  assert.equal(gapReview.endBoundary?.time?.candidates.length, 0);
  assert.ok(result.branchEvaluations.every((item) => item.blocks.length === 0 && item.attachmentBases.length === 0 && item.attachments.length === 0));
  assert.ok(result.branchEvaluations.every((item) => item.obligationResults[0]?.status === "REVIEW"));
  assert.ok(result.branchEvaluations.every((item) => item.obligationResults[0]?.reviewReasons.includes("Fixture chronology requires review.")));
});

test("T162", "no-candidate interval proven irrelevant does not erase genuine overdue", () => {
  const deadline = instant("2026-03-02");
  const source = sourceBranch("t162", 35 * HOUR);
  const clearLate = rest("t162-clear-late", deadline + HOUR, 19 * HOUR);
  const irrelevant = nonexistentGapEndRest("t162-gap-after-deadline", instant("2027-03-27", "06:00:00"), "2027-03-28", "01:30:00", instant("2027-03-29"));
  const result = evaluateCompensation([clearLate, irrelevant], [source.branch], context(instant("2027-03-29"), true));
  assert.ok(result.branchEvaluations.every((item) => item.blocks.every((block) => block.restIntervalId !== irrelevant.restIntervalId)));
  assert.ok(result.branchEvaluations.every((item) => item.attachments[0]?.deadlineCase === "CASE_C" && item.attachments[0]?.status === "OVERDUE"));
  assert.ok(result.branchEvaluations.every((item) => item.obligationResults[0]?.status === "OVERDUE"));
});

test("T163", "ambiguous-fold candidate and range behaviour remains unchanged", () => {
  const deadline = instant("2026-10-26");
  const source = sourceBranch("t163", 35 * HOUR, "2026-09-28");
  const ambiguous = unresolvedEndRest("t163-fold", instant("2026-10-24", "06:30:00"), "2026-10-25", "01:30:00", deadline + 24 * HOUR);
  const result = evaluateCompensation([ambiguous], [source.branch], context(deadline + 24 * HOUR, true));
  assert.equal(ambiguous.endBoundary?.time?.resolution, "AMBIGUOUS_FOLD");
  assert.equal(ambiguous.endBoundary?.time?.candidates.length, 2);
  assert.ok(result.branchEvaluations.every((item) => item.blocks.length === 0 && item.obligationResults[0]?.status === "REVIEW"));
});

test("T164", "clear Case A wins over separate no-candidate REVIEW", () => {
  const deadline = instant("2026-03-30");
  const source = sourceBranch("t164", 35 * HOUR, "2026-03-02");
  const clearOnTime = rest("t164-clear-on-time", instant("2026-03-27"), 19 * HOUR);
  const gapReview = nonexistentGapEndRest("t164-gap", instant("2026-03-28", "06:00:00"), "2026-03-29", "01:30:00", deadline + HOUR);
  const result = evaluateCompensation([clearOnTime, gapReview], [source.branch], context(deadline + HOUR, true));
  assert.ok(result.branchEvaluations.every((item) => item.attachments[0]?.deadlineCase === "CASE_A" && item.attachments[0]?.status === "COMPLETED_ON_TIME"));
  assert.ok(result.branchEvaluations.every((item) => item.obligationResults[0]?.status === "COMPLETED_ON_TIME"));
  assert.ok(result.branchEvaluations.every((item) => item.diagnostics.some((value) => value.code === "REPAYMENT_REVIEW_REQUIRED" && value.sourceIds.includes(gapReview.restIntervalId))));
});

test("T165", "open rest is not treated as NONEXISTENT_GAP history", () => {
  const deadline = instant("2026-03-02");
  const source = sourceBranch("t165", 35 * HOUR);
  const ongoing = openRest("t165-open", deadline - 24 * HOUR, 20 * HOUR);
  const result = evaluateCompensation([ongoing], [source.branch], context(deadline + HOUR, true));
  assert.equal(ongoing.state, "OPEN");
  assert.equal(ongoing.endBoundary, null);
  assert.ok(result.branchEvaluations.every((item) => item.attachments[0]?.status === "THRESHOLD_REACHED_PROVISIONAL"));
  assert.ok(result.branchEvaluations.every((item) => item.obligationResults[0]?.status === "THRESHOLD_REACHED_PROVISIONAL"));
});

test("T166", "unresolved START processed after late clear still blocks overdue", () => {
  const deadline = instant("2026-10-26");
  const source = sourceBranch("t166", 35 * HOUR, "2026-09-28");
  const unresolved = unresolvedStartRest("t166-unresolved-start", "2026-10-25", "01:30:00", instant("2026-10-25", "20:30:00"));
  const clearLate = rest("t166-clear-late", deadline + HOUR, 19 * HOUR);
  const result = evaluateCompensation([clearLate, unresolved], [source.branch], context(deadline + 24 * HOUR, true));
  assert.ok(result.branchEvaluations.every((item) => item.blocks.some((block) => block.restIntervalId === clearLate.restIntervalId)));
  assert.ok(result.branchEvaluations.every((item) => item.obligationResults[0]?.status === "REVIEW"));
  assert.ok(result.branchEvaluations.every((item) => item.attachments.every((attachment) => attachment.status !== "OVERDUE")));
  assert.ok(result.branchEvaluations.every((item) => item.obligationResults[0]?.reviewReasons.includes("Fixture chronology requires review.")));
});

test("T167", "no-candidate unresolved START processed after late clear blocks overdue", () => {
  const deadline = instant("2026-03-30");
  const source = sourceBranch("t167", 35 * HOUR, "2026-03-02");
  const unresolved = nonexistentGapStartRest("t167-gap-start", "2026-03-29", "01:30:00", instant("2026-03-29", "22:00:00"));
  const clearLate = rest("t167-clear-late", deadline + HOUR, 19 * HOUR);
  const result = evaluateCompensation([clearLate, unresolved], [source.branch], context(deadline + 24 * HOUR, true));
  assert.ok(result.branchEvaluations.every((item) => item.blocks.every((block) => block.restIntervalId !== unresolved.restIntervalId)));
  assert.ok(result.branchEvaluations.every((item) => item.obligationResults[0]?.status === "REVIEW"));
  assert.ok(result.branchEvaluations.every((item) => item.attachments.every((attachment) => attachment.status !== "OVERDUE")));
});

test("T168", "clear Case A wins after final uncertainty gate", () => {
  const deadline = instant("2026-10-26");
  const source = sourceBranch("t168", 35 * HOUR, "2026-09-28");
  const clearOnTime = rest("t168-clear-on-time", instant("2026-10-23"), 19 * HOUR);
  const unresolved = unresolvedStartRest("t168-unresolved-start", "2026-10-25", "01:30:00", instant("2026-10-25", "20:30:00"));
  const result = evaluateCompensation([clearOnTime, unresolved], [source.branch], context(deadline + HOUR, true));
  assert.ok(result.branchEvaluations.every((item) => item.attachments[0]?.deadlineCase === "CASE_A" && item.attachments[0]?.status === "COMPLETED_ON_TIME"));
  assert.ok(result.branchEvaluations.every((item) => item.obligationResults[0]?.status === "COMPLETED_ON_TIME"));
});

test("T169", "later clear Case B plus earlier unresolved possibility remains generic REVIEW", () => {
  const deadline = instant("2026-10-26");
  const source = sourceBranch("t169", 35 * HOUR, "2026-09-28");
  const unresolved = unresolvedStartRest("t169-unresolved-start", "2026-10-25", "01:30:00", instant("2026-10-25", "20:30:00"));
  const clearCaseB = rest("t169-clear-case-b", deadline - 10 * HOUR, 19 * HOUR);
  const result = evaluateCompensation([clearCaseB, unresolved], [source.branch], context(deadline + 24 * HOUR, true));
  const caseB = result.branchEvaluations.find((item) => item.attachments[0]?.deadlineCase === "CASE_B") as ReturnType<typeof firstEvaluation>;
  assert.equal(caseB.attachments[0].status, "UNRESOLVED_ATTACHMENT_DEADLINE");
  assert.equal(caseB.obligationResults[0].status, "REVIEW");
  assert.ok(caseB.obligationResults[0].reviewReasons.some((reason) => /Case B/.test(reason)));
  assert.ok(caseB.obligationResults[0].reviewReasons.includes("Fixture chronology requires review."));
});

test("T170", "no-candidate exact-start block feasibility proves irrelevance with inclusive equality", () => {
  const deadline = instant("2026-03-02");
  const source = sourceBranch("t170", 35 * HOUR);
  const clearLate = rest("t170-clear-late", deadline + HOUR, 19 * HOUR);
  const tooLate = nonexistentGapEndRest("t170-too-late", deadline - HOUR, "2026-03-29", "01:30:00", instant("2026-03-30"));
  const tooLateResult = evaluateCompensation([tooLate, clearLate], [source.branch], context(instant("2026-03-30"), true));
  assert.ok(tooLateResult.branchEvaluations.every((item) => item.attachments[0]?.deadlineCase === "CASE_C" && item.obligationResults[0]?.status === "OVERDUE"));

  const exactBlockFit = nonexistentGapEndRest("t170-exact-fit", deadline - 10 * HOUR, "2026-03-29", "01:30:00", instant("2026-03-30"));
  const inclusiveResult = evaluateCompensation([exactBlockFit, clearLate], [source.branch], context(instant("2026-03-30"), true));
  assert.ok(inclusiveResult.branchEvaluations.every((item) => item.obligationResults[0]?.status === "REVIEW"));
});

test("T171", "exact end proves no package fits from earliest eligible start", () => {
  const sourceStart = instant("2026-03-27", "12:00:00");
  const sourceComponent = component("component:t171", "source-rest:t171", sourceStart, 35 * HOUR, "REDUCED");
  const source = branch("branch:t171", [{ component: sourceComponent, weekId: "2026-03-23" }]);
  const deadline = instant("2026-04-20");
  const unresolved = nonexistentGapStartRest("t171-gap-start", "2026-03-29", "01:30:00", instant("2026-03-29", "03:00:00"));
  const clearLate = rest("t171-clear-late", deadline + HOUR, 19 * HOUR);
  const result = evaluateCompensation([clearLate, unresolved], [source], context(deadline + 24 * HOUR, true));
  assert.ok(result.branchEvaluations.every((item) => item.attachments[0]?.deadlineCase === "CASE_C" && item.attachments[0]?.status === "OVERDUE"));
  assert.ok(result.branchEvaluations.every((item) => item.obligationResults[0]?.status === "OVERDUE"));
});

function multiDebtUncertaintyFixture(id: string, laterStart: number, laterHours: number, regularBase = false) {
  const a = component(`${id}:a`, `${id}:source-a`, instant("2026-02-03"), 35 * HOUR, "REDUCED");
  const b = component(`${id}:b`, `${id}:source-b`, instant("2026-02-10"), 40 * HOUR, "REDUCED");
  const earlierReview = rest(`${id}:earlier-review`, instant("2026-02-06"), 19 * HOUR, true);
  const laterClear = rest(`${id}:later-clear`, laterStart, laterHours * HOUR);
  const values: Array<{ component: WeeklyRestComponent; weekId?: string }> = [
    { component: a, weekId: W1 },
    { component: b, weekId: W2 },
  ];
  if (regularBase) {
    values.push({
      component: component(`${id}:regular-base`, laterClear.restIntervalId, laterStart, 45 * HOUR, "REGULAR", "ADDITIONAL"),
    });
  }
  const valueBranch = branch(`branch:${id}`, values);
  const result = evaluateCompensation([earlierReview, laterClear], [valueBranch], context(laterClear.endEpochMilliseconds as number, true));
  return { a, b, earlierReview, laterClear, branch: valueBranch, result };
}

const allocationDependencyReason = "Clear compensation capacity for this obligation depends on unresolved repayment of a higher-priority obligation.";

test("T172", "uncertain repayment of earlier debt prevents false overdue on later debt", () => {
  const fixture = multiDebtUncertaintyFixture("t172", instant("2026-03-03"), 19);
  for (const evaluation of fixture.result.branchEvaluations) {
    const obligationA = evaluation.obligations.find((item) => item.sourceComponentId === fixture.a.componentId) as NonNullable<typeof evaluation.obligations[number]>;
    const obligationB = evaluation.obligations.find((item) => item.sourceComponentId === fixture.b.componentId) as NonNullable<typeof evaluation.obligations[number]>;
    const resultA = evaluation.obligationResults.find((item) => item.obligationId === obligationA.obligationId);
    const resultB = evaluation.obligationResults.find((item) => item.obligationId === obligationB.obligationId);
    assert.equal(resultA?.status, "REVIEW");
    assert.equal(resultB?.status, "REVIEW");
    assert.notEqual(resultB?.status, "OVERDUE");
    assert.notEqual(resultB?.status, "COMPLETED_ON_TIME");
    assert.ok(evaluation.blocks.some((block) => block.obligationId === obligationA.obligationId && block.restIntervalId === fixture.laterClear.restIntervalId));
    assert.equal(evaluation.blocks.some((block) => block.obligationId === obligationB.obligationId), false);
    assert.ok(resultB?.reviewReasons.includes(allocationDependencyReason));
    assert.ok(evaluation.diagnostics.some((item) =>
      item.code === "REPAYMENT_REVIEW_REQUIRED"
      && item.reason === allocationDependencyReason
      && item.sourceIds.includes(obligationA.obligationId)
      && item.sourceIds.includes(obligationB.obligationId)
      && item.sourceIds.includes(fixture.laterClear.restIntervalId)
    ));
  }
});

test("T173", "no propagation when earlier debt cannot fit", () => {
  const fixture = multiDebtUncertaintyFixture("t173", instant("2026-03-03"), 14);
  for (const evaluation of fixture.result.branchEvaluations) {
    const obligationA = evaluation.obligations.find((item) => item.sourceComponentId === fixture.a.componentId) as NonNullable<typeof evaluation.obligations[number]>;
    const obligationB = evaluation.obligations.find((item) => item.sourceComponentId === fixture.b.componentId) as NonNullable<typeof evaluation.obligations[number]>;
    const resultA = evaluation.obligationResults.find((item) => item.obligationId === obligationA.obligationId);
    const resultB = evaluation.obligationResults.find((item) => item.obligationId === obligationB.obligationId);
    assert.equal(resultA?.status, "REVIEW");
    assert.equal(resultB?.status, "COMPLETED_ON_TIME");
    assert.ok(evaluation.blocks.some((block) => block.obligationId === obligationB.obligationId));
    assert.equal(resultB?.reviewReasons.includes(allocationDependencyReason), false);
  }
});

test("T174", "enough regular-base capacity for both debts does not create false review", () => {
  const fixture = multiDebtUncertaintyFixture("t174", instant("2026-03-03"), 60, true);
  const evaluations = fixture.result.branchEvaluations.filter((item) => item.blocks.length === 2);
  assert.ok(evaluations.length > 0);
  for (const evaluation of evaluations) {
    const obligationB = evaluation.obligations.find((item) => item.sourceComponentId === fixture.b.componentId) as NonNullable<typeof evaluation.obligations[number]>;
    const resultB = evaluation.obligationResults.find((item) => item.obligationId === obligationB.obligationId);
    assert.equal(resultB?.status, "COMPLETED_ON_TIME");
    assert.equal(resultB?.reviewReasons.includes(allocationDependencyReason), false);
    assert.equal(new Set(evaluation.blocks.map((block) => `${block.startEpochMilliseconds}:${block.endEpochMilliseconds}`)).size, 2);
  }
});

test("T175", "contention only after later debt deadline does not block genuine overdue", () => {
  const fixture = multiDebtUncertaintyFixture("t175", instant("2026-03-10"), 19);
  for (const evaluation of fixture.result.branchEvaluations) {
    const obligationA = evaluation.obligations.find((item) => item.sourceComponentId === fixture.a.componentId) as NonNullable<typeof evaluation.obligations[number]>;
    const obligationB = evaluation.obligations.find((item) => item.sourceComponentId === fixture.b.componentId) as NonNullable<typeof evaluation.obligations[number]>;
    const resultA = evaluation.obligationResults.find((item) => item.obligationId === obligationA.obligationId);
    const resultB = evaluation.obligationResults.find((item) => item.obligationId === obligationB.obligationId);
    assert.equal(resultA?.status, "REVIEW");
    assert.equal(resultB?.status, "OVERDUE");
    assert.equal(resultB?.reviewReasons.includes(allocationDependencyReason), false);
  }
});

function structuredTimingFixture(
  id: string,
  aSourceStart: number,
  aSourceHours: number,
  aWeekId: string,
  bSourceStart: number,
  bSourceHours: number,
  bWeekId: string,
  review: RestInterval,
  clearStart: number,
) {
  const a = component(`${id}:a`, `${id}:source-a`, aSourceStart, aSourceHours * HOUR, "REDUCED");
  const b = component(`${id}:b`, `${id}:source-b`, bSourceStart, bSourceHours * HOUR, "REDUCED");
  const clear = rest(`${id}:clear`, clearStart, 19 * HOUR);
  const valueBranch = branch(`branch:${id}`, [{ component: a, weekId: aWeekId }, { component: b, weekId: bWeekId }]);
  const bDeadline = compensationDeadlineForWeek(fixedLegalWeekForInstant(instant(bWeekId))).epochMilliseconds;
  const result = evaluateCompensation([clear, review], [valueBranch], context(bDeadline + HOUR, true));
  return { a, b, review, clear, branch: valueBranch, result };
}

function obligationAndResult(evaluation: ReturnType<typeof firstEvaluation>, componentId: string) {
  const obligation = evaluation.obligations.find((item) => item.sourceComponentId === componentId) as NonNullable<typeof evaluation.obligations[number]>;
  const result = evaluation.obligationResults.find((item) => item.obligationId === obligation.obligationId) as NonNullable<typeof evaluation.obligationResults[number]>;
  return { obligation, result };
}

test("T176", "unresolved start candidate before pre-deadline contested capacity propagates", () => {
  const review = unresolvedStartRest("t176:review", "2026-10-25", "01:30:00", instant("2026-10-25", "20:30:00"));
  const fixture = structuredTimingFixture(
    "t176",
    instant("2026-10-06"),
    35,
    "2026-10-05",
    instant("2026-10-26"),
    40,
    "2026-10-26",
    review,
    instant("2026-10-28"),
  );
  assert.equal(review.startEpochMilliseconds, null);
  assert.ok(review.startBoundary?.time?.candidates.length);
  for (const evaluation of fixture.result.branchEvaluations) {
    const a = obligationAndResult(evaluation, fixture.a.componentId);
    const b = obligationAndResult(evaluation, fixture.b.componentId);
    assert.equal(a.result.status, "COMPLETED_ON_TIME");
    assert.equal(b.result.status, "REVIEW");
    assert.notEqual(b.result.status, "OVERDUE");
    assert.notEqual(b.result.status, "COMPLETED_ON_TIME");
    assert.ok(evaluation.blocks.some((block) => block.obligationId === a.obligation.obligationId && block.restIntervalId === fixture.clear.restIntervalId));
    assert.equal(evaluation.blocks.some((block) => block.obligationId === b.obligation.obligationId), false);
    assert.ok(b.result.reviewReasons.includes(allocationDependencyReason));
  }
});

test("T177", "review repayment definitely after contested capacity does not propagate", () => {
  const review = unresolvedStartRest("t177:review", "2026-10-25", "01:30:00", instant("2026-10-25", "15:30:00"));
  const fixture = structuredTimingFixture(
    "t177",
    instant("2026-09-29"),
    40,
    "2026-09-28",
    instant("2026-10-20"),
    35,
    "2026-10-19",
    review,
    instant("2026-10-23"),
  );
  for (const evaluation of fixture.result.branchEvaluations) {
    const a = obligationAndResult(evaluation, fixture.a.componentId);
    const b = obligationAndResult(evaluation, fixture.b.componentId);
    assert.equal(a.result.status, "COMPLETED_ON_TIME");
    assert.equal(b.result.status, "OVERDUE");
    assert.equal(b.result.reviewReasons.includes(allocationDependencyReason), false);
    assert.ok(evaluation.blocks.some((block) => block.obligationId === a.obligation.obligationId));
  }
});

test("T178", "candidate timing straddling contested capacity propagates review", () => {
  const review = unresolvedStartRest("t178:review", "2026-10-25", "01:30:00", instant("2026-10-25", "16:00:00"));
  const fixture = structuredTimingFixture(
    "t178",
    instant("2026-09-29"),
    40,
    "2026-09-28",
    instant("2026-10-20"),
    35,
    "2026-10-19",
    review,
    instant("2026-10-25", "15:00:00"),
  );
  for (const evaluation of fixture.result.branchEvaluations) {
    const a = obligationAndResult(evaluation, fixture.a.componentId);
    const b = obligationAndResult(evaluation, fixture.b.componentId);
    assert.ok(evaluation.blocks.some((block) => block.obligationId === a.obligation.obligationId));
    assert.equal(evaluation.blocks.some((block) => block.obligationId === b.obligation.obligationId), false);
    assert.equal(b.result.status, "REVIEW");
    assert.notEqual(b.result.status, "COMPLETED_ON_TIME");
    assert.ok(b.result.reviewReasons.includes(allocationDependencyReason));
  }
});

test("T179", "no-candidate timing not provably after capacity remains material review", () => {
  const review = nonexistentGapStartRest("t179:review", "2026-03-29", "01:30:00", instant("2026-03-29", "22:00:00"));
  const fixture = structuredTimingFixture(
    "t179",
    instant("2026-03-10"),
    35,
    "2026-03-09",
    instant("2026-03-30"),
    40,
    "2026-03-30",
    review,
    instant("2026-04-01"),
  );
  assert.equal(review.startBoundary?.time?.resolution, "NONEXISTENT_GAP");
  assert.equal(review.startBoundary?.time?.candidates.length, 0);
  for (const evaluation of fixture.result.branchEvaluations) {
    const a = obligationAndResult(evaluation, fixture.a.componentId);
    const b = obligationAndResult(evaluation, fixture.b.componentId);
    assert.ok(evaluation.blocks.some((block) => block.obligationId === a.obligation.obligationId));
    assert.equal(evaluation.blocks.some((block) => block.obligationId === b.obligation.obligationId), false);
    assert.equal(b.result.status, "REVIEW");
    assert.notEqual(b.result.status, "COMPLETED_ON_TIME");
    assert.ok(b.result.reviewReasons.includes(allocationDependencyReason));
  }

  const afterCapacityReview = unresolvedStartRest("t179:after-control", "2026-10-25", "01:30:00", instant("2026-10-25", "15:30:00"));
  const control = structuredTimingFixture(
    "t179-control",
    instant("2026-09-29"),
    40,
    "2026-09-28",
    instant("2026-10-20"),
    35,
    "2026-10-19",
    afterCapacityReview,
    instant("2026-10-23"),
  );
  assert.ok(control.result.branchEvaluations.every((evaluation) => {
    const b = obligationAndResult(evaluation, control.b.componentId);
    return b.result.status === "OVERDUE" && !b.result.reviewReasons.includes(allocationDependencyReason);
  }));
});

function threeDebtAlternateFixture(
  id: string,
  aDebtHours: number,
  bDebtHours: number,
  cDebtHours: number,
  clearCompensationHours: number,
  regularBase = false,
) {
  const a = component(`${id}:a`, `${id}:source-a`, instant("2026-02-02"), (45 - aDebtHours) * HOUR, "REDUCED");
  const b = component(`${id}:b`, `${id}:source-b`, instant("2026-02-05"), (45 - bDebtHours) * HOUR, "REDUCED");
  const c = component(`${id}:c`, `${id}:source-c`, instant("2026-02-07"), (45 - cDebtHours) * HOUR, "REDUCED");
  const earlierReview = rest(`${id}:earlier-review`, instant("2026-02-04"), (9 + aDebtHours) * HOUR, true);
  const clear = rest(`${id}:clear`, instant("2026-02-10"), ((regularBase ? 45 : 9) + clearCompensationHours) * HOUR);
  const values: Array<{ component: WeeklyRestComponent; weekId?: string }> = [
    { component: a, weekId: W1 },
    { component: b, weekId: W1 },
    { component: c, weekId: W1 },
  ];
  if (regularBase) {
    values.push({
      component: component(`${id}:regular-base`, clear.restIntervalId, clear.startEpochMilliseconds as number, 45 * HOUR, "REGULAR", "ADDITIONAL"),
    });
  }
  const valueBranch = branch(`branch:${id}`, values);
  const result = evaluateCompensation([earlierReview, clear], [valueBranch], context(instant("2026-03-03"), true));
  return { a, b, c, earlierReview, clear, branch: valueBranch, result };
}

function primaryAOnlyEvaluations(fixture: ReturnType<typeof threeDebtAlternateFixture>) {
  return fixture.result.branchEvaluations.filter((evaluation) => {
    const a = evaluation.obligations.find((item) => item.sourceComponentId === fixture.a.componentId);
    const b = evaluation.obligations.find((item) => item.sourceComponentId === fixture.b.componentId);
    const c = evaluation.obligations.find((item) => item.sourceComponentId === fixture.c.componentId);
    return a && b && c
      && evaluation.blocks.some((block) => block.obligationId === a.obligationId && block.restIntervalId === fixture.clear.restIntervalId)
      && !evaluation.blocks.some((block) => block.obligationId === b.obligationId || block.obligationId === c.obligationId);
  });
}

test("T180", "one ordinary alternate capacity cannot independently support B and C", () => {
  const fixture = threeDebtAlternateFixture("t180", 5, 5, 5, 5);
  const evaluations = primaryAOnlyEvaluations(fixture);
  assert.ok(evaluations.length > 0);
  for (const evaluation of evaluations) {
    const a = obligationAndResult(evaluation, fixture.a.componentId);
    const b = obligationAndResult(evaluation, fixture.b.componentId);
    const c = obligationAndResult(evaluation, fixture.c.componentId);
    assert.equal(a.result.status, "COMPLETED_ON_TIME");
    assert.equal(b.result.status, "REVIEW");
    assert.ok(b.result.reviewReasons.includes(allocationDependencyReason));
    assert.equal(c.result.status, "OVERDUE");
    assert.equal(c.result.reviewReasons.includes(allocationDependencyReason), false);
    assert.equal(evaluation.blocks.length, 1);
  }
});

test("T181", "alternate replay keeps skip-fit priority and lets a smaller later debt fit", () => {
  const fixture = threeDebtAlternateFixture("t181", 5, 10, 5, 5);
  const evaluations = primaryAOnlyEvaluations(fixture);
  assert.ok(evaluations.length > 0);
  for (const evaluation of evaluations) {
    const b = obligationAndResult(evaluation, fixture.b.componentId);
    const c = obligationAndResult(evaluation, fixture.c.componentId);
    assert.equal(b.result.status, "OVERDUE");
    assert.equal(b.result.reviewReasons.includes(allocationDependencyReason), false);
    assert.equal(c.result.status, "REVIEW");
    assert.ok(c.result.reviewReasons.includes(allocationDependencyReason));
    assert.equal(evaluation.blocks.length, 1);
  }
});

test("T182", "ordinary base remains single-use in alternate replay despite spare raw capacity", () => {
  const fixture = threeDebtAlternateFixture("t182", 5, 5, 5, 10);
  const evaluations = primaryAOnlyEvaluations(fixture);
  assert.ok(evaluations.length > 0);
  for (const evaluation of evaluations) {
    const b = obligationAndResult(evaluation, fixture.b.componentId);
    const c = obligationAndResult(evaluation, fixture.c.componentId);
    assert.equal(b.result.status, "REVIEW");
    assert.ok(b.result.reviewReasons.includes(allocationDependencyReason));
    assert.equal(c.result.status, "OVERDUE");
    assert.equal(c.result.reviewReasons.includes(allocationDependencyReason), false);
    assert.equal(evaluation.blocks.length, 1);
  }
});

test("T183", "shareable regular base sequentially supports B and C in alternate replay", () => {
  const fixture = threeDebtAlternateFixture("t183", 10, 5, 5, 10, true);
  const evaluations = primaryAOnlyEvaluations(fixture);
  assert.ok(evaluations.length > 0);
  for (const evaluation of evaluations) {
    const b = obligationAndResult(evaluation, fixture.b.componentId);
    const c = obligationAndResult(evaluation, fixture.c.componentId);
    assert.equal(b.result.status, "REVIEW");
    assert.equal(c.result.status, "REVIEW");
    assert.ok(b.result.reviewReasons.includes(allocationDependencyReason));
    assert.ok(c.result.reviewReasons.includes(allocationDependencyReason));
    assert.equal(evaluation.blocks.length, 1);
  }
});

const jointAllocationDependencyReason = "Clear compensation capacity for this obligation depends on a jointly compatible unresolved repayment state for higher-priority obligations.";

function regularClearBranch(
  id: string,
  sources: WeeklyRestComponent[],
  clear: RestInterval,
  compensationHours: number,
) {
  return branch(`branch:${id}`, [
    ...sources.map((value) => ({ component: value, weekId: W1 })),
    {
      component: component(`${id}:regular-base`, clear.restIntervalId, clear.startEpochMilliseconds as number, 45 * HOUR, "REGULAR", "ADDITIONAL"),
    },
  ]);
}

test("T184", "independent uncertain higher repayments jointly free enough capacity for C", () => {
  const a = component("t184:a", "t184:source-a", instant("2026-02-02"), 40 * HOUR, "REDUCED");
  const b = component("t184:b", "t184:source-b", instant("2026-02-05"), 40 * HOUR, "REDUCED");
  const c = component("t184:c", "t184:source-c", instant("2026-02-08"), 35 * HOUR, "REDUCED");
  const reviewA = rest("t184:review-a", instant("2026-02-04"), 14 * HOUR, true);
  const reviewB = rest("t184:review-b", instant("2026-02-07"), 14 * HOUR, true);
  const clear = rest("t184:clear", instant("2026-02-11"), 55 * HOUR);
  const valueBranch = regularClearBranch("t184", [a, b, c], clear, 10);
  const result = evaluateCompensation([reviewA, reviewB, clear], [valueBranch], context(instant("2026-03-03"), true));
  const evaluations = result.branchEvaluations.filter((evaluation) => {
    const oa = evaluation.obligations.find((item) => item.sourceComponentId === a.componentId);
    const ob = evaluation.obligations.find((item) => item.sourceComponentId === b.componentId);
    const oc = evaluation.obligations.find((item) => item.sourceComponentId === c.componentId);
    return oa && ob && oc
      && evaluation.blocks.some((block) => block.obligationId === oa.obligationId && block.restIntervalId === clear.restIntervalId)
      && evaluation.blocks.some((block) => block.obligationId === ob.obligationId && block.restIntervalId === clear.restIntervalId)
      && !evaluation.blocks.some((block) => block.obligationId === oc.obligationId);
  });
  assert.ok(evaluations.length > 0);
  for (const evaluation of evaluations) {
    const oa = obligationAndResult(evaluation, a.componentId);
    const ob = obligationAndResult(evaluation, b.componentId);
    const oc = obligationAndResult(evaluation, c.componentId);
    assert.equal(oa.result.status, "COMPLETED_ON_TIME");
    assert.equal(ob.result.status, "COMPLETED_ON_TIME");
    assert.equal(oc.result.status, "REVIEW");
    assert.notEqual(oc.result.status, "OVERDUE");
    assert.notEqual(oc.result.status, "COMPLETED_ON_TIME");
    assert.ok(oc.result.reviewReasons.includes(jointAllocationDependencyReason));
    assert.equal(evaluation.blocks.length, 2);
    assert.ok(evaluation.diagnostics.some((item) =>
      item.reason === jointAllocationDependencyReason
      && item.sourceIds.includes(oa.obligation.obligationId)
      && item.sourceIds.includes(ob.obligation.obligationId)
      && item.sourceIds.includes(oc.obligation.obligationId)
    ));
  }
});

test("T185", "one uncertain higher release remains insufficient for C", () => {
  const a = component("t185:a", "t185:source-a", instant("2026-02-02"), 40 * HOUR, "REDUCED");
  const b = component("t185:b", "t185:source-b", instant("2026-02-05"), 40 * HOUR, "REDUCED");
  const c = component("t185:c", "t185:source-c", instant("2026-02-08"), 35 * HOUR, "REDUCED");
  const reviewA = rest("t185:review-a", instant("2026-02-04"), 14 * HOUR, true);
  const clear = rest("t185:clear", instant("2026-02-11"), 55 * HOUR);
  const valueBranch = regularClearBranch("t185", [a, b, c], clear, 10);
  const result = evaluateCompensation([reviewA, clear], [valueBranch], context(instant("2026-03-03"), true));
  const evaluations = result.branchEvaluations.filter((evaluation) => evaluation.blocks.filter((block) => block.restIntervalId === clear.restIntervalId).length === 2);
  assert.ok(evaluations.length > 0);
  for (const evaluation of evaluations) {
    const oc = obligationAndResult(evaluation, c.componentId);
    assert.equal(oc.result.status, "OVERDUE");
    assert.equal(oc.result.reviewReasons.includes(jointAllocationDependencyReason), false);
  }
});

test("T186", "one ordinary review rest cannot repay A and B together", () => {
  const a = component("t186:a", "t186:source-a", instant("2026-02-02"), 40 * HOUR, "REDUCED");
  const b = component("t186:b", "t186:source-b", instant("2026-02-05"), 40 * HOUR, "REDUCED");
  const c = component("t186:c", "t186:source-c", instant("2026-02-08"), 35 * HOUR, "REDUCED");
  const sharedReview = rest("t186:one-ordinary-review", instant("2026-02-07"), 14 * HOUR, true);
  const clear = rest("t186:clear", instant("2026-02-11"), 55 * HOUR);
  const valueBranch = regularClearBranch("t186", [a, b, c], clear, 10);
  const result = evaluateCompensation([sharedReview, clear], [valueBranch], context(instant("2026-03-03"), true));
  const evaluations = result.branchEvaluations.filter((evaluation) => evaluation.blocks.filter((block) => block.restIntervalId === clear.restIntervalId).length === 2);
  assert.ok(evaluations.length > 0);
  for (const evaluation of evaluations) {
    const oc = obligationAndResult(evaluation, c.componentId);
    assert.equal(oc.result.status, "OVERDUE");
    assert.equal(oc.result.reviewReasons.includes(jointAllocationDependencyReason), false);
    assert.equal(evaluation.blocks.length, 2);
  }
});

test("T187", "three compatible earlier repayments jointly release sequential capacity", () => {
  const a = component("t187:a", "t187:source-a", instant("2026-02-02"), 40 * HOUR, "REDUCED");
  const b = component("t187:b", "t187:source-b", instant("2026-02-05"), 40 * HOUR, "REDUCED");
  const c = component("t187:c", "t187:source-c", instant("2026-02-08"), 40 * HOUR, "REDUCED");
  const d = component("t187:d", "t187:source-d", instant("2026-02-12"), 35 * HOUR, "REDUCED");
  const e = component("t187:e", "t187:source-e", instant("2026-02-14"), 40 * HOUR, "REDUCED");
  const reviewA = rest("t187:review-a", instant("2026-02-04"), 14 * HOUR, true);
  const reviewB = rest("t187:review-b", instant("2026-02-07"), 14 * HOUR, true);
  const reviewC = rest("t187:review-c", instant("2026-02-10"), 14 * HOUR, true);
  const clear = rest("t187:clear", instant("2026-02-17"), 60 * HOUR);
  const valueBranch = regularClearBranch("t187", [a, b, c, d, e], clear, 15);
  const result = evaluateCompensation([reviewA, reviewB, reviewC, clear], [valueBranch], context(instant("2026-03-03"), true));
  const evaluations = result.branchEvaluations.filter((evaluation) => evaluation.blocks.filter((block) => block.restIntervalId === clear.restIntervalId).length === 3);
  assert.ok(evaluations.length > 0);
  for (const evaluation of evaluations) {
    const od = obligationAndResult(evaluation, d.componentId);
    const oe = obligationAndResult(evaluation, e.componentId);
    assert.equal(od.result.status, "REVIEW");
    assert.equal(oe.result.status, "REVIEW");
    assert.ok(od.result.reviewReasons.includes(jointAllocationDependencyReason));
    assert.ok(oe.result.reviewReasons.includes(jointAllocationDependencyReason));
    assert.equal(evaluation.blocks.some((block) => block.obligationId === od.obligation.obligationId || block.obligationId === oe.obligation.obligationId), false);
    assert.equal(evaluation.blocks.length, 3);
  }
});

type TransitiveAncestorMode = "ONE_ORDINARY" | "INDEPENDENT_ORDINARY" | "ONE_SHAREABLE_REGULAR";

function transitiveCompatibilityFixture(id: string, ancestorMode: TransitiveAncestorMode, includeFinalLevel = false) {
  const a = component(`${id}:a`, `${id}:source-a`, instant("2026-02-02"), 40 * HOUR, "REDUCED");
  const d = component(`${id}:d`, `${id}:source-d`, instant("2026-02-04", "12:00:00"), 35 * HOUR, "REDUCED");
  const b = component(`${id}:b`, `${id}:source-b`, instant("2026-02-06"), 40 * HOUR, "REDUCED");
  const e = component(`${id}:e`, `${id}:source-e`, instant("2026-02-10", "12:00:00"), 40 * HOUR, "REDUCED");
  const f = component(`${id}:f`, `${id}:source-f`, instant("2026-02-12", "12:00:00"), 30 * HOUR, "REDUCED");
  const g = component(`${id}:g`, `${id}:source-g`, instant("2026-02-14"), 30 * HOUR, "REDUCED");
  const reviewA = rest(`${id}:review-a`, instant("2026-02-03", "18:00:00"), 14 * HOUR, true);
  const reviewB = rest(`${id}:review-b`, instant("2026-02-08"), 14 * HOUR, true);
  const sharedReview = rest(
    `${id}:shared-review`,
    instant("2026-02-08"),
    (ancestorMode === "ONE_SHAREABLE_REGULAR" ? 55 : 14) * HOUR,
    true,
  );
  const r1 = rest(`${id}:r1`, instant("2026-02-16"), 19 * HOUR);
  const r2 = rest(`${id}:r2`, instant("2026-02-18"), 14 * HOUR);
  const r3 = rest(`${id}:r3`, instant("2026-02-20"), 60 * HOUR);
  const r4 = rest(`${id}:r4`, instant("2026-02-24"), 24 * HOUR);
  const sources = includeFinalLevel ? [a, d, b, e, f, g] : [a, d, b, e, f];
  const values: Array<{ component: WeeklyRestComponent; weekId?: string }> = sources.map((value) => ({ component: value, weekId: W1 }));
  values.push({
    component: component(`${id}:r3-base`, r3.restIntervalId, r3.startEpochMilliseconds as number, 45 * HOUR, "REGULAR", "ADDITIONAL"),
  });
  if (ancestorMode === "ONE_SHAREABLE_REGULAR") {
    values.push({
      component: component(`${id}:ancestor-base`, sharedReview.restIntervalId, sharedReview.startEpochMilliseconds as number, 45 * HOUR, "REGULAR", "ADDITIONAL"),
    });
  }
  const reviews = ancestorMode === "INDEPENDENT_ORDINARY" ? [reviewA, reviewB] : [sharedReview];
  const rests = [...reviews, r1, r2, r3, ...(includeFinalLevel ? [r4] : [])];
  const valueBranch = branch(`branch:${id}`, values);
  const result = evaluateCompensation(rests, [valueBranch], context(instant("2026-03-03"), true));
  return { a, d, b, e, f, g, reviews, r1, r2, r3, r4, branch: valueBranch, result };
}

function transitivePrimaryEvaluations(fixture: ReturnType<typeof transitiveCompatibilityFixture>, includeFinalLevel = false) {
  return fixture.result.branchEvaluations.filter((evaluation) => {
    const oa = evaluation.obligations.find((item) => item.sourceComponentId === fixture.a.componentId);
    const od = evaluation.obligations.find((item) => item.sourceComponentId === fixture.d.componentId);
    const ob = evaluation.obligations.find((item) => item.sourceComponentId === fixture.b.componentId);
    const oe = evaluation.obligations.find((item) => item.sourceComponentId === fixture.e.componentId);
    const of = evaluation.obligations.find((item) => item.sourceComponentId === fixture.f.componentId);
    const og = evaluation.obligations.find((item) => item.sourceComponentId === fixture.g.componentId);
    return oa && od && ob && oe && of
      && evaluation.blocks.some((block) => block.obligationId === oa.obligationId && block.restIntervalId === fixture.r1.restIntervalId)
      && evaluation.blocks.some((block) => block.obligationId === ob.obligationId && block.restIntervalId === fixture.r2.restIntervalId)
      && evaluation.blocks.some((block) => block.obligationId === od.obligationId && block.restIntervalId === fixture.r3.restIntervalId)
      && evaluation.blocks.some((block) => block.obligationId === oe.obligationId && block.restIntervalId === fixture.r3.restIntervalId)
      && !evaluation.blocks.some((block) => block.obligationId === of.obligationId && block.restIntervalId === fixture.r3.restIntervalId)
      && (!includeFinalLevel || og
        && evaluation.blocks.some((block) => block.obligationId === of.obligationId && block.restIntervalId === fixture.r4.restIntervalId)
        && !evaluation.blocks.some((block) => block.obligationId === og.obligationId));
  });
}

test("T188", "transitive dependencies sharing one incompatible ordinary ancestor do not combine", () => {
  const fixture = transitiveCompatibilityFixture("t188", "ONE_ORDINARY");
  const evaluations = transitivePrimaryEvaluations(fixture);
  assert.ok(evaluations.length > 0);
  for (const evaluation of evaluations) {
    const d = obligationAndResult(evaluation, fixture.d.componentId);
    const e = obligationAndResult(evaluation, fixture.e.componentId);
    const f = obligationAndResult(evaluation, fixture.f.componentId);
    assert.ok(d.result.reviewReasons.includes(allocationDependencyReason));
    assert.ok(e.result.reviewReasons.includes(allocationDependencyReason));
    assert.equal(f.result.status, "OVERDUE");
    assert.equal(f.result.reviewReasons.includes(jointAllocationDependencyReason), false);
    assert.equal(evaluation.blocks.length, 4);
  }
});

test("T189", "transitive dependencies from independent ancestors may combine", () => {
  const fixture = transitiveCompatibilityFixture("t189", "INDEPENDENT_ORDINARY");
  const evaluations = transitivePrimaryEvaluations(fixture);
  assert.ok(evaluations.length > 0);
  for (const evaluation of evaluations) {
    const f = obligationAndResult(evaluation, fixture.f.componentId);
    assert.equal(f.result.status, "REVIEW");
    assert.notEqual(f.result.status, "COMPLETED_ON_TIME");
    assert.ok(f.result.reviewReasons.includes(jointAllocationDependencyReason));
    assert.equal(evaluation.blocks.some((block) => block.obligationId === f.obligation.obligationId), false);
    assert.equal(evaluation.blocks.length, 4);
  }
});

test("T190", "shareable regular ancestor supports compatible transitive dependencies", () => {
  const fixture = transitiveCompatibilityFixture("t190", "ONE_SHAREABLE_REGULAR");
  const evaluations = transitivePrimaryEvaluations(fixture);
  assert.ok(evaluations.length > 0);
  for (const evaluation of evaluations) {
    const f = obligationAndResult(evaluation, fixture.f.componentId);
    assert.equal(f.result.status, "REVIEW");
    assert.ok(f.result.reviewReasons.includes(jointAllocationDependencyReason));
    assert.equal(evaluation.blocks.some((block) => block.obligationId === f.obligation.obligationId), false);
  }
});

test("T191", "inherited joint provenance survives another dependency level deterministically", () => {
  const fixture = transitiveCompatibilityFixture("t191", "INDEPENDENT_ORDINARY", true);
  const evaluations = transitivePrimaryEvaluations(fixture, true);
  assert.ok(evaluations.length > 0);
  for (const evaluation of evaluations) {
    const f = obligationAndResult(evaluation, fixture.f.componentId);
    const g = obligationAndResult(evaluation, fixture.g.componentId);
    assert.equal(f.result.status, "COMPLETED_ON_TIME");
    assert.ok(f.result.reviewReasons.includes(jointAllocationDependencyReason));
    assert.equal(g.result.status, "REVIEW");
    assert.ok(g.result.reviewReasons.includes(allocationDependencyReason));
    assert.equal(evaluation.blocks.some((block) => block.obligationId === g.obligation.obligationId), false);
  }
  const repeated = evaluateCompensation(
    [...fixture.reviews, fixture.r1, fixture.r2, fixture.r3, fixture.r4],
    [fixture.branch],
    context(instant("2026-03-03"), true),
  );
  assert.deepEqual(repeated, fixture.result);
});

assert.equal(passed, selectedTestIds.size || 92);
console.log(selectedTestIds.size
  ? `Rest Engine v1 Phase 5 selected compensation tests ${[...selectedTestIds].sort().join(", ")}: PASS`
  : "Rest Engine v1 Phase 5 compensation T100–T191: PASS");
