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
