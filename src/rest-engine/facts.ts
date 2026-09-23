import {
  LONDON_TIME_ZONE,
  type ActivityFact,
  type ActivityFactInput,
  type ActivityFactTimeInput,
  type ActivityFactStatus,
  type ChronologyIssue,
  type FactCoverage,
  type FactTimeProvenance,
  type ZonedFactTime,
} from "./types.ts";
import { formatLondonInstant, londonCivilDayBounds, resolveLondonWallTime } from "./time.ts";

export type NormalizeActivityFactsResult = {
  facts: ActivityFact[];
  issues: ChronologyIssue[];
};

export type LegacyActivityDayRecord = {
  sourceKey: string;
  recordId: string;
  dateISO: string;
  dayType: "work" | "off" | "holiday";
  start?: string;
  finish?: string;
  completionSource?: "user" | "emptyWorkdaySave";
  /** A closed archive row is durable historical evidence from before provenance existed. */
  historicalPersisted?: boolean;
  bulkMarked?: boolean;
  suspectedNonGb?: boolean;
  revision?: number;
  supersedesFactIds?: string[];
};

function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function stableIssue(
  code: ChronologyIssue["code"],
  factIds: string[],
  reason: string,
  start: number | null = null,
  end: number | null = null,
): ChronologyIssue {
  const affectedFactIds = [...new Set(factIds)].sort();
  return {
    issueId: `issue:${code}:${stableHash(JSON.stringify([affectedFactIds, start, end, reason]))}`,
    code,
    affectedFactIds,
    startEpochMilliseconds: start,
    endEpochMilliseconds: end,
    reviewReason: reason,
  };
}

function isZonedFactTime(value: ActivityFactTimeInput): value is ZonedFactTime {
  return "resolution" in value && "candidates" in value;
}

function normalizeTime(value: ActivityFactTimeInput | null, fallbackProvenance: FactTimeProvenance): ZonedFactTime | null {
  if (!value) return null;
  if (isZonedFactTime(value)) return value;
  const nonLondonReason = value.timeZone && value.timeZone !== LONDON_TIME_ZONE
    ? `Known or suspected non-GB fact supplied with ${value.timeZone}.`
    : undefined;
  return resolveLondonWallTime(value.wallDate, value.wallTime, {
    provenance: value.provenance ?? fallbackProvenance,
    reviewReason: value.reviewReason ?? nonLondonReason,
  });
}

function canonicalFactSignature(fact: ActivityFact): string {
  return JSON.stringify({
    sourceRef: fact.sourceRef,
    kind: fact.kind,
    factStatus: fact.factStatus,
    coverage: fact.coverage,
    start: fact.start,
    end: fact.end,
    provenance: fact.provenance,
    reviewReasons: fact.reviewReasons,
    revision: fact.revision,
    supersedesFactIds: fact.supersedesFactIds,
  });
}

function normalizeOne(input: ActivityFactInput): ActivityFact {
  const provenance = input.provenance ?? "EXPLICIT";
  const start = normalizeTime(input.start, provenance);
  const end = normalizeTime(input.end, provenance);
  const reviewReasons = [...(input.reviewReasons ?? [])];
  for (const boundary of [start, end]) {
    if (boundary?.reviewRequired) reviewReasons.push(...boundary.reviewReasons);
  }
  const uniqueReasons = [...new Set(reviewReasons)].sort();
  const preliminary: ActivityFact = {
    factId: input.factId,
    sourceRef: input.sourceRef,
    kind: input.kind,
    factStatus: input.factStatus,
    coverage: input.coverage,
    start,
    end,
    provenance,
    reviewStatus: uniqueReasons.length ? "REVIEW_REQUIRED" : "CLEAR",
    reviewReasons: uniqueReasons,
    revision: Number.isInteger(input.revision) ? input.revision as number : null,
    revisionFingerprint: input.revisionFingerprint ?? "",
    supersedesFactIds: [...new Set(input.supersedesFactIds ?? [])].sort(),
  };
  return {
    ...preliminary,
    revisionFingerprint: input.revisionFingerprint || stableHash(canonicalFactSignature(preliminary)),
  };
}

function withReview(fact: ActivityFact, reason: string, suffix?: string): ActivityFact {
  return {
    ...fact,
    factId: suffix ? `${fact.factId}#${suffix}` : fact.factId,
    reviewStatus: "REVIEW_REQUIRED",
    reviewReasons: [...new Set([...fact.reviewReasons, reason])].sort(),
  };
}

