## v5.2.21 — Soft Archive + Weekly Rest Visibility Restoration
- Restores date-aware soft archive for closed current/near-current pay weeks.
- Restores weekly-rest context and applicable 45h/24h proposal information on qualifying Day Off screens.
- Adds `Weekly rest in progress` / `Тече седмична почивка`.
- Preserves the timeline due gate, compensation logic, Daily Rest, Pay Engine, Save & Next, Rest Card colour system and Sunday→Saturday pay-week boundary.
- Does not invent an unconfirmed midnight expiry rule for the reduced 24h proposal.

## v5.2.20 — Weekly Rest Start Warnings + UX Boundary
- Weekly-specific Start violation reasons reuse the existing red Start-field UI.
- Archive End Week no longer offers Working tomorrow; existing feedback is more readable.
- Start km suggestion becomes visually accepted after Finish km entry.
- Completed earlier active-week days use archive-like visual styling without locking.
- Rest Card colours/thresholds and existing old texts are unchanged.

## v5.2.17 — Timeline Reduced Weekly Rest Debt Creation

- Base: v5.2.16 Weekly Rest Timeline & End Week Intent Boundary.
- First compensation-integration step only: when a reduced weekly rest becomes factual because a later real Start proves a continuous 24h-<45h rest, the timeline path creates one exact outstanding compensation obligation.
- Compensation amount remains `45h - actual reduced weekly rest`; regular 45h+ weekly rest creates no debt.
- The new timeline obligation uses the same conservative deadline convention as the existing legacy ledger path and records the pay-period Saturday containing the work day before the rest.
- Duplicate protection now also treats the same factual rest end + same owed amount as the same obligation, preventing timeline/legacy double creation.
- Scope is deliberately narrow: this version does not add timeline-driven compensation completion, does not change Start/End Week/day state, and does not add storage keys or migrations.
- Added regression coverage for exact debt creation, no duplicate on repeat evaluation, regular-rest no-debt, and separate obligations for separate reduced weekly rests.

Validation: `tsc --noEmit` PASS; full `npm test` PASS. Fresh Vite production build still requires an environment with the project dependencies available.

## v5.2.14 — Documentation Continuity Foundation

- Established the permanent AI-readable project reference and release workflow.
- Consolidated locked architecture and behaviour decisions without changing application logic.
- Added explicit startup order, change classification, QA levels and future backlog boundaries.
- Application source remains unchanged from v5.2.13.

## v5.2.13 — QA TypeScript Validation Fix

- Removed duplicate English UI translation keys discovered by full QA.
- Preserved the exact effective v5.2.12 runtime values.
- No behavioural or visual redesign changes.

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

# Driver Pay App — Version History

## v5.1.2
STATUS: Small working-week patch.

CHANGE:
Gross Only / PAYE Estimate mode visible in setup/preview.

LIMITATION:
Does not fix profile/snapshot architecture.

## v5.1.1
STATUS: Test / unsafe for pay history.
Problem: profile/settings changes can still recalculate old days.

## v5.0.0
STATUS: Clean v5 base/fallback.


## v5.1.11
Profile settings/tax mode cleanup for real-week testing. Active profile display, profile update apply behaviour, no-change disabled update, removed duplicate New from this.

## v5.2.2
STATUS: Safe Rest UX patch.
CHANGE: Start helper source labels clarified for 11h and 9h daily rest suggestions.
BOUNDARY: Text/UI only. No Rest Engine, calculation, Weekly Rest, Split Break, End Week, Archive, or Pay Engine changes.



## v5.2.4 - Day Off context data fix
- Day Off Rest Card now reuses the existing previous-shift rest calculation instead of showing an empty card.
- Day Off context now shows meaningful completed/off days only.
- After End Week, Day Off can show the last completed week context instead of an empty new week.
- No pay/profile/rest-engine changes.


## v5.2.21 — Stable Soft Archive + Weekly Rest Visibility Restoration
Restored protected date-aware soft archive and qualifying Day Off weekly-rest visibility/proposals after archive audit. Heavy QA, TypeScript and fresh production build passed with no source corrections. Promoted to current stable source/deploy baseline.
