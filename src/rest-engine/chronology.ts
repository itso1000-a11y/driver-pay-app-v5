import {
  type ActivityFact,
  type ChronologyIssue,
  type FactTimeProvenance,
  type RestBoundary,
  type RestInterval,
  type ZonedFactTime,
} from "./types.ts";
import { formatLondonInstant, londonCivilDayBounds, resolveLondonWallTime } from "./time.ts";
import { factInternal } from "./facts.ts";

export type DeriveRestIntervalsContext = {
  timeZone: "Europe/London";
};

export type DeriveRestIntervalsResult = {
  intervals: RestInterval[];
  issues: ChronologyIssue[];
};

type Span = {
  start: number;
  end: number;
  factIds: string[];
  provenance: FactTimeProvenance;
  reviewReasons: string[];
  reviewReasonsAtStart?: string[];
  startBoundary?: RestBoundary;
  endBoundary?: RestBoundary;
};

function unique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function issue(
  code: ChronologyIssue["code"],
  factIds: string[],
  reason: string,
  start: number | null = null,
  end: number | null = null,
): ChronologyIssue {
  return factInternal.stableIssue(code, factIds, reason, start, end);
}

function exactEpoch(value: ZonedFactTime | null): number | null {
  return value?.epochMilliseconds ?? null;
}

function boundaryAt(
  epochMilliseconds: number,
  sourceFactIds: string[],
  role: RestBoundary["role"],
  provenance: FactTimeProvenance,
): RestBoundary {
  const civil = formatLondonInstant(epochMilliseconds);
  return {
    sourceFactIds: unique(sourceFactIds),
    role,
    time: resolveLondonWallTime(civil.wallDate, civil.wallTime, { provenance }),
    epochMilliseconds,
  };
}

function dayBounds(fact: ActivityFact): { start: number; end: number } {
  const bounds = londonCivilDayBounds(fact.sourceRef.wallDate);
  return { start: bounds.startEpochMilliseconds, end: bounds.endEpochMilliseconds };
}

function combineProvenance(left: FactTimeProvenance, right: FactTimeProvenance): FactTimeProvenance {
  return left === "ASSUMED" || right === "ASSUMED" ? "ASSUMED" : "EXPLICIT";
}

function mergeSpans(spans: Span[], joinAdjacent: boolean): Span[] {
  const sorted = [...spans].sort((left, right) => left.start - right.start || left.end - right.end || left.factIds.join().localeCompare(right.factIds.join()));
  const merged: Span[] = [];
  for (const span of sorted) {
    const current = merged[merged.length - 1];
    const touches = current && (joinAdjacent ? span.start <= current.end : span.start < current.end);
    if (!touches) {
      merged.push({ ...span, factIds: unique(span.factIds), reviewReasons: unique(span.reviewReasons) });
      continue;
    }
    if (span.end > current.end) {
      current.end = span.end;
      current.endBoundary = span.endBoundary;
    }
    current.reviewReasonsAtStart = unique([
      ...(current.reviewReasonsAtStart ?? current.reviewReasons),
      ...(span.reviewReasonsAtStart ?? span.reviewReasons),
    ]);
    current.factIds = unique([...current.factIds, ...span.factIds]);
    current.reviewReasons = unique([...current.reviewReasons, ...span.reviewReasons]);
    current.provenance = combineProvenance(current.provenance, span.provenance);
  }
  return merged;
}

function candidates(value: ZonedFactTime | null): number[] {
  if (!value) return [];
  if (value.epochMilliseconds != null) return [value.epochMilliseconds];
  return value.candidates.map((candidate) => candidate.epochMilliseconds);
}

