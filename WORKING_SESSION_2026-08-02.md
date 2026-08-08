# Working session — 2026-08-02

Base: driver-pay-app-v5.2.15-backup-restore-roundtrip-qa(1).zip

## Change A — End Week feedback (earlier in this session)
- Reused the existing End Week result states instead of adding duplicate save logic.
- User-facing intent:
  - new close: `Week completed.`
  - already closed, unchanged: `Week already saved. No changes.`
  - already closed, edited: `Changes saved. Week updated.`
- For unchanged close, Week Preview remains visible long enough for the feedback to be seen; successful new close/update retain their existing exit behaviour.
- No weekly-rest calculation changes in this change.

## Change B — conservative pay-period / weekly-rest responsibility separation
- No intended functional behaviour change.
- Extracted the new-close path in `src/App.tsx` into four explicit responsibilities:
  1. `buildPayPeriodCloseDays(...)`
  2. `seedWeeklyRestCandidateFromClosedPayPeriod(...)`
  3. `persistClosedPayPeriod(...)`
  4. `openNextPayPeriod(...)`
- `endWeek(...)` now orchestrates those steps in the same order as before.
- Existing End Week weekly-rest candidate seeding is deliberately preserved as a compatibility bridge.
- No mid-week weekly-rest recognition, cycle reset, `Working tomorrow?` prompt, custom End Week day, or future setup behaviour has been implemented yet.

## Rollback
- Pre-Change-B source copy: `src/App.tsx.before-pay-weekly-separation`
- If Change B causes a regression, restore that file over `src/App.tsx` while retaining Change A from the working baseline if desired.

## Verification after Change B
- `npm test` PASS:
  - complete backup snapshot restores identical logical storage state
  - stale computer state is replaced, not merged
  - failed restore rolls back atomically
  - production v2 snapshot and reload path remain present
- `tsc --noEmit --pretty false` PASS with no output/errors.

## Conservative mid-week weekly-rest recognition foundation
- Added a read-only `RecognizedWeeklyRest` model and `detectQualifyingWeeklyRests(days)` helper in `src/App.tsx`.
- Detection recognizes a factual continuous gap of >=24h only once a later real Work Start exists.
- 24h..<45h is classified reduced; >=45h regular.
- Off/Holiday days do not break the rest chain.
- A touched/incomplete Work day invalidates chronology so no weekly-rest inference crosses uncertain work data.
- No state, localStorage, compensation ledger, Start helper, End Week flow, UI, or archive behavior uses this detector yet.
- Rollback checkpoint: `src/App.tsx.before-midweek-rest-detection`.
- Validation: `tsc --noEmit` PASS; `npm test` PASS (all backup/restore regression checks).
- Real backup probe: Tax Week 11 ending 20 Jun 2026 contains Mon 15 Jun Finish 15:20 -> Thu 18 Jun Start 06:30 = 63h10m, correctly qualifying as regular weekly rest under the new detector logic.

## Change C — read-only cross-pay-period weekly-rest timeline
- Added `buildWeeklyRestTimelineDays(currentDays, archive)` and `getWeeklyRestTimelineSnapshot(...)` as pure/read-only helpers.
- Archived days provide continuity across End Week/pay-period boundaries; current live days override the same `dateISO` so edits are not double-counted.
- The timeline is sorted chronologically and passed through the already-added factual >=24h weekly-rest detector.
- The helper returns all recognized rests plus the latest one, but is deliberately NOT wired to Start suggestions, Rest card, End Week, cycle resets, compensation ledger, persistence, or UI yet.
- Purpose: create the future-compatible source of truth needed to distinguish regulatory continuity from pay-period boundaries without changing production behaviour today.

## Change D — read-only weekly-rest cycle snapshot
- Added `WeeklyRestCycleSnapshot` and `getWeeklyRestCycleSnapshot(currentDays, archive)` as a pure/read-only helper.
- The helper uses only the latest factual weekly rest already recognized by the cross-pay-period timeline; it deliberately does NOT fall back to the End Week candidate.
- If no factual weekly rest is known, it returns `known: false` instead of guessing.
- When known, it counts only completed Work shifts whose real Start occurs at/after the recognized rest end, and records the latest completed Finish.
- No UI, Start helper, Rest card, End Week behaviour, compensation ledger, persistence, or automatic day marking uses this snapshot yet.
- Rollback checkpoint: `src/App.tsx.before-readonly-weekly-cycle`.
- Validation: `tsc --noEmit` PASS; `npm test` PASS (all backup/restore regression checks).

