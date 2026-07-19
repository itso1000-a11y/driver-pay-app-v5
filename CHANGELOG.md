## v5.2.10 — Contextual Weekly Rest Helper & Exact Compensation Card

- Weekly Rest helper now contains proposals only; compensation warnings were removed from the helper.
- On the current or a future day, expired 24h options are hidden instead of suggesting a Start in the past.
- Historical days keep the original option so late data entry remains understandable.
- After a real Start is entered, reduced weekly-rest compensation appears in the Rest card with exact owed hours, calendar deadline and fixed-week number.
- Reduced Weekly Rest labels no longer contain a vague “Compensation due” suffix without values.
- No Pay Engine changes.


## v5.2.9 — Complete Backup Snapshot & Weekly Compensation Info

- Backup now captures a complete localStorage snapshot, including all current and future app keys, Pay Profiles/history, weekly-rest candidate, language, archived and active weeks.
- Restore v2 replaces the stored app state atomically and reloads the app; rollback protects the existing state if restore fails.
- Older v1 backup files remain supported.
- Reduced weekly rest now shows the exact compensation owed (45h minus achieved rest), a calendar deadline, and the fixed-week number.
- Deadline uses the fixed week in which the reduced weekly rest started, giving the earliest safe date until explicit cross-week attribution is added.
- No Pay Engine changes and no change to how weekly rest itself is measured.


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

# Changelog

## v5.2.1 – Standard Weekly Rest Candidate Fix

- Enables Weekly Rest Candidate persistence after End Week.
- Backfills Weekly Rest Candidate from the previous saved week when the user is already on the next week.
- Replaces Worked / OT with a compact Weekly Rest card while the standard weekly rest candidate is active.
- Keeps the current standard Sunday/Monday workflow for this version.
- Keeps Pay Profiles architecture unchanged.
- Removes package-lock from deploy ZIP to avoid Vercel registry lock issues.

Build status: `npm install --no-package-lock` and `npm run build` completed successfully.


## v5.2.4 - Day Off context data fix
- Day Off Rest Card now reuses the existing previous-shift rest calculation instead of showing an empty card.
- Day Off context now shows meaningful completed/off days only.
- After End Week, Day Off can show the last completed week context instead of an empty new week.
- No pay/profile/rest-engine changes.

## v5.2.5 - Weekly Rest Finish UX Fix
- Fixed Weekly Rest preview reappearing after Finish is entered on the first work day after weekly rest.
- Weekly Rest preview now only shows while the weekly rest candidate is active and the current day has no Start.
- Keeps completed Weekly Rest in the Rest Card while the normal Work Day screen continues after Start/Finish.

## v5.2.6 — Weekly rest clarity and archive safety
- Replaced user-visible “work cycles” wording with “working days”.
- Restored the Split Rest note that it does not use a 9h reduced daily rest.
- Past Day Off rest cards now clarify that the value is measured to the end of that day.
- Reduced weekly rest now shows that compensation is due.
- Week Preview can show one compact line for the last completed weekly rest.
- Repeated End Week on an unchanged archived week no longer rewrites it and confirms “Week already saved”.
- Existing pressed-button feedback remains in place.

## v5.2.7 — Weekly rest regime priority fix
- Weekly-rest mode now overrides daily 9h/11h suggestions on the first Work Day after End Week.
- The weekly-rest Start suggestion is shown in the main Start field.
- The explanatory Weekly Rest card no longer duplicates the Start proposal.
- An early Start is evaluated consistently as insufficient weekly rest: Start and Rest Card both show the violation state.
- After a valid Start, normal Work Day calculation continues and Worked/OT remain available after Finish.

## v5.2.8 — Weekly rest ended clarity
- When the weekly-rest legal start is on an earlier day, the Start field stays empty and the helper shows when the weekly rest ended (for example, `Weekly rest ended Sun 14:20`).
- Incomplete weekly-rest cards now use the compact wording: `Weekly rest` / duration / `Not completed`.
- No rest-engine or pay-calculation changes.
