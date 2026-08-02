# Driver Pay App v5.2.15 — Weekly Rest Timeline QA Retest 02

Purpose: verify the remaining blocking defect from the previous QA retest is fixed without introducing new behaviour.

## Blocking defect addressed
When both the factual timeline path and the legacy End Week candidate were eligible, entering Start could allow the legacy completed-weekly-rest path to run and mutate the compensation ledger.

## Expected behaviour now
- Timeline path keeps priority for the current work day even after Start is entered.
- Legacy completed-weekly-rest / compensation-creation logic must not run while the timeline path owns the decision.
- No compensation-ledger create or completion write is allowed from the timeline-driven Start path in this checkpoint.
- Legacy behaviour remains available only when the timeline path is not eligible.

## Required retest
Run the full `QA_WEEKLY_REST_TIMELINE_TEST_PLAN.md`, plus explicitly verify:
1. A valid timeline anchor exists.
2. Six completed work cycles exist after it.
3. A legacy End Week candidate also exists.
4. Both would otherwise be eligible.
5. Timeline Start proposal wins.
6. Enter Start.
7. `driverPayV4_weeklyCompensationLedger` remains byte/logically unchanged.
8. No compensation obligation is created from the legacy candidate.
9. Existing backup/restore tests remain green.

## Commands
- `npm test`
- `npx tsc --noEmit`
- Fresh production build if the QA environment can install dependencies correctly.

## Packaging note
`dist/` is intentionally excluded from this QA source checkpoint. Do not approve a production release until a fresh production build succeeds from the approved source.

No source corrections should be made during QA. Report problems only.
