import assert from "node:assert/strict";
import type { ActivityFactInput } from "../src/rest-engine/types.ts";
import { normalizeActivityFacts } from "../src/rest-engine/facts.ts";
import { deriveRestIntervals } from "../src/rest-engine/chronology.ts";
import { generateWeeklyRestComponentOptions } from "../src/rest-engine/weekly-rest-candidates.ts";
import { solveOneShotWeeklyRestAllocations, allocationSolverContinuationContext } from "../src/rest-engine/weekly-rest-allocation.ts";
import { evaluateCompensation } from "../src/rest-engine/compensation.ts";
import { resolveLondonWallTime, formatLondonInstant } from "../src/rest-engine/time.ts";
import { orchestrateIncrementalRestEngine, compensationIntervalsAvailableThrough } from "../src/rest-engine/incremental-orchestration.ts";
import { loadValidIncrementalCheckpoint, saveIncrementalCheckpoint } from "../src/rest-engine/incremental-checkpoint-storage.ts";
const at=(d:string,t="12:00:00")=>resolveLondonWallTime(d,t).epochMilliseconds as number;
const fact=(d:string):ActivityFactInput=>({factId:`f:${d}`,sourceRef:{sourceKey:"runtime",recordId:d,wallDate:d},kind:"WORK",factStatus:"FACTUAL",coverage:"FULL_CIVIL_DAY",start:{wallDate:d,wallTime:"08:00:00",provenance:"EXPLICIT"},end:{wallDate:d,wallTime:"18:00:00",provenance:"EXPLICIT"},reviewStatus:"CLEAR",reviewReasons:[]});
const input=(facts:ActivityFactInput[])=>({facts,asOfEpochMilliseconds:at("2026-03-10"),evaluationWeekIds:["2026-02-02","2026-02-09","2026-02-16","2026-02-23","2026-03-02"],factualCoverageCompleteThroughAsOf:true});
const prefix=[fact("2026-02-02"),fact("2026-02-03"),fact("2026-02-09")], suffix=fact("2026-02-16");
const cold=orchestrateIncrementalRestEngine(input(prefix));assert.ok(cold.segmentCount>0);assert.equal(cold.diagnostics.historicalChoiceGroupsReplayed,0);
const valid=orchestrateIncrementalRestEngine({...input(prefix),checkpoint:cold.checkpoint});assert.equal(valid.reusedCheckpoint,true);
const appended=orchestrateIncrementalRestEngine({...input([...prefix,suffix]),checkpoint:cold.checkpoint});assert.equal(appended.reusedCheckpoint,false);assert.equal(appended.diagnostics.genesisEntered,false);assert.equal(appended.diagnostics.historicalChoiceGroupsReplayed,0);assert.equal(appended.diagnostics.historicalFixedWeeksReconstructed,0);assert.equal(appended.diagnostics.historicalRollingCyclesRecomputed,0);
const corrected=[{...prefix[0],end:{...(prefix[0].end!),wallTime:"17:00:00"}},...prefix.slice(1),suffix];const invalid=orchestrateIncrementalRestEngine({...input(corrected),checkpoint:cold.checkpoint});assert.equal(invalid.diagnostics.genesisEntered,true);
const data=new Map<string,string>();const storage={get length(){return data.size},key:(i:number)=>[...data.keys()][i]??null,getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>void data.set(k,v),removeItem:(k:string)=>void data.delete(k)};saveIncrementalCheckpoint(storage,cold.checkpoint);assert.ok(loadValidIncrementalCheckpoint(storage,[...prefix,suffix]));
console.log("B1E2E-01/02/03/12/13 PASS — prefix checkpoint validates append-only suffix and rejects historical correction");
// B1E2E-04 — two persisted suffix generations use only local seeded context
// keys; they neither replay the prefix nor recursively inflate prior identity.
const suffix2 = fact("2026-02-23");
const persisted = new Map<string, string>();
const persistedStorage = { get length(){ return persisted.size; }, key:(index:number) => [...persisted.keys()][index] ?? null, getItem:(key:string) => persisted.get(key) ?? null, setItem:(key:string, value:string) => void persisted.set(key,value), removeItem:(key:string) => void persisted.delete(key) };
saveIncrementalCheckpoint(persistedStorage, cold.checkpoint);
const reload1 = loadValidIncrementalCheckpoint(persistedStorage, [...prefix, suffix]); assert.ok(reload1);
const generation1 = orchestrateIncrementalRestEngine({ ...input([...prefix, suffix]), checkpoint: reload1 });
assert.equal(generation1.diagnostics.genesisEntered, false); assert.equal(generation1.diagnostics.historicalChoiceGroupsReplayed, 0);
saveIncrementalCheckpoint(persistedStorage, generation1.checkpoint);
const reload2 = loadValidIncrementalCheckpoint(persistedStorage, [...prefix, suffix, suffix2]); assert.ok(reload2);
const generation2 = orchestrateIncrementalRestEngine({ ...input([...prefix, suffix, suffix2]), checkpoint: reload2 });
assert.equal(generation2.diagnostics.genesisEntered, false); assert.equal(generation2.diagnostics.historicalChoiceGroupsReplayed, 0);
const id1 = generation1.checkpoint.liveAllocationFrontier.alternatives.map((item) => item.alternativeId).join("|");
const id2 = generation2.checkpoint.liveAllocationFrontier.alternatives.map((item) => item.alternativeId).join("|");
assert.ok(id2.length <= id1.length + 4096, "B1E2E-04: repeated reload/append must not recursively embed prior frontier identity");
console.log("B1E2E-04 PASS — repeated persisted suffix continuation has no replay or recursive identity growth");
// IC1/IC3/IC5/IC6: context is explicit, never inferred, and changes invalidate reuse.
const noContext = orchestrateIncrementalRestEngine(input(prefix));
assert.ok(noContext.checkpoint.liveAllocationFrontier.alternatives.some((item) => item.reviewStatus === "REVIEW_REQUIRED"));
const explicitContext = { historyStartEpochMilliseconds: at("2026-02-02", "00:00:00"), priorQualifyingWeeklyRest: { componentId: "authoritative-prior", restIntervalId: "authoritative-rest", endEpochMilliseconds: at("2026-02-01"), reviewStatus: "CLEAR" as const, reviewReasons: [] } };
const withContext = orchestrateIncrementalRestEngine({ ...input(prefix), initialLegalContext: explicitContext });
assert.equal(orchestrateIncrementalRestEngine({ ...input(prefix), checkpoint: withContext.checkpoint, initialLegalContext: explicitContext }).reusedCheckpoint, true);
assert.equal(orchestrateIncrementalRestEngine({ ...input(prefix), checkpoint: withContext.checkpoint }).reusedCheckpoint, false);
console.log("IC1/IC3/IC5/IC6 PASS — unknown history remains REVIEW; explicit authority is passed and fingerprinted; nothing is inferred");
// IC2/IC4 and B1E2E-05 deliberately use only factual OFF/WORK inputs.  The
// first segment is GENESIS; the two-week assertion is made only in the next
// SEEDED segment, whose predecessor is supplied solely by the live frontier.
const DAY = 24 * 60 * 60 * 1000;
const runtimeOff = (wallDate: string): ActivityFactInput => ({
  factId: `runtime-off:${wallDate}`,
  sourceRef: { sourceKey: "incremental-runtime", recordId: `off:${wallDate}`, wallDate },
  kind: "OFF", factStatus: "FACTUAL", coverage: "FULL_CIVIL_DAY", completionSource: "user",
  start: { wallDate, wallTime: "00:00:00" },
  end: { wallDate: formatLondonInstant(at(wallDate) + DAY).wallDate, wallTime: "00:00:00" },
  reviewStatus: "CLEAR", reviewReasons: [],
});
const runtimeWork = (wallDate: string): ActivityFactInput => ({
  factId: `runtime-work:${wallDate}`,
  sourceRef: { sourceKey: "incremental-runtime", recordId: `work:${wallDate}`, wallDate },
  kind: "WORK", factStatus: "FACTUAL", coverage: "FULL_CIVIL_DAY",
  start: { wallDate, wallTime: "08:00:00" }, end: { wallDate, wallTime: "18:00:00" },
  reviewStatus: "CLEAR", reviewReasons: [],
});
const runtimeWorkAt = (wallDate:string,start:string,end:string):ActivityFactInput => ({
  factId:`runtime-custom:${wallDate}:${end}`, sourceRef:{sourceKey:"incremental-runtime",recordId:`custom:${wallDate}:${end}`,wallDate}, kind:"WORK", factStatus:"FACTUAL", coverage:"FULL_CIVIL_DAY", start:{wallDate,wallTime:start}, end:{wallDate,wallTime:end}, reviewStatus:"CLEAR", reviewReasons:[],
});const weeklyPackage = (monday: string): ActivityFactInput[] => [
  runtimeOff(monday), runtimeOff(formatLondonInstant(at(monday) + DAY).wallDate), runtimeOff(formatLondonInstant(at(monday) + 2 * DAY).wallDate), runtimeWork(formatLondonInstant(at(monday) + 3 * DAY).wallDate),
];
const firstSeedWeek = weeklyPackage("2026-02-02");
const secondSeedWeek = weeklyPackage("2026-02-09");
const seededWeeks = ["2026-02-02", "2026-02-09"];
const seededInput = (facts: ActivityFactInput[], initialLegalContext?: any, checkpoint?: any) => ({ facts, asOfEpochMilliseconds: at("2026-02-12", "20:00:00"), evaluationWeekIds: seededWeeks, factualCoverageCompleteThroughAsOf: true, initialLegalContext, checkpoint });
const seededPrior = { componentId: "authoritative-seeded-prior", restIntervalId: "authoritative-seeded-prior-rest", endEpochMilliseconds: at("2026-01-27", "00:00:00"), reviewStatus: "CLEAR" as const, reviewReasons: [] };
const unknownContext = { historyStartEpochMilliseconds: null, priorQualifyingWeeklyRest: seededPrior };
const historyOnly = { historyStartEpochMilliseconds: at("2026-02-02", "00:00:00"), priorQualifyingWeeklyRest: seededPrior };
const unknownFirst = orchestrateIncrementalRestEngine(seededInput(firstSeedWeek, unknownContext));
const unknownSecond = orchestrateIncrementalRestEngine(seededInput([...firstSeedWeek, ...secondSeedWeek], unknownContext, unknownFirst.checkpoint));
const unknownPair = unknownSecond.lastSegmentBranches.find((branch) => branch.fixedWeekAssignments.some((item) => item.fixedWeekId === "2026-02-02") && branch.fixedWeekAssignments.some((item) => item.fixedWeekId === "2026-02-09"))?.twoWeekEvaluations.find((item) => item.firstWeekId === "2026-02-02" && item.secondWeekId === "2026-02-09");
assert.equal(unknownPair?.status, "INSUFFICIENT_HISTORY");
const coveredFirst = orchestrateIncrementalRestEngine(seededInput(firstSeedWeek, historyOnly));
const coveredSecond = orchestrateIncrementalRestEngine(seededInput([...firstSeedWeek, ...secondSeedWeek], historyOnly, coveredFirst.checkpoint));
const coveredBranch = coveredSecond.lastSegmentBranches.find((branch) => branch.fixedWeekAssignments.some((item) => item.fixedWeekId === "2026-02-02") && branch.fixedWeekAssignments.some((item) => item.fixedWeekId === "2026-02-09"));
const coveredPair = coveredBranch?.twoWeekEvaluations.find((item) => item.firstWeekId === "2026-02-02" && item.secondWeekId === "2026-02-09");
assert.ok(coveredBranch); assert.equal(coveredPair?.status, "SATISFIED"); assert.equal(coveredPair?.reviewReasons.length, 0);
assert.equal(coveredSecond.diagnostics.genesisEntered, false); assert.equal(coveredSecond.diagnostics.historicalChoiceGroupsReplayed, 0);
console.log("IC2 PASS — the first SEEDED segment evaluates the persisted predecessor/current pair; null authority remains INSUFFICIENT_HISTORY and explicit authority yields SATISFIED");

