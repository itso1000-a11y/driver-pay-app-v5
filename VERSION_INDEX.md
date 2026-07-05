
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

# Version Index

## v5.2.1 – Standard Weekly Rest Candidate Fix

Purpose: make the Weekly Rest Foundation actually activate after End Week / previous week close.

Base: v5.2.2 safe rest UX patch.

Changes:
- Weekly Rest Candidate is now stored after End Week using the last completed Finish in the closing week.
- Candidate can be recovered from the previous saved week if the app is already on the next Monday.
- Worked / OT area is replaced by a same-area compact Weekly Rest card while candidate is active.
- Standard model only: existing Sunday/Monday workflow is kept.
- 4 on / 4 off, variable week starts and Pay Setup work-pattern settings remain out of scope.

QA:
- Build passed locally with Vite.
- Vercel deploy ZIP intentionally excludes package-lock.json and node_modules.


## v5.2.4 - Day Off context data fix
- Day Off Rest Card now reuses the existing previous-shift rest calculation instead of showing an empty card.
- Day Off context now shows meaningful completed/off days only.
- After End Week, Day Off can show the last completed week context instead of an empty new week.
- No pay/profile/rest-engine changes.