export function normalizeActivityFacts(inputs: readonly ActivityFactInput[]): NormalizeActivityFactsResult {
  const normalized = inputs.map(normalizeOne);
  const issues: ChronologyIssue[] = [];
  const superseded = new Set(normalized.flatMap((fact) => fact.supersedesFactIds));
  const active = normalized.filter((fact) => !superseded.has(fact.factId));
  const grouped = new Map<string, ActivityFact[]>();
  for (const fact of active) {
    const list = grouped.get(fact.factId) ?? [];
    list.push(fact);
    grouped.set(fact.factId, list);
  }

  const facts: ActivityFact[] = [];
  for (const [factId, group] of [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const explicitRevisions = group.filter((fact) => fact.revision != null);
    const highestRevision = explicitRevisions.length
      ? Math.max(...explicitRevisions.map((fact) => fact.revision as number))
      : null;
    const revisionGroup = highestRevision == null
      ? group
      : group.filter((fact) => fact.revision === highestRevision);
    const bySignature = new Map<string, ActivityFact>();
    for (const fact of revisionGroup) bySignature.set(canonicalFactSignature(fact), fact);
    const unique = [...bySignature.values()].sort((left, right) => left.revisionFingerprint.localeCompare(right.revisionFingerprint));
    if (revisionGroup.length > unique.length) {
      issues.push(stableIssue("DUPLICATE_FACT_DEDUPED", [factId], "Exact duplicate activity facts were deterministically deduplicated."));
    }
    if (unique.length === 1) {
      facts.push(unique[0]);
      continue;
    }
    const reason = "Conflicting activity facts share an identity without an authoritative revision or supersession relation.";
    issues.push(stableIssue("CONFLICTING_DUPLICATE_FACTS", [factId], reason));
    unique.forEach((fact, index) => facts.push(withReview(fact, reason, `conflict-${index + 1}`)));
  }

  facts.sort((left, right) => {
    const byDate = left.sourceRef.wallDate.localeCompare(right.sourceRef.wallDate);
    if (byDate) return byDate;
    return left.factId.localeCompare(right.factId);
  });
  return { facts, issues: issues.sort((left, right) => left.issueId.localeCompare(right.issueId)) };
}

function nextLondonDate(wallDate: string): string {
  return formatLondonInstant(londonCivilDayBounds(wallDate).endEpochMilliseconds).wallDate;
}

function normalizeCompleteLegacyWallTime(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (/^([01]\d|2[0-3])[0-5]\d$/.test(trimmed)) return `${trimmed.slice(0, 2)}:${trimmed.slice(2)}`;
  return /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(trimmed) ? trimmed : null;
}

export function legacyDayRecordsToFactInputs(
  records: readonly LegacyActivityDayRecord[],
  asOfEpochMilliseconds: number,
): ActivityFactInput[] {
  const asOfLondonDate = formatLondonInstant(asOfEpochMilliseconds).wallDate;
  return records.map((record) => {
    const factId = `legacy:${record.sourceKey}:${record.recordId}`;
    const future = record.dateISO > asOfLondonDate;
    const past = record.dateISO < asOfLondonDate;
    const completionEvidence = record.completionSource === "user" || record.completionSource === "emptyWorkdaySave";
    const provenance: FactTimeProvenance = "ASSUMED";
    const reviewReasons: string[] = [];
    if (record.suspectedNonGb) reviewReasons.push("Known or suspected non-GB legacy timestamp.");
    const sourceRef = { sourceKey: record.sourceKey, recordId: record.recordId, wallDate: record.dateISO };

    if (record.dayType === "work") {
      // One to three digits are editable UI state. A complete four-digit legacy
      // value remains valid historical data and is normalized before Temporal sees it.
      const startTime = normalizeCompleteLegacyWallTime(record.start);
      const finishTime = normalizeCompleteLegacyWallTime(record.finish);
      const hasStart = startTime != null;
      const hasFinish = finishTime != null;
      const factStatus: ActivityFactStatus = future ? "PLANNED" : hasStart || hasFinish ? "FACTUAL" : "PLACEHOLDER";
      const coverage: FactCoverage = factStatus === "FACTUAL" && completionEvidence ? "FULL_CIVIL_DAY" : hasStart || hasFinish ? "BOUNDED_ONLY" : "NONE";
      return {
        factId,
        sourceRef,
        kind: "WORK",
        factStatus,
        coverage,
        start: startTime ? { wallDate: record.dateISO, wallTime: startTime, provenance, reviewReason: record.suspectedNonGb ? reviewReasons[0] : undefined } : null,
        end: finishTime ? { wallDate: record.dateISO, wallTime: finishTime, provenance, reviewReason: record.suspectedNonGb ? reviewReasons[0] : undefined } : null,
        provenance,
        reviewReasons,
        revision: record.revision,
        supersedesFactIds: record.supersedesFactIds,
      };
    }

    // Pre-provenance rows are accepted only from the closed archive. This is the
    // narrow durable historical signal available for an old explicit Off/Holiday;
    // live/current and saved planning rows still require completionSource.
    const legacyHistoricalEvidence = record.historicalPersisted && record.completionSource === undefined;
    const factual = past && !record.bulkMarked && (completionEvidence || legacyHistoricalEvidence);
    if (!factual && !future) reviewReasons.push("Off/Holiday row lacks factual completion provenance.");
    return {
      factId,
      sourceRef,
      kind: record.dayType === "off" ? "OFF" : "HOLIDAY",
      factStatus: future ? "PLANNED" : factual ? "FACTUAL" : "PLACEHOLDER",
      coverage: factual ? "FULL_CIVIL_DAY" : "NONE",
      start: factual ? { wallDate: record.dateISO, wallTime: "00:00:00", provenance } : null,
      end: factual ? { wallDate: nextLondonDate(record.dateISO), wallTime: "00:00:00", provenance } : null,
      provenance,
      reviewReasons,
      revision: record.revision,
      supersedesFactIds: record.supersedesFactIds,
    };
  });
}

export const factInternal = { stableHash, stableIssue };
