import assert from "node:assert/strict";
import fs from "node:fs";

const app = fs.readFileSync("src/App.tsx", "utf8");

// Legacy records that predate startEntrySource must migrate stored factual Start
// values to user provenance instead of leaving provenance undefined.
assert.match(app, /startEntrySource: r\.startEntrySource === "user" \|\| r\.startEntrySource === "acceptedSuggestion"[\s\S]*typeof r\.start === "string" && r\.start\.trim\(\) \? "user" : undefined/);

// Suggestion-draft hiding is allowed only for explicit acceptedSuggestion provenance.
const explicitDraftMatches = app.match(/startEntrySource === "acceptedSuggestion"/g) || [];
assert.ok(explicitDraftMatches.length >= 2, "expected explicit acceptedSuggestion guards for save/display draft handling");
assert.doesNotMatch(app, /startEntrySource !== "user"[\s\S]{0,220}dailyPrimarySuggestedStart/);

// Current manual-entry provenance remains protected.
assert.match(app, /field === "start"[\s\S]*startEntrySource: "user"/);
assert.match(app, /dailyStartIsManual = Boolean\(displayStartValue && currentDay\.startEntrySource === "user"\)/);

console.log("v5.2.32 Start provenance backward-compat regression: PASS");
