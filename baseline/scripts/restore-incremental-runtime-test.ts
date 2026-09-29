import assert from "node:assert/strict";
import fs from "node:fs";
import { evaluateProductionRestEngine } from "../src/rest-engine/presentation.ts";
import { INCREMENTAL_CHECKPOINT_STORAGE_KEY } from "../src/rest-engine/incremental-checkpoint-storage.ts";
import { migrateLegacyFacts } from "../src/rest-engine/migration.ts";
import { loadValidIncrementalCheckpoint } from "../src/rest-engine/incremental-checkpoint-storage.ts";

class MemoryStorage {
  private readonly values = new Map<string, string>();
  get length() { return this.values.size; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}
const backupPath = process.env.REAL_BACKUP_PATH ?? "C:/Users/itso1/OneDrive/1.Itso/driver-pay-backup-2026-10-03-2026-09-28.json";
if (!fs.existsSync(backupPath)) throw new Error(`Exact real-backup fixture is unavailable: ${backupPath}`);
const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));
assert.equal(backup.version, 2);
const storage = new MemoryStorage();
for (const [key, value] of Object.entries(backup.storageSnapshot)) storage.setItem(key, value as string);
const asOf = Date.parse(backup.exportedAt);
const before = process.memoryUsage();
const started = performance.now();
const first = evaluateProductionRestEngine(backup.storageSnapshot, asOf, storage);
const elapsedMilliseconds = performance.now() - started;
const after = process.memoryUsage();
const raw = storage.getItem(INCREMENTAL_CHECKPOINT_STORAGE_KEY);
assert.ok(raw, "R3 persisted incremental checkpoint exists after bounded bootstrap");
const checkpoint = JSON.parse(raw);
assert.equal(checkpoint.bootstrapSafety?.kind, "STATE_CAP", "R2 bounded legacy bootstrap returns controlled review state");
assert.ok(checkpoint.liveAllocationFrontier.alternatives.length <= 96, "R1 live allocation state remains within bootstrap cap");
assert.equal(first.evaluation.allocation.branches.length, checkpoint.liveAllocationFrontier.alternatives.length, "R5 production presentation projects incremental frontier");
assert.ok(first.evaluation.allocation.branches.every((branch) => branch.reviewStatus === "REVIEW_REQUIRED"), "R7 capped alternatives remain REVIEW");
assert.ok(first.migration.facts.some((fact) => fact.factStatus !== "FACTUAL"), "R8 non-factual rows are not fabricated into factual evidence");
const rawBeforeReuse = raw;
const second = evaluateProductionRestEngine(backup.storageSnapshot, asOf, storage);
assert.equal(storage.getItem(INCREMENTAL_CHECKPOINT_STORAGE_KEY), rawBeforeReuse, "R4 unchanged restore reuses checkpoint without rebuilding bootstrap");
assert.equal(second.evaluation.evaluationFingerprint, first.evaluation.evaluationFingerprint, "R4 reused presentation state is deterministic");
const factualFacts = migrateLegacyFacts(backup.storageSnapshot, asOf).facts.filter((fact) => fact.factStatus === "FACTUAL");
const changedFacts = factualFacts.map((fact, index) => index === 0 ? { ...fact, revisionFingerprint: "forensic-mismatch" } : fact);
assert.equal(loadValidIncrementalCheckpoint(storage, changedFacts), null, "R6 changed factual identity invalidates unsafe checkpoint reuse");
const app = fs.readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const presentation = fs.readFileSync(new URL("../src/rest-engine/presentation.ts", import.meta.url), "utf8");
assert.match(app, /evaluateProductionRestEngine\(snapshot, restEngineAsOf, localStorage\)/, "R5 App supplies persistent storage to production evaluator");
assert.match(presentation, /if \(storage\) return evaluateStoredProductionRestEngine/, "R5 production evaluator selects incremental path when storage exists");
assert.equal(storage.getItem("settings"), backup.storageSnapshot.settings, "R9 runtime evaluation does not mutate restored Pay/Gross settings");
console.log(JSON.stringify({
  result: "R1-R9 PASS",
  backup: { bytes: fs.statSync(backupPath).size, migratedStorageKeys: Object.keys(backup.storageSnapshot).length },
  performance: { elapsedMilliseconds: +elapsedMilliseconds.toFixed(2), before, after },
  checkpoint: { bootstrapSafety: checkpoint.bootstrapSafety, liveAllocationAlternatives: checkpoint.liveAllocationFrontier.alternatives.length, liveCompensationAlternatives: checkpoint.liveCompensationFrontier.alternatives.length },
}, null, 2));
