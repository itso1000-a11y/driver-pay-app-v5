import assert from "node:assert/strict";
import type { ActivityFactInput, AllocationBranch, BranchCompensationEvaluation, CompensationResultStatus } from "../src/rest-engine/types.ts";
import {
  computeFactsHash,
  evaluateRestEngine,
  invalidateDerivedCache,
  type DerivedEvaluationCache,
  type EngineEvaluation,
  type EvaluateRestEngineInput,
} from "../src/rest-engine/evaluate.ts";
import { migrateLegacyFacts } from "../src/rest-engine/migration.ts";
import {
  REST_ENGINE_STORAGE_KEYS,
  invalidateStoredDerivedCache,
  migrateLegacyStorage,
  readCurrentMigration,
  readLegacyRollbackSnapshot,
  recoverInterruptedMigration,
  type KeyValueStorage,
} from "../src/rest-engine/storage.ts";
import {
  aggregateBranchWarnings,
  classifyOngoingThreshold,
  explainBranchDifference,
  selectEarliestPlanningDeadline,
} from "../src/rest-engine/warnings.ts";
import { fixedLegalWeekForInstant, resolveLondonWallTime } from "../src/rest-engine/time.ts";

const HOUR = 60 * 60 * 1000;
let passed = 0;
let selected = 0;
const requested = new Set((process.env.PHASE6_7_TEST_IDS ?? "").split(",").map((item) => item.trim()).filter(Boolean));

function test(id: string, name: string, body: () => void) {
  if (requested.size && !requested.has(id)) return;
  selected += 1;
  body();
  passed += 1;
  console.log(`PASS ${id} — ${name}`);
}

function instant(date: string, time = "00:00:00"): number {
  const result = resolveLondonWallTime(date, time);
  assert.equal(result.resolution, "VALID");
  return result.epochMilliseconds as number;
}

function nextDate(date: string): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10);
}

function dates(first: string, last: string): string[] {
  const result: string[] = [];
  for (let date = first; date <= last; date = nextDate(date)) result.push(date);
  return result;
}

type WorkTimes = Record<string, [string, string]>;

function timelineFacts(work: WorkTimes, first = "2026-02-02", last = "2026-02-15"): ActivityFactInput[] {
  return dates(first, last).map((date) => {
    const times = work[date];
    return {
      factId: `day:${date}`,
      sourceRef: { sourceKey: `week:${date}`, recordId: date, wallDate: date },
      kind: times ? "WORK" as const : "OFF" as const,
      factStatus: "FACTUAL" as const,
      coverage: "FULL_CIVIL_DAY" as const,
      start: times ? { wallDate: date, wallTime: times[0], provenance: "EXPLICIT" as const } : { wallDate: date, wallTime: "00:00:00", provenance: "EXPLICIT" as const },
      end: times ? { wallDate: date, wallTime: times[1], provenance: "EXPLICIT" as const } : { wallDate: nextDate(date), wallTime: "00:00:00", provenance: "EXPLICIT" as const },
      provenance: "EXPLICIT" as const,
      revision: 1,
    };
  });
}

const RULESET = { rulesetId: "EU_561_2006_REST_ENGINE_V1", rulesetVersion: "1", policyVersion: "2026-09" } as const;
const W1 = "2026-02-02";
const W2 = "2026-02-09";

function engineInput(facts: ActivityFactInput[], asOf = instant("2026-02-16"), overrides: Partial<EvaluateRestEngineInput> = {}): EvaluateRestEngineInput {
  return {
    facts,
    asOfEpochMilliseconds: asOf,
    ruleset: RULESET,
    evaluationWeekIds: [W1, W2],
    historyStartEpochMilliseconds: instant(W1),
    factualCoverageCompleteThroughAsOf: true,
    ...overrides,
  };
}

const baseWork: WorkTimes = {
  "2026-02-02": ["08:00:00", "18:00:00"],
  "2026-02-04": ["00:00:00", "10:00:00"],
  "2026-02-06": ["08:00:00", "18:00:00"],
  "2026-02-09": ["06:00:00", "16:00:00"],
  "2026-02-10": ["08:00:00", "18:00:00"],
  "2026-02-11": ["08:00:00", "18:00:00"],
  "2026-02-12": ["08:00:00", "18:00:00"],
  "2026-02-13": ["08:00:00", "18:00:00"],
  "2026-02-14": ["08:00:00", "18:00:00"],
  "2026-02-15": ["08:00:00", "18:00:00"],
};

