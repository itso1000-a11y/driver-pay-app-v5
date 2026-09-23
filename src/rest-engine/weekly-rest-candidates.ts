import {
  type ChronologyIssue,
  type ComponentConstraint,
  type FixedWeekBoundaryCrossing,
  type FixedWeekOverlap,
  type RestInterval,
  type WeeklyRestComponentOption,
  type WeeklyRestOptionPattern,
} from "./types.ts";
import { fixedLegalWeekForInstant } from "./time.ts";
import { factInternal } from "./facts.ts";

export const REDUCED_WEEKLY_REST_MINIMUM_MILLISECONDS = 24 * 60 * 60 * 1000;
export const REGULAR_WEEKLY_REST_MINIMUM_MILLISECONDS = 45 * 60 * 60 * 1000;
export const REDUCED_WEEKLY_REST_MAXIMUM_MILLISECONDS = REGULAR_WEEKLY_REST_MINIMUM_MILLISECONDS - 1;
export const BACK_TO_BACK_REGULAR_REDUCED_MINIMUM_MILLISECONDS = 69 * 60 * 60 * 1000;
export const BACK_TO_BACK_REGULAR_REGULAR_MINIMUM_MILLISECONDS = 90 * 60 * 60 * 1000;

export type GenerateWeeklyRestComponentOptionsResult = {
  options: WeeklyRestComponentOption[];
  issues: ChronologyIssue[];
};

function effectiveEnd(interval: RestInterval): number | null {
  return interval.endEpochMilliseconds ?? interval.observedThroughEpochMilliseconds;
}

function fixedWeekMetadata(interval: RestInterval): {
  crossings: FixedWeekBoundaryCrossing[];
  overlaps: FixedWeekOverlap[];
  pairs: Array<{ firstWeekId: string; secondWeekId: string }>;
} {
  const start = interval.startEpochMilliseconds;
  const end = effectiveEnd(interval);
  if (start == null || end == null || end <= start) return { crossings: [], overlaps: [], pairs: [] };
  const crossings: FixedWeekBoundaryCrossing[] = [];
  const overlaps: FixedWeekOverlap[] = [];
  let week = fixedLegalWeekForInstant(start);
  let guard = 0;
  while (week.startEpochMilliseconds < end) {
    const overlapStart = Math.max(start, week.startEpochMilliseconds);
    const overlapEnd = Math.min(end, week.endEpochMilliseconds);
    if (overlapEnd > overlapStart) {
      overlaps.push({
        weekId: week.weekId,
        startOffsetMilliseconds: overlapStart - start,
        endOffsetMilliseconds: overlapEnd - start,
      });
    }
    if (week.endEpochMilliseconds > start && week.endEpochMilliseconds < end) {
      const after = fixedLegalWeekForInstant(week.endEpochMilliseconds);
      crossings.push({
        boundaryEpochMilliseconds: week.endEpochMilliseconds,
        offsetMilliseconds: week.endEpochMilliseconds - start,
        weekBeforeId: week.weekId,
        weekAfterId: after.weekId,
      });
      week = after;
    } else {
      break;
    }
    guard += 1;
    if (guard > 10_000) throw new RangeError("Fixed-week metadata exceeded its deterministic safety bound.");
  }
  return {
    crossings,
    overlaps,
    pairs: crossings.map((crossing) => ({ firstWeekId: crossing.weekBeforeId, secondWeekId: crossing.weekAfterId })),
  };
}

function constraint(
  classification: ComponentConstraint["classification"],
  minimum: number,
  maximum: number,
  actual: number | null = null,
  startOffsetMinimum = 0,
  startOffsetMaximum = 0,
): ComponentConstraint {
  return {
    classification,
    minimumDurationMilliseconds: minimum,
    maximumDurationMilliseconds: maximum,
    actualDurationMilliseconds: actual,
    startOffsetMinimumMilliseconds: startOffsetMinimum,
    startOffsetMaximumMilliseconds: startOffsetMaximum,
  };
}

