import type { ActivityFactInput } from "./types.ts";

export const REST_ENGINE_CHECKPOINT_NAMESPACE = "driverPayApp:restEngine:checkpoint" as const;
export const REST_ENGINE_CHECKPOINT_VERSION = 1 as const;

export type CheckpointSourceIdentity = {
  firstWallDate: string;
  lastWallDate: string;
  factualSourceHash: string;
  factCount: number;
};

export type CheckpointAssignment = {
  fixedWeekId: string;
  componentId: string;
  classification: "REGULAR" | "REDUCED";
  sourceRestIntervalId: string;
  sourceOptionId: string;
};

export type CheckpointRollingAnchor = {
  restIntervalId: string;
  componentId: string;
  endEpochMilliseconds: number | null;
  reviewStatus: "CLEAR" | "REVIEW_REQUIRED";
};

export type CheckpointTwoWeekOutcome = {
  firstWeekId: string;
  secondWeekId: string;
  status: "SATISFIED" | "VIOLATED" | "REVIEW" | "PENDING" | "INSUFFICIENT_HISTORY";
  countedComponentIds: string[];
};

export type CheckpointCompensationState = {
  obligationId: string;
  sourceRestIntervalId: string;
  sourceComponentId: string;
  sourceFixedWeekId: string;
  sourceClassification: "REDUCED";
  requiredCompensationMilliseconds: number;
  deadlineEpochMilliseconds: number;
  status: "OPEN" | "PAID" | "OVERDUE" | "REVIEW" | "THRESHOLD_REACHED_PROVISIONAL" | "UNRESOLVED_ATTACHMENT_DEADLINE";
  attachmentRestIntervalId: string | null;
  attachmentCompletionEpochMilliseconds: number | null;
  reviewReasons: string[];
};

export type CheckpointFrontierState = {
  branchFingerprint: string;
  legalState: "COMPLIANT" | "VIOLATED" | "REVIEW" | "PENDING";
  reviewStatus: "CLEAR" | "REVIEW_REQUIRED";
  sourceOptionIds: string[];
  assignments: CheckpointAssignment[];
  rollingAnchors: CheckpointRollingAnchor[];
  twoWeekOutcomes: CheckpointTwoWeekOutcome[];
  compensation: CheckpointCompensationState[];
  reviewReasons: string[];
};

export type DailyRestCarry = {
  reducedRestCountSinceWeeklyRest: number;
  lastResetRestIntervalId: string | null;
};

export type PendingSplitRestCarry = {
  firstSegmentStartEpochMilliseconds: number;
  firstSegmentEndEpochMilliseconds: number;
};

export type RestEngineCheckpointV1 = {
  namespace: typeof REST_ENGINE_CHECKPOINT_NAMESPACE;
  checkpointVersion: typeof REST_ENGINE_CHECKPOINT_VERSION;
  checkpointId: string;
  boundaryEpochMilliseconds: number;
  boundaryFixedWeekId: string;
  source: CheckpointSourceIdentity;
  factualCoverageCompleteThroughBoundary: boolean;
  frontier: CheckpointFrontierState[];
  dailyRestCarry: DailyRestCarry | null;
  pendingSplitRestCarry: PendingSplitRestCarry | null;
  compensationRegime: "GENERAL_ONLY";
};

export type CheckpointInvalidation = {
  checkpointId: string;
  stale: true;
  changedWallDate: string;
  reason: "FACTUAL_SOURCE_CHANGED";
};

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalValue(item)]));
  }
  return value;
}

export function stableCheckpointJson(value: unknown): string {
  return JSON.stringify(canonicalValue(value));
}

function stableDigest(value: string): string {
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193);
    second = Math.imul(second ^ (code + index), 0x85ebca6b);
  }
  return `${(first >>> 0).toString(16).padStart(8, "0")}${(second >>> 0).toString(16).padStart(8, "0")}`;
}

function canonicalArray<T>(values: readonly T[]): T[] {
  return [...values].sort((left, right) => stableCheckpointJson(left).localeCompare(stableCheckpointJson(right)));
}

/** Conservative key: a state merges only when every carried semantic field matches. */
export function frontierStateKey(state: CheckpointFrontierState): string {
  return stableCheckpointJson({
    ...state,
    sourceOptionIds: [...new Set(state.sourceOptionIds)].sort(),
    assignments: canonicalArray(state.assignments),
    rollingAnchors: canonicalArray(state.rollingAnchors),
    twoWeekOutcomes: canonicalArray(state.twoWeekOutcomes.map((item) => ({ ...item, countedComponentIds: [...new Set(item.countedComponentIds)].sort() }))),
    compensation: canonicalArray(state.compensation.map((item) => ({ ...item, reviewReasons: [...new Set(item.reviewReasons)].sort() }))),
    reviewReasons: [...new Set(state.reviewReasons)].sort(),
  });
}

export function canonicalizeFrontier(states: readonly CheckpointFrontierState[]): CheckpointFrontierState[] {
  const unique = new Map<string, CheckpointFrontierState>();
  for (const state of states) {
    const key = frontierStateKey(state);
    if (!unique.has(key)) unique.set(key, JSON.parse(key) as CheckpointFrontierState);
  }
  return [...unique.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([, state]) => state);
}

