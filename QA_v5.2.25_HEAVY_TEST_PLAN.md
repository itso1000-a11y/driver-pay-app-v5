# Driver Pay App v5.2.25 — Heavy QA Plan

Do not correct source during QA. Report PASS/FAIL only.

## Mandatory
1. ZIP/root/version identity.
2. `npm ci`, full `npm test`, `npx tsc --noEmit`, fresh `npm run build`.
3. Re-run v5.2.23 Scenarios 1–3 and v5.2.24 candidate-consumption regression.
4. Candidate freshness: stale older stored candidate + saved immediate previous week => newer previous-week anchor must win.
5. Work day before 24h: Weekly Rest context visible; 45h primary and 24h secondary present; no Start auto-save.
6. Work day 24h–44h59m: Weekly Rest visible; 45h primary and 24h reduced option visible.
7. Work day after 45h with no Start: Weekly Rest context MUST remain visible even though secondary helper may be empty; Start hint must retain `Weekly rest ended [day/time]`.
8. Day Off: weekly-rest informational context remains visible when applicable.
9. `Day Off → Work`: proposal persists; no Start is silently saved.
10. Six cycles still produce existing `Weekly rest required`; fewer cycles do not suppress End Week candidate.
11. Soft archive: a non-current soft archived week exposes direct `Go to current week`; current day/true hard archive semantics unchanged.
12. Pay Engine, compensation, backup/restore, archive duplicate protection, Start KM and current-day visual regressions remain green.

## Road-test contract to inspect in source/render path
The visible Work-day Weekly Rest card must be gated by existence of `weeklyRestPlan`, NOT by `weeklyRestPlan.helper`.