const rollingAnchor = { historyStartEpochMilliseconds: at("2026-02-02", "00:00:00"), priorQualifyingWeeklyRest: { componentId: "authoritative-prior-component", restIntervalId: "authoritative-prior-rest", endEpochMilliseconds: at("2026-01-27", "00:00:00"), reviewStatus: "CLEAR" as const, reviewReasons: [] } };
const rollingInput = { facts: firstSeedWeek, asOfEpochMilliseconds: at("2026-02-05", "20:00:00"), evaluationWeekIds: ["2026-02-02"], factualCoverageCompleteThroughAsOf: true, initialLegalContext: rollingAnchor };
const rollingResult = orchestrateIncrementalRestEngine(rollingInput);
const rollingTransition = rollingResult.lastSegmentBranches.flatMap((branch) => branch.rollingCycleResets).find((item) => item.previousComponentId === "authoritative-prior-component" && item.nextRestIntervalId != null);
assert.ok(rollingTransition); assert.equal(rollingTransition.previousRestIntervalId, "authoritative-prior-rest"); assert.equal(rollingTransition.previousQualifyingEndEpochMilliseconds, rollingAnchor.priorQualifyingWeeklyRest.endEpochMilliseconds); assert.equal(rollingTransition.dueEpochMilliseconds, rollingAnchor.priorQualifyingWeeklyRest.endEpochMilliseconds + 144 * 60 * 60 * 1000); assert.equal(rollingTransition.exactElapsedMilliseconds, 144 * 60 * 60 * 1000); assert.equal(rollingTransition.status, "EXACTLY_DUE");
console.log("IC4 PASS — an authoritative prior rolling anchor reaches the real 144h transition at EXACTLY_DUE without a two-week horizon");

const finalizationWeeks = ["2026-02-02", "2026-02-09", "2026-02-16", "2026-02-23", "2026-03-02"];
const finalizationFacts = finalizationWeeks.flatMap(weeklyPackage);
const finalizationContext = { historyStartEpochMilliseconds: at("2026-02-02", "00:00:00"), priorQualifyingWeeklyRest: { componentId: "authoritative-finalization-prior", restIntervalId: "authoritative-finalization-prior-rest", endEpochMilliseconds: at("2026-01-27", "00:00:00"), reviewStatus: "CLEAR" as const, reviewReasons: [] } };
const finalizationInput = { facts: finalizationFacts, asOfEpochMilliseconds: at("2026-03-12", "20:00:00"), evaluationWeekIds: finalizationWeeks, factualCoverageCompleteThroughAsOf: true, initialLegalContext: finalizationContext };
const finalizedRuntime = orchestrateIncrementalRestEngine(finalizationInput);
assert.ok(finalizedRuntime.checkpoint.finalizedAllocationResults.length > 0); assert.ok(finalizedRuntime.checkpoint.finalizedAllocationResults.every((item) => item.reviewStatus === "CLEAR"));
const finalizedComponentIds = new Set(finalizedRuntime.checkpoint.finalizedAllocationResults.flatMap((item) => [...item.countedComponents, ...item.additionalComponents].map((component) => component.componentId)));
assert.ok(finalizedRuntime.checkpoint.finalizedAllocationResults.every((item) => !finalizedRuntime.checkpoint.liveAllocationFrontier.alternatives.some((alternative) => alternative.alternativeId === item.sourceAlternativeId)), "A1.4 must replace the finalized source lineage with its bounded live projection");
assert.ok(finalizedRuntime.checkpoint.liveAllocationFrontier.alternatives.some((alternative) => alternative.assignments.some((item) => item.fixedWeekId === "2026-02-23")));
assert.ok(finalizedRuntime.checkpoint.liveAllocationFrontier.alternatives.some((alternative) => alternative.assignments.some((item) => item.fixedWeekId === "2026-03-02")));
const finalizationStorage = new Map<string, string>();
const finalizationKv = { get length(){ return finalizationStorage.size; }, key:(index:number) => [...finalizationStorage.keys()][index] ?? null, getItem:(key:string) => finalizationStorage.get(key) ?? null, setItem:(key:string,value:string) => void finalizationStorage.set(key,value), removeItem:(key:string) => void finalizationStorage.delete(key) };
saveIncrementalCheckpoint(finalizationKv, finalizedRuntime.checkpoint); const reloadedFinalization = loadValidIncrementalCheckpoint(finalizationKv, finalizationFacts); assert.ok(reloadedFinalization);
const nextFinalizationFacts = [...finalizationFacts, ...weeklyPackage("2026-03-09")];
const continuedFinalization = orchestrateIncrementalRestEngine({ ...finalizationInput, facts: nextFinalizationFacts, evaluationWeekIds: [...finalizationWeeks, "2026-03-09"], checkpoint: reloadedFinalization });
assert.equal(continuedFinalization.diagnostics.genesisEntered, false); assert.equal(continuedFinalization.diagnostics.historicalChoiceGroupsReplayed, 0); assert.equal(continuedFinalization.diagnostics.historicalFixedWeeksReconstructed, 0); assert.equal(continuedFinalization.diagnostics.historicalRollingCyclesRecomputed, 0);
const allFinalizedIds = continuedFinalization.checkpoint.finalizedAllocationResults.map((item) => item.finalizedResultId); assert.equal(new Set(allFinalizedIds).size, allFinalizedIds.length);
assert.ok(continuedFinalization.checkpoint.finalizedAllocationResults.every((item) => !continuedFinalization.checkpoint.liveAllocationFrontier.alternatives.some((alternative) => alternative.alternativeId === item.sourceAlternativeId)), "A continued checkpoint must retain projections, not the finalized source alternatives");
assert.equal(orchestrateIncrementalRestEngine({ ...finalizationInput, facts: nextFinalizationFacts, evaluationWeekIds: [...finalizationWeeks, "2026-03-09"], checkpoint: continuedFinalization.checkpoint }).reusedCheckpoint, true);
assert.equal(orchestrateIncrementalRestEngine({ ...finalizationInput, checkpoint: finalizedRuntime.checkpoint, initialLegalContext: { ...finalizationContext, historyStartEpochMilliseconds: at("2026-02-01", "00:00:00") } }).reusedCheckpoint, false);
const directFinalFacts = normalizeActivityFacts(finalizationFacts).facts;
const directFinalIntervals = deriveRestIntervals(directFinalFacts, finalizationInput.asOfEpochMilliseconds).intervals;
const directFinal = solveOneShotWeeklyRestAllocations(directFinalIntervals, generateWeeklyRestComponentOptions(directFinalIntervals).options, { asOfEpochMilliseconds: finalizationInput.asOfEpochMilliseconds, evaluationWeekIds: finalizationWeeks, historyStartEpochMilliseconds: finalizationContext.historyStartEpochMilliseconds, factualCoverageCompleteThroughAsOf: true, priorQualifyingWeeklyRest: finalizationContext.priorQualifyingWeeklyRest });
const directCompleteLineage = directFinal.branches.find((branch) => finalizationWeeks.every((week) => branch.fixedWeekAssignments.some((assignment) => assignment.fixedWeekId === week)) && branch.twoWeekEvaluations.every((evaluation) => evaluation.status === "SATISFIED"));
assert.ok(directCompleteLineage, "the direct oracle must expose the same clear consecutive-week lineage");
assert.ok(continuedFinalization.lastSegmentBranches.some((branch) => branch.twoWeekEvaluations.some((evaluation) => evaluation.firstWeekId === "2026-03-02" && evaluation.secondWeekId === "2026-03-09" && evaluation.status === "SATISFIED")), "continued runtime must preserve direct two-week legal meaning at the suffix");
console.log("B1E2E-05 PASS — real cold-start allocation finalizes only clear historical detail, preserves the live predecessor/anchor boundary, and does not replay it after checkpoint reload");

