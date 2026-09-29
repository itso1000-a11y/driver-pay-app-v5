import assert from "node:assert/strict";
import fs from "node:fs";
import { evaluateProductionRestEngine } from "../src/rest-engine/presentation.ts";
import { INCREMENTAL_CHECKPOINT_STORAGE_KEY, loadValidIncrementalCheckpoint } from "../src/rest-engine/incremental-checkpoint-storage.ts";
import { migrateLegacyFacts } from "../src/rest-engine/migration.ts";
import { normalizeActivityFacts } from "../src/rest-engine/facts.ts";
import { orchestrateStoredIncrementalRestEngine } from "../src/rest-engine/incremental-checkpoint-runtime.ts";
import type { ActivityFactInput } from "../src/rest-engine/types.ts";

class MemoryStorage {
  private readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  clone(): MemoryStorage { const copy = new MemoryStorage(); for (const [key, value] of this.values) copy.setItem(key, value); return copy; }
}
const backupPath = process.env.REAL_BACKUP_PATH ?? "C:/Users/itso1/OneDrive/1.Itso/driver-pay-backup-2026-10-03-2026-09-28.json";
if (!fs.existsSync(backupPath)) throw new Error(`Exact real-backup fixture is unavailable: ${backupPath}`);
const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));
assert.equal(backup.version, 2);
const restoreStorage = () => { const storage = new MemoryStorage(); for (const [key, value] of Object.entries(backup.storageSnapshot)) storage.setItem(key, value as string); return storage; };
const asOf = Date.parse(backup.exportedAt);
const runtimeInput = (facts: readonly ActivityFactInput[]) => ({ facts, asOfEpochMilliseconds: asOf, evaluationWeekIds: [], factualCoverageCompleteThroughAsOf: true });
const newFactualDay = (date: string, id: string): ActivityFactInput => ({
  factId: id, sourceRef: { sourceKey: "forensic", recordId: id, wallDate: date }, kind: "WORK", factStatus: "FACTUAL", coverage: "COMPLETE",
  start: { wallDate: date, wallTime: "09:00", timeZone: "Europe/London", provenance: "EXPLICIT" },
  end: { wallDate: date, wallTime: "17:00", timeZone: "Europe/London", provenance: "EXPLICIT" },
  provenance: "EXPLICIT", revision: 1, revisionFingerprint: id,
});

const storage = restoreStorage();
const before = process.memoryUsage();
const started = performance.now();
const first = evaluateProductionRestEngine(backup.storageSnapshot, asOf, storage);
const elapsedMilliseconds = performance.now() - started;
const after = process.memoryUsage();
const raw = storage.getItem(INCREMENTAL_CHECKPOINT_STORAGE_KEY);
assert.ok(raw, "C1 checkpoint exists after bounded bootstrap");
const checkpoint = JSON.parse(raw);
assert.equal(checkpoint.bootstrapSafety?.kind, "STATE_CAP", "C1 bounded legacy bootstrap returns controlled review state");
assert.deepEqual(checkpoint.source, checkpoint.bootstrapSafety.authenticatedPrefixSource, "C1 checkpoint source authenticates exactly the evaluated prefix");
assert.ok(checkpoint.source.lastWallDate < "2026-09-28", "C1 suffix facts are not included in STATE_CAP source authentication");
assert.ok(checkpoint.liveAllocationFrontier.alternatives.length <= 96, "C1 allocation state remains within safety cap");
assert.equal(first.evaluation.allocation.branches.length, checkpoint.liveAllocationFrontier.alternatives.length, "C1 production presentation projects incremental frontier");
assert.ok(first.evaluation.allocation.branches.every((branch) => branch.reviewStatus === "REVIEW_REQUIRED"), "C9 STATE_CAP remains REVIEW");
assert.ok(first.migration.facts.some((fact) => fact.factStatus !== "FACTUAL"), "C10 non-factual rows are not fabricated into factual evidence");
const rawBeforeReuse = raw;
const second = evaluateProductionRestEngine(backup.storageSnapshot, asOf, storage);
assert.equal(storage.getItem(INCREMENTAL_CHECKPOINT_STORAGE_KEY), rawBeforeReuse, "C2 unchanged restore reuses checkpoint without bootstrap");
assert.equal(second.evaluation.evaluationFingerprint, first.evaluation.evaluationFingerprint, "C2 reused presentation state is deterministic");
const factualFacts = normalizeActivityFacts(first.migration.facts.filter((fact) => fact.factStatus === "FACTUAL")).facts;
const futureOne = [...factualFacts, newFactualDay("2026-09-29", "future-one")];
const suffixStorage = storage.clone();

