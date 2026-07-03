# Driver Pay App — VERSION_INDEX

## v5.1.12
Date: 2026-07-03
Base: v5.1.11
Status: Test build
User impact: Low

Purpose:
Clarify the Start helper text so the user can see whether the suggested Start time comes from 11h normal daily rest or 9h reduced daily rest.

Changed:
- 11h Start suggestions now show `from 11h rest` under the Start field.
- 9h reduced Start suggestions now show `from 9h rest` under the Start field.
- When 11h rest is unavailable, the explanation remains separate as `11h rest unavailable` and does not replace `from 9h rest`.
- Added backlog note for later Split Break / Week Active UX review.

Not changed:
- No Rest Engine changes.
- No Start calculation changes.
- No Reduced Rest logic changes.
- No Split Break behaviour changes.
- No Weekly Rest, 72h Helper, End Week, Archive, or Pay Engine changes.

Regression focus:
- The 9h helper must remain visible even when the 9h boundary is on the previous calendar day.
- All suggested Start times must remain exactly the same as v5.1.11.

QA:
- REST-START-SOURCE-001: OPEN
- REST-9H-PREVIOUS-DAY-001: RETEST

Rollback:
- Previous build: v5.1.11

## v5.1.11
Date: 2026-06-28
Base: v5.1.10
Status: Test build
User impact: High

Purpose:
Stabilise Pay Profile behaviour before a full real-work-week test.

Changed:
- Active Pay Profile display now uses the real profile name format, for example `ARC → Turners`.
- Settings screen uses the existing main visual field to show the active Pay Profile, without adding new rows.
- Pay profiles continue to preserve and restore PAYE / Gross Only mode as part of the profile snapshot.
- `Update Profile` now applies the updated profile to current Settings when the updated profile is the active one.
- `Update Profile` is disabled when there are no real changes.
- The previous profile version is archived before an actual profile update.
- `New from this` was removed to avoid duplicating `Save as new profile`.

Not changed:
- No Rest Engine changes.
- No Pay formula changes.
- No Archive workflow redesign.
- No main screen layout or colour-logic changes.

Known issues / test focus:
- Needs full-week real test with Gross Only agency/LTD style profile and PAYE/company style profile.
- Verify that saved/completed days do not unexpectedly recalculate after a profile update.
- Verify installed PWA offers/accepts update normally.

QA:
- PROFILE-TAXMODE-001: RETEST
- PROFILE-ACTIVE-DISPLAY-001: OPEN
- PROFILE-UPDATE-001: OPEN

Rollback:
- Previous build: v5.1.10

## v5.1.10
Date: 2026-06-28
Base: v5.1.9
Status: Test build
User impact: Medium

Purpose:
Fix profile tax mode persistence when switching between PAYE/company work and gross-only agency/LTD style work.

Changed:
- Profiles preserve `grossOnly` explicitly in their settings snapshot.
- Pay Setup v2 draft restores the selected profile's PAYE/Gross Only mode.
- Applying a profile applies the stored tax mode with the rest of the profile settings.
- Added Pay calculation mode selector inside Pay Setup v2 profile editor.

Not changed:
- No Rest Engine changes.
- No Pay formula changes.
- No Archive workflow changes.
- No main screen layout or colour-logic changes.

Known issues:
- Needs real-device test with one PAYE profile and one Gross Only profile.

QA:
- PROFILE-TAXMODE-001: OPEN

Rollback:
- Previous build: v5.1.9

## v5.1.9
Date: 2026-06-28
Base: v5.1.8
Status: Test build
User impact: Medium

Purpose:
Profile restore safety.

Changed:
- Week data stores `activePayProfileId`.
- Archive/current week profile restore improved.

Known issues:
- Profile tax mode may not restore correctly when switching between PAYE and Gross Only profiles.

Fixed in:
- v5.1.10
