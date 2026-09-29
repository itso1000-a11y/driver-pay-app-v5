import assert from "node:assert/strict";
import fs from "node:fs";
import { legacyDayRecordsToFactInputs } from "../src/rest-engine/facts.ts";
import { buildAuthoritativeLegacySnapshot, evaluateProductionRestEngine, selectFactualRestCard } from "../src/rest-engine/presentation.ts";
import { resolveLondonWallTime } from "../src/rest-engine/time.ts";

let passed = 0;
function test(id: string, name: string, body: () => void): void { body(); passed += 1; console.log(`PASS ${id} ${name}`); }
const asOf = resolveLondonWallTime("2026-09-30", "12:00").epochMilliseconds as number;
const epoch = (date: string, time: string) => resolveLondonWallTime(date, time).epochMilliseconds as number;
const day = (id: string, dateISO: string, dayType: "work" | "off" | "holiday", start = "", finish = "", completed = true) => ({ id, dateISO, dayType, start, finish, ...(completed ? { completionSource: "user" as const } : {}) });
const legacyNonWorkDay = (id: string, dateISO: string, dayType: "off" | "holiday") => ({ id, dateISO, dayType, start: "", finish: "" });

function productionState(sundayStart: string, nonWork: "off" | "holiday" = "off") {
  // The closed archive is the narrow durable historical signal for a legacy
  // row created before completionSource existed. Do not pre-populate it.
  const prior = [day("fri", "2026-09-18", "work", "08:00", "19:30"), legacyNonWorkDay("sat", "2026-09-19", nonWork)];
  const visible = [day("sun", "2026-09-20", "work", sundayStart)];
  const snapshot = buildAuthoritativeLegacySnapshot({
    baseSnapshot: { "driverApp_week_2026-09-19": JSON.stringify({ days: [prior[1]] }) },
    visibleDays: visible,
    visibleSaturdayISO: "2026-09-26",
    activeSaturdayISO: "2026-09-26",
    archive: [{ days: prior }],
  });
  return { snapshot, state: evaluateProductionRestEngine(snapshot, asOf) };
}

function assertPhoneRest(sundayStart: string, expectedMinutes: number, nonWork: "off" | "holiday" = "off") {
  const { state } = productionState(sundayStart, nonWork);
  const fridayFinish = epoch("2026-09-18", "19:30");
  const sundayBegin = epoch("2026-09-20", sundayStart);
  const interval = state.evaluation.restIntervals.find((item) => item.startEpochMilliseconds === fridayFinish && item.endEpochMilliseconds === sundayBegin);
  assert.ok(interval, `production RestInterval must start at Friday Finish and end at Sunday Start: ${JSON.stringify(state.evaluation.restIntervals)}`);
  assert.equal(interval.elapsedMilliseconds, expectedMinutes * 60_000);
  const card = selectFactualRestCard(state.evaluation, "2026-09-20");
  assert.equal(card.durationMilliseconds, expectedMinutes * 60_000);
  assert.equal(card.classification, "WEEKLY_REDUCED");
  return { fridayFinish, sundayBegin, interval, card };
}

test("R01", "closed-archive legacy Off without completionSource gives Friday 19:30 -> Sunday 08:00 = 36h30", () => {
  assert.equal(Object.hasOwn(productionState("08:00").snapshot, "completionSource"), false);
  const result = assertPhoneRest("08:00", 36 * 60 + 30);
  assert.equal(result.fridayFinish, result.interval.startEpochMilliseconds);
  assert.equal(result.sundayBegin, result.interval.endEpochMilliseconds);
});

test("R02", "closed-archive legacy Off without completionSource gives Sunday 05:15 = 33h45", () => {
  assertPhoneRest("05:15", 33 * 60 + 45);
});

test("L03", "Holiday continuity uses the same production path", () => { assertPhoneRest("08:00", 36 * 60 + 30, "holiday"); });

test("L04", "multiple non-work days preserve the preceding factual Finish", () => {
  const records = [day("fri", "2026-02-06", "work", "08:00", "19:30"), day("sat", "2026-02-07", "off"), day("sun", "2026-02-08", "holiday"), day("mon", "2026-02-09", "work", "08:00")];
  const state = evaluateProductionRestEngine({ days: JSON.stringify(records), driverApp_days: JSON.stringify(records) }, asOf);
  assert.equal(selectFactualRestCard(state.evaluation, "2026-02-09").durationMilliseconds, (60 * 60 + 30) * 60_000);
});

