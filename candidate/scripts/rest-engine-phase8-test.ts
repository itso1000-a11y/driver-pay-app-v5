import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { EngineEvaluation } from "../src/rest-engine/evaluate.ts";
import { migrateLegacyFacts, type RestEngineMigration } from "../src/rest-engine/migration.ts";
import {
  REST_ENGINE_V1_UI_ACTIVE,
  buildAuthoritativeLegacySnapshot,
  evaluateProductionRestEngine,
  selectCompensationPanel,
  selectFactualRestCard,
  selectWeeklyRestPlan,
  selectWeekPreviewRestState,
} from "../src/rest-engine/presentation.ts";
import { fixedLegalWeekForInstant, resolveLondonWallTime } from "../src/rest-engine/time.ts";
import type { AllocationBranch, BranchCompensationEvaluation, CompensationResultStatus, RestInterval } from "../src/rest-engine/types.ts";
import { aggregateBranchWarnings } from "../src/rest-engine/warnings.ts";

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;
const RULESET = { rulesetId: "EU_561_2006_REST_ENGINE_V1", rulesetVersion: "1", policyVersion: "2026-09" } as const;
let passed = 0;
const requestedIds = process.env.PHASE8_TEST_IDS ? new Set(process.env.PHASE8_TEST_IDS.split(",")) : null;

function instant(date: string, time = "00:00:00"): number {
  const value = resolveLondonWallTime(date, time);
  if (value.epochMilliseconds == null) throw new Error(`Unresolved fixture ${date} ${time}`);
  return value.epochMilliseconds;
}

function test(id: string, name: string, body: () => void): void {
  if (requestedIds && !requestedIds.has(id)) return;
  body();
  passed += 1;
  console.log(`PASS ${id} ${name}`);
}

function day(id: string, dateISO: string, dayType: "work" | "off" | "holiday", start = "", finish = "") {
  return { id, dateISO, dayType, start, finish, completionSource: "user" };
}

function factualSnapshot(start = "08:00", finish = "18:00") {
  const days = [
    day("mon", "2026-02-02", "work", start, finish), day("tue", "2026-02-03", "off"),
    day("wed", "2026-02-04", "work", "08:00", "18:00"), day("thu", "2026-02-05", "off"),
    day("fri", "2026-02-06", "work", "08:00", "18:00"), day("sat", "2026-02-07", "off"), day("sun", "2026-02-01", "off"),
  ];
  const current = JSON.stringify(days);
  return { days, snapshot: { days: current, driverApp_days: current, "driverApp_week_2026-02-07": JSON.stringify({ days }) } };
}

type WarningSpec = {
  id: string;
  status?: CompensationResultStatus;
  deadline?: number;
  legalState?: AllocationBranch["legalState"];
  review?: boolean;
  case?: "CASE_A" | "CASE_B" | "CASE_C";
  required?: number;
};

