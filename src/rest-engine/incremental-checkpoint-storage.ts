import { deserializeIncrementalCheckpoint, isIncrementalCheckpointStale, serializeIncrementalCheckpoint, type RestEngineIncrementalCheckpointV2 } from "./incremental-checkpoint.ts";
import type { ActivityFactInput } from "./types.ts";
import type { KeyValueStorage } from "./storage.ts";
export const INCREMENTAL_CHECKPOINT_STORAGE_KEY="driverPayApp:restEngine:v1:incremental-checkpoint-v2" as const;
export function saveIncrementalCheckpoint(storage:KeyValueStorage,checkpoint:RestEngineIncrementalCheckpointV2):void{storage.setItem(INCREMENTAL_CHECKPOINT_STORAGE_KEY,serializeIncrementalCheckpoint(checkpoint))}
export function loadValidIncrementalCheckpoint(storage:KeyValueStorage,facts:readonly ActivityFactInput[]):RestEngineIncrementalCheckpointV2|null{const raw=storage.getItem(INCREMENTAL_CHECKPOINT_STORAGE_KEY);if(!raw)return null;const checkpoint=deserializeIncrementalCheckpoint(raw);if(!checkpoint||isIncrementalCheckpointStale(checkpoint,facts)){storage.removeItem(INCREMENTAL_CHECKPOINT_STORAGE_KEY);return null}return checkpoint}
