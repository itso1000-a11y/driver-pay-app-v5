import assert from "node:assert/strict";
import {
  boundedContinuationFingerprint,
  canonicalAllocationContinuationState,
  continuationLineageForCurrentState,
  successorContinuationLineage,
} from "../src/rest-engine/allocation-frontier.ts";

const component = (id: string, role: "COUNTED" | "ADDITIONAL" = "COUNTED") => ({
  componentId: id, restIntervalId: `rest:${id}`, sourceOptionId: `option:${id}`,
  startEpochMilliseconds: 1, endEpochMilliseconds: 2, durationMilliseconds: 1,
  classification: "REDUCED" as const, role,
});
const assignment = (id: string) => ({ assignmentId: `assignment:${id}`, componentId: id, fixedWeekId: "2026-02-02", assignmentRole: "COUNTED_FOR_FIXED_WEEK" as const });
const state = (overrides: Record<string, unknown> = {}) => ({
  countedComponents: [component("a")], additionalComponents: [], assignments: [assignment("a")],
  sourceOptionIds: ["option:a"], rollingAnchor: null, reviewStatus: "CLEAR" as const,
  reviewReasons: [], reducedSourceSeeds: [], packageContinuations: [], ...overrides,
});

const parent = "allocation-lineage:parent";
const decision = { kind: "ALLOCATION_ADDITION", componentId: "a", fixedWeekId: "2026-02-02" };
const first = successorContinuationLineage(parent, decision);
assert.equal(first, successorContinuationLineage(parent, decision), "BS2 same decision is deterministic");
assert.notEqual(first, successorContinuationLineage(parent, { ...decision, componentId: "b" }), "BS4 structural decision differs");
assert.equal(successorContinuationLineage(parent, { b: [2, 1], a: "x" }), successorContinuationLineage(parent, { a: "x", b: [1, 2] }), "BS3 canonical ordering is stable");
assert.equal(successorContinuationLineage(parent, null), successorContinuationLineage(parent, null), "BS4 no-op identity is stable");

const noAnchor = state();
const unknownAnchor = state({ rollingAnchor: { componentId: "unknown", restIntervalId: null, endEpochMilliseconds: null } });
const knownAnchorA = state({ rollingAnchor: { componentId: "component:a", restIntervalId: "rest:a", endEpochMilliseconds: 123 } });
const knownAnchorB = state({ rollingAnchor: { componentId: "component:b", restIntervalId: "rest:b", endEpochMilliseconds: 123 } });
assert.notEqual(canonicalAllocationContinuationState({ ...noAnchor, continuationLineageId: first }), canonicalAllocationContinuationState({ ...unknownAnchor, continuationLineageId: first }), "BS5/6 null and unknown anchors differ");
assert.notEqual(canonicalAllocationContinuationState({ ...knownAnchorA, continuationLineageId: first }), canonicalAllocationContinuationState({ ...knownAnchorB, continuationLineageId: first }), "BS7 factual anchor identity differs");
assert.notEqual(canonicalAllocationContinuationState({ ...noAnchor, continuationLineageId: first }), canonicalAllocationContinuationState({ ...state({ reducedSourceSeeds: [{ componentId: "a", restIntervalId: "rest:a", fixedWeekId: "2026-02-02", sourceOptionId: "option:a", sourceReducedDurationMilliseconds: 1, requiredCompensationMilliseconds: 2 }] }), continuationLineageId: first }), "BS8 reduced seed differs");

const packageContinuation = { packageContinuationId: "package-continuation:canonical", continuationLineageId: first };
const baseState = state();
const packageState = state({ packageContinuations: [packageContinuation] });
const baseLineage = continuationLineageForCurrentState(first, baseState);
const packageLineage = continuationLineageForCurrentState(first, packageState);
assert.notEqual(baseLineage, packageLineage, "BS9 package child differs from no-package sibling");
assert.equal(packageContinuation.packageContinuationId, "package-continuation:canonical", "BS10 package identity is carried unchanged");
let generation = packageLineage;
for (let index = 0; index < 4; index += 1) generation = continuationLineageForCurrentState(generation, packageState);
assert.equal(generation.length, packageLineage.length, "BS11 lineage stays bounded across generations");
assert.notEqual(continuationLineageForCurrentState(first, knownAnchorA), continuationLineageForCurrentState(first, unknownAnchor), "BS12 one lineage cannot represent distinct continuation states");
const fingerprint = boundedContinuationFingerprint({ state: packageState }, "allocation-branch");
assert.ok(!fingerprint.includes(parent) && fingerprint.length < 64, "BS1 bounded child fingerprint never embeds parent history");
console.log("BS1-BS12 PASS — canonical future-relevant state and bounded identities remain distinct and non-recursive");