function findRest(evaluation: EngineEvaluation, startDate: string): number | null {
  const target = evaluation.restIntervals.find((item) => item.startBoundary.time?.wallDate === startDate && item.startBoundary.role === "WORK_END");
  return target?.elapsedMilliseconds ?? null;
}

function completedCount(evaluation: EngineEvaluation): number {
  return evaluation.compensation.branchEvaluations.reduce((sum, item) => sum + item.completedObligationIds.length, 0);
}

function obligationCount(evaluation: EngineEvaluation): number {
  return evaluation.compensation.branchEvaluations.reduce((sum, item) => sum + item.obligations.length, 0);
}

test("T192", "same facts and asOf produce deterministic equality", () => {
  const input = engineInput(timelineFacts(baseWork));
  assert.deepEqual(evaluateRestEngine(input), evaluateRestEngine({ ...input, facts: [...input.facts].reverse() }));
});

test("T193", "facts hash includes explicit asOf", () => {
  const input = engineInput(timelineFacts(baseWork));
  assert.notEqual(computeFactsHash(input), computeFactsHash({ ...input, asOfEpochMilliseconds: input.asOfEpochMilliseconds - HOUR }));
});

test("T194", "facts hash includes ruleset and policy configuration", () => {
  const input = engineInput(timelineFacts(baseWork));
  assert.notEqual(computeFactsHash(input), computeFactsHash({ ...input, ruleset: { ...RULESET, policyVersion: "2026-10" } }));
});

test("T195", "correction shortens rest and rebuilds chronology", () => {
  const before = evaluateRestEngine(engineInput(timelineFacts(baseWork)));
  const changed = { ...baseWork, "2026-02-04": ["06:00:00", "10:00:00"] as [string, string] };
  const after = evaluateRestEngine(engineInput(timelineFacts(changed)));
  assert.equal(findRest(before, "2026-02-02"), 30 * HOUR);
  assert.equal(findRest(after, "2026-02-02"), 36 * HOUR);
  assert.notEqual(before.evaluationFingerprint, after.evaluationFingerprint);
});

test("T196", "correction extends rest and rebuilds chronology", () => {
  const short = { ...baseWork, "2026-02-04": ["00:00:00", "10:00:00"] as [string, string] };
  const long = { ...baseWork, "2026-02-04": ["12:00:00", "18:00:00"] as [string, string] };
  assert.equal(findRest(evaluateRestEngine(engineInput(timelineFacts(long))), "2026-02-02"), 42 * HOUR);
  assert.ok((findRest(evaluateRestEngine(engineInput(timelineFacts(long))), "2026-02-02") ?? 0) > (findRest(evaluateRestEngine(engineInput(timelineFacts(short))), "2026-02-02") ?? 0));
});

test("T197", "correction removes a qualifying weekly rest", () => {
  const afterWork = { ...baseWork, "2026-02-03": ["08:00:00", "18:00:00"] as [string, string] };
  const before = evaluateRestEngine(engineInput(timelineFacts(baseWork)));
  const after = evaluateRestEngine(engineInput(timelineFacts(afterWork)));
  assert.ok(before.weeklyRestOptions.some((item) => item.restIntervalId && item.pattern === "SINGLE_REDUCED"));
  assert.ok(after.restIntervals.some((item) => item.elapsedMilliseconds === 14 * HOUR));
  assert.ok(after.weeklyRestOptions.length < before.weeklyRestOptions.length);
});

test("T198", "correction changes fixed-week allocation branches", () => {
  const before = evaluateRestEngine(engineInput(timelineFacts(baseWork)));
  const shifted = { ...baseWork, "2026-02-09": ["00:30:00", "10:30:00"] as [string, string] };
  const after = evaluateRestEngine(engineInput(timelineFacts(shifted)));
  const beforeAssignments = new Set(before.allocation.branches.flatMap((item) => item.fixedWeekAssignments.map((value) => `${value.fixedWeekId}:${value.componentId}`)));
  const afterAssignments = new Set(after.allocation.branches.flatMap((item) => item.fixedWeekAssignments.map((value) => `${value.fixedWeekId}:${value.componentId}`)));
  assert.notDeepEqual(beforeAssignments, afterAssignments);
});

