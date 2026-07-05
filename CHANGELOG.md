
## v5.2.2 – Weekly Rest Visual / Start Validation Fix
- Weekly Rest preview card now uses existing app colours: standard dark main time, grey source helper, existing helper warning/success colours.
- Added Start field violation validator: if entered Start is before the earliest legal rest boundary, the Start field turns red and shows “Rest not completed”.
- Legal entered Start values remain visually standard. Rest Card logic is not changed by this UX validator.

# Changelog

## v5.2.1 – Standard Weekly Rest Candidate Fix

- Enables Weekly Rest Candidate persistence after End Week.
- Backfills Weekly Rest Candidate from the previous saved week when the user is already on the next week.
- Replaces Worked / OT with a compact Weekly Rest card while the standard weekly rest candidate is active.
- Keeps the current standard Sunday/Monday workflow for this version.
- Keeps Pay Profiles architecture unchanged.
- Removes package-lock from deploy ZIP to avoid Vercel registry lock issues.

Build status: `npm install --no-package-lock` and `npm run build` completed successfully.
