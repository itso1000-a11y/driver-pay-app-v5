import assert from "node:assert/strict";
import {
  type AllocationBranch,
  type RestBoundary,
  type RestInterval,
  type WeeklyRestAllocationContext,
  type WeeklyRestComponentOption,
} from "../src/rest-engine/types.ts";
import { formatLondonInstant, resolveLondonWallTime } from "../src/rest-engine/time.ts";
import { generateWeeklyRestComponentOptions } from "../src/rest-engine/weekly-rest-candidates.ts";
import { solveWeeklyRestAllocations } from "../src/rest-engine/weekly-rest-allocation.ts";

const HOUR = 60 * 60 * 1000;
let passed = 0;
let selected = 0;
const requestedTests = new Set((process.env.PHASE4_TEST_FILTER ?? "").split(",").map((item) => item.trim()).filter(Boolean));

function test(id: string, name: string, body: () => void) {
  if (requestedTests.size && !requestedTests.has(id)) return;
  selected += 1;
  body();
  passed += 1;
  console.log(`PASS ${id} — ${name}`);
}

function instant(wallDate: string, wallTime = "00:00:00"): number {
  const value = resolveLondonWallTime(wallDate, wallTime);
  assert.equal(value.resolution, "VALID");
  return value.epochMilliseconds as number;
}

function boundary(epochMilliseconds: number, role: RestBoundary["role"]): RestBoundary {
  const civil = formatLondonInstant(epochMilliseconds);
  return {
    sourceFactIds: ["phase4-fixture"],
    role,
    time: resolveLondonWallTime(civil.wallDate, civil.wallTime),
    epochMilliseconds,
  };
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
    reviewReasons: review ? ["Fixture boundary is unresolved."] : [],
  };
}

function optionsFor(intervals: RestInterval[]): WeeklyRestComponentOption[] {
  return generateWeeklyRestComponentOptions(intervals).options;
}

function context(
  evaluationWeekIds: string[],
  asOfEpochMilliseconds: number,
  overrides: Partial<WeeklyRestAllocationContext> = {},
): WeeklyRestAllocationContext {
  return {
    asOfEpochMilliseconds,
    evaluationWeekIds,
    historyStartEpochMilliseconds: evaluationWeekIds.length ? instant(evaluationWeekIds[0]) : null,
    factualCoverageCompleteThroughAsOf: true,
    ...overrides,
  };
}

function solve(intervals: RestInterval[], ctx: WeeklyRestAllocationContext, suppliedOptions = optionsFor(intervals)) {
  return solveWeeklyRestAllocations(intervals, suppliedOptions, ctx);
}

function branchWith(
  branches: AllocationBranch[],
  predicate: (branch: AllocationBranch) => boolean,
  message: string,
): AllocationBranch {
  const branch = branches.find(predicate);
  assert.ok(branch, message);
  return branch;
}

function counted(branch: AllocationBranch) {
  return branch.components.filter((item) => item.role === "COUNTED");
}

function overlaps(branch: AllocationBranch): boolean {
  const values = counted(branch).sort((left, right) => left.startEpochMilliseconds - right.startEpochMilliseconds);
  return values.some((item, index) => index > 0 && values[index - 1].endEpochMilliseconds > item.startEpochMilliseconds);
}

const W1 = "2026-02-02";
const W2 = "2026-02-09";
const W3 = "2026-02-16";
const horizonEnd = instant("2026-02-23");

test("T51", "single 45h rest can be counted regular in its eligible week", () => {
  const interval = rest("single-regular", instant("2026-02-03"), 45 * HOUR);
  const result = solve([interval], context([W1], instant("2026-02-06")));
  const branch = branchWith(result.branches, (item) => counted(item).some((value) => value.classification === "REGULAR"), "Missing counted regular branch");
  assert.equal(branch.fixedWeekAssignments[0].fixedWeekId, W1);
});

test("T52", "single 24h rest can be counted reduced without compensation", () => {
  const interval = rest("single-reduced", instant("2026-02-04"), 24 * HOUR);
  const result = solve([interval], context([W1], instant("2026-02-06")));
  assert.ok(result.branches.some((branch) => counted(branch).some((item) => item.classification === "REDUCED")));
  assert.doesNotMatch(JSON.stringify(result), /CompensationObligation|CompensationBlock|repayment|attachment/i);
});

