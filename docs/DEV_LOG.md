# Driver Pay App — Dev Log

## v5.1.2 — Gross Only visible mode

CHANGE:
Added a Gross Only / PAYE Estimate mode indicator and setting.

WHY:
The app is currently used for agency/LTD-style gross pay checking while Pay Setup v2 and snapshots are still being rebuilt. The user must clearly see whether preview numbers are gross-only or PAYE estimates.

IMPORTANT:
This is a small usability patch on v5.1.1. It does not fix the deeper profile/snapshot problem.

DO NOT ASSUME:
Gross Only solves historical recalculation. Day-level pay snapshots are still required.

NEXT ARCHITECTURE FIX:
Day pay snapshot + Quick Setup profile/apply flow.


## v5.1.3 — Gross Only toggle visibility fix

PROBLEM:
v5.1.2 added Gross Only logic/indicator but the switch was not visible enough.

FIX:
Added a clear two-button PAYE Estimate / Gross Only toggle at the top of Settings.

WHY:
The user must clearly control whether preview/pay values include estimated Tax/NI/Pension or show gross-only values.

LIMITATION:
This still does not fix profile/snapshot recalculation. Day-level snapshot remains the next architecture fix.