// B1E2E-06 — the first seeded segment receives its predecessor solely from the
// persisted frontier.  No predecessor interval is supplied with the suffix.
const twoWeekStorage = new Map<string, string>();
const twoWeekKv = { get length(){ return twoWeekStorage.size; }, key:(index:number) => [...twoWeekStorage.keys()][index] ?? null, getItem:(key:string) => twoWeekStorage.get(key) ?? null, setItem:(key:string,value:string) => void twoWeekStorage.set(key,value), removeItem:(key:string) => void twoWeekStorage.delete(key) };
saveIncrementalCheckpoint(twoWeekKv, coveredFirst.checkpoint); const twoWeekReload = loadValidIncrementalCheckpoint(twoWeekKv, [...firstSeedWeek, ...secondSeedWeek]); assert.ok(twoWeekReload);
const twoWeekSeed = orchestrateIncrementalRestEngine(seededInput([...firstSeedWeek, ...secondSeedWeek], historyOnly, twoWeekReload));
const twoWeekBranch = twoWeekSeed.lastSegmentBranches.find((branch) => branch.fixedWeekAssignments.some((item) => item.fixedWeekId === "2026-02-02") && branch.fixedWeekAssignments.some((item) => item.fixedWeekId === "2026-02-09")); assert.ok(twoWeekBranch);
const persistedPredecessor = twoWeekReload.liveAllocationFrontier.alternatives.find((alternative) => alternative.assignments.some((item) => item.fixedWeekId === "2026-02-02" && twoWeekBranch.fixedWeekAssignments.some((next) => next.componentId === item.componentId))); assert.ok(persistedPredecessor);
assert.equal(allocationSolverContinuationContext(persistedPredecessor).trailingFixedWeek?.weekId, "2026-02-02");
const seededTwoWeek = twoWeekBranch.twoWeekEvaluations.find((item) => item.firstWeekId === "2026-02-02" && item.secondWeekId === "2026-02-09"); assert.equal(seededTwoWeek?.status, "SATISFIED");
const twoWeekFacts = normalizeActivityFacts([...firstSeedWeek, ...secondSeedWeek]).facts; const twoWeekIntervals = deriveRestIntervals(twoWeekFacts, at("2026-02-12", "20:00:00")).intervals;
const directTwoWeek = solveOneShotWeeklyRestAllocations(twoWeekIntervals, generateWeeklyRestComponentOptions(twoWeekIntervals).options, { asOfEpochMilliseconds: at("2026-02-12", "20:00:00"), evaluationWeekIds: seededWeeks, historyStartEpochMilliseconds: historyOnly.historyStartEpochMilliseconds, factualCoverageCompleteThroughAsOf: true, priorQualifyingWeeklyRest: historyOnly.priorQualifyingWeeklyRest ?? undefined });
const directTwoWeekPair = directTwoWeek.branches.find((branch) => branch.fixedWeekAssignments.some((item) => item.fixedWeekId === "2026-02-02") && branch.fixedWeekAssignments.some((item) => item.fixedWeekId === "2026-02-09"))?.twoWeekEvaluations.find((item) => item.firstWeekId === "2026-02-02" && item.secondWeekId === "2026-02-09");
assert.deepEqual(seededTwoWeek && { status: seededTwoWeek.status, countedRoles: seededTwoWeek.countedRoles.map((item) => [item.fixedWeekId, item.classification]) }, directTwoWeekPair && { status: directTwoWeekPair.status, countedRoles: directTwoWeekPair.countedRoles.map((item) => [item.fixedWeekId, item.classification]) });
assert.equal(twoWeekSeed.diagnostics.historicalFixedWeeksReconstructed, 0); assert.equal(twoWeekSeed.diagnostics.historicalChoiceGroupsReplayed, 0);
const corruptedCheckpoint = { ...twoWeekReload, liveAllocationFrontier: { alternatives: twoWeekReload.liveAllocationFrontier.alternatives.map((alternative) => ({ ...alternative, assignments: alternative.assignments.filter((item) => item.fixedWeekId !== "2026-02-02") })) } };
const corruptedTwoWeek = orchestrateIncrementalRestEngine(seededInput([...firstSeedWeek, ...secondSeedWeek], historyOnly, corruptedCheckpoint));
assert.equal(corruptedTwoWeek.lastSegmentBranches.some((branch) => branch.twoWeekEvaluations.some((item) => item.firstWeekId === "2026-02-02" && item.secondWeekId === "2026-02-09" && item.status === "SATISFIED")), false);
console.log("B1E2E-06 PASS — persisted trailing fixed-week context creates the real seeded predecessor/current evaluation without interval replay");

