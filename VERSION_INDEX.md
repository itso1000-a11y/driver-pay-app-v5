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

## v5.2.5
- Weekly Rest Finish UX Fix: normal work-day screen remains after Start and Finish; Weekly preview does not return after Finish.

- v5.2.6 — Weekly rest wording, Split Rest clarification, last weekly rest preview, and safe repeated End Week feedback.
- v5.2.7 — Weekly-rest priority: one active rest regime, weekly Start in main field, consistent weekly violation Rest Card.

### v5.2.8
- Weekly-rest past-target Start helper clarity.
- Compact incomplete weekly-rest Rest Card wording.