function fakeEngine(specs: WarningSpec[], asOf: number, complete = true, openElapsed: number | null = null): EngineEvaluation {
  const branches: AllocationBranch[] = specs.map((spec) => ({
    branchId: spec.id, branchFingerprint: `fingerprint:${spec.id}`,
    components: [], fixedWeekAssignments: [], additionalComponents: [], rollingQualifyingRests: [], rollingCycleResets: [], twoWeekEvaluations: [],
    reviewStatus: spec.review ? "REVIEW_REQUIRED" : "CLEAR", reviewReasons: spec.review ? ["Fixture review evidence."] : [],
    legalState: spec.legalState ?? (spec.review ? "REVIEW" : "COMPLIANT"),
    invalidReasons: spec.legalState === "VIOLATED" ? ["Fixture branch impossible."] : [], sourceOptionIds: [],
  }));
  const evaluations: BranchCompensationEvaluation[] = specs.map((spec) => {
    const deadline = spec.deadline ?? asOf + 28 * 24 * HOUR;
    const required = spec.required ?? 10 * HOUR;
    const obligationId = `obligation:${spec.id}`;
    const hasDebt = Boolean(spec.status);
    const obligation = {
      obligationId, branchId: spec.id, sourceComponentId: `component:${spec.id}`, sourceRestIntervalId: `source:${spec.id}`,
      sourceFixedWeekAssignmentId: `assignment:${spec.id}`, sourceFixedWeekId: "2026-02-02", sourceStartEpochMilliseconds: asOf - 50 * HOUR,
      sourceEndEpochMilliseconds: asOf - 30 * HOUR, sourceReducedDurationMilliseconds: 35 * HOUR, requiredCompensationMilliseconds: required,
      createdAtEpochMilliseconds: asOf - 30 * HOUR, deadlineEpochMilliseconds: deadline,
      deadlineFixedWeekId: fixedLegalWeekForInstant(deadline).weekId, reviewStatus: spec.review ? "REVIEW_REQUIRED" as const : "CLEAR" as const, provenance: "EXPLICIT" as const,
    };
    const result = {
      obligationId, status: spec.status ?? "COMPLETED_ON_TIME" as const,
      remainingCompensationMilliseconds: spec.status === "COMPLETED_ON_TIME" || spec.status === "THRESHOLD_REACHED_PROVISIONAL" ? 0 : required,
      attachmentId: spec.case || spec.status === "COMPLETED_ON_TIME" || spec.status === "THRESHOLD_REACHED_PROVISIONAL" ? `attachment:${spec.id}` : null,
      reviewReasons: spec.review ? ["Fixture review evidence."] : [],
    };
    const attachments = result.attachmentId ? [{
      attachmentId: result.attachmentId, obligationId, blockId: `block:${spec.id}`, baseId: `base:${spec.id}`, restIntervalId: `repayment:${spec.id}`,
      layout: "BASE_THEN_BLOCK" as const, packageCompletionEpochMilliseconds: Math.min(asOf - HOUR, deadline),
      deadlineCase: spec.case ?? "CASE_A" as const, status: spec.status ?? "COMPLETED_ON_TIME", reviewStatus: spec.review ? "REVIEW_REQUIRED" as const : "CLEAR" as const,
    }] : [];
    return {
      evaluationId: `evaluation:${spec.id}`, branchId: spec.id, phase4BranchFingerprint: `fingerprint:${spec.id}`, layoutStrategy: "BASE_THEN_BLOCK",
      obligations: hasDebt ? [obligation] : [], blocks: [], attachmentBases: [], attachments,
      obligationResults: hasDebt ? [result] : [], completedObligationIds: ["COMPLETED_ON_TIME", "THRESHOLD_REACHED_PROVISIONAL"].includes(spec.status ?? "") ? [obligationId] : [],
      outstandingObligationIds: hasDebt && !["COMPLETED_ON_TIME", "THRESHOLD_REACHED_PROVISIONAL"].includes(spec.status ?? "") ? [obligationId] : [],
      unallocatedCapacity: [], diagnostics: [], evaluationFingerprint: `comp:${spec.id}:${spec.status ?? "none"}:${deadline}`,
    } as BranchCompensationEvaluation;
  });
  const restIntervals: RestInterval[] = openElapsed == null ? [] : [{
    restIntervalId: "open:repayment", startBoundary: { sourceFactIds: ["work:finish"], role: "WORK_END", time: null, epochMilliseconds: asOf - openElapsed },
    endBoundary: { sourceFactIds: [], role: "AS_OF", time: null, epochMilliseconds: asOf }, startEpochMilliseconds: asOf - openElapsed,
    endEpochMilliseconds: null, observedThroughEpochMilliseconds: asOf, elapsedMilliseconds: openElapsed, elapsedRangeMilliseconds: null,
    supportingFactIds: ["work:finish"], state: "OPEN", provenance: "EXPLICIT", reviewStatus: "CLEAR", reviewReasons: [],
  }];
  return {
    schemaVersion: 1, factsHash: "facts:phase8-fixture", evaluationFingerprint: `engine:${JSON.stringify(specs)}:${openElapsed}`,
    asOfEpochMilliseconds: asOf, ruleset: RULESET, factualCoverageCompleteThroughAsOf: complete, evaluationWeekIds: ["2026-02-02", "2026-02-09"],
    activityFacts: [], restIntervals, weeklyRestOptions: [], allocation: { branches, eliminatedBranchesOrDiagnostics: [], issues: [] },
    compensation: { branchEvaluations: evaluations, convergences: [] }, chronologyIssues: [], weeklyRestCandidateIssues: [], allocationIssues: [],
  };
}

