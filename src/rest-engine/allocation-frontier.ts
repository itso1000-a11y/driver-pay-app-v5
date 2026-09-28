import type { AllocationBranch, FixedWeekAssignment, ReviewStatus, WeeklyRestComponent } from "./types.ts";

export type ReducedSourceSeed = {
  componentId: string;
  restIntervalId: string;
  fixedWeekId: string;
  sourceOptionId: string;
  sourceReducedDurationMilliseconds: number;
  requiredCompensationMilliseconds: number;
};

export type AllocationFrontierAlternative = {
  alternativeId: string;
  parentAlternativeId: string | null;
  continuationLineageId: string;
  packageContinuations: readonly unknown[];
  branchFingerprint: string;
  countedComponents: readonly WeeklyRestComponent[];
  additionalComponents: readonly WeeklyRestComponent[];
  assignments: readonly FixedWeekAssignment[];
  sourceOptionIds: readonly string[];
  rollingAnchor: { componentId: string; restIntervalId: string | null; endEpochMilliseconds: number | null } | null;
  reviewStatus: ReviewStatus;
  reviewReasons: readonly string[];
  reducedSourceSeeds: readonly ReducedSourceSeed[];
};

export type AllocationFrontier = { alternatives: readonly AllocationFrontierAlternative[] };
export type AllocationFrontierSegment = { alternatives: readonly AllocationFrontierAlternative[] };
export type AllocationFrontierTransition = { nextFrontier: AllocationFrontier; newlyFinalizedAllocationResults: readonly string[] };

const HOUR = 60 * 60 * 1000;

function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * A fixed-size deterministic identity for a current continuation state.  The
 * second independently-seeded pass keeps the compact identifier practical
 * without carrying a prior serialized branch into its successor.
 */
export function boundedContinuationFingerprint(value: unknown, prefix = "allocation-state"): string {
  const canonical = JSON.stringify(canonicalStructuralValue(value));
  return `${prefix}:${stableHash(canonical)}${stableHash(`v2\u0000${canonical}`)}`;
}

function canonicalStructuralValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalStructuralValue)
      .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalStructuralValue(item)]));
  }
  return value;
}

/**
 * A lineage names one structural path, not an entire serialized frontier.
 * Hashing the bounded parent id plus the canonical new decision keeps it stable
 * across reloads without allowing successor generations to grow recursively.
 */
export function successorContinuationLineage(
  parentContinuationLineageId: string,
  newStructuralDecision: unknown,
): string {
  return boundedContinuationFingerprint([
    parentContinuationLineageId,
    newStructuralDecision,
  ], "allocation-lineage");
}

/**
 * Canonical future-relevant state used by forensic collision checks and by
 * bounded continuation identities.  In particular, `null` (no anchor) and
 * an `unknown` anchor are intentionally different values.
 */
function canonicalAllocationContinuationStatePayload(alternative: Pick<AllocationFrontierAlternative,
  "countedComponents" | "additionalComponents" | "assignments" | "sourceOptionIds" |
  "rollingAnchor" | "reviewStatus" | "reviewReasons" | "reducedSourceSeeds" |
  "packageContinuations"
>): unknown {
  return canonicalStructuralValue({
    countedComponents: alternative.countedComponents.map((item) => ({
      componentId: item.componentId, restIntervalId: item.restIntervalId,
      sourceOptionId: item.sourceOptionId, startEpochMilliseconds: item.startEpochMilliseconds,
      endEpochMilliseconds: item.endEpochMilliseconds, durationMilliseconds: item.durationMilliseconds,
      classification: item.classification, role: item.role,
    })),
    additionalComponents: alternative.additionalComponents.map((item) => ({
      componentId: item.componentId, restIntervalId: item.restIntervalId,
      sourceOptionId: item.sourceOptionId, startEpochMilliseconds: item.startEpochMilliseconds,
      endEpochMilliseconds: item.endEpochMilliseconds, durationMilliseconds: item.durationMilliseconds,
      classification: item.classification, role: item.role,
    })),
    assignments: alternative.assignments.map((item) => ({
      assignmentId: item.assignmentId, componentId: item.componentId,
      fixedWeekId: item.fixedWeekId, assignmentRole: item.assignmentRole,
    })),
    sourceOptionIds: alternative.sourceOptionIds,
    rollingAnchor: alternative.rollingAnchor === null ? { kind: "NONE" } : {
      kind: alternative.rollingAnchor.componentId === "unknown" ? "UNKNOWN" : "KNOWN",
      componentId: alternative.rollingAnchor.componentId,
      restIntervalId: alternative.rollingAnchor.restIntervalId,
      endEpochMilliseconds: alternative.rollingAnchor.endEpochMilliseconds,
    },
    reviewStatus: alternative.reviewStatus,
    reviewReasons: alternative.reviewReasons,
    reducedSourceSeeds: alternative.reducedSourceSeeds,
    packageContinuations: alternative.packageContinuations,
  });
}

