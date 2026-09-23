import type { EngineEvaluation } from "./evaluate.ts";
import { fixedLegalWeekForInstant } from "./time.ts";
import type {
  AllocationBranch,
  BranchCompensationEvaluation,
  CompensationObligation,
  CompensationObligationResult,
  CompensationResultStatus,
} from "./types.ts";

export type WarningLevel = "NEUTRAL" | "GREEN" | "YELLOW" | "RED";

export type BranchWarning = {
  warningId: string;
  branchId: string;
  evaluationId: string | null;
  level: WarningLevel;
  validBranch: boolean;
  outstandingObligationIds: string[];
  legalDeadlines: number[];
  cases: Array<"CASE_A" | "CASE_B" | "CASE_C">;
  reasons: string[];
};

export type PlanningDeadlineSelection = {
  earliestCandidateLegalDeadlineEpochMilliseconds: number | null;
  planningLatestStartEpochMilliseconds: number | null;
  selectedContinuousRestMilliseconds: number | null;
};

export type WarningAggregation = {
  level: WarningLevel;
  warningId: string;
  debtOutstanding: boolean;
  outstandingObligationIds: string[];
  allocationPending: boolean;
  legalDeadlineEpochMilliseconds: number | null;
  earliestCandidateLegalDeadlineEpochMilliseconds: number | null;
  planningLatestStartEpochMilliseconds: number | null;
  branchWarnings: BranchWarning[];
  reasons: string[];
  factualRestCardStateChanged: false;
};

function unique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function digest(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
  }
  return value;
}

export function classifyOngoingThreshold(input: {
  elapsedMilliseconds: number;
  thresholdMilliseconds: number;
  ongoing: boolean;
  reviewRequired?: boolean;
}): WarningLevel {
  if (input.reviewRequired) return "YELLOW";
  if (input.ongoing && input.elapsedMilliseconds >= input.thresholdMilliseconds) return "YELLOW";
  return "GREEN";
}

export function selectEarliestPlanningDeadline(
  candidateLegalDeadlines: readonly number[],
  selectedContinuousRestMilliseconds?: number | null,
): PlanningDeadlineSelection {
  const valid = candidateLegalDeadlines.filter(Number.isSafeInteger).sort((left, right) => left - right);
  const earliest = valid[0] ?? null;
  const duration = selectedContinuousRestMilliseconds != null && selectedContinuousRestMilliseconds >= 0
    ? selectedContinuousRestMilliseconds
    : null;
  return deepFreeze({
    earliestCandidateLegalDeadlineEpochMilliseconds: earliest,
    planningLatestStartEpochMilliseconds: earliest != null && duration != null ? earliest - duration : null,
    selectedContinuousRestMilliseconds: duration,
  });
}

function resultFor(evaluation: BranchCompensationEvaluation, obligationId: string): CompensationObligationResult | undefined {
  return evaluation.obligationResults.find((item) => item.obligationId === obligationId);
}

function statusLevel(
  status: CompensationResultStatus,
  obligation: CompensationObligation,
  engine: EngineEvaluation,
): WarningLevel {
  if (status === "COMPLETED_ON_TIME") return "GREEN";
  if (status === "THRESHOLD_REACHED_PROVISIONAL" || status === "UNRESOLVED_ATTACHMENT_DEADLINE" || status === "REVIEW") return "YELLOW";
  const passed = engine.asOfEpochMilliseconds > obligation.deadlineEpochMilliseconds;
  if ((status === "OVERDUE" || status === "OUTSTANDING") && passed) {
    return engine.factualCoverageCompleteThroughAsOf ? "RED" : "YELLOW";
  }
  if (status === "OUTSTANDING") {
    const currentWeek = fixedLegalWeekForInstant(engine.asOfEpochMilliseconds).weekId;
    return currentWeek === obligation.deadlineFixedWeekId ? "YELLOW" : "GREEN";
  }
  return "YELLOW";
}

function maximumLevel(levels: readonly WarningLevel[]): WarningLevel {
  const rank: Record<WarningLevel, number> = { NEUTRAL: 0, GREEN: 1, YELLOW: 2, RED: 3 };
  return [...levels].sort((left, right) => rank[right] - rank[left])[0] ?? "NEUTRAL";
}