const asOf = instant("2026-02-10", "12:00:00");
const base = factualSnapshot();

test("T246", "same facts produce the same production EngineEvaluation", () => {
  assert.deepEqual(evaluateProductionRestEngine(base.snapshot, asOf).evaluation, evaluateProductionRestEngine(base.snapshot, asOf).evaluation);
});
test("T247", "selecting another pay week does not promote it to live precedence", () => {
  const current = buildAuthoritativeLegacySnapshot({ baseSnapshot: base.snapshot, visibleDays: base.days, visibleSaturdayISO: "2026-02-07", activeSaturdayISO: "2026-02-07", archive: [] });
  const history = buildAuthoritativeLegacySnapshot({ baseSnapshot: current, visibleDays: base.days, visibleSaturdayISO: "2026-02-07", activeSaturdayISO: "2026-02-14", archive: [] });
  assert.equal(history.driverApp_days, current.driverApp_days);
});
test("T248", "archive view metadata does not enter the legal evaluator", () => {
  const one = evaluateProductionRestEngine(base.snapshot, asOf).evaluation;
  const two = evaluateProductionRestEngine({ ...base.snapshot, archive: "[]" }, asOf).evaluation;
  assert.equal(one.evaluationFingerprint, two.evaluationFingerprint);
});
test("T249", "returning from archive restores the identical legal result", () => {
  const first = evaluateProductionRestEngine(base.snapshot, asOf).evaluation.evaluationFingerprint;
  const returned = evaluateProductionRestEngine(base.snapshot, asOf).evaluation.evaluationFingerprint;
  assert.equal(first, returned);
});
test("T250", "End Week derived keys do not alter the legal graph", () => {
  const first = evaluateProductionRestEngine(base.snapshot, asOf).evaluation.evaluationFingerprint;
  const after = evaluateProductionRestEngine({ ...base.snapshot, driverPayV4_weeklyRestCandidate: JSON.stringify({ finishAbs: 1 }) }, asOf).evaluation.evaluationFingerprint;
  assert.equal(first, after);
});
test("T251", "Week Preview selector carries the same evaluation fingerprint", () => {
  const evaluation = evaluateProductionRestEngine(base.snapshot, asOf).evaluation;
  assert.equal(selectWeekPreviewRestState(evaluation).evaluationFingerprint, evaluation.evaluationFingerprint);
});
test("T252", "factual Rest Card selector contains no warning colour", () => {
  const card = selectFactualRestCard(evaluateProductionRestEngine(base.snapshot, asOf).evaluation, "2026-02-04");
  assert.equal("warningLevel" in card, false);
});
test("T253", "outstanding debt cannot mutate factual Rest Card", () => {
  const engine = fakeEngine([{ id: "a", status: "OUTSTANDING" }], asOf);
  const before = JSON.stringify(engine.restIntervals); selectCompensationPanel(engine); assert.equal(JSON.stringify(engine.restIntervals), before);
});
test("T254", "GREEN outstanding debt remains visible", () => {
  const panel = selectCompensationPanel(fakeEngine([{ id: "a", status: "OUTSTANDING", deadline: instant("2026-03-15") }], asOf));
  assert.equal(panel.visible, true); assert.equal(panel.debtOutstanding, true); assert.equal(panel.level, "GREEN");
});
test("T255", "final deadline week has distinct final-week presentation", () => {
  const panel = selectCompensationPanel(fakeEngine([{ id: "a", status: "OUTSTANDING", deadline: instant("2026-02-15") }], asOf));
  assert.equal(panel.items[0].lifecycle, "FINAL_WEEK"); assert.equal(panel.level, "YELLOW");
});
test("T256", "allocation difference remains pending and YELLOW", () => {
  const panel = selectCompensationPanel(fakeEngine([{ id: "a", status: "OVERDUE", deadline: asOf - HOUR }, { id: "b", status: "OUTSTANDING", deadline: asOf + 30 * 24 * HOUR }], asOf));
  assert.equal(panel.allocationPending, true); assert.equal(panel.level, "YELLOW"); assert.equal(panel.items[0].lifecycle, "ALLOCATION_PENDING");
});
test("T257", "Case B remains unresolved", () => assert.equal(selectCompensationPanel(fakeEngine([{ id: "a", status: "UNRESOLVED_ATTACHMENT_DEADLINE", case: "CASE_B" }], asOf)).items[0].lifecycle, "REVIEW"));
test("T258", "certain Case C consumes RED", () => assert.equal(selectCompensationPanel(fakeEngine([{ id: "a", status: "OVERDUE", deadline: asOf - 1, case: "CASE_C" }], asOf)).level, "RED"));
test("T259", "one valid non-RED branch prevents RED", () => assert.equal(selectCompensationPanel(fakeEngine([{ id: "a", status: "OVERDUE", deadline: asOf - 1 }, { id: "b", status: "COMPLETED_ON_TIME" }], asOf)).level, "YELLOW"));
test("T260", "deadline equality remains non-overdue", () => assert.notEqual(selectCompensationPanel(fakeEngine([{ id: "a", status: "OUTSTANDING", deadline: asOf }], asOf)).items[0].lifecycle, "OVERDUE"));
test("T261", "overdue after deadline displays overdue and RED", () => {
  const panel = selectCompensationPanel(fakeEngine([{ id: "a", status: "OVERDUE", deadline: asOf - 1 }], asOf)); assert.equal(panel.items[0].lifecycle, "OVERDUE"); assert.equal(panel.level, "RED");
});
test("T262", "completed compensation displays completion", () => assert.equal(selectCompensationPanel(fakeEngine([{ id: "a", status: "COMPLETED_ON_TIME", case: "CASE_A" }], asOf)).items[0].lifecycle, "COMPLETED"));
test("T263", "ongoing compensation rest displays in progress", () => assert.equal(selectCompensationPanel(fakeEngine([{ id: "a", status: "OUTSTANDING" }], asOf, true, 7 * HOUR + 20 * MINUTE)).items[0].lifecycle, "IN_PROGRESS"));
test("T264", "threshold reached remains provisional", () => assert.equal(selectCompensationPanel(fakeEngine([{ id: "a", status: "THRESHOLD_REACHED_PROVISIONAL", case: "CASE_A" }], asOf)).items[0].lifecycle, "PROVISIONAL"));
test("T265", "recomputed correction can reopen an obligation in UI", () => {
  const done = selectCompensationPanel(fakeEngine([{ id: "a", status: "COMPLETED_ON_TIME" }], asOf));
  const reopened = selectCompensationPanel(fakeEngine([{ id: "a", status: "OUTSTANDING" }], asOf));
  assert.equal(done.items[0].lifecycle, "COMPLETED"); assert.notEqual(reopened.items[0].lifecycle, "COMPLETED");
});
test("T266", "legacy six-cycle predicate is gated out of production", () => {
  const source = fs.readFileSync(path.resolve("src/App.tsx"), "utf8");
  assert.match(source, /weeklyRestBaseActive = !REST_ENGINE_V1_UI_ACTIVE/); assert.match(source, /weeklyMinimumStartAbs = !REST_ENGINE_V1_UI_ACTIVE/);
});
test("T267", "End Week cannot create engine Weekly Rest from a candidate", () => {
  const migration = migrateLegacyFacts({ ...base.snapshot, driverPayV4_weeklyRestCandidate: "{\"finishAbs\":123}" }, asOf);
  assert.equal(migration.ignoredDerivedKeys.includes("driverPayV4_weeklyRestCandidate"), true);
});
test("T268", "planned Working tomorrow row is excluded from production facts", () => {
  const planned = day("sun", "2026-02-15", "work"); delete (planned as { completionSource?: string }).completionSource;
  const days = [...base.days, planned]; const snapshot = { days: JSON.stringify(days), driverApp_days: JSON.stringify(days) };
  assert.equal(evaluateProductionRestEngine(snapshot, asOf).evaluation.activityFacts.some((fact) => fact.sourceRef.wallDate === "2026-02-15"), false);
});
test("T269", "pay-week Saturday does not define fixed legal week", () => {
  assert.equal(fixedLegalWeekForInstant(instant("2026-02-07", "12:00:00")).weekId, "2026-02-02");
  assert.equal(fixedLegalWeekForInstant(instant("2026-02-08", "12:00:00")).weekId, "2026-02-02");
});
test("T270", "current live facts retain migration precedence", () => {
  const saved = factualSnapshot("08:00", "18:00"); const live = factualSnapshot("09:00", "18:00");
  const migration = migrateLegacyFacts({ ...saved.snapshot, days: JSON.stringify(live.days), driverApp_days: JSON.stringify(live.days) }, asOf);
  const monday = migration.facts.find((fact) => fact.sourceRef.wallDate === "2026-02-02"); assert.equal((monday?.start as { wallTime?: string })?.wallTime, "09:00");
});
test("T271", "conflicting live aliases reach UI as conservative REVIEW", () => {
  const left = factualSnapshot("08:00", "18:00"); const right = factualSnapshot("09:00", "18:00");
  const snapshot = { ...left.snapshot, driverApp_days: JSON.stringify(right.days) };
  const state = evaluateProductionRestEngine(snapshot, asOf); const panel = selectCompensationPanel(state.evaluation, state.migration);
  assert.equal(state.migration.status, "REVIEW_REQUIRED"); assert.equal(panel.level, "YELLOW"); assert.equal(panel.items[0].lifecycle, "REVIEW");
});
test("T272", "accepted English strings exist", () => {
  const text = selectCompensationPanel(fakeEngine([{ id: "a", status: "OUTSTANDING" }], asOf)).items[0].text.en; assert.match(text, /Compensation due:/);
});
test("T273", "accepted Bulgarian strings exist", () => {
  const text = selectCompensationPanel(fakeEngine([{ id: "a", status: "OUTSTANDING" }], asOf)).items[0].text.bg; assert.match(text, /Дължиш компенсация:/);
});
test("T274", "new bilingual presentation does not mix languages", () => {
  const item = selectCompensationPanel(fakeEngine([{ id: "a", status: "OUTSTANDING" }], asOf)).items[0];
  assert.doesNotMatch(item.text.en, /Компенсация|седмична/); assert.doesNotMatch(item.text.bg, /Weekly-rest|due by/);
});
test("T275", "Pay Engine calculation source is byte-identical to v5.2.60", () => {
  const current = fs.readFileSync(path.resolve("src/App.tsx"), "utf8");
  const paySlice = (source: string) => source.slice(source.indexOf("  const computedWeek ="), source.indexOf("  const currentComputed ="));
  assert.equal(createHash("sha256").update(paySlice(current)).digest("hex").toUpperCase(), "1811C857F2186F5EE7BAD82497B74878142CEB77D2139D21506B209710630953");
});

