# Driver Pay App v5.2.25 — v5.2.16 UX Recovery Audit

## Compared sources
- v5.2.16 `src/App.tsx.before-weekly-due-gate`
- v5.2.16 stable `src/App.tsx`
- v5.2.24 Heavy-QA/road-test source

## Findings
1. The old weekly-rest UI contract is still recognizable: Start owns 45h/24h proposals before factual Start; Rest Card owns facts after Start.
2. v5.2.24 rendered the Work-day weekly card only when `plan.helper` was non-empty. After the 45h target passed, the plan remained valid but `helper` became empty, so the entire weekly-rest card disappeared.
3. Candidate storage is single-value. A stale older stored End Week candidate could be preferred over the immediate previous pay-week backfill, suppressing the expected current weekend proposal after upgrades/history changes.
4. Hard archive retained `Go to current week`, but soft archive had no equivalent direct return action on the day screen.

## v5.2.25 adaptation
- Prefer the newest applicable candidate between stored state and immediate previous-week factual backfill.
- Render the Work-day Weekly Rest card whenever a weekly-rest plan exists, not only while the 24h helper is non-empty.
- Preserve the existing Start-field 45h target / 24h alternative / `Weekly rest ended` lifecycle.
- Restore a direct `Go to current week` button when viewing a non-current soft archive.
- Do not alter six-cycle warning, compensation, Pay Engine, backup, archive locking, or current-day visual rules.
