import {
  type AllocationFrontier,
  type AllocationFrontierAlternative,
  type ReducedSourceSeed,
  reidentifyAllocationFrontierAlternative,
} from "./allocation-frontier.ts";
import type { FixedWeekAssignment, WeeklyRestComponent } from "./types.ts";

export type FinalizedAllocationResult = {
  finalizedResultId: string;
  sourceAlternativeId: string;
  finalizedThroughFixedWeekId: string;
  countedComponents: readonly WeeklyRestComponent[];
  additionalComponents: readonly WeeklyRestComponent[];
  assignments: readonly FixedWeekAssignment[];
  sourceOptionIds: readonly string[];
  reviewStatus: AllocationFrontierAlternative["reviewStatus"];
  reviewReasons: readonly string[];
};

export type AllocationFinalizationContext = {
  /** First legal week still being processed; its immediate predecessor remains live. */
  chronologicalBoundaryFixedWeekId: string;
};

export type AllocationFinalizationResult = {
  finalizedAllocationResults: readonly FinalizedAllocationResult[];
  liveFrontier: AllocationFrontier;
};

function unique(values: readonly string[]): string[] { return [...new Set(values)].sort(); }
function canonical<T>(values: readonly T[]): T[] { return [...values].sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right))); }
function resultKey(value: Omit<FinalizedAllocationResult, "finalizedResultId">): string {
  return JSON.stringify({ ...value, countedComponents: canonical(value.countedComponents), additionalComponents: canonical(value.additionalComponents), assignments: canonical(value.assignments), sourceOptionIds: unique(value.sourceOptionIds), reviewReasons: unique(value.reviewReasons) });
}
function predecessorWeek(weeks: readonly string[], boundary: string): string | null {
  const values = [...new Set(weeks.filter((week) => week < boundary))].sort();
  return values.length ? values[values.length - 1] : null;
}
function componentIdsFor(assignments: readonly FixedWeekAssignment[]): Set<string> { return new Set(assignments.map((item) => item.componentId)); }
function sourceOptionIdsFor(components: readonly WeeklyRestComponent[], seeds: readonly ReducedSourceSeed[]): string[] {
  return unique([...components.map((item) => item.sourceOptionId), ...seeds.map((item) => item.sourceOptionId)]);
}

/**
 * Moves only clear allocation detail older than the immediately preceding fixed
 * week out of the continuation. REVIEW alternatives, unassigned components,
 * the latest rolling anchor and every ReducedSourceSeed remain live.
 */
export function finalizeAllocationFrontier(currentFrontier: AllocationFrontier, context: AllocationFinalizationContext): AllocationFinalizationResult {
  const finalized = new Map<string, FinalizedAllocationResult>();
  const live = new Map<string, AllocationFrontierAlternative>();
  for (const alternative of currentFrontier.alternatives) {
    // Any review can still influence future meaning. Conservatively retain all.
    if (alternative.reviewStatus === "REVIEW_REQUIRED") {
      const value = reidentifyAllocationFrontierAlternative(alternative, null);
      live.set(value.alternativeId, value);
      continue;
    }
    const allAssignments = alternative.assignments;
    const trailingWeek = predecessorWeek(allAssignments.map((item) => item.fixedWeekId), context.chronologicalBoundaryFixedWeekId);
    if (!trailingWeek) {
      const value = reidentifyAllocationFrontierAlternative(alternative, null);
      live.set(value.alternativeId, value);
      continue;
    }
    const historicalAssignments = allAssignments.filter((item) => item.fixedWeekId < trailingWeek);
    if (!historicalAssignments.length) {
      const value = reidentifyAllocationFrontierAlternative(alternative, null);
      live.set(value.alternativeId, value);
      continue;
    }
    const historicalIds = componentIdsFor(historicalAssignments);
    const anchoredId = alternative.rollingAnchor?.componentId ?? null;
    const seedIds = new Set(alternative.reducedSourceSeeds.map((seed) => seed.componentId));
    const retainComponent = (component: WeeklyRestComponent) => !historicalIds.has(component.componentId) || component.componentId === anchoredId;
    const historicalCounted = alternative.countedComponents.filter((component) => historicalIds.has(component.componentId) && component.componentId !== anchoredId);
    const historicalAdditional = alternative.additionalComponents.filter((component) => historicalIds.has(component.componentId) && component.componentId !== anchoredId);
    // A component referenced by a historical assignment is final only when no
    // live anchor or reduced-source seed needs its identity.
    if (historicalCounted.length || historicalAdditional.length) {
      const payload: Omit<FinalizedAllocationResult, "finalizedResultId"> = {
        sourceAlternativeId: alternative.alternativeId,
        finalizedThroughFixedWeekId: trailingWeek,
        countedComponents: historicalCounted,
        additionalComponents: historicalAdditional,
        assignments: historicalAssignments.filter((assignment) => assignment.componentId !== anchoredId),
        sourceOptionIds: unique([...historicalCounted, ...historicalAdditional].map((component) => component.sourceOptionId)),
        reviewStatus: alternative.reviewStatus,
        reviewReasons: alternative.reviewReasons,
      };
      const finalizedValue: FinalizedAllocationResult = { finalizedResultId: resultKey(payload), ...payload };
      finalized.set(finalizedValue.finalizedResultId, finalizedValue);
    }
    const retainedAssignments = allAssignments.filter((assignment) => !historicalIds.has(assignment.componentId) || assignment.componentId === anchoredId);
    const retainedCounted = alternative.countedComponents.filter(retainComponent);
    const retainedAdditional = alternative.additionalComponents.filter(retainComponent);
    const projected = reidentifyAllocationFrontierAlternative({
      ...alternative,
      branchFingerprint: "",
      countedComponents: retainedCounted,
      additionalComponents: retainedAdditional,
      assignments: retainedAssignments,
      sourceOptionIds: sourceOptionIdsFor([...retainedCounted, ...retainedAdditional], alternative.reducedSourceSeeds),
    }, null);
    live.set(projected.alternativeId, projected);
  }
  return {
    finalizedAllocationResults: [...finalized.values()].sort((left, right) => left.finalizedResultId.localeCompare(right.finalizedResultId)),
    liveFrontier: { alternatives: [...live.values()].sort((left, right) => left.alternativeId.localeCompare(right.alternativeId)) },
  };
}