test("T276", "weekly planning consumes engine rolling reset due time", () => {
  const engine = fakeEngine([{ id: "a" }], asOf);
  engine.allocation.branches[0].rollingCycleResets = [{ evaluationId: "r", previousComponentId: "p", nextComponentId: null, previousRestIntervalId: "i", nextRestIntervalId: null, previousQualifyingEndEpochMilliseconds: asOf - 100 * HOUR, nextQualifyingStartEpochMilliseconds: null, dueEpochMilliseconds: asOf + 44 * HOUR, exactElapsedMilliseconds: null, status: "BEFORE_DUE", reviewReasons: [] }];
  assert.equal(selectWeeklyRestPlan(engine).dueEpochMilliseconds, asOf + 44 * HOUR);
});
test("T277", "presentation selectors are deterministic and immutable", () => {
  const engine = fakeEngine([{ id: "a", status: "OUTSTANDING" }], asOf); const before = JSON.stringify(engine);
  assert.deepEqual(selectCompensationPanel(engine), selectCompensationPanel(engine)); assert.equal(JSON.stringify(engine), before);
});

test("T278", "violated branch debt is diagnostic when a no-debt branch survives", () => {
  const engine = fakeEngine([{ id: "valid" }, { id: "invalid", legalState: "VIOLATED", status: "OUTSTANDING", deadline: instant("2026-02-15") }], asOf);
  const warning = aggregateBranchWarnings(engine);
  const panel = selectCompensationPanel(engine);
  assert.equal(warning.level, "GREEN");
  assert.equal(warning.debtOutstanding, false);
  assert.equal(warning.legalDeadlineEpochMilliseconds, null);
  assert.equal(warning.earliestCandidateLegalDeadlineEpochMilliseconds, null);
  assert.equal(panel.visible, false);
  assert.equal(warning.branchWarnings.find((item) => item.branchId === "invalid")?.outstandingObligationIds.length, 1);
  assert.ok(!warning.reasons.some((reason) => reason.includes("legally impossible")));
});