## Conservative weekly-rest due gate
- Added a read-only gate between the factual cross-week weekly-rest cycle snapshot and the legacy End Week candidate.
- If the cross-week timeline is known and fewer than 6 completed work cycles have occurred since the last recognized qualifying weekly rest, the legacy End Week candidate is not allowed to take over Start suggestions yet.
- If the timeline is unknown, legacy behavior is preserved exactly.
- This does NOT activate weekly rest on its own, does NOT mark days Off, does NOT change End Week, does NOT write storage, and does NOT touch compensation.
- Rollback checkpoint: `src/App.tsx.before-weekly-due-gate`.

## Change E — timeline-driven weekly-rest Start proposal (first live influence)
- Rollback checkpoint: `src/App.tsx.before-timeline-due-start`.
- This is the first step where the factual cross-week timeline can actively drive the Start suggestion without requiring End Week.
- Activation is deliberately narrow:
  - a factual weekly-rest timeline must be known;
  - at least 6 completed Work cycles must exist after the latest recognized weekly rest;
  - a real last completed Finish must exist;
  - the currently viewed day must be Work and must not already have a Start.
- When those conditions are met, the anchor for weekly-rest targets is the last completed Finish from the factual timeline.
- Timeline path keeps 45h as the primary Start proposal and exposes the 24h reduced option only as the secondary weekly-rest helper, matching the current product decision.
- The old End Week candidate path remains intact as a compatibility fallback when the timeline is not able to establish a due anchor.
- The legacy completed-weekly-rest/compensation creation path is deliberately NOT reused for timeline activation yet, preventing accidental compensation-ledger writes from a stale End Week candidate.
- No automatic day marking, no End Week behaviour change, no `Working tomorrow?` prompt, no storage migration, and no custom End Week day logic in this change.
- Validation after Change E: `tsc --noEmit --pretty false` PASS; `npm test` PASS (all backup/restore regression checks).

## QA handoff checkpoint
- Added `QA_WEEKLY_REST_TIMELINE_TEST_PLAN.md` for a fresh-chat QA pass before any further weekly-rest integration.

## QA critical fixes after first weekly-rest timeline review
- Fixed cross-week chronological processing: repeated weekday IDs across multiple pay periods are no longer collapsed to the first occurrence. Timeline-only logic now orders every dated day by `dateISO`.
- Fixed conservative fallback: any touched/incomplete Work day after the latest recognized weekly rest makes the cycle snapshot `known: false`; later completed shifts cannot revive the new timeline path across that uncertainty.
- Added `scripts/weekly-rest-timeline-test.mjs` and wired it into `npm test` alongside the existing backup/restore regression.
- Regression coverage now includes repeated weekday IDs across weeks, regular/reduced mid-week weekly rest, 5/6 work-cycle counting, incomplete Work -> unknown, and source guards for End Week feedback/duplicate prevention.
- `tsc --noEmit --pretty false`: PASS in the working environment after the fixes.
- `node scripts/weekly-rest-timeline-test.mjs`: PASS.
- `node scripts/backup-restore-roundtrip-test.mjs`: PASS.
- Fresh dependency install / Vite production build could not be completed because the internal npm registry returned 404 for `yallist-3.1.1.tgz`. This is an environment limitation, not a source-code failure.
- The stale pre-existing `dist/` must NOT be used to judge or deploy this source checkpoint. For the retest handoff ZIP, stale `dist/` is intentionally omitted so source and production bundle cannot be confused.

### QA retest blocking fix — timeline/legacy compensation isolation
- Added `timelineWeeklyRestPathEligible`, which remains true after Start is entered when the factual timeline owns the weekly-rest decision.
- Legacy End Week weekly-rest path is now explicitly disabled whenever timeline path eligibility exists.
- Compensation-ledger effect is checkpoint-gated: no create/complete ledger writes are allowed from a timeline-driven weekly-rest Start yet.
- Added regression guards for simultaneous timeline + legacy eligibility and ledger-write isolation.
- Rollback files: `src/App.tsx.before-qa-compensation-priority-fix` and `scripts/weekly-rest-timeline-test.mjs.before-qa-compensation-priority-fix`.

