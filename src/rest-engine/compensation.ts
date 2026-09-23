import {
  type AllocationBranch,
  type AttachmentBase,
  type AttachmentLayout,
  type AttachmentRelation,
  type BranchCompensationEvaluation,
  type CompensationBlock,
  type CompensationConvergence,
  type CompensationDeadlineCase,
  type CompensationEvaluationContext,
  type CompensationObligation,
  type CompensationObligationResult,
  type CompensationResultStatus,
  type CompensationUnallocatedCapacity,
  type EvaluateCompensationResult,
  type Phase5Diagnostic,
  type Phase5DiagnosticCode,
  type RestInterval,
  type WeeklyRestComponent,
} from "./types.ts";
import { compensationDeadlineForWeek, fixedLegalWeekForInstant } from "./time.ts";

const HOUR_MILLISECONDS = 60 * 60 * 1000;
const ORDINARY_BASE_MILLISECONDS = 9 * HOUR_MILLISECONDS;
const REGULAR_WEEKLY_REST_MILLISECONDS = 45 * HOUR_MILLISECONDS;

type Segment = { start: number; end: number };

type ClearAllocationRecord = {
  restIntervalId: string;
  intervalStartEpochMilliseconds: number;
  eligibleObligationIds: string[];
  compensationSegments: Segment[];
  blocks: CompensationBlock[];
  baseSharedForMultipleBlocks: boolean;
  baseKind: AttachmentBase["baseKind"];
  baseCompletionEpochMilliseconds: number;
  layout: AttachmentLayout;
};

type RestRepaymentUncertaintyEvidence = {
  kind: "REST_INTERVAL";
  restIntervalId: string;
  interval: RestInterval;
  chronologies: Segment[];
  noCandidateFallback: boolean;
  reserved: WeeklyRestComponent[];
};

type FactualRepaymentRequirement = {
  obligation: CompensationObligation;
  evidence: RestRepaymentUncertaintyEvidence;
  requiredByEpochMilliseconds: number;
};

type AllocationRepaymentUncertaintyEvidence = {
  kind: "ALLOCATION_DEPENDENCY";
  restIntervalId: string;
  possibleCompletionEpochMilliseconds: number;
  higherPriorityObligationIds: string[];
  factualRequirements: FactualRepaymentRequirement[];
};

type RepaymentUncertaintyEvidence = RestRepaymentUncertaintyEvidence | AllocationRepaymentUncertaintyEvidence;

function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function diagnostic(code: Phase5DiagnosticCode, sourceIds: string[], reason: string): Phase5Diagnostic {
  const ids = unique(sourceIds);
  return {
    diagnosticId: `phase5-diagnostic:${code}:${stableHash(JSON.stringify([ids, reason]))}`,
    code,
    sourceIds: ids,
    reason,
  };
}

function requireSafeInstant(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) throw new RangeError(`${label} must be a safe integer epoch millisecond instant.`);
}

function createObligations(branch: AllocationBranch, diagnostics: Phase5Diagnostic[]): CompensationObligation[] {
  const assignments = new Map(branch.fixedWeekAssignments.map((item) => [item.componentId, item]));
  const obligations: CompensationObligation[] = [];
  for (const component of branch.components
    .filter((item) => item.role === "COUNTED" && item.classification === "REDUCED")
    .sort((left, right) => left.endEpochMilliseconds - right.endEpochMilliseconds || left.componentId.localeCompare(right.componentId))) {
    const assignment = assignments.get(component.componentId);
    if (!assignment) {
      diagnostics.push(diagnostic("MISSING_SOURCE_ASSIGNMENT", [branch.branchId, component.componentId], "A counted reduced Weekly Rest has no fixed-week assignment."));
      continue;
    }
    const required = REGULAR_WEEKLY_REST_MILLISECONDS - component.durationMilliseconds;
    if (required <= 0) continue;
    const sourceWeek = fixedLegalWeekForInstant(assignment.weekStartEpochMilliseconds);
    if (sourceWeek.weekId !== assignment.fixedWeekId) {
      throw new RangeError(`Fixed-week assignment identity does not match its London boundary: ${assignment.assignmentId}.`);
    }
    const deadline = compensationDeadlineForWeek(sourceWeek);
    const identity = JSON.stringify([branch.branchId, component.componentId, assignment.assignmentId, required, deadline.epochMilliseconds]);
    obligations.push({
      obligationId: `compensation-obligation:${stableHash(identity)}`,
      branchId: branch.branchId,
      sourceComponentId: component.componentId,
      sourceRestIntervalId: component.restIntervalId,
      sourceFixedWeekAssignmentId: assignment.assignmentId,
      sourceFixedWeekId: assignment.fixedWeekId,
      sourceStartEpochMilliseconds: component.startEpochMilliseconds,
      sourceEndEpochMilliseconds: component.endEpochMilliseconds,
      sourceReducedDurationMilliseconds: component.durationMilliseconds,
      requiredCompensationMilliseconds: required,
      createdAtEpochMilliseconds: component.endEpochMilliseconds,
      deadlineEpochMilliseconds: deadline.epochMilliseconds,
      deadlineFixedWeekId: deadline.mondayDate,
      reviewStatus: component.reviewStatus,
      provenance: component.provenance,
    });
  }
  return obligations.sort((left, right) =>
    left.deadlineEpochMilliseconds - right.deadlineEpochMilliseconds
    || left.createdAtEpochMilliseconds - right.createdAtEpochMilliseconds
    || left.sourceComponentId.localeCompare(right.sourceComponentId)
    || left.obligationId.localeCompare(right.obligationId)
  );
}

function accruedEnd(interval: RestInterval, asOf: number): number | null {
  if (interval.startEpochMilliseconds == null || interval.startEpochMilliseconds > asOf) return null;
  const factualEnd = interval.state === "CLOSED" ? interval.endEpochMilliseconds : interval.observedThroughEpochMilliseconds;
  return factualEnd == null ? null : Math.min(factualEnd, asOf);
}

function boundaryInstants(boundary: RestInterval["endBoundary"], exact: number | null): number[] {
  if (exact != null) return [exact];
  return [...new Set((boundary?.time?.candidates ?? [])
    .map((candidate) => candidate.epochMilliseconds)
    .filter((candidate) => Number.isSafeInteger(candidate)))]
    .sort((left, right) => left - right);
}

