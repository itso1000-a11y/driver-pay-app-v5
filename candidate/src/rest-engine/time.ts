import { Temporal } from "@js-temporal/polyfill";
import {
  LONDON_TIME_ZONE,
  type FactTimeProvenance,
  type FixedLegalWeek,
  type InstantCandidate,
  type LegalBoundary,
  type LondonCivilDayBounds,
  type LondonCivilTime,
  type ZonedFactTime,
} from "./types.ts";

type ResolveLondonWallTimeOptions = {
  provenance?: FactTimeProvenance;
  reviewReason?: string;
};

function instantCandidate(value: Temporal.ZonedDateTime): InstantCandidate {
  return {
    epochMilliseconds: Number(value.epochMilliseconds),
    instantUtc: value.toInstant().toString({ fractionalSecondDigits: 3 }),
    offset: value.offset,
    offsetMinutes: Number(value.offsetNanoseconds) / 60_000_000_000,
  };
}

function londonFields(value: Temporal.PlainDateTime) {
  return {
    timeZone: LONDON_TIME_ZONE,
    year: value.year,
    month: value.month,
    day: value.day,
    hour: value.hour,
    minute: value.minute,
    second: value.second,
    millisecond: value.millisecond,
    microsecond: value.microsecond,
    nanosecond: value.nanosecond,
  };
}

function sameWallTime(value: Temporal.ZonedDateTime, expected: Temporal.PlainDateTime): boolean {
  return value.toPlainDateTime().equals(expected);
}

function uniqueCandidates(values: Temporal.ZonedDateTime[]): InstantCandidate[] {
  const byInstant = new Map<number, InstantCandidate>();
  for (const value of values) {
    const candidate = instantCandidate(value);
    byInstant.set(candidate.epochMilliseconds, candidate);
  }
  return Array.from(byInstant.values()).sort((a, b) => a.epochMilliseconds - b.epochMilliseconds);
}

export function resolveLondonWallTime(
  wallDate: string,
  wallTime: string,
  options: ResolveLondonWallTimeOptions = {},
): ZonedFactTime {
  const date = Temporal.PlainDate.from(wallDate);
  const time = Temporal.PlainTime.from(wallTime);
  const requested = date.toPlainDateTime(time);
  const canonicalWallDate = date.toString();
  const canonicalWallTime = time.toString({ smallestUnit: "second" });
  const provenance = options.provenance ?? "EXPLICIT";
  const fields = londonFields(requested);
  const earlier = Temporal.ZonedDateTime.from(fields, { disambiguation: "earlier" });
  const later = Temporal.ZonedDateTime.from(fields, { disambiguation: "later" });
  const earlierMatches = sameWallTime(earlier, requested);
  const laterMatches = sameWallTime(later, requested);
  const candidates = uniqueCandidates([earlier, later].filter((value) => sameWallTime(value, requested)));

  if (!earlierMatches && !laterMatches) {
    return {
      wallDate: canonicalWallDate,
      wallTime: canonicalWallTime,
      timeZone: LONDON_TIME_ZONE,
      provenance,
      resolution: "NONEXISTENT_GAP",
      reviewRequired: true,
      reviewReasons: ["The entered Europe/London wall time does not exist because of a DST transition."],
      epochMilliseconds: null,
      instantUtc: null,
      offset: null,
      offsetMinutes: null,
      candidates: [],
    };
  }

  if (candidates.length > 1) {
    return {
      wallDate: canonicalWallDate,
      wallTime: canonicalWallTime,
      timeZone: LONDON_TIME_ZONE,
      provenance,
      resolution: "AMBIGUOUS_FOLD",
      reviewRequired: true,
      reviewReasons: ["The entered Europe/London wall time occurs twice because of a DST transition."],
      epochMilliseconds: null,
      instantUtc: null,
      offset: null,
      offsetMinutes: null,
      candidates,
    };
  }

  const candidate = candidates[0];
  if (!candidate) throw new RangeError("Unable to resolve Europe/London wall time.");
  const forcedReview = Boolean(options.reviewReason);
  return {
    wallDate: canonicalWallDate,
    wallTime: canonicalWallTime,
    timeZone: LONDON_TIME_ZONE,
    provenance,
    resolution: forcedReview ? "REVIEW_REQUIRED" : "VALID",
    reviewRequired: forcedReview,
    reviewReasons: forcedReview ? [options.reviewReason as string] : [],
    epochMilliseconds: candidate.epochMilliseconds,
    instantUtc: candidate.instantUtc,
    offset: candidate.offset,
    offsetMinutes: candidate.offsetMinutes,
    candidates: [candidate],
  };
}

