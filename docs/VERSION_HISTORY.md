
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

## v5.1.12
STATUS: Safe Rest UX patch.
CHANGE: Start helper source labels clarified for 11h and 9h daily rest suggestions.
BOUNDARY: Text/UI only. No Rest Engine, calculation, Weekly Rest, Split Break, End Week, Archive, or Pay Engine changes.