function unresolvedReviewChronologies(interval: RestInterval, asOf: number): Segment[] {
  if (interval.state !== "CLOSED") return [];
  const starts = boundaryInstants(interval.startBoundary, interval.startEpochMilliseconds);
  const ends = boundaryInstants(interval.endBoundary, interval.endEpochMilliseconds);
  const range = interval.elapsedRangeMilliseconds;
  const candidates: Segment[] = [];
  for (const start of starts) {
    for (const candidateEnd of ends) {
      const end = Math.min(candidateEnd, asOf);
      const duration = end - start;
      if (duration <= 0) continue;
      if (range && (duration < range.minimum || duration > range.maximum)) continue;
      candidates.push({ start, end });
    }
  }
  if (!candidates.length && range && Number.isSafeInteger(range.maximum) && range.maximum > 0) {
    if (starts.length && !ends.length) {
      for (const start of starts) {
        const end = Math.min(start + range.maximum, asOf);
        if (end > start) candidates.push({ start, end });
      }
    } else if (ends.length && !starts.length) {
      for (const candidateEnd of ends) {
        const end = Math.min(candidateEnd, asOf);
        const start = end - range.maximum;
        if (end > start) candidates.push({ start, end });
      }
    }
  }
  return [...new Map(candidates.map((candidate) => [`${candidate.start}:${candidate.end}`, candidate])).values()]
    .sort((left, right) => left.start - right.start || left.end - right.end);
}

function hasNoCandidateUnresolvedBoundary(interval: RestInterval): boolean {
  return [interval.startBoundary, interval.endBoundary].some((boundary) =>
    boundary?.epochMilliseconds == null
    && boundary.time?.reviewRequired === true
    && boundary.time.candidates.length === 0
  );
}

function exactFactsProveReviewIntervalIrrelevant(
  interval: RestInterval,
  obligation: CompensationObligation,
  reserved: WeeklyRestComponent[],
): boolean {
  if (interval.restIntervalId === obligation.sourceRestIntervalId) return true;
  const start = interval.startEpochMilliseconds;
  const end = interval.endEpochMilliseconds;
  if (start != null) {
    if (start < obligation.createdAtEpochMilliseconds || start >= obligation.deadlineEpochMilliseconds) return true;
    if (obligation.deadlineEpochMilliseconds - start < obligation.requiredCompensationMilliseconds) return true;
  }
  if (end != null) {
    if (end <= obligation.createdAtEpochMilliseconds) return true;
    if (start == null && !couldContainDeadlineChangingPackage(obligation.createdAtEpochMilliseconds, obligation, end, reserved)) return true;
  }
  return false;
}

function subtractRanges(start: number, end: number, reserved: WeeklyRestComponent[]): Segment[] {
  const clipped = reserved
    .map((item) => ({ start: Math.max(start, item.startEpochMilliseconds), end: Math.min(end, item.endEpochMilliseconds) }))
    .filter((item) => item.end > item.start)
    .sort((left, right) => left.start - right.start || left.end - right.end);
  const merged: Segment[] = [];
  for (const range of clipped) {
    const previous = merged[merged.length - 1];
    if (previous && range.start <= previous.end) previous.end = Math.max(previous.end, range.end);
    else merged.push({ ...range });
  }
  const free: Segment[] = [];
  let cursor = start;
  for (const range of merged) {
    if (range.start > cursor) free.push({ start: cursor, end: range.start });
    cursor = Math.max(cursor, range.end);
  }
  if (cursor < end) free.push({ start: cursor, end });
  return free;
}

function subtractOccupiedSegments(segments: Segment[], occupied: Segment[]): Segment[] {
  let free = segments.map((segment) => ({ ...segment }));
  for (const range of occupied.sort((left, right) => left.start - right.start || left.end - right.end)) {
    free = free.flatMap((segment) => {
      if (range.end <= segment.start || range.start >= segment.end) return [segment];
      const remaining: Segment[] = [];
      if (range.start > segment.start) remaining.push({ start: segment.start, end: Math.min(range.start, segment.end) });
      if (range.end < segment.end) remaining.push({ start: Math.max(range.end, segment.start), end: segment.end });
      return remaining.filter((item) => item.end > item.start);
    });
  }
  return free;
}

type AlternateDependencyAllocation = {
  obligationId: string;
  possibleCompletionEpochMilliseconds: number;
};

function deterministicAlternateDependencyAllocations(
  record: ClearAllocationRecord,
  releasedHigherPriorityObligationIds: Set<string>,
  obligations: CompensationObligation[],
): AlternateDependencyAllocation[] {
  const remainingBlocks = record.blocks.filter((block) => !releasedHigherPriorityObligationIds.has(block.obligationId));
  if (!record.baseSharedForMultipleBlocks && remainingBlocks.length) return [];
  const free = subtractOccupiedSegments(
    record.compensationSegments,
    remainingBlocks.map((block) => ({ start: block.startEpochMilliseconds, end: block.endEpochMilliseconds })),
  );
  const firstReleasedIndex = obligations.findIndex((item) => releasedHigherPriorityObligationIds.has(item.obligationId));
  if (firstReleasedIndex < 0) return [];
  const allocations: AlternateDependencyAllocation[] = [];
  for (let lowerIndex = firstReleasedIndex + 1; lowerIndex < obligations.length; lowerIndex += 1) {
    const lower = obligations[lowerIndex];
    if (releasedHigherPriorityObligationIds.has(lower.obligationId)) continue;
    if (!record.eligibleObligationIds.includes(lower.obligationId)) continue;
    if (record.blocks.some((block) => block.obligationId === lower.obligationId)) continue;
    const range = allocateFromSegments(free, lower.requiredCompensationMilliseconds, record.layout);
    if (!range) continue;
    const packageCompletion = record.baseKind === "ORDINARY_9H_BASE" && record.layout === "BLOCK_THEN_BASE"
      ? range.end + ORDINARY_BASE_MILLISECONDS
      : Math.max(range.end, record.baseCompletionEpochMilliseconds);
    if (range.end <= lower.deadlineEpochMilliseconds) {
      allocations.push({
        obligationId: lower.obligationId,
        possibleCompletionEpochMilliseconds: packageCompletion,
      });
    }
    if (!record.baseSharedForMultipleBlocks) break;
  }
  return allocations;
}

function allocateFromSegments(segments: Segment[], duration: number, layout: AttachmentLayout): Segment | null {
  if (layout === "BASE_THEN_BLOCK") {
    for (const segment of segments) {
      if (segment.end - segment.start < duration) continue;
      const allocated = { start: segment.start, end: segment.start + duration };
      segment.start = allocated.end;
      return allocated;
    }
  } else {
    for (let index = segments.length - 1; index >= 0; index -= 1) {
      const segment = segments[index];
      if (segment.end - segment.start < duration) continue;
      const allocated = { start: segment.end - duration, end: segment.end };
      segment.end = allocated.start;
      return allocated;
    }
  }
  return null;
}