function option(
  interval: RestInterval,
  pattern: WeeklyRestOptionPattern,
  components: ComponentConstraint[],
  totalMinimum: number,
  duration: number,
  componentsMustBeAdjacent: boolean,
  distinctFixedWeeksRequired: boolean,
  metadata: ReturnType<typeof fixedWeekMetadata>,
): WeeklyRestComponentOption {
  const slack = Math.max(0, duration - totalMinimum);
  return {
    optionId: `weekly-rest-option:${interval.restIntervalId}:${pattern}`,
    restIntervalId: interval.restIntervalId,
    pattern,
    components,
    totalMinimumDurationMilliseconds: totalMinimum,
    availableDurationMilliseconds: duration,
    placementDomain: {
      coordinateSystem: "REST_INTERVAL_HALF_OPEN",
      startOffsetMinimumMilliseconds: 0,
      startOffsetMaximumMilliseconds: slack,
      mustBeContiguous: true,
      componentsMustBeAdjacent,
      distinctFixedWeeksRequired,
      unallocatedCapacityMilliseconds: slack,
    },
    crossedFixedWeekBoundaries: metadata.crossings,
    fixedWeekOverlaps: metadata.overlaps,
    eligibleAdjacentWeekPairs: distinctFixedWeeksRequired ? metadata.pairs : [],
    capacity: {
      maximumRegularComponents: Math.floor(duration / REGULAR_WEEKLY_REST_MINIMUM_MILLISECONDS),
      maximumMinimumRestComponents: Math.floor(duration / REDUCED_WEEKLY_REST_MINIMUM_MILLISECONDS),
    },
    reviewStatus: "CLEAR",
    reviewReasons: [],
  };
}

function reviewOnlyOption(interval: RestInterval, metadata: ReturnType<typeof fixedWeekMetadata>): WeeklyRestComponentOption {
  const maximum = interval.elapsedRangeMilliseconds?.maximum ?? interval.elapsedMilliseconds;
  return {
    optionId: `weekly-rest-option:${interval.restIntervalId}:REVIEW_ONLY`,
    restIntervalId: interval.restIntervalId,
    pattern: "REVIEW_ONLY",
    components: [],
    totalMinimumDurationMilliseconds: 0,
    availableDurationMilliseconds: maximum,
    placementDomain: null,
    crossedFixedWeekBoundaries: metadata.crossings,
    fixedWeekOverlaps: metadata.overlaps,
    eligibleAdjacentWeekPairs: [],
    capacity: maximum == null ? null : {
      maximumRegularComponents: Math.floor(maximum / REGULAR_WEEKLY_REST_MINIMUM_MILLISECONDS),
      maximumMinimumRestComponents: Math.floor(maximum / REDUCED_WEEKLY_REST_MINIMUM_MILLISECONDS),
    },
    reviewStatus: "REVIEW_REQUIRED",
    reviewReasons: [...new Set([...interval.reviewReasons, "Uncertain RestInterval cannot become a confirmed legal candidate."])].sort(),
  };
}