test("T53", "reduced candidate may remain additional and creates no debt", () => {
  const interval = rest("additional-reduced", instant("2026-02-04"), 30 * HOUR);
  const result = solve([interval], context([W1], instant("2026-02-06")));
  const branch = branchWith(result.branches, (item) => item.additionalComponents.some((value) => value.classification === "REDUCED"), "Missing additional reduced branch");
  assert.equal(branch.fixedWeekAssignments.length, 0);
  assert.equal("debt" in branch, false);
});

function crossWeek(durationHours: number, id = `cross-${durationHours}`) {
  return rest(id, instant("2026-02-07", "12:00:00"), durationHours * HOUR);
}

test("T54", "cross-week rest preserves both eligible fixed-week assignments", () => {
  const interval = crossWeek(45);
  const supportFirst = rest("cross-support-first", instant("2026-02-03"), 45 * HOUR);
  const supportSecond = rest("cross-support-second", instant("2026-02-10"), 45 * HOUR);
  const result = solve([supportFirst, interval, supportSecond], context([W1, W2], instant("2026-02-15")));
  const viable = result.branches.filter((branch) =>
    counted(branch).length === 2 && branch.twoWeekEvaluations[0].status === "SATISFIED"
  );
  const owners = new Set(viable.flatMap((branch) =>
    branch.fixedWeekAssignments
      .filter((item) => branch.components.find((component) => component.componentId === item.componentId)?.restIntervalId === interval.restIntervalId)
      .map((item) => item.fixedWeekId)
  ));
  assert.deepEqual([...owners].sort(), [W1, W2]);
});

test("T55", "one cross-week component is never counted in both weeks", () => {
  const interval = crossWeek(45);
  const result = solve([interval], context([W1, W2], horizonEnd));
  for (const branch of result.branches) {
    for (const value of counted(branch)) {
      assert.equal(branch.fixedWeekAssignments.filter((item) => item.componentId === value.componentId).length, 1);
    }
  }
});

function twoRests(firstHours: number, secondHours: number) {
  return [
    rest(`first-${firstHours}`, instant("2026-02-03"), firstHours * HOUR),
    rest(`second-${secondHours}`, instant("2026-02-10"), secondHours * HOUR),
  ];
}

function fullyCountedTwoWeek(firstHours: number, secondHours: number) {
  const intervals = twoRests(firstHours, secondHours);
  const result = solve(intervals, context([W1, W2], instant("2026-02-16")));
  return branchWith(result.branches, (branch) => counted(branch).length === 2, "Missing two-component counted branch");
}

test("T56", "two regular rests satisfy consecutive weeks", () => {
  assert.equal(fullyCountedTwoWeek(45, 45).twoWeekEvaluations[0].status, "SATISFIED");
});

test("T57", "regular plus reduced satisfies consecutive weeks", () => {
  assert.equal(fullyCountedTwoWeek(45, 24).twoWeekEvaluations[0].status, "SATISFIED");
});

test("T58", "reduced plus regular satisfies consecutive weeks", () => {
  assert.equal(fullyCountedTwoWeek(24, 45).twoWeekEvaluations[0].status, "SATISFIED");
});

test("T59", "reduced plus reduced violates ordinary two-week minimum", () => {
  assert.equal(fullyCountedTwoWeek(24, 24).twoWeekEvaluations[0].status, "VIOLATED");
});

test("T60", "additional rest does not automatically satisfy a week", () => {
  const intervals = twoRests(45, 45);
  const result = solve(intervals, context([W1, W2], instant("2026-02-16")));
  const branch = branchWith(result.branches, (item) => item.additionalComponents.length === 2, "Missing all-additional branch");
  assert.equal(branch.twoWeekEvaluations[0].status, "VIOLATED");
});

test("T61", "69h supports regular-then-reduced allocation", () => {
  const interval = crossWeek(69, "cross-69-a");
  const result = solve([interval], context([W1, W2], horizonEnd));
  const branch = branchWith(result.branches, (item) => item.sourceOptionIds.some((id) => id.endsWith("REGULAR_THEN_REDUCED")), "Missing regular-then-reduced branch");
  assert.deepEqual(counted(branch).map((item) => item.classification), ["REGULAR", "REDUCED"]);
});