export function canonicalAllocationContinuationState(alternative: Pick<AllocationFrontierAlternative,
  "countedComponents" | "additionalComponents" | "assignments" | "sourceOptionIds" |
  "rollingAnchor" | "reviewStatus" | "reviewReasons" | "reducedSourceSeeds" |
  "packageContinuations" | "continuationLineageId"
>): string {
  return JSON.stringify(canonicalStructuralValue({
    continuationLineageId: alternative.continuationLineageId,
    state: canonicalAllocationContinuationStatePayload(alternative),
  }));
}

/**
 * A lineage is a bounded structural path plus the state that can change its
 * next legal transition.  The payload deliberately excludes any predecessor
 * fingerprint or serialized historical branch.
 */
export function continuationLineageForCurrentState(
  parentContinuationLineageId: string,
  alternative: Pick<AllocationFrontierAlternative,
    "countedComponents" | "additionalComponents" | "assignments" | "sourceOptionIds" |
    "rollingAnchor" | "reviewStatus" | "reviewReasons" | "reducedSourceSeeds" |
    "packageContinuations"
>,
): string {
  return boundedContinuationFingerprint({
    parentContinuationLineageId,
    state: canonicalAllocationContinuationStatePayload(alternative),
  }, "allocation-lineage");
}

/** Rebase only derived package continuation ownership onto its exact child path. */
export function rebasePackageContinuations(
  packageContinuations: readonly unknown[],
  continuationLineageId: string,
): unknown[] {
  return packageContinuations.map((value) => {
    if (!value || typeof value !== "object" || !("packageContinuationId" in value)) return value;
    const current = value as Record<string, unknown>;
    // Keep exactly one structural predecessor for the next persisted
    // transition.  It is a bounded correlation edge, not a history chain.
    if (current.continuationLineageId === continuationLineageId) return current;
    return {
      ...current,
      predecessorContinuationLineageId: current.predecessorContinuationLineageId ?? current.continuationLineageId,
      continuationLineageId,
    };
  });
}

function canonical<T>(values: readonly T[]): T[] {
  return [...values].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
}

function key(value: Omit<AllocationFrontierAlternative, "alternativeId" | "parentAlternativeId">): string {
  return JSON.stringify({
    ...value,
    countedComponents: canonical(value.countedComponents),
    additionalComponents: canonical(value.additionalComponents),
    assignments: canonical(value.assignments),
    sourceOptionIds: [...new Set(value.sourceOptionIds)].sort(),
    reviewReasons: [...new Set(value.reviewReasons)].sort(),
    reducedSourceSeeds: canonical(value.reducedSourceSeeds),
  });
}

function reducedSeeds(branch: AllocationBranch): ReducedSourceSeed[] {
  const assignmentByComponent = new Map(branch.fixedWeekAssignments.map((assignment) => [assignment.componentId, assignment]));
  return branch.components
    .filter((component) => component.role === "COUNTED" && component.classification === "REDUCED")
    .flatMap((component) => {
      const assignment = assignmentByComponent.get(component.componentId);
      return assignment ? [{
        componentId: component.componentId,
        restIntervalId: component.restIntervalId,
        fixedWeekId: assignment.fixedWeekId,
        sourceOptionId: component.sourceOptionId,
        sourceReducedDurationMilliseconds: component.durationMilliseconds,
        requiredCompensationMilliseconds: Math.max(0, 45 * HOUR - component.durationMilliseconds),
      }] : [];
    });
}

