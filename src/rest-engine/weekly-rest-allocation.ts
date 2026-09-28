import {
  type AllocationBranch,
  type AllocationBranchLegalState,
  type ComponentConstraint,
  type FixedLegalWeek,
  type FixedWeekAssignment,
  type Phase4Issue,
  type Phase4IssueCode,
  type RestInterval,
  type ReviewStatus,
  type RollingQualifyingWeeklyRest,
  type RollingCycleReset,
  type RollingCycleStatus,
  type SolveWeeklyRestAllocationsResult,
  type TwoWeekEvaluation,
  type TwoWeekEvaluationStatus,
  type WeeklyRestAllocationContext,
  type WeeklyRestComponent,
  type WeeklyRestComponentOption,
} from "./types.ts";
import { addElapsedHours, fixedLegalWeekForInstant, resolveLondonWallTime } from "./time.ts";
import { generateWeeklyRestComponentOptions } from "./weekly-rest-candidates.ts";
import { allocationFrontierAlternative, boundedContinuationFingerprint, continuationLineageForCurrentState, rebasePackageContinuations, successorContinuationLineage } from "./allocation-frontier.ts";

const WEEKLY_REST_CYCLE_HOURS = 144;

export type MaterializedChoice = {
  choiceId: string;
  components: WeeklyRestComponent[];
  assignments: FixedWeekAssignment[];
  sourceOptionIds: string[];
  reviewStatus: ReviewStatus;
  reviewReasons: string[];
  /** Identifies the live frontier lineage supplying this choice, when seeded. */
  continuationContextId?: string;
  continuationLineageId?: string;
  packageContinuations?: unknown[];
};

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

function stableIssue(code: Phase4IssueCode, sourceIds: string[], reason: string): Phase4Issue {
  const ids = unique(sourceIds);
  return {
    issueId: `phase4-issue:${code}:${stableHash(JSON.stringify([ids, reason]))}`,
    code,
    sourceIds: ids,
    reason,
  };
}

function requireSafeInstant(value: number, label: string): void {
  if (!Number.isSafeInteger(value)) throw new RangeError(`${label} must be a safe integer epoch millisecond instant.`);
}

function weekFromId(weekId: string): FixedLegalWeek {
  const midnight = resolveLondonWallTime(weekId, "00:00:00");
  if (midnight.epochMilliseconds == null) throw new RangeError(`Invalid fixed-week id: ${weekId}.`);
  const week = fixedLegalWeekForInstant(midnight.epochMilliseconds);
  if (week.weekId !== weekId) throw new RangeError(`Fixed-week id must be a London Monday: ${weekId}.`);
  return week;
}

function evaluationWeeks(context: WeeklyRestAllocationContext): FixedLegalWeek[] {
  requireSafeInstant(context.asOfEpochMilliseconds, "asOf");
  if (context.historyStartEpochMilliseconds != null) requireSafeInstant(context.historyStartEpochMilliseconds, "historyStart");
  const weeks = unique(context.evaluationWeekIds).map(weekFromId).sort((left, right) => left.startEpochMilliseconds - right.startEpochMilliseconds);
  for (let index = 1; index < weeks.length; index += 1) {
    if (weeks[index - 1].endEpochMilliseconds !== weeks[index].startEpochMilliseconds) {
      throw new RangeError("evaluationWeekIds must describe one consecutive fixed-week horizon.");
    }
  }
  return weeks;
}

