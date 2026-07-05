
## v5.2.3 — Day Off Context Polish

- Day Off now keeps the existing Rest Card visible.
- Day Off hides the unused Kilometres / Start km block.
- Day Off hides Day Summary and shows compact Current Week context instead.
- No changes to Pay Profiles, Pay Setup, pay calculation, Weekly Rest Engine, or Rest Card logic.

## v5.2.2 – Version single-source sync

- Added package.json-driven version sync via scripts/sync-version.mjs.
- App UI version, HTML title, manifest and service-worker cache now update from one source before build.
- No pay, profile, rest, weekly rest or layout logic changes.


## v5.2.2 – Weekly Rest Visual / Start Validation Fix
- Weekly Rest preview card now uses existing app colours: standard dark main time, grey source helper, existing helper warning/success colours.
- Added Start field violation validator: if entered Start is before the earliest legal rest boundary, the Start field turns red and shows “Rest not completed”.
- Legal entered Start values remain visually standard. Rest Card logic is not changed by this UX validator.

# Driver Pay App — Version History

## v5.1.2
STATUS: Small working-week patch.

CHANGE:
Gross Only / PAYE Estimate mode visible in setup/preview.

LIMITATION:
Does not fix profile/snapshot architecture.

## v5.1.1
STATUS: Test / unsafe for pay history.
Problem: profile/settings changes can still recalculate old days.

## v5.0.0
STATUS: Clean v5 base/fallback.


## v5.1.11
Profile settings/tax mode cleanup for real-week testing. Active profile display, profile update apply behaviour, no-change disabled update, removed duplicate New from this.

## v5.2.2
STATUS: Safe Rest UX patch.
CHANGE: Start helper source labels clarified for 11h and 9h daily rest suggestions.
BOUNDARY: Text/UI only. No Rest Engine, calculation, Weekly Rest, Split Break, End Week, Archive, or Pay Engine changes.