test("T199", "fixed-week correction changes derived compensation deadlines", () => {
  const crossing: WorkTimes = { "2026-02-08": ["08:00:00", "12:00:00"], "2026-02-09": ["18:00:00", "23:00:00"] };
  const before = evaluateRestEngine(engineInput(timelineFacts(crossing)));
  const shortened: WorkTimes = { ...crossing, "2026-02-09": ["10:00:00", "23:00:00"] };
  const after = evaluateRestEngine(engineInput(timelineFacts(shortened)));
  const deadlines = (value: EngineEvaluation) => [...new Set(value.compensation.branchEvaluations.flatMap((item) => item.obligations.map((obligation) => obligation.deadlineEpochMilliseconds)))].sort();
  assert.notDeepEqual(deadlines(before), deadlines(after));
});

test("T200", "shortening a repayment rest can reopen completed debt", () => {
  const before = evaluateRestEngine(engineInput(timelineFacts(baseWork)));
  const changed = { ...baseWork, "2026-02-07": ["17:00:00", "23:00:00"] as [string, string], "2026-02-08": ["10:00:00", "20:00:00"] as [string, string] };
  const after = evaluateRestEngine(engineInput(timelineFacts(changed)));
  assert.ok(completedCount(before) > completedCount(after));
  assert.ok(after.compensation.branchEvaluations.some((item) => item.outstandingObligationIds.length > 0));
});

test("T201", "source correction can make compensation debt disappear", () => {
  const before = evaluateRestEngine(engineInput(timelineFacts(baseWork)));
  const regularSource = { ...baseWork, "2026-02-04": ["15:00:00", "23:00:00"] as [string, string] };
  const after = evaluateRestEngine(engineInput(timelineFacts(regularSource)));
  const sourceStart = instant("2026-02-02", "18:00:00");
  const sourceObligations = (value: EngineEvaluation) => value.compensation.branchEvaluations
    .flatMap((item) => item.obligations)
    .filter((item) => item.sourceStartEpochMilliseconds === sourceStart);
  assert.ok(sourceObligations(before).length > 0);
  assert.equal(sourceObligations(after).length, 0);
});

test("T202", "correction invalidates a previously valid repayment", () => {
  const before = evaluateRestEngine(engineInput(timelineFacts(baseWork)));
  const changed = { ...baseWork, "2026-02-07": ["17:00:00", "23:00:00"] as [string, string], "2026-02-08": ["10:00:00", "20:00:00"] as [string, string] };
  const after = evaluateRestEngine(engineInput(timelineFacts(changed)));
  assert.ok(completedCount(before) > completedCount(after));
});

test("T203", "correction can create a newly valid repayment", () => {
  const short = { ...baseWork, "2026-02-07": ["17:00:00", "23:00:00"] as [string, string], "2026-02-08": ["10:00:00", "20:00:00"] as [string, string] };
  const before = evaluateRestEngine(engineInput(timelineFacts(short)));
  const after = evaluateRestEngine(engineInput(timelineFacts(baseWork)));
  assert.ok(completedCount(after) > completedCount(before));
});

function legacySnapshot(start = "08:00:00"): Record<string, string> {
  const days = [{ id: "monday", dateISO: "2026-02-02", dayType: "work", start, finish: "18:00:00", completionSource: "user" }];
  return {
    "driverApp_week_2026-02-07": JSON.stringify({ days, settings: { companyName: "Protected" }, payslipActualWeek: "123" }),
    driverPayV4_weeklyCompensationLedger: JSON.stringify([{ completed: true, authoritative: false }]),
    settings: JSON.stringify({ companyName: "Protected" }),
    kilometres: "9001",
  };
}

