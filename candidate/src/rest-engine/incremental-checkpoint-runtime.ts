import type { KeyValueStorage } from "./storage.ts";
import { loadValidIncrementalCheckpoint, saveIncrementalCheckpoint } from "./incremental-checkpoint-storage.ts";
import { orchestrateIncrementalRestEngine, type IncrementalOrchestrationInput, type IncrementalOrchestrationResult } from "./incremental-orchestration.ts";
export function orchestrateStoredIncrementalRestEngine(storage:KeyValueStorage,input:Omit<IncrementalOrchestrationInput,"checkpoint">):IncrementalOrchestrationResult{const checkpoint=loadValidIncrementalCheckpoint(storage,input.facts);const result=orchestrateIncrementalRestEngine({...input,checkpoint});if(!result.reusedCheckpoint)saveIncrementalCheckpoint(storage,result.checkpoint);return result}