function relationStatus(
  obligation: CompensationObligation,
  interval: RestInterval,
  baseCompletion: number,
  blockEnd: number,
  strongNegativeCertain: boolean,
): { deadlineCase: CompensationDeadlineCase; status: CompensationResultStatus } {
  if (blockEnd <= obligation.deadlineEpochMilliseconds && baseCompletion <= obligation.deadlineEpochMilliseconds) {
    return {
      deadlineCase: "CASE_A",
      status: interval.state === "OPEN" ? "THRESHOLD_REACHED_PROVISIONAL" : "COMPLETED_ON_TIME",
    };
  }
  if (blockEnd <= obligation.deadlineEpochMilliseconds && baseCompletion > obligation.deadlineEpochMilliseconds) {
    return { deadlineCase: "CASE_B", status: "UNRESOLVED_ATTACHMENT_DEADLINE" };
  }
  return { deadlineCase: "CASE_C", status: strongNegativeCertain ? "OVERDUE" : "REVIEW" };
}

function couldContainDeadlineChangingPackage(
  start: number,
  obligation: CompensationObligation,
  accruedThrough: number,
  reserved: WeeklyRestComponent[],
): boolean {
  if (start >= obligation.deadlineEpochMilliseconds) return false;
  const onTimeEnd = Math.min(accruedThrough, obligation.deadlineEpochMilliseconds);
  if (onTimeEnd <= start) return false;
  const weeklyBaseComponent = [...reserved].sort((left, right) =>
    (right.classification === "REGULAR" ? 1 : 0) - (left.classification === "REGULAR" ? 1 : 0)
    || right.durationMilliseconds - left.durationMilliseconds
    || left.componentId.localeCompare(right.componentId)
  )[0];
  if (weeklyBaseComponent) {
    if (weeklyBaseComponent.endEpochMilliseconds > accruedThrough) return false;
    return (["BASE_THEN_BLOCK", "BLOCK_THEN_BASE"] as const).some((layout) =>
      subtractRanges(start, onTimeEnd, reserved)
        .filter((segment) => layout === "BASE_THEN_BLOCK"
          ? segment.start >= weeklyBaseComponent.endEpochMilliseconds
          : segment.end <= weeklyBaseComponent.startEpochMilliseconds)
        .some((segment) => segment.end - segment.start >= obligation.requiredCompensationMilliseconds)
    );
  }
  return accruedThrough - start >= ORDINARY_BASE_MILLISECONDS + obligation.requiredCompensationMilliseconds
    && onTimeEnd - start >= obligation.requiredCompensationMilliseconds;
}

function couldCompletePackageBy(
  start: number,
  obligation: CompensationObligation,
  accruedThrough: number,
  reserved: WeeklyRestComponent[],
  cutoff: number,
): boolean {
  if (start < obligation.createdAtEpochMilliseconds || start >= cutoff) return false;
  const through = Math.min(accruedThrough, cutoff);
  if (through <= start) return false;
  const weeklyBaseComponent = [...reserved].sort((left, right) =>
    (right.classification === "REGULAR" ? 1 : 0) - (left.classification === "REGULAR" ? 1 : 0)
    || right.durationMilliseconds - left.durationMilliseconds
    || left.componentId.localeCompare(right.componentId)
  )[0];
  if (weeklyBaseComponent) {
    if (weeklyBaseComponent.endEpochMilliseconds > through) return false;
    return (["BASE_THEN_BLOCK", "BLOCK_THEN_BASE"] as const).some((layout) =>
      subtractRanges(start, through, reserved)
        .filter((segment) => layout === "BASE_THEN_BLOCK"
          ? segment.start >= weeklyBaseComponent.endEpochMilliseconds
          : segment.end <= weeklyBaseComponent.startEpochMilliseconds)
        .some((segment) => segment.end - segment.start >= obligation.requiredCompensationMilliseconds)
    );
  }
  return through - start >= ORDINARY_BASE_MILLISECONDS + obligation.requiredCompensationMilliseconds;
}

function noCandidateEvidenceCouldCompleteBy(
  interval: RestInterval,
  obligation: CompensationObligation,
  reserved: WeeklyRestComponent[],
  cutoff: number,
): boolean {
  if (interval.restIntervalId === obligation.sourceRestIntervalId || cutoff <= obligation.createdAtEpochMilliseconds) return false;
  const start = interval.startEpochMilliseconds;
  const end = interval.endEpochMilliseconds;
  const range = interval.elapsedRangeMilliseconds;
  if (start != null) {
    if (start < obligation.createdAtEpochMilliseconds || start >= cutoff) return false;
    let optimisticEnd = Math.min(end ?? cutoff, cutoff);
    if (range && Number.isSafeInteger(range.maximum)) optimisticEnd = Math.min(optimisticEnd, start + range.maximum);
    return couldCompletePackageBy(start, obligation, optimisticEnd, reserved, cutoff);
  }
  if (end != null && end <= obligation.createdAtEpochMilliseconds) return false;
  let earliestPossibleStart = obligation.createdAtEpochMilliseconds;
  if (end != null && range && Number.isSafeInteger(range.maximum)) {
    earliestPossibleStart = Math.max(earliestPossibleStart, end - range.maximum);
  }
  if (end != null && range && Number.isSafeInteger(range.minimum) && earliestPossibleStart > end - range.minimum) return false;
  if (earliestPossibleStart >= cutoff) return false;
  let optimisticEnd = Math.min(end ?? cutoff, cutoff);
  if (end == null && range && Number.isSafeInteger(range.maximum)) {
    optimisticEnd = Math.min(optimisticEnd, earliestPossibleStart + range.maximum);
  }
  return couldCompletePackageBy(earliestPossibleStart, obligation, optimisticEnd, reserved, cutoff);
}

function evidenceCouldCompleteBy(
  evidence: RepaymentUncertaintyEvidence,
  obligation: CompensationObligation,
  cutoff: number,
): boolean {
  if (evidence.kind === "ALLOCATION_DEPENDENCY") {
    return evidence.possibleCompletionEpochMilliseconds <= cutoff;
  }
  if (evidence.chronologies.length) {
    return evidence.chronologies.some((candidate) =>
      couldCompletePackageBy(candidate.start, obligation, candidate.end, evidence.reserved, cutoff)
    );
  }
  return evidence.noCandidateFallback
    && noCandidateEvidenceCouldCompleteBy(evidence.interval, obligation, evidence.reserved, cutoff);
}

function sameReservedRanges(left: WeeklyRestComponent[], right: WeeklyRestComponent[]): boolean {
  const identity = (values: WeeklyRestComponent[]) => values
    .map((item) => `${item.componentId}:${item.startEpochMilliseconds}:${item.endEpochMilliseconds}:${item.classification}`)
    .sort()
    .join("|");
  return identity(left) === identity(right);
}

function restEvidenceIdentity(evidence: RestRepaymentUncertaintyEvidence): string {
  const chronologies = evidence.chronologies.map((item) => `${item.start}:${item.end}`).join(",");
  const reserved = evidence.reserved
    .map((item) => `${item.componentId}:${item.startEpochMilliseconds}:${item.endEpochMilliseconds}:${item.classification}`)
    .sort()
    .join(",");
  return `${evidence.restIntervalId}:${evidence.noCandidateFallback}:${chronologies}:${reserved}`;
}