test("T62", "69h supports reduced-then-regular allocation", () => {
  const interval = crossWeek(69, "cross-69-b");
  const result = solve([interval], context([W1, W2], horizonEnd));
  const branch = branchWith(result.branches, (item) => item.sourceOptionIds.some((id) => id.endsWith("REDUCED_THEN_REGULAR")), "Missing reduced-then-regular branch");
  assert.deepEqual(counted(branch).map((item) => item.classification), ["REDUCED", "REGULAR"]);
});

test("T63", "69h creates no overlapping component claims", () => {
  const interval = crossWeek(69, "cross-69-no-overlap");
  const result = solve([interval], context([W1, W2], horizonEnd));
  assert.ok(result.branches.every((branch) => !overlaps(branch)));
});

test("T64", "90h supports adjacent regular plus regular", () => {
  const interval = crossWeek(90, "cross-90");
  const result = solve([interval], context([W1, W2], horizonEnd));
  const branch = branchWith(result.branches, (item) => item.sourceOptionIds.some((id) => id.endsWith("REGULAR_THEN_REGULAR")), "Missing two-regular branch");
  const values = counted(branch);
  assert.deepEqual(values.map((item) => item.classification), ["REGULAR", "REGULAR"]);
  assert.equal(values[0].endEpochMilliseconds, values[1].startEpochMilliseconds);
});

test("T65", "89h59m cannot produce two regular components", () => {
  const interval = rest("under-90", instant("2026-02-07", "12:00:00"), 90 * HOUR - 60_000);
  const optionSet = optionsFor([interval]);
  const result = solve([interval], context([W1, W2], horizonEnd), optionSet);
  assert.equal(optionSet.some((item) => item.pattern === "REGULAR_THEN_REGULAR"), false);
  assert.equal(result.branches.some((branch) => counted(branch).filter((item) => item.classification === "REGULAR").length > 1), false);
});

function rollingFixture(deltaMilliseconds: number) {
  const previousEnd = instant("2026-01-27", "21:00:00");
  const due = previousEnd + 144 * HOUR;
  const intervals = [
    rest("rolling-first", previousEnd - 45 * HOUR, 45 * HOUR),
    rest(`rolling-next-${deltaMilliseconds}`, due + deltaMilliseconds, 45 * HOUR),
  ];
  const result = solve(intervals, context(["2026-01-26", W1], instant("2026-02-06")));
  const branch = branchWith(result.branches, (item) => counted(item).length === 2, "Missing rolling two-rest branch");
  const cycle = branch.rollingCycleResets.find((item) => item.previousComponentId && item.nextComponentId && item.exactElapsedMilliseconds != null && item.previousQualifyingEndEpochMilliseconds === previousEnd);
  assert.ok(cycle);
  return cycle;
}

test("T66", "144h next start before due passes", () => assert.equal(rollingFixture(-1).status, "BEFORE_DUE"));
test("T67", "144h next start exactly due passes", () => assert.equal(rollingFixture(0).status, "EXACTLY_DUE"));
test("T68", "144h next start after due fails", () => assert.equal(rollingFixture(1).status, "AFTER_DUE"));

test("T69", "144h remains exact across GMT to BST", () => {
  const previousEnd = instant("2026-03-23", "08:00:00");
  const due = previousEnd + 144 * HOUR;
  const intervals = [rest("spring-first", previousEnd - 45 * HOUR, 45 * HOUR), rest("spring-next", due, 45 * HOUR)];
  const result = solve(intervals, context(["2026-03-16", "2026-03-23"], instant("2026-03-31")));
  const branch = branchWith(result.branches, (item) => counted(item).length === 2, "Missing spring branch");
  const cycle = branch.rollingCycleResets.find((item) => item.previousQualifyingEndEpochMilliseconds === previousEnd && item.nextQualifyingStartEpochMilliseconds === due);
  assert.equal(cycle?.status, "EXACTLY_DUE");
  assert.equal(formatLondonInstant(due).wallTime, "09:00:00");
});

