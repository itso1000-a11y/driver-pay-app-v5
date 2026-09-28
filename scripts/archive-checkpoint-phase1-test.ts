import assert from "node:assert/strict";
import fs from "node:fs";
import {
  canBecomeTimelyPaid,
  canonicalizeFrontier,
  checkpointsSemanticallyEquivalent,
  createCheckpoint,
  deserializeCheckpoint,
  factualSourceIdentity,
  frontierStateKey,
  invalidateCheckpointsForFactEdit,
  isCheckpointStale,
  serializeCheckpoint,
  type CheckpointFrontierState,
} from "../src/rest-engine/checkpoint.ts";
import { migrateLegacyFacts } from "../src/rest-engine/migration.ts";
import type { ActivityFactInput } from "../src/rest-engine/types.ts";

let passed = 0;
function test(id: string, name: string, body: () => void): void {
  body();
  passed += 1;
  console.log(`${id} PASS — ${name}`);
}

const fact = (factId: string, wallDate: string, revision = 1): ActivityFactInput => ({
  factId,
  kind: "WORK",
  factStatus: "FACTUAL",
  coverage: "FULL_CIVIL_DAY",
  sourceRef: { sourceKind: "TEST", sourceId: factId, wallDate },
  revision,
  revisionFingerprint: `${factId}:${revision}`,
  startEpochMilliseconds: Date.parse(`${wallDate}T06:00:00Z`),
  endEpochMilliseconds: Date.parse(`${wallDate}T16:00:00Z`),
  provenance: "USER_ENTERED",
  reviewStatus: "CLEAR",
  reviewReasons: [],
} as ActivityFactInput);

const frontier = (restIntervalId = "rest-a", optionId = "option-a", debtStatus: CheckpointFrontierState["compensation"][number]["status"] = "OPEN"): CheckpointFrontierState => ({
  branchFingerprint: `branch:${restIntervalId}:${optionId}`,
  legalState: "COMPLIANT",
  reviewStatus: "CLEAR",
  sourceOptionIds: [optionId],
  assignments: [{ fixedWeekId: "2026-09-14", componentId: "component-a", classification: "REDUCED", sourceRestIntervalId: restIntervalId, sourceOptionId: optionId }],
  rollingAnchors: [{ restIntervalId, componentId: "component-a", endEpochMilliseconds: Date.parse("2026-09-16T00:00:00Z"), reviewStatus: "CLEAR" }],
  twoWeekOutcomes: [{ firstWeekId: "2026-09-07", secondWeekId: "2026-09-14", status: "SATISFIED", countedComponentIds: ["component-a"] }],
  compensation: [{ obligationId: "debt-a", sourceRestIntervalId: restIntervalId, sourceComponentId: "component-a", sourceFixedWeekId: "2026-09-14", sourceClassification: "REDUCED", requiredCompensationMilliseconds: 8.5 * 60 * 60 * 1000, deadlineEpochMilliseconds: Date.parse("2026-10-11T23:00:00Z"), status: debtStatus, attachmentRestIntervalId: null, attachmentCompletionEpochMilliseconds: null, reviewReasons: [] }],
  reviewReasons: [],
});

const facts = [fact("fact-a", "2026-09-14"), fact("fact-b", "2026-09-15")];
const identity = factualSourceIdentity(facts, "2026-09-14", "2026-09-15");
const checkpoint = (state = frontier(), source = identity) => createCheckpoint({
  boundaryEpochMilliseconds: Date.parse("2026-09-20T00:00:00Z"),
  boundaryFixedWeekId: "2026-09-14",
  source,
  factualCoverageCompleteThroughBoundary: true,
  frontier: [state],
  dailyRestCarry: { reducedRestCountSinceWeeklyRest: 1, lastResetRestIntervalId: "rest-a" },
  pendingSplitRestCarry: null,
  compensationRegime: "GENERAL_ONLY",
});