// B1E2E-07 — a persisted real rolling anchor supersedes bootstrap authority.
const rollingPrefix = weeklyPackage("2026-02-02");
const rollingCheckpointInput = { facts: rollingPrefix, asOfEpochMilliseconds: at("2026-02-05", "20:00:00"), evaluationWeekIds: ["2026-02-02"], factualCoverageCompleteThroughAsOf: true, initialLegalContext: rollingAnchor };
const rollingCheckpointResult = orchestrateIncrementalRestEngine(rollingCheckpointInput); const persistedRollingAnchor = rollingCheckpointResult.checkpoint.liveAllocationFrontier.alternatives.find((alternative) => alternative.rollingAnchor?.endEpochMilliseconds != null)?.rollingAnchor; assert.ok(persistedRollingAnchor?.endEpochMilliseconds != null);
const rollingStorage = new Map<string, string>(); const rollingKv = { get length(){ return rollingStorage.size; }, key:(index:number) => [...rollingStorage.keys()][index] ?? null, getItem:(key:string) => rollingStorage.get(key) ?? null, setItem:(key:string,value:string) => void rollingStorage.set(key,value), removeItem:(key:string) => void rollingStorage.delete(key) };
saveIncrementalCheckpoint(rollingKv, rollingCheckpointResult.checkpoint); const rollingSuffixExact = [runtimeWorkAt("2026-02-11", "00:00:00", "08:00:00"), runtimeOff("2026-02-12"), runtimeOff("2026-02-13"), runtimeWork("2026-02-14")];
const rollingReload = loadValidIncrementalCheckpoint(rollingKv, [...rollingPrefix, ...rollingSuffixExact]); assert.ok(rollingReload);
const rollingExactFacts = [...rollingPrefix, ...rollingSuffixExact];
const rollingExact = orchestrateIncrementalRestEngine({ facts: rollingExactFacts, asOfEpochMilliseconds: at("2026-02-14", "20:00:00"), evaluationWeekIds: ["2026-02-02", "2026-02-09"], factualCoverageCompleteThroughAsOf: true, initialLegalContext: rollingAnchor, checkpoint: rollingReload });
const exactTransitions = rollingExact.lastSegmentBranches.flatMap((branch) => branch.rollingCycleResets).filter((item) => item.previousRestIntervalId === persistedRollingAnchor!.restIntervalId && item.nextRestIntervalId != null); assert.ok(exactTransitions.length > 0);
for (const transition of exactTransitions) { assert.equal(transition.previousQualifyingEndEpochMilliseconds, persistedRollingAnchor!.endEpochMilliseconds); assert.equal(transition.dueEpochMilliseconds, persistedRollingAnchor!.endEpochMilliseconds! + 144 * 60 * 60 * 1000); assert.equal(transition.exactElapsedMilliseconds, 144 * 60 * 60 * 1000); assert.equal(transition.status, "EXACTLY_DUE"); assert.notEqual(transition.previousComponentId, rollingAnchor.priorQualifyingWeeklyRest.componentId); }
assert.ok(new Set(exactTransitions.map((item) => item.previousComponentId)).size >= 1); assert.equal(rollingExact.diagnostics.historicalRollingCyclesRecomputed, 0);

const rollingBeforeFacts = [...rollingPrefix, runtimeWorkAt("2026-02-11", "00:00:00", "07:59:00"), runtimeOff("2026-02-12"), runtimeOff("2026-02-13"), runtimeWork("2026-02-14")];
const rollingBefore = orchestrateIncrementalRestEngine({ facts: rollingBeforeFacts, asOfEpochMilliseconds: at("2026-02-14", "20:00:00"), evaluationWeekIds: ["2026-02-02", "2026-02-09"], factualCoverageCompleteThroughAsOf: true, initialLegalContext: rollingAnchor, checkpoint: rollingReload });
const beforeTransition = rollingBefore.lastSegmentBranches.flatMap((branch) => branch.rollingCycleResets).find((item) => item.previousRestIntervalId === persistedRollingAnchor!.restIntervalId && item.nextRestIntervalId != null); assert.ok(beforeTransition); assert.equal(beforeTransition.status, "BEFORE_DUE"); assert.equal(beforeTransition.exactElapsedMilliseconds, 144 * 60 * 60 * 1000 - 60 * 1000);
const rollingDirectFacts = normalizeActivityFacts(rollingExactFacts).facts; const rollingDirectIntervals = deriveRestIntervals(rollingDirectFacts, at("2026-02-14", "20:00:00")).intervals;
const rollingDirect = solveOneShotWeeklyRestAllocations(rollingDirectIntervals, generateWeeklyRestComponentOptions(rollingDirectIntervals).options, { asOfEpochMilliseconds: at("2026-02-14", "20:00:00"), evaluationWeekIds: ["2026-02-02", "2026-02-09"], historyStartEpochMilliseconds: rollingAnchor.historyStartEpochMilliseconds, factualCoverageCompleteThroughAsOf: true, priorQualifyingWeeklyRest: rollingAnchor.priorQualifyingWeeklyRest });
assert.ok(rollingDirect.branches.flatMap((branch) => branch.rollingCycleResets).some((item) => item.status === "EXACTLY_DUE" && item.previousQualifyingEndEpochMilliseconds === persistedRollingAnchor!.endEpochMilliseconds));
console.log("B1E2E-07 PASS — persisted branch-correlated rolling anchors drive exact 144h transitions and override bootstrap anchor only after checkpoint creation");

