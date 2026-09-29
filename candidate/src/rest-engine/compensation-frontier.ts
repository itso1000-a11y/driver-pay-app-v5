import {
  type AllocationBranch,
  type BranchCompensationEvaluation,
  type CompensationEvaluationContext,
  type CompensationObligationResult,
  type FixedWeekAssignment,
  type RestInterval,
  type WeeklyRestComponent,
} from "./types.ts";
import type { AllocationFrontier, AllocationFrontierAlternative, ReducedSourceSeed } from "./allocation-frontier.ts";
import { fixedLegalWeekForInstant, resolveLondonWallTime } from "./time.ts";
import { evaluateCompensation, packageContinuationBranches } from "./compensation.ts";

export type FinalizedCompensationResult = {
  finalizedResultId: string;
  allocationAlternativeId: string;
  continuationLineageId: string;
  obligationId: string;
  sourceComponentId: string;
  sourceRestIntervalId: string;
  sourceFixedWeekId: string;
  requiredCompensationMilliseconds: number;
  deadlineEpochMilliseconds: number;
  status: CompensationObligationResult["status"];
  attachmentId: string | null;
  reviewReasons: readonly string[];
};

export type CompensationFrontierAlternative = {
  compensationAlternativeId: string;
  allocationAlternativeId: string;
  continuationLineageId: string;
  evaluation: BranchCompensationEvaluation;
  liveObligationIds: readonly string[];
};
export type CompensationFrontier = { alternatives: readonly CompensationFrontierAlternative[] };
export type CompensationFrontierTransition = { nextCompensationFrontier: CompensationFrontier; newlyFinalizedCompensationResults: readonly FinalizedCompensationResult[]; packageBranches: readonly { parentAlternativeId:string; branch:AllocationBranch }[] };

function canonical(value: unknown): string { return JSON.stringify(value); }

type PackageContinuation = {
  packageContinuationId: string;
  continuationLineageId: string;
  /** One bounded predecessor edge for the exact persisted successor only. */
  predecessorContinuationLineageId?: string;
  oldObligationId: string;
  factualRestIntervalId: string;
  weeklyComponent: WeeklyRestComponent;
  fixedWeekAssignment: FixedWeekAssignment | null;
};

function isPackageContinuation(value: unknown): value is PackageContinuation {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PackageContinuation>;
  return typeof candidate.packageContinuationId === "string"
    && typeof candidate.continuationLineageId === "string"
    && typeof candidate.oldObligationId === "string"
    && typeof candidate.factualRestIntervalId === "string"
    && !!candidate.weeklyComponent
    && typeof candidate.weeklyComponent.componentId === "string";
}

/**
 * Package refinements are derived continuation state. They are restored only
 * on their structural successor lineage before normal Phase 5 evaluation.
 */
function packageContinuationsFor(alternative: AllocationFrontierAlternative): PackageContinuation[] {
  return alternative.packageContinuations
    .filter(isPackageContinuation)
    .filter((item) => item.continuationLineageId === alternative.continuationLineageId)
    .sort((left, right) => left.packageContinuationId.localeCompare(right.packageContinuationId));
}
function componentFromSeed(seed: ReducedSourceSeed, interval: RestInterval): WeeklyRestComponent {
  const start = interval.startEpochMilliseconds ?? interval.observedThroughEpochMilliseconds;
  if (start == null) throw new RangeError(`Reduced source ${seed.componentId} has no factual RestInterval start.`);
  return { componentId: seed.componentId, restIntervalId: seed.restIntervalId, sourceOptionId: seed.sourceOptionId, componentIndex: 0, startEpochMilliseconds: start, endEpochMilliseconds: start + seed.sourceReducedDurationMilliseconds, startOffsetMilliseconds: 0, endOffsetMilliseconds: seed.sourceReducedDurationMilliseconds, durationMilliseconds: seed.sourceReducedDurationMilliseconds, classification: "REDUCED", role: "COUNTED", provenance: "EXPLICIT", reviewStatus: "CLEAR", reviewReasons: [] };
}
function assignmentFromSeed(seed: ReducedSourceSeed, component: WeeklyRestComponent): FixedWeekAssignment {
  const monday = resolveLondonWallTime(seed.fixedWeekId, "00:00:00").epochMilliseconds;
  if (monday == null) throw new RangeError(`Invalid ReducedSourceSeed fixed week: ${seed.fixedWeekId}.`);
  const week = fixedLegalWeekForInstant(monday);
  return { assignmentId: `incremental-assignment:${seed.componentId}:${seed.fixedWeekId}`, fixedWeekId: seed.fixedWeekId, componentId: seed.componentId, assignmentRole: "COUNTED_FOR_FIXED_WEEK", weekStartEpochMilliseconds: week.startEpochMilliseconds, weekEndEpochMilliseconds: week.endEpochMilliseconds };
}

