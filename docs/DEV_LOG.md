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


## v5.1.4 — Clear active Gross Only toggle

PROBLEM:
The PAYE/Gross Only buttons did not clearly show which mode was active after tapping.

FIX:
Active button now uses a clear dark selected state, a ✓ marker, aria-pressed, and a visible Current mode line.

WHY:
Mode selection affects whether preview values are gross-only or PAYE estimates. The user must not guess whether the tap worked.


## v5.1.5 — Gross Only select fixed from v5.1.4

PROBLEM:
The two-button PAYE/Gross Only toggle was unclear and could appear not to switch.

FIX:
Replaced it with a simple select/dropdown:
- PAYE Estimate
- Gross Only

Gross Only now also changes the calculation:
- Tax = 0
- NI = 0
- daily/weekly net = gross

WHY:
The user must be able to clearly select whether values are PAYE estimates or gross-only figures.

LIMITATION:
This does not fix profile/snapshot architecture.
