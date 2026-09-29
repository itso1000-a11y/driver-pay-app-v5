# v5.3.9 STATE_CAP Prefix Continuation — r2 QA Report

## Confirmed defect

The original v5.3.9 `STATE_CAP` checkpoint retained a safe legal frontier but authenticated it with the full restore input. A future-only fact therefore changed the checkpoint source hash and forced a genesis cold bootstrap. The last-safe arrays were also retained by reference during bootstrap.

## Correction

`STATE_CAP` now authenticates only facts whose London fixed week is at or before the saved safe boundary. The checkpoint source and `bootstrapSafety.authenticatedPrefixSource` are identical. `evaluatedThroughFixedWeekId` records the legal boundary and `stoppedBeforeFixedWeekId` records the first unsafe week. Facts after the source's `lastWallDate` are an unevaluated suffix.

Stored checkpoint loading now validates only that authenticated prefix. A suffix-only change keeps the checkpoint valid and enters seeded continuation; a prefix edit invalidates it. The former special-case full-input comparison was removed. All last-safe allocation, compensation and finalized collections are cloned through canonical JSON before later segment processing can mutate active arrays.

The semantic checkpoint version changed internally to reject older derived checkpoints that lack prefix-authenticated STATE_CAP semantics. Runtime version remains v5.3.9 as requested.

## Exact backup result

Fixture: `driver-pay-backup-2026-10-03-2026-09-28.json`, SHA-256 `3EB217B326CCF9AC2657991C8CA801E88FA106960CB71C73329FB1169AE83123` (not packaged).

- Initial no-checkpoint restore: PASS, 760.13 ms; no OOM.
- Safe boundary: fixed week `2026-08-31`; authenticated source through `2026-09-06`.
- Authenticated prefix: 120 facts; suffix remains outside the source authentication.
- Saved frontier: 56 allocation alternatives, 56 compensation alternatives.
- Same snapshot: checkpoint reuse PASS.
- One added factual day and multiple future facts: prefix reuse PASS; no genesis restart; only suffix facts are considered by seeded continuation.
- The existing historical suffix reaches the safety cap before a new safe legal boundary is established. It remains a bounded REVIEW checkpoint with the original authenticated prefix rather than extending the source authentication or restarting genesis.
- Prefix fact edit: invalidates checkpoint PASS.
- Unevaluated-suffix fact edit: retains checkpoint validity PASS.

## Focused checks

- C1–C10: PASS.
- B1E2E-01..15 and CT1..CT8: PASS.
- Package P1–P10: PASS.
- Finish Guidance FG01–FG28: PASS.
- Full `npm test`: PASS.
- `npx tsc --noEmit`: PASS.
- Fresh `npm run build`: PASS.
- Release/version consistency v5.3.9: PASS.

## Protection results

No legal semantics changed: Daily/Split Rest, weekly allocation, fixed-week/two-week/144h rules, provenance, blank-day handling, compensation, PackageContinuation and REVIEW behaviour are unchanged. The correction does not touch Pay, Profile, Archive, Finish Guidance, PWA, backup format or UI. `STATE_CAP` remains REVIEW and never manufactures factual rest or CLEAR conclusions.

## Remaining risk

This correction proves safe prefix reuse and prevents repeated genesis bootstrap. The exact real archive still cannot legally advance beyond its historical high-branch suffix inside the 96-alternative safety budget, so it remains controlled REVIEW rather than presenting a complete historical weekly-allocation outcome. Physical phone QA remains pending.
