import { deriveRestIntervals } from "./chronology.ts";
import { evaluateCompensation } from "./compensation.ts";
import { normalizeActivityFacts } from "./facts.ts";
import type {
  ActivityFact,
  ActivityFactInput,
  ChronologyIssue,
  EvaluateCompensationResult,
  Phase4Issue,
  PriorQualifyingWeeklyRest,
  RestInterval,
  SolveWeeklyRestAllocationsResult,
  WeeklyRestComponentOption,
} from "./types.ts";
import { solveWeeklyRestAllocations } from "./weekly-rest-allocation.ts";
import { generateWeeklyRestComponentOptions } from "./weekly-rest-candidates.ts";

export type RestEngineRuleset = {
  rulesetId: "EU_561_2006_REST_ENGINE_V1";
  rulesetVersion: string;
  policyVersion: string;
};

export type EvaluateRestEngineInput = {
  facts: readonly ActivityFactInput[];
  asOfEpochMilliseconds: number;
  ruleset: RestEngineRuleset;
  evaluationWeekIds: readonly string[];
  historyStartEpochMilliseconds: number | null;
  factualCoverageCompleteThroughAsOf: boolean;
  priorQualifyingWeeklyRest?: PriorQualifyingWeeklyRest;
};

export type EngineEvaluation = {
  schemaVersion: 1;
  factsHash: string;
  evaluationFingerprint: string;
  asOfEpochMilliseconds: number;
  ruleset: RestEngineRuleset;
  factualCoverageCompleteThroughAsOf: boolean;
  evaluationWeekIds: string[];
  activityFacts: ActivityFact[];
  restIntervals: RestInterval[];
  weeklyRestOptions: WeeklyRestComponentOption[];
  allocation: SolveWeeklyRestAllocationsResult;
  compensation: EvaluateCompensationResult;
  chronologyIssues: ChronologyIssue[];
  weeklyRestCandidateIssues: ChronologyIssue[];
  allocationIssues: Phase4Issue[];
};

export type DerivedEvaluationCache = Map<string, EngineEvaluation>;

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

export function stableCanonicalJson(value: unknown): string {
  return JSON.stringify(canonicalValue(value));
}

function stableDigest(value: string): string {
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    first ^= code;
    first = Math.imul(first, 0x01000193);
    second ^= code + index;
    second = Math.imul(second, 0x85ebca6b);
  }
  return `${(first >>> 0).toString(16).padStart(8, "0")}${(second >>> 0).toString(16).padStart(8, "0")}`;
}

function canonicalFacts(facts: readonly ActivityFactInput[]): ActivityFactInput[] {
  return [...facts].sort((left, right) => {
    const leftKey = stableCanonicalJson([left.factId, left.sourceRef, left.revision ?? null, left.revisionFingerprint ?? "", left]);
    const rightKey = stableCanonicalJson([right.factId, right.sourceRef, right.revision ?? null, right.revisionFingerprint ?? "", right]);
    return leftKey.localeCompare(rightKey);
  });
}

export function computeFactsHash(input: EvaluateRestEngineInput): string {
  if (!Number.isSafeInteger(input.asOfEpochMilliseconds)) {
    throw new RangeError("asOf must be a safe integer epoch millisecond instant.");
  }
  const authoritative = {
    facts: canonicalFacts(input.facts),
    asOfEpochMilliseconds: input.asOfEpochMilliseconds,
    ruleset: input.ruleset,
    evaluationWeekIds: [...new Set(input.evaluationWeekIds)].sort(),
    historyStartEpochMilliseconds: input.historyStartEpochMilliseconds,
    factualCoverageCompleteThroughAsOf: input.factualCoverageCompleteThroughAsOf,
    priorQualifyingWeeklyRest: input.priorQualifyingWeeklyRest ?? null,
  };
  return `facts:${stableDigest(stableCanonicalJson(authoritative))}`;
}

function evaluationDigest(value: Omit<EngineEvaluation, "evaluationFingerprint">): string {
  return `evaluation:${stableDigest(stableCanonicalJson(value))}`;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
  }
  return value;
}

/**
 * Recomputes the entire legal graph from authoritative facts. A supplied cache is
 * write-through only: cached derived state is never read as legal authority.
 */
export function evaluateRestEngine(
  input: EvaluateRestEngineInput,
  cache?: DerivedEvaluationCache,
): EngineEvaluation {
  const factsHash = computeFactsHash(input);
  const normalized = normalizeActivityFacts(canonicalFacts(input.facts));
  const chronology = deriveRestIntervals(normalized.facts, input.asOfEpochMilliseconds);
  const candidates = generateWeeklyRestComponentOptions(chronology.intervals);
  const allocation = solveWeeklyRestAllocations(chronology.intervals, candidates.options, {
    asOfEpochMilliseconds: input.asOfEpochMilliseconds,
    evaluationWeekIds: [...new Set(input.evaluationWeekIds)].sort(),
    historyStartEpochMilliseconds: input.historyStartEpochMilliseconds,
    factualCoverageCompleteThroughAsOf: input.factualCoverageCompleteThroughAsOf,
    priorQualifyingWeeklyRest: input.priorQualifyingWeeklyRest,
  });
  const compensation = evaluateCompensation(chronology.intervals, allocation.branches, {
    asOfEpochMilliseconds: input.asOfEpochMilliseconds,
    factualCoverageCompleteThroughAsOf: input.factualCoverageCompleteThroughAsOf,
  });
  const value: Omit<EngineEvaluation, "evaluationFingerprint"> = {
    schemaVersion: 1,
    factsHash,
    asOfEpochMilliseconds: input.asOfEpochMilliseconds,
    ruleset: { ...input.ruleset },
    factualCoverageCompleteThroughAsOf: input.factualCoverageCompleteThroughAsOf,
    evaluationWeekIds: [...new Set(input.evaluationWeekIds)].sort(),
    activityFacts: normalized.facts,
    restIntervals: chronology.intervals,
    weeklyRestOptions: candidates.options,
    allocation,
    compensation,
    chronologyIssues: [...normalized.issues, ...chronology.issues]
      .sort((left, right) => left.issueId.localeCompare(right.issueId)),
    weeklyRestCandidateIssues: candidates.issues,
    allocationIssues: allocation.issues,
  };
  const evaluation = deepFreeze<EngineEvaluation>({ ...value, evaluationFingerprint: evaluationDigest(value) });
  cache?.set(factsHash, evaluation);
  return evaluation;
}

export function invalidateDerivedCache(cache: DerivedEvaluationCache, factsHash?: string): void {
  if (factsHash == null) cache.clear();
  else cache.delete(factsHash);
}