test("R03", "reload and restore retain duplicate-source legacy historical evidence", () => {
  const first = productionState("08:00");
  const persisted = JSON.parse(JSON.stringify(first.snapshot));
  const reloaded = evaluateProductionRestEngine(persisted, asOf);
  const restored = evaluateProductionRestEngine(JSON.parse(JSON.stringify(persisted)), asOf);
  assert.deepEqual(reloaded.migration.facts, first.state.migration.facts);
  assert.deepEqual(restored.migration.facts, first.state.migration.facts);
  assert.equal(selectFactualRestCard(reloaded.evaluation, "2026-09-20").durationMilliseconds, 36.5 * 60 * 60_000);
});

test("R04", "saved-week legacy Off without matching archive evidence remains non-factual", () => {
  const savedOnly = legacyNonWorkDay("saved-only", "2026-09-19", "off");
  const state = evaluateProductionRestEngine({ "driverApp_week_2026-09-19": JSON.stringify({ days: [savedOnly] }) }, asOf);
  assert.equal(state.migration.facts[0]?.factStatus, "PLACEHOLDER");
});

test("R05", "conflicting archive and saved-week records do not inherit historical evidence", () => {
  const archive = legacyNonWorkDay("sat", "2026-09-19", "off");
  const conflict = { ...archive, dayType: "holiday" as const };
  const state = evaluateProductionRestEngine({ archive: JSON.stringify([{ days: [archive] }]), "driverApp_week_2026-09-19": JSON.stringify({ days: [conflict] }) }, asOf);
  assert.equal(state.migration.facts[0]?.factStatus, "PLACEHOLDER");
});

test("R06", "current, future and default unconfirmed non-work rows remain non-factual", () => {
  const currentAsOf = epoch("2026-09-19", "12:00");
  const facts = legacyDayRecordsToFactInputs([
    legacyNonWorkDay("default", "2026-09-19", "off"),
    legacyNonWorkDay("future-off", "2026-09-20", "off"),
    legacyNonWorkDay("future-holiday", "2026-09-21", "holiday"),
  ], currentAsOf);
  assert.deepEqual(facts.map((fact) => fact.factStatus), ["PLACEHOLDER", "PLANNED", "PLANNED"]);
});

test("R07", "explicit past user provenance remains factual", () => {
  const fact = legacyDayRecordsToFactInputs([day("explicit", "2026-09-19", "off")], asOf)[0];
  assert.equal(fact.factStatus, "FACTUAL");
});

test("R08", "London civil-date classification remains authoritative", () => {
  const boundaryAsOf = epoch("2026-09-20", "00:30");
  const [past, current, future] = legacyDayRecordsToFactInputs([
    { ...legacyNonWorkDay("past", "2026-09-19", "off"), sourceKey: "archive", recordId: "past", historicalPersisted: true },
    { ...legacyNonWorkDay("current", "2026-09-20", "off"), sourceKey: "archive", recordId: "current", historicalPersisted: true },
    { ...legacyNonWorkDay("future", "2026-09-21", "off"), sourceKey: "archive", recordId: "future", historicalPersisted: true },
  ], boundaryAsOf);
  assert.deepEqual([past.factStatus, current.factStatus, future.factStatus], ["FACTUAL", "PLACEHOLDER", "PLANNED"]);
});

test("R06", "complete compact HHMM normalizes as factual legacy time", () => {
  const fact = legacyDayRecordsToFactInputs([day("compact", "2026-02-08", "work", "0800", "1800")], asOf)[0];
  assert.equal(fact.start?.wallTime, "08:00"); assert.equal(fact.end?.wallTime, "18:00");
});

test("R07", "one to three digit editing values do not become facts", () => {
  for (const value of ["0", "08", "080", "2560"]) {
    const fact = legacyDayRecordsToFactInputs([day(`partial-${value}`, "2026-02-08", "work", value, value)], asOf)[0];
    assert.equal(fact.start, null); assert.equal(fact.end, null);
  }
});