export function generateWeeklyRestComponentOptions(
  intervals: readonly RestInterval[],
): GenerateWeeklyRestComponentOptionsResult {
  const options: WeeklyRestComponentOption[] = [];
  const issues: ChronologyIssue[] = [];
  for (const interval of [...intervals].sort((left, right) => left.restIntervalId.localeCompare(right.restIntervalId))) {
    const metadata = fixedWeekMetadata(interval);
    if (interval.reviewStatus === "REVIEW_REQUIRED" || interval.elapsedMilliseconds == null) {
      options.push(reviewOnlyOption(interval, metadata));
      issues.push(factInternal.stableIssue(
        "REVIEW_PROPAGATED",
        interval.supportingFactIds,
        "RestInterval REVIEW state was propagated to a non-allocatable Weekly Rest option.",
        interval.startEpochMilliseconds,
        effectiveEnd(interval),
      ));
      continue;
    }

    const duration = interval.elapsedMilliseconds;
    if (duration < REDUCED_WEEKLY_REST_MINIMUM_MILLISECONDS) continue;
    if (duration < REGULAR_WEEKLY_REST_MINIMUM_MILLISECONDS) {
      options.push(option(
        interval,
        "SINGLE_REDUCED",
        [constraint("REDUCED_LENGTH", duration, duration, duration)],
        duration,
        duration,
        false,
        false,
        metadata,
      ));
      continue;
    }

    options.push(option(
      interval,
      "SINGLE_REGULAR",
      [constraint("REGULAR_LENGTH", REGULAR_WEEKLY_REST_MINIMUM_MILLISECONDS, duration, null, 0, duration - REGULAR_WEEKLY_REST_MINIMUM_MILLISECONDS)],
      REGULAR_WEEKLY_REST_MINIMUM_MILLISECONDS,
      duration,
      false,
      false,
      metadata,
    ));

    if (duration >= BACK_TO_BACK_REGULAR_REDUCED_MINIMUM_MILLISECONDS && metadata.crossings.length) {
      options.push(option(
        interval,
        "REGULAR_THEN_REDUCED",
        [
          constraint("REGULAR_LENGTH", REGULAR_WEEKLY_REST_MINIMUM_MILLISECONDS, duration - REDUCED_WEEKLY_REST_MINIMUM_MILLISECONDS, null, 0, duration - BACK_TO_BACK_REGULAR_REDUCED_MINIMUM_MILLISECONDS),
          constraint("REDUCED_LENGTH", REDUCED_WEEKLY_REST_MINIMUM_MILLISECONDS, Math.min(REDUCED_WEEKLY_REST_MAXIMUM_MILLISECONDS, duration - REGULAR_WEEKLY_REST_MINIMUM_MILLISECONDS), null, REGULAR_WEEKLY_REST_MINIMUM_MILLISECONDS, duration - REDUCED_WEEKLY_REST_MINIMUM_MILLISECONDS),
        ],
        BACK_TO_BACK_REGULAR_REDUCED_MINIMUM_MILLISECONDS,
        duration,
        true,
        true,
        metadata,
      ));
      options.push(option(
        interval,
        "REDUCED_THEN_REGULAR",
        [
          constraint("REDUCED_LENGTH", REDUCED_WEEKLY_REST_MINIMUM_MILLISECONDS, Math.min(REDUCED_WEEKLY_REST_MAXIMUM_MILLISECONDS, duration - REGULAR_WEEKLY_REST_MINIMUM_MILLISECONDS), null, 0, duration - BACK_TO_BACK_REGULAR_REDUCED_MINIMUM_MILLISECONDS),
          constraint("REGULAR_LENGTH", REGULAR_WEEKLY_REST_MINIMUM_MILLISECONDS, duration - REDUCED_WEEKLY_REST_MINIMUM_MILLISECONDS, null, REDUCED_WEEKLY_REST_MINIMUM_MILLISECONDS, duration - REGULAR_WEEKLY_REST_MINIMUM_MILLISECONDS),
        ],
        BACK_TO_BACK_REGULAR_REDUCED_MINIMUM_MILLISECONDS,
        duration,
        true,
        true,
        metadata,
      ));
    }

    if (duration >= BACK_TO_BACK_REGULAR_REGULAR_MINIMUM_MILLISECONDS && metadata.crossings.length) {
      options.push(option(
        interval,
        "REGULAR_THEN_REGULAR",
        [
          constraint("REGULAR_LENGTH", REGULAR_WEEKLY_REST_MINIMUM_MILLISECONDS, duration - REGULAR_WEEKLY_REST_MINIMUM_MILLISECONDS, null, 0, duration - BACK_TO_BACK_REGULAR_REGULAR_MINIMUM_MILLISECONDS),
          constraint("REGULAR_LENGTH", REGULAR_WEEKLY_REST_MINIMUM_MILLISECONDS, duration - REGULAR_WEEKLY_REST_MINIMUM_MILLISECONDS, null, REGULAR_WEEKLY_REST_MINIMUM_MILLISECONDS, duration - REGULAR_WEEKLY_REST_MINIMUM_MILLISECONDS),
        ],
        BACK_TO_BACK_REGULAR_REGULAR_MINIMUM_MILLISECONDS,
        duration,
        true,
        true,
        metadata,
      ));
    }
  }
  options.sort((left, right) => left.optionId.localeCompare(right.optionId));
  return { options, issues: issues.sort((left, right) => left.issueId.localeCompare(right.issueId)) };
}
