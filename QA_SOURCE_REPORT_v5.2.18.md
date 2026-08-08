# Driver Pay App v5.2.18 — Source QA Report

Status: **PASS for local source checkpoint**

## Change under test

v5.2.18 adds only timeline-owned completion of one already-existing weekly-rest compensation obligation from the factual continuous rest that ends at a real Start.

The v5.2.17 factual reduced-weekly-rest debt-creation path remains separate and unchanged.

## Local checks completed

- `npm test` — PASS
  - backup/restore regression — PASS
  - weekly-rest timeline regression — PASS
  - End Week intent regression — PASS
  - v5.2.17 timeline compensation creation regression — PASS
  - v5.2.18 timeline compensation repayment regression — PASS
- `tsc --noEmit` — PASS
- Version identity — 5.2.18
- Source rollback file retained: `src/App.tsx.before-v5.2.18-timeline-compensation-repayment`

## Repayment cases covered

- 18h continuous rest does not complete a 10h compensation obligation.
- 19h completes a 10h obligation in one indivisible step.
- 21h and 55h are also sufficient for a 10h obligation.
- No partial remaining balance is written.
- Completion is rejected when the Start is not after the obligation source boundary.
- Completion is rejected after the stored deadline.
- One factual continuous rest completes at most one obligation.
- Earliest deadline wins; ties use the older source boundary.
- Editing the Start that ends the same continuous rest cannot spend the same rest on a second obligation.
- A debt created at the current Start cannot complete itself.
- An older eligible obligation may complete on the same factual rest while a newly-created current-rest obligation stays outstanding.
- Already-completed obligations remain unchanged.

## Deliberately unchanged

- Start behaviour
- Finish behaviour
- End Week behaviour
- Day Off / Holiday behaviour
- Pay Engine
- Archive calculations
- v5.2.17 timeline debt-creation rules
- legacy compensation path when timeline ownership is not active

## Open item carried forward

**Monday Start proposal after End Week** remains unresolved by design.

Reference from stable v5.2.15 is documented in `QA_TIMELINE_COMPENSATION_REPAYMENT_v5.2.18.md`. No attempt was made to restore or redesign that behaviour.

## Production build status

A local fresh Vite production build is **not confirmed** because the current environment has no local/global `vite` binary and dependency installation has previously been blocked by package-registry availability.

Do not call this a production release until an independent fresh build succeeds from this source.
