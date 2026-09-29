import { normalizeActivityFacts } from "./facts.ts";
import { deriveRestIntervals } from "./chronology.ts";
import { generateWeeklyRestComponentOptions } from "./weekly-rest-candidates.ts";
import { solveSegmentedWeeklyRestAllocations, solveSegmentedWeeklyRestAllocationsFromSeed, allocationSolverContinuationContext } from "./weekly-rest-allocation.ts";
import { allocationFrontierAlternative, allocationFrontierFromBranches, allocationContinuationSeed, rebasePackageContinuations, reidentifyAllocationFrontierAlternative, successorContinuationLineage } from "./allocation-frontier.ts";
import { finalizeAllocationFrontier } from "./allocation-finalization.ts";
import { transitionCompensationFrontier } from "./compensation-frontier.ts";
import { createIncrementalCheckpoint, incrementalCheckpointSource, isIncrementalCheckpointStale, type IncrementalBootstrapSafety, type RestEngineIncrementalCheckpointV2 } from "./incremental-checkpoint.ts";
import { fixedLegalWeekForInstant } from "./time.ts";
import type { ActivityFactInput, AllocationBranch, PriorQualifyingWeeklyRest, RestInterval } from "./types.ts";

export type InitialLegalContext={historyStartEpochMilliseconds:number|null;priorQualifyingWeeklyRest:PriorQualifyingWeeklyRest|null};
export type IncrementalOrchestrationInput={facts:readonly ActivityFactInput[];asOfEpochMilliseconds:number;evaluationWeekIds:readonly string[];factualCoverageCompleteThroughAsOf:boolean;initialLegalContext?:InitialLegalContext;checkpoint?:RestEngineIncrementalCheckpointV2|null};
export type IncrementalOrchestrationDiagnostics={genesisEntered:boolean;historicalChoiceGroupsReplayed:number;historicalFixedWeeksReconstructed:number;historicalRollingCyclesRecomputed:number;finalizedHistoricalItemsRecreatedLive:number;bootstrapSafety?:IncrementalBootstrapSafety};
export type IncrementalOrchestrationResult={checkpoint:RestEngineIncrementalCheckpointV2;reusedCheckpoint:boolean;segmentCount:number;diagnostics:IncrementalOrchestrationDiagnostics;lastSegmentBranches:readonly AllocationBranch[]};
const emptyDiagnostics=():IncrementalOrchestrationDiagnostics=>({genesisEntered:false,historicalChoiceGroupsReplayed:0,historicalFixedWeeksReconstructed:0,historicalRollingCyclesRecomputed:0,finalizedHistoricalItemsRecreatedLive:0});
/** Hard runtime budget for a legacy cold start. It returns REVIEW, never a guessed legal result. */
export const LEGACY_BOOTSTRAP_MAX_LIVE_ALLOCATION_ALTERNATIVES=96;
export function compensationIntervalsAvailableThrough(available: readonly RestInterval[], current: readonly RestInterval[]): RestInterval[] {
  const values = new Map<string, RestInterval>();
  for (const interval of [...available, ...current]) values.set(interval.restIntervalId, interval);
  return [...values.values()].sort((left, right) => (left.startEpochMilliseconds ?? -1) - (right.startEpochMilliseconds ?? -1) || left.restIntervalId.localeCompare(right.restIntervalId));
}
function intervalWeek(interval:RestInterval):string|null{const instant=interval.endEpochMilliseconds??interval.observedThroughEpochMilliseconds??interval.startEpochMilliseconds;return instant==null?null:fixedLegalWeekForInstant(instant).weekId}
function context(input:IncrementalOrchestrationInput,weeks:string[]){return{asOfEpochMilliseconds:input.asOfEpochMilliseconds,evaluationWeekIds:weeks,historyStartEpochMilliseconds:input.initialLegalContext?.historyStartEpochMilliseconds??null,factualCoverageCompleteThroughAsOf:input.factualCoverageCompleteThroughAsOf,priorQualifyingWeeklyRest:input.initialLegalContext?.priorQualifyingWeeklyRest??undefined}}
function initialLegalContextFingerprint(input:IncrementalOrchestrationInput){return JSON.stringify(input.initialLegalContext??{historyStartEpochMilliseconds:null,priorQualifyingWeeklyRest:null})}
function withPackages(frontier:any, packages:readonly {parentAlternativeId:string;branch:AllocationBranch}[]){
 const byId=new Map<string,any>(frontier.alternatives.map((a:any)=>[a.alternativeId,a]));
 for(const entry of packages){
  const parent:any=byId.get(entry.parentAlternativeId); let child=allocationFrontierAlternative(entry.branch,entry.parentAlternativeId);
  if(parent){
   const parentPackageIds=new Set(parent.packageContinuations.map((item:any)=>item.packageContinuationId));
   const added:any=child.packageContinuations.find((item:any)=>!parentPackageIds.has(item.packageContinuationId));
   if(added){
    const continuationLineageId=successorContinuationLineage(parent.continuationLineageId,{kind:"PACKAGE_REFINEMENT",packageContinuationId:added.packageContinuationId,parentComponents:[...parent.countedComponents,...parent.additionalComponents].map((item:any)=>({componentId:item.componentId,restIntervalId:item.restIntervalId,sourceOptionId:item.sourceOptionId,startEpochMilliseconds:item.startEpochMilliseconds,endEpochMilliseconds:item.endEpochMilliseconds,durationMilliseconds:item.durationMilliseconds,classification:item.classification,role:item.role})),parentAssignments:parent.assignments.map((item:any)=>({componentId:item.componentId,fixedWeekId:item.fixedWeekId,assignmentRole:item.assignmentRole})),parentRollingAnchor:parent.rollingAnchor,parentReviewStatus:parent.reviewStatus,parentReviewReasons:parent.reviewReasons});
    // A newly-created package has no persisted predecessor yet. Its first
    // persisted successor will add exactly one bounded predecessor edge.
    const rebased=rebasePackageContinuations(child.packageContinuations,continuationLineageId).map((item:any)=>item.packageContinuationId===added.packageContinuationId?(()=>{const {predecessorContinuationLineageId:_ignored,...rest}=item;return rest})():item);
    child=reidentifyAllocationFrontierAlternative({...child,continuationLineageId,packageContinuations:rebased});
   }
  }
  if(!byId.has(child.alternativeId))byId.set(child.alternativeId,child);
 }
 return{alternatives:[...byId.values()]} as any;
}
function checkpoint(sourceFacts:readonly ActivityFactInput[], input:IncrementalOrchestrationInput, frontier:ReturnType<typeof allocationFrontierFromBranches>|RestEngineIncrementalCheckpointV2["liveAllocationFrontier"], finalizedAlloc:readonly any[], compensation:any, boundary:string|null, bootstrapSafety?:IncrementalBootstrapSafety){return createIncrementalCheckpoint({source:incrementalCheckpointSource(sourceFacts),finalizedThroughWallDate:boundary,finalizedAllocationResults:finalizedAlloc,finalizedCompensationResults:compensation.finalized,liveAllocationFrontier:frontier,liveCompensationFrontier:compensation.live,factualCoverageCompleteThroughBoundary:input.factualCoverageCompleteThroughAsOf,initialLegalContextFingerprint:initialLegalContextFingerprint(input),reviewReasons:bootstrapSafety?[bootstrapSafety.reason]:[],bootstrapSafety})}
/** Incremental runtime: checkpoint source authenticates its prefix; only later factual material is seeded. */
export function orchestrateIncrementalRestEngine(input:IncrementalOrchestrationInput):IncrementalOrchestrationResult{
 const facts=normalizeActivityFacts(input.facts).facts; let prior=input.checkpoint??null;
 const fullInputSource=incrementalCheckpointSource(input.facts);
 if(prior?.bootstrapSafety){
   const sameInput=JSON.stringify(prior.bootstrapSafety.inputSource)===JSON.stringify(fullInputSource);
   if(sameInput&&prior.initialLegalContextFingerprint===initialLegalContextFingerprint(input))return{checkpoint:prior,reusedCheckpoint:true,segmentCount:0,diagnostics:{...emptyDiagnostics(),bootstrapSafety:prior.bootstrapSafety},lastSegmentBranches:[]};
   prior=null;
 }
 if(prior&&!isIncrementalCheckpointStale(prior,input.facts)&&prior.initialLegalContextFingerprint===initialLegalContextFingerprint(input)){
   const suffixFacts=facts.filter(f=>f.sourceRef.wallDate>prior.source.lastWallDate);
   if(!suffixFacts.length)return{checkpoint:prior,reusedCheckpoint:true,segmentCount:0,diagnostics:emptyDiagnostics(),lastSegmentBranches:[]};
   const chronology=deriveRestIntervals(facts,input.asOfEpochMilliseconds);
   const suffixIds=new Set(suffixFacts.map(f=>f.factId));
   const suffixIntervals=chronology.intervals.filter(i=>i.supportingFactIds.some(id=>suffixIds.has(id)));
   const weeks=[...new Set(suffixIntervals.map(intervalWeek).filter((v):v is string=>v!=null))].sort();
   const seeded=solveSegmentedWeeklyRestAllocationsFromSeed(allocationContinuationSeed(prior.liveAllocationFrontier,null),suffixIntervals,generateWeeklyRestComponentOptions(suffixIntervals).options,context(input,weeks),prior.liveAllocationFrontier.alternatives.map(a=>allocationSolverContinuationContext(a)));
   const frontier=allocationFrontierFromBranches(seeded.result.branches);
   const boundary=(weeks.length ? weeks[weeks.length - 1] : null) ?? prior.finalizedThroughWallDate;
   const finalized=boundary?finalizeAllocationFrontier(frontier,{chronologicalBoundaryFixedWeekId:boundary}):{finalizedAllocationResults:[],liveFrontier:frontier};
   const comp=transitionCompensationFrontier(prior.liveCompensationFrontier,finalized.liveFrontier,chronology.intervals,{asOfEpochMilliseconds:input.asOfEpochMilliseconds,factualCoverageCompleteThroughAsOf:input.factualCoverageCompleteThroughAsOf},prior.finalizedCompensationResults);
   const packagedFrontier=withPackages(finalized.liveFrontier,comp.packageBranches);
   const cp=checkpoint(input.facts,input,packagedFrontier,[...prior.finalizedAllocationResults,...finalized.finalizedAllocationResults],{live:comp.nextCompensationFrontier,finalized:[...prior.finalizedCompensationResults,...comp.newlyFinalizedCompensationResults]},boundary);
   return{checkpoint:cp,reusedCheckpoint:false,segmentCount:1,diagnostics:{...seeded.diagnostics},lastSegmentBranches:seeded.result.branches};
 }
 const chronology=deriveRestIntervals(facts,input.asOfEpochMilliseconds);const groups=new Map<string,RestInterval[]>();for(const i of chronology.intervals){const w=intervalWeek(i);if(w)groups.set(w,[...(groups.get(w)??[]),i])}
 let frontier:any=null, finalAlloc:any[]=[] , finalComp:any[]=[] , liveComp:any={alternatives:[]}; let availableIntervals: RestInterval[]=[]; let count=0;let diagnostics=emptyDiagnostics(); let lastSegmentBranches:readonly AllocationBranch[]=[];
 let lastSafeFrontier:any={alternatives:[]},lastSafeComp:any=liveComp,lastSafeAllocation:any[]=finalAlloc,lastSafeCompensation:any[]=finalComp,lastSafeBoundary:string|null=null;
 for(const [week,intervals] of [...groups.entries()].sort(([a],[b])=>a.localeCompare(b))){availableIntervals=compensationIntervalsAvailableThrough(availableIntervals,intervals);const opts=generateWeeklyRestComponentOptions(intervals).options;let allocation;if(!frontier){allocation=solveSegmentedWeeklyRestAllocations(intervals,opts,context(input,[week]));diagnostics.genesisEntered=true}else{const seeded=solveSegmentedWeeklyRestAllocationsFromSeed(allocationContinuationSeed(frontier,null),intervals,opts,context(input,[week]),frontier.alternatives.map((a:any)=>allocationSolverContinuationContext(a)));allocation=seeded.result;diagnostics={...seeded.diagnostics,genesisEntered:true}}lastSegmentBranches=allocation.branches;frontier=allocationFrontierFromBranches(allocation.branches);const finalized=finalizeAllocationFrontier(frontier,{chronologicalBoundaryFixedWeekId:week});frontier=finalized.liveFrontier;finalAlloc.push(...finalized.finalizedAllocationResults);
  if(frontier.alternatives.length>LEGACY_BOOTSTRAP_MAX_LIVE_ALLOCATION_ALTERNATIVES){const bootstrapSafety:IncrementalBootstrapSafety={kind:"STATE_CAP",inputSource:fullInputSource,stoppedBeforeFixedWeekId:week,reason:"REST_ENGINE_BOOTSTRAP_REVIEW_STATE_CAP"};const cp=checkpoint(input.facts,input,lastSafeFrontier,lastSafeAllocation,{live:lastSafeComp,finalized:lastSafeCompensation},lastSafeBoundary,bootstrapSafety);return{checkpoint:cp,reusedCheckpoint:false,segmentCount:count,diagnostics:{...diagnostics,bootstrapSafety},lastSegmentBranches:[]}}
  const comp=transitionCompensationFrontier(liveComp,frontier,availableIntervals,{asOfEpochMilliseconds:input.asOfEpochMilliseconds,factualCoverageCompleteThroughAsOf:input.factualCoverageCompleteThroughAsOf});liveComp=comp.nextCompensationFrontier;frontier=withPackages(frontier,comp.packageBranches);finalComp.push(...comp.newlyFinalizedCompensationResults);count++;lastSafeFrontier=frontier;lastSafeComp=liveComp;lastSafeAllocation=finalAlloc;lastSafeCompensation=finalComp;lastSafeBoundary=week;}
 const boundary=(()=>{const keys=[...groups.keys()].sort();return keys.length?keys[keys.length-1]:null})();const cp=checkpoint(input.facts,input,frontier??{alternatives:[]},finalAlloc,{live:liveComp,finalized:finalComp},boundary);return{checkpoint:cp,reusedCheckpoint:false,segmentCount:count,diagnostics,lastSegmentBranches};
}
