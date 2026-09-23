import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import {
  type ActivityFactInput,
  type RestBoundary,
  type RestInterval,
} from "../src/rest-engine/types.ts";
import {
  legacyDayRecordsToFactInputs,
  normalizeActivityFacts,
} from "../src/rest-engine/facts.ts";
import { deriveRestIntervals } from "../src/rest-engine/chronology.ts";
import {
  generateWeeklyRestComponentOptions,
  REGULAR_WEEKLY_REST_MINIMUM_MILLISECONDS,
} from "../src/rest-engine/weekly-rest-candidates.ts";
import {
  addElapsedHours,
  addElapsedMilliseconds,
  compareInstants,
  formatLondonInstant,
  resolveLondonWallTime,
} from "../src/rest-engine/time.ts";

const HOUR = 60 * 60 * 1000;
const BASELINE_PAY_SLICE_SHA = "1811C857F2186F5EE7BAD82497B74878142CEB77D2139D21506B209710630953";
const projectRoot = resolve(".");
let passed = 0;

function test(id: string, name: string, body: () => void) {
  body();
  passed += 1;
  console.log(`PASS ${id} — ${name}`);
}

function instant(wallDate: string, wallTime: string): number {
  const result = resolveLondonWallTime(wallDate, wallTime);
  assert.equal(result.resolution, "VALID");
  return result.epochMilliseconds as number;
}

function work(
  factId: string,
  wallDate: string,
  start: string | null,
  end: string | null,
  overrides: Partial<ActivityFactInput> = {},
): ActivityFactInput {
  return {
    factId,
    sourceRef: { sourceKey: "fixture", recordId: factId, wallDate },
    kind: "WORK",
    factStatus: "FACTUAL",
    coverage: "FULL_CIVIL_DAY",
    start: start ? { wallDate, wallTime: start } : null,
    end: end ? { wallDate, wallTime: end } : null,
    ...overrides,
  };
}

function off(factId: string, wallDate: string, overrides: Partial<ActivityFactInput> = {}): ActivityFactInput {
  const start = resolveLondonWallTime(wallDate, "00:00:00");
  const endDate = formatLondonInstant(start.candidates[0].epochMilliseconds + 36 * HOUR).wallDate;
  const nextMidnight = resolveLondonWallTime(endDate, "00:00:00");
  const actualNextDate = formatLondonInstant(nextMidnight.candidates[0].epochMilliseconds).wallDate;
  return {
    factId,
    sourceRef: { sourceKey: "fixture", recordId: factId, wallDate },
    kind: "OFF",
    factStatus: "FACTUAL",
    coverage: "FULL_CIVIL_DAY",
    start: { wallDate, wallTime: "00:00:00" },
    end: { wallDate: actualNextDate, wallTime: "00:00:00" },
    ...overrides,
  };
}

function pipeline(inputs: readonly ActivityFactInput[], asOf: number) {
  const normalized = normalizeActivityFacts(inputs);
  const chronology = deriveRestIntervals(normalized.facts, asOf);
  const candidates = generateWeeklyRestComponentOptions(chronology.intervals);
  return { normalized, chronology, candidates };
}

function findInterval(result: ReturnType<typeof pipeline>, start: number, end: number | null): RestInterval {
  const interval = result.chronology.intervals.find((candidate) =>
    candidate.startEpochMilliseconds === start && candidate.endEpochMilliseconds === end
  );
  assert.ok(interval, `Missing RestInterval ${start} -> ${end}`);
  return interval;
}

function boundary(epoch: number, role: RestBoundary["role"]): RestBoundary {
  const civil = formatLondonInstant(epoch);
  return {
    sourceFactIds: ["synthetic"],
    role,
    time: resolveLondonWallTime(civil.wallDate, civil.wallTime),
    epochMilliseconds: epoch,
  };
}