function compareRequirementPriority(left: FactualRepaymentRequirement, right: FactualRepaymentRequirement): number {
  return left.obligation.deadlineEpochMilliseconds - right.obligation.deadlineEpochMilliseconds
    || left.obligation.createdAtEpochMilliseconds - right.obligation.createdAtEpochMilliseconds
    || left.obligation.sourceComponentId.localeCompare(right.obligation.sourceComponentId)
    || left.obligation.obligationId.localeCompare(right.obligation.obligationId)
    || left.evidence.restIntervalId.localeCompare(right.evidence.restIntervalId);
}

function canonicalFactualRequirements(values: FactualRepaymentRequirement[]): FactualRepaymentRequirement[] {
  const requirements = new Map<string, FactualRepaymentRequirement>();
  for (const value of values) {
    const key = `${value.obligation.obligationId}:${restEvidenceIdentity(value.evidence)}`;
    const previous = requirements.get(key);
    if (!previous || value.requiredByEpochMilliseconds < previous.requiredByEpochMilliseconds) requirements.set(key, value);
  }
  return [...requirements.values()].sort(compareRequirementPriority);
}

function factualRequirementStateKey(values: FactualRepaymentRequirement[]): string {
  return canonicalFactualRequirements(values).map((item) =>
    `${item.obligation.obligationId}:${restEvidenceIdentity(item.evidence)}:${item.requiredByEpochMilliseconds}`
  ).join("|");
}

function optimisticJointNoCandidateChronology(
  requirements: FactualRepaymentRequirement[],
  evidence: RestRepaymentUncertaintyEvidence,
): Segment | null {
  if (!evidence.noCandidateFallback) return null;
  const interval = evidence.interval;
  const range = interval.elapsedRangeMilliseconds;
  const latestCreation = Math.max(...requirements.map((item) => item.obligation.createdAtEpochMilliseconds));
  const latestCutoff = Math.max(...requirements.map((item) => item.requiredByEpochMilliseconds));
  let start = interval.startEpochMilliseconds ?? latestCreation;
  if (interval.startEpochMilliseconds == null && interval.endEpochMilliseconds != null && range && Number.isSafeInteger(range.maximum)) {
    start = Math.max(start, interval.endEpochMilliseconds - range.maximum);
  }
  if (start < latestCreation || start >= latestCutoff) return null;
  let end = Math.min(interval.endEpochMilliseconds ?? latestCutoff, latestCutoff);
  if (interval.endEpochMilliseconds == null && range && Number.isSafeInteger(range.maximum)) {
    end = Math.min(end, start + range.maximum);
  }
  if (interval.endEpochMilliseconds != null
    && interval.startEpochMilliseconds == null
    && range
    && Number.isSafeInteger(range.minimum)
    && start > interval.endEpochMilliseconds - range.minimum) return null;
  return end > start ? { start, end } : null;
}

function sameRestEvidenceCanJointlyRepay(
  requirements: FactualRepaymentRequirement[],
): boolean {
  if (requirements.length < 2) return false;
  const evidence = requirements.map((item) => item.evidence);
  const first = evidence[0];
  if (evidence.some((item) => !sameReservedRanges(first.reserved, item.reserved))) return false;
  const chronologies = first.chronologies.length
    ? first.chronologies.filter((chronology) => evidence.every((item) => item.chronologies.some((candidate) =>
      candidate.start === chronology.start && candidate.end === chronology.end
    )))
    : evidence.every((item) => item.noCandidateFallback)
      ? [optimisticJointNoCandidateChronology(requirements, first)].filter((item): item is Segment => item != null)
      : [];
  if (!chronologies.length) return false;
  const weeklyBaseComponent = [...first.reserved].sort((left, right) =>
    (right.classification === "REGULAR" ? 1 : 0) - (left.classification === "REGULAR" ? 1 : 0)
    || right.durationMilliseconds - left.durationMilliseconds
    || left.componentId.localeCompare(right.componentId)
  )[0];
  if (!weeklyBaseComponent
    || weeklyBaseComponent.classification !== "REGULAR"
    || weeklyBaseComponent.durationMilliseconds < REGULAR_WEEKLY_REST_MILLISECONDS) {
    return false;
  }
  for (const chronology of chronologies) {
    const through = Math.min(chronology.end, Math.max(...requirements.map((item) => item.requiredByEpochMilliseconds)));
    if (weeklyBaseComponent.endEpochMilliseconds > through) continue;
    if (!requirements.every((item) => couldCompletePackageBy(
      chronology.start,
      item.obligation,
      chronology.end,
      first.reserved,
      item.requiredByEpochMilliseconds,
    ))) continue;
    for (const layout of ["BASE_THEN_BLOCK", "BLOCK_THEN_BASE"] as const) {
      const free = subtractRanges(chronology.start, through, first.reserved).filter((segment) =>
        layout === "BASE_THEN_BLOCK"
          ? segment.start >= weeklyBaseComponent.endEpochMilliseconds
          : segment.end <= weeklyBaseComponent.startEpochMilliseconds
      );
      let allFit = true;
      for (const requirement of requirements) {
        const range = allocateFromSegments(free, requirement.obligation.requiredCompensationMilliseconds, layout);
        const packageCompletion = Math.max(range?.end ?? Number.POSITIVE_INFINITY, weeklyBaseComponent.endEpochMilliseconds);
        if (!range
          || range.end > requirement.obligation.deadlineEpochMilliseconds
          || packageCompletion > requirement.requiredByEpochMilliseconds) {
          allFit = false;
          break;
        }
      }
      if (allFit) return true;
    }
  }
  return false;
}

function factualRequirementsAreJointlyCompatible(
  requirements: FactualRepaymentRequirement[],
): boolean {
  const byRestInterval = new Map<string, FactualRepaymentRequirement[]>();
  for (const requirement of canonicalFactualRequirements(requirements)) {
    const values = byRestInterval.get(requirement.evidence.restIntervalId) ?? [];
    values.push(requirement);
    byRestInterval.set(requirement.evidence.restIntervalId, values);
  }
  for (const values of byRestInterval.values()) {
    if (values.length === 1) {
      const value = values[0];
      if (!evidenceCouldCompleteBy(value.evidence, value.obligation, value.requiredByEpochMilliseconds)) return false;
      continue;
    }
    if (!sameRestEvidenceCanJointlyRepay(values)) return false;
  }
  return true;
}

function factualRequirementsForEvidence(
  obligation: CompensationObligation,
  evidence: RepaymentUncertaintyEvidence,
  requiredByEpochMilliseconds: number,
): FactualRepaymentRequirement[] {
  return evidence.kind === "REST_INTERVAL"
    ? [{ obligation, evidence, requiredByEpochMilliseconds }]
    : evidence.factualRequirements;
}