test("T70", "144h remains exact across BST to GMT", () => {
  const previousEnd = instant("2026-10-19", "08:00:00");
  const due = previousEnd + 144 * HOUR;
  const intervals = [rest("autumn-first", previousEnd - 45 * HOUR, 45 * HOUR), rest("autumn-next", due, 45 * HOUR)];
  const result = solve(intervals, context(["2026-10-12", "2026-10-19"], instant("2026-10-27")));
  const branch = branchWith(result.branches, (item) => counted(item).length === 2, "Missing autumn branch");
  const cycle = branch.rollingCycleResets.find((item) => item.previousQualifyingEndEpochMilliseconds === previousEnd && item.nextQualifyingStartEpochMilliseconds === due);
  assert.equal(cycle?.status, "EXACTLY_DUE");
  assert.equal(formatLondonInstant(due).wallTime, "07:00:00");
});

test("T71", "midweek counted rest re-anchors the next cycle", () => {
  const intervals = [
    rest("anchor-a", instant("2026-02-02"), 45 * HOUR),
    rest("anchor-mid", instant("2026-02-09", "21:00:00"), 45 * HOUR),
    rest("anchor-c", instant("2026-02-16", "21:00:00"), 45 * HOUR),
  ];
  const result = solve(intervals, context([W1, W2, W3], horizonEnd));
  const branch = branchWith(result.branches, (item) => counted(item).length === 3, "Missing three-rest branch");
  const middle = counted(branch).find((item) => item.restIntervalId === "anchor-mid") as NonNullable<ReturnType<typeof counted>[number]>;
  const middleInterval = intervals.find((item) => item.restIntervalId === "anchor-mid") as RestInterval;
  assert.ok(branch.rollingCycleResets.some((item) => item.previousComponentId === middle.componentId && item.dueEpochMilliseconds === (middleInterval.endEpochMilliseconds as number) + 144 * HOUR));
});

test("T72", "pay-week metadata does not alter solver output", () => {
  const interval = crossWeek(45, "pay-neutral");
  const optionSet = optionsFor([interval]);
  const base = solveWeeklyRestAllocations([interval], optionSet, context([W1, W2], horizonEnd));
  const decorated = solveWeeklyRestAllocations([{ ...interval, payWeek: "other" } as RestInterval], optionSet.map((item) => ({ ...item, payWeek: "other" } as WeeklyRestComponentOption)), context([W1, W2], horizonEnd));
  assert.deepEqual(decorated, base);
});

test("T73", "End Week metadata does not alter solver output", () => {
  const interval = crossWeek(45, "end-week-neutral");
  const optionSet = optionsFor([interval]);
  const base = solveWeeklyRestAllocations([interval], optionSet, context([W1, W2], horizonEnd));
  const decorated = solveWeeklyRestAllocations([{ ...interval, endWeek: true } as RestInterval], optionSet, context([W1, W2], horizonEnd));
  assert.deepEqual(decorated, base);
});

test("T74", "archive UI and navigation state do not alter output", () => {
  const interval = crossWeek(45, "ui-neutral");
  const optionSet = optionsFor([interval]);
  const baseContext = context([W1, W2], horizonEnd);
  const base = solveWeeklyRestAllocations([interval], optionSet, baseContext);
  const decorated = solveWeeklyRestAllocations([interval], optionSet, { ...baseContext, archive: true, screen: "preview" } as WeeklyRestAllocationContext);
  assert.deepEqual(decorated, base);
});

test("T75", "cross-week start-week preference is not applied", () => {
  const interval = crossWeek(45, "no-start-preference");
  const result = solve([interval], context([W1, W2], horizonEnd));
  assert.ok(result.branches.some((branch) => branch.fixedWeekAssignments.some((item) => item.fixedWeekId === W1)));
  assert.ok(result.branches.some((branch) => branch.fixedWeekAssignments.some((item) => item.fixedWeekId === W2)));
});

test("T76", "two legal cross-week assignments produce two preserved counted branches", () => {
  const interval = crossWeek(45, "two-cross-branches");
  const result = solve([interval], context([W1, W2], horizonEnd));
  assert.equal(result.branches.filter((branch) => counted(branch).length === 1).length, 2);
});

test("T77", "solver does not choose by least future reduced-rest consequence", () => {
  const interval = rest("reduced-cross-alternatives", instant("2026-02-08", "12:00:00"), 30 * HOUR);
  const result = solve([interval], context([W1, W2], horizonEnd));
  assert.equal(result.branches.filter((branch) => counted(branch).length === 1).length, 2);
  assert.doesNotMatch(JSON.stringify(result), /debt|leastFuture|compensation/i);
});

