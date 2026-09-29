import { deserializeIncrementalCheckpoint, isIncrementalCheckpointStale, serializeIncrementalCheckpoint, type RestEngineIncrementalCheckpointV2 } from "./incremental-checkpoint.ts";
import type { ActivityFactInput } from "./types.ts";
import type { KeyValueStorage } from "./storage.ts";

export const INCREMENTAL_CHECKPOINT_STORAGE_KEY = "driverPayApp:restEngine:v1:incremental-checkpoint-v2" as const;

const volatileCheckpoints = new WeakMap<object, RestEngineIncrementalCheckpointV2>();

function volatileKey(storage: KeyValueStorage): object | null {
  return typeof storage === "object" && storage !== null ? storage as object : null;
}
function rememberVolatile(storage: KeyValueStorage, checkpoint: RestEngineIncrementalCheckpointV2) {
  const key = volatileKey(storage);
  if (key) volatileCheckpoints.set(key, checkpoint);
}
function forgetVolatile(storage: KeyValueStorage) {
  const key = volatileKey(storage);
  if (key) volatileCheckpoints.delete(key);
}
function readVolatile(storage: KeyValueStorage): RestEngineIncrementalCheckpointV2 | null {
  const key = volatileKey(storage);
  return key ? volatileCheckpoints.get(key) ?? null : null;
}

export type IncrementalCheckpointSaveResult = {
  persisted: boolean;
  volatileFallback: boolean;
  serializedBytes: number;
};

export function saveIncrementalCheckpoint(storage: KeyValueStorage, checkpoint: RestEngineIncrementalCheckpointV2): IncrementalCheckpointSaveResult {
  const serialized = serializeIncrementalCheckpoint(checkpoint);
  const serializedBytes = new TextEncoder().encode(serialized).byteLength;
  try {
    storage.setItem(INCREMENTAL_CHECKPOINT_STORAGE_KEY, serialized);
    rememberVolatile(storage, checkpoint);
    return { persisted: true, volatileFallback: false, serializedBytes };
  } catch {
    rememberVolatile(storage, checkpoint);
    return { persisted: false, volatileFallback: true, serializedBytes };
  }
}

export function loadValidIncrementalCheckpoint(storage: KeyValueStorage, facts: readonly ActivityFactInput[]): RestEngineIncrementalCheckpointV2 | null {
  let raw: string | null = null;
  try { raw = storage.getItem(INCREMENTAL_CHECKPOINT_STORAGE_KEY); } catch { raw = null; }
  const persisted = raw ? deserializeIncrementalCheckpoint(raw) : null;
  const checkpoint = persisted ?? readVolatile(storage);
  if (!checkpoint) return null;
  if (isIncrementalCheckpointStale(checkpoint, facts)) {
    try { storage.removeItem(INCREMENTAL_CHECKPOINT_STORAGE_KEY); } catch {}
    forgetVolatile(storage);
    return null;
  }
  if (persisted) rememberVolatile(storage, persisted);
  return checkpoint;
}
