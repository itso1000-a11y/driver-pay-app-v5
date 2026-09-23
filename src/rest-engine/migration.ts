import { legacyDayRecordsToFactInputs, type LegacyActivityDayRecord } from "./facts.ts";
import type { ActivityFactInput, ReviewStatus } from "./types.ts";
import { stableCanonicalJson } from "./evaluate.ts";

export const REST_ENGINE_MIGRATION_VERSION = 1 as const;

export type LegacyStorageSnapshot = Record<string, string>;

export type RestEngineMigration = {
  namespace: "driverPayApp:restEngine:v1";
  migrationVersion: typeof REST_ENGINE_MIGRATION_VERSION;
  sourceSnapshotHash: string;
  status: "COMPLETE" | "REVIEW_REQUIRED";
  facts: ActivityFactInput[];
  migratedFactCount: number;
  ignoredDerivedKeys: string[];
  preservedLegacyKeys: string[];
  reviewReasons: string[];
};

export type MigrationReview = {
  status: ReviewStatus;
  reasons: string[];
};

function digest(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function snapshotHash(snapshot: LegacyStorageSnapshot): string {
  return `legacy:${digest(stableCanonicalJson(snapshot))}`;
}

function isDerivedLegalKey(key: string): boolean {
  return /weeklyRestCandidate|weeklyCompensationLedger|restEngineDerived|compensationLedger/i.test(key);
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function daysFromValue(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  const object = asObject(value);
  return Array.isArray(object?.days) ? object.days : null;
}

type RankedLegacyRecord = { rank: number; record: LegacyActivityDayRecord; signature: string };

/**
 * A closed archive can supply missing pre-provenance evidence only to the same
 * legacy non-work row selected from a newer saved source. Any factual mismatch
 * leaves the ordinary precedence result intact.
 */
function sameLegacyNonWorkRecord(left: LegacyActivityDayRecord, right: LegacyActivityDayRecord): boolean {
  return left.dayType !== "work"
    && left.dateISO === right.dateISO
    && left.recordId === right.recordId
    && left.dayType === right.dayType
    && (left.start ?? "") === (right.start ?? "")
    && (left.finish ?? "") === (right.finish ?? "")
    && left.completionSource === right.completionSource
    && Boolean(left.bulkMarked) === Boolean(right.bulkMarked)
    && Boolean(left.suspectedNonGb) === Boolean(right.suspectedNonGb);
}

function collectDays(
  value: unknown,
  sourceKey: string,
  rank: number,
  historicalPersisted: boolean,
  records: Map<string, RankedLegacyRecord[]>,
  reviewReasons: string[],
): void {
  const days = daysFromValue(value);
  if (!days) {
    reviewReasons.push(`Legacy source ${sourceKey} does not contain a usable days array.`);
    return;
  }
  for (const raw of days) {
    const day = asObject(raw);
    const dateISO = typeof day?.dateISO === "string" ? day.dateISO : "";
    const recordId = typeof day?.id === "string" ? day.id : dateISO;
    const dayType = day?.dayType;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO) || !recordId || !["work", "off", "holiday"].includes(String(dayType))) {
      reviewReasons.push(`Legacy source ${sourceKey} contains an ambiguous day record that was not promoted to fact.`);
      continue;
    }
    const record: LegacyActivityDayRecord = {
      sourceKey: `legacy-day:${dateISO}`,
      recordId,
      dateISO,
      dayType: dayType as LegacyActivityDayRecord["dayType"],
      start: typeof day.start === "string" ? day.start : undefined,
      finish: typeof day.finish === "string" ? day.finish : undefined,
      completionSource: day.completionSource === "user" || day.completionSource === "emptyWorkdaySave"
        ? day.completionSource
        : undefined,
      historicalPersisted,
      bulkMarked: day.bulkMarked === true,
      suspectedNonGb: day.suspectedNonGb === true,
      revision: Number.isInteger(day.revision) ? day.revision as number : undefined,
      supersedesFactIds: Array.isArray(day.supersedesFactIds)
        ? day.supersedesFactIds.filter((item): item is string => typeof item === "string")
        : undefined,
    };
    const identity = `${dateISO}:${recordId}`;
    const list = records.get(identity) ?? [];
    list.push({ rank, record, signature: stableCanonicalJson(record) });
    records.set(identity, list);
  }
}

export function classifyMigrationReview(migration: Pick<RestEngineMigration, "reviewReasons">): MigrationReview {
  const reasons = [...new Set(migration.reviewReasons)].sort();
  return { status: reasons.length ? "REVIEW_REQUIRED" : "CLEAR", reasons };
}

/** Converts only factual legacy day rows. Persisted derived ledgers are recorded and ignored. */
export function migrateLegacyFacts(
  snapshot: LegacyStorageSnapshot,
  asOfEpochMilliseconds: number,
  prior?: RestEngineMigration | null,
): RestEngineMigration {
  if (!Number.isSafeInteger(asOfEpochMilliseconds)) throw new RangeError("asOf must be a safe integer epoch millisecond instant.");
  const sourceSnapshotHash = snapshotHash(snapshot);
  if (prior?.migrationVersion === REST_ENGINE_MIGRATION_VERSION && prior.sourceSnapshotHash === sourceSnapshotHash) {
    return prior;
  }

  const ignoredDerivedKeys = Object.keys(snapshot).filter(isDerivedLegalKey).sort();
  const reviewReasons: string[] = [];
  const records = new Map<string, RankedLegacyRecord[]>();
  for (const key of Object.keys(snapshot).sort()) {
    if (isDerivedLegalKey(key)) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(snapshot[key]);
    } catch {
      continue;
    }
    if (key.startsWith("driverApp_week_")) collectDays(parsed, key, 2, false, records, reviewReasons);
    else if (key === "archive" && Array.isArray(parsed)) {
      parsed.forEach((item, index) => collectDays(item, `${key}[${index}]`, 1, true, records, reviewReasons));
    } else if (key === "days" || key === "driverApp_days") collectDays(parsed, key, 3, false, records, reviewReasons);
  }

  const selected: LegacyActivityDayRecord[] = [];
  for (const [identity, candidates] of [...records.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const highestRank = Math.max(...candidates.map((item) => item.rank));
    const top = candidates.filter((item) => item.rank === highestRank);
    const unique = [...new Map(top.map((item) => [item.signature, item.record])).values()];
    if (unique.length > 1) reviewReasons.push(`Conflicting highest-priority legacy facts remain for ${identity}; no live/current alias was selected.`);
    for (const record of unique) {
      const matchingArchiveEvidence = candidates.some((candidate) =>
        candidate.record.historicalPersisted && sameLegacyNonWorkRecord(record, candidate.record),
      );
      selected.push(matchingArchiveEvidence ? { ...record, historicalPersisted: true } : record);
    }
  }
  const facts = JSON.parse(stableCanonicalJson(
    legacyDayRecordsToFactInputs(selected, asOfEpochMilliseconds)
      .sort((left, right) => left.factId.localeCompare(right.factId) || stableCanonicalJson(left).localeCompare(stableCanonicalJson(right))),
  )) as ActivityFactInput[];
  const review = classifyMigrationReview({ reviewReasons });
  return {
    namespace: "driverPayApp:restEngine:v1",
    migrationVersion: REST_ENGINE_MIGRATION_VERSION,
    sourceSnapshotHash,
    status: review.status === "CLEAR" ? "COMPLETE" : "REVIEW_REQUIRED",
    facts,
    migratedFactCount: facts.length,
    ignoredDerivedKeys,
    preservedLegacyKeys: Object.keys(snapshot).sort(),
    reviewReasons: review.reasons,
  };
}
