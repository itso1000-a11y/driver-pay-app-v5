import assert from "node:assert/strict";
import { allocationFrontierAlternative, allocationFrontierFromBranches, allocationFrontierGenesis, transitionAllocationFrontier } from "../src/rest-engine/allocation-frontier.ts";
import type { AllocationBranch } from "../src/rest-engine/types.ts";

let passed = 0;
function test(id: string, name: string, body: () => void) { body(); passed += 1; console.log(`PASS ${id} — ${name}`); }
function branch(id: string, reduced = false): AllocationBranch {
  const component = { componentId: `component:${id}`, restIntervalId: `rest:${id}`, sourceOptionId: `option:${id}`, classification: reduced ? "REDUCED" : "REGULAR", role: "COUNTED", startEpochMilliseconds: 1000, endEpochMilliseconds: reduced ? 30 * 60 * 60 * 1000 : 45 * 60 * 60 * 1000, durationMilliseconds: reduced ? 30 * 60 * 60 * 1000 : 45 * 60 * 60 * 1000 };
  return { branchId: `branch:${id}`, branchFingerprint: `fingerprint:${id}`, components: [component], fixedWeekAssignments: [{ componentId: component.componentId, fixedWeekId: "2026-02-02", classification: component.classification, sourceRestIntervalId: component.restIntervalId, sourceOptionId: component.sourceOptionId }], additionalComponents: [], rollingQualifyingRests: [], rollingCycleResets: [{ evaluationId: `rolling:${id}`, previousComponentId: component.componentId, nextComponentId: null, previousRestIntervalId: component.restIntervalId, nextRestIntervalId: null, previousQualifyingEndEpochMilliseconds: component.endEpochMilliseconds, nextQualifyingStartEpochMilliseconds: null, dueEpochMilliseconds: null, exactElapsedMilliseconds: null, status: "PENDING", reviewReasons: [] }], twoWeekEvaluations: [], reviewStatus: "CLEAR", reviewReasons: [], legalState: "PENDING", invalidReasons: [], sourceOptionIds: [component.sourceOptionId] } as unknown as AllocationBranch;
}
const regular = branch("regular"); const reduced = branch("reduced", true);
test("A1-01", "genesis has no alternatives", () => assert.deepEqual(allocationFrontierGenesis(), { alternatives: [] }));
test("A1-02", "projection preserves one legal branch", () => assert.equal(allocationFrontierFromBranches([regular]).alternatives.length, 1));
test("A1-03", "canonical identity includes full legal payload", () => assert.equal(allocationFrontierAlternative(regular).alternativeId.startsWith("{"), true));
test("A1-04", "distinct branch fingerprints do not merge", () => assert.notEqual(allocationFrontierAlternative(regular).alternativeId, allocationFrontierAlternative(reduced).alternativeId));
test("A1-05", "first transition accepts root alternatives", () => assert.equal(transitionAllocationFrontier(allocationFrontierGenesis(), allocationFrontierFromBranches([regular])).nextFrontier.alternatives.length, 1));
test("A1-06", "child transition requires exact parent identity", () => { const first = transitionAllocationFrontier(allocationFrontierGenesis(), allocationFrontierFromBranches([regular])); const orphan = { ...first.nextFrontier.alternatives[0], parentAlternativeId: "missing" }; assert.equal(transitionAllocationFrontier(first.nextFrontier, { alternatives: [orphan] }).nextFrontier.alternatives.length, 0); });
test("A1-07", "exact duplicate children deduplicate without hash collision semantics", () => { const first = transitionAllocationFrontier(allocationFrontierGenesis(), allocationFrontierFromBranches([regular])); const parent = first.nextFrontier.alternatives[0]; const child = { ...parent, parentAlternativeId: parent.alternativeId }; assert.equal(transitionAllocationFrontier(first.nextFrontier, { alternatives: [child, child] }).nextFrontier.alternatives.length, 1); });
test("A1-08", "terminal rolling anchor is retained", () => assert.equal(allocationFrontierAlternative(regular).rollingAnchor?.restIntervalId, "rest:regular"));
test("A1-09", "reduced source seed retains component and week identity", () => { const seed = allocationFrontierAlternative(reduced).reducedSourceSeeds[0]; assert.deepEqual([seed.componentId, seed.restIntervalId, seed.fixedWeekId], ["component:reduced", "rest:reduced", "2026-02-02"]); });
test("A1-10", "reduced source seed derives exact compensation difference", () => assert.equal(allocationFrontierAlternative(reduced).reducedSourceSeeds[0].requiredCompensationMilliseconds, 15 * 60 * 60 * 1000));
console.log(`allocation frontier A1: ${passed}/10 PASS`);