## QA retest 02 blocking fix — timeline ownership after Start
- Root cause confirmed: the same cycle snapshot included the selected current Work day; entering Start made that day touched/incomplete, which made the snapshot unknown and allowed legacy ownership to return.
- Conservative fix: weekly-rest Start ownership is now computed from factual chronology strictly before the selected day (`getWeeklyRestCycleSnapshotBeforeDate`).
- This keeps the decision stable before/after entering Start while still treating any earlier ambiguous incomplete Work day as unknown.
- No compensation integration was added. Timeline-owned Start remains blocked from legacy compensation ledger create/complete writes.
- Added a real state-transition regression test: six completed cycles + current day empty -> current day Start entered -> ownership snapshot must remain known and identical.


### Validation after ownership-stability fix
- `npm test`: PASS (backup/restore + weekly-rest regression).
- `npx tsc --noEmit`: PASS.
- The new regression test simulates the actual before-Start -> after-Start transition using a snapshot strictly before the selected date.
- During test authoring, the first fixture accidentally contained seven completed cycles because the post-rest anchor day itself is a completed cycle; the fixture was corrected to exactly six. No source behaviour was changed for that test-fixture correction.

## QA RETEST 03 source baseline
- Accepted QA RETEST 03 as the rollback/source baseline for next work.
- Marker: QA_WEEKLY_REST_SOURCE_BASELINE_PASS.md

## Conservative End Week / next-day intent step
- Added a prompt only when the factual weekly-rest timeline is known and weekly rest is not yet due: "Working tomorrow?"
- YES: closes the pay period normally, opens the immediate next calendar day (Sunday in the current Saturday-ending pay-period model) as Work, carries forward known km, and leaves weekly-rest legality to the existing timeline/daily-rest helpers.
- NO: preserves the existing legacy weekly-rest flow. No new weekly-rest storage or compensation behaviour was added.
- Standard End Week behaviour is unchanged when weekly rest is due or timeline state is unknown.
- Custom End Week day remains future Setup work; this step intentionally uses the current Saturday-ending model only.
- Rollback files: src/App.tsx.before-endweek-working-tomorrow and scripts/weekly-rest-timeline-test.mjs.before-endweek-working-tomorrow.
- Validation: npm test PASS; npx tsc --noEmit PASS.

## Version discipline reset — v5.2.16
- The accumulated QA-passed weekly-rest timeline + conservative End Week next-day intent change is now formally identified as v5.2.16, not another v5.2.15 checkpoint.
- Rule restored: every future functional/source change advances the version before handoff; descriptive artifact names accompany version numbers.
- Added `scripts/end-week-intent-test.mjs` and wired it into `npm test` to cover Yes/No next-day intent behaviour and source guards.


## v5.2.17 — first timeline compensation integration
- Added exact debt creation for a newly factual reduced mid-week weekly rest (24h to <45h).
- Debt is created only when a later real Start proves the rest duration; no future rest is guessed.
- Exact owed minutes = 45h minus actual factual rest. Regular 45h+ rest creates no debt.
- Added equivalent-fact duplicate protection so timeline and legacy paths cannot create the same debt twice.
- Timeline-driven debt completion is intentionally NOT added in this version; that remains a separate future version/QA step.
- Rollback: `src/App.tsx.before-v5.2.17-timeline-compensation-create` and `scripts/weekly-rest-timeline-test.mjs.before-v5.2.17-timeline-compensation-create`.
- Validation: `tsc --noEmit` PASS; `npm test` PASS.

## v5.2.18 checkpoint

Implemented the second compensation integration step: factual timeline-owned rest may complete one pre-existing compensation obligation.

Safety boundaries:
- no partial repayment;
- chronology and deadline required;
- one rest -> at most one obligation;
- duplicate spending of the same continuous rest is blocked across Start edits;
- v5.2.17 debt creation remains unchanged;
- Monday Start proposal after End Week remains OPEN and untouched.

Local source checks: npm test PASS; tsc --noEmit PASS. Fresh Vite production build not available in this environment.