export function factualSourceIdentity(
  facts: readonly ActivityFactInput[],
  firstWallDate: string,
  lastWallDate: string,
): CheckpointSourceIdentity {
  const included = facts
    .filter((fact) => fact.sourceRef.wallDate >= firstWallDate && fact.sourceRef.wallDate <= lastWallDate)
    .map((fact) => canonicalValue(fact));
  const canonicalFacts = canonicalArray(included);
  return {
    firstWallDate,
    lastWallDate,
    factCount: canonicalFacts.length,
    factualSourceHash: `facts:${stableDigest(stableCheckpointJson(canonicalFacts))}`,
  };
}

export function createCheckpoint(input: Omit<RestEngineCheckpointV1, "namespace" | "checkpointVersion" | "checkpointId" | "frontier"> & {
  frontier: readonly CheckpointFrontierState[];
}): RestEngineCheckpointV1 {
  const frontier = canonicalizeFrontier(input.frontier);
  const identity = {
    boundaryEpochMilliseconds: input.boundaryEpochMilliseconds,
    boundaryFixedWeekId: input.boundaryFixedWeekId,
    source: input.source,
    frontier,
    dailyRestCarry: input.dailyRestCarry,
    pendingSplitRestCarry: input.pendingSplitRestCarry,
    compensationRegime: input.compensationRegime,
  };
  return {
    namespace: REST_ENGINE_CHECKPOINT_NAMESPACE,
    checkpointVersion: REST_ENGINE_CHECKPOINT_VERSION,
    checkpointId: `checkpoint:${stableDigest(stableCheckpointJson(identity))}`,
    ...input,
    frontier,
  };
}

export function serializeCheckpoint(checkpoint: RestEngineCheckpointV1): string {
  return stableCheckpointJson({ ...checkpoint, frontier: canonicalizeFrontier(checkpoint.frontier) });
}

export function deserializeCheckpoint(value: string): RestEngineCheckpointV1 | null {
  try {
    const parsed = JSON.parse(value) as Partial<RestEngineCheckpointV1>;
    if (parsed.namespace !== REST_ENGINE_CHECKPOINT_NAMESPACE || parsed.checkpointVersion !== REST_ENGINE_CHECKPOINT_VERSION) return null;
    if (!parsed.source || !Array.isArray(parsed.frontier) || typeof parsed.checkpointId !== "string") return null;
    return createCheckpoint(parsed as Omit<RestEngineCheckpointV1, "namespace" | "checkpointVersion" | "checkpointId">);
  } catch {
    return null;
  }
}

export function isCheckpointStale(checkpoint: RestEngineCheckpointV1, source: CheckpointSourceIdentity): boolean {
  return checkpoint.source.firstWallDate !== source.firstWallDate
    || checkpoint.source.lastWallDate !== source.lastWallDate
    || checkpoint.source.factCount !== source.factCount
    || checkpoint.source.factualSourceHash !== source.factualSourceHash;
}

export function invalidateCheckpointsForFactEdit(
  checkpoints: readonly RestEngineCheckpointV1[],
  changedWallDate: string,
): CheckpointInvalidation[] {
  return checkpoints
    .filter((checkpoint) => checkpoint.source.lastWallDate >= changedWallDate)
    .sort((left, right) => left.boundaryEpochMilliseconds - right.boundaryEpochMilliseconds)
    .map((checkpoint) => ({ checkpointId: checkpoint.checkpointId, stale: true as const, changedWallDate, reason: "FACTUAL_SOURCE_CHANGED" as const }));
}

/** Source hashes intentionally differ across factual revisions; this compares carried legal meaning only. */
export function checkpointsSemanticallyEquivalent(left: RestEngineCheckpointV1, right: RestEngineCheckpointV1): boolean {
  return stableCheckpointJson({
    boundaryEpochMilliseconds: left.boundaryEpochMilliseconds,
    boundaryFixedWeekId: left.boundaryFixedWeekId,
    factualCoverageCompleteThroughBoundary: left.factualCoverageCompleteThroughBoundary,
    frontier: canonicalizeFrontier(left.frontier),
    dailyRestCarry: left.dailyRestCarry,
    pendingSplitRestCarry: left.pendingSplitRestCarry,
    compensationRegime: left.compensationRegime,
  }) === stableCheckpointJson({
    boundaryEpochMilliseconds: right.boundaryEpochMilliseconds,
    boundaryFixedWeekId: right.boundaryFixedWeekId,
    factualCoverageCompleteThroughBoundary: right.factualCoverageCompleteThroughBoundary,
    frontier: canonicalizeFrontier(right.frontier),
    dailyRestCarry: right.dailyRestCarry,
    pendingSplitRestCarry: right.pendingSplitRestCarry,
    compensationRegime: right.compensationRegime,
  });
}

export function canBecomeTimelyPaid(status: CheckpointCompensationState["status"]): boolean {
  return status !== "OVERDUE";
}

