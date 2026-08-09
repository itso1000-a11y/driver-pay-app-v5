# Driver Pay App v5.2.25-r2 — Test/Register Alignment

## Reason
Heavy QA of v5.2.25-r1 found no confirmed runtime defect in WR-001–WR-013.

The official `npm test` command failed because the historical v5.2.22 regression still required unconditional preference for a stored weekly-rest candidate.

That assertion contradicts:
- `WR-009` in `PROTECTED_BEHAVIOURS.md`;
- the current v5.2.25 implementation;
- the passing v5.2.25 stale-candidate behavioral regression.

## Correction
Only the historical v5.2.22 regression assertion was updated.

The test now protects both:
1. the original v5.2.22 requirement that a same-pay-week candidate remains applicable on Saturday; and
2. the later WR-009 rule that, when two candidates are applicable, the candidate with the newer factual Finish wins.

## Scope
- Runtime application source: unchanged.
- User-facing application text: unchanged.
- Pay Engine: unchanged.
- Rest Engine: unchanged.
- Archive/storage: unchanged.
- Dependencies: unchanged.
- Runtime application version remains **5.2.25**.
- `r2` identifies only this QA/test-documentation artifact revision.

Independent Heavy QA must now rerun the complete `npm test`, TypeScript and fresh production build.
