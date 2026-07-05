# Driver Pay App — CHANGELOG

## v5.2.0 — Standard Weekly Rest Foundation
Date: 2026-07-05

Changed:
- Added standard-model Weekly Rest Candidate after End Week.
- End Week now stores the last Finish as the weekly-rest candidate anchor for the next app week.
- Worked / OT cards are temporarily replaced by a same-space Weekly Rest card while the standard weekly-rest helper window is active.
- Weekly Rest card follows the same UX model as Daily Start: big suggested start time plus a small explanation.
- Under 6 completed work cycles: 45h weekly rest is the main suggestion and 24h reduced weekly rest appears as the helper option.
- At 6 completed work cycles: 24h reduced weekly rest becomes the main suggestion and the helper explains that 45h is unavailable.
- 72h remains a UX helper window only. After the helper window, weekly suggestions stop showing.

Not changed:
- Pay Profiles architecture was not changed.
- Pay formulas were not changed.
- Daily Rest calculations and 9h/11h suggestions were not redesigned.
- 4 on / 4 off, variable work patterns and Pay Setup v2 work-pattern settings are not included in this build.
- Current standard-week flow is preserved: Saturday/Sunday Off after End Week and Monday as the next opened workday remain acceptable for this first standard model.

QA:
- End Week after a normal standard week opens the next week and shows the Weekly Rest card on Monday.
- If fewer than 6 completed work cycles are recorded, the card shows a 45h weekly rest start and a 24h helper.
- If 6 completed work cycles are recorded, the card shows a 24h reduced weekly rest start and explains that 45h is unavailable.
- Starting a new shift hides the Weekly Rest card and returns Worked / OT.
- Verify PWA update prompt appears because APP_VERSION, title, manifest and service-worker cache were bumped to v5.2.0.

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
