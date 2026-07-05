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


## v5.2.0
STATUS: Standard Weekly Rest Foundation test build.
CHANGE: End Week creates a Weekly Rest Candidate. Worked / OT area becomes a dynamic Weekly Rest card for standard weekly rest guidance. 45h/24h suggestions are based on completed work cycles.
BOUNDARY: Standard model only. No Pay Profiles redesign. No 4 on / 4 off or variable work pattern settings.