function syntheticRest(
  id: string,
  start: number,
  duration: number,
  review = false,
  open = false,
): RestInterval {
  const observedEnd = start + duration;
  return {
    restIntervalId: id,
    startBoundary: boundary(start, "WORK_END"),
    endBoundary: open ? null : boundary(observedEnd, "WORK_START"),
    startEpochMilliseconds: start,
    endEpochMilliseconds: open ? null : observedEnd,
    observedThroughEpochMilliseconds: observedEnd,
    elapsedMilliseconds: duration,
    elapsedRangeMilliseconds: null,
    supportingFactIds: ["synthetic"],
    state: open ? "OPEN" : "CLOSED",
    provenance: "EXPLICIT",
    reviewStatus: review ? "REVIEW_REQUIRED" : "CLEAR",
    reviewReasons: review ? ["Synthetic uncertainty."] : [],
  };
}

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, { cwd: projectRoot, encoding: "utf8", shell: false });
  assert.equal(result.status, 0, `${command} ${args.join(" ")} failed\n${result.stdout}\n${result.stderr}`);
  return `${result.stdout}\n${result.stderr}`;
}

function runNpm(args: string[]) {
  assert.ok(process.env.npm_execpath, "npm_execpath is required when the release test is launched through npm");
  return run(process.execPath, [process.env.npm_execpath, ...args]);
}

const asOf = instant("2026-02-05", "00:00:00");

test("T01", "Finish→next Start creates one maximal factual interval", () => {
  const result = pipeline([
    work("mon", "2026-02-02", "08:00", "18:00"),
    off("tue", "2026-02-03"),
    work("wed", "2026-02-04", "06:00", "15:00"),
  ], asOf);
  const interval = findInterval(result, instant("2026-02-02", "18:00"), instant("2026-02-04", "06:00"));
  assert.equal(interval.elapsedMilliseconds, 36 * HOUR);
});

test("T02", "midnight does not split factual rest", () => {
  const result = pipeline([
    work("d1", "2026-02-02", "10:00", "23:00"),
    work("d2", "2026-02-03", "01:00", "08:00"),
  ], instant("2026-02-04", "00:00"));
  assert.equal(findInterval(result, instant("2026-02-02", "23:00"), instant("2026-02-03", "01:00")).elapsedMilliseconds, 2 * HOUR);
});

test("T03", "Monday fixed-week boundary does not split factual rest", () => {
  const result = pipeline([
    work("sun", "2026-02-01", "08:00", "18:00"),
    off("mon", "2026-02-02"),
    work("tue", "2026-02-03", "06:00", "14:00"),
  ], instant("2026-02-04", "00:00"));
  assert.equal(findInterval(result, instant("2026-02-01", "18:00"), instant("2026-02-03", "06:00")).elapsedMilliseconds, 36 * HOUR);
});

const crossPayWeekFacts = [work("sat", "2026-02-07", "08:00", "18:00"), off("sun", "2026-02-08"), work("mon2", "2026-02-09", "06:00", "15:00")];
test("T04", "pay-week and End Week metadata do not change chronology", () => {
  const plain = pipeline(crossPayWeekFacts, instant("2026-02-10", "00:00"));
  const decorated = pipeline(crossPayWeekFacts.map((fact) => ({ ...fact, payWeek: "other", endWeek: true } as ActivityFactInput)), instant("2026-02-10", "00:00"));
  assert.deepEqual(decorated, plain);
});

test("T05", "open interval uses explicit asOf and has stable identity", () => {
  const result = pipeline([work("open", "2026-02-02", "08:00", "18:00")], instant("2026-02-02", "20:00"));
  const interval = findInterval(result, instant("2026-02-02", "18:00"), null);
  assert.equal(interval.state, "OPEN");
  assert.equal(interval.elapsedMilliseconds, 2 * HOUR);
});