type CompatibleHigherReleaseState = {
  releasedIds: string[];
  factualRequirements: FactualRepaymentRequirement[];
};

function compatibleHigherReleaseStates(
  record: ClearAllocationRecord,
  obligations: CompensationObligation[],
  evidenceByObligation: Map<string, RepaymentUncertaintyEvidence[]>,
): CompatibleHigherReleaseState[] {
  const obligationIndex = new Map(obligations.map((item, index) => [item.obligationId, index]));
  const candidates = record.blocks
    .map((block) => {
      const obligation = obligations[obligationIndex.get(block.obligationId) ?? -1];
      const evidence = obligation
        ? (evidenceByObligation.get(obligation.obligationId) ?? []).filter((item) =>
          evidenceCouldCompleteBy(item, obligation, record.intervalStartEpochMilliseconds)
        )
        : [];
      return obligation && evidence.length ? { obligation, evidence } : null;
    })
    .filter((item): item is { obligation: CompensationObligation; evidence: RepaymentUncertaintyEvidence[] } => item != null)
    .sort((left, right) =>
      (obligationIndex.get(left.obligation.obligationId) as number)
      - (obligationIndex.get(right.obligation.obligationId) as number)
    );
  let states: CompatibleHigherReleaseState[] = [{ releasedIds: [], factualRequirements: [] }];
  for (const candidate of candidates) {
    const additions: CompatibleHigherReleaseState[] = [];
    for (const state of states) {
      for (const evidence of candidate.evidence) {
        const factualRequirements = canonicalFactualRequirements([
          ...state.factualRequirements,
          ...factualRequirementsForEvidence(candidate.obligation, evidence, record.intervalStartEpochMilliseconds),
        ]);
        if (factualRequirementsAreJointlyCompatible(factualRequirements)) {
          additions.push({
            releasedIds: [...state.releasedIds, candidate.obligation.obligationId],
            factualRequirements,
          });
        }
      }
    }
    const uniqueStates = new Map<string, CompatibleHigherReleaseState>();
    for (const state of [...states, ...additions]) {
      const key = `${state.releasedIds.join("+")}::${factualRequirementStateKey(state.factualRequirements)}`;
      uniqueStates.set(key, state);
    }
    states = [...uniqueStates.values()];
  }
  return states.filter((state) => state.releasedIds.length > 0);
}

function addUncertaintyEvidence(
  evidenceByObligation: Map<string, RepaymentUncertaintyEvidence[]>,
  obligationId: string,
  evidence: RepaymentUncertaintyEvidence,
): boolean {
  const values = evidenceByObligation.get(obligationId) ?? [];
  const duplicate = values.some((item) => item.kind === evidence.kind
    && item.restIntervalId === evidence.restIntervalId
    && (item.kind === "REST_INTERVAL"
      || item.possibleCompletionEpochMilliseconds === (evidence as AllocationRepaymentUncertaintyEvidence).possibleCompletionEpochMilliseconds
        && item.higherPriorityObligationIds.join("|")
          === (evidence as AllocationRepaymentUncertaintyEvidence).higherPriorityObligationIds.join("|")
        && factualRequirementStateKey(item.factualRequirements)
          === factualRequirementStateKey((evidence as AllocationRepaymentUncertaintyEvidence).factualRequirements)));
  if (!duplicate) evidenceByObligation.set(obligationId, [...values, evidence]);
  return !duplicate;
}

function makeBase(
  interval: RestInterval,
  kind: AttachmentBase["baseKind"],
  start: number,
  completion: number,
  sourceComponentId: string | null,
  shared: boolean,
): AttachmentBase {
  const minimum = completion - start;
  return {
    baseId: `attachment-base:${stableHash(JSON.stringify([interval.restIntervalId, kind, start, completion, sourceComponentId]))}`,
    restIntervalId: interval.restIntervalId,
    baseKind: kind,
    minimumRequiredMilliseconds: minimum,
    startEpochMilliseconds: start,
    completionEpochMilliseconds: completion,
    sourceWeeklyComponentId: sourceComponentId,
    sharedForMultipleBlocks: shared,
  };
}

function attach(
  obligation: CompensationObligation,
  interval: RestInterval,
  base: AttachmentBase,
  allocated: Segment,
  layout: AttachmentLayout,
  priority: number,
  strongNegativeCertain: boolean,
): { block: CompensationBlock; relation: AttachmentRelation } {
  const blockId = `compensation-block:${stableHash(JSON.stringify([obligation.obligationId, interval.restIntervalId, allocated.start, allocated.end, layout]))}`;
  const block: CompensationBlock = {
    blockId,
    obligationId: obligation.obligationId,
    restIntervalId: interval.restIntervalId,
    startEpochMilliseconds: allocated.start,
    endEpochMilliseconds: allocated.end,
    durationMilliseconds: allocated.end - allocated.start,
    allocationPriority: priority,
    layout,
    reviewStatus: "CLEAR",
  };
  const outcome = relationStatus(obligation, interval, base.completionEpochMilliseconds, block.endEpochMilliseconds, strongNegativeCertain);
  const packageCompletion = Math.max(base.completionEpochMilliseconds, block.endEpochMilliseconds);
  return {
    block,
    relation: {
      attachmentId: `attachment:${stableHash(JSON.stringify([obligation.obligationId, blockId, base.baseId]))}`,
      obligationId: obligation.obligationId,
      blockId,
      baseId: base.baseId,
      restIntervalId: interval.restIntervalId,
      layout,
      packageCompletionEpochMilliseconds: packageCompletion,
      deadlineCase: outcome.deadlineCase,
      status: outcome.status,
      reviewStatus: outcome.status === "REVIEW" ? "REVIEW_REQUIRED" : "CLEAR",
    },
  };
}

function resultForOutstanding(
  obligation: CompensationObligation,
  context: CompensationEvaluationContext,
  reviewReasons: string[],
): CompensationObligationResult {
  const reasons = [...reviewReasons];
  if (context.asOfEpochMilliseconds > obligation.deadlineEpochMilliseconds && !context.factualCoverageCompleteThroughAsOf) {
    reasons.push("Factual coverage through the compensation deadline is incomplete.");
  }
  const status: CompensationResultStatus = obligation.reviewStatus === "REVIEW_REQUIRED" || reasons.length
    ? "REVIEW"
    : context.asOfEpochMilliseconds > obligation.deadlineEpochMilliseconds && context.factualCoverageCompleteThroughAsOf
      ? "OVERDUE"
      : "OUTSTANDING";
  return {
    obligationId: obligation.obligationId,
    status,
    remainingCompensationMilliseconds: obligation.requiredCompensationMilliseconds,
    attachmentId: null,
    reviewReasons: unique(reasons),
  };
}