function classification(constraint: ComponentConstraint): WeeklyRestComponent["classification"] {
  return constraint.classification === "REGULAR_LENGTH" ? "REGULAR" : "REDUCED";
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function component(
  interval: RestInterval,
  option: WeeklyRestComponentOption,
  constraint: ComponentConstraint,
  componentIndex: number,
  startOffsetMilliseconds: number,
  durationMilliseconds: number,
  role: WeeklyRestComponent["role"],
): WeeklyRestComponent {
  if (interval.startEpochMilliseconds == null) throw new RangeError("A confirmed component requires an exact RestInterval start.");
  const endOffsetMilliseconds = startOffsetMilliseconds + durationMilliseconds;
  const reviewReasons = unique([...interval.reviewReasons, ...option.reviewReasons]);
  const reviewStatus = interval.reviewStatus === "REVIEW_REQUIRED" || option.reviewStatus === "REVIEW_REQUIRED"
    ? "REVIEW_REQUIRED"
    : "CLEAR";
  const identity = JSON.stringify([
    interval.restIntervalId,
    option.optionId,
    componentIndex,
    startOffsetMilliseconds,
    endOffsetMilliseconds,
    role,
  ]);
  return {
    componentId: `weekly-rest-component:${stableHash(identity)}`,
    restIntervalId: interval.restIntervalId,
    sourceOptionId: option.optionId,
    componentIndex,
    startEpochMilliseconds: interval.startEpochMilliseconds + startOffsetMilliseconds,
    endEpochMilliseconds: interval.startEpochMilliseconds + endOffsetMilliseconds,
    startOffsetMilliseconds,
    endOffsetMilliseconds,
    durationMilliseconds,
    classification: classification(constraint),
    role,
    provenance: interval.provenance,
    reviewStatus,
    reviewReasons,
    packageBounds: {
      minimumDurationMilliseconds: constraint.minimumDurationMilliseconds,
      maximumDurationMilliseconds: constraint.maximumDurationMilliseconds,
      startOffsetMinimumMilliseconds: Math.max(option.placementDomain?.startOffsetMinimumMilliseconds ?? 0, constraint.startOffsetMinimumMilliseconds),
      startOffsetMaximumMilliseconds: Math.min(option.placementDomain?.startOffsetMaximumMilliseconds ?? 0, constraint.startOffsetMaximumMilliseconds),
    },
  };
}

function assignment(componentValue: WeeklyRestComponent, week: FixedLegalWeek): FixedWeekAssignment {
  return {
    assignmentId: `fixed-week-assignment:${stableHash(`${componentValue.componentId}:${week.weekId}`)}`,
    fixedWeekId: week.weekId,
    componentId: componentValue.componentId,
    assignmentRole: "COUNTED_FOR_FIXED_WEEK",
    weekStartEpochMilliseconds: week.startEpochMilliseconds,
    weekEndEpochMilliseconds: week.endEpochMilliseconds,
  };
}

function singleDuration(constraint: ComponentConstraint): number {
  return constraint.actualDurationMilliseconds ?? constraint.minimumDurationMilliseconds;
}

function singlePlacementOffset(
  option: WeeklyRestComponentOption,
  constraint: ComponentConstraint,
  ownerWeekId: string | null,
  duration: number,
): number {
  const domainMinimum = Math.max(option.placementDomain?.startOffsetMinimumMilliseconds ?? 0, constraint.startOffsetMinimumMilliseconds);
  const domainMaximum = Math.min(option.placementDomain?.startOffsetMaximumMilliseconds ?? 0, constraint.startOffsetMaximumMilliseconds);
  if (!ownerWeekId) return domainMinimum;
  const overlap = option.fixedWeekOverlaps.find((item) => item.weekId === ownerWeekId);
  if (!overlap) return domainMinimum;
  const preferred = overlap.startOffsetMilliseconds;
  const latestOverlappingStart = Math.max(domainMinimum, overlap.endOffsetMilliseconds - Math.min(duration, overlap.endOffsetMilliseconds - overlap.startOffsetMilliseconds));
  return clamp(preferred, domainMinimum, Math.max(domainMinimum, Math.min(domainMaximum, Math.max(preferred, latestOverlappingStart))));
}

function singleChoice(
  interval: RestInterval,
  option: WeeklyRestComponentOption,
  role: WeeklyRestComponent["role"],
  owner: FixedLegalWeek | null,
): MaterializedChoice {
  const constraint = option.components[0];
  if (!constraint) throw new RangeError(`Single option has no component constraint: ${option.optionId}.`);
  const duration = singleDuration(constraint);
  const startOffset = singlePlacementOffset(option, constraint, owner?.weekId ?? null, duration);
  const value = component(interval, option, constraint, 0, startOffset, duration, role);
  return {
    choiceId: `choice:${option.optionId}:${role}:${owner?.weekId ?? "none"}`,
    components: [value],
    assignments: role === "COUNTED" && owner ? [assignment(value, owner)] : [],
    sourceOptionIds: [option.optionId],
    reviewStatus: value.reviewStatus,
    reviewReasons: [...value.reviewReasons],
  };
}

function compoundChoice(
  interval: RestInterval,
  option: WeeklyRestComponentOption,
  firstWeek: FixedLegalWeek,
  secondWeek: FixedLegalWeek,
): MaterializedChoice {
  const firstConstraint = option.components[0];
  const secondConstraint = option.components[1];
  if (!firstConstraint || !secondConstraint || interval.startEpochMilliseconds == null) {
    throw new RangeError(`Compound option is incomplete: ${option.optionId}.`);
  }
  const crossing = option.crossedFixedWeekBoundaries.find((item) =>
    item.weekBeforeId === firstWeek.weekId && item.weekAfterId === secondWeek.weekId
  );
  if (!crossing) throw new RangeError(`Compound option lacks the selected fixed-week crossing: ${option.optionId}.`);
  const firstDuration = firstConstraint.minimumDurationMilliseconds;
  const secondDuration = secondConstraint.minimumDurationMilliseconds;
  const total = firstDuration + secondDuration;
  const maximumStart = Math.max(0, (option.availableDurationMilliseconds ?? total) - total);
  const domainMinimum = option.placementDomain?.startOffsetMinimumMilliseconds ?? 0;
  const domainMaximum = Math.min(option.placementDomain?.startOffsetMaximumMilliseconds ?? maximumStart, maximumStart);
  const sequenceStart = clamp(crossing.offsetMilliseconds - firstDuration, domainMinimum, domainMaximum);
  const first = component(interval, option, firstConstraint, 0, sequenceStart, firstDuration, "COUNTED");
  const second = component(interval, option, secondConstraint, 1, sequenceStart + firstDuration, secondDuration, "COUNTED");
  return {
    choiceId: `choice:${option.optionId}:COUNTED:${firstWeek.weekId}:${secondWeek.weekId}`,
    components: [first, second],
    assignments: [assignment(first, firstWeek), assignment(second, secondWeek)],
    sourceOptionIds: [option.optionId],
    reviewStatus: first.reviewStatus === "REVIEW_REQUIRED" || second.reviewStatus === "REVIEW_REQUIRED" ? "REVIEW_REQUIRED" : "CLEAR",
    reviewReasons: unique([...first.reviewReasons, ...second.reviewReasons]),
  };
}

function choiceFingerprint(choice: MaterializedChoice): string {
  return JSON.stringify({
    components: choice.components.map((item) => [item.restIntervalId, item.sourceOptionId, item.componentIndex, item.startOffsetMilliseconds, item.endOffsetMilliseconds, item.role]),
    assignments: choice.assignments.map((item) => [item.componentId, item.fixedWeekId]),
    sourceOptionIds: choice.sourceOptionIds,
    reviewStatus: choice.reviewStatus,
    reviewReasons: choice.reviewReasons,
    ...(choice.continuationContextId == null ? {} : { continuationContextId: choice.continuationContextId }),
    ...(choice.continuationLineageId == null ? {} : { continuationLineageId: choice.continuationLineageId }),
    packageContinuations: choice.packageContinuations ?? [],
  });
}

function choicesForRest(
  interval: RestInterval,
  options: WeeklyRestComponentOption[],
  weeks: FixedLegalWeek[],
  issues: Phase4Issue[],
): MaterializedChoice[] {
  const weekMap = new Map(weeks.map((week) => [week.weekId, week]));
  const clearOptions = options.filter((option) => option.reviewStatus === "CLEAR" && option.pattern !== "REVIEW_ONLY");
  const representative = clearOptions.find((option) => option.pattern === "SINGLE_REGULAR")
    ?? clearOptions.find((option) => option.pattern === "SINGLE_REDUCED")
    ?? clearOptions[0];
  const choices: MaterializedChoice[] = [];

  if (representative && representative.components.length === 1) {
    choices.push(singleChoice(interval, representative, "ADDITIONAL", null));
  } else {
    const reviewReasons = unique([...interval.reviewReasons, ...options.flatMap((option) => option.reviewReasons)]);
    choices.push({
      choiceId: `choice:${interval.restIntervalId}:ADDITIONAL_REVIEW`,
      components: [],
      assignments: [],
      sourceOptionIds: unique(options.map((option) => option.optionId)),
      reviewStatus: "REVIEW_REQUIRED",
      reviewReasons: unique([...reviewReasons, "Unresolved Weekly Rest capability was not counted."]),
    });
  }

  for (const option of clearOptions) {
    if (option.components.length === 1) {
      const ownerIds = unique(option.fixedWeekOverlaps.map((item) => item.weekId)).filter((weekId) => weekMap.has(weekId));
      for (const ownerId of ownerIds) choices.push(singleChoice(interval, option, "COUNTED", weekMap.get(ownerId) as FixedLegalWeek));
      continue;
    }
    for (const pair of option.eligibleAdjacentWeekPairs) {
      const first = weekMap.get(pair.firstWeekId);
      const second = weekMap.get(pair.secondWeekId);
      if (first && second) choices.push(compoundChoice(interval, option, first, second));
    }
  }

  for (const option of options.filter((item) => item.reviewStatus === "REVIEW_REQUIRED" || item.pattern === "REVIEW_ONLY")) {
    issues.push(stableIssue("REVIEW_OPTION_NOT_COUNTED", [interval.restIntervalId, option.optionId], "A REVIEW_ONLY or uncertain option was preserved as unresolved and never counted."));
  }

  const deduplicated = new Map<string, MaterializedChoice>();
  for (const choice of choices.sort((left, right) => left.choiceId.localeCompare(right.choiceId))) {
    const fingerprint = choiceFingerprint(choice);
    if (!deduplicated.has(fingerprint)) deduplicated.set(fingerprint, choice);
  }
  return [...deduplicated.values()];
}

function rangesOverlap(left: WeeklyRestComponent, right: WeeklyRestComponent): boolean {
  return left.startEpochMilliseconds < right.endEpochMilliseconds && right.startEpochMilliseconds < left.endEpochMilliseconds;
}

function containsCountedOverlap(components: WeeklyRestComponent[]): boolean {
  const counted = components.filter((item) => item.role === "COUNTED").sort((left, right) => left.startEpochMilliseconds - right.startEpochMilliseconds || left.componentId.localeCompare(right.componentId));
  for (let index = 1; index < counted.length; index += 1) {
    if (rangesOverlap(counted[index - 1], counted[index])) return true;
  }
  return false;
}

function redundantCountedComponentIds(assignments: FixedWeekAssignment[]): string[] {
  const byWeek = new Map<string, string[]>();
  for (const item of assignments) {
    const values = byWeek.get(item.fixedWeekId) ?? [];
    values.push(item.componentId);
    byWeek.set(item.fixedWeekId, values);
  }
  return unique([...byWeek.values()].filter((values) => values.length > 1).flat());
}

export function allocationChoiceGenesis(): MaterializedChoice {
  return { choiceId: "choice:empty", components: [], assignments: [], sourceOptionIds: [], reviewStatus: "CLEAR", reviewReasons: [] };
}

/** Extends existing correlated legal choices with one bounded choice group. */
export function extendAllocationChoices(seeds: readonly MaterializedChoice[], group: readonly MaterializedChoice[], eliminated: Phase4Issue[] = []): MaterializedChoice[] {
  const next = new Map<string, MaterializedChoice>();
  for (const current of seeds) for (const addition of group) {
    const components = [...current.components, ...addition.components];
    if (containsCountedOverlap(components)) {
      eliminated.push(stableIssue("OVERLAPPING_WEEKLY_REST_MINIMUM", components.filter((item) => item.role === "COUNTED").map((item) => item.componentId), "A proposed branch was eliminated because counted Weekly Rest minimum ranges overlap."));
      continue;
    }
    const assignments = [...current.assignments, ...addition.assignments].sort((left, right) => left.fixedWeekId.localeCompare(right.fixedWeekId) || left.componentId.localeCompare(right.componentId));
    const redundant = redundantCountedComponentIds(assignments);
    if (redundant.length) {
      eliminated.push(stableIssue("REDUNDANT_COUNTED_COMPONENT", redundant, "A proposed branch was eliminated because one fixed week contained more than one counted Weekly Rest component."));
      continue;
    }
    const decision = {
      kind: "ALLOCATION_ADDITION",
      components: addition.components.map((item) => ({
        componentId: item.componentId, restIntervalId: item.restIntervalId,
        sourceOptionId: item.sourceOptionId, startEpochMilliseconds: item.startEpochMilliseconds,
        endEpochMilliseconds: item.endEpochMilliseconds, durationMilliseconds: item.durationMilliseconds,
        classification: item.classification, role: item.role,
      })),
      assignments: addition.assignments.map((item) => ({
        componentId: item.componentId, fixedWeekId: item.fixedWeekId, assignmentRole: item.assignmentRole,
      })),
      sourceOptionIds: addition.sourceOptionIds,
    };
    const hasStructuralAddition = decision.components.length > 0 || decision.assignments.length > 0 || decision.sourceOptionIds.length > 0;
    const parentLineage = current.continuationLineageId ?? "allocation-lineage:genesis";
    const continuationLineageId = hasStructuralAddition
      ? successorContinuationLineage(parentLineage, decision)
      : parentLineage;
    const combined: MaterializedChoice = { choiceId: `${current.choiceId}+${addition.choiceId}`, components: components.sort((left, right) => left.startEpochMilliseconds - right.startEpochMilliseconds || left.componentId.localeCompare(right.componentId)), assignments, sourceOptionIds: unique([...current.sourceOptionIds, ...addition.sourceOptionIds]), reviewStatus: current.reviewStatus === "REVIEW_REQUIRED" || addition.reviewStatus === "REVIEW_REQUIRED" ? "REVIEW_REQUIRED" : "CLEAR", reviewReasons: unique([...current.reviewReasons, ...addition.reviewReasons]), continuationContextId: current.continuationContextId, continuationLineageId, packageContinuations: rebasePackageContinuations(current.packageContinuations ?? [], continuationLineageId) };
    const fingerprint = choiceFingerprint(combined);
    if (!next.has(fingerprint)) next.set(fingerprint, combined);
  }
  return [...next.values()];
}

function combineChoices(groups: MaterializedChoice[][], eliminated: Phase4Issue[]): MaterializedChoice[] {
  let combinations: MaterializedChoice[] = [allocationChoiceGenesis()];
  for (const group of groups) combinations = extendAllocationChoices(combinations, group, eliminated);
  return combinations;
}

function twoWeekStatus(
  first: FixedLegalWeek,
  second: FixedLegalWeek,
  choice: MaterializedChoice,
  context: WeeklyRestAllocationContext,
): TwoWeekEvaluation {
  const componentMap = new Map(choice.components.map((item) => [item.componentId, item]));
  const countedRoles = choice.assignments
    .filter((item) => item.fixedWeekId === first.weekId || item.fixedWeekId === second.weekId)
    .map((item) => {
      const source = componentMap.get(item.componentId);
      if (!source) throw new RangeError(`Assignment references a missing component: ${item.componentId}.`);
      return { fixedWeekId: item.fixedWeekId, componentId: item.componentId, classification: source.classification };
    })
    .sort((left, right) => left.fixedWeekId.localeCompare(right.fixedWeekId) || left.componentId.localeCompare(right.componentId));
  let status: TwoWeekEvaluationStatus;
  const reviewReasons: string[] = [];
  if (context.historyStartEpochMilliseconds == null || context.historyStartEpochMilliseconds > first.startEpochMilliseconds) {
    status = "INSUFFICIENT_HISTORY";
    reviewReasons.push("The evaluation horizon does not establish complete history from the first fixed week boundary.");
  } else if (choice.reviewStatus === "REVIEW_REQUIRED") {
    status = "REVIEW";
    reviewReasons.push(...choice.reviewReasons);
  } else {
    const firstRoles = countedRoles.filter((item) => item.fixedWeekId === first.weekId);
    const secondRoles = countedRoles.filter((item) => item.fixedWeekId === second.weekId);
    const satisfies = firstRoles.length > 0
      && secondRoles.length > 0
      && [...firstRoles, ...secondRoles].some((item) => item.classification === "REGULAR");
    if (satisfies) status = "SATISFIED";
    else if (context.asOfEpochMilliseconds < second.endEpochMilliseconds) status = "PENDING";
    else if (context.factualCoverageCompleteThroughAsOf) status = "VIOLATED";
    else {
      status = "REVIEW";
      reviewReasons.push("The two-week window ended without complete factual coverage through asOf.");
    }
  }
  return {
    evaluationId: `two-week:${first.weekId}:${second.weekId}`,
    firstWeekId: first.weekId,
    secondWeekId: second.weekId,
    countedRoles,
    status,
    reviewReasons: unique(reviewReasons),
  };
}

function rollingQualifyingRests(
  choice: MaterializedChoice,
  intervalMap: ReadonlyMap<string, RestInterval>,
): RollingQualifyingWeeklyRest[] {
  const byInterval = new Map<string, WeeklyRestComponent[]>();
  for (const item of choice.components) {
    const values = byInterval.get(item.restIntervalId) ?? [];
    values.push(item);
    byInterval.set(item.restIntervalId, values);
  }
  return [...byInterval.entries()].map(([restIntervalId, components]) => {
    const interval = intervalMap.get(restIntervalId);
    if (!interval || interval.startEpochMilliseconds == null) {
      throw new RangeError(`A qualifying rolling Weekly Rest requires an exact source interval start: ${restIntervalId}.`);
    }
    const ordered = components.sort((left, right) => left.componentIndex - right.componentIndex || left.componentId.localeCompare(right.componentId));
    const reviewStatus: ReviewStatus = interval.reviewStatus === "REVIEW_REQUIRED" || ordered.some((item) => item.reviewStatus === "REVIEW_REQUIRED")
      ? "REVIEW_REQUIRED"
      : "CLEAR";
    return {
      rollingRestId: `rolling-weekly-rest:${restIntervalId}`,
      restIntervalId,
      sourceComponentIds: unique(ordered.map((item) => item.componentId)),
      qualification: "QUALIFYING_WEEKLY_REST" as const,
      startEpochMilliseconds: interval.startEpochMilliseconds,
      completeRestIntervalEndEpochMilliseconds: interval.state === "CLOSED" ? interval.endEpochMilliseconds : null,
      reviewStatus,
      reviewReasons: unique([...interval.reviewReasons, ...ordered.flatMap((item) => item.reviewReasons)]),
    };
  }).sort((left, right) => left.startEpochMilliseconds - right.startEpochMilliseconds || left.rollingRestId.localeCompare(right.rollingRestId));
}

function transition(
  previousComponentId: string,
  previousRestIntervalId: string | null,
  previousEnd: number,
  next: RollingQualifyingWeeklyRest,
  forceReview: boolean,
  reviewReasons: string[],
): RollingCycleReset {
  const due = addElapsedHours(previousEnd, WEEKLY_REST_CYCLE_HOURS);
  let status: RollingCycleStatus;
  if (forceReview || next.reviewStatus === "REVIEW_REQUIRED") status = "REVIEW";
  else if (next.startEpochMilliseconds < due) status = "BEFORE_DUE";
  else if (next.startEpochMilliseconds === due) status = "EXACTLY_DUE";
  else status = "AFTER_DUE";
  const nextComponentId = next.sourceComponentIds[0] ?? null;
  return {
    evaluationId: `rolling:${previousComponentId}:${next.rollingRestId}`,
    previousComponentId,
    nextComponentId,
    previousRestIntervalId,
    nextRestIntervalId: next.restIntervalId,
    previousQualifyingEndEpochMilliseconds: previousEnd,
    nextQualifyingStartEpochMilliseconds: next.startEpochMilliseconds,
    dueEpochMilliseconds: due,
    exactElapsedMilliseconds: next.startEpochMilliseconds - previousEnd,
    status,
    reviewReasons: status === "REVIEW" ? unique(reviewReasons) : [],
  };
}

function terminalCycle(
  rollingRest: RollingQualifyingWeeklyRest,
  choice: MaterializedChoice,
  context: WeeklyRestAllocationContext,
): RollingCycleReset {
  const componentId = rollingRest.sourceComponentIds[0] ?? null;
  const completeEnd = rollingRest.completeRestIntervalEndEpochMilliseconds;
  const due = completeEnd == null ? null : addElapsedHours(completeEnd, WEEKLY_REST_CYCLE_HOURS);
  let status: RollingCycleStatus;
  const reviewReasons: string[] = [];
  if (choice.reviewStatus === "REVIEW_REQUIRED" || rollingRest.reviewStatus === "REVIEW_REQUIRED") {
    status = "REVIEW";
    reviewReasons.push(...choice.reviewReasons, ...rollingRest.reviewReasons);
  } else if (due == null) {
    status = "PENDING";
  } else if (context.asOfEpochMilliseconds <= due) {
    status = "PENDING";
  } else if (context.factualCoverageCompleteThroughAsOf) {
    status = "AFTER_DUE";
  } else {
    status = "REVIEW";
    reviewReasons.push("The 144h due instant passed without complete factual coverage through asOf.");
  }
  return {
    evaluationId: `rolling:${rollingRest.rollingRestId}:open`,
    previousComponentId: componentId,
    nextComponentId: null,
    previousRestIntervalId: rollingRest.restIntervalId,
    nextRestIntervalId: null,
    previousQualifyingEndEpochMilliseconds: completeEnd,
    nextQualifyingStartEpochMilliseconds: null,
    dueEpochMilliseconds: due,
    exactElapsedMilliseconds: null,
    status,
    reviewReasons: unique(reviewReasons),
  };
}

function rollingCycles(
  rollingRests: RollingQualifyingWeeklyRest[],
  choice: MaterializedChoice,
  context: WeeklyRestAllocationContext,
): RollingCycleReset[] {
  const cycles: RollingCycleReset[] = [];
  const prior = context.priorQualifyingWeeklyRest;
  if (!prior) {
    cycles.push({
      evaluationId: `rolling:history:${rollingRests[0]?.rollingRestId ?? "none"}`,
      previousComponentId: null,
      nextComponentId: rollingRests[0]?.sourceComponentIds[0] ?? null,
      previousRestIntervalId: null,
      nextRestIntervalId: rollingRests[0]?.restIntervalId ?? null,
      previousQualifyingEndEpochMilliseconds: null,
      nextQualifyingStartEpochMilliseconds: rollingRests[0]?.startEpochMilliseconds ?? null,
      dueEpochMilliseconds: null,
      exactElapsedMilliseconds: null,
      status: "INSUFFICIENT_HISTORY",
      reviewReasons: ["No previous qualifying Weekly Rest was supplied before the evaluation horizon."],
    });
  } else if (rollingRests[0]) {
    cycles.push(transition(
      prior.componentId,
      prior.restIntervalId ?? null,
      prior.endEpochMilliseconds,
      rollingRests[0],
      prior.reviewStatus === "REVIEW_REQUIRED" || choice.reviewStatus === "REVIEW_REQUIRED",
      unique([...(prior.reviewReasons ?? []), ...choice.reviewReasons]),
    ));
  } else {
    const due = addElapsedHours(prior.endEpochMilliseconds, WEEKLY_REST_CYCLE_HOURS);
    const status: RollingCycleStatus = prior.reviewStatus === "REVIEW_REQUIRED" || choice.reviewStatus === "REVIEW_REQUIRED"
      ? "REVIEW"
      : context.asOfEpochMilliseconds <= due
        ? "PENDING"
        : context.factualCoverageCompleteThroughAsOf
          ? "AFTER_DUE"
          : "REVIEW";
    cycles.push({
      evaluationId: `rolling:${prior.componentId}:open`,
      previousComponentId: prior.componentId,
      nextComponentId: null,
      previousRestIntervalId: prior.restIntervalId ?? null,
      nextRestIntervalId: null,
      previousQualifyingEndEpochMilliseconds: prior.endEpochMilliseconds,
      nextQualifyingStartEpochMilliseconds: null,
      dueEpochMilliseconds: due,
      exactElapsedMilliseconds: null,
      status,
      reviewReasons: status === "REVIEW"
        ? unique([...(prior.reviewReasons ?? []), ...choice.reviewReasons, "The open 144h evaluation remains uncertain."])
        : [],
    });
  }
  for (let index = 1; index < rollingRests.length; index += 1) {
    const previous = rollingRests[index - 1];
    const next = rollingRests[index];
    const previousComponentId = previous.sourceComponentIds[0] ?? previous.rollingRestId;
    const previousEnd = previous.completeRestIntervalEndEpochMilliseconds;
    if (previousEnd == null) {
      cycles.push({
        evaluationId: `rolling:${previous.rollingRestId}:${next.rollingRestId}:unresolved-end`,
        previousComponentId,
        nextComponentId: next.sourceComponentIds[0] ?? null,
        previousRestIntervalId: previous.restIntervalId,
        nextRestIntervalId: next.restIntervalId,
        previousQualifyingEndEpochMilliseconds: null,
        nextQualifyingStartEpochMilliseconds: next.startEpochMilliseconds,
        dueEpochMilliseconds: null,
        exactElapsedMilliseconds: null,
        status: "REVIEW",
        reviewReasons: ["The previous qualifying Weekly RestInterval has no complete factual end."],
      });
      continue;
    }
    cycles.push(transition(
      previousComponentId,
      previous.restIntervalId,
      previousEnd,
      next,
      choice.reviewStatus === "REVIEW_REQUIRED",
      choice.reviewReasons,
    ));
  }
  if (rollingRests.length) cycles.push(terminalCycle(rollingRests[rollingRests.length - 1], choice, context));
  return cycles;
}

function legalState(twoWeek: TwoWeekEvaluation[], rolling: RollingCycleReset[]): { state: AllocationBranchLegalState; invalidReasons: string[] } {
  const invalidReasons: string[] = [];
  for (const item of twoWeek.filter((entry) => entry.status === "VIOLATED")) invalidReasons.push(`Two-week minimum violated for ${item.firstWeekId}/${item.secondWeekId}.`);
  for (const item of rolling.filter((entry) => entry.status === "AFTER_DUE")) invalidReasons.push(`144h condition violated at ${item.dueEpochMilliseconds}.`);
  if (invalidReasons.length) return { state: "VIOLATED", invalidReasons: unique(invalidReasons) };
  if (twoWeek.some((item) => item.status === "REVIEW" || item.status === "INSUFFICIENT_HISTORY")
    || rolling.some((item) => item.status === "REVIEW" || item.status === "INSUFFICIENT_HISTORY")) {
    return { state: "REVIEW", invalidReasons: [] };
  }
  if (twoWeek.some((item) => item.status === "PENDING") || rolling.some((item) => item.status === "PENDING")) {
    return { state: "PENDING", invalidReasons: [] };
  }
  return { state: "COMPLIANT", invalidReasons: [] };
}

function branchFingerprint(choice: MaterializedChoice, twoWeek: TwoWeekEvaluation[], rolling: RollingCycleReset[]): string {
  // This is an identity of the current materialized state, never a textual
  // history of predecessor branches.  A successor may have new state, but its
  // fingerprint must remain fixed-size across checkpoint generations.
  return boundedContinuationFingerprint({
    components: choice.components.map((item) => ({
      componentId: item.componentId, restIntervalId: item.restIntervalId,
      sourceOptionId: item.sourceOptionId, startEpochMilliseconds: item.startEpochMilliseconds,
      endEpochMilliseconds: item.endEpochMilliseconds, durationMilliseconds: item.durationMilliseconds,
      classification: item.classification, role: item.role,
    })),
    assignments: choice.assignments.map((item) => ({
      assignmentId: item.assignmentId, componentId: item.componentId,
      fixedWeekId: item.fixedWeekId, assignmentRole: item.assignmentRole,
    })),
    sourceOptionIds: choice.sourceOptionIds,
    continuationLineageId: choice.continuationLineageId,
    packageContinuations: choice.packageContinuations,
    reviewStatus: choice.reviewStatus,
    reviewReasons: choice.reviewReasons,
    twoWeek: twoWeek.map((item) => ({
      firstWeekId: item.firstWeekId, secondWeekId: item.secondWeekId,
      status: item.status, countedRoles: item.countedRoles, reviewReasons: item.reviewReasons,
    })),
    rolling: rolling.map((item) => ({
      previousComponentId: item.previousComponentId,
      previousRestIntervalId: item.previousRestIntervalId,
      previousQualifyingEndEpochMilliseconds: item.previousQualifyingEndEpochMilliseconds,
      nextComponentId: item.nextComponentId, nextRestIntervalId: item.nextRestIntervalId,
      nextQualifyingStartEpochMilliseconds: item.nextQualifyingStartEpochMilliseconds,
      dueEpochMilliseconds: item.dueEpochMilliseconds, exactElapsedMilliseconds: item.exactElapsedMilliseconds,
      status: item.status, reviewReasons: item.reviewReasons,
    })),
  }, "allocation-branch");
}

export type PreparedAllocationChoiceGroups = {
  weeks: FixedLegalWeek[];
  intervalMap: ReadonlyMap<string, RestInterval>;
  choiceGroups: MaterializedChoice[][];
  issues: Phase4Issue[];
  eliminated: Phase4Issue[];
};

/** Shared factual preparation used by one-shot and segmented allocation paths. */
export function prepareAllocationChoiceGroups(intervals: readonly RestInterval[], options: readonly WeeklyRestComponentOption[], context: WeeklyRestAllocationContext): PreparedAllocationChoiceGroups {
  const weeks = evaluationWeeks(context);
  const intervalMap = new Map(intervals.map((interval) => [interval.restIntervalId, interval]));
  const issues: Phase4Issue[] = [];
  const eliminated: Phase4Issue[] = [];
  const uniqueOptions = new Map<string, WeeklyRestComponentOption>();
  for (const option of [...options].sort((left, right) => left.optionId.localeCompare(right.optionId))) {
    const optionKey = JSON.stringify(option);
    if (!uniqueOptions.has(optionKey)) uniqueOptions.set(optionKey, option);
  }
  const grouped = new Map<string, WeeklyRestComponentOption[]>();
  for (const option of uniqueOptions.values()) {
    if (!intervalMap.has(option.restIntervalId)) { issues.push(stableIssue("MISSING_SOURCE_INTERVAL", [option.optionId, option.restIntervalId], "A Phase 3 option references a missing RestInterval.")); continue; }
    grouped.set(option.restIntervalId, [...(grouped.get(option.restIntervalId) ?? []), option]);
  }
  return { weeks, intervalMap, choiceGroups: [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([restIntervalId, group]) => choicesForRest(intervalMap.get(restIntervalId) as RestInterval, group, weeks, issues)), issues, eliminated };
}

export type AllocationSolverContinuationContext = {
  /** Canonical frontier alternative identity; kept per alternative so legal lineages never merge. */
  alternativeId: string;
  /** Only the preceding fixed week is needed to evaluate the first suffix two-week pair. */
  trailingFixedWeek: FixedLegalWeek | null;
  /** Last qualifying rest before the suffix, including its independent REVIEW evidence. */
  rollingAnchor: WeeklyRestAllocationContext["priorQualifyingWeeklyRest"];
  /** Exact retained edge when a factual RestInterval crosses the split; no synthetic interval is permitted. */
  factualBoundaryRestInterval: RestInterval | null;
  reviewStatus: ReviewStatus;
  reviewReasons: readonly string[];
};

export type AllocationMaterializationMode =
  | { kind: "GENESIS" }
  | { kind: "SEEDED"; continuationContexts: ReadonlyMap<string, AllocationSolverContinuationContext> };

function continuationFor(choice: MaterializedChoice, mode: AllocationMaterializationMode): AllocationSolverContinuationContext | null {
  if (mode.kind !== "SEEDED" || !choice.continuationContextId) return null;
  return mode.continuationContexts.get(choice.continuationContextId) ?? null;
}

/** Shared materialization retains the existing two-week, rolling and legal-state semantics. */
export function materializeAllocationBranches(choices: readonly MaterializedChoice[], prepared: PreparedAllocationChoiceGroups, context: WeeklyRestAllocationContext, mode: AllocationMaterializationMode = { kind: "GENESIS" }): SolveWeeklyRestAllocationsResult {
  const branches = new Map<string, AllocationBranch>();
  for (const choice of choices) {
    const continuation = continuationFor(choice, mode);
    const evaluationWeeksForChoice = continuation?.trailingFixedWeek && continuation.trailingFixedWeek.weekId !== prepared.weeks[0]?.weekId
      ? [continuation.trailingFixedWeek, ...prepared.weeks]
      : prepared.weeks;
    const twoWeek: TwoWeekEvaluation[] = [];
    for (let index = 1; index < evaluationWeeksForChoice.length; index += 1) twoWeek.push(twoWeekStatus(evaluationWeeksForChoice[index - 1], evaluationWeeksForChoice[index], choice, context));
    // Historical components remain in the frontier for correlation, but only suffix intervals are rematerialized for rolling checks.
    const rollingChoice = continuation ? { ...choice, components: choice.components.filter((item) => prepared.intervalMap.has(item.restIntervalId)) } : choice;
    const qualifyingRests = rollingQualifyingRests(rollingChoice, prepared.intervalMap);
    const continuationContext: WeeklyRestAllocationContext = continuation ? {
      ...context,
      priorQualifyingWeeklyRest: continuation.rollingAnchor ?? context.priorQualifyingWeeklyRest,
    } : context;
    const rolling = rollingCycles(qualifyingRests, rollingChoice, continuationContext);
    const state = legalState(twoWeek, rolling);
    const evaluationReviewReasons = unique([...twoWeek.flatMap((item) => item.reviewReasons), ...rolling.flatMap((item) => item.reviewReasons)]);
    const evaluationRequiresReview = twoWeek.some((item) => item.status === "REVIEW" || item.status === "INSUFFICIENT_HISTORY") || rolling.some((item) => item.status === "REVIEW" || item.status === "INSUFFICIENT_HISTORY");
    const reviewStatus = choice.reviewStatus === "REVIEW_REQUIRED" || evaluationRequiresReview ? "REVIEW_REQUIRED" : "CLEAR";
    const reviewReasons = unique([...choice.reviewReasons, ...evaluationReviewReasons]);
    const provisional: AllocationBranch = { branchId: "allocation-branch:pending", branchFingerprint: "allocation-branch:pending", components: choice.components, fixedWeekAssignments: choice.assignments, additionalComponents: choice.components.filter((item) => item.role === "ADDITIONAL"), rollingQualifyingRests: qualifyingRests, rollingCycleResets: rolling, twoWeekEvaluations: twoWeek, reviewStatus, reviewReasons, legalState: state.state, invalidReasons: state.invalidReasons, sourceOptionIds: choice.sourceOptionIds, continuationLineageId: choice.continuationLineageId, packageContinuations: choice.packageContinuations };
    const projected = allocationFrontierAlternative(provisional);
    const continuationLineageId = continuationLineageForCurrentState(choice.continuationLineageId ?? "allocation-lineage:genesis", projected);
    const fingerprint = branchFingerprint({ ...choice, continuationLineageId }, twoWeek, rolling);
    const branch: AllocationBranch = { ...provisional, branchId: `allocation-branch:${stableHash(fingerprint)}`, branchFingerprint: fingerprint, continuationLineageId, packageContinuations: rebasePackageContinuations(choice.packageContinuations ?? [], continuationLineageId) };
    if (!branches.has(fingerprint)) branches.set(fingerprint, branch);
  }
  return { branches: [...branches.values()].sort((left, right) => left.branchId.localeCompare(right.branchId)), eliminatedBranchesOrDiagnostics: [...new Map(prepared.eliminated.map((item) => [item.issueId, item])).values()].sort((left, right) => left.issueId.localeCompare(right.issueId)), issues: [...new Map(prepared.issues.map((item) => [item.issueId, item])).values()].sort((left, right) => left.issueId.localeCompare(right.issueId)) };
}

/** Real segmented allocation path: the same prepared factual groups are extended from genesis sequentially. */
export function solveSegmentedWeeklyRestAllocations(intervals: readonly RestInterval[], options: readonly WeeklyRestComponentOption[], context: WeeklyRestAllocationContext): SolveWeeklyRestAllocationsResult {
  const prepared = prepareAllocationChoiceGroups(intervals, options, context);
  let seeds: MaterializedChoice[] = [allocationChoiceGenesis()];
  for (const group of prepared.choiceGroups) seeds = extendAllocationChoices(seeds, group, prepared.eliminated);
  return materializeAllocationBranches(seeds, prepared, context);
}

/** One-shot orchestration retained as the differential-test oracle. */
export function solveOneShotWeeklyRestAllocations(intervals: readonly RestInterval[], options: readonly WeeklyRestComponentOption[], context: WeeklyRestAllocationContext): SolveWeeklyRestAllocationsResult {
  const prepared = prepareAllocationChoiceGroups(intervals, options, context);
  const choices = combineChoices(prepared.choiceGroups, prepared.eliminated);
  return materializeAllocationBranches(choices, prepared, context);
}

export function solveWeeklyRestAllocations(intervals: readonly RestInterval[], options: readonly WeeklyRestComponentOption[], context: WeeklyRestAllocationContext): SolveWeeklyRestAllocationsResult {
  return solveOneShotWeeklyRestAllocations(intervals, options, context);
}

export type SeededAllocationDiagnostics = {
  genesisEntered: false;
  historicalChoiceGroupsReplayed: 0;
  historicalFixedWeeksReconstructed: 0;
  historicalRollingCyclesRecomputed: 0;
  suffixChoiceGroupsProcessed: number;
  startingFrontierAlternatives: number;
  endingFrontierAlternatives: number;
  finalizedHistoricalItemsRecreatedLive: 0;
};

export function frontierToMaterializedChoice(alternative: import("./allocation-frontier.ts").AllocationFrontierAlternative, continuationContextId: string = alternative.alternativeId): MaterializedChoice {
  return {
    choiceId: `seed:${alternative.alternativeId}`,
    continuationContextId,
    continuationLineageId: alternative.continuationLineageId,
    packageContinuations: [...alternative.packageContinuations],
    components: [...alternative.countedComponents, ...alternative.additionalComponents],
    assignments: [...alternative.assignments],
    sourceOptionIds: [...alternative.sourceOptionIds],
    reviewStatus: alternative.reviewStatus,
    reviewReasons: [...alternative.reviewReasons],
  };
}

export function allocationSolverContinuationContext(
  alternative: import("./allocation-frontier.ts").AllocationFrontierAlternative,
  boundaryRestInterval: RestInterval | null = null,
): AllocationSolverContinuationContext {
  const latestAssignment = [...alternative.assignments].sort((left, right) => right.weekStartEpochMilliseconds - left.weekStartEpochMilliseconds || right.fixedWeekId.localeCompare(left.fixedWeekId))[0] ?? null;
  const trailingFixedWeek = latestAssignment ? fixedLegalWeekForInstant(latestAssignment.weekStartEpochMilliseconds) : null;
  return {
    alternativeId: alternative.alternativeId,
    trailingFixedWeek,
    rollingAnchor: alternative.rollingAnchor == null || alternative.rollingAnchor.endEpochMilliseconds == null ? undefined : {
      componentId: alternative.rollingAnchor.componentId,
      restIntervalId: alternative.rollingAnchor.restIntervalId ?? undefined,
      endEpochMilliseconds: alternative.rollingAnchor.endEpochMilliseconds,
      reviewStatus: alternative.reviewStatus,
      reviewReasons: [...alternative.reviewReasons],
    },
    factualBoundaryRestInterval: boundaryRestInterval,
    reviewStatus: alternative.reviewStatus,
    reviewReasons: [...alternative.reviewReasons],
  };
}

/** Real seeded entry point: only supplied suffix groups are extended; finalized history stays represented by frontier contexts. */
export function solveSegmentedWeeklyRestAllocationsFromSeed(
  seed: import("./allocation-frontier.ts").AllocationContinuationSeed,
  intervals: readonly RestInterval[],
  options: readonly WeeklyRestComponentOption[],
  context: WeeklyRestAllocationContext,
  continuationContexts: readonly AllocationSolverContinuationContext[] = seed.alternatives.map((alternative) => allocationSolverContinuationContext(alternative)),
): { result: SolveWeeklyRestAllocationsResult; diagnostics: SeededAllocationDiagnostics } {
  // A split-crossing factual interval is the only historical interval admitted into suffix preparation.
  // It remains exact (original start/end and evidence), is never truncated at the checkpoint, and is deduplicated by ID.
  const boundaryIntervals = continuationContexts
    .map((item) => item.factualBoundaryRestInterval)
    .filter((item): item is RestInterval => item != null && !intervals.some((interval) => interval.restIntervalId === item.restIntervalId));
  const effectiveIntervals = [...boundaryIntervals, ...intervals];
  const boundaryOptions = boundaryIntervals.flatMap((interval) => generateWeeklyRestComponentOptions([interval]).options);
  const prepared = prepareAllocationChoiceGroups(effectiveIntervals, [...boundaryOptions, ...options], context);
  // This local key is transport-only for one seeded transition.  Persisting the
  // complete prior alternativeId inside its successor fingerprint would make
  // identities recursively grow after every reload/append cycle.
  const localContextId = (index: number) => `seed-context:${index}`;
  const byAlternative = new Map(continuationContexts.map((item, index) => [localContextId(index), { ...item, alternativeId: localContextId(index) }]));
  let choices = seed.alternatives.map((alternative, index) => frontierToMaterializedChoice(alternative, localContextId(index)));
  for (const group of prepared.choiceGroups) choices = extendAllocationChoices(choices, group, prepared.eliminated);
  const result = materializeAllocationBranches(choices, prepared, context, { kind: "SEEDED", continuationContexts: byAlternative });
  return { result, diagnostics: {
    genesisEntered: false,
    historicalChoiceGroupsReplayed: 0,
    historicalFixedWeeksReconstructed: 0,
    historicalRollingCyclesRecomputed: 0,
    suffixChoiceGroupsProcessed: prepared.choiceGroups.length,
    startingFrontierAlternatives: seed.alternatives.length,
    endingFrontierAlternatives: result.branches.length,
    finalizedHistoricalItemsRecreatedLive: 0,
  } };
}
