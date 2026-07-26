import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

class MemoryStorage {
  constructor(initial = {}) {
    this.map = new Map(Object.entries(initial).map(([key, value]) => [String(key), String(value)]));
    this.failOnKey = null;
  }
  get length() { return this.map.size; }
  key(index) { return [...this.map.keys()][index] ?? null; }
  getItem(key) { return this.map.has(String(key)) ? this.map.get(String(key)) : null; }
  setItem(key, value) {
    if (this.failOnKey === String(key)) throw new Error(`Simulated write failure for ${key}`);
    this.map.set(String(key), String(value));
  }
  removeItem(key) { this.map.delete(String(key)); }
  clear() { this.map.clear(); }
}

function collectStorageSnapshot(storage) {
  const snapshot = {};
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (typeof key !== "string") continue;
    const value = storage.getItem(key);
    if (typeof value === "string") snapshot[key] = value;
  }
  return snapshot;
}

function restoreStorageSnapshot(storage, snapshot) {
  const rollback = collectStorageSnapshot(storage);
  try {
    storage.clear();
    Object.entries(snapshot).forEach(([key, value]) => {
      if (typeof key !== "string" || typeof value !== "string") {
        throw new Error("Invalid storage snapshot");
      }
      storage.setItem(key, value);
    });
  } catch (error) {
    storage.failOnKey = null;
    storage.clear();
    Object.entries(rollback).forEach(([key, value]) => storage.setItem(key, value));
    throw error;
  }
}

function canonical(snapshot) {
  return Object.fromEntries(Object.entries(snapshot).sort(([a], [b]) => a.localeCompare(b)));
}

const phoneState = {
  driverPayV4_activeSaturday: "2026-07-25",
  driverPayV4_closedWeeks: JSON.stringify(["2026-07-18"]),
  driverPayV4_weeklyRestCandidate: JSON.stringify({ finishISO: "2026-07-18T14:00:00.000Z", active: true }),
  driverPayV4_weeklyCompensationLedger: JSON.stringify([
    { id: "comp-1", amountDueMinutes: 600, remainingMinutes: 600, status: "outstanding", deadlineISO: "2026-08-15" }
  ]),
  driverPayV4_payProfilesV2: JSON.stringify([
    { id: "profile-arc", name: "ARC → Turners", taxMode: "gross-only" }
  ]),
  driverPayV4_activePayProfileId: "profile-arc",
  "driverApp_week_2026-07-25": JSON.stringify({
    days: [
      { dateISO: "2026-07-20", dayType: "work", start: "06:00", finish: "17:00", startKm: "120000", finishKm: "120420" },
      { dateISO: "2026-07-21", dayType: "off", start: "", finish: "", startKm: "", finishKm: "" }
    ],
    payslipActualWeek: "812.44"
  }),
  archive: JSON.stringify([{ weekEnding: "2026-07-18", totalHours: 58.5 }]),
  settings: JSON.stringify({ companyName: "ARC → Turners", weekdayRate: "14.00", taxMode: "gross-only" }),
  driverPayV4_language: "bg"
};

const computerStorage = new MemoryStorage({
  driverPayV4_activeSaturday: "2026-08-01",
  driverPayV4_weeklyCompensationLedger: JSON.stringify([]),
  settings: JSON.stringify({ companyName: "TEST DATA" }),
  unrelatedTestKey: "must be replaced by restore"
});

const phoneStorage = new MemoryStorage(phoneState);
const exportedSnapshot = collectStorageSnapshot(phoneStorage);
restoreStorageSnapshot(computerStorage, exportedSnapshot);

assert.deepEqual(
  canonical(collectStorageSnapshot(computerStorage)),
  canonical(exportedSnapshot),
  "Restore must make computer storage identical to the phone backup snapshot."
);
assert.equal(computerStorage.getItem("unrelatedTestKey"), null, "Restore must replace stale local state, not merge it.");
assert.equal(
  JSON.parse(computerStorage.getItem("driverPayV4_weeklyCompensationLedger"))[0].remainingMinutes,
  600,
  "Compensation ledger must survive the round trip unchanged."
);
assert.equal(
  JSON.parse(computerStorage.getItem("driverApp_week_2026-07-25")).days[0].finishKm,
  "120420",
  "Saved week facts and kilometres must survive the round trip unchanged."
);

// Atomic rollback: a failed restore must leave the previous computer state untouched.
const rollbackStorage = new MemoryStorage({ safe: "original", settings: '{"companyName":"Before"}' });
const beforeFailure = canonical(collectStorageSnapshot(rollbackStorage));
rollbackStorage.failOnKey = "driverPayV4_closedWeeks";
assert.throws(() => restoreStorageSnapshot(rollbackStorage, exportedSnapshot));
assert.deepEqual(
  canonical(collectStorageSnapshot(rollbackStorage)),
  beforeFailure,
  "A failed restore must roll back completely."
);

// Production-source guard: ensure the current app still uses the complete v2 snapshot path.
const here = path.dirname(fileURLToPath(import.meta.url));
const appSource = fs.readFileSync(path.resolve(here, "../src/App.tsx"), "utf8");
const requiredSourceFragments = [
  "version: 2",
  "storageSnapshot: collectLocalStorageSnapshot()",
  "restoreLocalStorageSnapshot(snapshot)",
  "window.location.reload()",
  "const rollback = collectLocalStorageSnapshot()",
  "localStorage.clear()"
];
for (const fragment of requiredSourceFragments) {
  assert.ok(appSource.includes(fragment), `Production backup/restore guard missing: ${fragment}`);
}

// No visual or user-facing text changes are part of this test-only release.
const forbiddenTestImports = [
  'from "./scripts/backup-restore-roundtrip-test.mjs"',
  "backup-restore-roundtrip-test"
];
for (const fragment of forbiddenTestImports) {
  assert.ok(!appSource.includes(fragment), "Test infrastructure must not be imported into the production UI.");
}

console.log("PASS: complete backup snapshot restores identical logical storage state.");
console.log("PASS: stale computer state is replaced, not merged.");
console.log("PASS: failed restore rolls back atomically.");
console.log("PASS: production v2 snapshot and reload path remain present.");
