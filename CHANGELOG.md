## v5.2.25 — Weekly Rest UI Contract Recovery
- Compared v5.2.16 pre-due-gate/stable UI paths against v5.2.24.
- Weekly Rest card now renders whenever a valid plan exists, including after the 45h endpoint has passed.
- A stale stored candidate can no longer hide a newer immediate previous-week candidate.
- Non-current soft archive now has a direct `Go to current week` action.
- Six-cycle warning, compensation, Pay Engine and archive locking logic are unchanged.

# Changelog

## v5.2.24 — Long Weekly-Rest Context / Candidate Consumption Fix
- Fixes the blocking Scenario 3 defect found by behavioral QA in v5.2.23-r2.
- Removes the arbitrary 72-hour display cutoff from weekly-rest proposal/context helpers.
- Keeps an End Week weekly-rest candidate alive for the full uninterrupted rest, including rests longer than 72h, so the passed 45h endpoint can still show `Weekly rest ended [day/time]` before factual Start.
- Adds factual candidate-consumption detection: the first later real Work Start consumes the old End Week candidate for subsequent days, preventing stale proposal reappearance after work resumes.
- Preserves the three accepted End Week scenarios, Suggested ≠ Saved, 45h primary/24h secondary proposal semantics, six-cycle mandatory warning, compensation chronology, archive behavior, Pay Engine and Setup scope.


## v5.2.23 — End Week / Weekly Rest Intent Separation
- Restores the archived End Week intent model: pressing End Week starts weekly-rest tracking from the last factual Finish.
- Separates voluntary End Week proposal visibility from the six-cycle mandatory due/warning gate.
- Keeps 45h as the primary weekly-rest target and 24h as the reduced secondary option.
- Preserves Suggested ≠ Saved, factual timeline ownership, compensation chronology and normal daily-rest legality.
- r2 QA packaging update fixes version-documentation identity and replaces source-pattern-only v5.2.23 coverage with executable behavioral simulation of the three mandatory End Week scenarios using instrumented functions from the actual App.tsx source.
- No application runtime logic change was made in r2.


## v5.2.22 — Same-pay-week Weekly Rest + Current-Day Visual Regression Fix
- Archive-audited fix after physical-phone road test of v5.2.21.
- Keeps a stored End Week weekly-rest candidate addressable on Saturday of the same Sunday→Saturday pay week; factual chronology and due-gate logic still decide whether it may drive proposals.
- Restores applicable weekly-rest 45h/24h pre-Start proposal visibility on same-pay-week Saturday without auto-saving Start.
- Preserves `Suggested ≠ Saved` and existing Day Off → Work workflow.
- Prevents today's/future soft-closed day from receiving archive-like shell styling merely because End Week was pressed.
- Keeps past saved-day visual distinction and true hard-archive locking unchanged.
- No midnight cutoff rule added for the 24h option.
- No Pay Engine, compensation formula, Rest Card colour semantics, KM, profile, Save & Next or accepted-text change.

## v5.2.21 — Soft Archive + Weekly Rest Visibility Restoration
- **Stable QA promotion:** heavy QA passed `npm ci`, full automated regressions, TypeScript validation and a fresh Vite production build; no source corrections were required. v5.2.21 is the current stable source/deploy baseline.
- Archive audit restored the protected date-aware lifecycle: a closed current/near-current week is soft-editable instead of immediately becoming hard archive.
- Current and immediately previous pay week remain soft when closed; older genuinely historical weeks retain hard archive protection.
- A closed soft week cannot reopen the `Working tomorrow?` prompt; corrections use the existing update/no-duplicate closed-week path.
- Restores weekly-rest context on qualifying Day Off screens with `Weekly rest in progress` / `Тече седмична почивка`.
- Restores applicable 45h and valid 24h weekly-rest proposal information without changing Daily Rest, Rest Card colour semantics, compensation, Pay Engine, Save & Next or pay-week boundaries.
- Keeps the existing factual due gate: End Week does not manufacture a weekly-rest proposal before weekly rest is due.
- Keeps a valid 24h reduced option through the reduced-rest window and hides it once the 45h regular-rest threshold is reached. No new midnight expiry rule is introduced because the archive does not contain a locked exact-midnight rule.
- Adds dedicated v5.2.21 regression and heavy-QA handoff coverage.