const suffix = orchestrateStoredIncrementalRestEngine(suffixStorage, runtimeInput(futureOne));
assert.equal(suffix.diagnostics.reusedPrefixCheckpoint, true, "C3 future day reuses authenticated prefix");
assert.equal(suffix.diagnostics.genesisEntered, false, "C3 future day does not restart genesis bootstrap");
assert.ok(suffix.diagnostics.suffixFactCount > 0, "C3 only factual suffix material is considered after prefix reuse");
assert.equal(suffix.diagnostics.bootstrapSafety?.kind, "STATE_CAP", "C3 an unsafe suffix remains bounded REVIEW rather than restarting genesis");
assert.deepEqual(suffix.checkpoint.source, checkpoint.source, "C3 unevaluated suffix does not falsely extend authenticated prefix");
const futureMany = [...factualFacts, newFactualDay("2026-09-29", "future-one"), newFactualDay("2026-09-30", "future-two"), newFactualDay("2026-10-01", "future-three")];
const multi = orchestrateStoredIncrementalRestEngine(storage.clone(), runtimeInput(futureMany));
assert.equal(multi.diagnostics.reusedPrefixCheckpoint, true, "C4 multiple future facts reuse authenticated prefix");
assert.equal(multi.diagnostics.genesisEntered, false, "C4 multiple future facts do not restart genesis bootstrap");
const prefixFact = factualFacts.find((fact) => fact.sourceRef.wallDate <= checkpoint.source.lastWallDate)!;
const changedPrefix = factualFacts.map((fact) => fact.factId === prefixFact.factId ? { ...fact, revisionFingerprint: "changed-prefix" } : fact);
assert.equal(loadValidIncrementalCheckpoint(storage.clone(), changedPrefix), null, "C5 changed authenticated prefix invalidates checkpoint");
const outsideFact = factualFacts.find((fact) => fact.sourceRef.wallDate > checkpoint.source.lastWallDate)!;
const changedSuffix = factualFacts.map((fact) => fact.factId === outsideFact.factId ? { ...fact, revisionFingerprint: "changed-suffix" } : fact);
assert.ok(loadValidIncrementalCheckpoint(storage.clone(), changedSuffix), "C6 changed unevaluated suffix keeps prefix checkpoint valid");
const allocationBefore = JSON.stringify(checkpoint.liveAllocationFrontier);
const compensationBefore = JSON.stringify(checkpoint.liveCompensationFrontier);
checkpoint.liveAllocationFrontier.alternatives[0] && (checkpoint.liveAllocationFrontier.alternatives[0].reviewReasons = ["mutated-test-only"]);
checkpoint.liveCompensationFrontier.alternatives[0] && ((checkpoint.liveCompensationFrontier.alternatives[0] as any).evaluation = { mutated: true });
assert.equal(JSON.stringify(JSON.parse(raw!).liveAllocationFrontier), allocationBefore, "C7 last-safe allocation was serialized from an immutable snapshot");
assert.equal(JSON.stringify(JSON.parse(raw!).liveCompensationFrontier), compensationBefore, "C8 last-safe compensation was serialized from an immutable snapshot");
const app = fs.readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const presentation = fs.readFileSync(new URL("../src/rest-engine/presentation.ts", import.meta.url), "utf8");
assert.match(app, /evaluateProductionRestEngine\(snapshot, restEngineAsOf, localStorage\)/, "C1 production App supplies persistent storage");
assert.match(presentation, /if \(storage\) return evaluateStoredProductionRestEngine/, "C1 production evaluator uses stored incremental path");
assert.equal(storage.getItem("settings"), backup.storageSnapshot.settings, "C10 runtime evaluation does not mutate restored Pay/Gross settings");
console.log(JSON.stringify({ result: "C1-C10 PASS", backup: { bytes: fs.statSync(backupPath).size, migratedStorageKeys: Object.keys(backup.storageSnapshot).length }, performance: { elapsedMilliseconds: +elapsedMilliseconds.toFixed(2), before, after }, checkpoint: { boundary: checkpoint.bootstrapSafety.evaluatedThroughFixedWeekId, source: checkpoint.source, liveAllocationAlternatives: JSON.parse(raw!).liveAllocationFrontier.alternatives.length, liveCompensationAlternatives: JSON.parse(raw!).liveCompensationFrontier.alternatives.length }, suffix: { reusedPrefixCheckpoint: suffix.diagnostics.reusedPrefixCheckpoint, genesisEntered: suffix.diagnostics.genesisEntered, segmentCount: suffix.segmentCount } }, null, 2));







