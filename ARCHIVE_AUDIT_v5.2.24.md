# Driver Pay App v5.2.24 — Archive/QA correction note

## Trigger
v5.2.23-r2 behavioral QA: Scenario 1 PASS, Scenario 2 PASS, Scenario 3 FAIL. The failure was caused by `getWeeklyRestPlan()` returning null after `anchor.finishAbs + 72h`.

## Accepted prior logic preserved
- End Week starts an informational weekly-rest candidate from the last factual Finish.
- Six cycles are warning/due logic, not proposal visibility.
- 45h primary and valid 24h reduced secondary proposal remain.
- Suggested ≠ Saved.
- A real Start establishes the factual endpoint.

## v5.2.24 correction
- Remove arbitrary 72h candidate display expiry.
- Keep long continuous rest context available until a later factual Work Start.
- After a factual Start, prevent the old End Week candidate from reappearing on subsequent days.

## Out of scope
No Pay Engine, compensation formula, archive semantics, Setup, KM, Save & Next or visual redesign.