test("T06", "planned future Off gives no factual credit", () => {
  const input = legacyDayRecordsToFactInputs([{ sourceKey: "w", recordId: "future-off", dateISO: "2026-02-10", dayType: "off", completionSource: "user" }], instant("2026-02-02", "12:00"));
  const result = pipeline(input, instant("2026-02-02", "12:00"));
  assert.equal(result.normalized.facts[0].factStatus, "PLANNED");
  assert.equal(result.chronology.intervals.length, 0);
});

test("T07", "past explicitly completed Off and Holiday provide coverage", () => {
  const input = legacyDayRecordsToFactInputs([
    { sourceKey: "w", recordId: "off", dateISO: "2026-02-01", dayType: "off", completionSource: "user" },
    { sourceKey: "w", recordId: "holiday", dateISO: "2026-02-02", dayType: "holiday", completionSource: "user" },
  ], instant("2026-02-03", "12:00"));
  const result = pipeline(input, instant("2026-02-03", "00:00"));
  assert.ok(result.chronology.intervals.some((interval) => interval.elapsedMilliseconds === 48 * HOUR));
});

test("T08", "future blank row gives no evidence", () => {
  const input = legacyDayRecordsToFactInputs([{ sourceKey: "w", recordId: "blank", dateISO: "2026-02-10", dayType: "work" }], instant("2026-02-02", "12:00"));
  assert.equal(normalizeActivityFacts(input).facts[0].coverage, "NONE");
});

test("T09", "past untouched placeholder gives no evidence", () => {
  const input = legacyDayRecordsToFactInputs([{ sourceKey: "w", recordId: "blank", dateISO: "2026-02-01", dayType: "work" }], instant("2026-02-02", "12:00"));
  const fact = normalizeActivityFacts(input).facts[0];
  assert.equal(fact.factStatus, "PLACEHOLDER");
  assert.equal(fact.coverage, "NONE");
});

test("T10", "incomplete Work creates a REVIEW barrier", () => {
  const result = pipeline([work("incomplete", "2026-02-02", "10:00", null)], instant("2026-02-02", "20:00"));
  const start = instant("2026-02-02", "10:00");
  const preceding = findInterval(result, instant("2026-02-02", "00:00"), start);
  assert.ok(result.chronology.issues.some((item) => item.code === "INCOMPLETE_WORK_START"));
  assert.equal(preceding.reviewStatus, "CLEAR");
  assert.ok(result.chronology.intervals.every((interval) => interval.observedThroughEpochMilliseconds <= start));
});

test("T11", "historical Start/Finish correction rebuilds interval", () => {
  const next = work("next", "2026-02-03", "08:00", "16:00");
  const oldResult = pipeline([work("prior", "2026-02-02", "08:00", "18:00"), next], instant("2026-02-04", "00:00"));
  const corrected = pipeline([work("prior", "2026-02-02", "08:00", "20:00"), next], instant("2026-02-04", "00:00"));
  assert.equal(findInterval(oldResult, instant("2026-02-02", "18:00"), instant("2026-02-03", "08:00")).elapsedMilliseconds, 14 * HOUR);
  assert.equal(findInterval(corrected, instant("2026-02-02", "20:00"), instant("2026-02-03", "08:00")).elapsedMilliseconds, 12 * HOUR);
});

test("T12", "invalid and overlapping Work facts are diagnosed", () => {
  const result = pipeline([
    work("a", "2026-02-02", "08:00", "14:00"),
    work("b", "2026-02-02", "12:00", "16:00"),
    work("bad", "2026-02-03", "18:00", "08:00"),
  ], instant("2026-02-04", "00:00"));
  assert.ok(result.chronology.issues.some((item) => item.code === "OVERLAPPING_WORK_FACTS"));
  assert.ok(result.chronology.issues.some((item) => item.code === "INVALID_WORK_ORDER"));
});

const crossWeekStart = instant("2026-02-07", "12:00");
function patterns(durationHours: number) {
  const rest = syntheticRest(`r-${durationHours}`, crossWeekStart, durationHours * HOUR);
  return generateWeeklyRestComponentOptions([rest]).options;
}

