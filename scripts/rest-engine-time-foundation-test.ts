import assert from "node:assert/strict";
import {
  addElapsedHours,
  addElapsedMilliseconds,
  compareInstants,
  compensationDeadlineForWeek,
  fixedLegalWeekForInstant,
  formatLondonInstant,
  legalSundayEndForWeek,
  londonCivilDayBounds,
  resolveLondonWallTime,
} from "../src/rest-engine/time.ts";

function exactInstant(date: string, time: string): number {
  const result = resolveLondonWallTime(date, time);
  assert.equal(result.resolution, "VALID");
  assert.equal(result.reviewRequired, false);
  assert.notEqual(result.epochMilliseconds, null);
  return result.epochMilliseconds as number;
}

function assertCivil(epochMilliseconds: number, date: string, time: string, offset?: string) {
  const civil = formatLondonInstant(epochMilliseconds);
  assert.equal(civil.wallDate, date);
  assert.equal(civil.wallTime, time);
  if (offset) assert.equal(civil.offset, offset);
}

// TEST A — historical one-hour regression.
const historicalFinish = exactInstant("2026-02-02", "21:00");
assertCivil(addElapsedHours(historicalFinish, 9), "2026-02-03", "06:00:00", "+00:00");
assertCivil(addElapsedHours(historicalFinish, 11), "2026-02-03", "08:00:00", "+00:00");
assert.notEqual(formatLondonInstant(addElapsedHours(historicalFinish, 9)).wallTime, "05:00:00");
console.log("PASS A — historical 21:00 +9h/+11h produces 06:00/08:00");

// TEST B — GMT to BST uses elapsed instants.
const springStart = exactInstant("2026-03-23", "08:00");
const springBoundary = addElapsedHours(springStart, 144);
assert.equal(springBoundary - springStart, 144 * 60 * 60 * 1000);
assertCivil(springBoundary, "2026-03-29", "09:00:00", "+01:00");
console.log("PASS B — GMT→BST exact 144h produces Sun 29 Mar 09:00 BST");

// TEST C — BST to GMT uses elapsed instants.
const autumnStart = exactInstant("2026-10-19", "08:00");
const autumnBoundary = addElapsedHours(autumnStart, 144);
assert.equal(autumnBoundary - autumnStart, 144 * 60 * 60 * 1000);
assertCivil(autumnBoundary, "2026-10-25", "07:00:00", "+00:00");
console.log("PASS C — BST→GMT exact 144h produces Sun 25 Oct 07:00 GMT");

// TEST D — ordering around the exact 144h instant is preserved to the second.
const exact144 = addElapsedHours(historicalFinish, 144);
assert.equal(compareInstants(addElapsedMilliseconds(exact144, -1000), exact144), -1);
assert.equal(compareInstants(exact144, exact144), 0);
assert.equal(compareInstants(addElapsedMilliseconds(exact144, 1000), exact144), 1);
assert.equal(compareInstants(addElapsedMilliseconds(exact144, -60_000), exact144), -1);
assert.equal(compareInstants(addElapsedMilliseconds(exact144, 60_000), exact144), 1);
console.log("PASS D — exact 144h boundary preserves before/equal/after ordering");

// TEST E — explicit Europe/London resolution is independent of process timezone.
const originalTimeZone = process.env.TZ;
const deviceResults: number[] = [];
try {
  for (const deviceTimeZone of ["America/Los_Angeles", "Pacific/Auckland"]) {
    process.env.TZ = deviceTimeZone;
    deviceResults.push(exactInstant("2026-07-15", "14:30"));
  }
} finally {
  if (originalTimeZone == null) delete process.env.TZ;
  else process.env.TZ = originalTimeZone;
}
assert.equal(deviceResults[0], deviceResults[1]);
assertCivil(deviceResults[0], "2026-07-15", "14:30:00", "+01:00");
console.log("PASS E — Europe/London fact is device-timezone independent");

// TEST F — autumn duplicated wall time is explicit and exposes both candidates.
const fold = resolveLondonWallTime("2026-10-25", "01:30", { provenance: "ASSUMED" });
assert.equal(fold.resolution, "AMBIGUOUS_FOLD");
assert.equal(fold.reviewRequired, true);
assert.equal(fold.epochMilliseconds, null);
assert.equal(fold.candidates.length, 2);
assert.deepEqual(fold.candidates.map((candidate) => candidate.offset), ["+01:00", "+00:00"]);
assert.equal(fold.candidates[1].epochMilliseconds - fold.candidates[0].epochMilliseconds, 60 * 60 * 1000);
console.log("PASS F — autumn 01:30 fold is AMBIGUOUS/REVIEW with two candidates");

// TEST G — spring nonexistent wall time is rejected without normalisation.
const gap = resolveLondonWallTime("2026-03-29", "01:30", { provenance: "ASSUMED" });
assert.equal(gap.resolution, "NONEXISTENT_GAP");
assert.equal(gap.reviewRequired, true);
assert.equal(gap.epochMilliseconds, null);
assert.equal(gap.candidates.length, 0);
console.log("PASS G — spring 01:30 gap is NONEXISTENT/REVIEW");

// TEST H — Sunday 24:00 is represented by the next London Monday 00:00 instant.
for (const fixture of [
  { date: "2026-02-04", expectedMinutes: 7 * 24 * 60, expectedEndUtc: "2026-02-09T00:00:00.000Z" },
  { date: "2026-03-25", expectedMinutes: 167 * 60, expectedEndUtc: "2026-03-29T23:00:00.000Z" },
  { date: "2026-10-21", expectedMinutes: 169 * 60, expectedEndUtc: "2026-10-26T00:00:00.000Z" },
]) {
  const week = fixedLegalWeekForInstant(exactInstant(fixture.date, "12:00"));
  const boundary = legalSundayEndForWeek(week);
  assert.equal(week.elapsedMinutes, fixture.expectedMinutes);
  assert.equal(boundary.epochMilliseconds, week.endEpochMilliseconds);
  assert.equal(boundary.instantUtc, fixture.expectedEndUtc);
  assertCivil(boundary.epochMilliseconds, boundary.mondayDate, "00:00:00");
}

const springDay = londonCivilDayBounds("2026-03-29");
const autumnDay = londonCivilDayBounds("2026-10-25");
assert.equal(springDay.elapsedMinutes, 23 * 60);
assert.equal(autumnDay.elapsedMinutes, 25 * 60);

const sourceWeek = fixedLegalWeekForInstant(exactInstant("2026-03-25", "12:00"));
const compensationDeadline = compensationDeadlineForWeek(sourceWeek);
assert.equal(compensationDeadline.mondayDate, "2026-04-20");
assertCivil(compensationDeadline.epochMilliseconds, "2026-04-20", "00:00:00", "+01:00");
console.log("PASS H — Sunday 24:00 boundaries and third-following-week deadline are exact London instants");

// The data model supports an explicit review state even when the instant is resolvable.
const externalReview = resolveLondonWallTime("2026-07-15", "14:30", {
  provenance: "ASSUMED",
  reviewReason: "Known or suspected non-GB fact.",
});
assert.equal(externalReview.resolution, "REVIEW_REQUIRED");
assert.equal(externalReview.reviewRequired, true);
assert.notEqual(externalReview.epochMilliseconds, null);

console.log("Rest Engine v1 Phase 1 time foundation: PASS");
