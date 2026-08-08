# Version Index

## v5.2.20 — Weekly Rest Start Warnings + UX Boundary
- Reuses the existing red Start-field violation UI for two weekly-rest-specific reasons: `Weekly rest required` and `Weekly rest not completed`.
- Keeps all existing daily-rest texts and the Rest Card three-colour system unchanged.
- Prevents archived/closed weeks from entering the `Working tomorrow?` End Week branch.
- Keeps existing End Week feedback wording but makes the toast larger and visible for 4.5 seconds.
- Treats carried Start km as visually accepted/dark once Finish km is entered, while remaining editable.
- Gives completed earlier days in the active week archive-like screen styling without archive locking.
- Adds heavy QA and independent tester-chat handoff documents.

## v5.2.19 — Compensation Repayment Chronology Guard

Purpose: close the v5.2.18 repayment chronology gap without changing any other weekly-rest behaviour.

QA focus: a qualifying rest must begin at or after the debt source boundary; a rest spanning across the debt-creation moment must not repay that debt.

Open item carried forward: Monday Start proposal after End Week. No change in this version.

## v5.2.18 — Timeline Compensation Repayment

Purpose: allow the factual timeline path to complete one already-existing compensation obligation without re-enabling legacy ownership.

QA focus: indivisible repayment boundaries, chronology, deadline, one-obligation-per-rest, ordering, and self-completion prevention.

Open item carried forward: Monday Start proposal after End Week. No change in this version.

## v5.2.17 — Timeline Reduced Weekly Rest Debt Creation

- Base: v5.2.16 Weekly Rest Timeline & End Week Intent Boundary.
- First compensation-integration step only: when a reduced weekly rest becomes factual because a later real Start proves a continuous 24h-<45h rest, the timeline path creates one exact outstanding compensation obligation.
- Compensation amount remains `45h - actual reduced weekly rest`; regular 45h+ weekly rest creates no debt.
- The new timeline obligation uses the same conservative deadline convention as the existing legacy ledger path and records the pay-period Saturday containing the work day before the rest.
- Duplicate protection now also treats the same factual rest end + same owed amount as the same obligation, preventing timeline/legacy double creation.
- Scope is deliberately narrow: this version does not add timeline-driven compensation completion, does not change Start/End Week/day state, and does not add storage keys or migrations.
- Added regression coverage for exact debt creation, no duplicate on repeat evaluation, regular-rest no-debt, and separate obligations for separate reduced weekly rests.

Validation: `tsc --noEmit` PASS; full `npm test` PASS. Fresh Vite production build still requires an environment with the project dependencies available.

## v5.2.16 — Weekly Rest Timeline & End Week Intent Boundary

- Base: v5.2.15 Backup/Restore Round-Trip QA Foundation.
- Promoted the QA-passed cross-pay-period weekly-rest timeline work into a distinct version identity so it is not confused with v5.2.15.
- Weekly-rest detection now follows the full dated chronology across pay periods, recognises factual mid-week reduced/regular weekly rests, resets cycle counting from the latest factual rest, and falls back conservatively across ambiguous incomplete Work days.
- After six completed work cycles, the factual timeline may drive the 45h primary Start proposal without requiring End Week; the 24h reduced option remains secondary.
- Timeline ownership remains stable after Start is entered and blocks the legacy compensation path; the timeline path does not create/complete compensation-ledger obligations in this version.
- End Week remains the pay-period/archive boundary. When the factual timeline is known and weekly rest is not yet due, the UI asks `Working tomorrow?` instead of assuming weekly rest. `Yes` opens the immediate next calendar day as Work in the current Sat-ending model; `No` preserves the legacy weekly-rest flow.
- End Week feedback is explicit: `Week completed.`, `Week already saved. No changes.`, and `Changes saved. Week updated.`
- Added dedicated regression coverage for End Week next-day intent in addition to weekly-rest timeline and backup/restore suites.
- Custom End Week day remains future Setup work. No new timeline storage key or storage migration is introduced.
- Versioning rule reaffirmed: every functional/source change receives a new version identity, and release/checkpoint filenames must include a short descriptive purpose rather than ambiguous repeated v5.2.15 labels.

Status: source candidate pending exhaustive local QA and fresh production build.

## v5.2.15 — Backup/Restore Round-Trip QA Foundation

- Base: v5.2.14 documentation continuity foundation.
- Added isolated automated QA for complete Backup → Restore state transfer.
- The test verifies that a backup from one device replaces the second device's local state and produces an identical complete storage snapshot.
- The test covers current week data, saved weeks, settings, archive, pay profiles, active profile, weekly-rest candidate, closed weeks, language and weekly-compensation ledger.
- Added an atomic rollback test: a failed restore must leave the pre-existing local state unchanged.
- Added production-source guards confirming that the current version-2 backup still exports the complete localStorage snapshot and restores it before reload.
- No application UI, user-facing text, Rest Engine, Pay Engine, Archive, navigation, layout, colour, calculation or production behaviour changed.

## v5.2.14 — Documentation Continuity Foundation

- Base: v5.2.13 QA TypeScript validation fix.
- Added a permanent master project reference and AI continuity workflow.
- Added consolidated decision, architecture, release/QA workflow and backlog documents.
- Formalised the rule that future work must inspect history and locked decisions before changing Rest Engine, Pay Engine, Pay Profiles, Archive or storage.
- Formalised documentation maintenance, one-change-per-version, version consistency and QA-level rules.
- No functional application source, UI, Rest Engine, Pay Engine, Archive, storage, navigation, layout, colour or calculation logic changed.
- `src/App.tsx` remains byte-for-byte unchanged from v5.2.13.

Validation status: ZIP/source/documentation checks completed. Dependency installation/build revalidation was attempted but the execution environment timed out; v5.2.13 build output is retained with version identity regenerated for v5.2.14.

## v5.2.13 — QA TypeScript Validation Fix

- Base: v5.2.12 safe Start suggestion regression fix.
- Removed duplicate English translation keys that caused TypeScript TS1117 validation failures while preserving v5.2.12 runtime text and behaviour.
- No UI, Rest Engine, Pay Engine, Archive, persistence, or navigation logic changed.
- Version advanced to v5.2.13 after QA-required source correction.

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