test("T13", "exactly 24h creates reduced option", () => assert.deepEqual(patterns(24).map((item) => item.pattern), ["SINGLE_REDUCED"]));
test("T14", "23h59m59s creates no Weekly Rest option", () => assert.equal(generateWeeklyRestComponentOptions([syntheticRest("short", crossWeekStart, 24 * HOUR - 1000)]).options.length, 0));
test("T15", "44h59m remains reduced and uses its actual duration", () => {
  const duration = 45 * HOUR - 60_000;
  const item = generateWeeklyRestComponentOptions([syntheticRest("r44", crossWeekStart, duration)]).options[0];
  assert.equal(item.pattern, "SINGLE_REDUCED");
  assert.equal(item.components[0].actualDurationMilliseconds, duration);
  assert.equal(item.totalMinimumDurationMilliseconds, duration);
  assert.equal(item.placementDomain?.unallocatedCapacityMilliseconds, 0);
});
test("T16", "exactly 45h creates regular option", () => assert.deepEqual(patterns(45).map((item) => item.pattern), ["SINGLE_REGULAR"]));

test("T17", "55h preserves 45h capacity and 10h unallocated", () => {
  const item = patterns(55)[0];
  assert.equal(item.totalMinimumDurationMilliseconds, 45 * HOUR);
  assert.equal(item.placementDomain?.unallocatedCapacityMilliseconds, 10 * HOUR);
});

test("T18", "cross-week 69h preserves both 45+24 orientations", () => {
  const set = new Set(patterns(69).map((item) => item.pattern));
  assert.ok(set.has("REGULAR_THEN_REDUCED"));
  assert.ok(set.has("REDUCED_THEN_REGULAR"));
});

test("T19", "90h preserves 45+45 capability", () => assert.ok(patterns(90).some((item) => item.pattern === "REGULAR_THEN_REGULAR")));
test("T20", "one RestInterval can produce multiple options", () => assert.equal(patterns(69).length, 3));
test("T21", "candidate generation creates no compensation debt", () => assert.equal(/Compensation|debt/i.test(JSON.stringify(patterns(90))), false));

test("T22", "cross-week option has no permanent start-week owner", () => {
  const item = patterns(69).find((option) => option.pattern === "REGULAR_THEN_REDUCED") as Record<string, unknown>;
  assert.ok(item.crossedFixedWeekBoundaries);
  assert.equal("fixedWeekOwner" in item, false);
});

test("T23", "pay-week configuration does not affect result", () => {
  const input = crossPayWeekFacts.map((fact) => ({ ...fact, payWeekConfiguration: { starts: "Sunday" } } as ActivityFactInput));
  assert.deepEqual(pipeline(input, instant("2026-02-10", "00:00")), pipeline(crossPayWeekFacts, instant("2026-02-10", "00:00")));
});

test("T24", "UI/archive/navigation state does not affect result", () => {
  const input = crossPayWeekFacts.map((fact) => ({ ...fact, ui: { archive: true, screen: "Week Preview" } } as ActivityFactInput));
  assert.deepEqual(pipeline(input, instant("2026-02-10", "00:00")), pipeline(crossPayWeekFacts, instant("2026-02-10", "00:00")));
});

test("T25", "device timezone does not affect factual chronology", () => {
  const original = process.env.TZ;
  const outputs: unknown[] = [];
  try {
    for (const zone of ["America/Los_Angeles", "Pacific/Auckland"]) {
      process.env.TZ = zone;
      outputs.push(pipeline(crossPayWeekFacts, instant("2026-02-10", "00:00")));
    }
  } finally {
    if (original == null) delete process.env.TZ; else process.env.TZ = original;
  }
  assert.deepEqual(outputs[0], outputs[1]);
});