function reviewIntervalsForUnresolvedBoundaries(facts: ActivityFact[], asOf: number): RestInterval[] {
  const work = facts
    .filter((fact) => fact.factStatus === "FACTUAL" && fact.kind === "WORK")
    .sort((left, right) => {
      const leftKey = `${left.sourceRef.wallDate}T${left.start?.wallTime ?? "99:99"}`;
      const rightKey = `${right.sourceRef.wallDate}T${right.start?.wallTime ?? "99:99"}`;
      return leftKey.localeCompare(rightKey) || left.factId.localeCompare(right.factId);
    });
  const result: RestInterval[] = [];
  for (let index = 0; index < work.length - 1; index += 1) {
    const previous = work[index];
    const next = work[index + 1];
    if (!previous.end || !next.start) continue;
    if (previous.end.epochMilliseconds != null && next.start.epochMilliseconds != null) continue;
    const starts = candidates(previous.end);
    const ends = candidates(next.start);
    const durations = starts.flatMap((start) => ends.filter((end) => end > start).map((end) => end - start));
    const reviewReasons = unique([
      ...previous.reviewReasons,
      ...next.reviewReasons,
      "A RestInterval boundary is not uniquely resolvable.",
    ]);
    result.push({
      restIntervalId: `rest:${factInternal.stableHash(`${previous.factId}:WORK_END`)}`,
      startBoundary: {
        sourceFactIds: [previous.factId],
        role: "WORK_END",
        time: previous.end,
        epochMilliseconds: previous.end.epochMilliseconds,
      },
      endBoundary: {
        sourceFactIds: [next.factId],
        role: "WORK_START",
        time: next.start,
        epochMilliseconds: next.start.epochMilliseconds,
      },
      startEpochMilliseconds: previous.end.epochMilliseconds,
      endEpochMilliseconds: next.start.epochMilliseconds,
      observedThroughEpochMilliseconds: Math.min(asOf, next.start.epochMilliseconds ?? asOf),
      elapsedMilliseconds: null,
      elapsedRangeMilliseconds: durations.length ? { minimum: Math.min(...durations), maximum: Math.max(...durations) } : null,
      supportingFactIds: unique([previous.factId, next.factId]),
      state: "CLOSED",
      provenance: combineProvenance(previous.provenance, next.provenance),
      reviewStatus: "REVIEW_REQUIRED",
      reviewReasons,
    });
  }
  return result;
}

