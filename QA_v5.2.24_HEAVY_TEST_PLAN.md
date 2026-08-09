# Driver Pay App v5.2.24 — Heavy QA Plan

## Mandatory technical checks
- ZIP/root integrity and complete v5.2.24 identity.
- `npm ci`
- full `npm test`
- `npx tsc --noEmit`
- fresh `npm run build`
- source hashes unchanged by QA.

## Mandatory behavioral scenarios
1. Re-run v5.2.23 Scenario 1: normal Mon–Fri, End Week Friday, Saturday Off/Work; 45h primary, 24h secondary, no false required warning, no silent Start.
2. Re-run Scenario 2: factual mid-week 45h+ rest, Fri/Sat work, End Week Saturday, Sunday Off→Work; earlier factual rest remains cycle anchor, new informational candidate from Saturday Finish, no false violation.
3. Re-run Scenario 3: Wednesday Finish, Thu/Fri/Sat Off, End Week Saturday, inspect Sunday. Candidate remains Wednesday-anchored beyond 72h; `Weekly rest ended [day/time]` remains available; Sunday Start establishes factual 45h+ weekly rest from Wednesday Finish.
4. Candidate-consumption regression: after Scenario 3 Sunday receives a real Work Start, inspect Monday before Start. The old Wednesday End Week candidate must not reappear.

## Protected regressions
- Six-cycle `Weekly rest required` warning remains.
- Timeline ownership, incomplete chronology fallback, compensation create/repay/chronology/FIFO/rest reuse.
- v5.2.20 UX, v5.2.21 soft archive, v5.2.22 current-day/same-pay-week behavior.
- Backup/restore, archive duplicate protection, Save & Next, KM and Pay Engine protected paths.

## QA rule
Do not correct code during QA. Report PASS/FAIL with exact failing scenario and source location.
