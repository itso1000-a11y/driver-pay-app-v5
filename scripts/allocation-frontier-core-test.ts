import assert from "node:assert/strict";
import { allocationFrontierAlternative, allocationFrontierFromBranches, allocationFrontierGenesis, transitionAllocationFrontier } from "../src/rest-engine/allocation-frontier.ts";
import type { AllocationBranch } from "../src/rest-engine/types.ts";

function branch(id: string, reduced: boolean, anchor: number): AllocationBranch {
  const component = { componentId: `c-${id}`, restIntervalId: `r-${id}`, sourceOptionId: `o-${id}`, componentIndex: 0, startEpochMilliseconds: anchor - 45 * 3600000, endEpochMilliseconds: anchor, startOffsetMilliseconds: 0, endOffsetMilliseconds: 0, durationMilliseconds: reduced ? 36 * 3600000 : 45 * 3600000, classification: reduced ? "REDUCED" : "REGULAR", role: "COUNTED", provenance: "CONFIRMED", reviewStatus: "CLEAR", reviewReasons: [] };
  const assignment = { assignmentId: `a-${id}`, fixedWeekId: "2026-01-05", componentId: component.componentId, assignmentRole: "COUNTED_FOR_FIXED_WEEK", weekStartEpochMilliseconds: 0, weekEndEpochMilliseconds: 1 };
  return { branchId: id, branchFingerprint: `fp-${id}`, components: [component], fixedWeekAssignments: [assignment], additionalComponents: [], rollingQualifyingRests: [], rollingCycleResets: [{ evaluationId: `roll-${id}`, previousComponentId: component.componentId, nextComponentId: null, previousRestIntervalId: component.restIntervalId, nextRestIntervalId: null, previousQualifyingEndEpochMilliseconds: anchor, nextQualifyingStartEpochMilliseconds: null, dueEpochMilliseconds: anchor + 144 * 3600000, exactElapsedMilliseconds: null, status: "PENDING", reviewReasons: [] }], twoWeekEvaluations: [], reviewStatus: "CLEAR", reviewReasons: [], legalState: "PENDING", invalidReasons: [], sourceOptionIds: [component.sourceOptionId] } as unknown as AllocationBranch;
}
const a = branch("a", true, 1000); const b = branch("b", false, 2000);
const genesis = allocationFrontierGenesis(); const first = transitionAllocationFrontier(genesis, allocationFrontierFromBranches([a,b]));
assert.equal(first.nextFrontier.alternatives.length, 2, "T1 genesis retains reachable alternatives");
assert.equal(first.nextFrontier.alternatives.find(x => x.branchFingerprint === "fp-a")?.reducedSourceSeeds.length, 1, "T4 reduced source seed stays correlated");
assert.equal(first.nextFrontier.alternatives.find(x => x.branchFingerprint === "fp-b")?.reducedSourceSeeds.length, 0, "T4 no synthetic reduced seed");
const parent = first.nextFrontier.alternatives.find(x => x.branchFingerprint === "fp-a")!;
const child = allocationFrontierAlternative(a, parent.alternativeId); const second = transitionAllocationFrontier(first.nextFrontier, { alternatives: [child] });
assert.equal(second.nextFrontier.alternatives.length, 1, "T2 sequential transition retains matching child");
assert.equal(second.nextFrontier.alternatives[0].rollingAnchor?.endEpochMilliseconds, 1000, "T3 anchor remains correlated");
console.log("allocation frontier core: T1-T4 PASS");

import { allocationChoiceGenesis, extendAllocationChoices, type MaterializedChoice } from "../src/rest-engine/weekly-rest-allocation.ts";
const choice = (id: string): MaterializedChoice => ({ choiceId: id, components: [], assignments: [], sourceOptionIds: [id], reviewStatus: "CLEAR", reviewReasons: [] });
const sequential = extendAllocationChoices(extendAllocationChoices([allocationChoiceGenesis()], [choice("one")]), [choice("two")]);
const oneShot = extendAllocationChoices([allocationChoiceGenesis()], [choice("one"), choice("two")]);
assert.equal(sequential.length, 1, "T5 seedable extension executes sequentially");
assert.deepEqual(sequential[0].sourceOptionIds, ["one", "two"], "T5 preserves both correlated choice identities");
assert.equal(oneShot.length, 2, "T5 bounded group alternatives remain distinct");
console.log("seedable allocation primitive: T5 PASS");