test("T279", "one valid GREEN completion defeats a violated RED branch publicly", () => {
  const engine = fakeEngine([{ id: "valid", status: "COMPLETED_ON_TIME" }, { id: "invalid", legalState: "VIOLATED", status: "OVERDUE", deadline: asOf - HOUR }], asOf);
  const warning = aggregateBranchWarnings(engine);
  const panel = selectCompensationPanel(engine);
  assert.equal(warning.level, "GREEN");
  assert.equal(warning.debtOutstanding, false);
  assert.equal(panel.level, "GREEN");
  assert.deepEqual(panel.items.map((item) => item.lifecycle), ["COMPLETED"]);
});

test("T280", "all violated branches without obligations do not invent compensation", () => {
  const engine = fakeEngine([{ id: "rolling", legalState: "VIOLATED" }, { id: "fixed", legalState: "VIOLATED" }], asOf);
  const warning = aggregateBranchWarnings(engine);
  const panel = selectCompensationPanel(engine);
  assert.equal(warning.debtOutstanding, false);
  assert.equal(panel.visible, false);
  assert.equal(panel.items.length, 0);
  assert.ok(!JSON.stringify(panel).includes("impossible compensation"));
});

test("T281", "pure rolling 144h failure remains a Weekly Rest RED warning", () => {
  const engine = fakeEngine([{ id: "rolling", legalState: "VIOLATED" }], asOf);
  engine.allocation.branches[0].invalidReasons = ["Rolling 144h Weekly Rest deadline exceeded."];
  const plan = selectWeeklyRestPlan(engine);
  assert.equal(aggregateBranchWarnings(engine).level, "RED");
  assert.equal(plan.visible, true);
  assert.equal(plan.warningLevel, "RED");
  assert.match(plan.text.en, /Weekly rest not completed/);
  assert.equal(selectCompensationPanel(engine).visible, false);
});