function evaluateBranchMode(
  intervals: readonly RestInterval[],
  branch: AllocationBranch,
  context: CompensationEvaluationContext,
  layout: AttachmentLayout,
): BranchCompensationEvaluation {
  const diagnostics: Phase5Diagnostic[] = [];
  const obligations = createObligations(branch, diagnostics);
  const allocated = new Set<string>();
  const blocks: CompensationBlock[] = [];
  const bases = new Map<string, AttachmentBase>();
  const attachments: AttachmentRelation[] = [];
  const uncertainty = new Map<string, string[]>();
  const uncertaintyEvidence = new Map<string, RepaymentUncertaintyEvidence[]>();
  const capacities: CompensationUnallocatedCapacity[] = [];
  const clearAllocationRecords: ClearAllocationRecord[] = [];
  const componentsByRest = new Map<string, WeeklyRestComponent[]>();
  for (const component of branch.components) {
    const values = componentsByRest.get(component.restIntervalId) ?? [];
    values.push(component);
    componentsByRest.set(component.restIntervalId, values);
  }
  const uniqueIntervals = new Map<string, RestInterval>();
  for (const interval of intervals) {
    const key = JSON.stringify(interval);
    if (!uniqueIntervals.has(key)) uniqueIntervals.set(key, interval);
  }
  const orderedIntervals = [...uniqueIntervals.values()].sort((left, right) =>
    (left.startEpochMilliseconds ?? Number.MAX_SAFE_INTEGER) - (right.startEpochMilliseconds ?? Number.MAX_SAFE_INTEGER)
    || left.restIntervalId.localeCompare(right.restIntervalId)
  );

  for (const interval of orderedIntervals) {
    const start = interval.startEpochMilliseconds;
    const end = accruedEnd(interval, context.asOfEpochMilliseconds);
    const reserved = (componentsByRest.get(interval.restIntervalId) ?? [])
      .filter((item) => item.reviewStatus === "CLEAR")
      .sort((left, right) => left.startEpochMilliseconds - right.startEpochMilliseconds || left.componentId.localeCompare(right.componentId));
    if (interval.reviewStatus === "REVIEW_REQUIRED" && interval.state === "CLOSED" && (start == null || end == null)) {
      const chronologies = unresolvedReviewChronologies(interval, context.asOfEpochMilliseconds);
      const noCandidateFallback = chronologies.length === 0 && hasNoCandidateUnresolvedBoundary(interval);
      const relevant = obligations.filter((item) =>
        item.reviewStatus === "CLEAR"
        && (chronologies.some((candidate) =>
            interval.restIntervalId !== item.sourceRestIntervalId
            && candidate.start >= item.createdAtEpochMilliseconds
            && couldContainDeadlineChangingPackage(candidate.start, item, candidate.end, reserved)
          )
          || noCandidateFallback && !exactFactsProveReviewIntervalIrrelevant(interval, item, reserved)
        )
      );
      for (const item of relevant) {
        uncertainty.set(item.obligationId, unique([...(uncertainty.get(item.obligationId) ?? []), ...interval.reviewReasons, "A possible repayment RestInterval has unresolved exact boundaries."]));
        addUncertaintyEvidence(uncertaintyEvidence, item.obligationId, {
          kind: "REST_INTERVAL",
          restIntervalId: interval.restIntervalId,
          interval,
          chronologies,
          noCandidateFallback,
          reserved,
        });
      }
      diagnostics.push(diagnostic(
        "REPAYMENT_REVIEW_REQUIRED",
        [interval.restIntervalId, ...relevant.map((item) => item.obligationId)],
        relevant.length
          ? "A REVIEW_REQUIRED RestInterval with unresolved exact boundaries could contain a deadline-relevant compensation package."
          : "A REVIEW_REQUIRED RestInterval with unresolved exact boundaries was not relevant to an obligation deadline.",
      ));
      continue;
    }
    if (start == null || end == null || end <= start) continue;
    const eligible = obligations.filter((item) =>
      !allocated.has(item.obligationId)
      && item.reviewStatus === "CLEAR"
      && interval.restIntervalId !== item.sourceRestIntervalId
      && start >= item.createdAtEpochMilliseconds
    );
    if (!eligible.length) {
      for (const item of obligations.filter((value) => interval.restIntervalId === value.sourceRestIntervalId && start >= value.createdAtEpochMilliseconds)) {
        diagnostics.push(diagnostic("SOURCE_INTERVAL_EXCLUDED", [item.obligationId, interval.restIntervalId], "A source RestInterval cannot repay its own compensation obligation."));
      }
      continue;
    }
    if (interval.reviewStatus === "REVIEW_REQUIRED") {
      for (const item of eligible) {
        if (couldContainDeadlineChangingPackage(start, item, end, reserved)) {
          uncertainty.set(item.obligationId, unique([...(uncertainty.get(item.obligationId) ?? []), ...interval.reviewReasons, "A possible on-time repayment RestInterval requires review."]));
          addUncertaintyEvidence(uncertaintyEvidence, item.obligationId, {
            kind: "REST_INTERVAL",
            restIntervalId: interval.restIntervalId,
            interval,
            chronologies: [{ start, end }],
            noCandidateFallback: false,
            reserved,
          });
        }
      }
      diagnostics.push(diagnostic("REPAYMENT_REVIEW_REQUIRED", [interval.restIntervalId, ...eligible.map((item) => item.obligationId)], "A REVIEW_REQUIRED RestInterval was not used for confirmed compensation completion."));
      continue;
    }

    const weeklyBaseComponent = [...reserved].sort((left, right) =>
      (right.classification === "REGULAR" ? 1 : 0) - (left.classification === "REGULAR" ? 1 : 0)
      || right.durationMilliseconds - left.durationMilliseconds
      || left.componentId.localeCompare(right.componentId)
    )[0];

    if (weeklyBaseComponent && weeklyBaseComponent.endEpochMilliseconds <= end) {
      const base = makeBase(
        interval,
        "WEEKLY_REST_BASE",
        weeklyBaseComponent.startEpochMilliseconds,
        weeklyBaseComponent.endEpochMilliseconds,
        weeklyBaseComponent.componentId,
        weeklyBaseComponent.classification === "REGULAR" && weeklyBaseComponent.durationMilliseconds >= REGULAR_WEEKLY_REST_MILLISECONDS,
      );
      const compensationSegments = subtractRanges(start, end, reserved).filter((segment) =>
        layout === "BASE_THEN_BLOCK" ? segment.start >= base.completionEpochMilliseconds : segment.end <= base.startEpochMilliseconds
      );
      const free = compensationSegments.map((segment) => ({ ...segment }));
      const available = free.reduce((sum, item) => sum + item.end - item.start, 0);
      let used = 0;
      let attachedCount = 0;
      const intervalBlocks: CompensationBlock[] = [];
      const mayShare = base.sharedForMultipleBlocks;
      for (let priority = 0; priority < obligations.length; priority += 1) {
        const item = obligations[priority];
        if (!eligible.some((value) => value.obligationId === item.obligationId) || allocated.has(item.obligationId)) continue;
        if (attachedCount && !mayShare) {
          diagnostics.push(diagnostic("ORDINARY_SHARED_BASE_UNSUPPORTED", [base.baseId, item.obligationId], "A non-regular attachment base cannot carry multiple compensation blocks in v1."));
          continue;
        }
        const range = allocateFromSegments(free, item.requiredCompensationMilliseconds, layout);
        if (!range) {
          diagnostics.push(diagnostic("INSUFFICIENT_CONTIGUOUS_CAPACITY", [interval.restIntervalId, item.obligationId], "The available continuous compensation capacity cannot fit this obligation in full."));
          continue;
        }
        const strongNegativeCertain = context.factualCoverageCompleteThroughAsOf && !(uncertainty.get(item.obligationId)?.length);
        const values = attach(item, interval, base, range, layout, priority + 1, strongNegativeCertain);
        bases.set(base.baseId, base);
        blocks.push(values.block);
        intervalBlocks.push(values.block);
        attachments.push(values.relation);
        allocated.add(item.obligationId);
        used += item.requiredCompensationMilliseconds;
        attachedCount += 1;
      }
      capacities.push({ restIntervalId: interval.restIntervalId, availableCompensationMilliseconds: available, unusedCompensationMilliseconds: available - used });
      if (intervalBlocks.length) {
        clearAllocationRecords.push({
          restIntervalId: interval.restIntervalId,
          intervalStartEpochMilliseconds: start,
          eligibleObligationIds: eligible.map((item) => item.obligationId),
          compensationSegments,
          blocks: intervalBlocks,
          baseSharedForMultipleBlocks: mayShare,
          baseKind: base.baseKind,
          baseCompletionEpochMilliseconds: base.completionEpochMilliseconds,
          layout,
        });
      }
      continue;
    }

    const total = end - start;
    const available = Math.max(0, total - ORDINARY_BASE_MILLISECONDS);
    let chosen: CompensationObligation | null = null;
    let priority = 0;
    for (let index = 0; index < obligations.length; index += 1) {
      const item = obligations[index];
      if (!eligible.some((value) => value.obligationId === item.obligationId) || allocated.has(item.obligationId)) continue;
      if (item.requiredCompensationMilliseconds <= available) {
        chosen = item;
        priority = index + 1;
        break;
      }
      diagnostics.push(diagnostic("INSUFFICIENT_CONTIGUOUS_CAPACITY", [interval.restIntervalId, item.obligationId], "The available continuous compensation capacity cannot fit this obligation in full."));
    }
    if (!chosen) {
      capacities.push({ restIntervalId: interval.restIntervalId, availableCompensationMilliseconds: available, unusedCompensationMilliseconds: available });
      continue;
    }
    const blockRange = layout === "BASE_THEN_BLOCK"
      ? { start: start + ORDINARY_BASE_MILLISECONDS, end: start + ORDINARY_BASE_MILLISECONDS + chosen.requiredCompensationMilliseconds }
      : { start, end: start + chosen.requiredCompensationMilliseconds };
    const baseStart = layout === "BASE_THEN_BLOCK" ? start : blockRange.end;
    const base = makeBase(interval, "ORDINARY_9H_BASE", baseStart, baseStart + ORDINARY_BASE_MILLISECONDS, null, false);
    const strongNegativeCertain = context.factualCoverageCompleteThroughAsOf && !(uncertainty.get(chosen.obligationId)?.length);
    const values = attach(chosen, interval, base, blockRange, layout, priority, strongNegativeCertain);
    bases.set(base.baseId, base);
    blocks.push(values.block);
    attachments.push(values.relation);
    allocated.add(chosen.obligationId);
    capacities.push({ restIntervalId: interval.restIntervalId, availableCompensationMilliseconds: available, unusedCompensationMilliseconds: available - chosen.requiredCompensationMilliseconds });
    clearAllocationRecords.push({
      restIntervalId: interval.restIntervalId,
      intervalStartEpochMilliseconds: start,
      eligibleObligationIds: eligible.map((item) => item.obligationId),
      compensationSegments: [{
        start: layout === "BASE_THEN_BLOCK" ? start + ORDINARY_BASE_MILLISECONDS : start,
        end: layout === "BASE_THEN_BLOCK" ? end : end - ORDINARY_BASE_MILLISECONDS,
      }],
      blocks: [values.block],
      baseSharedForMultipleBlocks: false,
      baseKind: base.baseKind,
      baseCompletionEpochMilliseconds: base.completionEpochMilliseconds,
      layout,
    });
    if (eligible.filter((item) => item.obligationId !== chosen?.obligationId).length) {
      diagnostics.push(diagnostic("ORDINARY_SHARED_BASE_UNSUPPORTED", [base.baseId, ...eligible.map((item) => item.obligationId)], "One ordinary 9h base is not shared across multiple compensation obligations in v1."));
    }
  }

  const dependencyReason = "Clear compensation capacity for this obligation depends on unresolved repayment of a higher-priority obligation.";
  const jointDependencyReason = "Clear compensation capacity for this obligation depends on a jointly compatible unresolved repayment state for higher-priority obligations.";
  const recordedDependencies = new Set<string>();
  for (let pass = 0; pass < obligations.length; pass += 1) {
    let changed = false;
    for (const record of clearAllocationRecords) {
      const releaseStates = compatibleHigherReleaseStates(record, obligations, uncertaintyEvidence);
      for (const releaseState of releaseStates) {
        const releasedIds = releaseState.releasedIds;
        const released = new Set(releasedIds);
        const alternateAllocations = deterministicAlternateDependencyAllocations(
          record,
          released,
          obligations,
        );
        const reason = releasedIds.length > 1 ? jointDependencyReason : dependencyReason;
        for (const alternate of alternateAllocations) {
          const lower = obligations.find((item) => item.obligationId === alternate.obligationId) as CompensationObligation;
          const currentReasons = uncertainty.get(lower.obligationId) ?? [];
          if (!currentReasons.includes(reason)) {
            uncertainty.set(lower.obligationId, unique([...currentReasons, reason]));
            changed = true;
          }
          const evidenceAdded = addUncertaintyEvidence(uncertaintyEvidence, lower.obligationId, {
            kind: "ALLOCATION_DEPENDENCY",
            restIntervalId: record.restIntervalId,
            possibleCompletionEpochMilliseconds: alternate.possibleCompletionEpochMilliseconds,
            higherPriorityObligationIds: releasedIds,
            factualRequirements: releaseState.factualRequirements,
          });
          if (evidenceAdded) changed = true;
          const dependencyKey = `${record.restIntervalId}:${releasedIds.join("+")}:${lower.obligationId}`;
          if (!recordedDependencies.has(dependencyKey)) {
            recordedDependencies.add(dependencyKey);
            diagnostics.push(diagnostic(
              "REPAYMENT_REVIEW_REQUIRED",
              [record.restIntervalId, ...releasedIds, lower.obligationId],
              reason,
            ));
          }
        }
      }
    }
    if (!changed) break;
  }

  const relationMap = new Map(attachments.map((item) => [item.obligationId, item]));
  const obligationResults: CompensationObligationResult[] = obligations.map((item) => {
    const relation = relationMap.get(item.obligationId);
    if (!relation) return resultForOutstanding(item, context, uncertainty.get(item.obligationId) ?? []);
    const confirmed = relation.status === "COMPLETED_ON_TIME" || relation.status === "THRESHOLD_REACHED_PROVISIONAL";
    const reviewReasons = [...(uncertainty.get(item.obligationId) ?? [])];
    if (relation.status === "REVIEW" && !context.factualCoverageCompleteThroughAsOf) {
      reviewReasons.push("Factual coverage through the compensation deadline is incomplete.");
    }
    const caseBReason = "The compensation block accrued by deadline, but the required attachment base completed after deadline (Case B).";
    const finalReviewRequired = !confirmed && reviewReasons.length > 0;
    const relationStatusBeforeFinalReview = relation.status;
    if (finalReviewRequired && relation.status === "OVERDUE") {
      relation.status = "REVIEW";
      relation.reviewStatus = "REVIEW_REQUIRED";
    }
    return {
      obligationId: item.obligationId,
      status: finalReviewRequired ? "REVIEW" : relation.status,
      remainingCompensationMilliseconds: confirmed ? 0 : item.requiredCompensationMilliseconds,
      attachmentId: relation.attachmentId,
      reviewReasons: relationStatusBeforeFinalReview === "UNRESOLVED_ATTACHMENT_DEADLINE"
        ? unique([caseBReason, ...reviewReasons])
        : unique(reviewReasons),
    };
  });
  const completed = obligationResults.filter((item) => item.status === "COMPLETED_ON_TIME" || item.status === "THRESHOLD_REACHED_PROVISIONAL").map((item) => item.obligationId).sort();
  const outstanding = obligationResults.filter((item) => !completed.includes(item.obligationId)).map((item) => item.obligationId).sort();
  const canonical = {
    branchId: branch.branchId,
    layout,
    obligations: obligations.map((item) => [item.obligationId, item.requiredCompensationMilliseconds, item.deadlineEpochMilliseconds]),
    blocks: blocks.map((item) => [item.obligationId, item.restIntervalId, item.startEpochMilliseconds, item.endEpochMilliseconds]),
    bases: [...bases.values()].map((item) => [item.baseId, item.startEpochMilliseconds, item.completionEpochMilliseconds]),
    results: obligationResults.map((item) => [item.obligationId, item.status, item.remainingCompensationMilliseconds]),
  };
  const fingerprint = JSON.stringify(canonical);
  return {
    evaluationId: `compensation-evaluation:${stableHash(fingerprint)}`,
    branchId: branch.branchId,
    phase4BranchFingerprint: branch.branchFingerprint,
    layoutStrategy: layout,
    obligations,
    blocks: blocks.sort((left, right) => left.startEpochMilliseconds - right.startEpochMilliseconds || left.blockId.localeCompare(right.blockId)),
    attachmentBases: [...bases.values()].sort((left, right) => left.startEpochMilliseconds - right.startEpochMilliseconds || left.baseId.localeCompare(right.baseId)),
    attachments: attachments.sort((left, right) => left.packageCompletionEpochMilliseconds - right.packageCompletionEpochMilliseconds || left.attachmentId.localeCompare(right.attachmentId)),
    obligationResults,
    completedObligationIds: completed,
    outstandingObligationIds: outstanding,
    unallocatedCapacity: capacities.sort((left, right) => left.restIntervalId.localeCompare(right.restIntervalId)),
    diagnostics: [...new Map(diagnostics.map((item) => [item.diagnosticId, item])).values()].sort((left, right) => left.diagnosticId.localeCompare(right.diagnosticId)),
    evaluationFingerprint: fingerprint,
  };
}

