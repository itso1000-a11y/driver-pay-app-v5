
## v5.2.2 – Weekly Rest Visual / Start Validation Fix
- Weekly Rest preview card now uses existing app colours: standard dark main time, grey source helper, existing helper warning/success colours.
- Added Start field violation validator: if entered Start is before the earliest legal rest boundary, the Start field turns red and shows “Rest not completed”.
- Legal entered Start values remain visually standard. Rest Card logic is not changed by this UX validator.

# Version Index

## v5.2.1 – Standard Weekly Rest Candidate Fix

Purpose: make the Weekly Rest Foundation actually activate after End Week / previous week close.

Base: v5.1.12 safe rest UX patch.

Changes:
- Weekly Rest Candidate is now stored after End Week using the last completed Finish in the closing week.
- Candidate can be recovered from the previous saved week if the app is already on the next Monday.
- Worked / OT area is replaced by a same-area compact Weekly Rest card while candidate is active.
- Standard model only: existing Sunday/Monday workflow is kept.
- 4 on / 4 off, variable week starts and Pay Setup work-pattern settings remain out of scope.

QA:
- Build passed locally with Vite.
- Vercel deploy ZIP intentionally excludes package-lock.json and node_modules.