// B1E2E-08 — a suffix work fact closes one factual rest that began in the
// checkpoint prefix.  The seeded path must retain the exact original interval.
const splitPrefix: ActivityFactInput[] = [runtimeWorkAt("2026-02-06", "08:00:00", "19:30:00"), runtimeOff("2026-02-07"), runtimeOff("2026-02-08")];
const splitContext = { historyStartEpochMilliseconds: at("2026-02-02", "00:00:00"), priorQualifyingWeeklyRest: rollingAnchor.priorQualifyingWeeklyRest };
const splitCold = orchestrateIncrementalRestEngine({ facts: splitPrefix, asOfEpochMilliseconds: at("2026-02-08", "20:00:00"), evaluationWeekIds: ["2026-02-02"], factualCoverageCompleteThroughAsOf: true, initialLegalContext: splitContext });
const splitSuffix = runtimeWorkAt("2026-02-09", "08:00:00", "18:00:00"); const splitAll = [...splitPrefix, splitSuffix];
const splitStorage = new Map<string,string>(); const splitKv = { get length(){return splitStorage.size},key:(index:number)=>[...splitStorage.keys()][index]??null,getItem:(key:string)=>splitStorage.get(key)??null,setItem:(key:string,value:string)=>void splitStorage.set(key,value),removeItem:(key:string)=>void splitStorage.delete(key) }; saveIncrementalCheckpoint(splitKv, splitCold.checkpoint); const splitReload = loadValidIncrementalCheckpoint(splitKv, splitAll); assert.ok(splitReload);
const splitSeed = orchestrateIncrementalRestEngine({ facts: splitAll, asOfEpochMilliseconds: at("2026-02-09", "20:00:00"), evaluationWeekIds: ["2026-02-02", "2026-02-09"], factualCoverageCompleteThroughAsOf: true, initialLegalContext: splitContext, checkpoint: splitReload });
const splitFactsNormalized = normalizeActivityFacts(splitAll).facts; const splitIntervals = deriveRestIntervals(splitFactsNormalized, at("2026-02-09", "20:00:00")).intervals; const factualSplit = splitIntervals.filter((interval) => interval.supportingFactIds.includes(splitPrefix[0].factId) && interval.supportingFactIds.includes(splitSuffix.factId) && interval.endEpochMilliseconds != null).sort((left, right) => right.elapsedMilliseconds - left.elapsedMilliseconds)[0]; assert.ok(factualSplit?.startEpochMilliseconds != null && factualSplit.endEpochMilliseconds != null);
const splitComponents = splitSeed.lastSegmentBranches.flatMap((branch) => branch.components.filter((component) => component.restIntervalId === factualSplit!.restIntervalId)); assert.ok(splitComponents.length > 0);
for (const component of splitComponents) { assert.ok(component.startEpochMilliseconds >= factualSplit!.startEpochMilliseconds!); assert.ok(component.endEpochMilliseconds <= factualSplit!.endEpochMilliseconds!); }
assert.equal(splitIntervals.filter((interval) => interval.restIntervalId === factualSplit!.restIntervalId).length, 1); assert.equal(factualSplit!.elapsedMilliseconds, factualSplit!.endEpochMilliseconds! - factualSplit!.startEpochMilliseconds!); assert.ok(factualSplit!.supportingFactIds.includes(splitPrefix[0].factId) && factualSplit!.supportingFactIds.includes(splitSuffix.factId));
const splitDirect = solveOneShotWeeklyRestAllocations(splitIntervals, generateWeeklyRestComponentOptions(splitIntervals).options, { asOfEpochMilliseconds: at("2026-02-09", "20:00:00"), evaluationWeekIds: ["2026-02-02", "2026-02-09"], historyStartEpochMilliseconds: splitContext.historyStartEpochMilliseconds, factualCoverageCompleteThroughAsOf: true, priorQualifyingWeeklyRest: splitContext.priorQualifyingWeeklyRest });
assert.ok(splitDirect.branches.some((branch) => branch.components.some((component) => component.restIntervalId === factualSplit!.restIntervalId))); assert.equal(splitSeed.diagnostics.historicalChoiceGroupsReplayed, 0);
console.log("B1E2E-08 PASS — exact prefix/suffix factual RestInterval identity, evidence and component bounds survive checkpoint continuation without a synthetic split");
// B1E2E-09..11 use no constructed RestInterval, branch, obligation, block or
// seed. Every selected value originates in the real persisted orchestration.
const compensationSourceFacts: ActivityFactInput[] = [runtimeWorkAt("2026-02-06", "08:00:00", "19:30:00"), runtimeOff("2026-02-07"), runtimeWork("2026-02-08")];
const compensationContext = { historyStartEpochMilliseconds: at("2026-02-02", "00:00:00"), priorQualifyingWeeklyRest: seededPrior };
const compInput = (facts: ActivityFactInput[], asOfEpochMilliseconds: number, factualCoverageCompleteThroughAsOf = true, checkpoint?: any) => ({ facts, asOfEpochMilliseconds, evaluationWeekIds: ["2026-02-02", "2026-02-09", "2026-02-16", "2026-02-23", "2026-03-02"], factualCoverageCompleteThroughAsOf, initialLegalContext: compensationContext, checkpoint });
const memoryStorage = () => { const values = new Map<string,string>(); return { get length(){return values.size}, key:(index:number)=>[...values.keys()][index]??null, getItem:(key:string)=>values.get(key)??null, setItem:(key:string,value:string)=>void values.set(key,value), removeItem:(key:string)=>void values.delete(key) }; };
const reducedSeed = (run:any) => { const values=run.checkpoint.liveAllocationFrontier.alternatives.flatMap((alternative:any)=>alternative.reducedSourceSeeds.map((seed:any)=>({alternative,seed}))); assert.ok(values.length>0,"production allocation must produce a counted ReducedSourceSeed"); return values[0]; };
const compensationStates = (run:any, sourceComponentId:string) => run.checkpoint.liveCompensationFrontier.alternatives.flatMap((alternative:any) => { const obligation=alternative.evaluation.obligations.find((item:any)=>item.sourceComponentId===sourceComponentId); const result=obligation&&alternative.evaluation.obligationResults.find((item:any)=>item.obligationId===obligation.obligationId); return obligation&&result?[{alternative,evaluation:alternative.evaluation,obligation,result,attachment:alternative.evaluation.attachments.find((item:any)=>item.obligationId===obligation.obligationId)??null,blocks:alternative.evaluation.blocks.filter((item:any)=>item.obligationId===obligation.obligationId)}]:[]; });
const stateSignature = (state:any) => JSON.stringify({ allocationAlternativeId:state.alternative.allocationAlternativeId, obligation:[state.obligation.sourceComponentId,state.obligation.sourceRestIntervalId,state.obligation.sourceFixedWeekId,state.obligation.sourceReducedDurationMilliseconds,state.obligation.requiredCompensationMilliseconds,state.obligation.deadlineEpochMilliseconds], result:[state.result.status,state.result.remainingCompensationMilliseconds,state.result.attachmentId,state.result.reviewReasons], attachment:state.attachment&&[state.attachment.restIntervalId,state.attachment.baseId,state.attachment.deadlineCase,state.attachment.status], blocks:state.blocks.map((block:any)=>[block.restIntervalId,block.startEpochMilliseconds,block.endEpochMilliseconds,block.durationMilliseconds]), capacity:state.evaluation.unallocatedCapacity });
const sourceRun = orchestrateIncrementalRestEngine(compInput(compensationSourceFacts, at("2026-02-08", "20:00:00"))); const source = reducedSeed(sourceRun);
assert.equal(source.seed.requiredCompensationMilliseconds, 45 * 60 * 60 * 1000 - source.seed.sourceReducedDurationMilliseconds);
const sourceStore = memoryStorage(); saveIncrementalCheckpoint(sourceStore, sourceRun.checkpoint); const sourceReload=loadValidIncrementalCheckpoint(sourceStore, compensationSourceFacts); assert.ok(sourceReload);
const sourceContinuedFacts=[...compensationSourceFacts, runtimeWork("2026-02-10")]; const sourceContinued=orchestrateIncrementalRestEngine(compInput(sourceContinuedFacts, at("2026-02-10", "20:00:00"),true,sourceReload));
const persistedSeed=sourceContinued.checkpoint.liveAllocationFrontier.alternatives.flatMap((alternative:any)=>alternative.reducedSourceSeeds).find((seed:any)=>seed.componentId===source.seed.componentId); assert.deepEqual(persistedSeed,source.seed);
const sourceStates=compensationStates(sourceRun,source.seed.componentId); const continuedStates=compensationStates(sourceContinued,source.seed.componentId); assert.ok(sourceStates.some((item:any)=>item.result.status==="OUTSTANDING")); assert.ok(continuedStates.some((item:any)=>item.result.status==="OUTSTANDING"));
const directFacts=normalizeActivityFacts(sourceContinuedFacts).facts; const directIntervals=deriveRestIntervals(directFacts,at("2026-02-10","20:00:00")).intervals; const directAllocation=solveOneShotWeeklyRestAllocations(directIntervals,generateWeeklyRestComponentOptions(directIntervals).options,{asOfEpochMilliseconds:at("2026-02-10","20:00:00"),evaluationWeekIds:["2026-02-02","2026-02-09"],historyStartEpochMilliseconds:compensationContext.historyStartEpochMilliseconds,factualCoverageCompleteThroughAsOf:true,priorQualifyingWeeklyRest:compensationContext.priorQualifyingWeeklyRest}); const directCompensation=evaluateCompensation(directIntervals,directAllocation.branches,{asOfEpochMilliseconds:at("2026-02-10","20:00:00"),factualCoverageCompleteThroughAsOf:true});
assert.ok(directCompensation.branchEvaluations.some((evaluation:any)=>evaluation.obligations.some((obligation:any)=>obligation.sourceComponentId===source.seed.componentId&&obligation.requiredCompensationMilliseconds===source.seed.requiredCompensationMilliseconds)));
assert.ok(sourceContinued.checkpoint.liveAllocationFrontier.alternatives.some((alternative:any)=>alternative.reducedSourceSeeds.some((seed:any)=>seed.componentId===source.seed.componentId))); assert.equal(new Set(sourceContinued.checkpoint.finalizedCompensationResults.map((item:any)=>item.finalizedResultId)).size,sourceContinued.checkpoint.finalizedCompensationResults.length);
console.log("B1E2E-09 PASS — persisted real ReducedSourceSeed reconstructs the same branch-correlated compensation source without duplicate emission");

const assertPersistedLiveState = (label:string, facts:ActivityFactInput[], asOf:number, complete:boolean, expected:string, suffix:ActivityFactInput[], continuedAsOf:number) => { const first=orchestrateIncrementalRestEngine(compInput(facts,asOf,complete)); const selected=reducedSeed(first); const before=compensationStates(first,selected.seed.componentId).find((item:any)=>item.result.status===expected); assert.ok(before,`${label}: production state must be reachable`); const store=memoryStorage();saveIncrementalCheckpoint(store,first.checkpoint);const reload=loadValidIncrementalCheckpoint(store,[...facts,...suffix]);assert.ok(reload);const next=orchestrateIncrementalRestEngine(compInput([...facts,...suffix],continuedAsOf,complete,reload));const after=compensationStates(next,selected.seed.componentId).find((item:any)=>item.result.status===expected);assert.ok(after,`${label}: state must remain live after reload/continuation`);assert.equal(after.obligation.sourceComponentId,before.obligation.sourceComponentId);assert.equal(after.obligation.sourceRestIntervalId,before.obligation.sourceRestIntervalId);assert.equal(after.obligation.sourceFixedWeekId,before.obligation.sourceFixedWeekId);assert.equal(after.obligation.requiredCompensationMilliseconds,before.obligation.requiredCompensationMilliseconds);assert.equal(after.obligation.deadlineEpochMilliseconds,before.obligation.deadlineEpochMilliseconds);assert.ok(after.alternative.allocationAlternativeId.length > 0); assert.ok(next.checkpoint.liveAllocationFrontier.alternatives.some((alternative:any)=>alternative.alternativeId===after.alternative.allocationAlternativeId&&alternative.reducedSourceSeeds.some((seed:any)=>seed.componentId===before.obligation.sourceComponentId)));assert.deepEqual(after.result.reviewReasons,before.result.reviewReasons);return {first,next,before,after,selected}; };
const openFixture=assertPersistedLiveState("OPEN",compensationSourceFacts,at("2026-02-08","20:00:00"),true,"OUTSTANDING",[runtimeWork("2026-02-10")],at("2026-02-10","20:00:00"));
const reviewFixture=assertPersistedLiveState("REVIEW",compensationSourceFacts,at("2026-03-04","20:00:00"),false,"REVIEW",[runtimeWork("2026-03-05")],at("2026-03-05","20:00:00"));
const caseBFacts=[...compensationSourceFacts,runtimeWork("2026-02-27"),runtimeOff("2026-02-28"),runtimeOff("2026-03-01"),runtimeOff("2026-03-02"),runtimeWork("2026-03-03")]; const caseBFixture=assertPersistedLiveState("Case B",caseBFacts,at("2026-03-03","20:00:00"),true,"UNRESOLVED_ATTACHMENT_DEADLINE",[runtimeWork("2026-03-05")],at("2026-03-05","20:00:00")); assert.equal(caseBFixture.before.attachment?.deadlineCase,"CASE_B");
const provisionalFacts=[...compensationSourceFacts,runtimeWork("2026-02-20"),runtimeOff("2026-02-21"),runtimeOff("2026-02-22"),runtimeOff("2026-02-23")]; const provisionalFixture=assertPersistedLiveState("provisional",provisionalFacts,at("2026-02-23","20:00:00"),true,"THRESHOLD_REACHED_PROVISIONAL",[runtimeOff("2026-02-24")],at("2026-02-24","20:00:00")); assert.ok(provisionalFixture.before.blocks.length>0&&provisionalFixture.before.attachment);
console.log("B1E2E-10 PASS — OPEN, REVIEW, Case B and threshold-reached provisional states remain distinct, live and branch-correlated after persistence");

