# Driver Pay App — VERSION_INDEX

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