function publicOutcomeFingerprint(evaluation: BranchCompensationEvaluation): string {
  const obligations = evaluation.obligations.map((item) => {
    const result = evaluation.obligationResults.find((value) => value.obligationId === item.obligationId);
    return [item.requiredCompensationMilliseconds, item.deadlineEpochMilliseconds, result?.status ?? "OUTSTANDING"];
  }).sort((left, right) => Number(left[1]) - Number(right[1]) || Number(left[0]) - Number(right[0]) || String(left[2]).localeCompare(String(right[2])));
  return JSON.stringify(obligations);
}

export function evaluateCompensation(
  restIntervals: readonly RestInterval[],
  phase4AllocationBranches: readonly AllocationBranch[],
  context: CompensationEvaluationContext,
): EvaluateCompensationResult {
  requireSafeInstant(context.asOfEpochMilliseconds, "asOf");
  const evaluations: BranchCompensationEvaluation[] = [];
  for (const branch of [...phase4AllocationBranches].sort((left, right) => left.branchId.localeCompare(right.branchId))) {
    const alternatives = (["BASE_THEN_BLOCK", "BLOCK_THEN_BASE"] as const)
      .map((layout) => evaluateBranchMode(restIntervals, branch, context, layout));
    const maximumBlocks = Math.max(...alternatives.map((item) => item.blocks.length));
    const meaningful = alternatives.filter((item, index) =>
      maximumBlocks === 0 ? index === 0 : item.blocks.length > 0
    );
    const canonical = new Map<string, BranchCompensationEvaluation>();
    for (const item of meaningful) if (!canonical.has(item.evaluationFingerprint)) canonical.set(item.evaluationFingerprint, item);
    evaluations.push(...canonical.values());
  }
  const groups = new Map<string, BranchCompensationEvaluation[]>();
  for (const item of evaluations) {
    const key = publicOutcomeFingerprint(item);
    const values = groups.get(key) ?? [];
    values.push(item);
    groups.set(key, values);
  }
  const convergences: CompensationConvergence[] = [];
  for (const [fingerprint, values] of groups) {
    const branchIds = unique(values.map((item) => item.branchId));
    if (branchIds.length < 2) continue;
    convergences.push({
      convergenceId: `compensation-convergence:${stableHash(fingerprint)}`,
      publicOutcomeFingerprint: fingerprint,
      evaluationIds: unique(values.map((item) => item.evaluationId)),
      branchIds,
    });
  }
  return {
    branchEvaluations: evaluations.sort((left, right) => left.branchId.localeCompare(right.branchId) || left.evaluationId.localeCompare(right.evaluationId)),
    convergences: convergences.sort((left, right) => left.convergenceId.localeCompare(right.convergenceId)),
  };
}