export function allocationFrontierGenesis(): AllocationFrontier {
  return { alternatives: [] };
}

/** Projects an existing legal allocation branch without recombining its lineage. */
export function allocationFrontierAlternative(branch: AllocationBranch, parentAlternativeId: string | null = null): AllocationFrontierAlternative {
  const rolling = [...branch.rollingCycleResets]
    .filter((item) => item.nextComponentId == null)
    .sort((a, b) => (b.previousQualifyingEndEpochMilliseconds ?? -1) - (a.previousQualifyingEndEpochMilliseconds ?? -1))[0] ?? null;
  const value: Omit<AllocationFrontierAlternative, "alternativeId" | "parentAlternativeId"> = {
    branchFingerprint: branch.branchFingerprint,
    continuationLineageId: branch.continuationLineageId ?? branch.branchFingerprint,
    packageContinuations: [...(branch.packageContinuations ?? [])],
    countedComponents: branch.components.filter((component) => component.role === "COUNTED"),
    additionalComponents: branch.additionalComponents,
    assignments: branch.fixedWeekAssignments,
    sourceOptionIds: branch.sourceOptionIds,
    rollingAnchor: rolling ? {
      componentId: rolling.previousComponentId ?? "unknown",
      restIntervalId: rolling.previousRestIntervalId,
      endEpochMilliseconds: rolling.previousQualifyingEndEpochMilliseconds,
    } : null,
    reviewStatus: branch.reviewStatus,
    reviewReasons: branch.reviewReasons,
    reducedSourceSeeds: reducedSeeds(branch),
  };
  // The canonical payload itself is the identity. A short hash would make a
  // collision indistinguishable from an equivalent legal lineage.
  return { alternativeId: key(value), parentAlternativeId, ...value };
}

/** Re-canonicalizes a projected future-only alternative without a lossy hash. */
export function reidentifyAllocationFrontierAlternative(alternative: AllocationFrontierAlternative, parentAlternativeId: string | null = alternative.parentAlternativeId): AllocationFrontierAlternative {
  const { alternativeId: _alternativeId, parentAlternativeId: _parentAlternativeId, ...value } = alternative;
  return { alternativeId: key(value), parentAlternativeId, ...value };
}
export function allocationFrontierFromBranches(branches: readonly AllocationBranch[], parentAlternativeId: string | null = null): AllocationFrontierSegment {
  return { alternatives: branches.map((branch) => allocationFrontierAlternative(branch, parentAlternativeId)) };
}

/**
 * Pure, conservative transition: supplied segment alternatives are already legal
 * descendants of the indicated parent. This function preserves correlation and
 * performs only exact canonical deduplication; it never selects or cross-combines.
 */
export function transitionAllocationFrontier(prior: AllocationFrontier, segment: AllocationFrontierSegment): AllocationFrontierTransition {
  const parentIds = new Set(prior.alternatives.map((alternative) => alternative.alternativeId));
  const accepted = prior.alternatives.length === 0
    ? segment.alternatives.filter((alternative) => alternative.parentAlternativeId == null)
    : segment.alternatives.filter((alternative) => alternative.parentAlternativeId != null && parentIds.has(alternative.parentAlternativeId));
  const values = new Map<string, AllocationFrontierAlternative>();
  for (const alternative of accepted) {
    const { alternativeId: _id, parentAlternativeId: _parent, ...rest } = alternative;
    const canonicalKey = key(rest);
    if (!values.has(canonicalKey)) values.set(canonicalKey, { ...alternative, alternativeId: canonicalKey });
  }
  return { nextFrontier: { alternatives: [...values.values()].sort((a, b) => a.alternativeId.localeCompare(b.alternativeId)) }, newlyFinalizedAllocationResults: [] };
}


export type AllocationContinuationSeed = { alternatives: readonly AllocationFrontierAlternative[]; boundaryRestInterval: { restIntervalId:string; startEpochMilliseconds:number; endEpochMilliseconds:number|null }|null };
export function allocationContinuationSeed(frontier:AllocationFrontier,boundaryRestInterval:AllocationContinuationSeed["boundaryRestInterval"]):AllocationContinuationSeed{return{alternatives:frontier.alternatives,boundaryRestInterval}}
