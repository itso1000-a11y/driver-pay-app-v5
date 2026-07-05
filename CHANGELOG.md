# Changelog

## v5.2.1 – Standard Weekly Rest Candidate Fix

- Enables Weekly Rest Candidate persistence after End Week.
- Backfills Weekly Rest Candidate from the previous saved week when the user is already on the next week.
- Replaces Worked / OT with a compact Weekly Rest card while the standard weekly rest candidate is active.
- Keeps the current standard Sunday/Monday workflow for this version.
- Keeps Pay Profiles architecture unchanged.
- Removes package-lock from deploy ZIP to avoid Vercel registry lock issues.

Build status: `npm install --no-package-lock` and `npm run build` completed successfully.
