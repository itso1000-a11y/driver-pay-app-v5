# Driver Pay App — CHANGELOG

## v5.1.12 — Safe Rest UX Patch
Date: 2026-07-03

Changed:
- Clarified Start helper source text.
- 11h suggestions show `from 11h rest`.
- 9h suggestions show `from 9h rest`.
- `11h rest unavailable` remains a separate explanation.

Not changed:
- No calculation changes.
- No Rest Engine changes.
- No Weekly Rest work.
- No Split Break behaviour changes.
- No End Week, Archive, or Pay Engine changes.

QA:
- Check 11h source label.
- Check 9h source label plus separate 11h unavailable explanation.
- Retest 9h helper visibility when the 9h boundary is on the previous calendar day.
- Confirm suggested Start times are unchanged.