test("T78", "branch IDs and results are deterministic", () => {
  const interval = crossWeek(69, "deterministic");
  const ctx = context([W1, W2], horizonEnd);
  assert.deepEqual(solve([interval], ctx), solve([structuredClone(interval)], structuredClone(ctx)));
});

test("T79", "equivalent input options are deduplicated without provenance loss", () => {
  const interval = crossWeek(45, "dedupe-options");
  const optionSet = optionsFor([interval]);
  const base = solve([interval], context([W1, W2], horizonEnd), optionSet);
  const duplicated = solve([interval], context([W1, W2], horizonEnd), [...optionSet, structuredClone(optionSet[0])]);
  assert.deepEqual(duplicated, base);
  assert.ok(duplicated.branches.every((branch) => branch.sourceOptionIds.length > 0));
});

test("T80", "historical correction removes stale branch state", () => {
  const oldInterval = rest("historical-old", instant("2026-02-03"), 45 * HOUR);
  const newInterval = rest("historical-corrected", instant("2026-02-03", "02:00:00"), 45 * HOUR);
  const oldResult = solve([oldInterval], context([W1], instant("2026-02-06")));
  const corrected = solve([newInterval], context([W1], instant("2026-02-06")));
  assert.ok(oldResult.branches.some((branch) => branch.components.some((item) => item.restIntervalId === "historical-old")));
  assert.equal(JSON.stringify(corrected).includes("historical-old"), false);
});

test("T81", "REVIEW_ONLY candidate never becomes confirmed counted rest", () => {
  const interval = rest("review-only", instant("2026-02-03"), 45 * HOUR, true);
  const result = solve([interval], context([W1], instant("2026-02-06")));
  assert.ok(result.branches.every((branch) => counted(branch).length === 0));
  assert.ok(result.issues.some((item) => item.code === "REVIEW_OPTION_NOT_COUNTED"));
});

test("T82", "ambiguous boundary REVIEW propagates into allocation", () => {
  const fold = resolveLondonWallTime("2026-10-25", "01:30:00", { provenance: "ASSUMED" });
  const observedThrough = instant("2026-10-27");
  const interval: RestInterval = {
    restIntervalId: "ambiguous-allocation",
    startBoundary: { sourceFactIds: ["ambiguous"], role: "WORK_END", time: fold, epochMilliseconds: null },
    endBoundary: boundary(observedThrough, "WORK_START"),
    startEpochMilliseconds: null,
    endEpochMilliseconds: observedThrough,
    observedThroughEpochMilliseconds: observedThrough,
    elapsedMilliseconds: null,
    elapsedRangeMilliseconds: { minimum: 48 * HOUR, maximum: 49 * HOUR },
    supportingFactIds: ["ambiguous"],
    state: "CLOSED",
    provenance: "ASSUMED",
    reviewStatus: "REVIEW_REQUIRED",
    reviewReasons: [...fold.reviewReasons],
  };
  const result = solve([interval], context(["2026-10-19", "2026-10-26"], observedThrough));
  assert.equal(fold.resolution, "AMBIGUOUS_FOLD");
  assert.equal(fold.candidates.length, 2);
  assert.ok(result.branches.every((branch) => branch.reviewStatus === "REVIEW_REQUIRED"));
  assert.ok(result.branches.every((branch) => branch.twoWeekEvaluations.every((item) => item.status === "REVIEW")));
});

test("T83", "insufficient prior history is explicit", () => {
  const interval = rest("history-unknown", instant("2026-02-03"), 45 * HOUR);
  const result = solve([interval], context([W1], instant("2026-02-06")));
  const branch = branchWith(result.branches, (item) => counted(item).length === 1, "Missing counted history branch");
  assert.equal(branch.rollingCycleResets[0].status, "INSUFFICIENT_HISTORY");
  assert.equal(branch.reviewStatus, "REVIEW_REQUIRED");
});