test("T26", "spring DST chronology uses exact elapsed duration", () => {
  const start = instant("2026-03-28", "12:00");
  const end = instant("2026-03-29", "12:00");
  assert.equal(end - start, 23 * HOUR);
  assert.equal(generateWeeklyRestComponentOptions([syntheticRest("spring", start, end - start)]).options.length, 0);
});

test("T27", "autumn DST chronology uses exact elapsed duration", () => {
  const start = instant("2026-10-24", "12:00");
  const end = instant("2026-10-25", "12:00");
  assert.equal(end - start, 25 * HOUR);
  assert.equal(generateWeeklyRestComponentOptions([syntheticRest("autumn", start, end - start)]).options[0].pattern, "SINGLE_REDUCED");
});

test("T28", "ambiguous fold boundary propagates REVIEW and candidates", () => {
  const fold = resolveLondonWallTime("2026-10-25", "01:30", { provenance: "ASSUMED" });
  const result = pipeline([
    work("fold-a", "2026-10-25", "00:30", null, { end: fold }),
    work("fold-b", "2026-10-27", "06:00", "14:00"),
  ], instant("2026-10-28", "00:00"));
  const interval = result.chronology.intervals.find((item) => item.startBoundary.sourceFactIds.includes("fold-a"));
  assert.equal(fold.candidates.length, 2);
  assert.equal(interval?.reviewStatus, "REVIEW_REQUIRED");
  assert.ok(result.candidates.options.some((item) => item.restIntervalId === interval?.restIntervalId && item.pattern === "REVIEW_ONLY"));
});

test("T29", "nonexistent gap propagates REVIEW without normalization", () => {
  const gap = resolveLondonWallTime("2026-03-29", "01:30", { provenance: "ASSUMED" });
  const result = pipeline([
    work("gap-a", "2026-03-29", "00:30", null, { end: gap }),
    work("gap-b", "2026-03-30", "06:00", "14:00"),
  ], instant("2026-03-31", "00:00"));
  assert.equal(gap.epochMilliseconds, null);
  assert.ok(result.chronology.intervals.some((item) => item.reviewStatus === "REVIEW_REQUIRED"));
  assert.ok(result.candidates.options.some((item) => item.pattern === "REVIEW_ONLY"));
});

test("T30", "exact instants preserve before/equal/after 144h", () => {
  const start = instant("2026-03-23", "08:00");
  const boundary144 = addElapsedHours(start, 144);
  assert.equal(compareInstants(addElapsedMilliseconds(boundary144, -1), boundary144), -1);
  assert.equal(compareInstants(boundary144, boundary144), 0);
  assert.equal(compareInstants(addElapsedMilliseconds(boundary144, 1), boundary144), 1);
});

test("T31", "same facts and asOf are deterministic", () => {
  assert.deepEqual(pipeline(crossPayWeekFacts, instant("2026-02-10", "00:00")), pipeline(crossPayWeekFacts, instant("2026-02-10", "00:00")));
});

test("T32", "historical supersession removes stale intervals and options", () => {
  const old = work("old", "2026-02-02", "08:00", "18:00");
  const corrected = work("corrected", "2026-02-02", "08:00", "20:00", { supersedesFactIds: ["old"] });
  const result = pipeline([old, corrected, work("after", "2026-02-03", "08:00", "16:00")], instant("2026-02-04", "00:00"));
  assert.equal(result.normalized.facts.some((fact) => fact.factId === "old"), false);
  assert.equal(result.chronology.intervals.some((item) => item.supportingFactIds.includes("old")), false);
});

test("T33", "Phase 1 A–H remain PASS", () => {
  const output = run(process.execPath, ["--experimental-strip-types", "scripts/rest-engine-time-foundation-test.ts"]);
  for (const label of "ABCDEFGH") assert.match(output, new RegExp(`PASS ${label}`));
});

