# Driver Pay App v5.2.22 — Stable Road-Test Deploy

## Status

**APPROVED FOR DEPLOYMENT / PHYSICAL-PHONE ROAD TEST**

Runtime application version remains **5.2.22**.

The application source in this package is byte-for-byte the same source that passed the v5.2.22 heavy QA and the v5.2.22-r1 packaging-integrity verification.

## Confirmed before deployment

- Application regressions: PASS
- Full automated test suite: PASS
- TypeScript `npx tsc --noEmit`: PASS
- Fresh Vite production build: PASS
- Packaging/root integrity: PASS
- Runtime version identity: PASS
- Source comparison against the heavy-tested v5.2.22 checkpoint: PASS

No functional source correction was made after these checks.

## Purpose of this deployment

A deployed version is required to complete the physical-phone road test that could not be executed in the QA environment.

### Required real-device workflow

1. Friday: use `End Week`.
2. Saturday is still the current calendar day and belongs to the same Sunday→Saturday pay week.
3. Open Saturday while it is `Day Off`.
4. When weekly-rest criteria are active, verify the weekly-rest context and applicable 45h / valid 24h proposal are visible.
5. Change Saturday `Day Off → Work`.
6. Verify the weekly-rest proposal remains available in the Start workflow.
7. Verify the proposal remains a suggestion and does not silently save `Start`.
8. Verify today's Saturday does **not** receive archive-like styling merely because `End Week` was used on Friday.
9. Verify Saturday remains editable without hard-archive Unlock.

## Release boundary

This package is for deployment and physical-phone confirmation. No Setup work is included.

If the phone road test passes, v5.2.22 may be treated as the stable installed baseline before Setup development begins.
