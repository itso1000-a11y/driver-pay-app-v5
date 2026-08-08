# Driver Pay App — Master Project Reference

**Current documented source checkpoint:** v5.2.21
**Installed road-test baseline before this checkpoint:** v5.2.20  
**Purpose of this file:** primary continuity reference for every future development session.

## 1. Project purpose

Driver Pay App is a mobile-first PWA for HGV drivers. Its main job is to answer a practical question: **“Was I paid correctly?”** It also provides a clear rest assistant, but it is not intended to replace a tachograph, legal course, payroll system, or full calendar planner.

The product direction is one application with a Core experience and possible Professional unlocks later. Do not create separate company-specific applications or separate codebases for individual employers.

## 2. Mandatory startup procedure

Before proposing or implementing a change, read these files in order:

1. `MASTER_PROJECT_REFERENCE.md`
2. `docs/AI_CONTINUITY_AND_WORKFLOW.md`
3. `docs/DECISION_LOG.md`
4. `VERSION_INDEX.md`
5. the affected module specification or the closest relevant history section
6. latest entries in `CHANGELOG.md`, `docs/DEV_LOG.md`, and `docs/QA_HISTORY.md`

Do not begin implementation until the existing behaviour and prior decisions have been checked.

## 3. Locked working principles

- Restore previously accepted behaviour before inventing a new solution.
- Suggested values are not saved values.
- Start section contains proposals and planning information.
- Rest Card contains factual completed or current rest information.
- Soft-editable current data is not the same as hard archive history.
- End Week closes the pay period; it is not a calendar planner.
- Rest Engine and Pay Engine must remain logically independent.
- No casual visual redesign. Existing layout, colours and interaction patterns are protected.
- Green means compliant/complete, yellow means reduced or attention, red means a real infringement/error, grey means neutral or suggested.
- Every functional fix receives its own version or subversion.
- Version identity must match across package metadata, UI, title, manifest, service worker, documentation, output and ZIP filename.


## Backup, Restore and future cloud synchronisation — locked architecture

- Backup/Restore is the current mechanism for transferring and synchronising the complete application state between devices.
- A Restore replaces the destination device state with the backup state; it must not silently merge stale local data.
- After Restore, the application continues from the restored state.
- Recorded historical facts come from the backup. Derived/live values may be recalculated only when the result is safe and unambiguous.
- A failed Restore must preserve the destination's previous state through atomic rollback.
- Future Cloud Sync must use the same state format and the same restore/recalculation rules. Cloud is a transport layer, not a separate Rest, Pay, Archive or Compensation engine.
- Rest Engine, Pay Engine, Archive and Compensation logic must not depend on whether state arrived from local storage, a backup file or a future cloud service.


## 4. Current architecture summary

### 4.1 Daily workflow

A day can represent Work Day, Day Off or Holiday. Work Day supports Start, Finish, kilometres, pay inputs, allowances and a day summary. A suggested Start remains only a suggestion until explicitly accepted or safely captured by an already approved workflow.

### 4.2 Daily Rest Engine

- Normal daily rest target: 11 hours.
- Reduced daily rest boundary: 9 hours where legally available.
- Reduced daily rest usage is tracked.
- Split daily rest does not consume a reduced 9-hour daily rest.
- A previous shift longer than 13 hours affects the next daily-rest context only; it must not become a sticky state across long rest, Day Off or End Week.
- Future days without Start must not display live-rest wording as if the day were current.

### 4.3 Weekly Rest Engine

- End Week creates or preserves a Weekly Rest Candidate.
- While weekly-rest mode is active, it has priority over daily 9h/11h suggestions.
- Only one rest regime should be presented at a time.
- Weekly rest is measured continuously from real Finish to real Start; midnight is not a shift boundary.
- The tachograph Monday–Sunday display boundary is not automatically a legal violation boundary.

### 4.4 Weekly-rest compensation

- Every reduced weekly-rest obligation is stored separately.
- Compensation is indivisible.
- Partial rests do not reduce an obligation and cannot be added together.
- FIFO completion is used.
- A qualifying continuous rest must include the required base rest plus the complete compensation.
- Rest Card shows historical facts; Start Helper shows planning only.

### 4.5 Pay Engine

The Pay Engine is model-based, not company-based. Supported direction:

- Hourly Basic / Advanced
- Day Rate
- Mixed
- Mileage later

Companies, agencies and clients configure a model; they do not receive their own engine. Guaranteed daily hours are paid as guaranteed hours, and overtime begins after those guaranteed hours. This is an accepted design rule and must not be reported as a defect.

### 4.6 Pay Profiles

- A profile represents payer/client and pay configuration, for example `ARC → Turners`.
- A profile owns its tax mode: PAYE estimate or Gross Only.
- Food/meal allowance remains a separate untaxed-default item.
- Loading a profile restores its rates, allowances and tax mode.
- When a profile is active, Settings are its working values, not an independent competing source of truth.
- Completed historical days must not be silently recalculated after a later profile update.

### 4.7 Archive and persistence

- Archived records must preserve the values and context used when saved.
- Archive edits affect only the selected record.
- Repeated End Week on an unchanged saved week must not rewrite it.
- Backup v2 captures the complete localStorage snapshot and restore is atomic with rollback protection.

## 5. Protected boundaries