test("T34", "complete legacy regression suite remains PASS", () => {
  const legacyScripts = ["test:backup", "test:weekly-rest", "test:end-week-intent", "test:timeline-compensation", "test:timeline-compensation-repayment", "test:v5.2.20", "test:v5.2.21", "test:v5.2.22", "test:v5.2.23", "test:v5.2.24", "test:v5.2.26", "test:v5.2.27", "test:v5.2.31", "test:v5.2.32", "test:v5.2.33", "test:v5.2.36", "test:v5.2.37", "test:v5.2.38", "test:v5.2.42"];
  for (const script of legacyScripts) runNpm(["run", script]);
});

test("T35", "TypeScript noEmit passes", () => {
  run(process.execPath, [resolve(projectRoot, "node_modules", "typescript", "bin", "tsc"), "--noEmit"]);
});

test("T36", "fresh production build passes", () => {
  const outputDirectory = resolve(projectRoot, ".test-tmp", "phase2-3-build");
  assert.ok(outputDirectory.startsWith(resolve(projectRoot, ".test-tmp")));
  rmSync(outputDirectory, { recursive: true, force: true });
  runNpm(["run", "build", "--", "--outDir", ".test-tmp/phase2-3-build"]);
});

test("T37", "current package version consistency passes", () => {
  const output = runNpm(["run", "test:release-version"]);
  const currentVersion = JSON.parse(readFileSync(resolve(projectRoot, "package.json"), "utf8")).version;
  assert.ok(output.includes(`Release/version consistency v${currentVersion}: PASS`));
});

test("T38", "accepted Pay calculation slice remains byte-identical", () => {
  const source = readFileSync(resolve(projectRoot, "src", "App.tsx"), "utf8");
  const paySlice = source.slice(source.indexOf("  const computedWeek ="), source.indexOf("  const currentComputed ="));
  const hash = createHash("sha256").update(paySlice).digest("hex").toUpperCase();
  assert.equal(hash, BASELINE_PAY_SLICE_SHA);
});

test("T39", "exact duplicate facts deduplicate", () => {
  const item = work("duplicate", "2026-02-02", "08:00", "16:00");
  const result = normalizeActivityFacts([item, structuredClone(item)]);
  assert.equal(result.facts.length, 1);
  assert.ok(result.issues.some((entry) => entry.code === "DUPLICATE_FACT_DEDUPED"));
});

test("T40", "conflicting duplicates produce REVIEW", () => {
  const result = normalizeActivityFacts([
    work("conflict", "2026-02-02", "08:00", "16:00"),
    work("conflict", "2026-02-02", "08:00", "17:00"),
  ]);
  assert.equal(result.facts.length, 2);
  assert.ok(result.facts.every((fact) => fact.reviewStatus === "REVIEW_REQUIRED"));
  assert.ok(result.issues.some((entry) => entry.code === "CONFLICTING_DUPLICATE_FACTS"));
});

test("T41", "Finish-only fact creates no strong candidate", () => {
  const result = pipeline([
    work("finish-only", "2026-02-01", null, "08:00"),
    off("next-off", "2026-02-02"),
  ], instant("2026-02-03", "00:00"));
  assert.ok(result.chronology.issues.some((entry) => entry.code === "INCOMPLETE_WORK_FINISH"));
  assert.ok(result.candidates.options.every((item) => item.reviewStatus === "REVIEW_REQUIRED"));
});

test("T42", "bulk End Week Off/Holiday without provenance is not factual evidence", () => {
  const input = legacyDayRecordsToFactInputs([{ sourceKey: "closed", recordId: "bulk", dateISO: "2026-02-01", dayType: "off", bulkMarked: true }], instant("2026-02-03", "00:00"));
  const fact = normalizeActivityFacts(input).facts[0];
  assert.equal(fact.factStatus, "PLACEHOLDER");
  assert.equal(fact.coverage, "NONE");
});