test("T84", "open future 144h deadline is pending", () => {
  const interval = rest("pending-cycle", instant("2026-02-03"), 45 * HOUR);
  const result = solve([interval], context([W1], instant("2026-02-06"), {
    priorQualifyingWeeklyRest: { componentId: "prior", endEpochMilliseconds: instant("2026-01-28"), reviewStatus: "CLEAR" },
  }));
  const branch = branchWith(result.branches, (item) => counted(item).length === 1, "Missing counted pending branch");
  assert.equal(branch.rollingCycleResets.at(-1)?.status, "PENDING");
});

test("T85", "passed 144h deadline with complete facts is violation", () => {
  const interval = rest("passed-cycle", instant("2026-02-03"), 45 * HOUR);
  const due = interval.endEpochMilliseconds as number + 144 * HOUR;
  const result = solve([interval], context([W1], due + 1, {
    priorQualifyingWeeklyRest: { componentId: "prior", endEpochMilliseconds: instant("2026-01-28"), reviewStatus: "CLEAR" },
  }));
  const branch = branchWith(result.branches, (item) => counted(item).length === 1, "Missing counted passed branch");
  assert.equal(branch.rollingCycleResets.at(-1)?.status, "AFTER_DUE");
  assert.equal(branch.legalState, "VIOLATED");
});

test("T86", "solver creates no compensation or repayment object", () => {
  const interval = crossWeek(69, "no-phase5");
  const result = solve([interval], context([W1, W2], horizonEnd));
  assert.doesNotMatch(JSON.stringify(result), /CompensationObligation|CompensationBlock|repayment|attachment/i);
});

test("T87", "one branch cannot consume overlapping minimum ranges", () => {
  const first = rest("overlap-a", instant("2026-02-03"), 45 * HOUR);
  const second = rest("overlap-b", instant("2026-02-04"), 45 * HOUR);
  const result = solve([first, second], context([W1], instant("2026-02-08")));
  assert.ok(result.branches.every((branch) => !overlaps(branch)));
  assert.ok(result.eliminatedBranchesOrDiagnostics.some((item) => item.code === "OVERLAPPING_WEEKLY_REST_MINIMUM"));
});

test("T88", "back-to-back adjacent ranges are allowed", () => {
  const interval = crossWeek(90, "adjacent-allowed");
  const result = solve([interval], context([W1, W2], horizonEnd));
  const branch = branchWith(result.branches, (item) => item.sourceOptionIds.some((id) => id.endsWith("REGULAR_THEN_REGULAR")), "Missing adjacent branch");
  const values = counted(branch);
  assert.equal(values[0].endEpochMilliseconds, values[1].startEpochMilliseconds);
  assert.equal(overlaps(branch), false);
});

test("T89", "long-rest solver does not enumerate minute placements", () => {
  const interval = rest("very-long", instant("2026-02-02"), 1000 * 24 * HOUR);
  const optionSet = optionsFor([interval]);
  const result = solve([interval], context([W1, W2], horizonEnd), optionSet);
  assert.ok(optionSet.length <= 4);
  assert.ok(result.branches.length < 20);
  assert.ok(result.branches.flatMap((branch) => branch.components).every((item) => Number.isSafeInteger(item.startOffsetMilliseconds)));
});

test("T90", "branch count remains bounded and canonical", () => {
  const interval = rest("bounded-long", instant("2026-02-02"), 1000 * 24 * HOUR);
  const ctx = context([W1, W2], horizonEnd);
  const first = solve([interval], ctx);
  const second = solve([interval], ctx);
  assert.ok(first.branches.length <= 6);
  assert.equal(new Set(first.branches.map((item) => item.branchId)).size, first.branches.length);
  assert.deepEqual(first, second);
});

test("T91", "additional Weekly Rest resets 144h", () => {
  const intervals = [
    rest("rolling-counted-a", instant("2026-02-02"), 45 * HOUR),
    rest("rolling-additional-b", instant("2026-02-06"), 45 * HOUR),
    rest("rolling-counted-c", instant("2026-02-11"), 45 * HOUR),
  ];
  const result = solve(intervals, context([W1, W2], instant("2026-02-16")));
  const branch = branchWith(result.branches, (item) => {
    const countedIds = new Set(counted(item).map((value) => value.restIntervalId));
    return countedIds.has("rolling-counted-a")
      && countedIds.has("rolling-counted-c")
      && item.additionalComponents.some((value) => value.restIntervalId === "rolling-additional-b");
  }, "Missing branch with additional midweek Weekly Rest");
  const middle = branch.rollingQualifyingRests.find((item) => item.restIntervalId === "rolling-additional-b");
  const middleInterval = intervals[1];
  assert.equal(middle?.qualification, "QUALIFYING_WEEKLY_REST");
  assert.ok(branch.rollingCycleResets.some((item) =>
    item.previousRestIntervalId === "rolling-additional-b"
      && item.nextRestIntervalId === "rolling-counted-c"
      && item.dueEpochMilliseconds === (middleInterval.endEpochMilliseconds as number) + 144 * HOUR
  ));
  assert.doesNotMatch(JSON.stringify(result), /CompensationObligation|CompensationBlock|repayment|attachment/i);
});