/** Reconstructs only the allocation information compensation semantics require. */
export function compensationBranchFromAllocationAlternative(alternative: AllocationFrontierAlternative, restIntervals: readonly RestInterval[]): AllocationBranch {
  const intervals = new Map(restIntervals.map((interval) => [interval.restIntervalId, interval]));
  const components = [...alternative.countedComponents, ...alternative.additionalComponents];
  const assignments = [...alternative.assignments];
  const existing = new Set(components.map((component) => component.componentId));
  const assigned = new Set(assignments.map((assignment) => assignment.componentId));
  for (const packageContinuation of packageContinuationsFor(alternative)) {
    const component = packageContinuation.weeklyComponent;
    if (!existing.has(component.componentId)) {
      components.push(component);
      existing.add(component.componentId);
    }
    if (packageContinuation.fixedWeekAssignment && !assigned.has(component.componentId)) {
      assignments.push(packageContinuation.fixedWeekAssignment);
      assigned.add(component.componentId);
    }
  }
  for (const seed of alternative.reducedSourceSeeds) {
    if (existing.has(seed.componentId)) continue;
    const interval = intervals.get(seed.restIntervalId);
    if (!interval) throw new RangeError(`Reduced source ${seed.componentId} has no retained factual RestInterval.`);
    const component = componentFromSeed(seed, interval);
    components.push(component); assignments.push(assignmentFromSeed(seed, component)); existing.add(component.componentId);
  }
  return { branchId: `incremental:${alternative.alternativeId}`, branchFingerprint: alternative.alternativeId, continuationLineageId: alternative.continuationLineageId, packageContinuations: [...alternative.packageContinuations], components, fixedWeekAssignments: assignments, additionalComponents: components.filter((component) => component.role === "ADDITIONAL"), rollingQualifyingRests: [], rollingCycleResets: [], twoWeekEvaluations: [], reviewStatus: alternative.reviewStatus, reviewReasons: [...alternative.reviewReasons], legalState: "PENDING", invalidReasons: [], sourceOptionIds: [...alternative.sourceOptionIds] };
}
function finalizable(status: CompensationObligationResult["status"]): boolean { return status === "COMPLETED_ON_TIME" || status === "OVERDUE"; }

/** Finalized obligations are historical outcomes, never live continuation debt. */
function withoutPriorFinalized(evaluation: BranchCompensationEvaluation, finalizedIds: ReadonlySet<string>): BranchCompensationEvaluation {
  if (!finalizedIds.size) return evaluation;
  const keep = (obligationId: string) => !finalizedIds.has(obligationId);
  const obligations = evaluation.obligations.filter((item) => keep(item.obligationId));
  const blocks = evaluation.blocks.filter((item) => keep(item.obligationId));
  const attachments = evaluation.attachments.filter((item) => keep(item.obligationId));
  const obligationResults = evaluation.obligationResults.filter((item) => keep(item.obligationId));
  return {
    ...evaluation,
    obligations,
    blocks,
    attachments,
    obligationResults,
    completedObligationIds: evaluation.completedObligationIds.filter(keep),
    outstandingObligationIds: evaluation.outstandingObligationIds.filter(keep),
  };
}
/**
 * A package W is allocation continuation, while its D2 is live compensation
 * continuation. Restore only the exact prior lineage/component pair. This
 * prevents the old package block C from being re-used to settle its own D2
 * after a reload, while leaving ordinary sources to Phase 5 evaluation.
 */
function packageDerivedLiveObligations(
  prior: CompensationFrontier,
  allocation: AllocationFrontierAlternative,
): { obligation: BranchCompensationEvaluation["obligations"][number]; result: CompensationObligationResult }[] {
  const packageComponents = new Set(packageContinuationsFor(allocation)
    .filter((item) => item.weeklyComponent.role === "COUNTED" && item.weeklyComponent.classification === "REDUCED" && item.fixedWeekAssignment != null)
    .map((item) => item.weeklyComponent.componentId));
  if (!packageComponents.size) return [];
  const carried = new Map<string, { obligation: BranchCompensationEvaluation["obligations"][number]; result: CompensationObligationResult }>();
  for (const previous of prior.alternatives) {
    for (const obligation of previous.evaluation.obligations) {
      // The canonical package component is the structural package identity.
      // It is copied only into true descendants of that package, while the
      // current allocation alternative already filters unrelated siblings.
      if (!packageComponents.has(obligation.sourceComponentId)) continue;
      const result = previous.evaluation.obligationResults.find((item) => item.obligationId === obligation.obligationId);
      if (!result || finalizable(result.status)) continue;
      carried.set(obligation.sourceComponentId, { obligation, result });
    }
  }
  return [...carried.values()];
}

