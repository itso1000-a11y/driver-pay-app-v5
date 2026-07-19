## v5.2.13 — QA TypeScript Validation Fix

- Base: v5.2.12 safe Start suggestion regression fix.
- Removed duplicate keys from the English UI translation object after full QA exposed 14 TypeScript TS1117 errors.
- Preserved the exact effective runtime values that v5.2.12 already displayed; no UI, Rest Engine, Pay Engine, Archive, persistence, or navigation behaviour changed.
- Exact comparison against v5.2.11 confirmed that v5.2.12 contained only the documented daily Start auto-accept fix plus release/version output; no accidental CSS or engine changes were present.
- Production build, TypeScript validation, version consistency, and affected regression tests rerun.
- Version advanced to v5.2.13 because source code changed after v5.2.12 QA.

## v5.2.12 — Safe Start Suggestion Regression Fix

- Base: v5.2.11 indivisible weekly compensation test build.
- Restored the fast-entry workflow for a valid daily Start proposal: entering Finish now atomically saves the current daily proposal as the real Start and saves Finish in the same state update.
- Existing manual Start values are never overwritten.
- Weekly-rest proposals are not silently accepted by this path.
- Compensation ledger, indivisible compensation, deadlines, Weekly Rest Engine, Daily Rest Engine, Start validation, Finish formatting, Save & Next and Pay Engine were not changed.
- Version advanced to v5.2.12.

## v5.2.11 — Indivisible Weekly Rest Compensation

- Base inspected first: v5.2.10 already calculated exact reduced weekly-rest compensation and its deadline, but had no compensation ledger or completion logic.
- Added a small persistent compensation ledger that keeps each reduced weekly-rest obligation separate.
- Compensation is indivisible: shorter extra rests do not reduce the outstanding amount and two partial periods are never added together.
- One obligation is completed only when one later continuous rest contains at least 9h base rest plus the full compensation, occurs after the reduction, and is no later than the stored deadline.
- Multiple obligations remain separate; a single rest completes at most the earliest eligible obligation in this version.
- Old data without the ledger remains valid and is sanitised conservatively; no compensation is invented as completed.
- Backup v2 automatically includes the ledger through the existing complete localStorage snapshot.
- Removed the ISO week number from compensation displays; the real calendar deadline remains.
- Helper now shows only “45h unavailable”; “6 working days completed” was removed.
- Start Card keeps “Weekly rest ended” before a real Start and removes it after Start.
- Pay Engine and unrelated Rest Engine behaviour were not changed.

Build status: production Vite build passed.

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