test("P1-01", "Decision Register preserves and partially supersedes ARCH-003", () => {
  const governance = fs.readFileSync(new URL("../MASTER_PROJECT_QA_v5.2.60.md", import.meta.url), "utf8");
  assert.match(governance, /ARCH-003 — Current and immediately previous closed pay weeks[\s\S]*SUPERSEDED IN PART/);
  assert.match(governance, /ARCH-003R — Pay-period editability/);
});
test("P1-02", "new archive rules separate editability and computational finalization", () => {
  const governance = fs.readFileSync(new URL("../MASTER_PROJECT_QA_v5.2.60.md", import.meta.url), "utf8");
  assert.match(governance, /ARCH-007 — Computational finalization/);
  assert.match(governance, /Hard UI lock and computational finalization are independent/);
});
test("P1-03", "checkpoint serialization is deterministic", () => assert.equal(serializeCheckpoint(checkpoint()), serializeCheckpoint(checkpoint())));
test("P1-04", "same factual source produces same source hash", () => assert.deepEqual(identity, factualSourceIdentity([...facts].reverse(), "2026-09-14", "2026-09-15")));
test("P1-05", "changed factual source marks checkpoint stale", () => assert.equal(isCheckpointStale(checkpoint(), factualSourceIdentity([fact("fact-a", "2026-09-14", 2), facts[1]], "2026-09-14", "2026-09-15")), true));
test("P1-06", "frontier ordering canonicalizes", () => assert.deepEqual(canonicalizeFrontier([frontier("rest-b", "option-b"), frontier()]), canonicalizeFrontier([frontier(), frontier("rest-b", "option-b")] )));
test("P1-07", "legally distinct source alternatives do not merge", () => assert.equal(canonicalizeFrontier([frontier("rest-a"), frontier("rest-b")]).length, 2));
test("P1-08", "serialization and deserialization are idempotent", () => {
  const initial = checkpoint(); const restored = deserializeCheckpoint(serializeCheckpoint(initial));
  assert.ok(restored); assert.equal(serializeCheckpoint(restored), serializeCheckpoint(initial));
});
test("P1-09", "fact edit invalidates downstream checkpoints only", () => {
  const later = createCheckpoint({ ...checkpoint(), boundaryEpochMilliseconds: Date.parse("2026-09-27T00:00:00Z"), source: { ...identity, lastWallDate: "2026-09-22" }, frontier: [frontier()] });
  const invalidated = invalidateCheckpointsForFactEdit([checkpoint(), later], "2026-09-20");
  assert.deepEqual(invalidated.map((item) => item.checkpointId), [later.checkpointId]);
});
test("P1-10", "legacy no-checkpoint state remains readable", () => assert.equal(deserializeCheckpoint("{}"), null));
test("P1-11", "unknown checkpoint version fails safely", () => assert.equal(deserializeCheckpoint(JSON.stringify({ ...checkpoint(), checkpointVersion: 99 })), null));
test("P1-12", "Reduced source identity remains separate from repayment state", () => {
  const paid = frontier("rest-a", "option-a", "PAID"); paid.compensation[0].attachmentRestIntervalId = "repayment";
  assert.equal(paid.compensation[0].sourceClassification, "REDUCED");
});
test("P1-13", "OVERDUE cannot become timely PAID in the contract", () => assert.equal(canBecomeTimelyPaid("OVERDUE"), false));
test("P1-14", "general contract does not claim international special mode", () => assert.equal(checkpoint().compensationRegime, "GENERAL_ONLY"));
test("P1-15", "real backup dry checkpoint identity is deterministic", () => {
  const path = process.env.REAL_BACKUP_PATH;
  assert.ok(path, "REAL_BACKUP_PATH must point at the supplied backup");
  const snapshot = JSON.parse(fs.readFileSync(path, "utf8")).storageSnapshot;
  const migration = migrateLegacyFacts(snapshot, Date.parse("2026-09-23T12:00:00Z"));
  const factual = migration.facts.filter((item) => item.factStatus === "FACTUAL");
  const dates = factual.map((item) => item.sourceRef.wallDate).sort();
  const realIdentity = factualSourceIdentity(factual, dates[0], dates.at(-1) as string);
  const first = createCheckpoint({ ...checkpoint(), source: realIdentity, frontier: [frontier()] });
  const second = createCheckpoint({ ...checkpoint(), source: factualSourceIdentity([...factual].reverse(), dates[0], dates.at(-1) as string), frontier: [frontier()] });
  assert.equal(serializeCheckpoint(first), serializeCheckpoint(second));
  assert.ok(frontierStateKey(frontier()).includes("sourceRestIntervalId"));
  assert.equal(checkpointsSemanticallyEquivalent(first, second), true);
});