test("T43", "open interval ID remains stable as asOf advances", () => {
  const first = pipeline([work("stable-open", "2026-02-02", "08:00", "18:00")], instant("2026-02-02", "20:00")).chronology.intervals.find((item) => item.state === "OPEN");
  const second = pipeline([work("stable-open", "2026-02-02", "08:00", "18:00")], instant("2026-02-02", "21:00")).chronology.intervals.find((item) => item.state === "OPEN");
  assert.equal(first?.restIntervalId, second?.restIntervalId);
  assert.notEqual(first?.elapsedMilliseconds, second?.elapsedMilliseconds);
});

test("T44", "89h59m has no 45+45 option while 90h does", () => {
  const under = generateWeeklyRestComponentOptions([syntheticRest("under90", crossWeekStart, 90 * HOUR - 60_000)]).options;
  assert.equal(under.some((item) => item.pattern === "REGULAR_THEN_REGULAR"), false);
  assert.equal(patterns(90).some((item) => item.pattern === "REGULAR_THEN_REGULAR"), true);
});

test("T45", "option count remains bounded for a very long interval", () => {
  const options = generateWeeklyRestComponentOptions([syntheticRest("very-long", crossWeekStart, 1000 * 24 * HOUR)]).options;
  assert.ok(options.length <= 4);
  assert.ok((options[0].capacity?.maximumRegularComponents ?? 0) > 100);
});

test("T46", "suspected non-GB legacy timestamp propagates REVIEW", () => {
  const input = legacyDayRecordsToFactInputs([
    { sourceKey: "w", recordId: "foreign", dateISO: "2026-02-01", dayType: "work", start: "08:00", finish: "18:00", completionSource: "user", suspectedNonGb: true },
    { sourceKey: "w", recordId: "next", dateISO: "2026-02-03", dayType: "work", start: "08:00", finish: "16:00", completionSource: "user" },
    { sourceKey: "w", recordId: "off", dateISO: "2026-02-02", dayType: "off", completionSource: "user" },
  ], instant("2026-02-04", "00:00"));
  const result = pipeline(input, instant("2026-02-04", "00:00"));
  assert.ok(result.normalized.facts.some((fact) => fact.reviewReasons.some((reason) => /non-GB/.test(reason))));
  assert.ok(result.candidates.options.some((item) => item.pattern === "REVIEW_ONLY"));
});

test("T47", "Finish≤Start is not converted to overnight Work", () => {
  const result = pipeline([work("overnight", "2026-02-02", "22:00", "06:00")], instant("2026-02-03", "00:00"));
  assert.ok(result.chronology.issues.some((entry) => entry.code === "INVALID_WORK_ORDER"));
});

test("T48", "real Work inside rest splits chronology", () => {
  const result = pipeline([off("covered", "2026-02-02"), work("interrupt", "2026-02-02", "10:00", "11:00")], instant("2026-02-03", "00:00"));
  assert.ok(result.chronology.intervals.some((item) => item.endEpochMilliseconds === instant("2026-02-02", "10:00")));
  assert.ok(result.chronology.intervals.some((item) => item.startEpochMilliseconds === instant("2026-02-02", "11:00")));
});