function restorePackageDerivedLiveObligations(
  evaluation: BranchCompensationEvaluation,
  carried: readonly { obligation: BranchCompensationEvaluation["obligations"][number]; result: CompensationObligationResult }[],
): BranchCompensationEvaluation {
  if (!carried.length) return evaluation;
  const bySource = new Map(carried.map((item) => [item.obligation.sourceComponentId, item]));
  const replacedIds = new Set(evaluation.obligations
    .filter((item) => bySource.has(item.sourceComponentId))
    .map((item) => item.obligationId));
  const obligations = [
    ...evaluation.obligations.filter((item) => !bySource.has(item.sourceComponentId)),
    ...carried.map((item) => item.obligation),
  ];
  const obligationResults = [
    ...evaluation.obligationResults.filter((item) => !replacedIds.has(item.obligationId)),
    ...carried.map((item) => item.result),
  ];
  const completedObligationIds = obligationResults
    .filter((item) => item.status === "COMPLETED_ON_TIME" || item.status === "THRESHOLD_REACHED_PROVISIONAL")
    .map((item) => item.obligationId).sort();
  return {
    ...evaluation,
    obligations,
    // A carried package debt cannot inherit a newly reconstructed attachment
    // or block that overlaps its already-consumed package C.
    blocks: evaluation.blocks.filter((item) => !replacedIds.has(item.obligationId)),
    attachments: evaluation.attachments.filter((item) => !replacedIds.has(item.obligationId)),
    obligationResults,
    completedObligationIds,
    outstandingObligationIds: obligationResults.filter((item) => !completedObligationIds.includes(item.obligationId)).map((item) => item.obligationId).sort(),
  };
}
function inheritedFinalizedPackageObligationIds(
  prior: CompensationFrontier,
  allocation: AllocationFrontierAlternative,
  evaluation: BranchCompensationEvaluation,
  _finalizedForLineage: ReadonlySet<string>,
  priorFinalizedResults: readonly FinalizedCompensationResult[],
): Set<string> {
  // The package stores the exact canonical old-obligation identity.  A
  // successor lineage is intentionally new, so matching it to the prior
  // lineage would re-emit an already-finalized package repayment.
  const oldIds = new Set(packageContinuationsFor(allocation)
    .map((item) => item.oldObligationId));
  if (!oldIds.size) return new Set<string>();
  const sourceKeys = new Set<string>();
  for (const finalized of priorFinalizedResults) {
    if (!oldIds.has(finalized.obligationId)) continue;
    sourceKeys.add(JSON.stringify([finalized.sourceComponentId, finalized.sourceRestIntervalId, null, null, finalized.requiredCompensationMilliseconds, finalized.deadlineEpochMilliseconds]));
  }
  for (const previous of prior.alternatives) {
    if (previous.continuationLineageId !== allocation.continuationLineageId) continue;
    for (const obligation of previous.evaluation.obligations) {
      if (oldIds.has(obligation.obligationId)) sourceKeys.add(JSON.stringify([
        obligation.sourceComponentId, obligation.sourceRestIntervalId, obligation.sourceFixedWeekAssignmentId,
        obligation.sourceReducedDurationMilliseconds, obligation.requiredCompensationMilliseconds, obligation.deadlineEpochMilliseconds,
      ]));
    }
  }
  return new Set(evaluation.obligations.filter((obligation) => sourceKeys.has(JSON.stringify([
    obligation.sourceComponentId, obligation.sourceRestIntervalId, obligation.sourceFixedWeekAssignmentId,
    obligation.sourceReducedDurationMilliseconds, obligation.requiredCompensationMilliseconds, obligation.deadlineEpochMilliseconds,
  ])) || sourceKeys.has(JSON.stringify([
    obligation.sourceComponentId, obligation.sourceRestIntervalId, null, null,
    obligation.requiredCompensationMilliseconds, obligation.deadlineEpochMilliseconds,
  ]))).map((obligation) => obligation.obligationId));
}
function finalizedResult(allocation: AllocationFrontierAlternative, evaluation: BranchCompensationEvaluation, result: CompensationObligationResult): FinalizedCompensationResult {
  const obligation = evaluation.obligations.find((item) => item.obligationId === result.obligationId);
  if (!obligation) throw new RangeError(`Missing obligation ${result.obligationId}.`);
  const payload = { allocationAlternativeId: allocation.alternativeId, continuationLineageId: allocation.continuationLineageId, obligationId: obligation.obligationId, sourceComponentId: obligation.sourceComponentId, sourceRestIntervalId: obligation.sourceRestIntervalId, sourceFixedWeekId: obligation.sourceFixedWeekId, requiredCompensationMilliseconds: obligation.requiredCompensationMilliseconds, deadlineEpochMilliseconds: obligation.deadlineEpochMilliseconds, status: result.status, attachmentId: result.attachmentId, reviewReasons: [...result.reviewReasons].sort() };
  return { finalizedResultId: canonical(payload), ...payload };
}

