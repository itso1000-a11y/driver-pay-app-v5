# Driver Pay App v5.2.25 — Phone Road-Test Deploy

## Status
**APPROVED FOR DEPLOYMENT / PHYSICAL-PHONE VALIDATION**

Runtime application version remains **5.2.25**.

This package contains the same runtime application source that passed v5.2.25-r2 Heavy QA.

## Confirmed before deployment
- ZIP/root/version integrity: PASS
- `npm ci`: PASS
- complete `npm test`: PASS
- `npx tsc --noEmit`: PASS
- fresh `npm run build`: PASS
- WR-001 through WR-013: PASS under automated/source behavioral coverage
- all three protected End Week scenarios: PASS
- Test/Register/Source alignment: PASS
- active contradictions: none
- source integrity after QA: PASS
- QA source corrections: none

## Required physical-phone checks
1. Weekly Rest is visibly named on the real phone when weekly-rest context owns the day.
2. Before factual Start, the 45h primary and valid 24h secondary proposals are actually visible when applicable.
3. Fewer than six cycles do not suppress an End Week weekly-rest candidate.
4. Six-cycle mandatory warning still uses the existing `Weekly rest required` path.
5. `Day Off → Work` does not silently save Start and preserves the relevant weekly-rest proposal.
6. Long rest accrued before End Week retains its original factual Finish anchor.
7. After a factual Start, the old candidate is consumed and does not reappear.
8. A non-current soft archive provides a direct `Go to current week` action.
9. The current day does not look like a hard archive merely because End Week was used.
10. General phone layout/touch/PWA update behavior remains usable.

## Release boundary
No Setup work is included.

If the physical-phone validation passes, v5.2.25 becomes the stable installed baseline before Setup planning/development.