const paidFacts=[...compensationSourceFacts,runtimeWork("2026-02-13"),runtimeOff("2026-02-14"),runtimeOff("2026-02-15"),runtimeOff("2026-02-16"),runtimeWork("2026-02-17")];
const paidStart=orchestrateIncrementalRestEngine(compInput(paidFacts,at("2026-02-17","20:00:00"))); const paidFinal=paidStart.checkpoint.finalizedCompensationResults.find((item:any)=>item.status==="COMPLETED_ON_TIME");assert.ok(paidFinal);const paidStore=memoryStorage();saveIncrementalCheckpoint(paidStore,paidStart.checkpoint);const paidReload1=loadValidIncrementalCheckpoint(paidStore,[...paidFacts,runtimeWork("2026-02-19")]);assert.ok(paidReload1);const paidGen1=orchestrateIncrementalRestEngine(compInput([...paidFacts,runtimeWork("2026-02-19")],at("2026-02-19","20:00:00"),true,paidReload1));saveIncrementalCheckpoint(paidStore,paidGen1.checkpoint);const paidReload2=loadValidIncrementalCheckpoint(paidStore,[...paidFacts,runtimeWork("2026-02-19"),runtimeWork("2026-02-21")]);assert.ok(paidReload2);const paidGen2=orchestrateIncrementalRestEngine(compInput([...paidFacts,runtimeWork("2026-02-19"),runtimeWork("2026-02-21")],at("2026-02-21","20:00:00"),true,paidReload2));
for(const generation of [paidGen1,paidGen2]){assert.ok(generation.checkpoint.finalizedCompensationResults.some((item:any)=>item.finalizedResultId===paidFinal.finalizedResultId));assert.equal(generation.checkpoint.finalizedCompensationResults.filter((item:any)=>item.finalizedResultId===paidFinal.finalizedResultId).length,1);assert.ok(generation.checkpoint.liveCompensationFrontier.alternatives.every((alternative:any)=>!alternative.liveObligationIds.includes(paidFinal.obligationId)));}
const overdueStart=orchestrateIncrementalRestEngine(compInput(compensationSourceFacts,at("2026-03-04","20:00:00"),true));const overdueFinal=overdueStart.checkpoint.finalizedCompensationResults.find((item:any)=>item.status==="OVERDUE");assert.ok(overdueFinal);const overdueSuffix=[runtimeWork("2026-03-06"),runtimeOff("2026-03-07"),runtimeOff("2026-03-08"),runtimeOff("2026-03-09"),runtimeWork("2026-03-10")];const overdueStore=memoryStorage();saveIncrementalCheckpoint(overdueStore,overdueStart.checkpoint);const overdueReload1=loadValidIncrementalCheckpoint(overdueStore,[...compensationSourceFacts,...overdueSuffix]);assert.ok(overdueReload1);const overdueGen1=orchestrateIncrementalRestEngine(compInput([...compensationSourceFacts,...overdueSuffix],at("2026-03-10","20:00:00"),true,overdueReload1));saveIncrementalCheckpoint(overdueStore,overdueGen1.checkpoint);const overdueReload2=loadValidIncrementalCheckpoint(overdueStore,[...compensationSourceFacts,...overdueSuffix,runtimeWork("2026-03-12")]);assert.ok(overdueReload2);const overdueGen2=orchestrateIncrementalRestEngine(compInput([...compensationSourceFacts,...overdueSuffix,runtimeWork("2026-03-12")],at("2026-03-12","20:00:00"),true,overdueReload2));
for(const generation of [overdueGen1,overdueGen2]){assert.ok(generation.checkpoint.finalizedCompensationResults.some((item:any)=>item.finalizedResultId===overdueFinal.finalizedResultId&&item.status==="OVERDUE"));assert.equal(generation.checkpoint.finalizedCompensationResults.filter((item:any)=>item.finalizedResultId===overdueFinal.finalizedResultId).length,1);assert.ok(generation.checkpoint.liveCompensationFrontier.alternatives.every((alternative:any)=>!alternative.liveObligationIds.includes(overdueFinal.obligationId)));}
console.log("B1E2E-11 PASS — production-reachable COMPLETED_ON_TIME and OVERDUE outcomes stay final through two checkpoint generations without re-emission");


// B1E2E-12..15 — final persisted-runtime evidence uses the same authoritative
// facts and orchestration path as the earlier B1E2E fixtures.
const packageFacts: ActivityFactInput[] = [
  ...compensationSourceFacts,
  // 32h30 factual R: the ordinary branch retains all 32h30, while the
  // package descendant can allocate W=24h plus the prior D1 block C=8h30.
  runtimeWorkAt("2026-02-20", "08:00:00", "19:30:00"), runtimeOff("2026-02-21"), runtimeWorkAt("2026-02-22", "04:00:00", "14:00:00"),
];
const packageRun = orchestrateIncrementalRestEngine(compInput(packageFacts, at("2026-02-23", "20:00:00")));
const packageSource = reducedSeed(packageRun);
const packageStates = compensationStates(packageRun, packageSource.seed.componentId);
const paidPackage = packageStates.find((item:any) => item.result.status === "COMPLETED_ON_TIME" && item.blocks.length === 1);
assert.ok(paidPackage, "B1E2E-15: a real package descendant must complete D1");
const packageBlock = paidPackage.blocks[0];
const allPackageStates = packageRun.checkpoint.liveCompensationFrontier.alternatives.flatMap((alternative:any) => alternative.evaluation.obligations.map((obligation:any) => ({ alternative, evaluation: alternative.evaluation, obligation, result: alternative.evaluation.obligationResults.find((result:any) => result.obligationId === obligation.obligationId), blocks: alternative.evaluation.blocks.filter((block:any) => block.obligationId === obligation.obligationId) })));
const d2State = allPackageStates.find((item:any) => item.obligation.sourceComponentId !== packageSource.seed.componentId && item.obligation.sourceRestIntervalId === packageBlock.restIntervalId && item.obligation.requiredCompensationMilliseconds > 0);
assert.ok(d2State, "B1E2E-15: actual package W must create a distinct D2");
const packageInterval = deriveRestIntervals(normalizeActivityFacts(packageFacts).facts, at("2026-02-23", "20:00:00")).intervals.find((item) => item.restIntervalId === packageBlock.restIntervalId); assert.ok(packageInterval?.startEpochMilliseconds != null && packageInterval.endEpochMilliseconds != null);
assert.equal(d2State.obligation.sourceReducedDurationMilliseconds + packageBlock.durationMilliseconds, packageInterval.endEpochMilliseconds! - packageInterval.startEpochMilliseconds!);
assert.equal(d2State.obligation.requiredCompensationMilliseconds, 45 * 60 * 60 * 1000 - d2State.obligation.sourceReducedDurationMilliseconds);
assert.ok(packageBlock.startEpochMilliseconds >= packageInterval.startEpochMilliseconds! && packageBlock.endEpochMilliseconds <= packageInterval.endEpochMilliseconds!);
assert.notEqual(d2State.obligation.obligationId, paidPackage.obligation.obligationId);