/**
 * Pure branch-correlated continuation. It consumes live allocation alternatives
 * plus retained reduced seeds; it never re-materializes finalized allocation
 * permutations and delegates attachment/deadline semantics to the established
 * compensation evaluator.
 */
export function transitionCompensationFrontier(prior: CompensationFrontier, allocationFrontier: AllocationFrontier, restIntervals: readonly RestInterval[], context: CompensationEvaluationContext, priorFinalizedResults: readonly FinalizedCompensationResult[] = []): CompensationFrontierTransition {
  const alternatives: CompensationFrontierAlternative[] = [];
  // Finalized outcomes in the persisted prior frontier are immutable historical facts for continuation.
  const priorFinalizedByLineage = new Map<string, Set<string>>();
  for (const result of priorFinalizedResults) {
    const ids = priorFinalizedByLineage.get(result.continuationLineageId) ?? new Set<string>();
    ids.add(result.obligationId);
    priorFinalizedByLineage.set(result.continuationLineageId, ids);
  }
  const finalized = new Map<string, FinalizedCompensationResult>();
  const packageBranches: { parentAlternativeId:string; branch:AllocationBranch }[] = [];
  const persistedPackages = new Set(allocationFrontier.alternatives.flatMap((alternative) => alternative.packageContinuations.map((value:any) => `${alternative.continuationLineageId}|${value.packageContinuationId}`)));
  for (const allocation of allocationFrontier.alternatives) {
    const branch = compensationBranchFromAllocationAlternative(allocation, restIntervals);
    for (const packageBranch of packageContinuationBranches(restIntervals, branch)) {
      if ((packageBranch.packageContinuations ?? []).some((value:any) => persistedPackages.has(`${allocation.continuationLineageId}|${value.packageContinuationId}`))) continue;
      packageBranches.push({ parentAlternativeId: allocation.alternativeId, branch: packageBranch });
    }
    const finalizedForLineage = priorFinalizedByLineage.get(allocation.continuationLineageId) ?? new Set<string>();
    const evaluation = evaluateCompensation(restIntervals, [branch], context).branchEvaluations;
    for (const rawItem of evaluation) {
      // An inherited finalization is scoped to the exact package's prior
      // obligation source, never to an unrelated alternative.
      const inheritedFinalizedPackageIds = inheritedFinalizedPackageObligationIds(prior, allocation, rawItem, finalizedForLineage, priorFinalizedResults);
      const item = restorePackageDerivedLiveObligations(
        withoutPriorFinalized(rawItem, inheritedFinalizedPackageIds),
        packageDerivedLiveObligations(prior, allocation),
      );
      const live = item.obligationResults.filter((result) => !finalizable(result.status));
      for (const result of item.obligationResults.filter((candidate) => finalizable(candidate.status))) {
        if (inheritedFinalizedPackageIds.has(result.obligationId)) continue;
        const value = finalizedResult(allocation, item, result);
        // Package descendants may reach the same final obligation through
        // distinct derived attachment layouts. Finalization is an immutable
        // obligation outcome per allocation lineage, not one ledger fact per
        // presentation of that same package.
        const finalizationKey = [allocation.alternativeId, value.obligationId, value.status].join("|");
        const existing = finalized.get(finalizationKey);
        if (!existing || value.finalizedResultId.localeCompare(existing.finalizedResultId) < 0) finalized.set(finalizationKey, value);
      }
      const payload = { allocationAlternativeId: allocation.alternativeId, continuationLineageId: allocation.continuationLineageId, evaluationFingerprint: item.evaluationFingerprint, liveObligationIds: live.map((result) => result.obligationId).sort() };
      alternatives.push({ compensationAlternativeId: canonical(payload), allocationAlternativeId: allocation.alternativeId, continuationLineageId: allocation.continuationLineageId, evaluation: item, liveObligationIds: payload.liveObligationIds });
    }
  }
  const unique = new Map<string, CompensationFrontierAlternative>();
  for (const alternative of alternatives) if (!unique.has(alternative.compensationAlternativeId)) unique.set(alternative.compensationAlternativeId, alternative);
  return { nextCompensationFrontier: { alternatives: [...unique.values()].sort((left, right) => left.compensationAlternativeId.localeCompare(right.compensationAlternativeId)) }, newlyFinalizedCompensationResults: [...finalized.values()].sort((left, right) => left.finalizedResultId.localeCompare(right.finalizedResultId)), packageBranches };
}