test("T92", "48h regular rest anchors at RestInterval end", () => {
  const interval = rest("regular-48h", instant("2026-02-03"), 48 * HOUR);
  const result = solve([interval], context([W1], instant("2026-02-06")));
  const branch = branchWith(result.branches, (item) => counted(item).some((value) => value.restIntervalId === interval.restIntervalId), "Missing counted 48h branch");
  const minimum = counted(branch).find((item) => item.restIntervalId === interval.restIntervalId) as NonNullable<ReturnType<typeof counted>[number]>;
  const terminal = branch.rollingCycleResets.find((item) => item.previousRestIntervalId === interval.restIntervalId && item.nextRestIntervalId == null);
  assert.equal(minimum.durationMilliseconds, 45 * HOUR);
  assert.notEqual(minimum.endEpochMilliseconds, interval.endEpochMilliseconds);
  assert.equal(terminal?.previousQualifyingEndEpochMilliseconds, interval.endEpochMilliseconds);
  assert.equal(terminal?.dueEpochMilliseconds, (interval.endEpochMilliseconds as number) + 144 * HOUR);
});

test("T93", "110h long rest anchors at complete RestInterval end", () => {
  const interval = crossWeek(110, "long-110h");
  const result = solve([interval], context([W1, W2], horizonEnd));
  const branch = branchWith(result.branches, (item) => item.sourceOptionIds.some((id) => id.endsWith("REGULAR_THEN_REGULAR")), "Missing 110h regular-plus-regular branch");
  const values = counted(branch);
  const terminal = branch.rollingCycleResets.find((item) => item.previousRestIntervalId === interval.restIntervalId && item.nextRestIntervalId == null);
  assert.equal(values.length, 2);
  assert.equal(values[0].endEpochMilliseconds, values[1].startEpochMilliseconds);
  assert.ok((values[1].endEpochMilliseconds as number) < (interval.endEpochMilliseconds as number));
  assert.equal(terminal?.previousQualifyingEndEpochMilliseconds, interval.endEpochMilliseconds);
  assert.equal(terminal?.dueEpochMilliseconds, (interval.endEpochMilliseconds as number) + 144 * HOUR);
});

test("T94", "long Off or Holiday factual rest uses the same complete RestInterval anchor", () => {
  const base = rest("long-workflow-neutral", instant("2026-02-03"), 72 * HOUR);
  const off = { ...base, workflowSource: "Off" } as RestInterval;
  const holiday = { ...base, workflowSource: "Holiday" } as RestInterval;
  const ctx = context([W1], instant("2026-02-08"));
  const offResult = solve([off], ctx);
  const holidayResult = solve([holiday], ctx);
  assert.deepEqual(holidayResult, offResult);
  assert.ok(offResult.branches.every((branch) => branch.rollingQualifyingRests.every((item) => item.completeRestIntervalEndEpochMilliseconds === base.endEpochMilliseconds)));
});

function redundantReducedFixture() {
  const intervals = [
    rest("reduced-source-r1", instant("2026-02-03"), 30 * HOUR),
    rest("reduced-source-r2", instant("2026-02-06"), 35 * HOUR),
    rest("regular-source-r3", instant("2026-02-10"), 45 * HOUR),
  ];
  return solve(intervals, context([W1, W2], instant("2026-02-16")));
}