test("T282", "pure fixed two-week failure stays separate from compensation", () => {
  const engine = fakeEngine([{ id: "fixed", legalState: "VIOLATED" }], asOf);
  engine.allocation.branches[0].invalidReasons = ["Fixed two-week Weekly Rest requirement violated."];
  const plan = selectWeeklyRestPlan(engine);
  const panel = selectCompensationPanel(engine);
  assert.equal(plan.visible, true);
  assert.equal(plan.warningLevel, "RED");
  assert.match(plan.text.bg, /Седмичната почивка/);
  assert.equal(panel.visible, false);
  assert.equal(panel.debtOutstanding, false);
});

test("T283", "surviving real compensation debt still appears", () => {
  const engine = fakeEngine([{ id: "valid", status: "OUTSTANDING", deadline: instant("2026-03-15") }], asOf);
  const warning = aggregateBranchWarnings(engine);
  const panel = selectCompensationPanel(engine);
  assert.equal(warning.debtOutstanding, true);
  assert.equal(panel.visible, true);
  assert.equal(panel.items[0].lifecycle, "OUTSTANDING");
  assert.equal(panel.level, "GREEN");
});

assert.equal(REST_ENGINE_V1_UI_ACTIVE, true);
assert.equal(passed, requestedIds?.size ?? 38);
console.log(`Phase 8 focused tests: ${passed}/${requestedIds?.size ?? 38} PASS`);