Treat these as high-risk areas requiring explicit review and broader QA:

- Rest Engine calculations
- Weekly Rest Candidate lifecycle
- compensation ledger
- Pay Engine formulas and totals
- profile application and tax mode
- day/week snapshot behaviour
- archive loading/editing
- backup and restore
- PWA update/cache lifecycle

Text-only or local presentation changes must not drift into these areas.

## 6. Current baseline status

**v5.2.21 is the current stable source/deploy baseline.** Independent heavy QA passed ZIP integrity, `npm ci`, the full automated regression suite, `npx tsc --noEmit`, and a fresh Vite production build. No source corrections were made during QA. The protected date-aware soft-archive lifecycle and weekly-rest visibility/proposal behaviour restored in v5.2.21 are part of the stable baseline. A physical-phone road test remains appropriate for touch/layout confirmation and the complete Saturday `Day Off → Work` correction workflow, but it is not a source-QA blocker.

## 7. Current next-work direction

Small/local work may include wording, helper clarity and tightly scoped UI corrections.

The next major architectural subject is the preservation of exact day-level pay/profile snapshots so completed days remain historically stable after profile or Settings changes. It must be designed and tested as a separate major change, not mixed with unrelated UI work.

Cross-midnight shifts are also a separate major project. The future design must treat a shift as continuous until real Finish and begin daily rest from that Finish. It must not be introduced as an incidental bug fix.

## 8. Documentation maintenance rule

Documentation is not read-only. After every code or behaviour change, update all affected documents before creating the release ZIP. At minimum review:

- `MASTER_PROJECT_REFERENCE.md`
- `CHANGELOG.md`
- `VERSION_INDEX.md`
- `docs/DECISION_LOG.md`
- `docs/DEV_LOG.md`
- `docs/PROJECT_HISTORY.md`
- `docs/QA_HISTORY.md`
- `docs/VERSION_HISTORY.md`
- the relevant module/workflow document

A release is incomplete until the documentation reflects what changed, why it changed, what did not change, and how it was checked.

## v5.2.18 — Timeline compensation repayment boundary

Accepted implementation scope:
- timeline-owned Start may complete one already-existing compensation obligation;
- repayment remains indivisible and deadline-bound;
- one factual continuous rest may complete at most one obligation, even if the ending Start is edited later;
- earliest deadline / oldest source boundary determines priority;
- current-rest debt creation and older-debt repayment remain separate operations;
- the current factual rest cannot immediately complete the debt created at its own Start boundary.

OPEN ITEM carried forward without change:
- Monday Start-field proposal after End Week. Stable v5.2.15 behaviour is a reference only, not a restoration requirement.


## v5.2.20 accepted UX / validation decisions
See `DECISIONS_SINCE_v5.2.19.md` for the canonical record of decisions captured between ZIP checkpoints. v5.2.20 implements only those listed items; Monday Start after End Week remains open and custom work-week boundaries remain future Setup work.


## v5.2.21 — Archive-audited restoration checkpoint

This checkpoint was created only after reviewing the project archive for protected behaviour that had regressed in v5.2.20. The archive is authoritative when an older explicit decision exists and no later explicit decision replaces it.

### Soft archive / hard archive — protected

- Lifecycle: Active week → soft-closed / soft archive → hard/true archive.
- Soft archive is date-aware. Closing a week does not by itself make it hard archive.
- The current pay week and immediately previous pay week remain soft/editable when closed. Future/near-current closed Holiday/Day Off periods also remain soft because plans can change.
- Older genuinely historical weeks use hard archive mode and explicit Unlock/Save Changes protections.
- A correction to a soft-closed week updates the existing closed/archive record; it must not create a duplicate or move the active-week pointer.
- Pay-week membership remains Sunday→Saturday in the current model. Rest chronology is independent of that boundary.

### Weekly-rest proposal ownership — protected

- A qualifying weekly-rest state must remain visible before real Start.
- Work-day Start owns actionable weekly-rest Start proposals.
- 45h regular weekly-rest proposal is shown when available.
- 24h reduced weekly-rest proposal is shown while valid; an obsolete reduced option must not remain visible.
- When the selected day is Day Off and the factual timeline/candidate qualifies for weekly-rest mode, the Rest area explicitly states `Weekly rest in progress` / `Тече седмична почивка` and shows the applicable 45h/24h timing information.
- End Week alone must not manufacture a weekly-rest state when the factual timeline says weekly rest is not due.
- After real Start, proposal information gives way to factual Rest Card information and existing compensation logic.

### Open timing detail — DO NOT GUESS

The archive confirms that a valid 24h proposal is shown and an expired one is hidden, but it does not lock a universal Saturday/Sunday midnight expiry rule. v5.2.21 therefore does not add a new midnight rule. The conservative current rule keeps the reduced option available through the reduced-weekly-rest window and removes it once the 45h regular-rest threshold is reached. If a later approved Setup/work-pattern rule needs a calendar cutoff, that must be decided explicitly before code changes.


## v5.2.21 — Stable QA approval

Heavy QA PASS confirmed `npm ci`, full `npm test`, TypeScript validation and fresh Vite production build. No blocking defects and no source changes were reported. v5.2.21 is promoted to the current stable source/deploy baseline. See `QA_APPROVAL_v5.2.21.md`.