test("C1", "ARCH-003 is retained as historical evidence and superseded in part", () => {
  const governance = fs.readFileSync(new URL("../MASTER_PROJECT_QA_v5.2.60.md", import.meta.url), "utf8");
  assert.match(governance, /ARCH-003 — Current and immediately previous closed pay weeks[\s\S]*Status:\*\* SUPERSEDED IN PART/);
});
test("C2", "ARCH-003R limits ordinary editing to active and immediately previous configured pay periods", () => {
  const governance = fs.readFileSync(new URL("../MASTER_PROJECT_QA_v5.2.60.md", import.meta.url), "utf8");
  assert.match(governance, /Active period and immediately previous configured pay period remain ordinarily editable under the normal correction lifecycle/);
});
test("C3", "ARCH-003R does not make all closed periods indefinitely editable", () => {
  const governance = fs.readFileSync(new URL("../MASTER_PROJECT_QA_v5.2.60.md", import.meta.url), "utf8");
  assert.match(governance, /Older periods are not ordinarily editable once outside the correction window/);
  assert.doesNotMatch(governance, /all closed weeks remain editable until explicitly archived/i);
});
test("C4", "ARCH-008 requires both elapsed correction lifecycle and finalized or losslessly carried dependencies", () => {
  const governance = fs.readFileSync(new URL("../MASTER_PROJECT_QA_v5.2.60.md", import.meta.url), "utf8");
  assert.match(governance, /outside the normal correction lifecycle and every forward legal dependency is either finalized or represented losslessly by the versioned checkpoint frontier/);
});
test("C5", "ARCH-008 does not require a manual create-hard-archive action", () => {
  const governance = fs.readFileSync(new URL("../MASTER_PROJECT_QA_v5.2.60.md", import.meta.url), "utf8");
  assert.match(governance, /Hard-archive status does not require a separate manual archive action/);
});
test("C6", "explicit Unlock remains required to edit hard-archived facts", () => {
  const governance = fs.readFileSync(new URL("../MASTER_PROJECT_QA_v5.2.60.md", import.meta.url), "utf8");
  assert.match(governance, /Editing hard-archived factual history requires explicit Unlock/);
});
test("C7", "computational finalization remains independent from editability", () => {
  const governance = fs.readFileSync(new URL("../MASTER_PROJECT_QA_v5.2.60.md", import.meta.url), "utf8");
  assert.match(governance, /This editability policy is independent from Rest Engine computational activity/);
  assert.match(governance, /Hard UI lock and computational finalization are independent lifecycle dimensions/);
});
test("C8", "checkpoint and frontier contract remains semantically unchanged", () => {
  const first = checkpoint();
  const second = deserializeCheckpoint(serializeCheckpoint(first));
  assert.ok(second);
  assert.equal(checkpointsSemanticallyEquivalent(first, second), true);
  assert.equal(canonicalizeFrontier([frontier(), frontier()]).length, 1);
});
test("C9", "production runtime has no checkpoint module import", () => {
  for (const file of ["../src/App.tsx", "../src/main.tsx", "../src/rest-engine/presentation.ts", "../src/rest-engine/migration.ts"]) {
    const source = fs.readFileSync(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /rest-engine\/checkpoint|\.\/checkpoint/);
  }
});
test("C10", "real-backup 147 total inputs and 136 factual inputs are reproducible and distinct", () => {
  const path = process.env.REAL_BACKUP_PATH;
  assert.ok(path, "REAL_BACKUP_PATH must point at the supplied backup");
  const snapshot = JSON.parse(fs.readFileSync(path, "utf8")).storageSnapshot;
  const migration = migrateLegacyFacts(snapshot, Date.parse("2026-09-23T12:00:00Z"));
  const factual = migration.facts.filter((item) => item.factStatus === "FACTUAL");
  const nonFactual = migration.facts.filter((item) => item.factStatus !== "FACTUAL");
  assert.equal(migration.facts.length, 147);
  assert.equal(factual.length, 136);
  assert.equal(nonFactual.length, 11);
  assert.deepEqual(nonFactual.map((item) => item.sourceRef.wallDate), [
    "2026-05-03", "2026-05-04", "2026-05-05", "2026-05-06", "2026-05-07", "2026-05-08", "2026-05-09",
    "2026-09-23", "2026-09-24", "2026-09-25", "2026-09-26",
  ]);
});

console.log(`ARCHIVE CHECKPOINT PHASE 1A: ${passed}/25 PASS`);