function branchWarning(
  engine: EngineEvaluation,
  allocation: AllocationBranch,
  evaluation?: BranchCompensationEvaluation,
): BranchWarning {
  const validBranch = allocation.legalState !== "VIOLATED";
  const reasons: string[] = [];
  const levels: WarningLevel[] = [];
  const obligations = evaluation?.obligations ?? [];
  const cases = evaluation?.attachments.map((item) => item.deadlineCase) ?? [];
  if (!validBranch) {
    levels.push(engine.factualCoverageCompleteThroughAsOf ? "RED" : "YELLOW");
    reasons.push(...allocation.invalidReasons, "The allocation branch is legally impossible.");
  }
  if (allocation.reviewStatus === "REVIEW_REQUIRED" || allocation.legalState === "REVIEW" || allocation.legalState === "PENDING") {
    levels.push("YELLOW");
    reasons.push(...allocation.reviewReasons, "The allocation branch remains provisional or requires review.");
  }
  for (const obligation of obligations) {
    const result = resultFor(evaluation as BranchCompensationEvaluation, obligation.obligationId);
    if (!result) continue;
    levels.push(statusLevel(result.status, obligation, engine));
    reasons.push(...result.reviewReasons);
    if (result.status === "OUTSTANDING" && engine.asOfEpochMilliseconds <= obligation.deadlineEpochMilliseconds) {
      const currentWeek = fixedLegalWeekForInstant(engine.asOfEpochMilliseconds).weekId;
      reasons.push(currentWeek === obligation.deadlineFixedWeekId
        ? "Confirmed compensation debt is in its final deadline week."
        : "Confirmed compensation debt remains outstanding before its final deadline week.");
    }
  }
  if (!levels.length) levels.push("GREEN");
  const level = maximumLevel(levels);
  const outstanding = evaluation?.obligationResults
    .filter((item) => item.status !== "COMPLETED_ON_TIME")
    .map((item) => item.obligationId) ?? [];
  return {
    warningId: `branch-warning:${digest(JSON.stringify([allocation.branchId, evaluation?.evaluationId ?? null, level, outstanding]))}`,
    branchId: allocation.branchId,
    evaluationId: evaluation?.evaluationId ?? null,
    level,
    validBranch,
    outstandingObligationIds: unique(outstanding),
    legalDeadlines: [...new Set(obligations.map((item) => item.deadlineEpochMilliseconds))].sort((left, right) => left - right),
    cases: [...new Set(cases)].sort(),
    reasons: unique(reasons),
  };
}

export function explainBranchDifference(branchWarnings: readonly BranchWarning[]): string[] {
  const signatures = new Set(branchWarnings.map((item) => JSON.stringify([
    item.level,
    item.outstandingObligationIds,
    item.legalDeadlines,
    item.cases,
  ])));
  if (signatures.size <= 1) return [];
  return ["Valid allocation branches produce materially different debt, deadline, or compliance outcomes."];
}

export function aggregateBranchWarnings(
  engine: EngineEvaluation,
  selectedContinuousRestMilliseconds?: number | null,
): WarningAggregation {
  const byBranch = new Map(engine.allocation.branches.map((item) => [item.branchId, item]));
  const branchWarnings: BranchWarning[] = [];
  for (const evaluation of engine.compensation.branchEvaluations) {
    const allocation = byBranch.get(evaluation.branchId);
    if (allocation) branchWarnings.push(branchWarning(engine, allocation, evaluation));
  }
  for (const allocation of engine.allocation.branches) {
    if (!engine.compensation.branchEvaluations.some((item) => item.branchId === allocation.branchId)) {
      branchWarnings.push(branchWarning(engine, allocation));
    }
  }
  branchWarnings.sort((left, right) => left.branchId.localeCompare(right.branchId) || (left.evaluationId ?? "").localeCompare(right.evaluationId ?? ""));

  const valid = branchWarnings.filter((item) => item.validBranch);
  // Invalid branches remain in branchWarnings for diagnostics, but a surviving
  // branch alone determines current public debt, deadlines and severity.
  const current = valid.length ? valid : branchWarnings;
  const differences = explainBranchDifference(valid);
  const anyNonRedValid = valid.some((item) => item.level !== "RED");
  const allBranchesRed = current.length > 0 && current.every((item) => item.level === "RED");
  let level: WarningLevel;
  if (allBranchesRed && engine.factualCoverageCompleteThroughAsOf) level = "RED";
  else if (differences.length || current.some((item) => item.level === "YELLOW") || (current.some((item) => item.level === "RED") && anyNonRedValid)) level = "YELLOW";
  else if (current.length) level = maximumLevel(current.map((item) => item.level));
  else level = "GREEN";
  if (level === "RED" && anyNonRedValid) level = "YELLOW";

  const outstandingObligationIds = unique(current.flatMap((item) => item.outstandingObligationIds));
  const deadlines = current.flatMap((item) => item.legalDeadlines);
  const planning = selectEarliestPlanningDeadline(deadlines, selectedContinuousRestMilliseconds);
  const uniqueDeadlines = [...new Set(deadlines)];
  const allocationPending = differences.length > 0;
  const reasons = unique([...current.flatMap((item) => item.reasons), ...differences]);
  const signature = JSON.stringify([engine.evaluationFingerprint, level, outstandingObligationIds, allocationPending, uniqueDeadlines.sort()]);
  return deepFreeze({
    level,
    warningId: `warning:${digest(signature)}`,
    debtOutstanding: outstandingObligationIds.length > 0,
    outstandingObligationIds,
    allocationPending,
    legalDeadlineEpochMilliseconds: uniqueDeadlines.length === 1 && !allocationPending ? uniqueDeadlines[0] : null,
    earliestCandidateLegalDeadlineEpochMilliseconds: planning.earliestCandidateLegalDeadlineEpochMilliseconds,
    planningLatestStartEpochMilliseconds: planning.planningLatestStartEpochMilliseconds,
    branchWarnings,
    reasons,
    factualRestCardStateChanged: false,
  });
}
