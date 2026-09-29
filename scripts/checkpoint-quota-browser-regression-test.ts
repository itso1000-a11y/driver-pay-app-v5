import assert from "node:assert/strict";
import fs from "node:fs";
import { evaluateProductionRestEngine } from "../src/rest-engine/presentation.ts";
import { INCREMENTAL_CHECKPOINT_STORAGE_KEY, loadValidIncrementalCheckpoint, saveIncrementalCheckpoint } from "../src/rest-engine/incremental-checkpoint-storage.ts";
import type { KeyValueStorage } from "../src/rest-engine/storage.ts";

class QuotaStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();
  private readonly failKey: string;
  constructor(failKey: string) { this.failKey = failKey; }
  get length() { return this.values.size; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) {
    if (key === this.failKey) { const error = new Error("Quota exceeded"); error.name = "QuotaExceededError"; throw error; }
    this.values.set(key, value);
  }
  removeItem(key: string) { this.values.delete(key); }
  seed(key: string, value: string) { this.values.set(key, value); }
}

const backupPath = process.env.REAL_BACKUP_PATH ?? "driver-pay-backup-2026-10-03-2026-09-28.json";
if (!fs.existsSync(backupPath)) throw new Error(`Exact real-backup fixture unavailable: ${backupPath}`);
const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));
assert.equal(backup.version, 2);
assert.equal(JSON.parse(backup.storageSnapshot.settings).grossOnly, true);
assert.equal(backup.storageSnapshot.driverPay_activePayProfileId_v2, "profile-1781896539237-b83g7u3");
const profiles = JSON.parse(backup.storageSnapshot.driverPay_payProfiles_v2);
const active = profiles.find((profile: any) => profile.id === backup.storageSnapshot.driverPay_activePayProfileId_v2);
assert.equal(active?.organisationName, "ARC");
assert.equal(active?.name, "Turners");
assert.equal(active?.settingsSnapshot?.grossOnly, true);

const storage = new QuotaStorage(INCREMENTAL_CHECKPOINT_STORAGE_KEY);
for (const [key, value] of Object.entries(backup.storageSnapshot)) storage.seed(key, value as string);
const asOf = Date.parse(backup.exportedAt);
let first: ReturnType<typeof evaluateProductionRestEngine> | undefined;
assert.doesNotThrow(() => { first = evaluateProductionRestEngine(backup.storageSnapshot, asOf, storage); });
assert.ok(first);
assert.equal(storage.getItem(INCREMENTAL_CHECKPOINT_STORAGE_KEY), null);
assert.equal(storage.getItem("settings"), backup.storageSnapshot.settings);
assert.equal(storage.getItem("driverPay_activePayProfileId_v2"), backup.storageSnapshot.driverPay_activePayProfileId_v2);
const factualFacts = first.migration.facts.filter((fact) => fact.factStatus === "FACTUAL");
assert.ok(loadValidIncrementalCheckpoint(storage, factualFacts));
const checkpoint = loadValidIncrementalCheckpoint(storage, factualFacts)!;
const save = saveIncrementalCheckpoint(storage, checkpoint);
assert.equal(save.persisted, false);
assert.equal(save.volatileFallback, true);
assert.ok(save.serializedBytes > 0);
assert.doesNotThrow(() => evaluateProductionRestEngine(backup.storageSnapshot, asOf, storage));
console.log(JSON.stringify({ result: "QUOTA-Q1-Q6 PASS", activeProfile: "ARC -> Turners", grossOnly: true, checkpointBytes: save.serializedBytes }, null, 2));