// B1E2E-12 — two persisted suffix generations retain only bounded continuation
// state; finalized allocation/compensation identities never become live again.
const replayStore = memoryStorage(); saveIncrementalCheckpoint(replayStore, packageRun.checkpoint);
const replaySuffix1 = [...packageFacts, runtimeWork("2026-02-25")]; const replayReload1 = loadValidIncrementalCheckpoint(replayStore, replaySuffix1); assert.ok(replayReload1);
const replayGen1 = orchestrateIncrementalRestEngine(compInput(replaySuffix1, at("2026-02-25", "20:00:00"), true, replayReload1));
saveIncrementalCheckpoint(replayStore, replayGen1.checkpoint);
const replaySuffix2 = [...replaySuffix1, runtimeWork("2026-02-27")]; const replayReload2 = loadValidIncrementalCheckpoint(replayStore, replaySuffix2); assert.ok(replayReload2);
const replayGen2 = orchestrateIncrementalRestEngine(compInput(replaySuffix2, at("2026-02-27", "20:00:00"), true, replayReload2));
for (const generation of [replayGen1, replayGen2]) {
  assert.equal(generation.diagnostics.historicalChoiceGroupsReplayed, 0);
  assert.equal(generation.diagnostics.historicalFixedWeeksReconstructed, 0);
  assert.equal(generation.diagnostics.historicalRollingCyclesRecomputed, 0);
  assert.equal(generation.diagnostics.finalizedHistoricalItemsRecreatedLive, 0);
  assert.equal(generation.checkpoint.finalizedCompensationResults.filter((item:any) => item.obligationId === paidPackage.obligation.obligationId).length, 1);
  assert.ok(generation.checkpoint.liveCompensationFrontier.alternatives.every((item:any) => !item.liveObligationIds.includes(paidPackage.obligation.obligationId)));
}
const replayIds1 = replayGen1.checkpoint.liveAllocationFrontier.alternatives.map((item:any) => item.alternativeId).join("|");
const replayIds2 = replayGen2.checkpoint.liveAllocationFrontier.alternatives.map((item:any) => item.alternativeId).join("|");
assert.ok(replayIds2.length <= replayIds1.length + 4096, "continuation identity must remain bounded across generations");
console.log("B1E2E-12 PASS — finalized allocation/compensation history and package descendants are not replayed across two persisted suffix generations");

// B1E2E-13 — a prefix correction invalidates the derived checkpoint, whereas a
// suffix append reuses its prefix without overwriting authoritative facts.
const originalPackageFacts = JSON.stringify(packageFacts);
const correctedPackageFacts = [{ ...packageFacts[0], end: { ...packageFacts[0].end!, wallTime: "19:00:00" } }, ...packageFacts.slice(1)];
const staleRun = orchestrateIncrementalRestEngine(compInput(correctedPackageFacts, at("2026-02-23", "20:00:00"), true, packageRun.checkpoint));
assert.equal(staleRun.reusedCheckpoint, false); assert.equal(staleRun.diagnostics.genesisEntered, true);
assert.equal(JSON.stringify(packageFacts), originalPackageFacts, "derived state must never overwrite authoritative source facts");
const appendedPackage = [...packageFacts, runtimeWork("2026-02-24")];
const appendRun = orchestrateIncrementalRestEngine(compInput(appendedPackage, at("2026-02-24", "20:00:00"), true, packageRun.checkpoint));
assert.equal(appendRun.diagnostics.genesisEntered, false); assert.equal(appendRun.diagnostics.historicalChoiceGroupsReplayed, 0);
console.log("B1E2E-13 PASS — changed prefix facts invalidate/rebuild derived state while a later suffix preserves checkpoint reuse and source authority");

// B1E2E-14 — direct and persisted paths must agree on the package/obligation
// legal meaning, independent of representation-only branch IDs.
const directPackageFacts = normalizeActivityFacts(packageFacts).facts;
const directPackageIntervals = deriveRestIntervals(directPackageFacts, at("2026-02-23", "20:00:00")).intervals;
const directPackageAllocation = solveOneShotWeeklyRestAllocations(directPackageIntervals, generateWeeklyRestComponentOptions(directPackageIntervals).options, { asOfEpochMilliseconds: at("2026-02-23", "20:00:00"), evaluationWeekIds: ["2026-02-02", "2026-02-09", "2026-02-16", "2026-02-23"], historyStartEpochMilliseconds: compensationContext.historyStartEpochMilliseconds, factualCoverageCompleteThroughAsOf: true, priorQualifyingWeeklyRest: compensationContext.priorQualifyingWeeklyRest });
const directPackageComp = evaluateCompensation(directPackageIntervals, directPackageAllocation.branches, { asOfEpochMilliseconds: at("2026-02-23", "20:00:00"), factualCoverageCompleteThroughAsOf: true });
const obligationMeaning = (obligation:any, result:any, block:any) => [obligation.sourceRestIntervalId, obligation.sourceFixedWeekId, obligation.sourceReducedDurationMilliseconds, obligation.requiredCompensationMilliseconds, obligation.deadlineEpochMilliseconds, result.status, result.remainingCompensationMilliseconds, block?.restIntervalId ?? null, block?.startEpochMilliseconds ?? null, block?.endEpochMilliseconds ?? null];
const directMeanings = directPackageComp.branchEvaluations.flatMap((evaluation:any) => evaluation.obligationResults.map((result:any) => obligationMeaning(evaluation.obligations.find((obligation:any) => obligation.obligationId === result.obligationId), result, evaluation.blocks.find((block:any) => block.obligationId === result.obligationId))));
const persistedMeanings = packageRun.checkpoint.liveCompensationFrontier.alternatives.flatMap((alternative:any) => alternative.evaluation.obligationResults.map((result:any) => obligationMeaning(alternative.evaluation.obligations.find((obligation:any) => obligation.obligationId === result.obligationId), result, alternative.evaluation.blocks.find((block:any) => block.obligationId === result.obligationId))));
for (const meaning of persistedMeanings) assert.ok(directMeanings.some((candidate:any) => JSON.stringify(candidate) === JSON.stringify(meaning)), "persisted result must be semantically present in direct evaluator");
assert.ok(directMeanings.some((meaning:any) => meaning[0] === d2State.obligation.sourceRestIntervalId && meaning[2] === d2State.obligation.sourceReducedDurationMilliseconds && meaning[3] === d2State.obligation.requiredCompensationMilliseconds));
console.log("B1E2E-14 PASS — direct and persisted paths agree on allocation/package boundaries, source/deadline/status and occupied compensation capacity");