test("T95", "redundant reduced rest stays additional", () => {
  const result = redundantReducedFixture();
  const satisfied = result.branches.filter((branch) => branch.twoWeekEvaluations[0].status === "SATISFIED");
  assert.ok(satisfied.length >= 2);
  assert.ok(satisfied.every((branch) => counted(branch).filter((item) => item.restIntervalId === "reduced-source-r1" || item.restIntervalId === "reduced-source-r2").length === 1));
  assert.ok(result.eliminatedBranchesOrDiagnostics.some((item) => item.code === "REDUNDANT_COUNTED_COMPONENT"));
});

test("T96", "source alternatives are preserved", () => {
  const result = redundantReducedFixture();
  const sourcePattern = (branch: AllocationBranch) => ({
    counted: new Set(counted(branch).map((item) => item.restIntervalId)),
    additional: new Set(branch.additionalComponents.map((item) => item.restIntervalId)),
  });
  const alternatives = result.branches.map(sourcePattern);
  assert.ok(alternatives.some((item) => item.counted.has("reduced-source-r1") && item.additional.has("reduced-source-r2") && item.counted.has("regular-source-r3")));
  assert.ok(alternatives.some((item) => item.additional.has("reduced-source-r1") && item.counted.has("reduced-source-r2") && item.counted.has("regular-source-r3")));
});

test("T97", "no artificial future debt sources", () => {
  const result = redundantReducedFixture();
  const satisfied = result.branches.filter((branch) => branch.twoWeekEvaluations[0].status === "SATISFIED");
  assert.ok(satisfied.length >= 2);
  assert.ok(satisfied.every((branch) => counted(branch).filter((item) => item.classification === "REDUCED").length === 1));
  assert.doesNotMatch(JSON.stringify(result), /CompensationObligation|CompensationBlock|repayment|attachment|debt/i);
});

test("T98", "REVIEW_ONLY prevents false strong 144h violation", () => {
  const previousEnd = instant("2026-02-02");
  const due = previousEnd + 144 * HOUR;
  const unresolved = rest("review-only-before-due", due - 24 * HOUR, 45 * HOUR, true);
  const optionSet = optionsFor([unresolved]);
  assert.deepEqual(optionSet.map((item) => item.pattern), ["REVIEW_ONLY"]);
  const result = solve([unresolved], context([W1], due + HOUR, {
    priorQualifyingWeeklyRest: {
      componentId: "prior-confirmed-component",
      restIntervalId: "prior-confirmed-rest",
      endEpochMilliseconds: previousEnd,
      reviewStatus: "CLEAR",
    },
  }), optionSet);
  const branch = branchWith(result.branches, () => true, "Missing unresolved rolling branch");
  assert.equal(branch.rollingCycleResets[0]?.status, "REVIEW");
  assert.equal(branch.rollingCycleResets.some((item) => item.status === "AFTER_DUE"), false);
  assert.equal(branch.reviewStatus, "REVIEW_REQUIRED");
  assert.equal(branch.legalState, "REVIEW");
  assert.equal(branch.rollingQualifyingRests.length, 0);
  assert.equal(branch.rollingCycleResets[0]?.nextComponentId, null);
  assert.equal(branch.rollingCycleResets[0]?.nextRestIntervalId, null);
  assert.equal(branch.rollingCycleResets[0]?.previousRestIntervalId, "prior-confirmed-rest");
  assert.equal(branch.rollingCycleResets[0]?.previousQualifyingEndEpochMilliseconds, previousEnd);
});

test("T99", "genuine no-rest case still violates", () => {
  const previousEnd = instant("2026-02-02");
  const due = previousEnd + 144 * HOUR;
  const result = solve([], context([W1], due + 1, {
    priorQualifyingWeeklyRest: {
      componentId: "prior-no-rest-component",
      restIntervalId: "prior-no-rest-interval",
      endEpochMilliseconds: previousEnd,
      reviewStatus: "CLEAR",
    },
  }), []);
  const branch = branchWith(result.branches, () => true, "Missing genuine no-rest branch");
  assert.equal(branch.rollingCycleResets[0]?.status, "AFTER_DUE");
  assert.equal(branch.reviewStatus, "CLEAR");
  assert.equal(branch.legalState, "VIOLATED");
});

assert.equal(passed, selected);
console.log(requestedTests.size
  ? `Rest Engine v1 Phase 4 selected tests (${[...requestedTests].join(", ")}): PASS`
  : "Rest Engine v1 Phase 4 legal allocation solver T51–T99: PASS");