test("R08", "historic 45h/24h fields retain completion-threshold semantics", () => {
  const app = fs.readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
  assert.match(app, /weeklyRest45Start.*weeklyRestTargets\.fullStart/);
  assert.match(app, /weeklyRest24Start.*secondary/);
  assert.match(app, /weeklyRestTargets\.fullStart/);
});

test("R09", "latest legal start has its own correct label", () => {
  const presentation = fs.readFileSync(new URL("../src/rest-engine/presentation.ts", import.meta.url), "utf8");
  assert.match(presentation, /Latest legal weekly-rest start: \$\{timeLabel\(due/);
  assert.doesNotMatch(presentation, /45h Start: \$\{timeLabel\(due/);
});

test("R10", "normal driver presentation retains no internal engine jargon", () => {
  const presentation = fs.readFileSync(new URL("../src/rest-engine/presentation.ts", import.meta.url), "utf8");
  assert.doesNotMatch(presentation, /rolling 144h|allocation pending|allocation branch/i);
});

test("S08", "unconfirmed default Sunday Off remains non-factual", () => {
  const fact = legacyDayRecordsToFactInputs([day("default-sunday", "2026-02-08", "off", "", "", false)], asOf)[0];
  assert.equal(fact.factStatus, "PLACEHOLDER");
});

test("S08a", "past current-storage Off without confirmation remains non-factual", () => {
  const fact = legacyDayRecordsToFactInputs([legacyNonWorkDay("current-off", "2026-02-08", "off")], asOf)[0];
  assert.equal(fact.factStatus, "PLACEHOLDER");
});

test("S09", "future planned Off and Holiday remain non-factual", () => {
  for (const kind of ["off", "holiday"] as const) {
    const fact = legacyDayRecordsToFactInputs([day(`future-${kind}`, "2026-10-01", kind)], asOf)[0];
    assert.equal(fact.factStatus, "PLANNED");
  }
});

test("S10", "the production day-type action records only an explicit past selection as user evidence", () => {
  const app = fs.readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
  assert.match(app, /formatLondonInstant\(Date\.now\(\)\)\.wallDate/);
});

test("S10a", "legacy past/current/future classification uses the London as-of date", () => {
  const boundaryAsOf = epoch("2026-02-08", "00:30");
  const [past, current, future] = legacyDayRecordsToFactInputs([
    { ...legacyNonWorkDay("past", "2026-02-07", "off"), sourceKey: "archive", recordId: "past", historicalPersisted: true },
    { ...legacyNonWorkDay("current", "2026-02-08", "off"), sourceKey: "archive", recordId: "current", historicalPersisted: true },
    { ...legacyNonWorkDay("future", "2026-02-09", "off"), sourceKey: "archive", recordId: "future", historicalPersisted: true },
  ], boundaryAsOf);
  assert.equal(past.factStatus, "FACTUAL");
  assert.equal(current.factStatus, "PLACEHOLDER");
  assert.equal(future.factStatus, "PLANNED");
});

test("S11-S13", "accepted RED YELLOW GREEN palettes are locked", () => {
  const app = fs.readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
  for (const value of ["linear-gradient(135deg,#ffffff 0%,#fee2e2 100%)", "#fca5a5", "#b91c1c", "linear-gradient(135deg,#ffffff 0%,#fef9c3 100%)", "#fde68a", "#a16207", "linear-gradient(135deg,#ffffff 0%,#dcfce7 100%)", "#86efac", "#166534"]) assert.ok(app.includes(value));
});

test("S14-S19", "presentation removes raw severity and protects debt wording", () => {
  const app = fs.readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
  const presentation = fs.readFileSync(new URL("../src/rest-engine/presentation.ts", import.meta.url), "utf8");
  assert.doesNotMatch(app, /\}\{panel\.level\}/);
  assert.match(app, /hasConfirmedDebt/);
  assert.match(app, /completedOnly/);
  assert.doesNotMatch(presentation, /rolling 144h|allocation pending|allocation branch/i);
  assert.match(presentation, /Weekly rest required/);
  assert.match(presentation, /Weekly rest not completed/);
  assert.match(presentation, /Compensation due/);
});

assert.equal(passed, 22);
console.log("Phone production-path tests: 22/22 PASS");
