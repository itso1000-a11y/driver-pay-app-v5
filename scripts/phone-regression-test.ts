import assert from "node:assert/strict";
import fs from "node:fs";
import { legacyDayRecordsToFactInputs } from "../src/rest-engine/facts.ts";
import { evaluateProductionRestEngine, selectFactualRestCard, selectWeeklyRestPlan } from "../src/rest-engine/presentation.ts";
import { resolveLondonWallTime } from "../src/rest-engine/time.ts";

let passed = 0;
function test(id: string, name: string, body: () => void): void {
  body();
  passed += 1;
  console.log(`PASS ${id} ${name}`);
}

const asOf = resolveLondonWallTime("2026-02-10", "12:00").epochMilliseconds as number;
const row = (id: string, dateISO: string, dayType: "work" | "off" | "holiday", start = "", finish = "") => ({ id, dateISO, dayType, start, finish, completionSource: "user" as const });
const factInput = (start: string, finish = "") => legacyDayRecordsToFactInputs([{ sourceKey: "phone", recordId: "work", dateISO: "2026-02-08", dayType: "work", start, finish, completionSource: "user" }], asOf)[0];

test("P01", "partial Start and Finish values remain UI-only facts", () => {
  for (const value of ["0", "1", "08", "080", "08:", "", "2x", "2560"]) {
    const start = factInput(value);
    const finish = factInput("08:00", value);
    assert.doesNotThrow(() => legacyDayRecordsToFactInputs([{ sourceKey: "phone", recordId: `start-${value}`, dateISO: "2026-02-08", dayType: "work", start: value, completionSource: "user" }], asOf));
    assert.equal(start.start, null, `partial Start ${JSON.stringify(value)}`);
    assert.equal(finish.end, null, `partial Finish ${JSON.stringify(value)}`);
  }
  assert.equal(factInput("08:00").start?.wallTime, "08:00");
  assert.equal(factInput("0800").start?.wallTime, "08:00");
  assert.equal(factInput("08:00", "19:30").end?.wallTime, "19:30");
  assert.equal(factInput("08:00:00", "19:30:00").start?.wallTime, "08:00:00");
});

test("P02", "Friday Finish through Off day to Sunday Start remains 36h30", () => {
  const days = [row("fri", "2026-02-06", "work", "08:00", "19:30"), row("sat", "2026-02-07", "off"), row("sun", "2026-02-08", "work", "08:00", "18:00")];
  const engine = evaluateProductionRestEngine({ days: JSON.stringify(days), driverApp_days: JSON.stringify(days) }, asOf).evaluation;
  const card = selectFactualRestCard(engine, "2026-02-08");
  assert.equal(card.durationMilliseconds, (36 * 60 + 30) * 60_000);
  assert.equal(card.classification, "WEEKLY_REDUCED");
});

test("P03", "multiple Off and Holiday days preserve the prior factual finish", () => {
  const days = [row("fri", "2026-02-06", "work", "08:00", "19:30"), row("sat", "2026-02-07", "off"), row("sun", "2026-02-08", "holiday"), row("mon", "2026-02-09", "work", "08:00", "18:00")];
  const engine = evaluateProductionRestEngine({ days: JSON.stringify(days), driverApp_days: JSON.stringify(days) }, asOf).evaluation;
  assert.equal(selectFactualRestCard(engine, "2026-02-09").durationMilliseconds, (60 * 60 + 30) * 60_000);
});

test("P04", "driver presentation has no engine jargon and preserves old wording", () => {
  const source = fs.readFileSync(new URL("../src/rest-engine/presentation.ts", import.meta.url), "utf8");
  const app = fs.readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /rolling 144h|allocation pending|allocation branch/i);
  assert.match(source, /Weekly rest required/);
  assert.match(source, /Compensation due/);
  assert.match(source, /Compensate by/);
  assert.match(app, /linear-gradient\(135deg,#ffffff 0%,#fee2e2 100%\)/);
  assert.match(app, /linear-gradient\(135deg,#ffffff 0%,#fef9c3 100%\)/);
  assert.match(app, /linear-gradient\(135deg,#ffffff 0%,#dcfce7 100%\)/);
});

test("P05", "PWA retains waiting worker until Update is pressed", () => {
  const main = fs.readFileSync(new URL("../src/main.tsx", import.meta.url), "utf8");
  const worker = fs.readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
  assert.match(main, /New version available/);
  assert.match(main, /button\.textContent = "Update"/);
  assert.match(main, /registration\.waiting\.postMessage\(\{ type: "SKIP_WAITING" \}\)/);
  assert.match(main, /controllerchange/);
  assert.doesNotMatch(worker, /then\(\(\) => self\.skipWaiting\(\)\)/);
  assert.match(worker, /event\.data\.type === "SKIP_WAITING"/);
});

test("P06", "Weekly Rest plan remains driver-facing after engine evaluation", () => {
  const engine = evaluateProductionRestEngine({ days: JSON.stringify([row("fri", "2026-02-06", "work", "08:00", "19:30")]), driverApp_days: JSON.stringify([row("fri", "2026-02-06", "work", "08:00", "19:30")]) }, asOf).evaluation;
  const plan = selectWeeklyRestPlan(engine);
  assert.doesNotMatch(`${plan.text.en}\n${plan.text.bg}`, /144h|allocation|EngineEvaluation/i);
});

assert.equal(passed, 6);
console.log("Phone regression tests: 6/6 PASS");