export function deriveRestIntervals(
  facts: readonly ActivityFact[],
  asOfEpochMilliseconds: number,
  context: DeriveRestIntervalsContext = { timeZone: "Europe/London" },
): DeriveRestIntervalsResult {
  if (!Number.isSafeInteger(asOfEpochMilliseconds)) throw new RangeError("asOf must be a safe integer epoch millisecond instant.");
  if (context.timeZone !== "Europe/London") throw new RangeError("Rest Engine v1 chronology requires Europe/London.");

  const factual = facts.filter((fact) => fact.factStatus === "FACTUAL");
  const issues: ChronologyIssue[] = [];
  const coverageSpans: Span[] = [];
  const busySpans: Span[] = [];

  for (const fact of factual) {
    const bounds = dayBounds(fact);
    const coverageEnd = Math.min(bounds.end, asOfEpochMilliseconds);
    if (fact.coverage === "FULL_CIVIL_DAY" && bounds.start < coverageEnd) {
      coverageSpans.push({
        start: bounds.start,
        end: coverageEnd,
        factIds: [fact.factId],
        provenance: fact.provenance,
        reviewReasons: [...fact.reviewReasons],
        startBoundary: boundaryAt(bounds.start, [fact.factId], "COVERAGE_START", fact.provenance),
        endBoundary: boundaryAt(coverageEnd, [fact.factId], coverageEnd === asOfEpochMilliseconds ? "AS_OF" : "COVERAGE_END", fact.provenance),
      });
    }
    if (fact.kind !== "WORK") continue;

    const start = exactEpoch(fact.start);
    const end = exactEpoch(fact.end);
    const baseReasons = [...fact.reviewReasons];
    if (fact.start && fact.start.epochMilliseconds == null || fact.end && fact.end.epochMilliseconds == null) {
      const reason = "A Work boundary is not uniquely resolvable.";
      issues.push(issue("UNRESOLVED_FACT_TIME", [fact.factId], reason));
      if (fact.coverage === "FULL_CIVIL_DAY" && bounds.start < coverageEnd) {
        busySpans.push({ start: bounds.start, end: coverageEnd, factIds: [fact.factId], provenance: fact.provenance, reviewReasons: unique([...baseReasons, reason]) });
      }
      continue;
    }
    if (start != null && end == null) {
      const reason = "Work Start is factual but Work Finish is missing.";
      issues.push(issue("INCOMPLETE_WORK_START", [fact.factId], reason, start, null));
      if (start < asOfEpochMilliseconds) {
        busySpans.push({
          start,
          end: asOfEpochMilliseconds,
          factIds: [fact.factId],
          provenance: fact.provenance,
          reviewReasons: unique([...baseReasons, reason]),
          reviewReasonsAtStart: baseReasons,
          startBoundary: { sourceFactIds: [fact.factId], role: "WORK_START", time: fact.start, epochMilliseconds: start },
        });
      }
      continue;
    }
    if (start == null && end != null) {
      const reason = "Work Finish is factual but Work Start is missing.";
      issues.push(issue("INCOMPLETE_WORK_FINISH", [fact.factId], reason, null, end));
      if (fact.coverage === "FULL_CIVIL_DAY" && bounds.start < Math.min(end, asOfEpochMilliseconds)) {
        busySpans.push({ start: bounds.start, end: Math.min(end, asOfEpochMilliseconds), factIds: [fact.factId], provenance: fact.provenance, reviewReasons: unique([...baseReasons, reason]) });
      }
      continue;
    }
    if (start == null || end == null) continue;
    if (end <= start) {
      const reason = "Work Finish is not later than Work Start; no overnight shift was invented.";
      issues.push(issue("INVALID_WORK_ORDER", [fact.factId], reason, start, end));
      if (fact.coverage === "FULL_CIVIL_DAY" && bounds.start < coverageEnd) {
        busySpans.push({ start: bounds.start, end: coverageEnd, factIds: [fact.factId], provenance: fact.provenance, reviewReasons: unique([...baseReasons, reason]) });
      }
      continue;
    }
    if (start < asOfEpochMilliseconds) {
      busySpans.push({
        start,
        end: Math.min(end, asOfEpochMilliseconds),
        factIds: [fact.factId],
        provenance: fact.provenance,
        reviewReasons: baseReasons,
        startBoundary: { sourceFactIds: [fact.factId], role: "WORK_START", time: fact.start, epochMilliseconds: start },
        endBoundary: { sourceFactIds: [fact.factId], role: "WORK_END", time: fact.end, epochMilliseconds: end },
      });
    }
  }

  const sortedBusy = [...busySpans].sort((left, right) => left.start - right.start || left.end - right.end || left.factIds.join().localeCompare(right.factIds.join()));
  for (let index = 1; index < sortedBusy.length; index += 1) {
    const previous = sortedBusy[index - 1];
    const current = sortedBusy[index];
    if (current.start < previous.end && current.factIds.join() !== previous.factIds.join()) {
      const factIds = unique([...previous.factIds, ...current.factIds]);
      const reason = "Overlapping factual Work periods were conservatively treated as one busy union.";
      issues.push(issue("OVERLAPPING_WORK_FACTS", factIds, reason, current.start, Math.min(previous.end, current.end)));
      previous.reviewReasons = unique([...previous.reviewReasons, reason]);
      current.reviewReasons = unique([...current.reviewReasons, reason]);
      previous.reviewReasonsAtStart = unique([...(previous.reviewReasonsAtStart ?? previous.reviewReasons), reason]);
      current.reviewReasonsAtStart = unique([...(current.reviewReasonsAtStart ?? current.reviewReasons), reason]);
    }
  }

  const coverage = mergeSpans(coverageSpans, true);
  const busy = mergeSpans(sortedBusy, true);
  const intervals: RestInterval[] = [];

  for (const covered of coverage) {
    const relevantBusy = busy.filter((span) => span.end > covered.start && span.start < covered.end);
    let cursor = covered.start;
    let startBoundary = covered.startBoundary ?? boundaryAt(covered.start, covered.factIds, "COVERAGE_START", covered.provenance);
    let accumulatedReviews = [...covered.reviewReasons];
    let accumulatedFactIds = [...covered.factIds];

    for (const work of relevantBusy) {
      const workStart = Math.max(work.start, covered.start);
      const workEnd = Math.min(work.end, covered.end);
      if (workStart > cursor) {
        const endBoundary = work.startBoundary ?? boundaryAt(workStart, work.factIds, "WORK_START", work.provenance);
        const reviewReasons = unique([...accumulatedReviews, ...(work.reviewReasonsAtStart ?? work.reviewReasons)]);
        const supportingFactIds = unique([...accumulatedFactIds, ...work.factIds]);
        intervals.push({
          restIntervalId: `rest:${factInternal.stableHash(`${startBoundary.sourceFactIds.join(",")}:${startBoundary.role}`)}`,
          startBoundary,
          endBoundary,
          startEpochMilliseconds: cursor,
          endEpochMilliseconds: workStart,
          observedThroughEpochMilliseconds: workStart,
          elapsedMilliseconds: workStart - cursor,
          elapsedRangeMilliseconds: null,
          supportingFactIds,
          state: "CLOSED",
          provenance: combineProvenance(covered.provenance, work.provenance),
          reviewStatus: reviewReasons.length ? "REVIEW_REQUIRED" : "CLEAR",
          reviewReasons,
        });
      }
      if (workEnd > cursor) {
        cursor = workEnd;
        startBoundary = work.endBoundary ?? boundaryAt(workEnd, work.factIds, "WORK_END", work.provenance);
        accumulatedReviews = unique([...covered.reviewReasons, ...work.reviewReasons]);
        accumulatedFactIds = unique([...covered.factIds, ...work.factIds]);
      }
    }

    if (cursor < covered.end) {
      const open = covered.end === asOfEpochMilliseconds;
      const reviewReasons = unique(accumulatedReviews);
      intervals.push({
        restIntervalId: `rest:${factInternal.stableHash(`${startBoundary.sourceFactIds.join(",")}:${startBoundary.role}`)}`,
        startBoundary,
        endBoundary: open ? null : covered.endBoundary ?? boundaryAt(covered.end, covered.factIds, "COVERAGE_END", covered.provenance),
        startEpochMilliseconds: cursor,
        endEpochMilliseconds: open ? null : covered.end,
        observedThroughEpochMilliseconds: covered.end,
        elapsedMilliseconds: covered.end - cursor,
        elapsedRangeMilliseconds: null,
        supportingFactIds: unique(accumulatedFactIds),
        state: open ? "OPEN" : "CLOSED",
        provenance: covered.provenance,
        reviewStatus: reviewReasons.length ? "REVIEW_REQUIRED" : "CLEAR",
        reviewReasons,
      });
    }
  }

  const unresolved = reviewIntervalsForUnresolvedBoundaries(factual, asOfEpochMilliseconds);
  const byId = new Map<string, RestInterval>();
  for (const interval of [...intervals, ...unresolved]) {
    const prior = byId.get(interval.restIntervalId);
    if (!prior || prior.reviewStatus === "REVIEW_REQUIRED" && interval.reviewStatus === "CLEAR") byId.set(interval.restIntervalId, interval);
  }
  const orderedIntervals = [...byId.values()].sort((left, right) =>
    (left.startEpochMilliseconds ?? Number.MAX_SAFE_INTEGER) - (right.startEpochMilliseconds ?? Number.MAX_SAFE_INTEGER)
    || left.restIntervalId.localeCompare(right.restIntervalId)
  );
  return {
    intervals: orderedIntervals,
    issues: [...new Map(issues.map((item) => [item.issueId, item])).values()].sort((left, right) => left.issueId.localeCompare(right.issueId)),
  };
}