class MemoryStorage implements KeyValueStorage {
  private values = new Map<string, string>();
  constructor(initial: Record<string, string>) { Object.entries(initial).forEach(([key, value]) => this.values.set(key, value)); }
  get length() { return this.values.size; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  dump() { return Object.fromEntries(this.values); }
}

test("T204", "migration first run writes versioned namespaced facts", () => {
  const storage = new MemoryStorage(legacySnapshot());
  const result = migrateLegacyStorage(storage, instant("2026-02-03"));
  assert.equal(result.migrationVersion, 1);
  assert.equal(result.migratedFactCount, 1);
  assert.ok(storage.getItem(REST_ENGINE_STORAGE_KEYS.current));
});

test("T205", "migration second run is idempotent", () => {
  const storage = new MemoryStorage(legacySnapshot());
  const first = migrateLegacyStorage(storage, instant("2026-02-03"));
  const second = migrateLegacyStorage(storage, instant("2026-02-03"));
  assert.deepEqual(second, first);
});

test("T206", "interrupted migration recovers from staging", () => {
  const storage = new MemoryStorage(legacySnapshot());
  assert.throws(() => migrateLegacyStorage(storage, instant("2026-02-03"), { beforeCommit: () => { throw new Error("simulated interruption"); } }));
  assert.equal(storage.getItem(REST_ENGINE_STORAGE_KEYS.current), null);
  const recovered = recoverInterruptedMigration(storage);
  assert.equal(recovered?.migratedFactCount, 1);
});

test("T207", "legacy derived ledger never overrides factual migration", () => {
  const snapshot = legacySnapshot();
  const migrated = migrateLegacyFacts(snapshot, instant("2026-02-03"));
  assert.deepEqual(migrated.ignoredDerivedKeys, ["driverPayV4_weeklyCompensationLedger"]);
  assert.doesNotMatch(JSON.stringify(migrated.facts), /authoritative|completed/);
});

test("T208", "backup restore causes migration and recomputation from restored facts", () => {
  const storage = new MemoryStorage(legacySnapshot("08:00:00"));
  const first = migrateLegacyStorage(storage, instant("2026-02-03"));
  storage.setItem("driverApp_week_2026-02-07", legacySnapshot("09:00:00")["driverApp_week_2026-02-07"]);
  const restored = migrateLegacyStorage(storage, instant("2026-02-03"));
  assert.notEqual(restored.sourceSnapshotHash, first.sourceSnapshotHash);
  assert.notDeepEqual(restored.facts, first.facts);
});

test("T209", "deleting derived cache changes no evaluation output", () => {
  const input = engineInput(timelineFacts(baseWork));
  const cache: DerivedEvaluationCache = new Map();
  const first = evaluateRestEngine(input, cache);
  invalidateDerivedCache(cache);
  const second = evaluateRestEngine(input, cache);
  assert.deepEqual(second, first);
});

test("T210", "stale cache cannot override recomputation", () => {
  const input = engineInput(timelineFacts(baseWork));
  const correct = evaluateRestEngine(input);
  const cache: DerivedEvaluationCache = new Map([[correct.factsHash, { ...correct, evaluationFingerprint: "stale" }]]);
  assert.equal(evaluateRestEngine(input, cache).evaluationFingerprint, correct.evaluationFingerprint);
});

test("T211", "navigation state cannot alter legal evaluation", () => {
  const input = engineInput(timelineFacts(baseWork));
  const withView = { ...input, navigationScreen: "settings" } as EvaluateRestEngineInput;
  assert.deepEqual(evaluateRestEngine(withView), evaluateRestEngine(input));
});

test("T212", "archive view state cannot alter legal evaluation", () => {
  const input = engineInput(timelineFacts(baseWork));
  assert.deepEqual(evaluateRestEngine({ ...input, archiveOpen: true } as EvaluateRestEngineInput), evaluateRestEngine(input));
});

test("T213", "selected pay week cannot alter legal evaluation", () => {
  const input = engineInput(timelineFacts(baseWork));
  assert.deepEqual(evaluateRestEngine({ ...input, selectedSaturday: "2099-01-03" } as EvaluateRestEngineInput), evaluateRestEngine(input));
});

test("T214", "End Week workflow state cannot alter legal evaluation", () => {
  const input = engineInput(timelineFacts(baseWork));
  assert.deepEqual(evaluateRestEngine({ ...input, endWeekModalOpen: true } as EvaluateRestEngineInput), evaluateRestEngine(input));
});

test("T215", "unchanged facts retain stable IDs and issue codes", () => {
  const input = engineInput(timelineFacts(baseWork));
  const first = evaluateRestEngine(input);
  const second = evaluateRestEngine(input);
  assert.deepEqual(first.restIntervals.map((item) => item.restIntervalId), second.restIntervals.map((item) => item.restIntervalId));
  assert.deepEqual(first.chronologyIssues.map((item) => [item.issueId, item.code]), second.chronologyIssues.map((item) => [item.issueId, item.code]));
});

type WarningSpec = {
  id: string;
  status?: CompensationResultStatus;
  deadline?: number;
  legalState?: AllocationBranch["legalState"];
  review?: boolean;
  deadlineCase?: "CASE_A" | "CASE_B" | "CASE_C";
};

function warningEngine(specs: WarningSpec[], asOf: number, complete = true): EngineEvaluation {
  const branches: AllocationBranch[] = specs.map((spec) => ({
    branchId: spec.id,
    branchFingerprint: `fingerprint:${spec.id}`,
    components: [], fixedWeekAssignments: [], additionalComponents: [], rollingQualifyingRests: [], rollingCycleResets: [], twoWeekEvaluations: [],
    reviewStatus: spec.review ? "REVIEW_REQUIRED" : "CLEAR",
    reviewReasons: spec.review ? ["Fixture review evidence."] : [],
    legalState: spec.legalState ?? (spec.review ? "REVIEW" : "COMPLIANT"),
    invalidReasons: spec.legalState === "VIOLATED" ? ["Fixture branch impossible."] : [],
    sourceOptionIds: [],
  }));
  const evaluations: BranchCompensationEvaluation[] = specs.map((spec) => {
    const deadline = spec.deadline ?? asOf + 28 * 24 * HOUR;
    const obligationId = `obligation:${spec.id}`;
    const hasDebt = Boolean(spec.status);
    const obligation = {
      obligationId, branchId: spec.id, sourceComponentId: `component:${spec.id}`, sourceRestIntervalId: `source:${spec.id}`,
      sourceFixedWeekAssignmentId: `assignment:${spec.id}`, sourceFixedWeekId: W1, sourceStartEpochMilliseconds: asOf - 10 * HOUR,
      sourceEndEpochMilliseconds: asOf - 5 * HOUR, sourceReducedDurationMilliseconds: 30 * HOUR, requiredCompensationMilliseconds: 15 * HOUR,
      createdAtEpochMilliseconds: asOf - 5 * HOUR, deadlineEpochMilliseconds: deadline,
      deadlineFixedWeekId: fixedLegalWeekForInstant(deadline).weekId, reviewStatus: spec.review ? "REVIEW_REQUIRED" as const : "CLEAR" as const, provenance: "EXPLICIT" as const,
    };
    const result = { obligationId, status: spec.status ?? "COMPLETED_ON_TIME" as const, remainingCompensationMilliseconds: spec.status === "COMPLETED_ON_TIME" ? 0 : 15 * HOUR, attachmentId: spec.deadlineCase ? `attachment:${spec.id}` : null, reviewReasons: spec.review ? ["Fixture review evidence."] : [] };
    const attachment = spec.deadlineCase ? [{
      attachmentId: `attachment:${spec.id}`, obligationId, blockId: `block:${spec.id}`, baseId: `base:${spec.id}`, restIntervalId: `repayment:${spec.id}`,
      layout: "BASE_THEN_BLOCK" as const, packageCompletionEpochMilliseconds: deadline,
      deadlineCase: spec.deadlineCase, status: spec.status ?? "COMPLETED_ON_TIME", reviewStatus: spec.review ? "REVIEW_REQUIRED" as const : "CLEAR" as const,
    }] : [];
    return {
      evaluationId: `evaluation:${spec.id}`, branchId: spec.id, phase4BranchFingerprint: `fingerprint:${spec.id}`, layoutStrategy: "BASE_THEN_BLOCK",
      obligations: hasDebt ? [obligation] : [], blocks: [], attachmentBases: [], attachments: attachment,
      obligationResults: hasDebt ? [result] : [], completedObligationIds: spec.status === "COMPLETED_ON_TIME" ? [obligationId] : [],
      outstandingObligationIds: hasDebt && spec.status !== "COMPLETED_ON_TIME" ? [obligationId] : [], unallocatedCapacity: [], diagnostics: [],
      evaluationFingerprint: `compensation:${spec.id}:${spec.status ?? "none"}:${deadline}`,
    };
  });
  return {
    schemaVersion: 1, factsHash: "facts:warning-fixture", evaluationFingerprint: `engine:${JSON.stringify(specs)}`,
    asOfEpochMilliseconds: asOf, ruleset: RULESET, factualCoverageCompleteThroughAsOf: complete, evaluationWeekIds: [W1, W2],
    activityFacts: [], restIntervals: [], weeklyRestOptions: [],
    allocation: { branches, eliminatedBranchesOrDiagnostics: [], issues: [] },
    compensation: { branchEvaluations: evaluations, convergences: [] }, chronologyIssues: [], weeklyRestCandidateIssues: [], allocationIssues: [],
  };
}

const warningAsOf = instant("2026-02-10", "12:00:00");

test("T216", "no debt produces GREEN", () => assert.equal(aggregateBranchWarnings(warningEngine([{ id: "a" }], warningAsOf)).level, "GREEN"));
test("T217", "ordinary outstanding debt before final week stays GREEN with debt preserved", () => {
  const warning = aggregateBranchWarnings(warningEngine([{ id: "a", status: "OUTSTANDING", deadline: instant("2026-03-15") }], warningAsOf));
  assert.equal(warning.level, "GREEN"); assert.equal(warning.debtOutstanding, true);
});
test("T218", "confirmed debt in final deadline week is YELLOW", () => assert.equal(aggregateBranchWarnings(warningEngine([{ id: "a", status: "OUTSTANDING", deadline: instant("2026-02-15") }], warningAsOf)).level, "YELLOW"));
test("T219", "Allocation pending is YELLOW", () => {
  const warning = aggregateBranchWarnings(warningEngine([{ id: "a", status: "OVERDUE", deadline: warningAsOf - HOUR }, { id: "b", status: "OUTSTANDING", deadline: warningAsOf + 30 * 24 * HOUR }], warningAsOf));
  assert.equal(warning.level, "YELLOW"); assert.equal(warning.allocationPending, true);
});
test("T220", "provisional debt is YELLOW", () => assert.equal(aggregateBranchWarnings(warningEngine([{ id: "a", status: "REVIEW", review: true }], warningAsOf)).level, "YELLOW"));
test("T221", "compensation rest in progress is YELLOW", () => assert.equal(aggregateBranchWarnings(warningEngine([{ id: "a", status: "THRESHOLD_REACHED_PROVISIONAL", deadlineCase: "CASE_A" }], warningAsOf)).level, "YELLOW"));
test("T222", "ongoing threshold reached is YELLOW", () => assert.equal(classifyOngoingThreshold({ elapsedMilliseconds: 15 * HOUR, thresholdMilliseconds: 15 * HOUR, ongoing: true }), "YELLOW"));
test("T223", "Decision 2 Case B is YELLOW", () => assert.equal(aggregateBranchWarnings(warningEngine([{ id: "a", status: "UNRESOLVED_ATTACHMENT_DEADLINE", deadlineCase: "CASE_B" }], warningAsOf)).level, "YELLOW"));
test("T224", "confirmed Case A is non-RED", () => assert.notEqual(aggregateBranchWarnings(warningEngine([{ id: "a", status: "COMPLETED_ON_TIME", deadlineCase: "CASE_A" }], warningAsOf)).level, "RED"));
test("T225", "certain Case C after deadline is RED", () => assert.equal(aggregateBranchWarnings(warningEngine([{ id: "a", status: "OVERDUE", deadline: warningAsOf - HOUR, deadlineCase: "CASE_C" }], warningAsOf)).level, "RED"));
test("T226", "one valid branch prevents RED", () => assert.equal(aggregateBranchWarnings(warningEngine([{ id: "a", status: "OVERDUE", deadline: warningAsOf - HOUR }, { id: "b", status: "COMPLETED_ON_TIME" }], warningAsOf)).level, "YELLOW"));
test("T227", "all valid branches impossible produce RED with complete facts", () => assert.equal(aggregateBranchWarnings(warningEngine([{ id: "a", legalState: "VIOLATED" }, { id: "b", legalState: "VIOLATED" }], warningAsOf)).level, "RED"));
test("T228", "exact deadline equality remains on time", () => assert.notEqual(aggregateBranchWarnings(warningEngine([{ id: "a", status: "OUTSTANDING", deadline: warningAsOf }], warningAsOf)).level, "RED"));
test("T229", "passed deadline without valid completion is RED", () => assert.equal(aggregateBranchWarnings(warningEngine([{ id: "a", status: "OUTSTANDING", deadline: warningAsOf - 1 }], warningAsOf)).level, "RED"));
test("T230", "correction-invalidated completion after deadline is RED", () => {
  const before = aggregateBranchWarnings(warningEngine([{ id: "a", status: "COMPLETED_ON_TIME", deadline: warningAsOf - HOUR }], warningAsOf));
  const after = aggregateBranchWarnings(warningEngine([{ id: "a", status: "OVERDUE", deadline: warningAsOf - HOUR }], warningAsOf));
  assert.notEqual(before.level, "RED"); assert.equal(after.level, "RED");
});
test("T231", "correction-invalidated completion before deadline with option remaining is not RED", () => assert.notEqual(aggregateBranchWarnings(warningEngine([{ id: "a", status: "OUTSTANDING", deadline: warningAsOf + 30 * 24 * HOUR }], warningAsOf)).level, "RED"));
test("T232", "incomplete factual coverage prevents unsupported RED", () => assert.equal(aggregateBranchWarnings(warningEngine([{ id: "a", status: "OVERDUE", deadline: warningAsOf - HOUR }], warningAsOf, false)).level, "YELLOW"));
test("T233", "REVIEW uncertainty prevents unsupported RED", () => assert.equal(aggregateBranchWarnings(warningEngine([{ id: "a", status: "REVIEW", deadline: warningAsOf - HOUR, review: true }], warningAsOf)).level, "YELLOW"));
test("T234", "earliest candidate deadline remains planning information only", () => {
  const early = warningAsOf + 10 * HOUR; const late = warningAsOf + 30 * HOUR;
  const warning = aggregateBranchWarnings(warningEngine([{ id: "a", status: "OUTSTANDING", deadline: early }, { id: "b", status: "OUTSTANDING", deadline: late }], warningAsOf), 9 * HOUR);
  assert.equal(warning.legalDeadlineEpochMilliseconds, null); assert.equal(warning.earliestCandidateLegalDeadlineEpochMilliseconds, early); assert.equal(warning.planningLatestStartEpochMilliseconds, early - 9 * HOUR);
});
test("T235", "warning aggregation never mutates factual Rest Card inputs", () => {
  const engine = evaluateRestEngine(engineInput(timelineFacts(baseWork))); const before = JSON.stringify(engine.restIntervals);
  const warning = aggregateBranchWarnings(engine); assert.equal(JSON.stringify(engine.restIntervals), before); assert.equal(warning.factualRestCardStateChanged, false);
});
test("T236", "pay-week navigation and archive metadata cannot alter warning result", () => {
  const engine = warningEngine([{ id: "a", status: "OUTSTANDING", deadline: instant("2026-03-15") }], warningAsOf);
  assert.deepEqual(aggregateBranchWarnings({ ...engine, selectedWeek: "2099" } as EngineEvaluation), aggregateBranchWarnings({ ...engine, archiveOpen: true } as EngineEvaluation));
});
test("T237", "branch difference explanation is stable and explicit", () => {
  const warning = aggregateBranchWarnings(warningEngine([{ id: "a", status: "OVERDUE", deadline: warningAsOf - HOUR }, { id: "b", status: "COMPLETED_ON_TIME" }], warningAsOf));
  assert.deepEqual(explainBranchDifference(warning.branchWarnings.filter((item) => item.validBranch)), ["Valid allocation branches produce materially different debt, deadline, or compliance outcomes."]);
});

test("T238", "historical edit recomputes facts hash and re-derives warning", () => {
  const before = evaluateRestEngine(engineInput(timelineFacts(baseWork)));
  const changed = { ...baseWork, "2026-02-04": ["15:00:00", "23:00:00"] as [string, string] };
  const after = evaluateRestEngine(engineInput(timelineFacts(changed)));
  assert.notEqual(before.factsHash, after.factsHash);
  assert.notEqual(aggregateBranchWarnings(before).warningId, aggregateBranchWarnings(after).warningId);
});

test("T239", "unsupported old obligations disappear instead of being mutated", () => {
  const before = evaluateRestEngine(engineInput(timelineFacts(baseWork)));
  const changed = { ...baseWork, "2026-02-04": ["15:00:00", "23:00:00"] as [string, string] };
  const after = evaluateRestEngine(engineInput(timelineFacts(changed)));
  const oldIds = new Set(before.compensation.branchEvaluations.flatMap((item) => item.obligations.map((value) => value.obligationId)));
  const newIds = new Set(after.compensation.branchEvaluations.flatMap((item) => item.obligations.map((value) => value.obligationId)));
  assert.ok([...oldIds].some((id) => !newIds.has(id)));
});

test("T240", "stored derived cache invalidation preserves every protected legacy key", () => {
  const original = legacySnapshot(); const storage = new MemoryStorage({ ...original, [REST_ENGINE_STORAGE_KEYS.derivedCache]: "stale" });
  invalidateStoredDerivedCache(storage);
  for (const [key, value] of Object.entries(original)) assert.equal(storage.getItem(key), value);
  assert.equal(storage.getItem(REST_ENGINE_STORAGE_KEYS.derivedCache), null);
});

test("T241", "migration preserves rollback snapshot and unrelated application data", () => {
  const original = legacySnapshot(); const storage = new MemoryStorage(original); migrateLegacyStorage(storage, instant("2026-02-03"));
  assert.deepEqual(readLegacyRollbackSnapshot(storage), original);
  for (const [key, value] of Object.entries(original)) assert.equal(storage.getItem(key), value);
});

test("T242", "planning latest-start target remains distinct from legal deadline", () => {
  const deadline = warningAsOf + 20 * HOUR;
  const selected = selectEarliestPlanningDeadline([deadline], 11 * HOUR);
  assert.equal(selected.earliestCandidateLegalDeadlineEpochMilliseconds, deadline);
  assert.equal(selected.planningLatestStartEpochMilliseconds, deadline - 11 * HOUR);
  assert.notEqual(selected.planningLatestStartEpochMilliseconds, selected.earliestCandidateLegalDeadlineEpochMilliseconds);
});

test("T243", "interrupted re-migration recovers staged B over existing current A", () => {
  const storage = new MemoryStorage(legacySnapshot("08:00:00"));
  const migrationA = migrateLegacyStorage(storage, instant("2026-02-03"));
  assert.equal(readCurrentMigration(storage)?.sourceSnapshotHash, migrationA.sourceSnapshotHash);

  const snapshotB = legacySnapshot("09:00:00");
  const weekKey = "driverApp_week_2026-02-07";
  storage.setItem(weekKey, snapshotB[weekKey]);
  assert.throws(() => migrateLegacyStorage(storage, instant("2026-02-03"), {
    beforeCommit: () => { throw new Error("simulated B interruption"); },
  }));
  const stagedB = JSON.parse(storage.getItem(REST_ENGINE_STORAGE_KEYS.staging) as string);
  assert.notEqual(stagedB.sourceSnapshotHash, migrationA.sourceSnapshotHash);
  assert.equal(readCurrentMigration(storage)?.sourceSnapshotHash, migrationA.sourceSnapshotHash);

  const recovered = recoverInterruptedMigration(storage);
  assert.equal(recovered?.sourceSnapshotHash, stagedB.sourceSnapshotHash);
  assert.notEqual(recovered?.sourceSnapshotHash, migrationA.sourceSnapshotHash);
  assert.equal(readCurrentMigration(storage)?.sourceSnapshotHash, stagedB.sourceSnapshotHash);
  assert.equal(storage.getItem(REST_ENGINE_STORAGE_KEYS.staging), null);
  assert.equal(storage.getItem(weekKey), snapshotB[weekKey]);
  assert.equal(storage.getItem("settings"), snapshotB.settings);
});

function precedenceDay(start: string) {
  return { id: "monday", dateISO: "2026-02-02", dayType: "work", start, finish: "18:00:00", completionSource: "user" };
}

test("T244", "accepted factual precedence is archive then saved then live/current", () => {
  const snapshot = {
    archive: JSON.stringify([{ days: [precedenceDay("07:00:00")] }]),
    "driverApp_week_2026-02-07": JSON.stringify({ days: [precedenceDay("08:00:00")] }),
    days: JSON.stringify([precedenceDay("09:00:00")]),
  };
  const migrated = migrateLegacyFacts(snapshot, instant("2026-02-03"));
  assert.equal(migrated.status, "COMPLETE");
  assert.equal(migrated.facts.length, 1);
  assert.equal((migrated.facts[0].start as { wallTime: string }).wallTime, "09:00:00");
});

test("T245", "conflicting top-priority live aliases remain REVIEW without fallback", () => {
  const snapshot = {
    archive: JSON.stringify([{ days: [precedenceDay("07:00:00")] }]),
    "driverApp_week_2026-02-07": JSON.stringify({ days: [precedenceDay("08:00:00")] }),
    days: JSON.stringify([precedenceDay("09:00:00")]),
    driverApp_days: JSON.stringify([precedenceDay("10:00:00")]),
  };
  const migrated = migrateLegacyFacts(snapshot, instant("2026-02-03"));
  assert.equal(migrated.status, "REVIEW_REQUIRED");
  assert.match(migrated.reviewReasons.join(" "), /Conflicting highest-priority legacy facts/);
  assert.equal(new Set(migrated.facts.map((item) => item.factId)).size, 1);
  assert.deepEqual(migrated.facts.map((item) => (item.start as { wallTime: string }).wallTime).sort(), ["09:00:00", "10:00:00"]);
});

assert.equal(passed, selected);
if (requested.size) assert.equal(selected, requested.size, `Requested tests not found: ${[...requested].join(", ")}`);
console.log(`Phase 6+7 Rest Engine tests passed: ${passed}/${selected}`);
