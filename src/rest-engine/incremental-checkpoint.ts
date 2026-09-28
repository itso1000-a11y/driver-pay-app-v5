import { stableCheckpointJson, factualSourceIdentity, type CheckpointSourceIdentity } from "./checkpoint.ts";
import type { ActivityFactInput } from "./types.ts";
import type { AllocationFrontier } from "./allocation-frontier.ts";
import type { FinalizedAllocationResult } from "./allocation-finalization.ts";
import type { CompensationFrontier, FinalizedCompensationResult } from "./compensation-frontier.ts";
export const REST_ENGINE_INCREMENTAL_CHECKPOINT_VERSION=2 as const;export const REST_ENGINE_INCREMENTAL_SEMANTIC_VERSION="EU_561_2006_REST_ENGINE_V1_INCREMENTAL_PACKAGE_CONTINUATION_V2" as const;
export type RestEngineIncrementalCheckpointV2={checkpointVersion:typeof REST_ENGINE_INCREMENTAL_CHECKPOINT_VERSION;semanticVersion:typeof REST_ENGINE_INCREMENTAL_SEMANTIC_VERSION;source:CheckpointSourceIdentity;finalizedThroughWallDate:string|null;finalizedAllocationResults:readonly FinalizedAllocationResult[];finalizedCompensationResults:readonly FinalizedCompensationResult[];liveAllocationFrontier:AllocationFrontier;liveCompensationFrontier:CompensationFrontier;factualCoverageCompleteThroughBoundary:boolean;initialLegalContextFingerprint:string;reviewReasons:readonly string[]};
function canonical<T>(v:readonly T[]):T[]{return[...v].sort((a,b)=>stableCheckpointJson(a).localeCompare(stableCheckpointJson(b)))}
export function createIncrementalCheckpoint(i:Omit<RestEngineIncrementalCheckpointV2,"checkpointVersion"|"semanticVersion"|"finalizedAllocationResults"|"finalizedCompensationResults"|"reviewReasons">&{finalizedAllocationResults:readonly FinalizedAllocationResult[];finalizedCompensationResults:readonly FinalizedCompensationResult[];reviewReasons:readonly string[]}):RestEngineIncrementalCheckpointV2{return{checkpointVersion:2,semanticVersion:REST_ENGINE_INCREMENTAL_SEMANTIC_VERSION,...i,finalizedAllocationResults:canonical(i.finalizedAllocationResults),finalizedCompensationResults:canonical(i.finalizedCompensationResults),reviewReasons:[...new Set(i.reviewReasons)].sort()}}
export const serializeIncrementalCheckpoint=(c:RestEngineIncrementalCheckpointV2)=>stableCheckpointJson(createIncrementalCheckpoint(c));export function deserializeIncrementalCheckpoint(v:string):RestEngineIncrementalCheckpointV2|null{try{const p=JSON.parse(v) as RestEngineIncrementalCheckpointV2;return p.checkpointVersion===2&&p.semanticVersion===REST_ENGINE_INCREMENTAL_SEMANTIC_VERSION&&p.source&&p.liveAllocationFrontier&&p.liveCompensationFrontier?createIncrementalCheckpoint(p):null}catch{return null}}
export function incrementalCheckpointSource(f: readonly ActivityFactInput[], firstWallDate?: string, lastWallDate?: string): CheckpointSourceIdentity {
  const dates = f.map((item) => item.sourceRef.wallDate).sort();
  return factualSourceIdentity(f, firstWallDate ?? dates[0] ?? "", lastWallDate ?? dates[dates.length - 1] ?? "");
}
/** A checkpoint authenticates its covered factual prefix, not later chronological suffix facts. */
export const isIncrementalCheckpointStale = (checkpoint: RestEngineIncrementalCheckpointV2, facts: readonly ActivityFactInput[]) =>
  stableCheckpointJson(checkpoint.source) !== stableCheckpointJson(incrementalCheckpointSource(facts, checkpoint.source.firstWallDate, checkpoint.source.lastWallDate));
