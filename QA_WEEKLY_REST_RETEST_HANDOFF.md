# DRIVER PAY APP v5.2.15 — WEEKLY REST TIMELINE QA RETEST HANDOFF

This is a **source QA checkpoint**, not a production release.

## What changed after the first FAIL

1. **Cross-week timeline fix**
   - Weekly-rest timeline processing now keeps every dated day across multiple weeks/pay periods.
   - It no longer treats `mon/tue/wed/...` IDs as globally unique.

2. **Incomplete Work conservative fallback fix**
   - A touched Work day without a valid Finish after the latest recognized weekly rest makes the new cycle state unknown.
   - Completed shifts after that ambiguity must not reactivate the new timeline-driven weekly-rest path.

3. **Automated regression coverage added**
   - `npm test` now includes both backup/restore and weekly-rest timeline regression scripts.

## Required QA focus

Re-run the full `QA_WEEKLY_REST_TIMELINE_TEST_PLAN.md`.

Priority checks:
- repeated weekday IDs across more than one week are all processed;
- 5 completed cycles do not trigger timeline weekly-rest takeover;
- 6 completed cycles can trigger the timeline weekly-rest Start path;
- regular mid-week weekly rest resets the cycle;
- reduced mid-week weekly rest is recognized as reduced;
- touched/incomplete Work makes the timeline path conservative/unknown;
- unchanged End Week does not create a new archive item;
- changed End Week updates the existing item;
- new End Week creates exactly one item.

## Local verification already completed

- `node scripts/weekly-rest-timeline-test.mjs` — PASS
- `node scripts/backup-restore-roundtrip-test.mjs` — PASS
- `tsc --noEmit --pretty false` — PASS

## Production build / dist status

The previous QA correctly identified that the old `dist/` bundle pre-dated the new source changes.

A fresh Vite build could not be produced in the current environment because `npm ci` is blocked by an internal registry 404 for `yallist-3.1.1.tgz`.

Therefore this QA handoff intentionally **omits `dist/`** rather than shipping a known stale production bundle. Do not treat absence of `dist/` as a source defect. If the QA environment can install dependencies, perform a fresh build there and verify that generated output comes from this source checkpoint.

No production release should be approved until a fresh build succeeds.