test("T49", "production uses the Phase 8 adapter without build-time mutation", () => {
  const app = readFileSync(resolve(projectRoot, "src", "App.tsx"), "utf8");
  const main = readFileSync(resolve(projectRoot, "src", "main.tsx"), "utf8");
  const packageJson = readFileSync(resolve(projectRoot, "package.json"), "utf8");
  assert.match(app, /evaluateProductionRestEngine/);
  assert.match(app, /selectCompensationPanel/);
  assert.doesNotMatch(app, /from "\.\/rest-engine\/(?:compensation|allocation|chronology|weekly-options)"/);
  assert.doesNotMatch(main, /rest-engine/);
  assert.doesNotMatch(packageJson, /postinstall|prebuild/);
  const built = readFileSync(resolve(projectRoot, ".test-tmp", "phase2-3-build", "assets", readFileSync(resolve(projectRoot, ".test-tmp", "phase2-3-build", "index.html"), "utf8").match(/assets\/(index-[^"]+\.js)/)?.[1] as string), "utf8");
  assert.match(built, /EU_561_2006_REST_ENGINE_V1/);
});

test("T50", "Start-without-Finish propagates REVIEW only forward", () => {
  const sundayStart = instant("2026-02-01", "00:00");
  const mondayStart = instant("2026-02-02", "10:00");
  const reduced = pipeline([
    off("directional-off", "2026-02-01"),
    work("directional-incomplete", "2026-02-02", "10:00", null),
  ], instant("2026-02-02", "20:00"));
  const preceding = findInterval(reduced, sundayStart, mondayStart);

  assert.equal(preceding.endBoundary?.role, "WORK_START");
  assert.equal(preceding.endBoundary?.epochMilliseconds, mondayStart);
  assert.equal(preceding.reviewStatus, "CLEAR");
  assert.equal(preceding.elapsedMilliseconds, 34 * HOUR);
  assert.ok(reduced.candidates.options.some((item) => item.restIntervalId === preceding.restIntervalId && item.pattern === "SINGLE_REDUCED"));
  assert.ok(reduced.chronology.issues.some((item) => item.code === "INCOMPLETE_WORK_START"));
  assert.ok(reduced.chronology.intervals.every((interval) => interval.observedThroughEpochMilliseconds <= mondayStart));

  const regular = pipeline([
    off("directional-sat", "2026-01-31"),
    off("directional-sun", "2026-02-01"),
    work("directional-regular-incomplete", "2026-02-02", "10:00", null),
  ], instant("2026-02-02", "20:00"));
  const regularPreceding = findInterval(regular, instant("2026-01-31", "00:00"), mondayStart);
  assert.ok(regular.candidates.options.some((item) => item.restIntervalId === regularPreceding.restIntervalId && item.pattern === "SINGLE_REGULAR"));

  const advanced = pipeline([
    off("directional-off", "2026-02-01"),
    work("directional-incomplete", "2026-02-02", "10:00", null),
  ], instant("2026-02-02", "23:00"));
  const advancedPreceding = findInterval(advanced, sundayStart, mondayStart);
  assert.equal(advancedPreceding.restIntervalId, preceding.restIntervalId);
  assert.equal(advancedPreceding.reviewStatus, preceding.reviewStatus);
  assert.equal(advancedPreceding.elapsedMilliseconds, preceding.elapsedMilliseconds);
  assert.doesNotMatch(JSON.stringify(reduced.candidates), /CompensationObligation|debt|fixedWeekOwner/);

  const ambiguousStart = resolveLondonWallTime("2026-10-25", "01:30", { provenance: "ASSUMED" });
  const ambiguous = pipeline([
    off("ambiguous-start-coverage", "2026-10-24"),
    work("ambiguous-start-work", "2026-10-25", null, null, { start: ambiguousStart }),
  ], instant("2026-10-25", "20:00"));
  const ambiguousPreceding = findInterval(ambiguous, instant("2026-10-24", "00:00"), instant("2026-10-25", "00:00"));
  assert.equal(ambiguousStart.resolution, "AMBIGUOUS_FOLD");
  assert.equal(ambiguousStart.candidates.length, 2);
  assert.equal(ambiguousPreceding.reviewStatus, "REVIEW_REQUIRED");
  assert.ok(ambiguous.candidates.options.some((item) => item.restIntervalId === ambiguousPreceding.restIntervalId && item.pattern === "REVIEW_ONLY"));
});

assert.equal(passed, 50);
assert.equal(REGULAR_WEEKLY_REST_MINIMUM_MILLISECONDS, 45 * HOUR);
console.log("Rest Engine v1 combined Phase 2+3 T01–T50: PASS");