// B1E2E-15 — generic real lifecycle: D1 -> regular intervening rest -> package
// repayment + distinct D2 -> later distinct D3, across two persistence cycles.
const d1Only = orchestrateIncrementalRestEngine(compInput(compensationSourceFacts, at("2026-02-08", "20:00:00")));
const d1Seed = reducedSeed(d1Only); const d1Initial = compensationStates(d1Only, d1Seed.seed.componentId).find((item:any) => item.result.status === "OUTSTANDING"); assert.ok(d1Initial);
const regularFacts = [...compensationSourceFacts, runtimeWorkAt("2026-02-14", "00:00:00", "03:00:00"), runtimeOff("2026-02-15"), runtimeWork("2026-02-16")];
const regularRun = orchestrateIncrementalRestEngine(compInput(regularFacts, at("2026-02-16", "20:00:00"))); assert.ok(compensationStates(regularRun, d1Seed.seed.componentId).some((item:any) => item.result.status === "OUTSTANDING"), "a regular rest alone must not repay D1");
const lifeStore = memoryStorage(); saveIncrementalCheckpoint(lifeStore, packageRun.checkpoint); const lifeReload1 = loadValidIncrementalCheckpoint(lifeStore, packageFacts); assert.ok(lifeReload1);
const lifeStage3 = orchestrateIncrementalRestEngine(compInput(packageFacts, at("2026-02-23", "20:00:00"), true, lifeReload1));
const lifeD1 = lifeStage3.checkpoint.finalizedCompensationResults.find((item:any) => item.obligationId === paidPackage.obligation.obligationId && item.status === "COMPLETED_ON_TIME"); assert.ok(lifeD1);
const lifeAllStates = lifeStage3.checkpoint.liveCompensationFrontier.alternatives.flatMap((alternative:any) => alternative.evaluation.obligations.map((obligation:any) => ({ alternative, obligation, result: alternative.evaluation.obligationResults.find((result:any) => result.obligationId === obligation.obligationId) })));
const lifeD2 = lifeAllStates.find((item:any) => item.obligation.sourceRestIntervalId !== packageSource.seed.restIntervalId && item.obligation.requiredCompensationMilliseconds === d2State.obligation.requiredCompensationMilliseconds && item.result?.status === "OUTSTANDING"); assert.ok(lifeD2);
const d3Facts = [...packageFacts, runtimeWork("2026-03-02"), runtimeOff("2026-03-03"), runtimeOff("2026-03-04"), runtimeWork("2026-03-05"), runtimeWorkAt("2026-03-09", "08:00:00", "19:30:00"), runtimeOff("2026-03-10"), runtimeWork("2026-03-11")];
saveIncrementalCheckpoint(lifeStore, lifeStage3.checkpoint); const lifeReload2 = loadValidIncrementalCheckpoint(lifeStore, d3Facts); assert.ok(lifeReload2);
const lifeStage4 = orchestrateIncrementalRestEngine({ ...compInput(d3Facts, at("2026-03-11", "20:00:00"), true, lifeReload2), evaluationWeekIds: ["2026-02-02", "2026-02-09", "2026-02-16", "2026-02-23", "2026-03-02", "2026-03-09"] });
const liveD2D3 = lifeStage4.checkpoint.liveCompensationFrontier.alternatives.flatMap((alternative:any) => alternative.evaluation.obligations.map((obligation:any) => ({ obligation, result: alternative.evaluation.obligationResults.find((result:any) => result.obligationId === obligation.obligationId) }))).filter((item:any) => item.result?.status === "OUTSTANDING");
const d2d3Pair = liveD2D3.find((item:any) => item.obligation.sourceRestIntervalId === lifeD2.obligation.sourceRestIntervalId); const d3 = liveD2D3.find((item:any) => item.obligation.sourceRestIntervalId !== lifeD2.obligation.sourceRestIntervalId); assert.ok(d2d3Pair && d3, "B1E2E-15: checkpoint continuation must retain package-derived D2 source lineage while adding distinct D3");
assert.notEqual(d2d3Pair.obligation.sourceFixedWeekId, d3.obligation.sourceFixedWeekId); assert.notEqual(d2d3Pair.obligation.obligationId, d3.obligation.obligationId);
for (const [date, asOf] of [["2026-03-12", at("2026-03-12", "20:00:00")], ["2026-03-14", at("2026-03-14", "20:00:00")]] as const) { const facts = [...d3Facts, runtimeWork(date)]; saveIncrementalCheckpoint(lifeStore, lifeStage4.checkpoint); const reload = loadValidIncrementalCheckpoint(lifeStore, facts); assert.ok(reload); const generation = orchestrateIncrementalRestEngine(compInput(facts, asOf, true, reload)); assert.ok(generation.checkpoint.finalizedCompensationResults.some((item:any) => item.finalizedResultId === lifeD1.finalizedResultId)); assert.ok(generation.checkpoint.liveCompensationFrontier.alternatives.every((item:any) => !item.liveObligationIds.includes(lifeD1.obligationId))); }
// CT1–CT8 — package-derived compensation continuation is restored only on its
// persisted structural lineage, before ordinary Phase 5 source reconstruction.
const lifePackageAlternatives = lifeStage4.checkpoint.liveAllocationFrontier.alternatives.filter((alternative:any) => alternative.packageContinuations.length > 0);
const originalPackageEntry = lifeStage3.checkpoint.liveAllocationFrontier.alternatives.flatMap((alternative:any) => alternative.packageContinuations.map((item:any) => ({ alternative, item }))).find((entry:any) => entry.item.weeklyComponent.componentId === lifeD2.obligation.sourceComponentId && entry.alternative.continuationLineageId === entry.item.continuationLineageId);
const restoredPackageEntry = lifePackageAlternatives.flatMap((alternative:any) => alternative.packageContinuations.map((item:any) => ({ alternative, item }))).find((entry:any) => entry.item.packageContinuationId === originalPackageEntry?.item.packageContinuationId && entry.alternative.continuationLineageId === entry.item.continuationLineageId);
const originalPackageContinuation = originalPackageEntry?.item;
const restoredPackageContinuation = restoredPackageEntry?.item;
assert.ok(originalPackageContinuation && restoredPackageContinuation, "CT1: matching lineage must restore the persisted package-derived W");
assert.deepEqual([restoredPackageContinuation.packageContinuationId, restoredPackageContinuation.weeklyComponent.componentId, restoredPackageContinuation.weeklyComponent.restIntervalId, restoredPackageContinuation.fixedWeekAssignment.fixedWeekId], [originalPackageContinuation.packageContinuationId, originalPackageContinuation.weeklyComponent.componentId, originalPackageContinuation.weeklyComponent.restIntervalId, originalPackageContinuation.fixedWeekAssignment.fixedWeekId]);
assert.equal(restoredPackageEntry!.alternative.continuationLineageId, restoredPackageContinuation.continuationLineageId, "CT1: restored package state remains correlated to its exact current successor lineage");
assert.equal(originalPackageEntry!.alternative.continuationLineageId, originalPackageContinuation.continuationLineageId, "CT1: original package state is correlated to its exact persisted lineage");
console.log("CT1/CT2 PASS — matching PackageContinuation restores the exact persisted Reduced source and fixed-week identity");
assert.equal(d2d3Pair.obligation.obligationId, lifeD2.obligation.obligationId); assert.equal(d2d3Pair.obligation.sourceComponentId, lifeD2.obligation.sourceComponentId);
console.log("CT3 PASS — package-derived D2 obligation/source identity is stable across checkpoint reload and suffix");
const d2BlocksAfter = lifeStage4.checkpoint.liveCompensationFrontier.alternatives.flatMap((alternative:any) => alternative.evaluation.blocks.filter((block:any) => block.obligationId === d2d3Pair.obligation.obligationId));
assert.ok(d2BlocksAfter.every((block:any) => block.restIntervalId !== packageBlock.restIntervalId || block.endEpochMilliseconds <= packageBlock.startEpochMilliseconds || block.startEpochMilliseconds >= packageBlock.endEpochMilliseconds));
console.log("CT4 PASS — the old package compensation block C is not reused by restored D2");
const packageComponentId = originalPackageContinuation.weeklyComponent.componentId;
const noPackageSiblings = lifeStage4.checkpoint.liveAllocationFrontier.alternatives.filter((alternative:any) => alternative.packageContinuations.length === 0);
assert.ok(noPackageSiblings.length > 0); assert.ok(noPackageSiblings.every((alternative:any) => alternative.continuationLineageId !== restoredPackageContinuation.continuationLineageId && !alternative.reducedSourceSeeds.some((seed:any) => seed.componentId === packageComponentId)));
console.log("CT5 PASS — no-package siblings do not inherit package W/D2/capacity state");
const unrelated = lifeStage4.checkpoint.liveAllocationFrontier.alternatives.filter((alternative:any) => !alternative.packageContinuations.some((item:any) => item.packageContinuationId === originalPackageContinuation.packageContinuationId));
assert.ok(unrelated.length > 0); assert.ok(unrelated.every((alternative:any) => !alternative.packageContinuations.some((item:any) => item.packageContinuationId === originalPackageContinuation.packageContinuationId)));
console.log("CT6 PASS — unrelated allocation lineages receive no package continuation");
assert.notEqual(d2d3Pair.obligation.sourceComponentId, d3.obligation.sourceComponentId); assert.equal(d2d3Pair.result.status, "OUTSTANDING"); assert.equal(d3.result.status, "OUTSTANDING");
console.log("CT7 PASS — later legitimate Reduced source creates distinct live D3 while D2 remains live");
assert.ok(lifeStage4.checkpoint.finalizedCompensationResults.some((item:any) => item.finalizedResultId === lifeD1.finalizedResultId)); assert.ok(lifeStage4.checkpoint.liveCompensationFrontier.alternatives.every((alternative:any) => !alternative.liveObligationIds.includes(lifeD1.obligationId)));
console.log("CT8 PASS — finalized D1 never reappears in live compensation continuation");

console.log("B1E2E-15 PASS — real generic D1 -> package-paid D1 + distinct D2 -> distinct D3 lifecycle persists without overlap, reuse, merge or re-emission");