## v5.2.20 — Weekly Rest Start Warnings + UX Boundary
- Reuses the existing red Start-field violation UI for two weekly-rest-specific reasons: `Weekly rest required` and `Weekly rest not completed`.
- Keeps all existing daily-rest texts and the Rest Card three-colour system unchanged.
- Prevents archived/closed weeks from entering the `Working tomorrow?` End Week branch.
- Keeps existing End Week feedback wording but makes the toast larger and visible for 4.5 seconds.
- Treats carried Start km as visually accepted/dark once Finish km is entered, while remaining editable.
- Gives completed earlier days in the active week archive-like screen styling without archive locking.
- Adds heavy QA and independent tester-chat handoff documents.

## v5.2.19 — Compensation Repayment Chronology Guard

- Fixes the v5.2.18 QA chronology defect: a continuous rest may repay an existing compensation obligation only if the rest itself begins at or after that obligation arose.
- Eligibility now checks both boundaries: `restStartAbs >= sourceStartAbs` and `enteredStartAbs > sourceStartAbs`.
- The same guard is applied to the timeline-owned repayment helper and the legacy completion path so neither can consume pre-debt rest time.
- Adds a regression case where a rest begins before the debt source boundary but ends after it; the debt must remain outstanding.
- Preserves indivisible repayment, deadline checks, FIFO ordering, one-rest/one-obligation usage, self-completion protection, duplicate protection and timeline/legacy isolation.
- Monday Start proposal after End Week remains an explicit OPEN ITEM; no behaviour change was made.

## v5.2.18 — Timeline Compensation Repayment

- Adds timeline-owned repayment of one existing weekly-rest compensation obligation from a factual continuous rest ending at a real Start.
- Keeps compensation indivisible: insufficient rest does not reduce the outstanding balance.
- Preserves chronological and saved-deadline checks.
- Completes at most one obligation per factual rest, including across Start edits, prioritising earliest deadline then oldest source boundary.
- A debt created at the current Start cannot complete itself; an older eligible debt may complete while the new debt stays outstanding.
- Leaves v5.2.17 debt creation, Start, Finish, End Week, Pay Engine, Archive and day-state behaviour unchanged.
- Monday Start proposal after End Week remains an explicit OPEN ITEM; no behaviour change was made.

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

### v5.2.22 deployment status
Heavy QA, TypeScript and fresh production build passed. Packaging revision r1 corrected only the internal ZIP root identity and passed integrity/source comparison. The unchanged v5.2.22 source is released for physical-phone road testing before Setup work begins.

### v5.2.25-r1 documentation/governance revision
- Added canonical `PROTECTED_BEHAVIOURS.md` / Master Decision Register after audit of v5.2.16→v5.2.25 history.
- Added `NEW_CHAT_HANDOVER.md` with mandatory read-before-code rule.
- No runtime application source, tests, dependencies, storage, Rest Engine, Pay Engine, Archive logic or UI text changed by this r1 packaging revision.

### v5.2.25-r2 QA/test alignment
- Resolved the Heavy-QA contradiction C-001 between WR-009 and the historical v5.2.22 regression assertion.
- The old test no longer requires unconditional stored-candidate preference; it now verifies the current protected newer-factual-Finish selection while retaining the same-pay-week Saturday rule.
- Runtime application source is unchanged.

### v5.2.25 phone-road-test deploy
The Heavy-QA-passed v5.2.25 runtime source is packaged unchanged for physical-phone validation. No Setup work is included.