function requireResolved(value: ZonedFactTime): InstantCandidate {
  if (value.resolution !== "VALID" && value.resolution !== "REVIEW_REQUIRED") {
    throw new RangeError(`Wall time is not uniquely resolvable: ${value.resolution}`);
  }
  const candidate = value.candidates[0];
  if (!candidate || value.epochMilliseconds == null) throw new RangeError("Resolved instant is missing.");
  return candidate;
}

export function formatLondonInstant(epochMilliseconds: number): LondonCivilTime {
  const instant = Temporal.Instant.fromEpochMilliseconds(epochMilliseconds);
  const london = instant.toZonedDateTimeISO(LONDON_TIME_ZONE);
  return {
    wallDate: london.toPlainDate().toString(),
    wallTime: london.toPlainTime().toString({ smallestUnit: "second" }),
    timeZone: LONDON_TIME_ZONE,
    offset: london.offset,
    offsetMinutes: Number(london.offsetNanoseconds) / 60_000_000_000,
    dayOfWeek: london.dayOfWeek,
  };
}

export function addElapsedMilliseconds(epochMilliseconds: number, milliseconds: number): number {
  if (!Number.isSafeInteger(epochMilliseconds) || !Number.isSafeInteger(milliseconds)) {
    throw new RangeError("Elapsed-time arithmetic requires safe integer milliseconds.");
  }
  return Number(Temporal.Instant.fromEpochMilliseconds(epochMilliseconds).add({ milliseconds }).epochMilliseconds);
}

export function addElapsedMinutes(epochMilliseconds: number, minutes: number): number {
  if (!Number.isSafeInteger(minutes)) throw new RangeError("Elapsed minutes must be a safe integer.");
  return addElapsedMilliseconds(epochMilliseconds, minutes * 60_000);
}

export function addElapsedHours(epochMilliseconds: number, hours: number): number {
  if (!Number.isSafeInteger(hours)) throw new RangeError("Elapsed hours must be a safe integer.");
  return addElapsedMinutes(epochMilliseconds, hours * 60);
}

export function compareInstants(leftEpochMilliseconds: number, rightEpochMilliseconds: number): -1 | 0 | 1 {
  return leftEpochMilliseconds < rightEpochMilliseconds ? -1 : leftEpochMilliseconds > rightEpochMilliseconds ? 1 : 0;
}

function resolvedMidnight(wallDate: string): InstantCandidate {
  return requireResolved(resolveLondonWallTime(wallDate, "00:00:00"));
}

export function londonCivilDayBounds(wallDate: string): LondonCivilDayBounds {
  const date = Temporal.PlainDate.from(wallDate);
  const nextDate = date.add({ days: 1 });
  const start = resolvedMidnight(date.toString());
  const end = resolvedMidnight(nextDate.toString());
  return {
    wallDate: date.toString(),
    startEpochMilliseconds: start.epochMilliseconds,
    endEpochMilliseconds: end.epochMilliseconds,
    elapsedMinutes: (end.epochMilliseconds - start.epochMilliseconds) / 60_000,
  };
}

export function fixedLegalWeekForInstant(epochMilliseconds: number): FixedLegalWeek {
  const london = Temporal.Instant.fromEpochMilliseconds(epochMilliseconds).toZonedDateTimeISO(LONDON_TIME_ZONE);
  const monday = london.toPlainDate().subtract({ days: london.dayOfWeek - 1 });
  const nextMonday = monday.add({ days: 7 });
  const sunday = nextMonday.subtract({ days: 1 });
  const start = resolvedMidnight(monday.toString());
  const end = resolvedMidnight(nextMonday.toString());
  return {
    weekId: monday.toString(),
    mondayDate: monday.toString(),
    sundayDate: sunday.toString(),
    startEpochMilliseconds: start.epochMilliseconds,
    endEpochMilliseconds: end.epochMilliseconds,
    elapsedMinutes: (end.epochMilliseconds - start.epochMilliseconds) / 60_000,
  };
}

export function legalSundayEndForWeek(week: FixedLegalWeek): LegalBoundary {
  return {
    civilMeaning: "SUNDAY_24_00_EQ_MONDAY_00_00",
    mondayDate: Temporal.PlainDate.from(week.mondayDate).add({ days: 7 }).toString(),
    epochMilliseconds: week.endEpochMilliseconds,
    instantUtc: Temporal.Instant.fromEpochMilliseconds(week.endEpochMilliseconds).toString({ fractionalSecondDigits: 3 }),
  };
}

export function compensationDeadlineForWeek(sourceWeek: FixedLegalWeek): LegalBoundary {
  const deadlineMonday = Temporal.PlainDate.from(sourceWeek.mondayDate).add({ weeks: 4 });
  const deadline = resolvedMidnight(deadlineMonday.toString());
  return {
    civilMeaning: "SUNDAY_24_00_EQ_MONDAY_00_00",
    mondayDate: deadlineMonday.toString(),
    epochMilliseconds: deadline.epochMilliseconds,
    instantUtc: deadline.instantUtc,
  };
}
