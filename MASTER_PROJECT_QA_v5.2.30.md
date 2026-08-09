
### v5.2.29 test architecture
`v5-2-29-real-app-browser-regression-test.mjs` launches the actual Vite application in headless Chromium and interacts with the production `src/App.tsx` DOM. It seeds only localStorage fixtures, then verifies the rendered production UI. The test does not define substitute Rest Card or Workflow components. It uses the system Chromium binary and Node built-in CDP/WebSocket support; no new npm testing dependency is introduced.

### v5.2.29 real-application browser acceptance
The v5.2.28 JSDOM replacement-component harness is superseded and removed. v5.2.29 uses a headless Chromium test against the actual Vite-served application and real `src/App.tsx` render path. No recreated `TestCard` or `WorkflowHarness` is accepted as proof. The 45h+ visible label remains `Weekly rest`.
### v5.2.28 clarification — 45h+ text
The accepted 45h+ visible label is **`Weekly rest`**, not `Regular weekly rest`.
The green compliant state and 45h+ threshold carry the regular-weekly-rest meaning.
Tests must not require the literal phrase `Regular weekly rest` unless a later explicit decision changes it.

### v5.2.28 documentation ID correction
The current historical selected-day rule remains `REST-004`.
Any older appendix using the same ID for continuous-shift-across-midnight is historical evidence only and is renamed in this master to `REST-HIST-004` to remove ambiguity.

# DRIVER PAY APP — MASTER PROJECT + QA DOCUMENT
## Consolidated through v5.2.30

**Status:** Authoritative consolidated text reference for source/QA handoff.

### Purpose
This file replaces the growing collection of separate Markdown/TXT handoff, QA, audit, history,
decision, protected-behaviour, validation and release-note documents inside the package.

### Rules for future releases
1. This file is the single human-readable master reference shipped in the ZIP.
2. New QA scenarios, road-test failures, decisions, protected behaviours and release notes are appended here.
3. Executable test scripts remain separate under `scripts/`; they are code, not documentation.
4. Source files and build/configuration files remain separate.
5. Do not re-introduce version-by-version QA/HANDOFF/AUDIT Markdown files into release ZIPs.
6. Historical text below is retained verbatim for traceability; where old text conflicts with a later rule,
   the newest version-specific rule and current protected behaviour take precedence.
7. v5.2.28 physical road-test regressions are mandatory acceptance tests, not optional notes.

### v5.2.28 critical acceptance summary
- Mandatory weekly-rest ownership must survive factual Start entry.
- Under 24h in mandatory weekly-rest context: red `Weekly rest not completed`; never green Daily rest.
- 24h–44h59m factual weekly rest: yellow `Reduced weekly rest` plus exact compensation due.
- 45h+ factual weekly rest: regular weekly rest.
- 45h target/start context must show weekday + time when available.
- Historical selected days without Start are capped at end of that selected day.
- Historical selected days with Start calculate to that factual Start.
- Saturday `Save & Next` opens Week View / End Week; it must not merely refresh Saturday and must not auto-close.
- `Working tomorrow?` remains part of normal End Week even when six-cycle warning is active.
- A direct `Go to current week` route must exist from non-current, non-hard-archive states.
- Daily reduced-rest counters must never take ownership of a mandatory weekly-rest Rest Card.


### v5.2.28 QA acceptance change
A new executable suite `scripts/v5-2-28-render-state-transition-regression-test.mjs` uses a mounted React + JSDOM harness to exercise the previously missed state transitions: mandatory weekly-rest Rest Card ownership at 15h/21h, reduced-weekly-rest compensation boundaries, 45h+ `Weekly rest`, Saturday Save & Next to Week View, six-cycle + `Working tomorrow?`, and `Go to current week`.

This does not replace the physical-phone test. It closes the gap where the official regression suite previously passed only by source-pattern inspection.


### v5.2.30 — portable real-App browser harness correction

v5.2.30 does **not** change `src/App.tsx` or business logic.

It corrects only the mandatory real-App Chromium acceptance runner:

- browser executable is discovered from `CHROME_PATH`, `CHROMIUM_PATH`, PATH, and common installation locations;
- browser spawn failures are surfaced cleanly;
- localStorage fixture setup no longer calls `location.reload()` inside `Runtime.evaluate`;
- reload is executed with CDP `Page.reload` and the test waits for a new default execution context and document readiness;
- the suite still loads the actual Vite entry point and real `src/App.tsx`; no substitute TestCard/WorkflowHarness components are permitted;
- package dependencies are unchanged from the synchronized v5.2.29 lockfile.

The real-App DOM acceptance remains:
15h/21h mandatory weekly rest, exact 24h reduced weekly rest compensation,
Saturday Save & Next → Week Preview, and End Week → Working tomorrow?.


### v5.2.30-r1 — DOMStorage browser-harness correction

This is an **artifact/test revision only**. Runtime application version remains **5.2.30** and `src/App.tsx` is unchanged.

The real-App Chromium acceptance runner was corrected after v5.2.30 Heavy QA showed that the first `Runtime.evaluate` fixture write failed before any DOM snapshot.

Changes:
- localStorage fixtures are now written through Chrome DevTools Protocol `DOMStorage` commands instead of injecting a storage script through `Runtime.evaluate`;
- fixture reload remains a separate CDP `Page.reload` operation;
- the Saturday fixture mutation also uses `DOMStorage`;
- `Runtime.evaluate` exception reporting now preserves the browser exception description and stack frames instead of collapsing the error to `Uncaught`;
- no business logic, UI source, dependencies, package lock dependency tree, compensation logic, archive logic or weekly-rest engine code is changed.

Acceptance remains the real production App path:
15h / 21h / 24h weekly-rest DOM, Saturday Save & Next, and Working tomorrow?.


### v5.2.30-r2 — CDP Runtime.evaluate response-shape correction

This remains an **artifact/test revision only**. Runtime application version stays **5.2.30** and `src/App.tsx` is unchanged.

Heavy QA of r1 identified an exact browser-harness defect:
`cdp()` already returns the Chrome DevTools Protocol response's `result` object, while `evalJS()` incorrectly attempted to read `r.result.result.value`.

r2 corrects that unpacking to:
`r.result?.value`

A small in-test response-shape assertion is included so this exact double-unwrapping regression cannot silently return.

No business logic, UI source, weekly-rest engine, compensation logic, archive logic, dependencies, package-lock dependency tree, or application text has been changed.

Mandatory real-App acceptance is unchanged:
- 15h mandatory weekly rest
- 21h mandatory weekly rest
- 24h reduced weekly rest + compensation
- Saturday Save & Next -> Week Preview
- End Week -> Working tomorrow?

---

# CONSOLIDATED DOCUMENT INDEX

1. `MASTER_PROJECT_REFERENCE.md`
2. `PROTECTED_BEHAVIOURS.md`
3. `QA_HANDOFF_v5.2.27.md`
4. `QA_SUPPLEMENT_v5.2.27_PHYSICAL_FAILURE_REGRESSIONS.md`
5. `CHANGELOG.md`
6. `VERSION_INDEX.md`
7. `NEW_CHAT_HANDOVER.md`
8. `ARCHIVE_AUDIT_v5.2.21.md`
9. `ARCHIVE_AUDIT_v5.2.22.md`
10. `ARCHIVE_AUDIT_v5.2.23.md`
11. `ARCHIVE_AUDIT_v5.2.24.md`
12. `ARCHIVE_AUDIT_v5.2.25.md`
13. `DECISIONS_SINCE_v5.2.19.md`
14. `docs/AI_CONTINUITY_AND_WORKFLOW.md`
15. `docs/ARCHITECTURE_OVERVIEW.md`
16. `docs/BACKLOG_AND_NEXT_WORK.md`
17. `docs/DECISION_LOG.md`
18. `docs/DEV_LOG.md`
19. `docs/PROJECT_HISTORY.md`
20. `docs/QA_HISTORY.md`
21. `docs/RELEASE_AND_QA_WORKFLOW.md`
22. `docs/VERSION_HISTORY.md`
23. `LOCAL_VALIDATION_v5.2.24.md`
24. `LOCAL_VALIDATION_v5.2.25.md`
25. `PACKAGING_CORRECTION_v5.2.22-r1.md`
26. `QA_APPROVAL_v5.2.20.md`
27. `QA_APPROVAL_v5.2.21.md`
28. `QA_BACKUP_RESTORE_REPORT_v5.2.15.md`
29. `QA_CORRECTION_v5.2.23-r2.md`
30. `QA_CORRECTION_v5.2.25-r2.md`
31. `QA_CORRECTION_v5.2.26-r1.md`
32. `QA_DOCUMENTATION_REPORT_v5.2.14.md`
33. `QA_FULL_REPORT_v5.2.13.md`
34. `QA_HANDOFF_v5.2.20_TESTER_CHAT.md`
35. `QA_HANDOFF_v5.2.21_TESTER_CHAT.md`
36. `QA_HANDOFF_v5.2.22_TESTER_CHAT.md`
37. `QA_HANDOFF_v5.2.23_TESTER_CHAT.md`
38. `QA_HANDOFF_v5.2.24_TESTER_CHAT.md`
39. `QA_HANDOFF_v5.2.25_TESTER_CHAT.md`
40. `QA_HANDOFF_v5.2.26.md`
41. `QA_LOCAL_PRECHECK_v5.2.21.md`
42. `QA_LOCAL_PRECHECK_v5.2.22.md`
43. `QA_SOURCE_REPORT_v5.2.16.md`
44. `QA_SOURCE_REPORT_v5.2.17.md`
45. `QA_SOURCE_REPORT_v5.2.18.md`
46. `QA_SOURCE_REPORT_v5.2.19.md`
47. `QA_SOURCE_REPORT_v5.2.20.md`
48. `QA_TIMELINE_COMPENSATION_CREATE_v5.2.17.md`
49. `QA_TIMELINE_COMPENSATION_REPAYMENT_CHRONOLOGY_v5.2.19.md`
50. `QA_TIMELINE_COMPENSATION_REPAYMENT_v5.2.18.md`
51. `QA_v5.2.20_HEAVY_TEST_PLAN.md`
52. `QA_v5.2.21_HEAVY_TEST_PLAN.md`
53. `QA_v5.2.22_HEAVY_TEST_PLAN.md`
54. `QA_v5.2.23_HEAVY_TEST_PLAN.md`
55. `QA_v5.2.24_HEAVY_TEST_PLAN.md`
56. `QA_v5.2.25_HEAVY_TEST_PLAN.md`
57. `QA_WEEKLY_REST_RETEST_HANDOFF.md`
58. `QA_WEEKLY_REST_RETEST_HANDOFF_02.md`
59. `QA_WEEKLY_REST_RETEST_HANDOFF_03.md`
60. `QA_WEEKLY_REST_SOURCE_BASELINE_PASS.md`
61. `QA_WEEKLY_REST_TIMELINE_TEST_PLAN.md`
62. `STABLE_RELEASE_v5.2.21.md`
63. `STABLE_RELEASE_v5.2.22.md`
64. `STABLE_RELEASE_v5.2.25.md`
65. `V5_1_1_PROFILE_APPLY_SAFETY_NOTE.txt`
66. `V5_1_PAY_SETUP_V2_NOTE.txt`
67. `V5_CLEAN_BASE_NOTE.txt`
68. `WORKING_SESSION_2026-08-02.md`

---


# APPENDIX 01 — MASTER_PROJECT_REFERENCE.md

# Driver Pay App — Master Project Reference

**Current documented source checkpoint:** v5.2.24 (QA candidate; v5.2.21 remains last fully stable source baseline; v5.2.22 is the deployed road-test branch before this correction chain)
> **MANDATORY GOVERNANCE:** Before any code or behaviour change, read `PROTECTED_BEHAVIOURS.md` and `NEW_CHAT_HANDOVER.md`. `PROTECTED_BEHAVIOURS.md` is the canonical Master Decision Register. A protected behaviour must not be changed silently; conflicts must be reported to the user before implementation.
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


## v5.2.22 — Road-test regression correction

Physical-phone testing of v5.2.21 exposed two issues missed by source QA: a Friday End Week weekly-rest candidate was discarded on Saturday of the same pay week, and today's Saturday received archive-like styling immediately after a soft close. Archive review confirmed that pre-Start weekly-rest proposals remain the responsibility of the Start area, `Suggested ≠ Saved` remains protected, Day Off may show weekly-rest context informationally, and soft archive is date-aware.

v5.2.22 therefore changes only: (1) stored weekly-rest candidate selection from later-pay-week-only to same-or-later pay week, while retaining factual chronology and due-gate checks; (2) soft-closed archive-like styling only for calendar days already in the past. No special midnight expiry for the 24h proposal is approved.

v5.2.21 remains the last stable baseline until v5.2.22 heavy QA, TypeScript/build and real-device Saturday workflow tests pass.

## v5.2.22 — Deployment / physical-phone confirmation

v5.2.22 passed the supplied heavy source QA, TypeScript validation and fresh Vite production build. The packaging-only r1 correction then passed ZIP/root/version integrity and byte-for-byte source comparison. The exact tested source is now approved for deployment so the remaining real-device Friday End Week → current Saturday workflow can be verified. No Setup changes are included in this release.

## v5.2.24 — Long weekly-rest context

Behavioral QA of v5.2.23-r2 confirmed the End Week architecture for Scenarios 1 and 2 and found one blocking Scenario 3 defect: `getWeeklyRestPlan()` expired context after 72h. v5.2.24 removes arbitrary elapsed-time expiry and consumes the candidate only after a later factual Work Start. This is a focused weekly-rest correction before Setup; no Setup changes are included.

## v5.2.25 — Phone deployment checkpoint

v5.2.25-r2 passed full Heavy QA: complete npm test, TypeScript, fresh production build, WR-001–WR-013, all three End Week behavioral scenarios, and Test/Register/Source alignment. The unchanged runtime source is now packaged for required physical-phone validation. Setup remains deferred until that road test passes.

---


# APPENDIX 02 — PROTECTED_BEHAVIOURS.md

# DRIVER PAY APP — PROTECTED BEHAVIOURS / MASTER DECISION REGISTER

**Status:** CANONICAL PROJECT GOVERNANCE DOCUMENT  
**Register revision:** 1  
**Runtime application version covered:** v5.2.25 source QA branch  
**Historical audit base:** v5.2.16 → v5.2.25, including v5.2.16 pre-weekly-due-gate source and intermediate QA checkpoints v5.2.17–v5.2.19  
**Purpose:** prevent loss of accepted product behaviour, architecture and UX decisions between versions or chats.

---

# RULE 0 — THIS REGISTER IS MORE IMPORTANT THAN A CONVENIENT CODE CHANGE

Before changing any existing behaviour, the developer/AI **must read this file first**.

If a requested or proposed change conflicts with an entry marked `PROTECTED`, `LOCKED`, or `CURRENT ACCEPTED`, do **not** silently change the code.

Required process:

1. Identify the conflicting protected rule by ID.
2. Explain the conflict to the user before implementation.
3. Wait for an explicit decision if the protected behaviour is to change.
4. Update this register first with the new accepted decision and the superseded rule.
5. Then change code.
6. Add or update a regression test that protects the new decision.
7. Update version/change/QA documentation before packaging.

**A release is incomplete if code changes but this register is stale.**

If code and this register disagree, the disagreement is a defect to investigate. Do not assume the code is automatically correct.

---

# 1. AUTHORITY AND EVIDENCE ORDER

When reconstructing behaviour, use this order:

1. **Latest explicit user-approved decision**
2. **This Master Decision Register**
3. **Latest stable/accepted release behaviour confirmed by QA and real-device use**
4. **Older explicit Decision Log / Master Project Reference entries**
5. **Behavioral regression tests**
6. **Stable source implementation**
7. **Intermediate QA/source checkpoints**
8. **Historical inference**

Rules found only in intermediate/non-stable checkpoints are evidence, not automatically law.

If an older rule was explicitly replaced, mark it `SUPERSEDED`.  
If two records conflict and no later explicit decision resolves them, mark `CONFLICT — USER DECISION REQUIRED`.  
If a behaviour clearly predates the oldest available archive, mark origin `PRE-ARCHIVE / UNKNOWN`; never invent an introduction version.

---

# 2. PROJECT GOVERNANCE

## GOV-001 — History before redesign
**Status:** PROTECTED  
**Origin:** documented by v5.2.16; reinforced after v5.2.20–v5.2.24 regressions.

Before changing Rest Engine, Weekly Rest Candidate, Pay Engine, Pay Profiles, Archive, storage, navigation, Setup-boundary logic or protected UI contracts, inspect project history and this register first.

**Reason:** the dominant project regression pattern has been loss of previously accepted decisions, not lack of ideas.

**Regression requirement:** every protected behaviour changed intentionally must have a test or explicit manual scenario.

---

## GOV-002 — Small, versioned changes
**Status:** PROTECTED

Every functional correction gets a new version/subversion. Do not hide unrelated fixes in one version.

Intermediate QA artifact suffixes such as `r1`, `r2` may identify packaging/test revisions while the runtime application version remains unchanged, but a functional source change requires a new runtime version.

---

## GOV-003 — Documentation belongs to the release
**Status:** PROTECTED

Every ZIP must carry enough current documentation for a future chat/developer to continue without relying on chat memory.

Mandatory release continuity files:

- `PROTECTED_BEHAVIOURS.md`
- `NEW_CHAT_HANDOVER.md`
- `MASTER_PROJECT_REFERENCE.md`
- `VERSION_INDEX.md`
- `CHANGELOG.md`
- `docs/DECISION_LOG.md`
- `docs/PROJECT_HISTORY.md`
- `docs/VERSION_HISTORY.md`
- `docs/QA_HISTORY.md`
- `docs/DEV_LOG.md`

The Master Decision Register is the canonical decision source; older logs are supporting history.

---

## GOV-004 — Facts before predictions
**Status:** PROTECTED

The application assists the driver but does not silently decide facts for them.

Suggestions, defaults and proposals must remain distinguishable from accepted historical facts.

---

## GOV-005 — No casual cleanup
**Status:** PROTECTED

Do not remove, rename or simplify unfamiliar logic merely because it appears redundant. Many unusual conditions exist because of real driver workflow and prior regressions.

Prove a path is obsolete before deleting it.

---

# 3. CORE UX CONTRACTS

## UX-001 — Suggested ≠ Saved
**Status:** PROTECTED / LOCKED  
**Origin:** pre-v5.2.16.

Suggested values are proposals until explicitly accepted or handled by an already approved safe workflow.

Examples:
- suggested Start time is not a factual Start;
- suggested Start KM is not historical fact until accepted by the established workflow;
- weekend/off defaults are suggestions until confirmed where applicable;
- weekly-rest 24h/45h proposals never silently write Start.

**Do not change silently.**

---

## UX-002 — Start area = proposals; Rest Card = facts
**Status:** PROTECTED / LOCKED

Before real Start:
- Start area may show calculated future options, proposed times and helpers.

After real Start:
- proposal mode ends;
- Rest Card reports what actually happened.

Do not make the Rest Card a planner and do not duplicate the same regime in both places.

---

## UX-003 — Colour semantics
**Status:** PROTECTED / LOCKED

- Green = compliant / completed / OK
- Yellow = valid but reduced / special / attention
- Red = actual violation/error
- Grey = neutral / suggested / historical visual context
- Split rest may use the accepted green-yellow meaning

Visual polish may adjust appearance, but not semantic meaning without explicit approval.

---

## UX-004 — Current day has priority
**Status:** PROTECTED

The app is primarily a working-day tool. A current/future editable day must not look like hard history merely because a period was closed.

Past completed days may have archive-like visual distinction while remaining editable where the lifecycle is soft.

---

## UX-005 — Do not increase friction without a real benefit
**Status:** PROTECTED DIRECTION

Mobile-first, fast entry, minimal taps and practical driver workflow take priority over theoretical completeness.

---

# 4. DAILY WORKFLOW

## DAY-001 — Work day completion
**Status:** PROTECTED

A Work day is factually completed by real Start + real Finish.

Secondary fields such as kilometres must not define completion.

Empty Finish is not `00:00`; real midnight Finish must remain possible.

---

## DAY-002 — Day types remain reversible while soft-editable
**Status:** PROTECTED

`Work`, `Day Off`, and `Holiday` may be corrected while the day/week is still soft-editable.

A current/future Day Off or Holiday must not become permanently locked merely because it was previously confirmed or because End Week was used.

---

## NAV-001 — Save & Next preserves workflow meaning
**Status:** PROTECTED

Save & Next advances through the real workflow and must not silently skip unresolved work or reinterpret day facts.

A started Work day without real Finish must not be treated as completed merely to allow navigation.

---

# 5. START / FINISH / KILOMETRES

## START-001 — Daily Start suggestions remain proposals
**Status:** PROTECTED

Normal Daily mode:
- 11h may be primary proposal;
- valid 9h reduced option may be secondary when allowed;
- manual/real Start ends suggestion mode.

An unfinished touched Work day blocks searching backward through it for a later Start suggestion.

---

## START-002 — Weekly-rest proposal ownership
**Status:** PROTECTED / CURRENT ACCEPTED

When Weekly Rest candidate mode is active before a factual Start:
- weekly-rest proposals take priority over normal daily 9h/11h suggestions;
- 45h is the primary regular weekly-rest target;
- a valid 24h reduced weekly-rest option is secondary;
- after the 45h endpoint has passed, weekly-rest context remains visible and may show `Weekly rest ended [day/time]`;
- a real Start ends the proposal mode and the factual Rest Card takes over.

**Important:** proposal visibility is not conditional on six completed cycles. See `WR-004`.

---

## KM-001 — Start KM carry-forward
**Status:** PROTECTED

Start KM may be suggested from the previous factual Finish KM.

It remains visually suggested until accepted by the established workflow.

---

## KM-002 — Finish KM accepts the Start KM proposal visually
**Status:** PROTECTED — v5.2.20 decision

When Finish KM is entered, the carried Start KM suggestion becomes visually accepted/dark, including when Start KM equals Finish KM.

The value remains editable.

No automatic mileage fact should be invented.

---

# 6. DAILY REST

## REST-001 — Daily rest boundaries
**Status:** PROTECTED

- 11h = normal daily rest target
- 9h = reduced daily rest boundary where legally available
- reduced-rest usage remains tracked
- a >13h shift affects the next relevant daily-rest context only

Daily warning state must not remain sticky through a long rest, Day Off or Weekly Rest.

---

## REST-002 — Split daily rest
**Status:** PROTECTED

Valid split daily rest does not consume one reduced 9h allowance.

Main UI wording must not imply split rest is invalid or “not counted” in a misleading general sense.

---

## REST-003 — Long rest exits ordinary daily suggestion mode
**Status:** PROTECTED

When the gap has clearly moved into long/weekly-rest territory, stale daily 9h/11h helper warnings must not dominate the UI.

---

# 7. WEEKLY REST — CANONICAL CURRENT MODEL

## WR-001 — End Week starts a Weekly Rest candidate
**Status:** PROTECTED / CURRENT ACCEPTED  
**Latest explicit decision:** 2026-08-09 discussion, aligned with historical pre-due-gate intent.

Pressing `End Week` is an **intent trigger** for Weekly Rest tracking.

It starts/preserves a candidate from the start of the **current continuous rest**, normally the last factual Finish.

It does **not** mean the weekly rest is already legally completed.

If the continuous rest already began before the button press, accrued hours are retained; the timer is not reset at button press.

---

## WR-002 — End Week candidate may later prove not to be weekly rest
**Status:** PROTECTED

If real work resumes before a valid weekly-rest threshold is reached, the candidate is interrupted and the factual rest is classified according to what actually happened.

The app follows reality after the user's intent.

---

## WR-003 — Weekly-rest thresholds
**Status:** PROTECTED

- <24h: not a completed weekly rest
- 24h–44h59m: reduced weekly rest if factually completed by later Start
- 45h+: regular weekly rest

Before factual Start, these are proposal/current-context thresholds, not frozen historical facts.

---

## WR-004 — Six cycles = mandatory warning gate, not candidate visibility gate
**Status:** PROTECTED / CURRENT ACCEPTED  
**Supersedes:** the over-broad v5.2.16 due-gate interpretation and v5.2.21 wording that End Week proposal visibility must be suppressed when fewer than six cycles are due.

Cycle counting exists to prevent a legal infringement.

- Fewer than six cycles **must not suppress** a Weekly Rest candidate explicitly started by End Week.
- Six completed cycles may escalate to mandatory `Weekly rest required` warning behaviour.
- End Week candidate visibility and six-cycle mandatory-warning ownership are separate concerns.

This separation was encoded in v5.2.23+ behavioral scenarios.

---

## WR-005 — Mid-week factual weekly rest resets cycle chronology
**Status:** PROTECTED

A real qualifying weekly rest can occur mid-week without End Week.

Example:
- long factual rest Tuesday→Friday;
- then Friday/Saturday work;
- End Week Saturday starts a new informational candidate from Saturday Finish;
- the earlier factual weekly rest remains the legal cycle anchor;
- End Week does not overwrite that factual anchor.

---

## WR-006 — Pay-week boundary and weekly-rest chronology are separate
**Status:** PROTECTED

Current app/pay week model is Sunday→Saturday.

That boundary controls pay/week/archive workflow.

Weekly-rest chronology follows real Finish→Start events and continuous rest. Crossing Sunday does not reset the weekly-rest candidate or legal cycle by itself.

A future Setup may configure work/pay boundaries, but must not replace factual rest chronology.

---

## WR-007 — Candidate survives long continuous rest
**Status:** PROTECTED — v5.2.24

Elapsed time alone must not destroy a valid End Week candidate.

The old arbitrary 72h expiry is rejected.

A candidate remains available while the same continuous rest is still running.

---

## WR-008 — Factual Start consumes the old candidate
**Status:** PROTECTED — v5.2.24

The first later factual Work Start consumes the candidate for subsequent-day proposal ownership.

The old candidate must not reappear on Monday after a factual Sunday Start.

---

## WR-009 — Candidate freshness
**Status:** PROTECTED — v5.2.25 correction

A stale stored candidate must not hide a newer applicable candidate from the immediate prior rest/work context.

Candidate selection must respect factual recency and chronology.

---

## WR-010 — Weekly Rest must be visibly named
**Status:** PROTECTED / UX CONTRACT

When weekly-rest context owns the current pre-Start rest regime, the UI must visibly identify it as `Weekly Rest` / localized equivalent.

Showing only `Current rest 32h` or `45h+` without the weekly-rest identity is insufficient.

This is a road-test requirement recovered from the older simple UI contract.

---

## WR-011 — 45h / 24h proposals remain visible when applicable
**Status:** PROTECTED

Before real Start:
- show the 45h regular target;
- show the valid 24h reduced option while it remains applicable;
- after 45h, the obsolete reduced option is no longer the active alternative;
- retain useful weekly-rest context such as `Weekly rest ended [day/time]`.

No universal Saturday/Sunday midnight cutoff for the 24h option is currently approved.

**Open only if explicitly revisited:** calendar-based expiry tied to future Setup/work-pattern rules.

---

## WR-012 — Day Off can display Weekly Rest context
**Status:** PROTECTED

Weekly-rest information is not limited to Work day.

A qualifying Day Off may show `Weekly Rest` / `Weekly rest in progress` and applicable 45h/24h information.

Changing `Day Off → Work`:
- must not auto-save Start;
- must preserve/reassign the same weekly-rest proposal to the Start workflow.

---

## WR-013 — Three mandatory real-world End Week scenarios
**Status:** PROTECTED REGRESSION CONTRACT

### Scenario A — Normal week
- normal Mon–Fri (or configured equivalent) work;
- End Week;
- remaining day Off;
- Weekly Rest candidate starts from last Finish;
- 45h primary / valid 24h secondary;
- fewer than six cycles does not create mandatory warning;
- Off→Work before 24h is judged by actual daily-rest legality, not a false weekly-rest violation.

### Scenario B — Mid-week weekly rest + weekend work
- factual 45h+ weekly rest occurs mid-week;
- later work Fri/Sat;
- End Week Sat;
- new informational candidate begins from Sat Finish;
- prior factual weekly rest remains cycle anchor;
- Sunday Off→Work may be legal without false weekly-rest warning if cycle limit is not due.

### Scenario C — Rest already accrued before End Week
- Finish Wed;
- Thu/Fri/Sat Off;
- End Week Sat;
- candidate remains anchored to Wed Finish;
- accrued hours are retained;
- passed 45h endpoint remains visible;
- Sunday factual Start establishes the completed weekly rest;
- candidate is then consumed.

These scenarios must be behaviorally simulated, not merely regex/source-pattern checked.

---

# 8. WEEKLY REST COMPENSATION

## COMP-001 — Separate obligations
**Status:** PROTECTED

Each reduced weekly rest creates its own compensation obligation.

Debt = `45h - actual factual reduced weekly rest`.

Regular 45h+ weekly rest creates no debt.

---

## COMP-002 — Indivisible compensation
**Status:** PROTECTED

No partial repayment.

A 10h debt remains 10h until a qualifying continuous rest fully repays it.

Separate fragments do not combine as partial stored credit.

---

## COMP-003 — Repayment chronology
**Status:** PROTECTED

A repayment rest must begin at or after the debt arose.

A rest that began before the debt existed cannot repay that debt merely because it ended later.

---

## COMP-004 — Deadline / FIFO / one-rest-one-debt
**Status:** PROTECTED

- deadline requirement remains active;
- earliest deadline has priority;
- equal deadlines use older source boundary;
- one factual rest completes no more than one eligible debt;
- same rest cannot be reused;
- timeline/legacy paths must not double-mutate the ledger.

---

# 9. END WEEK / PAY-WEEK WORKFLOW

## EW-001 — End Week closes a pay/work period; not a calendar planner
**Status:** PROTECTED

End Week may:
- close the current pay period;
- handle remaining days using approved workflow;
- seed Weekly Rest candidate intent.

It must not become bulk calendar planning.

Future multi-day Holiday/Day Off planning belongs to a separate calendar/setup feature.

---

## EW-002 — End Week and weekly-rest intent are separate from legal warning
**Status:** PROTECTED

End Week may start weekly-rest tracking even when weekly rest is not yet mandatory.

Do not conflate “I am ending my work week / going to rest” with “the six-cycle legal deadline is now reached.”

---

## EW-003 — Closed/archive correction must not ask `Working tomorrow?`
**Status:** PROTECTED — v5.2.20+

Re-saving/correcting a closed or archived week must not reopen the normal active End Week next-day intent question.

---

## EW-004 — End Week feedback
**Status:** PROTECTED

Existing accepted feedback distinctions:
- new completion: `Week completed.`
- unchanged saved week: `Week already saved. No changes.`
- correction: `Changes saved. Week updated.`

Do not collapse these into ambiguous feedback.

---

# 10. PAY WEEK / CALENDAR / SETUP BOUNDARIES

## WEEK-001 — Current app/pay week is Sunday→Saturday
**Status:** PROTECTED CURRENT MODEL

Sunday is the first app/pay-week day; Saturday is the last.

Sunday is normally Off by default in the current working pattern because Sunday work is uncommon, but it remains changeable to Work.

This app/pay-week model is not the same thing as regulatory weekly-rest chronology.

---

## WEEK-002 — Future Setup may configure work pattern/boundary
**Status:** FUTURE / NOT YET IMPLEMENTED

Setup may eventually define normal working days and/or work/pay boundary.

Any such configuration should drive defaults/suggestions and pay/archive workflow, not rewrite historical factual rest chronology.

Do not hardcode future Setup behaviour into Rest Engine prematurely.

---

# 11. ARCHIVE LIFECYCLE

## ARCH-001 — Active → soft-closed/soft archive → hard archive
**Status:** PROTECTED

Closing a week does not instantly make it immutable historical archive.

Soft archive remains editable.

Hard archive is genuinely historical and uses explicit lock/unlock protection.

---

## ARCH-002 — Date-aware soft archive
**Status:** PROTECTED — restored in v5.2.21

Current/near-current closed periods remain soft/editable.

The current day must not receive archive-like historical styling merely because End Week was used.

Past completed days may use archive-like visual distinction while still editable if they remain soft.

---

## ARCH-003 — Current and immediately previous closed pay weeks
**Status:** CURRENT ACCEPTED BASELINE

The current closed pay week and immediately previous pay week remain soft/editable under the current lifecycle.

Older genuinely historical weeks become hard archives.

If Setup later changes period structure, review this rule explicitly rather than silently extrapolating.

---

## ARCH-004 — Soft archive must provide direct return to current week
**Status:** PROTECTED — v5.2.25 UX recovery

When viewing a non-current soft archive, provide an obvious direct `Go to current week` action.

Soft archive must not become a navigation dead end.

---

## ARCH-005 — Archive correction integrity
**Status:** PROTECTED

Editing a saved week:
- updates the existing archive record;
- does not create a duplicate;
- does not move the active/current week pointer;
- does not run End Week again;
- does not autosave merely from opening/navigation.

---

# 12. BACKUP / RESTORE / STORAGE

## STORE-001 — Complete snapshot
**Status:** PROTECTED

Backup captures complete application state, including current/saved weeks, settings, profiles, archive, weekly-rest candidate and compensation ledger.

---

## STORE-002 — Restore replaces stale destination state
**Status:** PROTECTED

Restore is replacement, not an uncontrolled merge.

---

## STORE-003 — Atomic rollback
**Status:** PROTECTED

Failed restore must leave the previous destination state intact.

---

## STORE-004 — Future cloud is transport, not a separate engine
**Status:** PROTECTED DIRECTION

Future cloud sync must reuse the same state contract.

No cloud-specific Rest/Pay/Archive/Compensation engine.

---

# 13. PAY ENGINE / PAY PROFILES

## PAY-001 — Pay Engine is model-based, not employer-specific
**Status:** PROTECTED

One app, reusable payment models.

Do not create separate company-specific calculation engines.

---

## PAY-002 — Guaranteed hours / overtime
**Status:** PROTECTED

Where a model has guaranteed daily hours, overtime begins after the guaranteed-hours threshold. This is intentional.

---

## PAY-003 — Pay Profile owns tax mode
**Status:** PROTECTED

PAYE Estimate / Gross Only belongs to the active Pay Profile and is restored with it.

---

## PAY-004 — Active profile owns current Settings context
**Status:** PROTECTED

When a profile is active, current Settings represent that profile's working values rather than an independent competing configuration.

---

## PAY-005 — Historical pay must not silently change
**Status:** PROTECTED ARCHITECTURAL DIRECTION

Completed historical periods must preserve the rates/tax/allowance context used when saved.

A later Setup/Profile change must not silently recalculate history.

Exact day-level snapshot architecture remains a separate major project unless already implemented in a later verified branch.

---

# 14. VERSION / RELEASE INTEGRITY

## VER-001 — Single version identity
**Status:** PROTECTED

The following must agree for each runtime release:

- ZIP/release label
- internal root naming
- `package.json`
- lockfile
- `src/version.ts`
- UI/title
- manifest
- service-worker cache identity
- `VERSION_INDEX`
- `CHANGELOG`
- `VERSION_HISTORY`

Packaging-only revision suffixes must be clearly identified as artifact revisions, not runtime-version changes.

---

## VER-002 — Do not promote source QA to installed stable without required checks
**Status:** PROTECTED PROCESS

Where relevant, require:
- ZIP integrity
- full automated suite
- TypeScript
- fresh production build
- behavioral scenario coverage
- physical-phone road test for UI/touch/workflow issues that automated tests cannot prove

A source QA PASS does not override a real-device FAIL.

---

# 15. CURRENT OPEN / UNSETTLED ITEMS

These are **not protected final decisions** yet.

## OPEN-001 — Exact calendar-midnight expiry for 24h proposal
No universal Saturday/Sunday midnight cutoff is approved.

Current accepted behaviour: the valid 24h option remains while applicable and is removed when superseded by the regular 45h state.

Revisit only with explicit Setup/work-pattern design.

---

## OPEN-002 — Future Setup design
Setup is intentionally deferred until a stable, real-device-tested baseline exists.

Before Setup coding:
1. lock the stable baseline;
2. preserve this register;
3. write a Setup plan;
4. identify which protected rules Setup may configure versus which it must never own.

---

## OPEN-003 — Cross-midnight shift architecture
Major project; do not introduce as incidental cleanup.

---

## OPEN-004 — Exact future pay-period/work-pattern configurability
Future Setup scope. Must remain separate from factual rest chronology.

---

# 16. KNOWN SUPERSEDED / CORRECTED DECISIONS

## SUP-001 — End Week proposal suppressed when fewer than six cycles
**Status:** SUPERSEDED

Older v5.2.16/v5.2.21 due-gate wording allowed the factual six-cycle gate to block the End Week weekly-rest proposal.

Current accepted model:
- End Week starts informational weekly-rest candidate;
- six cycles control mandatory-warning escalation only.

Protected by WR-001 and WR-004.

---

## SUP-002 — 72h weekly-rest display expiry
**Status:** SUPERSEDED / DEFECT

The arbitrary 72h cutoff was proven wrong by behavioral Scenario C and removed in v5.2.24.

Candidate lifetime follows factual chronology, not elapsed-display timeout.

---

## SUP-003 — Closing current week instantly creates archive-like current-day visual
**Status:** SUPERSEDED / DEFECT

Soft close must not make today's editable day look historical.

---

# 17. RELEASE AUDIT CHECKLIST — MUST RUN BEFORE EVERY FUTURE RELEASE

Before packaging, answer all of these:

- Did we read `PROTECTED_BEHAVIOURS.md` first?
- Which protected IDs does this change touch?
- Does the change contradict any accepted rule?
- If yes, was the contradiction explicitly approved and recorded?
- Is the code change the smallest possible?
- Is there a behavioral regression test?
- Were unrelated Rest/Pay/Archive/Storage/Navigation paths left alone?
- Are version strings consistent?
- Is documentation updated?
- Does `NEW_CHAT_HANDOVER.md` point to this register?
- Did automated QA pass?
- Is a real-device test required?
- Did a phone road test contradict source QA?
- If so, the phone result wins for the observed UI/workflow defect until explained.

---

# 18. HANDOVER LAW

Every future chat/session working on Driver Pay App must begin with:

1. Read `PROTECTED_BEHAVIOURS.md`.
2. Read `NEW_CHAT_HANDOVER.md`.
3. Confirm exact ZIP/runtime version.
4. Read latest `VERSION_INDEX`, `CHANGELOG`, `QA_HISTORY`.
5. Identify touched protected behaviour IDs.
6. Search older history before changing protected logic.
7. Report any conflict before coding.

**Do not ask the user to reconstruct old decisions from memory if they already exist in the project archive.**

---

# 19. MAINTENANCE RULE FOR THIS REGISTER

After every approved behaviour change:

- keep the old rule in history;
- mark it `SUPERSEDED` rather than deleting it;
- add the replacement rule with date/version/context;
- add the regression test reference;
- update this document before the release ZIP is created.

This register is intended to grow slowly and remain readable.

It is not a changelog.  
It is the project's **behavioral constitution**.

## WR-014 — Six-cycle legal-start deadline is separate from 24h/45h completion targets
The latest legal START of a new weekly rest is six consecutive 24-hour periods after the end of the previous recognized weekly rest. This deadline is distinct from the later 24h and 45h completion targets of the current continuous rest. Sunday 24:00 / Monday 00:00 does not reset uninterrupted rest.

## WR-015 — Weekly-rest proposals show weekday + time
Cross-day weekly-rest proposals must show weekday and time, e.g. `Mon 19:00`, never a bare ambiguous `19:00`.

## WR-016 — Mandatory weekly-rest Rest Card owns the <24h state
When the factual six-cycle weekly-rest path owns the Start decision and factual uninterrupted rest is below 24h, the Rest Card is red and says `Weekly rest not completed`; it must not fall back to `Reduced rest • Left: N`.

## WR-017 — Reduced weekly-rest compensation stays visible
For factual weekly rest from 24h through 44h59m, the Rest Card is yellow `Reduced weekly rest` and displays compensation owed to 45h.

## WR-018 — Weekly Rest block stays concise
Show `Weekly Rest` plus the 45h and 24h Start targets with weekday + time. Do not show the redundant `Weekly rest in progress` line.

## WR-019 — Mandatory weekly-rest ownership survives factual Start
**Status:** PROTECTED — v5.2.27 road-test correction

If the six-cycle/timeline path owns the Start decision, entering a factual Start does not hand the same Finish→Start interval back to daily-rest presentation.

For that interval:
- Start warning remains weekly-rest owned;
- Rest Card remains weekly-rest owned;
- <24h = red `Weekly rest not completed`;
- 24h–44h59m = yellow `Reduced weekly rest` + visible compensation;
- 45h+ = green regular weekly rest;
- the 45h target/anchor remains available for explanatory context.

The stored factual `currentDay.start` is authoritative for factual Rest Card ownership. A presentation-only Start proposal/draft filter must never decide whether a factual rest exists.

## REST-HIST-004 — Historical no-Start rest is measured to the selected day boundary
**Status:** PROTECTED — restored/clarified v5.2.27

For a selected past day with no factual Start, the Rest Card may show the factual rest accumulated from the previous real Finish only up to the end of that selected day. It must not continue counting to the present clock.

The label is `Rest at end of day`, not `Current rest`.

If a factual Start is entered on that historical day, the interval is recalculated to that Start and normal daily/weekly classification applies. The underlying historical duration calculation is protected; only ownership/wording may change as required by the factual regime.

## NAV-002 — Saturday Save & Next advances to End Week workflow
**Status:** PROTECTED — v5.2.27

On Saturday, `Save & Next` saves the day and opens Week View / End Week as the next workflow step. It must not simply refresh the same Saturday, and it must not automatically execute End Week.

## EW-005 — `Working tomorrow?` is independent of the six-cycle warning gate
**Status:** PROTECTED — v5.2.27

For a normal active End Week flow, the `Working tomorrow?` question remains available even when six cycles make weekly rest mandatory. The question records user intent; the legal weekly-rest warning remains a separate factual/legal layer.

The question stays suppressed for re-save/correction of an already closed/archive week, as protected by EW-003.

## ARCH-006 — Direct return to the current week is a navigation invariant
**Status:** PROTECTED — v5.2.27

Whenever a non-current week is selected, an obvious direct `Go to current week` route must be visible. Its visibility must not depend solely on a closed-week bookkeeping flag that may be absent after restore/loading. Hard archive keeps its own protected banner/action; non-hard historical/soft views also get the direct route.

## SUP-004 — Six-cycle state suppresses `Working tomorrow?`
**Status:** SUPERSEDED / ROAD-TEST DEFECT

Older tests tied `Working tomorrow?` visibility to `weeklyRestDueByTimeline === false`. Physical workflow testing showed this mixes user intent with the legal warning gate. v5.2.27 removes that coupling. EW-005 is authoritative.

---


# APPENDIX 03 — QA_HANDOFF_v5.2.27.md

# DRIVER PAY APP v5.2.27 — HEAVY QA HANDOFF

## STATUS
SOURCE-QA candidate. Do not promote directly to phone/stable without full Heavy QA.

## ROOT-CAUSE ANALYSIS — MUST BE VERIFIED, NOT REINTERPRETED

v5.2.26 source QA passed, but physical testing exposed contradictory rendered states. Source review identified the actual contradictions:

1. **Proposal ownership was incorrectly reused as factual ownership.** `timelineWeeklyRestBaseActive` is deliberately false after Start is entered, but `weeklyRestAnchor` was selected through that flag. Result: after factual Start, the same mandatory weekly-rest interval could lose the timeline anchor and its 45h context.
2. **Factual Rest Card ownership used a presentation value.** `displayStartValue` exists to hide/handle visual proposals/drafts. It must not decide whether a factual Start exists. v5.2.27 uses stored `currentDay.start` for factual Rest Card/compensation ownership.
3. **End Week intent was coupled to legality.** `askWorkingTomorrow` explicitly required `weeklyRestDueByTimeline === false`, so the question disappeared at six cycles. v5.2.27 separates intent from legal warning.
4. **Saturday Save & Next self-navigated.** `getAdjacentLogicalIndex()` returns the same Saturday at the end of the week. v5.2.27 saves Saturday and opens Week View/End Week instead.
5. **Go-to-current visibility depended too narrowly on soft-archive bookkeeping.** v5.2.27 shows the direct route on every non-current non-hard-archive week.
6. **Historical rest arithmetic was already correct.** `getRestDisplayEndAbs()` caps a past no-Start day at that day's end. v5.2.27 changes the label to `Rest at end of day`; do not rewrite the duration engine.

## MANDATORY EXACT SCENARIOS

### A — six-cycle mandatory weekly rest, Start 10:00 / 15h factual rest
Expected:
- Start: red `Weekly rest required` with 45h target context including weekday/time when available.
- Rest Card: red `Weekly rest not completed` / `15h 00m`.
- MUST NOT show green `Daily rest`.

### B — six-cycle mandatory weekly rest, Start 16:00 / 21h factual rest
Expected:
- Rest Card: red `Weekly rest not completed` / `21h 00m`.
- MUST NOT show green `Daily rest` or yellow daily `Reduced rest • Left: N`.

### C — factual reduced weekly rest 28h15m
Expected:
- Yellow `Reduced weekly rest` / `28h 15m`.
- `Compensation due: 16h 45m`.
- Colour and duration must remain unchanged from factual arithmetic.

### D — factual reduced weekly rest 39h15m
Expected:
- Yellow `Reduced weekly rest` / `39h 15m`.
- `Compensation due: 5h 45m`.

### E — historical Saturday, no factual Start
Expected:
- Duration measured previous factual Finish → end of selected Saturday, not → now.
- Label `Rest at end of day`, not `Current rest`.

### F — historical Saturday, factual Start entered
Expected:
- Duration recalculates previous factual Finish → entered Saturday Start.
- Correct daily/weekly classification follows that factual interval.

### G — Saturday Save & Next
Expected:
- saves Saturday;
- opens Week View / End Week step;
- does not remain on/refesh Saturday;
- does not automatically execute End Week.

### H — Working tomorrow at six cycles
Expected:
- normal active End Week still asks `Working tomorrow?`;
- six-cycle warning remains separate;
- closed/archive correction does NOT ask the question.

### I — non-current week navigation
Expected:
- visible `Go to current week` on non-current non-hard week even if closed-week bookkeeping is absent/reconstructed differently;
- hard archive keeps its existing banner/action and lock rules.

## FULL REGRESSION
Run ZIP/version integrity, npm ci, complete npm test, npx tsc --noEmit, fresh npm run build, source hashes before/after, WR-001–WR-019, REST-HIST-004, NAV-002, EW-003/EW-005, ARCH-002/004/005/006, compensation creation/repayment, backup/restore, Pay, KM, Save & Next, archive lifecycle.

Do not edit source during QA. Return PASS/FAIL with exact rendered text for scenarios A–I.

---


# APPENDIX 04 — QA_SUPPLEMENT_v5.2.27_PHYSICAL_FAILURE_REGRESSIONS.md

# DRIVER PAY APP v5.2.27 — PHYSICAL FAILURE REGRESSION SUPPLEMENT

This supplement is mandatory in addition to `QA_HANDOFF_v5.2.27.md`.

## Acceptance principle

A source/helper PASS does not override a contradictory rendered state on the real workflow.
The tester must exercise the state transitions, not only call isolated helpers.

## Scenario 1 — 15h mandatory weekly-rest failure

Create a six-cycle/timeline-owned weekly-rest state and enter a factual Start that produces exactly 15h uninterrupted rest.

Expected exact Rest Card:
- `Weekly rest not completed`
- `15h 00m`
- red

Expected Start:
- `Weekly rest required`
- 45h target context with weekday + time when available

Forbidden:
- green `Daily rest`
- yellow `Reduced rest • Left: N`

## Scenario 2 — 21h mandatory weekly-rest failure

Same as Scenario 1, with factual rest exactly 21h.

Expected:
- red `Weekly rest not completed`
- `21h 00m`

Forbidden:
- green `Daily rest`
- any daily reduced-rest counter as Rest Card owner

## Scenario 3 — 28h15m factual reduced weekly rest

Expected:
- yellow `Reduced weekly rest`
- `28h 15m`
- `Compensation due: 16h 45m`

Do not alter the 28h15m arithmetic or yellow colour.

## Scenario 4 — 39h15m factual reduced weekly rest

Expected:
- yellow `Reduced weekly rest`
- `39h 15m`
- `Compensation due: 5h 45m`

## Scenario 5 — historical Saturday without Start

Expected:
- rest duration is capped at end of that selected Saturday
- label: `Rest at end of day`
- it must not continue counting to the real current clock

## Scenario 6 — historical Saturday with Start

Expected:
- rest recalculates from previous factual Finish to that entered Start
- the factual duration remains exact
- weekly/daily classification follows the factual interval

## Scenario 7 — Saturday Save & Next

Expected:
- Saturday is saved
- Week View / End Week step opens
- user remains in control of End Week confirmation
- End Week is NOT auto-executed
- the page must not merely refresh Saturday

## Scenario 8 — Working tomorrow at six cycles

In an active, not-yet-closed week with six-cycle weekly-rest warning active, go through normal End Week.

Expected:
- `Working tomorrow?` is still shown
- six-cycle warning remains separate
- Yes/No intent is accepted normally

Closed/archive correction:
- must NOT ask `Working tomorrow?`

## Scenario 9 — Go to current week

Open any non-current non-hard week.

Expected:
- visible direct `Go to current week`
- must not depend only on a soft-archive closed flag being present

Hard archive:
- existing archive banner/lock behavior remains unchanged

## Scenario 10 — 45h target survives factual Start

In a mandatory timeline-owned weekly-rest state, enter a factual Start below 24h.

Expected:
- Start warning remains weekly-rest owned
- explanatory 45h target remains tied to the same timeline anchor
- Rest Card remains weekly-rest owned
- no fallback to daily ownership after Start

## Mandatory technical QA

Run:
- ZIP integrity
- version integrity
- npm ci
- complete npm test
- npx tsc --noEmit
- fresh npm run build
- source hashes before/after
- all existing WR/compensation/archive/backup regressions
- new `v5-2-27-roadtest-ownership-workflow-regression-test.mjs`

Return PASS/FAIL per scenario with exact rendered text.

Do not modify source during QA.

---


# APPENDIX 05 — CHANGELOG.md

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

## v5.2.26 — weekly-rest road-test corrections
- Weekday + time restored on 45h/24h proposals.
- Redundant `Weekly rest in progress` removed.
- Mandatory weekly-rest <24h Rest Card is red `Weekly rest not completed`.
- Visible reduced-weekly-rest compensation restored.
- Six-cycle latest legal weekly-rest START deadline is calculated separately from 24h/45h completion targets.
- Sunday 24:00 / Monday 00:00 does not reset uninterrupted weekly rest.

### v5.2.26-r1 packaging/version correction
- Corrected `public/sw.js` cache identity from `driver-pay-v5-2-25` to `driver-pay-v5-2-26`.
- No runtime logic or behavioral test changed.

## v5.2.27 — road-test ownership/workflow correction
- Fixed the core contradiction where Start could say `Weekly rest required` while Rest Card fell back to `Daily rest` / `Reduced rest`. Mandatory timeline ownership now survives factual Start.
- Factual Rest Card ownership now uses stored `currentDay.start`, not presentation-only `displayStartValue`.
- Mandatory <24h factual rest renders red `Weekly rest not completed`; 24h–44h59m remains yellow reduced weekly rest with visible compensation; 45h+ remains regular weekly rest.
- Mandatory 45h target remains attached to the same timeline anchor after factual Start.
- Historical no-Start days keep their existing end-of-selected-day duration calculation but are labelled `Rest at end of day`, not `Current rest`.
- Saturday `Save & Next` now saves and opens Week View / End Week; it does not auto-close the week.
- `Working tomorrow?` is no longer suppressed by the six-cycle due state; closed/archive correction suppression remains.
- Direct `Go to current week` is shown for any non-current non-hard-archive week, not only when the soft-archive closed flag is reconstructed.
- No Pay Engine, KM calculation, backup/restore, compensation repayment, Setup, or hard-archive unlock logic is intentionally changed.

---


# APPENDIX 06 — VERSION_INDEX.md

## v5.2.25 — Weekly Rest UI Contract Recovery
**Status:** source QA candidate. Restores the older simple weekly-rest presentation contract on top of v5.2.24 chronology and adds direct current-week return from soft archive.

## v5.2.24 — Long Weekly-Rest Context / Candidate Consumption Fix
**Status:** source QA checkpoint.
**Base:** v5.2.23-r2 behavioral-QA source after Scenario 3 exposed the 72h cutoff defect.
**Scope:** remove the arbitrary 72h weekly-rest display expiry and replace it with factual lifecycle ownership: an End Week candidate remains visible while the same continuous rest is still running, and is consumed by the first later real Work Start. Scenario 1/2 behavior, six-cycle mandatory warning, compensation, Pay Engine, archive and Setup are unchanged.

## v5.2.23 — End Week / Weekly Rest Intent Separation
**Status:** source QA checkpoint, r2 test/documentation correction. Application runtime/source logic remains v5.2.23.
**Scope:** End Week always seeds an informational weekly-rest candidate from the last factual Finish; six-cycle chronology remains the mandatory warning/due gate only. 45h stays primary, valid 24h remains secondary, and Suggested ≠ Saved remains protected.
**QA r2:** documentation identity corrected and the v5.2.23 regression now behaviorally executes the three mandatory real-world scenarios against instrumented functions from the actual `src/App.tsx` source.

## v5.2.22 — Same-pay-week Weekly Rest + Current-Day Visual Regression Fix
**Status:** source QA candidate. Local dependency-free automated regression suite PASS. TypeScript/fresh Vite build require independent environment because local npm mirror cannot provide one transitive package. Physical-phone Saturday workflow test required before install/stable promotion.

Changes: same-pay-week Friday→Saturday candidate continuity; current/future soft-closed day no longer rendered as historical archive; no other functional scope intended.

# Version Index

## v5.2.21 — Soft Archive + Weekly Rest Visibility Restoration
**Base:** v5.2.20 stable road-test source.  
**Status:** **STABLE SOURCE / DEPLOY BASELINE.** Heavy QA PASS; `npm ci`, full automated tests, `npx tsc --noEmit`, and fresh Vite production build all confirmed. No source corrections were made during QA. Physical-phone road test remains recommended for final touch/layout confirmation.  
**Scope:** restore protected soft-archive lifecycle and weekly-rest proposal/context visibility only.  
**Open:** exact calendar-midnight expiry for a 24h reduced proposal is not a locked archived rule and is intentionally not introduced here.


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

## v5.2.22 deployment checkpoint
**Status:** approved for deployment / physical-phone road test. Runtime version remains 5.2.22. Heavy QA, TypeScript, fresh build and corrected packaging integrity all PASS. Remaining confirmation is the real-device Friday End Week → current Saturday workflow.

## v5.2.25 phone deployment checkpoint
**Status:** Source Heavy QA PASS; approved for physical-phone validation. Runtime version remains 5.2.25. Installed stable approval is pending the phone road test.

## v5.2.26
Weekly-rest physical-road-test correction checkpoint; WR-014–WR-018 added.

## v5.2.26-r1
Artifact revision for service-worker/cache version integrity only. Runtime application version remains v5.2.26.

## v5.2.27
**Status:** SOURCE-QA / physical-road-test correction candidate.
Focus: weekly-vs-daily Rest Card ownership after factual Start, historical rest wording, Saturday Save & Next workflow, Working tomorrow intent separation, and robust current-week navigation.

---


# APPENDIX 07 — NEW_CHAT_HANDOVER.md

# DRIVER PAY APP — NEW CHAT HANDOVER

**This file is mandatory reading for every new chat/developer session.**

## STOP — BEFORE TOUCHING CODE

Read in this order:

1. `PROTECTED_BEHAVIOURS.md`
2. `MASTER_PROJECT_REFERENCE.md`
3. `VERSION_INDEX.md`
4. latest section of `CHANGELOG.md`
5. `docs/QA_HISTORY.md`
6. only then inspect the source area you intend to change

## PRIMARY LAW

`PROTECTED_BEHAVIOURS.md` is the canonical Master Decision Register.

Do not silently change a protected behaviour because:
- the current code looks simpler another way;
- an old test seems inconvenient;
- a newer feature appears to conflict;
- the chat does not remember why the rule exists.

If code, tests and the Register disagree:

1. stop;
2. identify the protected rule IDs;
3. inspect project history/source;
4. tell the user exactly what conflicts;
5. do not modify the protected behaviour until the user explicitly resolves the conflict.

## CURRENT DEVELOPMENT GOAL

First achieve a stable, physically tested working baseline with no lost functions or decisions.

Only after that baseline is accepted should Setup development begin.

## CURRENT BRANCH

Runtime application source: **v5.2.25 source-QA line**.

v5.2.25 is an attempted Weekly Rest UI-contract recovery after v5.2.24 passed heavy source QA but failed the real-phone UX expectation by not visibly presenting Weekly Rest / proposals in the actual user workflow.

Do not call v5.2.25 stable until:
- heavy QA passes;
- required physical-phone scenarios pass;
- no protected function is missing.

## CRITICAL RECENT HISTORY

- v5.2.16 contains important stable and pre-due-gate historical source.
- v5.2.17–v5.2.19 are intermediate compensation checkpoints; useful evidence, not automatically authoritative stable baselines.
- v5.2.20 introduced later UX/archive changes.
- v5.2.21 restored date-aware soft archive and weekly-rest visibility after archive audit.
- v5.2.22 corrected same-pay-week/current-day road-test regressions.
- v5.2.23 separated End Week candidate visibility from six-cycle mandatory warning.
- v5.2.24 removed arbitrary 72h candidate expiry and added factual candidate consumption; heavy QA passed.
- Physical-phone testing still showed missing visible Weekly Rest / Start proposal UX and missing direct current-week return from soft archive.
- v5.2.25 is the focused UI-contract recovery branch.

## NEVER LOSE THESE THREE WEEKLY-REST SCENARIOS

See `WR-013` in `PROTECTED_BEHAVIOURS.md`.

They must be behaviorally simulated, not only source-pattern checked.

## SETUP

Do not start Setup redesign in the same version as baseline recovery.

When the stable baseline is accepted, create a separate Setup design plan that references the protected behaviour IDs it may configure and the IDs it must never override.

## DOCUMENTATION DISCIPLINE

A future release ZIP without an updated `PROTECTED_BEHAVIOURS.md` is incomplete.

If a new decision is made in chat:
- add it to the Register in the same version;
- do not rely on chat memory alone.

## v5.2.26
WR-014–WR-018 are protected. Keep legal weekly-rest START deadline, 24h reduced completion and 45h regular completion as separate concepts. Cross-day proposals require weekday + time.

## v5.2.27 critical road-test law
Read WR-019, REST-HIST-004, NAV-002, EW-005 and ARCH-006 before touching Rest Card, End Week or archive navigation. A factual six-cycle weekly-rest interval must never show a daily Rest Card merely because Start has been entered. `Working tomorrow?` records intent and is not a six-cycle legality gate.

---


# APPENDIX 08 — ARCHIVE_AUDIT_v5.2.21.md

# Driver Pay App v5.2.21 — Archive Audit

## Purpose
Before changing v5.2.20, the historical conversation/export and preserved project notes were checked for older protected decisions. The goal is restoration, not redesign.

## Confirmed protected rules restored

### 1. Date-aware soft archive
Historical records explicitly say:
- `Past date alone does not mean hard archive.`
- Current/active and future/near-current closed periods remain soft/editable.
- A preserved v5.1 log states `Soft archive period: 2 weeks, then hard archive.`
- Hard archive is for genuinely historical weeks and keeps explicit archive-edit protections.

Implementation for the current Sunday→Saturday model:
- current week: soft if closed;
- immediately previous week: soft if closed;
- future closed week: soft while not historical;
- older week: hard archive.

### 2. Pay-week boundary is not rest boundary
The pay/archive week remains Sunday→Saturday. Weekly Rest uses factual chronology from real Finish to later real Start and may cross the pay-week boundary.

### 3. Weekly-rest proposal ownership
Archived approved UX says:
- before real Start, show 45h weekly-rest proposal when available;
- show 24h reduced weekly-rest proposal while valid;
- hide an expired 24h proposal;
- once the relevant weekly-rest endpoint has passed, show `Weekly rest ended` with the factual day/time;
- after real Start, Rest Card owns factual completed-rest information.

### 4. End Week does not equal weekly-rest truth
The later factual timeline design supersedes the old assumption that every End Week starts a legal weekly-rest state. If the timeline is known and weekly rest is not due, the weekly-rest proposal must remain suppressed.

## New display restoration in v5.2.21
When the selected Day Off qualifies for weekly-rest mode, the Rest area now shows:
- `Weekly Rest`;
- `Weekly rest in progress` / `Тече седмична почивка`;
- the applicable primary weekly-rest target;
- the valid secondary 24h option when applicable.

No proposal is saved as a real Start.

## Explicit unresolved detail
The archive repeatedly requires `valid 24h proposal shown / expired 24h proposal hidden`, but no final archived decision was found that says the proposal universally expires at Saturday midnight or Sunday→Monday midnight. The user's current recollection was explicitly tentative.

Therefore v5.2.21 does NOT hard-code a midnight rule. The conservative restored behaviour is:
- 24h reduced option may remain visible during the 24h-to-<45h reduced weekly-rest window;
- once 45h regular weekly rest is reached, the reduced option is no longer shown.

Any future calendar-cutoff rule must be approved explicitly before implementation.

## Scope explicitly not changed
- Pay Engine
- Pay Profiles
- tax/pension/bonus calculations
- compensation creation/repayment semantics
- Daily Rest 9h/11h behaviour
- Rest Card green/yellow/red semantics
- Save & Next meaning
- Sunday→Saturday pay-week boundary
- custom Setup work-week architecture

---


# APPENDIX 09 — ARCHIVE_AUDIT_v5.2.22.md

# Driver Pay App v5.2.22 — Archive Audit Before Change

Date: 2026-08-08

## Reason for this checkpoint

Physical-phone road testing of v5.2.21 found two regressions that automated QA had not reproduced:

1. A weekly-rest candidate created by End Week on Friday was not visible on Saturday of the same Sunday→Saturday pay week.
2. The current Saturday was rendered with archive-like styling immediately after the week had been soft-closed, although the calendar day was still current and editable.

## Archive decisions confirmed before coding

Protected historical decisions were checked before changing source:

- Start Card / Start field owns weekly-rest proposals before a factual Start.
- When applicable, this includes the 45h weekly-rest proposal and valid 24h reduced weekly-rest proposal.
- `Weekly rest ended [day/time]` remains pre-Start information after the relevant endpoint has passed.
- Suggested is not Saved. Weekly-rest proposals must not silently become `day.start` merely because Day Off is changed to Work.
- Day Off may display weekly-rest context while remaining informational only.
- End Week is a closing workflow; factual timeline/due-gate rules remain authoritative and End Week alone must not manufacture a weekly-rest requirement.
- Pay-week membership remains Sunday→Saturday: Saturday belongs to the week ending that Saturday; Sunday belongs to the following pay week.
- Soft archive is date-aware and remains editable. A current/future calendar day must not look like a historical hard archive merely because the pay week has been closed.
- Exact Saturday/Sunday midnight expiry for the 24h reduced proposal remains OPEN. No new midnight cutoff is introduced here.

## Root cause found in source

### Same-pay-week weekly-rest candidate loss

`getWeeklyRestCandidateForSelectedWeek()` accepted the stored candidate only when:

`selectedSaturdayISO > stored.closingSaturdayISO`

This discarded a Friday-created candidate while the user was still viewing Saturday of the same pay week, because both use the same closing Saturday ISO date.

The later chronology check already safely verifies that the selected day is actually after the factual Finish. The strict `>` comparison therefore removed the candidate too early.

### Current-day archive-like styling

v5.2.21 defined:

`archiveLikeVisual = archiveMode || softArchiveMode || pastSavedDayVisual`

This made every soft-closed day look archived, including today's Saturday. That mixed two separate decisions: editable soft close and visual treatment of genuinely past saved days.

## Conservative v5.2.22 correction

Only two functional source changes are intended:

1. Stored weekly-rest candidate remains available when the selected pay week is the same closing Saturday or a later week (`>=`). Existing factual chronology and due-gate checks still decide whether it may actually drive display/Start proposals.
2. Soft-close archive-like styling is applied only when the selected calendar day is already in the past. Today/future remain normal active styling. Hard archive and past-saved-day styling remain unchanged.

No Pay Engine, compensation formula, storage migration, Rest Card colour semantics, End Week intent flow, Save & Next meaning, KM logic, profile logic, or accepted text is changed.

---


# APPENDIX 10 — ARCHIVE_AUDIT_v5.2.23.md

# Driver Pay App v5.2.23 — End Week / Weekly Rest Archive Audit

## Recovered protected logic
Archive review before coding recovered these decisions:

- End Week is a closing workflow, not a planner.
- End Week seeds weekly-rest tracking from the last real Finish.
- Suggested values remain suggestions until accepted; `Suggested ≠ Saved`.
- A candidate is intent, not proof of completed weekly rest. If work resumes before 24h, normal daily/long-rest logic applies.
- A factual 24h+ mid-week rest is recognized from chronology without needing End Week.
- Six completed work cycles are a due/warning guard. They are not a prerequisite for showing the weekly-rest candidate the driver explicitly started with End Week.
- Pay week remains Sunday → Saturday, while rest chronology continues across the pay boundary.
- Current/future Off days remain soft-editable because plans can change.

## Conflict found in v5.2.22
The factual six-cycle due gate had also become a proposal-visibility gate. That changed the meaning from “weekly rest is not mandatory yet” into “do not show the End Week weekly-rest candidate”. This contradicted the older candidate design.

## v5.2.23 reconciliation
- End Week candidate path = informational proposal/tracking path, always based on the last real Finish.
- Timeline due path = mandatory warning/violation path, based on factual chronology and the six-cycle boundary.
- The due path may escalate warnings but does not suppress the End Week candidate.

## Mandatory real-world scenarios

### 1. Normal week
Monday–Friday/Saturday work → End Week → rest.
Expected: Weekly Rest context plus 45h primary and valid 24h secondary proposal even if fewer than six factual cycles have elapsed.

### 2. Mid-week weekly rest, then weekend work
Long factual rest Tuesday–Thursday → work Friday/Saturday → End Week Saturday → Sunday Off → Work.
Expected: earlier factual rest remains the cycle anchor; End Week still starts a new informational candidate from Saturday Finish; early Sunday work is judged by normal daily-rest legality if the new candidate has not reached 24h.

### 3. Rest already running before End Week
Last work finishes Wednesday → rest Thursday/Friday/Saturday → End Week Saturday.
Expected: candidate anchor remains Wednesday Finish; accrued hours are retained; the counter does not restart at the button press; if the 45h endpoint is already past, existing `Weekly rest ended [day/time]` context is used.

## Protected areas not changed
Pay Engine, Save & Next, archive duplicate protection, soft/hard archive rules, compensation chronology, Rest Card colour semantics, KM logic, backup/restore, and Setup.

---


# APPENDIX 11 — ARCHIVE_AUDIT_v5.2.24.md

# Driver Pay App v5.2.24 — Archive/QA correction note

## Trigger
v5.2.23-r2 behavioral QA: Scenario 1 PASS, Scenario 2 PASS, Scenario 3 FAIL. The failure was caused by `getWeeklyRestPlan()` returning null after `anchor.finishAbs + 72h`.

## Accepted prior logic preserved
- End Week starts an informational weekly-rest candidate from the last factual Finish.
- Six cycles are warning/due logic, not proposal visibility.
- 45h primary and valid 24h reduced secondary proposal remain.
- Suggested ≠ Saved.
- A real Start establishes the factual endpoint.

## v5.2.24 correction
- Remove arbitrary 72h candidate display expiry.
- Keep long continuous rest context available until a later factual Work Start.
- After a factual Start, prevent the old End Week candidate from reappearing on subsequent days.

## Out of scope
No Pay Engine, compensation formula, archive semantics, Setup, KM, Save & Next or visual redesign.

---


# APPENDIX 12 — ARCHIVE_AUDIT_v5.2.25.md

# Driver Pay App v5.2.25 — v5.2.16 UX Recovery Audit

## Compared sources
- v5.2.16 `src/App.tsx.before-weekly-due-gate`
- v5.2.16 stable `src/App.tsx`
- v5.2.24 Heavy-QA/road-test source

## Findings
1. The old weekly-rest UI contract is still recognizable: Start owns 45h/24h proposals before factual Start; Rest Card owns facts after Start.
2. v5.2.24 rendered the Work-day weekly card only when `plan.helper` was non-empty. After the 45h target passed, the plan remained valid but `helper` became empty, so the entire weekly-rest card disappeared.
3. Candidate storage is single-value. A stale older stored End Week candidate could be preferred over the immediate previous pay-week backfill, suppressing the expected current weekend proposal after upgrades/history changes.
4. Hard archive retained `Go to current week`, but soft archive had no equivalent direct return action on the day screen.

## v5.2.25 adaptation
- Prefer the newest applicable candidate between stored state and immediate previous-week factual backfill.
- Render the Work-day Weekly Rest card whenever a weekly-rest plan exists, not only while the 24h helper is non-empty.
- Preserve the existing Start-field 45h target / 24h alternative / `Weekly rest ended` lifecycle.
- Restore a direct `Go to current week` button when viewing a non-current soft archive.
- Do not alter six-cycle warning, compensation, Pay Engine, backup, archive locking, or current-day visual rules.

---


# APPENDIX 13 — DECISIONS_SINCE_v5.2.19.md

# Decisions captured after v5.2.19

This file prevents decisions made between ZIP checkpoints from being lost.

## Implemented in v5.2.20
1. Weekly-rest Start errors reuse the existing red Start-field violation presentation. Existing old texts and logic are not renamed/reworked. New English reasons are `Weekly rest required` and `Weekly rest not completed` only where the corresponding weekly validation context applies.
2. The Rest Card three-colour system is not changed.
3. Re-ending an already archived/closed week must never ask `Working tomorrow?`. Existing feedback text is preserved but made larger and shown longer.
4. A carried/suggested Start km is grey only while still a suggestion. Once Finish km is entered, Start km is visually accepted/dark but remains editable, including when Finish km equals Start km.
5. After Save & Next, navigating back to a completed earlier day in the active week should make the whole screen visually archive-like, but the day remains an editable active-week record. True archive lock/banner logic is not applied to this visual-only state.

## Explicitly still open / not changed
- Monday Start proposal after End Week. v5.2.15 behaviour was inspected only as reference. Do not restore or change it until separately discussed.
- Custom End Week day / custom work-week pattern belongs to future Setup work.

---


# APPENDIX 14 — docs/AI_CONTINUITY_AND_WORKFLOW.md

# AI Continuity and Development Workflow

## Purpose

This document tells a future AI or developer how to continue the Driver Pay App without reopening settled discussions or redesigning accepted behaviour.

## Session startup

1. Confirm the exact uploaded ZIP and its actual version. Never assume the latest remembered version is the uploaded one.
2. Inspect ZIP integrity and project structure.
3. Read the continuity documents in the order listed in `MASTER_PROJECT_REFERENCE.md`.
4. Identify the affected module and search project history for earlier decisions.
5. Compare the requested change against locked boundaries.
6. State the intended scope and explicit non-scope before editing.
7. Preserve a copy or hash of sensitive source files before modification.

## Change classification

### Documentation-only

Examples: continuity files, decision records, release history, QA notes. No functional source change. Version metadata may still advance to keep release identity consistent.

Required checks:
- ZIP integrity
- version consistency
- source hash comparison
- documentation presence and cross-reference review

### Small/local change

Examples: wording, helper text, one local visual state, narrow regression repair.

Required checks:
- targeted source review
- TypeScript validation
- production build
- affected manual scenarios
- source diff proving no unrelated change

### Major/risky change

Examples: Rest Engine, Pay Engine, snapshots, archive, storage migration, backup/restore, weekly compensation or profile lifecycle.

Required checks:
- written design and accepted behaviour first
- migration/backward-compatibility plan
- focused unit/static checks where available
- full regression suite
- representative existing-data fixture
- realistic week scenario
- PWA/storage reload checks

## Editing rules

- Make the smallest change that solves the proven problem.
- Do not combine independent fixes in one version.
- Do not rename, move or visually redesign unrelated controls.
- Do not “clean up” unfamiliar logic without first proving it is unused or defective.
- Preserve old-data compatibility unless an explicit migration is approved.
- Do not treat a user-visible proposal as saved data.
- Do not let documentation claims exceed completed tests.

## Version workflow

1. Choose the next unused version number.
2. Update the package version as the single source of version identity.
3. Run the version-sync process so UI/title/manifest/service-worker references match.
4. Update release documents.
5. Rebuild output where applicable.
6. Confirm every version string matches.
7. Name the final ZIP with the same version and a clear release label.

Every fix or release purpose gets its own version. Never reuse a number or hide multiple independent fixes under one version.

## Documentation workflow

For every release, record:

- exact base version
- problem or purpose
- root cause, when applicable
- accepted behaviour
- files changed
- explicit non-scope
- validation performed
- limitations or blocked tests
- rollback/base reference

Update existing documents rather than replacing their history. Add a new file only when it has a distinct permanent role.

## Handover standard

The final ZIP must be understandable without access to the original chat. A future AI should be able to determine:

- what the app is for
- which version is the base
- which behaviours are locked
- what changed recently
- what remains open
- what must be tested
- which areas must not be touched casually

## User collaboration style

The user prefers small portions, direct language and practical choices. Do not repeatedly ask them to reconfirm settled project governance. Present the next sensible action and keep architecture discussions separate from small fixes.

---


# APPENDIX 15 — docs/ARCHITECTURE_OVERVIEW.md

# Driver Pay App — Architecture Overview

## Product layers

### Application shell / PWA

Responsible for startup, install/update behaviour, manifest, service worker, cache identity, responsive mobile layout and local persistence. A PWA change can affect installed users even when business logic is unchanged, so cache/version consistency is mandatory.

### Day state

Stores the working record for each date: day type, Start, Finish, kilometres, extras, pay context and completion state. Suggestions must not be confused with stored Start values.

### Rest Engine

Calculates factual rest context from real Finish/Start data and tracks reduced daily rest, weekly rest candidates and compensation obligations. It must not depend on employer pay policy.

### Pay Engine

Calculates earnings from the saved day and the active/snapshotted payment model. It must not decide legal rest compliance.

### Pay Profiles / Settings

Profiles are reusable configurations. Settings are the current working values. An active profile owns the Settings context. Historical calculations need snapshots so future profile edits cannot rewrite the past.

### Week and Archive

The active week is editable working state. End Week closes the pay period and stores history. Archive navigation must restore the correct week and pay-profile context without turning old records into live settings.

### Persistence and backup

LocalStorage is the current persistence base. Backup v2 exports a complete snapshot. Any future storage migration must preserve existing user data and provide rollback or safe fallback.

## Key data-flow boundaries

1. **Finish → next Rest context**: Rest calculations begin from the real previous Finish.
2. **Suggestion → acceptance**: helper values remain transient until accepted.
3. **Profile → Settings**: loading/applying a profile sets working pay values.
4. **Settings → saved day snapshot**: the historical record should preserve the exact applied context.
5. **Active week → Archive**: End Week stores a stable record and begins weekly-rest handling.
6. **State → Backup**: complete storage snapshot is exported; restore is atomic.

## Areas currently concentrated in `src/App.tsx`

The current application contains substantial UI, state and engine logic in one large file. Do not perform broad refactoring merely for cleanliness. Any future extraction should be its own planned architecture release with behaviour-preserving regression proof.

## Compatibility rule

New fields must be optional or safely sanitised for old data unless a migration is explicitly designed. Never assume every existing user record contains the latest shape.

---


# APPENDIX 16 — docs/BACKLOG_AND_NEXT_WORK.md

# Backlog and Next Work

This is a planning reference, not permission to implement everything listed. Each major item requires a separate review and version.

## Suitable small/local work

- Review `Split Break` / `Week Active` wording for clarity without changing Split Rest logic.
- Verify Start helper wording and previous-calendar-day visibility in real use.
- Remove isolated visual noise only after confirming saved/completed-state meaning remains clear.
- Small feedback/message corrections with no engine or storage impact.

## Next major architectural candidate

### Day-level Pay Snapshot

Goal: completed days preserve exact pay configuration and results after later profile/Settings changes.

Must include:
- rates/model/tax mode/allowances snapshot
- day-to-profile association
- scope for applying a new profile from next day or selected date
- old data compatibility
- archive behaviour
- weekly totals based on saved day context
- backup/restore coverage

Do not implement as a quick patch.

## Other major future work

### Cross-midnight shifts

Continuous shift until real Finish; rest begins at real Finish. Pay attribution must support different policies and remain separate from Rest Engine.

### Pay Setup v2 completion

Draft → Preview → Save/Confirm, no accidental autosave, optional Pay Setup mode, clearer profile create/update flow, and correct application scope.

### Weekly rest continuation

Preserve legal/regulatory calculation separately from tachograph calendar-week presentation. Review explicit cross-week attribution and longer-term ledger presentation before changing the locked compensation rules.

### Work patterns / custom boundaries

4-on/4-off, custom End Week boundaries and variable patterns remain separate from the current standard workflow.

### Other projects

`Where Is My Money`, revision/stock app and traffic-office checker are separate products or modules. They must not be casually merged into Driver Pay App.

---


# APPENDIX 17 — docs/DECISION_LOG.md

## v5.2.25 protected UI contract
- Weekly Rest mode must be visibly named whenever an End Week/timeline weekly-rest plan owns the pre-Start UI.
- 45h remains primary; valid 24h remains secondary; after 45h the context does not disappear merely because the secondary helper is empty.
- Newer factual/candidate context wins over stale older stored candidate state.
- Soft archive must provide a direct route back to the current week.

## Locked — Backup/Restore and future cloud sync

- Backup/Restore transfers the complete application state between devices.
- Restore replaces destination state rather than merging stale data.
- Historical facts are restored from the backup; derived/live values may be recalculated only when safe and unambiguous.
- Restore failure must roll back atomically.
- Future cloud sync must reuse the same state contract and restore/recalculation rules; cloud is transport only.
- No separate cloud-specific Rest, Pay, Archive or Compensation logic.

# Driver Pay App — Decision Log

This file records accepted decisions that must be checked before changing behaviour. Later entries may clarify an earlier decision, but accepted rules are not silently discarded.

## GOV-001 — One app, model-based architecture

**Status:** LOCKED  
**Decision:** Maintain one application. Future commercial separation is Core plus optional Professional unlock, not separate employer-specific apps. Pay logic uses reusable payment models rather than company engines.

## GOV-002 — Small, versioned changes

**Status:** LOCKED  
**Decision:** Every fix receives its own version or subversion. Independent changes are not bundled under one version. Version numbers are primary release identifiers.

## GOV-003 — Documentation belongs to the release

**Status:** LOCKED  
**Decision:** Documentation is maintained by the development process and included in every release ZIP. It must be detailed enough for AI continuity. It is updated after every affected change and before packaging.

## GOV-004 — History before redesign

**Status:** LOCKED  
**Decision:** Before proposing changes to Rest Engine, Pay Engine, Pay Profiles, Archive or storage, search project history and restore accepted behaviour where possible. Do not reinvent settled solutions.

## UX-001 — Suggested is not saved

**Status:** LOCKED  
**Decision:** Suggestions and helpers remain proposals until explicitly accepted or handled by an already approved safe workflow. They must not silently become stored historical facts.

## UX-002 — Start proposals, Rest facts

**Status:** LOCKED  
**Decision:** Start area contains planning/suggestions. Rest Card contains factual elapsed or completed rest information. Do not duplicate one regime in both areas.

## UX-003 — Colour semantics

**Status:** LOCKED  
**Decision:** Green = compliant/complete; yellow = reduced/attention before infringement; red = actual violation/error; grey = neutral/suggested. Split rest may use the accepted green-yellow meaning.

## REST-001 — Daily rest boundaries

**Status:** LOCKED  
**Decision:** 11h is normal daily rest; 9h is reduced daily rest where available. A >13h shift affects the next daily-rest context but must not persist as a sticky warning through long rest, Day Off or End Week.

## REST-002 — Split daily rest

**Status:** LOCKED  
**Decision:** A valid split daily rest does not consume one of the reduced 9h daily-rest allowances. Any wording change must preserve this meaning.

## REST-003 — Weekly rest priority

**Status:** LOCKED  
**Decision:** Once Weekly Rest Candidate is active, weekly-rest mode overrides normal daily 9h/11h suggestions until resolved. Only one active rest regime is shown.

## REST-HIST-004 — Continuous shift across midnight

**Status:** FUTURE MAJOR PROJECT  
**Decision:** Cross-midnight shifts are not a small bug fix. Future architecture must keep the shift continuous until real Finish; daily rest starts from that Finish. Rest Engine remains independent from Pay Engine, and pay attribution may vary by company/model.

## REST-005 — Regulatory week vs calendar display

**Status:** LOCKED DIRECTION  
**Decision:** Monday–Sunday tachograph presentation is a data boundary, not automatically a legal violation. Regulatory calculation may use rolling 6×24-hour logic and must not flag a breach solely because the display week changed.

## COMP-001 — Indivisible weekly-rest compensation

**Status:** LOCKED  
**Decision:** Each obligation is separate. Compensation is indivisible, partial periods do not reduce it, partial rests are not combined, and completion follows FIFO using a qualifying continuous rest within the deadline.

## PAY-001 — Guaranteed hours and overtime

**Status:** LOCKED  
**Decision:** In a model with guaranteed daily hours, overtime begins after the guaranteed hours. This behaviour is intentional and must not be classified as a defect.

## PAY-002 — Profiles own tax mode

**Status:** LOCKED  
**Decision:** PAYE Estimate/Gross Only is stored in and restored from the Pay Profile. It is not a temporary global preference.

## PAY-003 — Active profile owns Settings context

**Status:** LOCKED  
**Decision:** When a Pay Profile is active, Settings are its current working values. Updating the profile updates active Settings. Payer and client should be visible together, for example `ARC → Turners`.

## PAY-004 — Historical pay stability

**Status:** REQUIRED ARCHITECTURAL DIRECTION  
**Decision:** Completed days must preserve the rates, tax mode, allowances and calculation context used when saved. A later profile update must not silently recalculate them. Full day-level snapshot implementation remains a separate major task.

## ARCHIVE-001 — Soft edit vs hard history

**Status:** LOCKED  
**Decision:** Current editable data and archived records are different states. Archive editing saves only the selected record. Repeated End Week must not rewrite an unchanged saved week.

## STORAGE-001 — Complete backup snapshot

**Status:** LOCKED CURRENT BEHAVIOUR  
**Decision:** Backup v2 captures the complete localStorage state. Restore replaces it atomically, supports old v1 backups, and uses rollback protection if restore fails.

## VERSION-001 — Single version identity

**Status:** LOCKED  
**Decision:** Package, lockfile, generated UI version, title, manifest, service-worker cache, release documents, output and ZIP filename must report the same release version.


## v5.2.21 protected decisions confirmed by QA
- Date-aware lifecycle remains Active → soft-closed/soft archive → hard archive.
- Current and immediately previous closed pay weeks remain soft/editable; genuinely older historical weeks use hard archive protection.
- Qualifying Day Off keeps weekly-rest context visible before factual Start, including the applicable 45h target and valid 24h reduced option.
- The reduced 24h option remains valid through 44h59m and is removed at 45h. No Saturday/Sunday midnight cutoff is approved.
- End Week alone does not manufacture weekly-rest due state.


## v5.2.22 protected correction
- Friday End Week candidate may remain addressable on Saturday of the same Sunday→Saturday pay week; factual chronology/due gate still control eligibility.
- Day Off may display weekly-rest proposal context without writing Start.
- Day Off → Work does not auto-save a weekly proposal.
- Current/future soft-closed day is not visually historical solely because End Week was pressed.
- No new 24h midnight cutoff is approved.

## v5.2.23 — End Week vs cycle-counter ownership
- End Week always begins weekly-rest candidate tracking from the last real Finish of the closing pay period.
- Candidate tracking is intent/workflow state, not proof that weekly rest has completed.
- Six completed factual work cycles are a due/warning guard only; fewer cycles must not hide an End Week candidate.
- If work resumes before 24h, normal daily-rest rules apply and no weekly-rest debt/violation is invented solely from End Week.
- A factual 24h+ mid-week weekly rest remains a chronology anchor independently of End Week.
- Pay week remains Sunday→Saturday; factual rest chronology continues independently across pay-week boundaries.
## REST-024 — End Week candidate lifetime is factual, not time-limited
**Status:** LOCKED
**Decision:** An End Week weekly-rest candidate starts from the current continuous-rest anchor (last factual Finish) and remains available for the full uninterrupted rest. It must not expire merely because 72h or another arbitrary display duration has passed. The first later real Work Start consumes that candidate for subsequent days. Six-cycle chronology remains a separate mandatory warning/due mechanism.

## GOV-005 — Master Decision Register is canonical
**Status:** LOCKED
**Decision:** `PROTECTED_BEHAVIOURS.md` is the canonical behavioural constitution. Every future session reads it before code. Conflicts with protected rules are reported before implementation. Approved changes update the Register first, then code and regression tests.

---


# APPENDIX 18 — docs/DEV_LOG.md

## v5.2.25
Targeted UX/source recovery only: candidate freshness, weekly-rest card render ownership, and soft-archive current-week return. No Setup work.

## v5.2.15 — Backup/Restore Round-Trip QA Foundation

- Base: v5.2.14 documentation continuity foundation.
- Added isolated automated QA for complete Backup → Restore state transfer.
- The test verifies that a backup from one device replaces the second device's local state and produces an identical complete storage snapshot.
- The test covers current week data, saved weeks, settings, archive, pay profiles, active profile, weekly-rest candidate, closed weeks, language and weekly-compensation ledger.
- Added an atomic rollback test: a failed restore must leave the pre-existing local state unchanged.
- Added production-source guards confirming that the current version-2 backup still exports the complete localStorage snapshot and restores it before reload.
- No application UI, user-facing text, Rest Engine, Pay Engine, Archive, navigation, layout, colour, calculation or production behaviour changed.

## v5.2.14 — Documentation Continuity Foundation

- Established the permanent AI-readable project reference and release workflow.
- Consolidated locked architecture and behaviour decisions without changing application logic.
- Added explicit startup order, change classification, QA levels and future backlog boundaries.
- Application source remains unchanged from v5.2.13.

## v5.2.13 — QA TypeScript Validation Fix

- Full QA found 14 TS1117 duplicate-property errors in the English `UI_TEXT` object.
- Root cause: repeated pay/tax translation entries accumulated on one source line; JavaScript used the final values, but strict TypeScript validation rejected the object.
- Removed only shadowed duplicate entries and retained the previously effective values.
- No application logic or visual output changed.

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

# Driver Pay App — Dev Log

## v5.2.2 — Safe Rest UX clarification

CHANGE:
Clarified the source label under the Start suggestion.

DETAIL:
- 11h-based Start suggestions display `from 11h rest`.
- 9h-based Start suggestions display `from 9h rest`.
- `11h rest unavailable` remains a separate explanation below the field when relevant.

BOUNDARY:
This is text/UI only. No Rest Engine, Start calculation, reduced rest, split break, weekly rest, 72h, End Week, Archive, or Pay Engine logic was changed.

BACKLOG:
Split Break / Week Active UX review later. No Split Break behaviour changes in this build.

QA FOCUS:
Confirm the 9h helper remains visible even when the 9h boundary is on the previous calendar day. Confirm all suggested Start times are unchanged from v5.1.11.


## v5.1.2 — Gross Only visible mode

CHANGE:
Added a Gross Only / PAYE Estimate mode indicator and setting.

WHY:
The app is currently used for agency/LTD-style gross pay checking while Pay Setup v2 and snapshots are still being rebuilt. The user must clearly see whether preview numbers are gross-only or PAYE estimates.

IMPORTANT:
This is a small usability patch on v5.1.1. It does not fix the deeper profile/snapshot problem.

DO NOT ASSUME:
Gross Only solves historical recalculation. Day-level pay snapshots are still required.

NEXT ARCHITECTURE FIX:
Day pay snapshot + Quick Setup profile/apply flow.


## v5.1.3 — Gross Only toggle visibility fix

PROBLEM:
v5.1.2 added Gross Only logic/indicator but the switch was not visible enough.

FIX:
Added a clear two-button PAYE Estimate / Gross Only toggle at the top of Settings.

WHY:
The user must clearly control whether preview/pay values include estimated Tax/NI/Pension or show gross-only values.

LIMITATION:
This still does not fix profile/snapshot recalculation. Day-level snapshot remains the next architecture fix.


## v5.1.4 — Clear active Gross Only toggle

PROBLEM:
The PAYE/Gross Only buttons did not clearly show which mode was active after tapping.

FIX:
Active button now uses a clear dark selected state, a ✓ marker, aria-pressed, and a visible Current mode line.

WHY:
Mode selection affects whether preview values are gross-only or PAYE estimates. The user must not guess whether the tap worked.


## v5.1.5 — Gross Only select fixed from v5.1.4

PROBLEM:
The two-button PAYE/Gross Only toggle was unclear and could appear not to switch.

FIX:
Replaced it with a simple select/dropdown:
- PAYE Estimate
- Gross Only

Gross Only now also changes the calculation:
- Tax = 0
- NI = 0
- daily/weekly net = gross

WHY:
The user must be able to clearly select whether values are PAYE estimates or gross-only figures.

LIMITATION:
This does not fix profile/snapshot architecture.


## v5.1.6 — Gross Only select state fix

PROBLEM:
In v5.1.5 the Pay calculation mode select could show options but remain stuck on PAYE Estimate.

FIX:
- grossOnly is explicitly preserved by sanitizeSettings.
- Select uses functional setSettings update.
- Gross Only remains visible as the selected dropdown value.
- Gross Only is real calculation mode: Tax = 0, NI = 0, daily/weekly net = gross.

WHY:
The selected mode must remain visible and must affect the calculation. This is not just a visual setting.

LIMITATION:
This still does not fix the separate profile/snapshot architecture issue.


## v5.1.7 — Restore 9h helper visibility

PROBLEM:
The 9h reduced-rest helper could disappear when the 9h boundary was on the previous calendar day.

CAUSE:
The helper was filtered with isSameLocalDayAbs(...), so boundaries like Tue 23:40 were hidden when viewing Wednesday.

FIX:
Keep the 11h suggestion restricted to the current day as the main Start-field suggestion.
Keep the 9h reduced-rest boundary visible as a helper when it is available, even if it is in the previous calendar day.

WHY:
The user may enter the actual Start later. The 9h option is a boundary/helper, not a live start button.

IMPORTANT:
This patch does not change the 72h weekly/long-rest helper rule.
This patch does not touch pay, archive, profile, or Gross Only logic.


## v5.1.8 — Stop long-shift daily warning carry-over

PROBLEM:
After a >13h shift, the “11h rest unavailable” daily warning could carry through End Week / Off days into a later week.

CAUSE:
The >13h previous-shift condition was still used even when the rest gap had already reached 24h+ and was no longer a daily-rest suggestion situation.

FIX:
- Daily 9h/11h suggestions are active only while the gap from the previous Finish is within the daily-rest window (<24h / up to 24h helper boundary).
- Once the gap is 24h+, daily suggestions and the >13h daily warning stop.
- Rest card still counts factual rest time.

WHY:
A long previous shift affects the next relevant daily rest, not every later day after weekly/long rest or End Week.

IMPORTANT:
This is not a Monday-specific fix. It is based on the actual rest gap from previous Finish.
This patch does not touch pay, archive, profile, or Gross Only logic.


## v5.1.9 — Profile restore safety

PROBLEM:
When switching between archive/current weeks, the app could show or keep the wrong active Pay Setup profile while the week settings were restored from a different profile snapshot.

FIX:
- Saved week data now stores `activePayProfileId` with the week.
- Loading an archived/current saved week restores the matching active profile when available.
- Legacy saved weeks without `activePayProfileId` try to resolve the profile from the saved settings snapshot or organisation name.
- End Week/archive save also carries the active profile id.

WHY:
A week should reopen with the profile/settings context it was saved with. Profile restore is workflow state, not a Pay Engine redesign.

IMPORTANT:
This patch does not change pay formulas, Rest Engine, Archive rules, layout, colour logic, or main screens.


### v5.1.9 release metadata correction

Corrected release metadata so visible title, manifest, service-worker cache, package version and APP_VERSION all identify the same v5.1.9 profile restore build. No UI/layout/colour/engine logic changes.

## v5.1.10 — Profile tax mode persistence

Fixed profile payment-mode persistence.

Changed:
- Pay profiles now preserve `grossOnly` explicitly in the settings snapshot.
- Loading a profile in Pay Setup v2 restores its PAYE/Gross Only mode into the draft.
- Applying a profile restores the profile's saved tax mode together with rates and allowances.
- Added a small Pay calculation mode selector inside Pay Setup v2 so the profile itself can be saved as PAYE estimate or Gross Only.

Not changed:
- No Rest Engine changes.
- No Pay formula changes.
- No Archive workflow changes.
- No main screen layout, colour logic, or core UI semantics changed.

## v5.1.11 — Profile settings and active profile cleanup

Changed:
- Active Pay Profile display uses `Employer/Agency → Profile/Client` style, for example `ARC → Turners`.
- Settings screen uses the existing main visual field to show the active profile. No extra Settings rows were added.
- Pay Setup v2 no longer shows `New from this`.
- `Update Profile` is disabled when the draft is unchanged.
- `Update Profile` archives the previous profile snapshot before saving a real change.
- Updating the active profile also updates current Settings, including PAYE/Gross Only mode.

Not changed:
- Rest Engine untouched.
- Pay formulas untouched.
- Archive workflow untouched.
- Main layout and colour logic untouched.


## v5.2.4 - Day Off context data fix
- Day Off Rest Card now reuses the existing previous-shift rest calculation instead of showing an empty card.
- Day Off context now shows meaningful completed/off days only.
- After End Week, Day Off can show the last completed week context instead of an empty new week.
- No pay/profile/rest-engine changes.


## v5.2.21 stable promotion
No source correction after heavy QA. Documentation only was updated to record the PASS and stable-baseline status. Functional source remains the exact QA-tested v5.2.21 source.


## v5.2.22 — road-test regression fix
Physical-phone testing found same-pay-week Saturday candidate loss and current-day archive-like styling. Archive was checked before coding. Functional change is intentionally limited to candidate selection equality and date-aware soft-close visual gating.

## v5.2.22 stable road-test deploy
Documentation-only packaging of the already tested v5.2.22 source. No application source, dependency, storage, Pay Engine, Rest Engine, Archive logic or user-facing application text changed.

## v5.2.23
Focused weekly-rest architecture correction after archive audit. No Setup work. Candidate/proposal ownership was separated from six-cycle warning ownership. Existing pay, archive, compensation, KM and backup logic remain protected.
## v5.2.24 — Scenario 3 chronology fix
Behavioral QA of v5.2.23-r2 exposed a 72h `getWeeklyRestPlan()` cutoff. Replaced the time cutoff with factual candidate-consumption detection based on a later real Work Start. Added a v5.2.24 behavioral regression covering long-rest persistence and post-Start non-reappearance.

## v5.2.25-r1 — governance hardening
Documentation-only packaging revision. Added canonical protected-behaviour register and mandatory new-chat handover. No runtime source change.

## v5.2.25-r2 — test-only correction
Updated the v5.2.22 same-pay-week regression so it preserves its original Saturday applicability protection without overriding the later WR-009 stale-candidate rule. No runtime source change.

## v5.2.25 phone-road-test deploy
Packaging/documentation only after Heavy QA PASS. Runtime application source and tests remain unchanged from the tested v5.2.25-r2 package.

## v5.2.26-r1 — packaging-only correction
Only `public/sw.js` cache identity was aligned to v5.2.26. Runtime logic, tests and dependencies are unchanged.

## v5.2.27 — root-cause fix
Root causes: (1) `weeklyRestAnchor` depended on `timelineWeeklyRestBaseActive`, which is intentionally false after Start; (2) Rest Card/compensation factual ownership depended on `displayStartValue`, a presentation value; (3) `askWorkingTomorrow` explicitly required `weeklyRestDueByTimeline === false`; (4) Saturday `getAdjacentLogicalIndex` returns Saturday, producing a same-page refresh; (5) direct current-week navigation depended too narrowly on `softArchiveMode`. Corrected each at its owner boundary and added a dedicated regression script.

---


# APPENDIX 19 — docs/PROJECT_HISTORY.md

## 2026-08-09 — v5.2.25 UX recovery
After v5.2.24 passed behavioral chronology QA but failed the physical UI road test, v5.2.16 pre-due-gate and stable sources were compared directly. v5.2.25 restores the older weekly-rest presentation contract without reverting the newer chronology engine.

## v5.2.15 — Backup/Restore Round-Trip QA Foundation

- Base: v5.2.14 documentation continuity foundation.
- Added isolated automated QA for complete Backup → Restore state transfer.
- The test verifies that a backup from one device replaces the second device's local state and produces an identical complete storage snapshot.
- The test covers current week data, saved weeks, settings, archive, pay profiles, active profile, weekly-rest candidate, closed weeks, language and weekly-compensation ledger.
- Added an atomic rollback test: a failed restore must leave the pre-existing local state unchanged.
- Added production-source guards confirming that the current version-2 backup still exports the complete localStorage snapshot and restores it before reload.
- No application UI, user-facing text, Rest Engine, Pay Engine, Archive, navigation, layout, colour, calculation or production behaviour changed.

## v5.2.14 — Documentation Continuity Foundation

- Established the permanent AI-readable project reference and release workflow.
- Consolidated locked architecture and behaviour decisions without changing application logic.
- Added explicit startup order, change classification, QA levels and future backlog boundaries.
- Application source remains unchanged from v5.2.13.

## v5.2.13 — QA TypeScript Validation Fix

- A full baseline QA pass exposed duplicate English translation keys that Vite warned about and TypeScript rejected.
- The safe correction removes only shadowed duplicates and preserves the effective v5.2.12 text values.
- Rest Engine, Pay Engine, Archive, storage, navigation, and layout remain unchanged.

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


## v5.2.2 – Weekly Rest Visual / Start Validation Fix
- Weekly Rest preview card now uses existing app colours: standard dark main time, grey source helper, existing helper warning/success colours.
- Added Start field violation validator: if entered Start is before the earliest legal rest boundary, the Start field turns red and shows “Rest not completed”.
- Legal entered Start values remain visually standard. Rest Card logic is not changed by this UX validator.

# Project History

## REST-START-SOURCE-001 — Start helper source labels

Decision:
The Start field must clearly explain the source of the suggested Start time.

Accepted behaviour:
- If the suggested Start is based on 11h normal daily rest, show `from 11h rest`.
- If the suggested Start is based on 9h reduced daily rest, show `from 9h rest`.
- If 11h rest is unavailable, keep `11h rest unavailable` as a separate explanation. It must not replace `from 9h rest`.

Boundary:
v5.2.2 is a safe UX clarification only. It must not change Rest Engine logic, Start calculations, reduced rest logic, split break behaviour, weekly rest, 72h helper, End Week, Archive, or Pay Engine.

Backlog:
Review Split Break / Week Active wording later as a separate UX task.



## REST-9H-HELPER — accepted behaviour restored

Decision:
- Start field uses the 11h normal-rest suggestion as the main suggested start time.
- 9h reduced-rest is shown as a small helper/boundary below the field when reduced rest is available.
- The 9h helper should not be hidden only because the boundary was reached on the previous calendar day.

Reason:
The app is not a live tachograph logger. A driver may start work first and enter the Start time later.

Boundary:
- The 72h weekly/long-rest helper handling is separate and is not changed by this patch.


## REST-WEEK-CARRY-001 — long-shift warning carry-over fixed

Decision:
A >13h previous workday warning is a daily-rest context only. It must not be persisted as state or carried through End Week, Off days, or weekly/long rest.

Rule:
- If the gap from previous Finish is still in the daily-rest window, show the daily warning/helper when relevant.
- If the gap is 24h+, stop daily 9h/11h suggestions and stop the >13h daily warning.
- The Rest card still shows factual elapsed rest time.

Reason:
The app works from real Finish → real/current Start context, not from a sticky day flag.


## PROFILE-RESTORE-001 — saved weeks keep their active profile

Problem:
Archive/current week navigation could restore saved settings while the active profile selector still pointed at another profile. This created confusion and risked editing/applying the wrong profile.

Rejected idea:
Rebuild Pay Setup v2 or introduce company-specific behaviour.

Reason rejected:
The app direction is Payment Models, not company versions. This bug is about restoring the correct saved profile context, not redesigning Pay Engine.

Accepted decision:
Save `activePayProfileId` with each week/archive entry. When a week is loaded, restore that profile if it still exists. For older weeks without that field, resolve the closest profile by settings snapshot, then by organisation name.

Reason:
A saved week should reopen with the same profile context it had when saved. This keeps current/archive navigation stable without changing pay formulas or UI design.

Boundary:
No visual changes. No Rest Engine changes. No Pay Engine formula changes. No Archive rule redesign.


## VERSION-RELEASE-001 — PWA update version identity

Decision:
A real app update may bump the version, but the version must be changed consistently everywhere: APP_VERSION, package.json, browser title, manifest description/name where used, service-worker cache name, ZIP filename and release notes.

Reason:
For this PWA the update is normally offered inside the installed app/browser flow and accepted by the user. Mixed version strings make it unclear whether the installed app, browser tab, service worker and ZIP are the same build.

Rule:
Never ship a ZIP where title/footer/manifest/cache disagree.

## Decision: Profile owns tax mode

ID: PAY-PROFILE-TAX-001

Problem:
When moving between agency/LTD style work and normal company/PAYE work, the same driver may need different tax modes per profile. If a Gross Only profile loads as PAYE by default, a day/week can be saved with the wrong deductions and then the user has to edit archive data later.

Accepted behaviour:
A payment profile must store and restore its own tax calculation mode (`grossOnly` / PAYE estimate). Loading/applying a profile must restore that mode with the profile's rates and allowances.

Reason:
Tax mode is part of how the profile pays, not a temporary screen preference. It must travel with the profile to prevent accidental wrong pay calculations.

Rejected behaviour:
Defaulting every loaded profile to PAYE/tax ON.

Reason rejected:
Unsafe for agency/LTD gross-only weeks and can force unnecessary archive edits.

## PROFILE-SETTINGS-001 — Active Pay Profile owns Settings context

Decision:
When an active Pay Profile exists, Settings are not a separate source of truth. They are the current working values of the active profile.

Accepted behaviour:
- The visible active profile should be clear, for example `ARC → Turners`.
- The profile stores the pay model context, including PAYE/Gross Only mode.
- Updating the active profile updates current Settings.
- Updating an unchanged profile should be disabled/no-op.
- The previous profile snapshot is archived before a real profile update.
- Completed days must keep their saved/snapshot values and must not be silently recalculated by a later profile update.

Rejected behaviour:
- Treating Settings and Profiles as two independent competing systems.
- Showing only the payer/agency name when multiple profiles can share it.
- Keeping `New from this` as a duplicate of `Save as new profile`.

Reason:
The app's primary purpose is correct pay checking. The user must immediately know which pay profile is driving calculations, and profile changes must not accidentally corrupt already saved work.


## v5.2.4 - Day Off context data fix
- Day Off Rest Card now reuses the existing previous-shift rest calculation instead of showing an empty card.
- Day Off context now shows meaningful completed/off days only.
- After End Week, Day Off can show the last completed week context instead of an empty new week.
- No pay/profile/rest-engine changes.


## 2026-08-08 — v5.2.21 stable baseline
Archive-audited restoration of soft/hard archive behaviour and weekly-rest visibility passed heavy QA, TypeScript validation and fresh production build. v5.2.21 became the stable source/deploy baseline. Exact calendar-midnight expiry for the 24h reduced proposal remains deliberately undecided; current behaviour removes the reduced alternative at the 45h threshold.


## 2026-08-08 — v5.2.22 prepared
Real-device v5.2.21 testing found that a Friday-created weekly-rest candidate disappeared on Saturday of the same pay week and that a current soft-closed Saturday looked archived. Archive review showed these were regressions against protected proposal/date-aware UX principles. v5.2.22 applies the narrow correction before Setup work continues.

## 2026-08-09 — v5.2.22 deployed for road test
The same-pay-week Saturday weekly-rest candidate and current-day soft-close visual regression were corrected in v5.2.22. Heavy QA and build validation passed. A packaging-only r1 fixed the internal root name without changing source. The exact tested source is now deployed for real-device confirmation before Setup development.

## 2026-08-09 — v5.2.23 End Week / Weekly Rest reconciliation
A phone test exposed that the six-cycle due gate had accidentally become a visibility gate for End Week weekly-rest proposals. Archive review recovered the older model: End Week seeds a candidate from the last real Finish, while factual timeline/cycle logic separately decides when weekly rest is mandatory. v5.2.23 restores that separation and adds three explicit real-world regression scenarios.
## 2026-08-09 — v5.2.24 long-rest context correction
The three-scenario behavioral QA proved Scenario 1 and Scenario 2 but exposed Scenario 3: a Wednesday-finish rest disappeared on Sunday because the UI helper expired after 72h. The accepted model is now explicit: End Week candidate lifetime follows uninterrupted chronology, not a timer; real Start ends/consumes it.

## 2026-08-09 — Master Decision Register established
After repeated regressions caused by lost context across otherwise well-tested versions, the project introduced `PROTECTED_BEHAVIOURS.md` as the canonical inherited decision register and `NEW_CHAT_HANDOVER.md` as mandatory startup law. The register was reconstructed from v5.2.16 through v5.2.25 history, including pre-due-gate source and intermediate QA checkpoints. This is a governance/documentation correction only; runtime v5.2.25 source is unchanged.

## 2026-08-09 — v5.2.25 deployed for physical-phone validation
After source/test/register alignment reached a full Heavy QA PASS, the exact tested runtime source was packaged for phone validation. The goal is to confirm visible Weekly Rest identity/proposals, soft-archive navigation and current-day presentation before declaring the installed baseline stable.

## 2026-08-09 — v5.2.27 road-test ownership correction
Physical testing of v5.2.26 found states where the Start field correctly reported `Weekly rest required` while the Rest Card simultaneously reported green `Daily rest` or yellow daily `Reduced rest`. Source review found two ownership domains: proposal state and factual Start state. The timeline anchor was selected through a proposal-only flag that turns off after Start, while factual Rest Card logic depended on a presentation-filtered Start value. The same review found an explicit six-cycle gate suppressing `Working tomorrow?`, Saturday Save & Next self-navigation, and an archive navigation condition too dependent on the closed-week flag. v5.2.27 addresses these contradictions without changing factual rest-duration arithmetic.

---


# APPENDIX 20 — docs/QA_HISTORY.md

## v5.2.25 QA checkpoint
Added regression coverage for stale candidate recovery, 24h/45h plan lifecycle, post-45h context retention, and soft-archive current-week navigation source contract.

## v5.2.15 — Backup/Restore round-trip QA

- Scope: test infrastructure only; no production UI or logic modification.
- Representative phone state exported as a complete storage snapshot.
- Restore into a computer state containing different and stale data passed.
- Exact snapshot equality after restore passed.
- Stale destination-only keys were removed rather than merged.
- Current/saved week facts, kilometres, settings, archive, pay profiles, weekly-rest candidate and compensation ledger survived unchanged.
- Simulated storage write failure triggered full rollback to the original destination state.
- Static production guards confirmed version-2 complete snapshot export, snapshot restore, rollback protection and reload path remain present.
- Production build revalidation was attempted, but dependency installation timed out in this environment; the existing v5.2.14 production bundle was retained with version identity updated because production application source remained byte-for-byte unchanged.

## v5.2.14 — Documentation-only release QA

- Scope: documentation continuity foundation and version identity only.
- `src/App.tsx` SHA-256 compared with v5.2.13: unchanged.
- New permanent documentation presence and paths checked.
- Version metadata synchronised to 5.2.14.
- No interactive browser regression was required for application behaviour because functional source was not changed.
- Dependency installation/build revalidation was attempted but timed out in the execution environment; this is recorded as blocked, not as an application failure.

## v5.2.13 — Full baseline QA

- v5.2.12 failed strict TypeScript validation with 14 TS1117 duplicate-property errors in the English translation object.
- Root cause fixed by removing shadowed duplicates while retaining the exact values previously used at runtime.
- Exact v5.2.11 → v5.2.12 comparison passed: only the intended daily Start auto-accept path in `updateTimeValue`, version metadata, release documentation and rebuilt output changed; no CSS, Pay Engine, Archive, Weekly Rest Engine or compensation-ledger changes were found.
- Required version bump to v5.2.13 because source and release documentation changed.
- Production build, strict TypeScript validation, version identity, startup, persistence, Start/Finish, rest, weekly compensation, archive, pay, navigation, and PWA checks rerun as recorded in `QA_FULL_REPORT_v5.2.13.md`.

## v5.2.12 — Start proposal auto-accept regression QA

- Valid daily proposal 07:00 + Finish 15:00: Start must become 07:00 immediately and worked hours must calculate.
- Existing manual Start must not be overwritten when Finish is entered.
- Empty/invalid Finish must not accept the proposal.
- Weekly-rest proposal must not be silently converted by this daily-only path.
- Outstanding compensation must not affect Start acceptance or day completion.
- Compensation ledger threshold scenarios from v5.2.11 remain unchanged.

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


## REST-START-SOURCE-001
Status: OPEN
Build: v5.2.2
Expected:
- 11h suggestion displays `from 11h rest` under the Start field.
- 9h suggestion displays `from 9h rest` under the Start field.
- If 11h is unavailable, `11h rest unavailable` remains a separate explanation and does not replace `from 9h rest`.
- Suggested Start times remain exactly the same as v5.1.11.

## REST-9H-PREVIOUS-DAY-001
Status: RETEST
Build: v5.2.2
Expected:
The 9h helper remains visible even when the 9h boundary was on the previous calendar day.


## PROFILE-TAXMODE-001

Status: OPEN
Version introduced/tested: v5.1.10

Expected:
A profile saved as Gross Only loads and applies as Gross Only. A profile saved as PAYE estimate loads and applies as PAYE estimate. Switching between the two before starting/saving a day must not require archive edits later.

Test:
1. Create/update Profile A as PAYE estimate.
2. Create/update Profile B as Gross Only.
3. Load/apply Profile B and confirm Settings/Week preview use Gross Only.
4. Load/apply Profile A and confirm PAYE deductions return.
5. Save a day with each profile and reopen the week to confirm the correct profile/tax mode is restored.


## PROFILE-ACTIVE-DISPLAY-001
Status: OPEN
Build: v5.1.11
Expected: Settings main visual field shows the active pay profile name, e.g. `ARC → Turners`, without adding new rows.

## PROFILE-UPDATE-001
Status: OPEN
Build: v5.1.11
Expected: Update Profile is disabled with no changes. When changed, it archives the previous profile, updates the profile, and applies it to current Settings if active.

## PROFILE-TAXMODE-001
Status: RETEST
Build: v5.1.11
Expected: Loading/applying Gross Only profile restores Gross Only; loading/applying PAYE profile restores PAYE estimate.

## v5.2.1 QA – Standard Weekly Rest Candidate Fix

- npm install --no-package-lock: PASS
- npm run build: PASS
- Known existing warning: duplicate translation keys in src/App.tsx. Not introduced by this patch.
- Manual test needed: close week on Friday, open next Monday, confirm Weekly Rest card appears in place of Worked / OT.


## v5.2.4 - Day Off context data fix
- Day Off Rest Card now reuses the existing previous-shift rest calculation instead of showing an empty card.
- Day Off context now shows meaningful completed/off days only.
- After End Week, Day Off can show the last completed week context instead of an empty new week.
- No pay/profile/rest-engine changes.


## v5.2.21 — Heavy QA PASS / stable promotion
- Independent heavy QA: PASS; no blocking defects.
- `npm ci`, full `npm test`, `npx tsc --noEmit`, and fresh Vite build: PASS.
- Source hashes unchanged; QA made no source/text/dependency/version changes.
- Physical-phone road test remains recommended, not a source blocker.

## v5.2.22 — Heavy QA + packaging correction
- Application regressions: PASS.
- TypeScript: PASS.
- Fresh production build: PASS.
- Initial package integrity: FAIL only because root was incorrectly named v5.2.21-STABLE.
- v5.2.22-r1 packaging correction: PASS.
- r1 application source: byte-for-byte identical to heavy-tested v5.2.22 source.
- Remaining step: physical-phone Saturday road test after deployment.

## v5.2.23 local precheck
- npm test: PASS, including new v5.2.23 End Week/weekly-rest regression.
- npx tsc --noEmit: PASS.
- fresh Vite build: NOT CONFIRMED locally (`vite: not found`); requires heavy QA environment.
- physical-phone road test: pending.
## v5.2.24 — required QA
Regression must rerun the complete v5.2.23 behavioral scenarios plus a new stale-candidate guard: 72h+ rest retains `Weekly rest ended` before Start, then the old End Week candidate must not reappear on a later day after a factual Start consumes it. Full npm test, TypeScript and fresh Vite build remain mandatory.

## v5.2.25-r1 — documentation integrity requirement
Before any future stable promotion, QA must confirm `PROTECTED_BEHAVIOURS.md` and `NEW_CHAT_HANDOVER.md` are present and that claimed behaviour changes reference affected protected IDs. This r1 change does not alter runtime source.

## v5.2.25-r2 — Obsolete regression aligned with WR-009
Heavy QA of r1 found the runtime source compliant with WR-001–WR-013, but `npm test` was red because the v5.2.22 static assertion contradicted WR-009. r2 changes that historical regression only. Full independent QA is required again.

## v5.2.25 — Source Heavy QA PASS / phone validation pending
The complete official npm test, TypeScript, fresh production build, WR-001–WR-013, all three End Week behavioral scenarios and register/test/source alignment passed. The next required gate is the real-phone workflow and visibility test.

## v5.2.26-r1 — service-worker version alignment
Weekly Rest scenarios 1–16 had passed; release was blocked only by stale v5.2.25 service-worker cache identity. r1 corrects only that marker. Full Heavy QA must be rerun.

## v5.2.27 — QA required
Source correction created from physical v5.2.26 failures. Local dependency-free regressions through v5.2.22 and the new v5.2.27 static ownership/workflow regression pass. Full npm test cannot complete locally because the environment cannot install `yallist@3.1.1`, leaving esbuild unavailable for later render/behavior suites. Independent Heavy QA must run full npm ci/test/TypeScript/build and the mandatory real-world render scenarios before phone deployment.

---


# APPENDIX 21 — docs/RELEASE_AND_QA_WORKFLOW.md

# Release and QA Workflow

## Before editing

- Verify ZIP integrity.
- Confirm actual package/app version.
- Read continuity and decision documents.
- Identify the precise base release.
- Record hashes of sensitive source files when the change should not touch them.

## During editing

- Every functional or source change must advance the application version before handoff. Do not accumulate multiple materially different checkpoints under the same version number.
- Use a short descriptive release/checkpoint name alongside the number (for example `v5.2.16-weekly-rest-endweek-intent`) so the artifact remains identifiable later.
- Keep a strict scope boundary.
- Avoid unrelated formatting churn.
- Record root cause and accepted behaviour.
- Update documentation alongside the change, not from memory afterward.

## Technical validation

Where the environment permits:

1. `npm ci`
2. `npx tsc --noEmit`
3. `npm run build`
4. inspect generated version strings
5. compare source diff with the base
6. test ZIP integrity

If dependency installation or browser execution is blocked by the environment, record that limitation explicitly. Do not convert a blocked test into a PASS or a discovered application failure.

## QA levels

### Documentation-only release

- application source hash unchanged
- version identity consistent
- documentation files present
- links/paths valid
- ZIP integrity passes

### Local patch

- all documentation-only checks
- targeted manual test
- TypeScript/build
- affected persistence/reload test where relevant

### Major release

- full technical validation
- full interactive suite
- existing-data restore fixture
- realistic complete week
- archive and reload
- PWA update/cache checks
- regression totals for Pay Engine
- multi-day/multi-week Rest scenarios when affected

## Release documentation

Every release entry must state:

- version and date
- base version
- purpose/problem
- exact files changed
- behaviour changed
- behaviour explicitly unchanged
- tests passed
- tests blocked or not run
- status: candidate, working baseline, or stable baseline

## Packaging

- Exclude nested ZIPs, temporary files, editor files and `node_modules`.
- Include source, reproducible build output when the project currently carries it, and all permanent documentation.
- Final ZIP filename must match the internal version.

---


# APPENDIX 22 — docs/VERSION_HISTORY.md

## v5.2.25 — Weekly Rest UI Contract Recovery
Recovered the simple v5.2.16-era weekly-rest presentation contract while retaining v5.2.24 factual chronology. Fixes stale-candidate selection, post-45h card disappearance and missing current-week return in soft archive.

## v5.2.24 — Long Weekly-Rest Context / Candidate Consumption Fix
- Behavioral QA of v5.2.23-r2 found that Scenario 3 lost weekly-rest context after 72h even though the continuous rest was still active.
- v5.2.24 removes that elapsed-time expiry and makes candidate lifetime factual: persist until a later real Work Start consumes it.
- Adds explicit behavioral coverage for 72h+ context persistence and non-reappearance after the consuming Start.
- No Setup work is included.



## v5.2.23 — End Week / Weekly Rest Intent Separation
- End Week explicitly starts an informational weekly-rest candidate from the last factual Finish.
- Six completed cycles remain the mandatory weekly-rest due/warning gate and no longer suppress voluntary End Week proposals when fewer cycles exist.
- Existing 45h/24h proposal lifecycle, Suggested ≠ Saved, timeline chronology and compensation protections remain in place.
- QA r2 corrects documentation identity and adds executable scenario coverage for: normal Mon–Fri End Week; mid-week 45h+ rest followed by Fri/Sat/Sun work; and rest already accrued before End Week.
- Runtime application version remains 5.2.23; r2 is only the corrected QA artifact revision.
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


## v5.2.22 — Same-pay-week Weekly Rest + Current-Day Visual Fix
Road-test regression correction after archive audit. Restores same-pay-week Saturday access to a valid Friday End Week candidate and prevents today's/future soft-closed day from looking historical. Source QA candidate pending heavy retest.

## v5.2.26
Built from v5.2.25 after physical road testing exposed weekly-rest presentation/ownership defects. Pay, kilometre and Setup logic are outside this change.

## v5.2.27
Created after v5.2.26 passed source Heavy QA but failed real-device workflow tests. The root issue was not the rest-duration arithmetic: it was ownership drift after Start plus workflow gates that conflated legal state with navigation/user intent. v5.2.27 keeps factual durations and colour boundaries but makes the weekly-rest owner persist through the factual Start interval.

---


# APPENDIX 23 — LOCAL_VALIDATION_v5.2.24.md

# Driver Pay App v5.2.24 — Local Validation

## PASS
- Source/package targeted integrity assertions.
- v5.2.24 runtime/version identity checks.
- TypeScript: `tsc --noEmit` completed successfully in the preparation environment.
- The arbitrary `anchor.finishAbs + 72 * 60` weekly-rest cutoff is absent.
- The factual candidate-consumption helper and UI ownership guards are present.
- v5.2.23 and v5.2.24 regression commands are both included in the full `npm test` chain.

## Environment limitation
A clean `npm ci` could not complete in the preparation environment because the configured internal npm mirror returned HTTP 404 for `yallist-3.1.1.tgz`.

Because dependencies could not be installed here:
- the full npm behavioral suite was not executed locally;
- a fresh Vite production build was not executed locally.

The independent QA environment must execute the complete `QA_v5.2.24_HEAVY_TEST_PLAN.md`.

---


# APPENDIX 24 — LOCAL_VALIDATION_v5.2.25.md

# Driver Pay App v5.2.25 — Local Validation

## Comparison basis
Direct source comparison:
- v5.2.16 `src/App.tsx.before-weekly-due-gate`
- v5.2.16 stable `src/App.tsx`
- v5.2.24 Heavy-QA/road-test source

## Confirmed targeted changes
1. Newer applicable previous-week weekly-rest candidate wins over stale older stored candidate state.
2. Work-day Weekly Rest card renders whenever a valid plan exists, not only when the secondary helper string is non-empty.
3. Non-current soft archive exposes a direct `Go to current week` action.

## Local checks
- `tsc --noEmit`: PASS.
- Package/version identity: 5.2.25.
- No `node_modules` or `dist` included in this source checkpoint.
- Full npm behavioral suite and fresh Vite build remain for independent Heavy QA.

---


# APPENDIX 25 — PACKAGING_CORRECTION_v5.2.22-r1.md

# Driver Pay App v5.2.22 — Packaging Correction r1

This checkpoint is a **packaging-only correction** of the QA-tested v5.2.22 source.

## Reason
The previous QA ZIP incorrectly used the internal root folder name:

`driver-pay-app-v5.2.21-STABLE`

while the contained application source and version identity were v5.2.22.

## Correction
The internal root folder is now:

`driver-pay-app-v5.2.22-weekly-rest-roadtest-fix-source-qa-r1`

## Scope
- No application source logic changed.
- No user-facing application text changed.
- No dependencies changed.
- No storage, Pay Engine, Rest Engine, Archive or compensation behaviour changed.
- Runtime application version remains v5.2.22.
- This `r1` suffix identifies only the corrected QA package artifact.

The previous heavy QA reported:
- application regressions: PASS
- TypeScript: PASS
- production build: PASS
- package integrity: FAIL only because of the incorrect internal root folder name

Required retest for this artifact:
1. ZIP opens.
2. Internal root folder identifies v5.2.22.
3. Version identity inside remains v5.2.22.
4. Confirm application/source files match the previously tested v5.2.22 checkpoint.
5. No functional rework is expected from this packaging correction.

---


# APPENDIX 26 — QA_APPROVAL_v5.2.20.md

# Driver Pay App v5.2.20 — Stable Source Approval

Status: **PASS — source/automated heavy QA**

This package is the same v5.2.20 source checkpoint that passed the dedicated heavy QA pass. No source corrections were made after QA.

Verified in the heavy QA pass:
- weekly-rest Start warning routing;
- existing Rest Card three-colour behaviour unchanged;
- archived/closed-week End Week guard;
- archive feedback visibility;
- Start KM accepted/suggestion visual state;
- archive-like styling for completed prior days in the active week without locking;
- backup/restore;
- weekly-rest timeline;
- End Week intent;
- compensation debt creation;
- compensation repayment and chronology;
- archive duplicate protection.

Local packaging check: `npm test` passes on the packaged source.

## Build note

A fresh local TypeScript/Vite production build could not be verified in the available environment because the internal npm package mirror returns missing-package errors during dependency installation. No `dist` folder is included. The package is therefore a stable source/deploy candidate; the deployment environment must perform the normal dependency install and Vite build.

No application logic was changed during stable packaging.

---


# APPENDIX 27 — QA_APPROVAL_v5.2.21.md

# Driver Pay App v5.2.21 — Stable QA Approval

Date: 2026-08-08

## Final status
**PASS — STABLE SOURCE / DEPLOY BASELINE**

Independent heavy QA reported no blocking application defects and made no source, text, dependency or version changes.

## Technical validation
- ZIP integrity: PASS
- `npm ci`: PASS
- `npm test`: PASS
- `npx tsc --noEmit`: PASS
- Fresh Vite production build: PASS
- 31 modules transformed successfully
- Production JavaScript bundle: 253.02 kB (78.26 kB gzip)
- Source integrity after QA: PASS; source hashes unchanged

## Functional validation
PASS coverage includes date-aware soft/hard archive restoration; Sunday→Saturday pay-week boundary; weekly-rest due gate; qualifying Day Off `Weekly Rest` and `Weekly rest in progress` / `Тече седмична почивка`; applicable 45h target and valid 24h reduced option; 24h option through 44h59m and removal at 45h; unchanged Rest Card colour semantics and warnings; compensation creation/repayment/chronology/deadline/FIFO/rest-reuse protections; v5.2.20 UX regressions; backup/restore and archive duplicate protection; Pay Engine and Save & Next regressions.

## Physical-phone road test
Still appropriate after deployment for touch/layout confirmation and the complete Saturday `Day Off → Work` correction workflow. This is not a source-QA blocker.

## Release decision
v5.2.21 is the current stable source/deploy baseline. No v5.2.22 is created because no source correction was required by QA.

---


# APPENDIX 28 — QA_BACKUP_RESTORE_REPORT_v5.2.15.md

# Driver Pay App v5.2.15 — Backup/Restore Round-Trip QA Report

## Scope

Test-only release. No visual, text, calculation or production behaviour changes were authorised.

## Automated checks

1. Complete representative phone state exported to a storage snapshot.
2. Snapshot restored over a different computer state.
3. Exact key/value equality confirmed after restore.
4. Destination-only stale data confirmed removed.
5. Saved work facts and kilometres confirmed unchanged.
6. Weekly compensation ledger confirmed unchanged.
7. Simulated restore failure confirmed full rollback.
8. Production source checked for:
   - version 2 backup format;
   - complete storage snapshot export;
   - atomic rollback;
   - complete snapshot restore;
   - reload after successful restore.
9. Test script confirmed absent from production UI imports.

## Result

All targeted Backup/Restore round-trip tests passed.

## Observations not changed

The current restore implementation intentionally reloads the application after a successful version-2 snapshot restore. No attempt was made to alter this behaviour.

## Build validation note

Dependency installation timed out in the execution environment, so a fresh Vite build and strict TypeScript pass could not be completed. `src/App.tsx` was verified byte-for-byte unchanged from v5.2.14. The existing production bundle was retained and only version identity files/strings were synchronised to v5.2.15.

---


# APPENDIX 29 — QA_CORRECTION_v5.2.23-r2.md

# Driver Pay App v5.2.23-r2 — QA Evidence Correction

This is a QA-artifact revision only. Runtime application version remains **5.2.23**.

## Why r2 exists
The first v5.2.23 heavy QA correctly failed for two reasons:

1. VERSION_INDEX, CHANGELOG and VERSION_HISTORY were not promoted to v5.2.23.
2. The mandatory three End Week scenarios were described in the plan but the supplied regression test only inspected source patterns.

## Corrections in r2
- Version documentation is promoted consistently to v5.2.23.
- The v5.2.23 regression test now behaviorally executes the three mandatory scenarios.
- It compiles an instrumented in-memory copy of the actual `src/App.tsx` and calls the real helper functions used by the application.
- It constructs real day states, weekly-rest candidates, factual timeline/cycle state and Off → Work transitions.
- The application source on disk is not modified by the test.

## Application scope
No runtime application logic, UI text, dependencies, storage schema, Pay Engine, Rest Engine, Archive logic, compensation formula or version number was changed in r2.

---


# APPENDIX 30 — QA_CORRECTION_v5.2.25-r2.md

# Driver Pay App v5.2.25-r2 — Test/Register Alignment

## Reason
Heavy QA of v5.2.25-r1 found no confirmed runtime defect in WR-001–WR-013.

The official `npm test` command failed because the historical v5.2.22 regression still required unconditional preference for a stored weekly-rest candidate.

That assertion contradicts:
- `WR-009` in `PROTECTED_BEHAVIOURS.md`;
- the current v5.2.25 implementation;
- the passing v5.2.25 stale-candidate behavioral regression.

## Correction
Only the historical v5.2.22 regression assertion was updated.

The test now protects both:
1. the original v5.2.22 requirement that a same-pay-week candidate remains applicable on Saturday; and
2. the later WR-009 rule that, when two candidates are applicable, the candidate with the newer factual Finish wins.

## Scope
- Runtime application source: unchanged.
- User-facing application text: unchanged.
- Pay Engine: unchanged.
- Rest Engine: unchanged.
- Archive/storage: unchanged.
- Dependencies: unchanged.
- Runtime application version remains **5.2.25**.
- `r2` identifies only this QA/test-documentation artifact revision.

Independent Heavy QA must now rerun the complete `npm test`, TypeScript and fresh production build.

---


# APPENDIX 31 — QA_CORRECTION_v5.2.26-r1.md

# Driver Pay App v5.2.26-r1 — Packaging / Version Integrity Correction

Heavy QA of v5.2.26 passed Weekly Rest scenarios 1–16 but found a release blocker: `public/sw.js` still used `driver-pay-v5-2-25`.

r1 changes only that cache identity to `driver-pay-v5-2-26`.

Runtime application logic, src, tests, Pay Engine, Weekly Rest logic, compensation, archive/storage/navigation, Setup, dependencies and runtime version remain unchanged.

Required QA:
- ZIP/version integrity
- npm ci
- complete npm test
- npx tsc --noEmit
- fresh npm run build
- post-QA source integrity
- scenarios 1–16

The fresh build must not modify `public/sw.js`.

---


# APPENDIX 32 — QA_DOCUMENTATION_REPORT_v5.2.14.md

# Driver Pay App v5.2.14 — Documentation Release Report

**Date:** 2026-07-26  
**Base:** v5.2.13  
**Release type:** Documentation-only continuity foundation

## Verdict

**APPROVED AS A DOCUMENTATION-ONLY WORKING BASELINE.**

No functional application source change was made. The release adds permanent continuity, architecture, decision, QA and backlog documentation and advances version identity consistently.

## Added files

- `MASTER_PROJECT_REFERENCE.md`
- `docs/AI_CONTINUITY_AND_WORKFLOW.md`
- `docs/DECISION_LOG.md`
- `docs/ARCHITECTURE_OVERVIEW.md`
- `docs/RELEASE_AND_QA_WORKFLOW.md`
- `docs/BACKLOG_AND_NEXT_WORK.md`
- `QA_DOCUMENTATION_REPORT_v5.2.14.md`

## Updated release records / metadata

- `package.json`
- `package-lock.json`
- generated version identity files
- `CHANGELOG.md`
- `VERSION_INDEX.md`
- `docs/PROJECT_HISTORY.md`
- `docs/DEV_LOG.md`
- `docs/QA_HISTORY.md`
- `docs/VERSION_HISTORY.md`

## Source protection

`src/App.tsx` was not edited and must remain byte-for-byte identical to v5.2.13.

## Validation

- ZIP base extracted successfully.
- Documentation files created and inspected.
- Version sync executed from `package.json`.
- Source hash comparison performed.
- Dependency installation and full build revalidation were attempted, but the execution environment timed out. This limitation does not indicate an application defect.

## Functional scope

No UI, Rest Engine, Pay Engine, Pay Profiles, Archive, persistence, navigation, layout, colour or calculation behaviour was changed.

---


# APPENDIX 33 — QA_FULL_REPORT_v5.2.13.md

# Driver Pay App v5.2.13 — Full QA Report

Date: 2026-07-19

## Verdict

**NOT APPROVED AS STABLE BASELINE.**

The submitted v5.2.12 contained a proven TypeScript validation defect. The narrow source correction requires version **v5.2.13**. Technical validation and the exact v5.2.11 regression comparison pass after the fix, but the full interactive suite could not be executed because this QA environment has no browser binary and its Chromium download is blocked.

v5.2.13 is therefore a **QA candidate**, not a stable baseline.

## Results

| Test | Result | Evidence / limitation |
|---|---|---|
| QA-TECH-001 ZIP integrity | PASS | `unzip -t` passed; no nested ZIP, temp files, or missing documentation. `dist` is the deploy output and was reproducibly rebuilt. |
| QA-TECH-002 Version consistency | PASS after fix | package, lockfile, UI source, title, manifest, service-worker cache, docs and output all report 5.2.13. Final ZIP filename reports 5.2.13. |
| QA-TECH-003 Dependencies | PASS | `npm ci` installed 64 packages. Non-blocking warning: inherited npm `http-proxy` config is deprecated. Initial cache-path failure was environment-only and passed with a writable cache. |
| QA-TECH-004 Production build | FAIL in v5.2.12; PASS after fix | Vite bundled v5.2.12 but warned about duplicate keys; `tsc --noEmit` failed with 14 TS1117 errors. v5.2.13 passes Vite build and TypeScript validation cleanly. |
| QA-TECH-005 Regression comparison to v5.2.11 | PASS | Exact source/file diff completed. The only functional v5.2.11 → v5.2.12 change is the intended `updateTimeValue` daily Start auto-accept path when Finish is entered. Other differences are version identity, release documentation and rebuilt bundle names. No CSS, Pay Engine, Archive, Weekly Rest Engine, compensation-ledger or unrelated source changes were found. v5.2.12 → v5.2.13 changes only duplicate English translation-key cleanup plus version/docs/build output. |
| QA-APP-001 Clean startup | FAIL — BLOCKED | Requires real browser execution. |
| QA-APP-002 Existing database | FAIL — BLOCKED | Requires browser storage and a representative existing backup/database fixture. |
| QA-APP-003 Reload persistence | FAIL — BLOCKED | Requires browser execution. |
| QA-START-001 First day/no previous Finish | FAIL — BLOCKED | Requires browser execution. |
| QA-START-002 11h suggestion | FAIL — BLOCKED | Requires browser execution. |
| QA-START-003 Accept 11h suggestion | FAIL — BLOCKED | Requires browser execution. |
| QA-START-004 Accept then edit Start | FAIL — BLOCKED | Requires browser execution. |
| QA-START-005 Move Start earlier | FAIL — BLOCKED | Requires browser execution. |
| QA-START-006 9h suggestion | FAIL — BLOCKED | Requires browser execution. |
| QA-START-007 Accept 9h suggestion | FAIL — BLOCKED | Requires browser execution. |
| QA-START-008 Reject 9h/use later Start | FAIL — BLOCKED | Requires browser execution. |
| QA-START-009 Less than 9h | FAIL — BLOCKED | Requires browser execution. |
| QA-START-010 Suggested is not saved | FAIL — BLOCKED | Requires browser execution and reload. |
| QA-REG-001 Manual Start + Finish | FAIL — BLOCKED | Requires browser execution. |
| QA-REG-002 Suggested Start + Finish | FAIL — BLOCKED | Requires browser execution. |
| QA-REG-003 Edit accepted Start + Finish | FAIL — BLOCKED | Requires browser execution. |
| QA-REG-004 Edit Finish | FAIL — BLOCKED | Requires browser execution. |
| QA-REG-005 Reload | FAIL — BLOCKED | Requires browser execution. |
| Phase 5 Daily Rest Engine matrix | FAIL — BLOCKED | Exact 11h, above 11h, exact 9h, 9–11h and below 9h were not interactively executed. |
| Phase 6 Split Daily Rest | FAIL — BLOCKED | Requires browser execution. |
| Phase 7 Weekly Rest Engine | FAIL — BLOCKED | Requires multi-day browser scenarios. |
| Phase 8 Compensation Ledger | FAIL — BLOCKED | Persistence and duplicate-entry checks require multi-week browser/storage scenarios. |
| Phase 9 Day Off / Holiday | FAIL — BLOCKED | Requires browser execution. |
| Phase 10 Archive | FAIL — BLOCKED | Requires browser execution with archived fixture. |
| Phase 11 Pay Engine regression | FAIL — BLOCKED | Requires browser execution and reference expected totals. |
| Phase 12 UI / Navigation | FAIL — BLOCKED | Requires browser execution. |
| Phase 13 PWA | FAIL — PARTIALLY BLOCKED | Manifest, cache version, service worker source, icons and built assets pass static validation; install, update prompt, cache lifecycle and refresh require a real browser. |
| Phase 14 Complete realistic week | FAIL — BLOCKED | Requires end-to-end browser execution. |

## Failure found and fixed

### Duplicate English translation keys

- Root cause: repeated pay/tax entries had accumulated inside the English `UI_TEXT` object.
- Effect: JavaScript used the final duplicate values, so the app could still bundle, but strict TypeScript validation failed with 14 TS1117 errors and Vite emitted warnings.
- Fix: removed only shadowed duplicate entries and retained the exact final runtime values already used by v5.2.12.
- Behavioural scope: no Rest Engine, Pay Engine, Archive, storage, navigation, layout, colour, or calculation changes.
- File changed: `src/App.tsx`.

## Release files changed

- `src/App.tsx`
- `package.json`
- `package-lock.json`
- `src/version.ts` (generated by version sync)
- `index.html` (generated version sync)
- `public/manifest.webmanifest` (generated version sync)
- `public/sw.js` (generated version sync)
- `dist/*` (rebuilt output)
- `CHANGELOG.md`
- `VERSION_INDEX.md`
- `docs/DEV_LOG.md`
- `docs/PROJECT_HISTORY.md`
- `docs/VERSION_HISTORY.md`
- `docs/QA_HISTORY.md`
- `QA_FULL_REPORT_v5.2.13.md`

## Required before stable approval

1. Run every browser/storage test above in Chromium or Edge, including a representative existing-data restore fixture.
2. Rerun the full realistic-week scenario after any failure fix.
3. Approve v5.2.13 as stable only when every blocked item passes.

---


# APPENDIX 34 — QA_HANDOFF_v5.2.20_TESTER_CHAT.md

# DRIVER PAY APP v5.2.20 — TESTER CHAT ASSIGNMENT

You are the independent QA chat for this checkpoint.

## RULES
1. Do NOT correct source code.
2. Do NOT rewrite texts.
3. Do NOT upgrade dependencies or change package versions to make tests pass.
4. Do NOT reinterpret intended behaviour.
5. Report defects only, with exact reproduction steps and expected vs actual result.
6. Treat environment/install failures separately from application defects.
7. Run the complete file `QA_v5.2.20_HEAVY_TEST_PLAN.md`.
8. Run all automated tests with `npm test`.
9. If dependencies are available, run `npx tsc --noEmit` and a fresh Vite production build.
10. No correction is allowed during this QA pass.

## MOST IMPORTANT SCOPE GUARDS
- Existing daily Start warning `Rest not completed` must remain unchanged.
- New weekly cases reuse the existing red Start-field warning presentation only.
- `Weekly rest required` = attempted next work cycle while factual weekly rest is due and minimum weekly-rest boundary is not met.
- `Weekly rest not completed` = legacy weekly-rest validation case below its existing minimum boundary.
- Rest Card three-colour system MUST NOT change.
- Archived/closed week MUST NEVER ask `Working tomorrow?` when End Week is pressed again.
- Existing End Week feedback wording stays unchanged; only visibility/duration is intentionally improved.
- Start km carried suggestion is grey only until Finish km is entered; after Finish km it is visually accepted/dark but editable.
- A completed past day in the active week should look archive-like but must remain editable and must not become a real locked archive.
- Monday Start proposal after End Week is an OPEN ITEM and is OUT OF SCOPE. Do not modify it.

## REQUIRED REPORT FORMAT
Return one report titled:
`DRIVER PAY APP v5.2.20 — HEAVY QA RESULT`

Include:
- QA STATUS: PASS / FAIL
- technical results
- sections A-F from the heavy plan
- any blocking defects with root cause if provable
- TypeScript/build status separately
- explicit confirmation that no corrections were made

---


# APPENDIX 35 — QA_HANDOFF_v5.2.21_TESTER_CHAT.md

# QA HANDOFF — Driver Pay App v5.2.21

You are the independent QA tester. Test the supplied ZIP; do not modify or correct source.

Read first:
1. `ARCHIVE_AUDIT_v5.2.21.md`
2. `QA_v5.2.21_HEAVY_TEST_PLAN.md`
3. `MASTER_PROJECT_REFERENCE.md`

Then execute the entire heavy QA plan.

Special attention:
- v5.2.20 incorrectly hard-archived a just-closed current week. Verify date-aware two-week soft archive restoration.
- A qualifying Day Off must show weekly-rest context, including `Weekly rest in progress`, applicable 45h target and valid 24h option.
- End Week alone must NOT create premature weekly-rest state if the factual timeline says weekly rest is not due.
- Do not invent or require an exact Saturday/Sunday midnight expiry for the 24h proposal. That timing remains OPEN in this checkpoint.
- Do not accept duplicate archive records, compensation double writes, altered Rest Card colours, changed Pay Engine results, or changed Save & Next semantics.

Report:
- QA STATUS: PASS / FAIL
- technical results
- each plan section A–K
- every defect with exact reproduction and likely source location
- TypeScript/build status separately; environment limitation is not automatically an application defect
- explicit confirmation whether QA changed any source (it must not).

---


# APPENDIX 36 — QA_HANDOFF_v5.2.22_TESTER_CHAT.md

# QA HANDOFF — Driver Pay App v5.2.22

Do a heavy QA pass. **Do not make corrections.** Return a structured PASS/FAIL report with blocking defects and exact reproduction conditions.

Read first:
1. `ARCHIVE_AUDIT_v5.2.22.md`
2. `QA_v5.2.22_HEAVY_TEST_PLAN.md`
3. existing v5.2.20/v5.2.21 QA and weekly-rest regression documents when needed for protected behaviour.

Primary regression to prove:

- A Friday End Week weekly-rest candidate must remain addressable on Saturday of the same Sunday→Saturday pay week when factual due/chronology criteria qualify.
- The candidate must not leak backward before its real Finish.
- Day Off can display the weekly-rest context/proposals without writing Start.
- Day Off → Work hands the same candidate to the existing Start proposal workflow without auto-saving it.
- Today's Saturday in a soft-closed current pay week must not receive historical/archive-like shell styling.

Also run the complete supplied automated suite, TypeScript and fresh production build when the environment permits. Do not introduce a new midnight cutoff for 24h proposals. Do not change old texts or unrelated logic.

---


# APPENDIX 37 — QA_HANDOFF_v5.2.23_TESTER_CHAT.md

DRIVER PAY APP v5.2.23 — TESTER HANDOFF

Execute `QA_v5.2.23_HEAVY_TEST_PLAN.md` completely.

Do not make source corrections during QA.

Intentional architecture change:
- End Week starts an informational weekly-rest candidate from the last real Finish regardless of cycle count.
- Six factual cycles remain the mandatory warning/violation gate.

Simulate the three supplied real-world scenarios, not only source-pattern checks.

Report PASS/FAIL, every failing scenario and root cause, npm test / TypeScript / build status, ZIP/root/version integrity, and confirmation that no source changes were made during QA.

## r2 correction
The previous QA correctly rejected v5.2.23 because version documentation was incomplete and the three mandatory scenarios were not behaviorally simulated.

For this r2 artifact, verify first that:
1. VERSION_INDEX, CHANGELOG and docs/VERSION_HISTORY identify v5.2.23.
2. `scripts/v5-2-23-endweek-weekly-rest-regression-test.mjs` compiles/instruments the actual App.tsx and executes all three concrete scenarios; it must not be accepted if it only checks source patterns.
3. Run `npm ci`, full `npm test`, `npx tsc --noEmit`, and a fresh `npm run build`.
4. Do not make corrections during QA.

---


# APPENDIX 38 — QA_HANDOFF_v5.2.24_TESTER_CHAT.md

# QA Handoff — Driver Pay App v5.2.24

Run the complete `QA_v5.2.24_HEAVY_TEST_PLAN.md`. Do not make corrections.

Critical purpose: verify that the v5.2.23-r2 Scenario 3 failure is fixed without creating a stale-candidate regression. The weekly-rest candidate must survive beyond 72h while continuous rest is still running, then be consumed by the first later factual Work Start. Re-run all prior weekly-rest, compensation, archive/backup and v5.2.20–v5.2.23 regressions.

---


# APPENDIX 39 — QA_HANDOFF_v5.2.25_TESTER_CHAT.md

DRIVER PAY APP v5.2.25 — TESTER HANDOFF

Execute `QA_v5.2.25_HEAVY_TEST_PLAN.md` completely. Do not modify source. Pay special attention to real visible UI ownership after 45h and stale-candidate recovery. Re-run all v5.2.23/v5.2.24 behavioral scenarios.

---


# APPENDIX 40 — QA_HANDOFF_v5.2.26.md

# DRIVER PAY APP v5.2.26 — QA HANDOFF

## Purpose
Road-test correction checkpoint built from v5.2.25.

## Required checks
1. Read `PROTECTED_BEHAVIOURS.md`, especially WR-014 through WR-018.
2. Run the complete `npm test`.
3. Run `npx tsc --noEmit`.
4. Run a fresh `npm run build`.
5. Verify no protected behaviour outside the weekly-rest road-test corrections regressed.
6. Do not modify source during QA.

## v5.2.26 intended corrections
- 45h and 24h weekly-rest proposals show weekday + time.
- Weekly Rest block no longer says `Weekly rest in progress`.
- In mandatory/six-cycle weekly-rest context, factual rest below 24h is red `Weekly rest not completed`, not daily `Reduced rest • Left: N`.
- Factual reduced weekly rest (24h–44h59m) visibly shows compensation due.
- Six-cycle latest legal weekly-rest START deadline is calculated from the end of the previous recognized weekly rest and is displayed separately from 24h/45h completion targets.
- Continuous rest is not reset at Sunday 24:00 / Monday 00:00.

## Local validation status in packaging environment
Partial regression execution passed through v5.2.22 after the intentional old UI-contract tests were aligned with WR-018.
The remaining suites, TypeScript and production build could not be completed because `npm ci` was blocked by the package registry (`yallist-3.1.1` returned 404). Therefore this package is **SOURCE-QA**, not phone-deploy/stable.

A separate Heavy QA PASS is required before phone deployment.

---


# APPENDIX 41 — QA_LOCAL_PRECHECK_v5.2.21.md

# Driver Pay App v5.2.21 — Local Precheck

## Result
**PASS for available automated/source checks.**

## Passed
- Full `npm test` chain.
- Backup/restore round trip, stale replacement and atomic rollback.
- Weekly-rest timeline regression.
- End Week intent regression.
- Timeline compensation creation regression.
- Timeline compensation repayment/chronology regression.
- v5.2.20 UX regression.
- New v5.2.21 soft-archive + weekly-rest visibility regression.
- Version identity source check: 5.2.21 across package, app version, HTML title, manifest and service-worker cache.
- Source scope comparison against v5.2.20: no files removed; functional changes confined to `src/App.tsx`, regression tests, version identity and documentation.

## Environment limitation
A clean dependency install was attempted with a writable cache. The internal QA npm mirror returned HTTP 404 for `yallist-3.1.1.tgz`.

Therefore these could not be independently completed in this environment:
- `npx tsc --noEmit`
- fresh `npm run build`

This is not recorded as an application defect, but production/install approval still requires those checks from an environment with working dependencies.

## Important open rule
No exact Saturday/Sunday midnight cutoff for the 24h reduced weekly-rest proposal is asserted in this checkpoint. The archive confirms only that a valid option is shown and an expired option is hidden. v5.2.21 keeps it through the reduced-rest window and removes it after 45h regular weekly rest is reached.

---


# APPENDIX 42 — QA_LOCAL_PRECHECK_v5.2.22.md

# Driver Pay App v5.2.22 — Local Precheck

Date: 2026-08-08

## Result

PASS — all executable dependency-free automated regressions in this workspace.

`npm test` passed:
- backup/restore round trip;
- weekly-rest timeline;
- End Week intent;
- timeline compensation creation;
- timeline compensation repayment/chronology;
- v5.2.20 UX regression;
- v5.2.21 soft-archive/weekly-rest visibility regression;
- new v5.2.22 same-pay-week weekly-rest + current-day visual regression.

## Environment limitation

A clean dependency install was attempted with a writable cache. The internal QA npm mirror returned 404 for `yallist-3.1.1.tgz`. Therefore local `tsc --noEmit` and fresh Vite build are not claimed here. Independent QA should run them in an environment where dependencies can be installed.

---


# APPENDIX 43 — QA_SOURCE_REPORT_v5.2.16.md

# Driver Pay App v5.2.16 — Source QA Report

Date: 2026-08-02
Base: v5.2.15
Release purpose: Weekly Rest Timeline + End Week Intent Boundary
Status: SOURCE CANDIDATE — PASS, production build still blocked by dependency registry.

## Automated regression

- `npm test`: PASS
  - backup/restore round-trip: PASS
  - stale state replacement: PASS
  - atomic rollback on failed restore: PASS
  - production v2 snapshot/reload source guards: PASS
  - weekly-rest timeline regression: PASS
  - End Week next-day intent regression: PASS
- `npx tsc --noEmit --pretty false`: PASS

## Weekly-rest coverage

- repeated weekday IDs across multiple pay periods: PASS
- factual cross-week chronology: PASS
- five completed work cycles do not activate weekly-rest takeover: PASS
- six completed work cycles can activate timeline-driven weekly-rest Start: PASS
- 45h primary / 24h secondary behaviour guards: PASS
- regular mid-week weekly rest resets cycle: PASS
- reduced mid-week weekly rest resets cycle: PASS
- incomplete touched Work day forces conservative unknown state: PASS
- ownership remains stable after Start is entered: PASS
- timeline ownership blocks legacy compensation path: PASS
- no timeline-driven compensation-ledger create/complete write: PASS

## End Week coverage

- unchanged completed week feedback + no rewrite: PASS
- changed completed week update + no duplicate: PASS
- new completed week creates one archive item: PASS
- when factual timeline is known and weekly rest is not yet due, `Working tomorrow?` branch exists: PASS
- YES opens immediate next calendar day as Work in current Sat-ending model: PASS
- YES carries last known km to that target day only: PASS
- NO preserves legacy Monday/weekly-rest flow: PASS
- existing non-empty Sunday is not silently reclassified by the intent helper: PASS

## Real backup probe

Using `driver-pay-backup-2026-08-08-2026-08-02.json`:

- duplicate archived Saturday/week-ending records: none detected
- Mon 15 Jun 15:20 -> Thu 18 Jun 06:30 = 63h10m factual continuous rest: PASS, recognised as qualifying regular weekly rest
- factual >=24h gaps found across available history: 12

## Version / package integrity

- package.json version: 5.2.16
- package-lock.json version/root package: 5.2.16
- generated `src/version.ts`: 5.2.16
- JSON parse: package.json, package-lock.json, public/manifest.webmanifest: PASS
- `src/App.tsx` hash unchanged by version/test/documentation hardening after the End Week intent change: PASS
- node_modules excluded: PASS
- stale `dist/` absent: PASS

## Production build

BLOCKED BY ENVIRONMENT, NOT COUNTED AS PASS.

- `npm ci --cache /mnt/data/npm-cache-driverpay ...` failed because the internal registry returns 404 for `yallist-3.1.1.tgz`.
- direct `npx vite@5.4.2 build` also failed because the same internal registry could not provide Vite.
- No production `dist/` is approved or included until a fresh build succeeds from this exact source.

## Release discipline restored

From v5.2.16 onward:

- every functional/source change advances the version before handoff;
- materially different checkpoints must not share one version number;
- ZIP/checkpoint names include both version and a short descriptive purpose;
- QA-only retests of unchanged source may keep the same version, but any source correction discovered by QA advances the version.

---


# APPENDIX 44 — QA_SOURCE_REPORT_v5.2.17.md

# Driver Pay App v5.2.17 — Source QA Report

## Scope
First, narrow compensation integration for the factual cross-week weekly-rest timeline.

## Intended new behaviour
- A factual reduced weekly rest (24h to <45h) ending at a real entered Start creates one outstanding compensation obligation.
- Owed amount is exactly 45h minus the factual rest.
- A regular weekly rest (45h+) creates no compensation debt.
- Re-evaluating the same factual rest does not duplicate the obligation.
- Separate reduced weekly rests remain separate obligations.

## Explicitly out of scope
- No new timeline-driven compensation completion/repayment logic.
- No Start helper changes.
- No End Week behaviour changes.
- No automatic Day Off changes.
- No storage migration or new storage key.

## Validation performed
- `tsc --noEmit`: PASS.
- `npm test`: PASS.
  - dedicated `test:timeline-compensation`: PASS.
  - backup/restore round-trip: PASS.
  - weekly-rest timeline regression: PASS.
  - End Week next-day intent regression: PASS.
- New regression cases: exact 10h debt from 35h rest, no duplicate on repeat evaluation, 45h regular rest creates no debt, separate reduced rests create separate debts.

## Build
Fresh Vite production build is not claimed in this source checkpoint because the current environment does not have the project Vite dependency installed.

---


# APPENDIX 45 — QA_SOURCE_REPORT_v5.2.18.md

# Driver Pay App v5.2.18 — Source QA Report

Status: **PASS for local source checkpoint**

## Change under test

v5.2.18 adds only timeline-owned completion of one already-existing weekly-rest compensation obligation from the factual continuous rest that ends at a real Start.

The v5.2.17 factual reduced-weekly-rest debt-creation path remains separate and unchanged.

## Local checks completed

- `npm test` — PASS
  - backup/restore regression — PASS
  - weekly-rest timeline regression — PASS
  - End Week intent regression — PASS
  - v5.2.17 timeline compensation creation regression — PASS
  - v5.2.18 timeline compensation repayment regression — PASS
- `tsc --noEmit` — PASS
- Version identity — 5.2.18
- Source rollback file retained: `src/App.tsx.before-v5.2.18-timeline-compensation-repayment`

## Repayment cases covered

- 18h continuous rest does not complete a 10h compensation obligation.
- 19h completes a 10h obligation in one indivisible step.
- 21h and 55h are also sufficient for a 10h obligation.
- No partial remaining balance is written.
- Completion is rejected when the Start is not after the obligation source boundary.
- Completion is rejected after the stored deadline.
- One factual continuous rest completes at most one obligation.
- Earliest deadline wins; ties use the older source boundary.
- Editing the Start that ends the same continuous rest cannot spend the same rest on a second obligation.
- A debt created at the current Start cannot complete itself.
- An older eligible obligation may complete on the same factual rest while a newly-created current-rest obligation stays outstanding.
- Already-completed obligations remain unchanged.

## Deliberately unchanged

- Start behaviour
- Finish behaviour
- End Week behaviour
- Day Off / Holiday behaviour
- Pay Engine
- Archive calculations
- v5.2.17 timeline debt-creation rules
- legacy compensation path when timeline ownership is not active

## Open item carried forward

**Monday Start proposal after End Week** remains unresolved by design.

Reference from stable v5.2.15 is documented in `QA_TIMELINE_COMPENSATION_REPAYMENT_v5.2.18.md`. No attempt was made to restore or redesign that behaviour.

## Production build status

A local fresh Vite production build is **not confirmed** because the current environment has no local/global `vite` binary and dependency installation has previously been blocked by package-registry availability.

Do not call this a production release until an independent fresh build succeeds from this source.

---


# APPENDIX 46 — QA_SOURCE_REPORT_v5.2.19.md

# QA Source Report — v5.2.19

Version purpose: compensation repayment chronology guard.

Source change: a repayment rest is eligible only if its calculated start boundary is at or after the compensation obligation source boundary. This prevents rest time that occurred before the debt existed from being used as compensation.

Automated regression coverage includes the previously missed spanning-rest case (`restStartAbs < sourceStartAbs < enteredStartAbs`) and a valid control case where the rest starts after the debt arose.

Monday Start proposal after End Week remains an open item and is intentionally unchanged.

Production `dist` remains excluded from source QA checkpoints until a fresh build can be produced from approved source.

---


# APPENDIX 47 — QA_SOURCE_REPORT_v5.2.20.md

# QA Source Report — v5.2.20

Local source checks performed before packaging:
- `npm test`: PASS, including backup/restore, weekly-rest timeline, End Week intent, compensation creation, compensation repayment and new v5.2.20 UX/validation regression.
- ZIP not yet evaluated at the time this source report was written; package integrity is checked after packaging.
- Independent TypeScript validation: NOT CONFIRMED because local node_modules/tsc is unavailable in this environment.
- Fresh Vite build: NOT CONFIRMED for the same dependency-availability reason.

This is a source QA candidate, not production release approval.

---


# APPENDIX 48 — QA_TIMELINE_COMPENSATION_CREATE_v5.2.17.md

# Driver Pay App v5.2.17 — Timeline Reduced Weekly Rest Debt Creation QA

## Scope
Test only the first timeline/compensation integration step.

## Must pass
1. A factual reduced mid-week weekly rest from 24h to less than 45h creates one outstanding compensation obligation only after a later real Start proves the rest duration.
2. Exact debt = 45h minus actual factual rest.
3. 24h rest creates 21h debt.
4. 35h rest creates 10h debt.
5. 45h or longer regular weekly rest creates no debt.
6. Re-evaluating the same factual rest does not create a duplicate.
7. The same factual rest must not duplicate if both timeline and legacy source paths can describe it.
8. Two distinct reduced weekly rests create two separate obligations.
9. New obligation starts outstanding; no partial amount and no completed metadata are stored.
10. No new timeline-driven compensation completion/repayment logic is introduced in this version.
11. Weekly-rest timeline, End Week intent, backup/restore, Start helper, day state, Pay Engine and Archive regressions remain green.

## Automated checks
- npm test
- tsc --noEmit

## Production build
A fresh Vite production build is required before any production-release approval. This source checkpoint does not claim a fresh production build.

---


# APPENDIX 49 — QA_TIMELINE_COMPENSATION_REPAYMENT_CHRONOLOGY_v5.2.19.md

# Driver Pay App v5.2.19 — Compensation Repayment Chronology QA

## Scope

This version changes only repayment chronology eligibility discovered by external QA of v5.2.18.

## Required rule

A compensation debt may be completed by a continuous rest only when the rest itself begins at or after the debt arose.

Required eligibility:

- `restStartAbs >= sourceStartAbs`
- `enteredStartAbs > sourceStartAbs`
- current date is on/before the saved deadline
- the rest is long enough for the full indivisible compensation block

A rest that begins before the debt boundary and merely ends after it must not repay that debt.

## Regression scenario added

- debt arises 10h before entered Start
- candidate rest is 19h long
- therefore candidate rest began 9h before the debt existed
- expected: debt remains outstanding

Control scenario:

- debt arose before the candidate rest began
- 19h rest for a 10h obligation
- expected: debt completes

## Unchanged behaviour

No changes to Start, Finish, End Week, day state, Pay Engine, Archive, debt creation, partial-credit rules, FIFO ordering, deadline convention, self-completion protection, or rest-reuse protection.

## Open item — do not change yet

Monday Start proposal after End Week remains unresolved. v5.2.15 behaviour is retained only as historical reference. Do not restore or alter current behaviour until explicitly decided.

---


# APPENDIX 50 — QA_TIMELINE_COMPENSATION_REPAYMENT_v5.2.18.md

# Driver Pay App v5.2.18 — Timeline Compensation Repayment QA

## Scope

This version adds only the second timeline compensation step: when the factual weekly-rest timeline owns the current Start decision, a real continuous rest may complete one already-existing weekly-rest compensation obligation.

It does **not** add partial repayment, does not change debt creation from v5.2.17, and does not change Start / Finish / End Week / Pay Engine / Archive behaviour.

## Required behaviour

- Compensation remains indivisible.
- A 10h debt is not reduced by an 18h rest.
- A 19h continuous rest may complete a 10h debt (9h base + 10h compensation).
- 21h and 55h qualifying continuous rests may also complete the same 10h debt.
- Completion must be after the obligation was created.
- Completion must be on or before the saved deadline.
- One factual rest completes at most one obligation, including after editing the Start that ends the same continuous rest.
- When more than one obligation is eligible, the earliest deadline has priority; ties use the older source boundary.
- A debt created by the current factual reduced weekly rest cannot immediately complete itself because its sourceStartAbs equals the current Start.
- An older eligible debt may be completed by that same factual rest while the newly-created debt remains outstanding.
- No partial balance is stored.

## Regression scope

Also run the existing:
- backup/restore suite;
- weekly-rest timeline suite;
- End Week intent suite;
- v5.2.17 timeline debt-creation suite.

## Open item — Monday Start proposal after End Week

This is intentionally **not changed in v5.2.18**.

Reference behaviour observed in stable v5.2.15:
- if Finish + 45h falls on Monday, the Start field can show that weekly-rest Start proposal;
- if the 45h target has already passed before Monday begins, the Start field may remain without a time proposal and the helper may show when weekly rest ended.

The desired future behaviour still requires explicit product discussion. Do not restore, remove, or redesign it by assumption.

---


# APPENDIX 51 — QA_v5.2.20_HEAVY_TEST_PLAN.md

# DRIVER PAY APP v5.2.20
## UX / WEEKLY REST START WARNINGS / ARCHIVE END WEEK — HEAVY QA PLAN

STATUS: SOURCE QA CANDIDATE. Do not approve as stable until this plan passes.

## NON-NEGOTIABLE SCOPE
v5.2.20 changes only the four discussed areas below. Do not "improve", rewrite, rename, or reinterpret unrelated behaviour during QA.

1. Weekly-rest Start warning reason text using the EXISTING red Start-field violation presentation.
2. Archived/closed-week End Week guard and more readable existing End Week feedback.
3. Start km suggestion becomes visually accepted after Finish km is entered.
4. A previously saved/completed day in the active week gets archive-like screen styling while remaining editable.

Explicitly unchanged:
- Existing daily-rest warning text and logic.
- Existing Start/Finish workflow.
- Existing 9h/11h helper texts.
- Weekly-rest timeline engine and cycle counting.
- Compensation creation/repayment/chronology logic.
- Rest Card three-colour system and its thresholds/palette.
- Pay Engine, tax, pension, bonuses, allowances, profiles and archive calculations.
- Save & Next semantics.
- Working tomorrow? behaviour for a CURRENT active week.
- Monday Start proposal after End Week remains an OPEN ITEM and must not be changed in QA.
- Custom End Week/work-week pattern remains out of scope.

## A — WEEKLY REST START WARNING PRESENTATION

A1 — Existing daily-rest violation regression
- Create a normal daily-rest violation covered by the existing logic.
- Enter a Start before the existing legal daily-rest boundary.
Expected:
- Start field uses the same existing red violation presentation.
- Existing text remains exactly `Rest not completed` in English.
- No new weekly-rest text appears for an ordinary daily-rest case.
- Rest Card colours/labels remain exactly as before v5.2.20.

A2 — Six completed cycles, attempted next cycle before minimum weekly rest
- Establish a known factual timeline with a qualifying prior weekly rest.
- Complete exactly six work cycles after it.
- On the next Work day enter Start before 24h have elapsed from the last real Finish.
Expected:
- Start field uses the SAME red presentation as the existing Start violation.
- English reason: `Weekly rest required`.
- Start value remains a real editable entered value; warning is visual, not a new blocking workflow.
- No change to the Rest Card three-colour system.

A3 — Legacy weekly-rest candidate incomplete
- Use a state where the existing legacy weekly-rest candidate owns validation (timeline path not owner).
- Enter Start before the existing 24h reduced-weekly-rest minimum boundary.
Expected:
- Same red Start-field violation presentation.
- English reason: `Weekly rest not completed`.
- No old text is removed or renamed.

A4 — Valid 24h reduced weekly rest
- Six completed cycles.
- Start at or after the existing 24h reduced weekly-rest boundary and before 45h.
Expected:
- No red weekly-rest Start violation.
- Existing reduced weekly-rest recognition/compensation behaviour remains unchanged.
- 45h remains the primary proposal and 24h remains the secondary valid option where the existing engine says so.

A5 — Valid 45h+ weekly rest
Expected:
- No Start violation.
- Existing regular weekly-rest behaviour unchanged.

A6 — Off -> Work interruption regression
- A future/current day is Off during a rest period.
- Change it back to Work.
- Enter a valid Start after normal legal conditions.
Expected:
- No artificial block caused by the Off -> Work transition.
- Factual rest is classified from real Finish -> real Start as before.

A7 — Incomplete chronology regression
Expected:
- Existing conservative unknown/fallback behaviour remains unchanged.
- v5.2.20 warning presentation must not make uncertain chronology appear certain.

## B — REST CARD MUST NOT CHANGE

B1 — 11h+ daily rest retains existing green/success treatment.
B2 — 9h to under 11h retains existing reduced/yellow treatment where applicable.
B3 — Under-9h retains existing red/violation treatment.
B4 — Empty/suggested/future Start states retain their established neutral/factual behaviour.
B5 — Weekly Rest card/helper colours, compensation block, labels and thresholds are unchanged.

FAIL v5.2.20 if any Rest Card palette/threshold/wording changed as a side effect.

## C — ARCHIVED/CLOSED WEEK END WEEK GUARD

C1 — Closed archived week, no changes
- Open an already completed/saved archived week.
- If needed, unlock only as the existing UI requires; do not change data.
- Open Week View and press End Week / confirm.
Expected:
- `Working tomorrow?` NEVER appears.
- No next-day intent is requested.
- No active-day movement occurs.
- No archive duplicate is created.
- No archive rewrite occurs.
- Feedback: `Week already saved. No changes.`

C2 — Closed archived week, real correction
- Change one permitted field in an existing archived week.
- End Week/save correction through the existing flow.
Expected:
- `Working tomorrow?` NEVER appears.
- Existing archive entry is updated, not duplicated.
- Feedback: `Changes saved. Week updated.`
- Active current-week pointer is not moved by the archive correction.

C3 — New current active week completion
Expected:
- Existing current-week End Week behaviour remains unchanged.
- `Working tomorrow?` can still appear ONLY where the pre-v5.2.20 current-week rule says it should.
- New archive record count is exactly one.
- Feedback remains `Week completed.`

C4 — Feedback readability
For all three existing feedback messages:
- visibly larger than v5.2.19 toast;
- remains on screen approximately 4.5 seconds;
- readable on phone;
- no modal redesign or new wording.

## D — START KM SUGGESTION ACCEPTANCE

D1 — Suggested Start km, no Finish km
Expected:
- Start km suggestion remains grey/faded with existing source helper.

D2 — Enter any Finish km while Start km is still the carried suggestion
Expected:
- Start km immediately becomes normal dark/black visual value.
- Suggestion helper disappears.
- Start km remains editable.
- No value is silently changed.

D3 — Finish km equals suggested Start km (zero km driven)
Expected:
- Start km STILL becomes dark/accepted after Finish km is entered.
- This is a key regression case; equality must not leave the Start km grey.

D4 — Edit accepted Start km afterward
Expected:
- Edited real value remains dark.
- KM run recalculates from the edited value through existing logic.

D5 — Clear Start km manually
Expected:
- Existing suppress/re-suggestion behaviour remains unchanged except for the explicit Finish-km acceptance rule above.

## E — PAST SAVED DAY VISUAL IN ACTIVE WEEK

E1 — Save & Next
- Complete a current-week day.
- Press Save & Next; app moves to next workflow day.
- Navigate back to the completed prior day.
Expected:
- Whole screen uses the archive-like grey surface treatment.
- It is visually distinct from the current active day.
- It is NOT a true archive state.
- No ARCHIVE lock banner is introduced just because this is a past saved day.
- Fields remain editable under the normal current-week rules.

E2 — Return to current workflow day
Expected:
- Normal active-week visual styling returns.

E3 — Incomplete earlier day
Expected:
- An incomplete day must not be styled as a saved/archive-like past day solely because it is earlier in navigation.

E4 — True archived week
Expected:
- Existing archive banner/watermark/lock behaviour remains controlled by real archive state.
- Past-day visual logic must not weaken archive locking.

## F — FULL REGRESSION

Run every existing automated suite and verify:
- backup/restore round trip;
- complete restore identical logical state;
- stale state replacement;
- failed restore atomic rollback;
- weekly-rest timeline 5/6 cycle tests;
- mid-week regular/reduced weekly rest;
- incomplete Work chronology fallback;
- timeline ownership after Start;
- End Week intent Yes/No for active current week;
- compensation debt creation;
- compensation repayment 18h/19h/21h/55h boundaries;
- repayment deadline and chronology;
- FIFO and rest reuse protection;
- timeline/legacy isolation;
- archive duplicate protection.

Required command: `npm test`

If dependencies are available, also run:
- `npx tsc --noEmit`
- fresh `npm run build`

If dependencies are unavailable, report these as ENVIRONMENT LIMITATION, not PASS and not source defect.

## FINAL APPROVAL RULE
Do not approve v5.2.20 as a stable source baseline if ANY of the following occurs:
- old warning text changed unexpectedly;
- Rest Card three-colour system changed;
- archived week can ask Working tomorrow?;
- Start km remains grey after Finish km entry;
- archive-like past active-week day becomes locked;
- compensation/timeline/pay/archive regression fails;
- any archive duplicate appears.

---


# APPENDIX 52 — QA_v5.2.21_HEAVY_TEST_PLAN.md

# Driver Pay App v5.2.21 — Heavy QA Plan

## Rule for tester
Test the supplied source exactly as provided. Do not correct source during QA. Report PASS/FAIL with evidence. Any source correction requires a new version.

## A — Technical / integrity
1. ZIP integrity and expected root structure.
2. Version identity is 5.2.21 everywhere: package, UI/version constant, title, manifest, service-worker cache, docs.
3. Run full `npm test`.
4. Run `npx tsc --noEmit` if dependencies are available.
5. Run a fresh Vite production build if dependencies are available.
6. Confirm QA itself made no source changes.

## B — Soft archive / hard archive restoration
1. **Critical real scenario:** on Saturday, open the week ending that same Saturday after it was End Week'd Friday. It must be soft/editable; no `Unlock editing` requirement.
2. Change Saturday `Day Off → Work`, enter valid Start/Finish and save. Verify normal editing is possible.
3. End/save the changed closed week again. It must update the existing archive record, not duplicate it. Expected feedback: `Changes saved. Week updated.`
4. Closed week with no changes returns `Week already saved. No changes.` and does not rewrite/duplicate.
5. Immediately previous pay week remains soft/editable.
6. A week older than the two-week soft window is hard archive and retains Unlock/edit protections.
7. A future week closed early as Holiday/Day Off remains soft while it is future/near-current.
8. Soft archive must not move the active-week pointer unexpectedly.
9. Hard archive must retain existing no-autosave / explicit correction-save protections.
10. An already closed soft week must never ask `Working tomorrow?` on repeat End Week.

## C — Pay-week boundary
1. Current model remains Sunday→Saturday.
2. Saturday work belongs to the pay week ending that Saturday.
3. Sunday work belongs to the next pay week.
4. Weekly-rest chronology may continue across that boundary.
5. No custom week-boundary Setup behaviour is introduced in this version.

## D — Weekly-rest due gate
1. Five completed work cycles: weekly-rest timeline must not take over.
2. End Week before weekly rest is due: do NOT show a premature weekly-rest proposal/context merely because End Week was pressed.
3. Six completed work cycles / otherwise qualifying factual state: weekly-rest path may become active.
4. Incomplete touched Work day still makes the relevant timeline unknown and triggers conservative fallback.
5. Timeline ownership remains stable after Start entry.

## E — Weekly-rest visibility on Day Off
1. Select/land on a Day Off where weekly rest is factually due/in progress.
2. The Rest area must explicitly show `Weekly Rest`.
3. It must show `Weekly rest in progress` (or Bulgarian `Тече седмична почивка`).
4. If a regular 45h target is available, show its actual calculated day/time.
5. If a reduced 24h option is valid, show its actual calculated day/time as the secondary option.
6. The display is informational only: it must not save a Start or mark a factual completed rest.
7. Switch the same Day Off to Work. The actionable weekly-rest proposal returns to the existing Start-field workflow; do not create a competing second actionable proposal.

## F — 24h / 45h proposal lifecycle
1. Before the 24h threshold: correct active target/proposal state.
2. At/after 24h but still below 45h: valid reduced 24h information must not disappear merely because the 24h minimum has been reached.
3. At/after 45h: regular weekly rest is reached; stale reduced 24h option must not remain as the active alternative.
4. If 45h has become unavailable under the existing engine, retain existing minimal helper `45h unavailable`.
5. Do not reintroduce `6 working days completed`.
6. **Do not fail this build for a Saturday/Sunday midnight cutoff.** Exact midnight expiry is an OPEN decision, not approved behaviour in v5.2.21.
7. Once the relevant weekly-rest endpoint is passed before a real Start, `Weekly rest ended` must show the factual day/time according to existing engine rules.
8. After real Start, proposal/end messaging disappears and Rest Card displays factual result.

## G — Rest Card / warnings unchanged
1. Normal daily rest green behaviour unchanged.
2. Reduced daily rest yellow behaviour unchanged.
3. Rest violation red behaviour unchanged.
4. Weekly rest 45h+ green and 24h–44:59 reduced/yellow facts remain unchanged after real Start.
5. Existing Start violations remain: `Rest not completed`, `Weekly rest required`, `Weekly rest not completed`.
6. No colour-semantic change.

## H — Compensation regression
Run all existing compensation suites and verify:
- reduced weekly-rest debt creation exact;
- no debt for 45h+;
- indivisible repayment;
- 18h fails / 19h, 21h, 55h boundaries remain correct where applicable;
- chronology/deadline guards;
- FIFO;
- one factual rest cannot be reused;
- timeline/legacy isolation;
- no double ledger mutation.

## I — v5.2.20 UX regression
1. Start km suggestion remains grey until accepted by the approved workflow; after Finish km it becomes dark/accepted and remains editable.
2. Completed earlier day in the active week remains archive-like visually but editable.
3. True hard archive remains visually distinct and locked until explicit unlock.
4. Archive/closed-week feedback remains readable for 4500ms with accepted wording.
5. Existing archive End Week guard remains: no `Working tomorrow?` in archive/closed correction flow.

## J — Backup / restore / history
1. Complete backup→restore identical logical storage.
2. Stale destination state is replaced, not merged.
3. Failed restore rolls back atomically.
4. Archive snapshots/historical rates do not silently change.
5. No duplicate archived week after closed-week correction.

## K — Pay / navigation untouched
1. Weekday, Saturday, Sunday pay unchanged.
2. OT, bonuses, Night Out, allowances unchanged.
3. Gross/PAYE mode unchanged.
4. Save & Next meaning/navigation unchanged.
5. Off→Work remains allowed when the week is soft-editable.

## Acceptance
v5.2.21 can be accepted as a source baseline only if all executable regressions pass and no blocking behaviour defect is found. Production/install approval additionally requires clean TypeScript validation and a fresh production build from the approved source.

---


# APPENDIX 53 — QA_v5.2.22_HEAVY_TEST_PLAN.md

# Driver Pay App v5.2.22 — Heavy QA Plan

## QA rule

Do not correct source during this QA pass. Report defects only. Treat v5.2.22 as a source checkpoint until all blocking tests pass.

## A — Technical / integrity

1. ZIP integrity.
2. Version identity is 5.2.22 everywhere: package, lockfile, source version, HTML title, manifest, service-worker cache, VERSION_INDEX, CHANGELOG and version history.
3. Run `npm ci` if environment permits.
4. Run full `npm test`.
5. Run `npx tsc --noEmit` if dependencies are available.
6. Run a fresh Vite production build if dependencies are available.
7. Confirm QA itself made no source changes.

## B — Friday End Week → same Saturday candidate

Create a factual timeline where weekly-rest ownership/due criteria are valid and the last real Finish is on Friday.

1. Close/End Week on Friday so the candidate uses the Saturday ending date of that same pay week.
2. Navigate to Saturday of that same pay week.
3. Candidate must NOT disappear merely because selected Saturday equals candidate closing Saturday.
4. The existing chronology gate must still require Saturday to be after the real Finish.
5. Applicable weekly-rest information/proposals must remain derived from that same factual Finish.
6. Do not create a Start automatically.

Control tests:
- Monday–Friday before the candidate Finish must not receive the candidate retrospectively.
- Sunday belongs to the following pay week, while chronological rest continues from the same real Finish.

## C — Day Off weekly-rest visibility

For a qualifying Saturday Day Off with no real Start:

- show Weekly Rest context;
- show `Weekly rest in progress` when the running rest meets that state;
- show the calculated 45h target when applicable;
- show the valid 24h reduced option when applicable;
- keep all of this informational only;
- no `day.start` write;
- no completed-rest fact before a real Start.

Change `Day Off → Work`:

- the same factual candidate remains available;
- the Start area takes proposal responsibility;
- proposal remains suggestion, not saved fact;
- no duplicate competing proposal path appears.

## D — Weekly-rest due gate remains protected

- Five completed factual cycles must not become weekly-rest due merely because End Week was pressed.
- Six completed cycles may activate timeline-owned weekly rest.
- Incomplete touched Work chronology remains conservative/unknown.
- Timeline ownership remains stable after real Start.
- Legacy End Week fallback remains blocked when a known factual timeline says weekly rest is not due.

## E — 24h / 45h lifecycle

Preserve accepted behaviour:

- 45h weekly-rest proposal when applicable;
- valid 24h reduced weekly-rest alternative when applicable;
- expired/obsolete 24h proposal hidden according to existing engine;
- at 45h regular weekly rest, reduced alternative must not remain the active reduced proposal;
- `Weekly rest ended [day/time]` may appear before real Start when relevant;
- after real Start, factual Rest Card takes over.

Do NOT require or invent a Saturday/Sunday midnight cutoff. Exact midnight expiry remains an OPEN product decision.

## F — Current-day visual after soft close

Using the real current pay week ending Saturday:

1. End Week on Friday.
2. Open today's Saturday while it is still Saturday.
3. Today must use normal active-day visual styling, not archive-like grey shell styling.
4. Saturday remains editable without hard-archive Unlock.
5. Change Day Off → Work and verify active visual remains normal.

Controls:
- a past completed/saved day may retain archive-like visual distinction;
- a past day in a soft-closed week may use soft historical styling;
- a true hard archive retains archive banner/watermark/lock/unlock behaviour;
- a future soft-closed day must not be styled as historical merely because the week is closed.

## G — Soft/hard archive regression

- current closed pay week remains soft/editable;
- immediately previous pay week remains soft/editable according to protected lifecycle;
- genuinely older historical week remains hard archive;
- correction updates existing archive item, no duplicate;
- unchanged week returns existing no-change feedback;
- correction does not move active-week pointer;
- closed/archive correction does not ask `Working tomorrow?` again.

## H — Rest Card / warnings unchanged

Verify no semantic changes to:

- normal daily rest green;
- reduced daily rest yellow;
- violation red;
- 45h+ weekly rest green;
- 24h–44h59m reduced weekly rest classification after factual Start;
- `Rest not completed`;
- `Weekly rest required`;
- `Weekly rest not completed`;
- three-colour Rest Card system.

## I — Compensation regression

Run all existing creation/repayment suites:

- exact debt creation;
- no debt for 45h+ regular rest;
- indivisible repayment;
- 18h/19h/21h/55h boundaries;
- chronology and deadline guards;
- FIFO;
- one factual rest cannot be reused;
- timeline/legacy isolation;
- no double ledger mutation.

## J — v5.2.20/v5.2.21 regression

Retest:

- Start KM suggestion/accept visual behaviour;
- completed earlier-day archive-like but editable visual;
- backup/restore atomicity;
- End Week archive duplicate protection;
- existing archive feedback wording and timeout;
- Pay Engine, weekend rates, OT, bonuses, Night Out, allowances, Gross/PAYE untouched;
- Save & Next meaning/navigation untouched;
- Off → Work remains editable in a soft week.

## K — Physical-phone road test requested after source QA

Use the exact scenario that exposed v5.2.21:

- Friday End Week;
- Saturday is still today's calendar day;
- Saturday Day Off: weekly-rest context/proposals visible if factual criteria qualify;
- Saturday Day Off → Work: proposals remain available in Start workflow;
- screen does not look archived merely because the week was closed;
- no Start is silently saved.

## Approval rule

PASS as source checkpoint only if no blocking regression is found. Production/install approval requires clean TypeScript/build from the approved source plus the real-device Saturday workflow confirmation.

---


# APPENDIX 54 — QA_v5.2.23_HEAVY_TEST_PLAN.md

# Driver Pay App v5.2.23 — Heavy QA Plan

Do not correct source during QA. Report defects only.

## Technical
- ZIP/root/version identity = v5.2.23 everywhere.
- npm ci.
- npm test.
- npx tsc --noEmit.
- fresh npm run build.
- source hashes unchanged after QA.

## Scenario 1 — Normal End Week
With fewer than six factual cycles, complete a normal Monday–Friday week, press End Week Friday, and mark remaining days Off.
Verify Saturday shows Weekly Rest, candidate anchored to Friday Finish, 45h primary target and valid 24h secondary option. No `Weekly rest required` warning merely because End Week was pressed. No Start is silently saved.

Change Saturday Off → Work before 24h. Verify normal daily-rest validation decides legality and no false weekly-rest violation/debt is created.

## Scenario 2 — Mid-week weekly rest + weekend work
Create factual 45h+ weekly rest Tuesday–Thursday, then Work Friday/Saturday, press End Week Saturday, change Sunday Off → Work.
Verify the earlier factual rest remains cycle anchor, cycle count is correct, End Week creates a new informational candidate from Saturday Finish, Sunday proposal is visible, and an early-but-daily-legal Start is not falsely treated as weekly-rest violation.

## Scenario 3 — Rest already accrued before End Week
Finish Wednesday; Thursday/Friday/Saturday Off; press End Week Saturday.
Verify anchor stays Wednesday Finish, accrued hours are retained, no restart at button press, passed 45h endpoint uses existing `Weekly rest ended [day/time]` context, and Sunday Start is allowed if factual rest is sufficient.

## Six-cycle mandatory warning
Create factual weekly-rest anchor followed by exactly six completed work cycles without relying on End Week. Verify timeline ownership activates, early Start uses existing red warning presentation and `Weekly rest required`, and ownership remains stable after Start.

## Regression
Run backup/restore, weekly timeline, End Week intent, compensation creation/repayment/chronology, v5.2.20, v5.2.21, v5.2.22, v5.2.23, Pay Engine, archive feedback/duplicate protection, Start KM and past-saved-day visual checks.

PASS only if all three End Week scenarios and the six-cycle warning scenario pass without weakening factual chronology, compensation or archive protections.

==================================================
R2 QA COVERAGE CORRECTION
==================================================

The first v5.2.23 package was rejected because `scripts/v5-2-23-endweek-weekly-rest-regression-test.mjs` performed source-pattern checks only.

In r2 the same test now MUST:

- compile an instrumented copy of the actual `src/App.tsx` in memory using the installed build toolchain;
- execute the real App.tsx helper functions;
- instantiate concrete DayRecord states;
- seed/read the real weekly-rest candidate storage path;
- execute the three mandatory scenarios and assert anchors, 24h/45h targets, cycle state, Off → Work unsaved Start behaviour, daily-rest legality separation and factual weekly-rest recognition;
- leave the on-disk application source unchanged.

QA must inspect the test and confirm it is not merely regex/source-pattern validation.

---


# APPENDIX 55 — QA_v5.2.24_HEAVY_TEST_PLAN.md

# Driver Pay App v5.2.24 — Heavy QA Plan

## Mandatory technical checks
- ZIP/root integrity and complete v5.2.24 identity.
- `npm ci`
- full `npm test`
- `npx tsc --noEmit`
- fresh `npm run build`
- source hashes unchanged by QA.

## Mandatory behavioral scenarios
1. Re-run v5.2.23 Scenario 1: normal Mon–Fri, End Week Friday, Saturday Off/Work; 45h primary, 24h secondary, no false required warning, no silent Start.
2. Re-run Scenario 2: factual mid-week 45h+ rest, Fri/Sat work, End Week Saturday, Sunday Off→Work; earlier factual rest remains cycle anchor, new informational candidate from Saturday Finish, no false violation.
3. Re-run Scenario 3: Wednesday Finish, Thu/Fri/Sat Off, End Week Saturday, inspect Sunday. Candidate remains Wednesday-anchored beyond 72h; `Weekly rest ended [day/time]` remains available; Sunday Start establishes factual 45h+ weekly rest from Wednesday Finish.
4. Candidate-consumption regression: after Scenario 3 Sunday receives a real Work Start, inspect Monday before Start. The old Wednesday End Week candidate must not reappear.

## Protected regressions
- Six-cycle `Weekly rest required` warning remains.
- Timeline ownership, incomplete chronology fallback, compensation create/repay/chronology/FIFO/rest reuse.
- v5.2.20 UX, v5.2.21 soft archive, v5.2.22 current-day/same-pay-week behavior.
- Backup/restore, archive duplicate protection, Save & Next, KM and Pay Engine protected paths.

## QA rule
Do not correct code during QA. Report PASS/FAIL with exact failing scenario and source location.

---


# APPENDIX 56 — QA_v5.2.25_HEAVY_TEST_PLAN.md

# Driver Pay App v5.2.25 — Heavy QA Plan

Do not correct source during QA. Report PASS/FAIL only.

## Mandatory
1. ZIP/root/version identity.
2. `npm ci`, full `npm test`, `npx tsc --noEmit`, fresh `npm run build`.
3. Re-run v5.2.23 Scenarios 1–3 and v5.2.24 candidate-consumption regression.
4. Candidate freshness: stale older stored candidate + saved immediate previous week => newer previous-week anchor must win.
5. Work day before 24h: Weekly Rest context visible; 45h primary and 24h secondary present; no Start auto-save.
6. Work day 24h–44h59m: Weekly Rest visible; 45h primary and 24h reduced option visible.
7. Work day after 45h with no Start: Weekly Rest context MUST remain visible even though secondary helper may be empty; Start hint must retain `Weekly rest ended [day/time]`.
8. Day Off: weekly-rest informational context remains visible when applicable.
9. `Day Off → Work`: proposal persists; no Start is silently saved.
10. Six cycles still produce existing `Weekly rest required`; fewer cycles do not suppress End Week candidate.
11. Soft archive: a non-current soft archived week exposes direct `Go to current week`; current day/true hard archive semantics unchanged.
12. Pay Engine, compensation, backup/restore, archive duplicate protection, Start KM and current-day visual regressions remain green.

## Road-test contract to inspect in source/render path
The visible Work-day Weekly Rest card must be gated by existence of `weeklyRestPlan`, NOT by `weeklyRestPlan.helper`.

---


# APPENDIX 57 — QA_WEEKLY_REST_RETEST_HANDOFF.md

# DRIVER PAY APP v5.2.15 — WEEKLY REST TIMELINE QA RETEST HANDOFF

This is a **source QA checkpoint**, not a production release.

## What changed after the first FAIL

1. **Cross-week timeline fix**
   - Weekly-rest timeline processing now keeps every dated day across multiple weeks/pay periods.
   - It no longer treats `mon/tue/wed/...` IDs as globally unique.

2. **Incomplete Work conservative fallback fix**
   - A touched Work day without a valid Finish after the latest recognized weekly rest makes the new cycle state unknown.
   - Completed shifts after that ambiguity must not reactivate the new timeline-driven weekly-rest path.

3. **Automated regression coverage added**
   - `npm test` now includes both backup/restore and weekly-rest timeline regression scripts.

## Required QA focus

Re-run the full `QA_WEEKLY_REST_TIMELINE_TEST_PLAN.md`.

Priority checks:
- repeated weekday IDs across more than one week are all processed;
- 5 completed cycles do not trigger timeline weekly-rest takeover;
- 6 completed cycles can trigger the timeline weekly-rest Start path;
- regular mid-week weekly rest resets the cycle;
- reduced mid-week weekly rest is recognized as reduced;
- touched/incomplete Work makes the timeline path conservative/unknown;
- unchanged End Week does not create a new archive item;
- changed End Week updates the existing item;
- new End Week creates exactly one item.

## Local verification already completed

- `node scripts/weekly-rest-timeline-test.mjs` — PASS
- `node scripts/backup-restore-roundtrip-test.mjs` — PASS
- `tsc --noEmit --pretty false` — PASS

## Production build / dist status

The previous QA correctly identified that the old `dist/` bundle pre-dated the new source changes.

A fresh Vite build could not be produced in the current environment because `npm ci` is blocked by an internal registry 404 for `yallist-3.1.1.tgz`.

Therefore this QA handoff intentionally **omits `dist/`** rather than shipping a known stale production bundle. Do not treat absence of `dist/` as a source defect. If the QA environment can install dependencies, perform a fresh build there and verify that generated output comes from this source checkpoint.

No production release should be approved until a fresh build succeeds.

---


# APPENDIX 58 — QA_WEEKLY_REST_RETEST_HANDOFF_02.md

# Driver Pay App v5.2.15 — Weekly Rest Timeline QA Retest 02

Purpose: verify the remaining blocking defect from the previous QA retest is fixed without introducing new behaviour.

## Blocking defect addressed
When both the factual timeline path and the legacy End Week candidate were eligible, entering Start could allow the legacy completed-weekly-rest path to run and mutate the compensation ledger.

## Expected behaviour now
- Timeline path keeps priority for the current work day even after Start is entered.
- Legacy completed-weekly-rest / compensation-creation logic must not run while the timeline path owns the decision.
- No compensation-ledger create or completion write is allowed from the timeline-driven Start path in this checkpoint.
- Legacy behaviour remains available only when the timeline path is not eligible.

## Required retest
Run the full `QA_WEEKLY_REST_TIMELINE_TEST_PLAN.md`, plus explicitly verify:
1. A valid timeline anchor exists.
2. Six completed work cycles exist after it.
3. A legacy End Week candidate also exists.
4. Both would otherwise be eligible.
5. Timeline Start proposal wins.
6. Enter Start.
7. `driverPayV4_weeklyCompensationLedger` remains byte/logically unchanged.
8. No compensation obligation is created from the legacy candidate.
9. Existing backup/restore tests remain green.

## Commands
- `npm test`
- `npx tsc --noEmit`
- Fresh production build if the QA environment can install dependencies correctly.

## Packaging note
`dist/` is intentionally excluded from this QA source checkpoint. Do not approve a production release until a fresh production build succeeds from the approved source.

No source corrections should be made during QA. Report problems only.

---


# APPENDIX 59 — QA_WEEKLY_REST_RETEST_HANDOFF_03.md

# DRIVER PAY APP v5.2.15 — Weekly Rest Timeline QA Retest 03

## Purpose
Retest the remaining ownership-stability defect reported in QA Retest 02.

## Fix under test
Timeline weekly-rest ownership is now derived from factual chronology strictly before the selected work day via `getWeeklyRestCycleSnapshotBeforeDate(...)`.

This is intentionally narrow:
- entering Start on the selected day must not make the prior weekly-rest decision unknown;
- any ambiguous/incomplete Work day earlier in the chronology must still force conservative fallback;
- timeline ownership must continue to block the legacy completed-weekly-rest/compensation path;
- no new compensation-ledger create/completion write may occur from a timeline-driven Start.

## Required state-transition regression
Construct a state with:
1. a valid factual weekly-rest anchor;
2. exactly six completed work cycles after that anchor;
3. an existing legacy End Week candidate that would otherwise be eligible;
4. selected next Work day initially has no Start;
5. timeline path owns the weekly-rest decision;
6. enter Start on that selected day;
7. verify timeline ownership remains active/authoritative after Start;
8. verify legacy path remains blocked;
9. verify `driverPayV4_weeklyCompensationLedger` is byte/logically unchanged.

## Also rerun
- full `QA_WEEKLY_REST_TIMELINE_TEST_PLAN.md`;
- `npm test`;
- TypeScript validation if environment allows;
- fresh Vite build if environment allows.

## Important
Do not correct source during QA. Report findings only.
`dist/` is intentionally excluded from this source QA checkpoint.

---


# APPENDIX 60 — QA_WEEKLY_REST_SOURCE_BASELINE_PASS.md

Source baseline: QA RETEST 03 PASS (2026-08-02)

---


# APPENDIX 61 — QA_WEEKLY_REST_TIMELINE_TEST_PLAN.md

# QA — Weekly Rest Timeline / Start Helper Checkpoint

## Purpose
Validate the new conservative cross-week weekly-rest logic before it is allowed to control any additional behaviour.

## Scope of this checkpoint
- Existing End Week feedback text/visibility adjustment.
- Internal separation of pay-period close from weekly-rest candidate seeding.
- Read-only detection of qualifying mid-week weekly rest.
- Read-only cross-week weekly-rest timeline.
- Read-only current weekly-rest-cycle snapshot.
- Due-gate: an old End Week candidate must not force weekly rest before the new timeline says it is due.
- When the timeline is certain that 6 completed work cycles have occurred since the last recognised weekly rest, it may provide the weekly-rest Start path even without End Week.
- Standard 45h Start remains the main suggestion; 24h reduced option remains the secondary helper below Start when applicable.

## Explicitly NOT implemented yet
- No `Working tomorrow?` question.
- No new automatic Day Off behaviour.
- No custom End Week day / work-week pattern implementation.
- No new writes to the compensation ledger from the timeline path.
- No automatic migration or new persisted weekly-rest state.
- No change to the meaning of Save & Next beyond existing behaviour.

## Critical regression rule
If the timeline is uncertain, the app must fall back to the previous behaviour rather than guessing.

## Test scenarios

### 1. Five completed work cycles after a recognised weekly rest
Expected:
- Normal daily-rest Start helper remains active.
- Weekly-rest Start must NOT take over.
- No new Day Off marking.
- No compensation-ledger change.

### 2. Six completed work cycles after a recognised weekly rest
Expected:
- Weekly-rest logic becomes due.
- Main Start helper uses the 45h path from the last real Finish.
- Reduced 24h option, when valid, appears only as the secondary helper below Start.
- This must work even if End Week has not been pressed.

### 3. Mid-week regular weekly rest
Example shape: Work -> 45h+ continuous rest -> Work.
Expected:
- The long rest is recognised as a new regular weekly-rest anchor.
- Work-cycle counting restarts after that rest.
- A previous End Week candidate must not continue to force an older weekly-rest suggestion.

### 4. Mid-week reduced weekly rest
Example shape: Work -> 24h to <45h continuous rest -> Work.
Expected:
- The rest is recognised as reduced for timeline purposes.
- Work-cycle counting restarts after it.
- Existing compensation behaviour must not be changed by this checkpoint.

### 5. Ambiguous/incomplete work day inside the timeline
Expected:
- Detector must not jump across an unclear started-but-unfinished Work day.
- State should become unknown/conservative where necessary.
- Old behaviour/fallback should remain available.

### 6. End Week before weekly rest is due
Expected:
- Pay-period close/archive behaviour remains intact.
- If a later recognised mid-week weekly rest means fewer than 6 completed cycles have occurred, End Week must not force a premature weekly-rest Start helper.

### 7. Existing completed week — no changes
Expected:
- No archive rewrite/duplicate.
- Visible feedback: `Week already saved. No changes.`

### 8. Existing completed week — changed data
Expected:
- Existing archive record is updated, not duplicated.
- Visible feedback: `Changes saved. Week updated.`

### 9. New completed week
Expected:
- Normal archive creation.
- Visible feedback: `Week completed.`

### 10. Backup/restore regression
Expected:
- Existing backup/restore round-trip test remains green.
- Failed restore still rolls back safely.

## Real-data reference scenario
The user's 2026 backup contains a useful real example: Monday 15 Jun finished at 15:20, Tuesday and Wednesday were Off, and Thursday 18 Jun started at 06:30. The continuous rest is 63h 10m and should be recognised as a regular weekly rest.

## Pass criteria before further integration
- TypeScript check is clean.
- Existing automated regression tests are green.
- Scenarios 1-6 behave exactly as described.
- No duplicate archived weeks are created.
- No new storage keys or ledger mutations occur from the read-only/timeline path.

## Next work only after QA passes
Integrate the smarter End Week ambiguity flow (`Working tomorrow?`) and the future distinction between pay-period boundary, configured work-week boundary, and regulatory weekly-rest cycle. Do not implement these as part of this checkpoint.

---


# APPENDIX 62 — STABLE_RELEASE_v5.2.21.md

# Driver Pay App v5.2.21 — Stable Release

**Current stable source/deploy baseline.**

This package contains the exact v5.2.21 functional source that passed independent heavy QA. Only documentation was updated after QA to record the result and stable status; no application source, user-facing text, dependency, storage, Pay Engine, Rest Engine, Archive logic or version identity was changed after the tested checkpoint.

See `QA_APPROVAL_v5.2.21.md` and `ARCHIVE_AUDIT_v5.2.21.md`.

---


# APPENDIX 63 — STABLE_RELEASE_v5.2.22.md

# Driver Pay App v5.2.22 — Stable Road-Test Deploy

## Status

**APPROVED FOR DEPLOYMENT / PHYSICAL-PHONE ROAD TEST**

Runtime application version remains **5.2.22**.

The application source in this package is byte-for-byte the same source that passed the v5.2.22 heavy QA and the v5.2.22-r1 packaging-integrity verification.

## Confirmed before deployment

- Application regressions: PASS
- Full automated test suite: PASS
- TypeScript `npx tsc --noEmit`: PASS
- Fresh Vite production build: PASS
- Packaging/root integrity: PASS
- Runtime version identity: PASS
- Source comparison against the heavy-tested v5.2.22 checkpoint: PASS

No functional source correction was made after these checks.

## Purpose of this deployment

A deployed version is required to complete the physical-phone road test that could not be executed in the QA environment.

### Required real-device workflow

1. Friday: use `End Week`.
2. Saturday is still the current calendar day and belongs to the same Sunday→Saturday pay week.
3. Open Saturday while it is `Day Off`.
4. When weekly-rest criteria are active, verify the weekly-rest context and applicable 45h / valid 24h proposal are visible.
5. Change Saturday `Day Off → Work`.
6. Verify the weekly-rest proposal remains available in the Start workflow.
7. Verify the proposal remains a suggestion and does not silently save `Start`.
8. Verify today's Saturday does **not** receive archive-like styling merely because `End Week` was used on Friday.
9. Verify Saturday remains editable without hard-archive Unlock.

## Release boundary

This package is for deployment and physical-phone confirmation. No Setup work is included.

If the phone road test passes, v5.2.22 may be treated as the stable installed baseline before Setup development begins.

---


# APPENDIX 64 — STABLE_RELEASE_v5.2.25.md

# Driver Pay App v5.2.25 — Phone Road-Test Deploy

## Status
**APPROVED FOR DEPLOYMENT / PHYSICAL-PHONE VALIDATION**

Runtime application version remains **5.2.25**.

This package contains the same runtime application source that passed v5.2.25-r2 Heavy QA.

## Confirmed before deployment
- ZIP/root/version integrity: PASS
- `npm ci`: PASS
- complete `npm test`: PASS
- `npx tsc --noEmit`: PASS
- fresh `npm run build`: PASS
- WR-001 through WR-013: PASS under automated/source behavioral coverage
- all three protected End Week scenarios: PASS
- Test/Register/Source alignment: PASS
- active contradictions: none
- source integrity after QA: PASS
- QA source corrections: none

## Required physical-phone checks
1. Weekly Rest is visibly named on the real phone when weekly-rest context owns the day.
2. Before factual Start, the 45h primary and valid 24h secondary proposals are actually visible when applicable.
3. Fewer than six cycles do not suppress an End Week weekly-rest candidate.
4. Six-cycle mandatory warning still uses the existing `Weekly rest required` path.
5. `Day Off → Work` does not silently save Start and preserves the relevant weekly-rest proposal.
6. Long rest accrued before End Week retains its original factual Finish anchor.
7. After a factual Start, the old candidate is consumed and does not reappear.
8. A non-current soft archive provides a direct `Go to current week` action.
9. The current day does not look like a hard archive merely because End Week was used.
10. General phone layout/touch/PWA update behavior remains usable.

## Release boundary
No Setup work is included.

If the physical-phone validation passes, v5.2.25 becomes the stable installed baseline before Setup planning/development.

---


# APPENDIX 65 — V5_1_1_PROFILE_APPLY_SAFETY_NOTE.txt

Driver Pay App v5.1.1 profile apply safety
- Separates Company/Agency from Profile name in Pay Setup v2
- Adds Load profile selector
- Update profile now saves profile data only and does NOT silently apply global settings
- Apply profile is explicit and labelled as applying from next empty day
- Keeps Day screen, Archive, KM carry, Rest logic unchanged
- Keeps zoom lock and empty display cleanup

---


# APPENDIX 66 — V5_1_PAY_SETUP_V2_NOTE.txt

Driver Pay App v5.1.0 Pay Setup v2 foundation
- Based on clean v5.0.0
- Adds Pay Setup v2/Profile foundation in Settings
- Keeps Day screen, Archive, KM carry, Rest logic unchanged
- Adds Profile 1 auto layer and Edit/New from this/Create profile flow foundation
- Backup export includes Pay Profiles metadata

---


# APPENDIX 67 — V5_CLEAN_BASE_NOTE.txt

Driver Pay App v5.0.0 clean update + zoom fix
- Visible version remains v5.0.0
- Based on v5.0.0 clean zoom/empty-display base
- Adds stronger mobile pinch-zoom blocking without layout/spacing changes
- Restores/strengthens PWA update prompt for same-version v5-to-v5 clean rebuilds
- Service worker cache marker changed so this same-version build is still detected as new
- No Pay Setup v2 integration
- No button text/layout/day-type logic changes
- package-lock.json omitted for Vercel

---


# APPENDIX 68 — WORKING_SESSION_2026-08-02.md

# Working session — 2026-08-02

Base: driver-pay-app-v5.2.15-backup-restore-roundtrip-qa(1).zip

## Change A — End Week feedback (earlier in this session)
- Reused the existing End Week result states instead of adding duplicate save logic.
- User-facing intent:
  - new close: `Week completed.`
  - already closed, unchanged: `Week already saved. No changes.`
  - already closed, edited: `Changes saved. Week updated.`
- For unchanged close, Week Preview remains visible long enough for the feedback to be seen; successful new close/update retain their existing exit behaviour.
- No weekly-rest calculation changes in this change.

## Change B — conservative pay-period / weekly-rest responsibility separation
- No intended functional behaviour change.
- Extracted the new-close path in `src/App.tsx` into four explicit responsibilities:
  1. `buildPayPeriodCloseDays(...)`
  2. `seedWeeklyRestCandidateFromClosedPayPeriod(...)`
  3. `persistClosedPayPeriod(...)`
  4. `openNextPayPeriod(...)`
- `endWeek(...)` now orchestrates those steps in the same order as before.
- Existing End Week weekly-rest candidate seeding is deliberately preserved as a compatibility bridge.
- No mid-week weekly-rest recognition, cycle reset, `Working tomorrow?` prompt, custom End Week day, or future setup behaviour has been implemented yet.

## Rollback
- Pre-Change-B source copy: `src/App.tsx.before-pay-weekly-separation`
- If Change B causes a regression, restore that file over `src/App.tsx` while retaining Change A from the working baseline if desired.

## Verification after Change B
- `npm test` PASS:
  - complete backup snapshot restores identical logical storage state
  - stale computer state is replaced, not merged
  - failed restore rolls back atomically
  - production v2 snapshot and reload path remain present
- `tsc --noEmit --pretty false` PASS with no output/errors.

## Conservative mid-week weekly-rest recognition foundation
- Added a read-only `RecognizedWeeklyRest` model and `detectQualifyingWeeklyRests(days)` helper in `src/App.tsx`.
- Detection recognizes a factual continuous gap of >=24h only once a later real Work Start exists.
- 24h..<45h is classified reduced; >=45h regular.
- Off/Holiday days do not break the rest chain.
- A touched/incomplete Work day invalidates chronology so no weekly-rest inference crosses uncertain work data.
- No state, localStorage, compensation ledger, Start helper, End Week flow, UI, or archive behavior uses this detector yet.
- Rollback checkpoint: `src/App.tsx.before-midweek-rest-detection`.
- Validation: `tsc --noEmit` PASS; `npm test` PASS (all backup/restore regression checks).
- Real backup probe: Tax Week 11 ending 20 Jun 2026 contains Mon 15 Jun Finish 15:20 -> Thu 18 Jun Start 06:30 = 63h10m, correctly qualifying as regular weekly rest under the new detector logic.

## Change C — read-only cross-pay-period weekly-rest timeline
- Added `buildWeeklyRestTimelineDays(currentDays, archive)` and `getWeeklyRestTimelineSnapshot(...)` as pure/read-only helpers.
- Archived days provide continuity across End Week/pay-period boundaries; current live days override the same `dateISO` so edits are not double-counted.
- The timeline is sorted chronologically and passed through the already-added factual >=24h weekly-rest detector.
- The helper returns all recognized rests plus the latest one, but is deliberately NOT wired to Start suggestions, Rest card, End Week, cycle resets, compensation ledger, persistence, or UI yet.
- Purpose: create the future-compatible source of truth needed to distinguish regulatory continuity from pay-period boundaries without changing production behaviour today.

## Change D — read-only weekly-rest cycle snapshot
- Added `WeeklyRestCycleSnapshot` and `getWeeklyRestCycleSnapshot(currentDays, archive)` as a pure/read-only helper.
- The helper uses only the latest factual weekly rest already recognized by the cross-pay-period timeline; it deliberately does NOT fall back to the End Week candidate.
- If no factual weekly rest is known, it returns `known: false` instead of guessing.
- When known, it counts only completed Work shifts whose real Start occurs at/after the recognized rest end, and records the latest completed Finish.
- No UI, Start helper, Rest card, End Week behaviour, compensation ledger, persistence, or automatic day marking uses this snapshot yet.
- Rollback checkpoint: `src/App.tsx.before-readonly-weekly-cycle`.
- Validation: `tsc --noEmit` PASS; `npm test` PASS (all backup/restore regression checks).

## Conservative weekly-rest due gate
- Added a read-only gate between the factual cross-week weekly-rest cycle snapshot and the legacy End Week candidate.
- If the cross-week timeline is known and fewer than 6 completed work cycles have occurred since the last recognized qualifying weekly rest, the legacy End Week candidate is not allowed to take over Start suggestions yet.
- If the timeline is unknown, legacy behavior is preserved exactly.
- This does NOT activate weekly rest on its own, does NOT mark days Off, does NOT change End Week, does NOT write storage, and does NOT touch compensation.
- Rollback checkpoint: `src/App.tsx.before-weekly-due-gate`.

## Change E — timeline-driven weekly-rest Start proposal (first live influence)
- Rollback checkpoint: `src/App.tsx.before-timeline-due-start`.
- This is the first step where the factual cross-week timeline can actively drive the Start suggestion without requiring End Week.
- Activation is deliberately narrow:
  - a factual weekly-rest timeline must be known;
  - at least 6 completed Work cycles must exist after the latest recognized weekly rest;
  - a real last completed Finish must exist;
  - the currently viewed day must be Work and must not already have a Start.
- When those conditions are met, the anchor for weekly-rest targets is the last completed Finish from the factual timeline.
- Timeline path keeps 45h as the primary Start proposal and exposes the 24h reduced option only as the secondary weekly-rest helper, matching the current product decision.
- The old End Week candidate path remains intact as a compatibility fallback when the timeline is not able to establish a due anchor.
- The legacy completed-weekly-rest/compensation creation path is deliberately NOT reused for timeline activation yet, preventing accidental compensation-ledger writes from a stale End Week candidate.
- No automatic day marking, no End Week behaviour change, no `Working tomorrow?` prompt, no storage migration, and no custom End Week day logic in this change.
- Validation after Change E: `tsc --noEmit --pretty false` PASS; `npm test` PASS (all backup/restore regression checks).

## QA handoff checkpoint
- Added `QA_WEEKLY_REST_TIMELINE_TEST_PLAN.md` for a fresh-chat QA pass before any further weekly-rest integration.

## QA critical fixes after first weekly-rest timeline review
- Fixed cross-week chronological processing: repeated weekday IDs across multiple pay periods are no longer collapsed to the first occurrence. Timeline-only logic now orders every dated day by `dateISO`.
- Fixed conservative fallback: any touched/incomplete Work day after the latest recognized weekly rest makes the cycle snapshot `known: false`; later completed shifts cannot revive the new timeline path across that uncertainty.
- Added `scripts/weekly-rest-timeline-test.mjs` and wired it into `npm test` alongside the existing backup/restore regression.
- Regression coverage now includes repeated weekday IDs across weeks, regular/reduced mid-week weekly rest, 5/6 work-cycle counting, incomplete Work -> unknown, and source guards for End Week feedback/duplicate prevention.
- `tsc --noEmit --pretty false`: PASS in the working environment after the fixes.
- `node scripts/weekly-rest-timeline-test.mjs`: PASS.
- `node scripts/backup-restore-roundtrip-test.mjs`: PASS.
- Fresh dependency install / Vite production build could not be completed because the internal npm registry returned 404 for `yallist-3.1.1.tgz`. This is an environment limitation, not a source-code failure.
- The stale pre-existing `dist/` must NOT be used to judge or deploy this source checkpoint. For the retest handoff ZIP, stale `dist/` is intentionally omitted so source and production bundle cannot be confused.

### QA retest blocking fix — timeline/legacy compensation isolation
- Added `timelineWeeklyRestPathEligible`, which remains true after Start is entered when the factual timeline owns the weekly-rest decision.
- Legacy End Week weekly-rest path is now explicitly disabled whenever timeline path eligibility exists.
- Compensation-ledger effect is checkpoint-gated: no create/complete ledger writes are allowed from a timeline-driven weekly-rest Start yet.
- Added regression guards for simultaneous timeline + legacy eligibility and ledger-write isolation.
- Rollback files: `src/App.tsx.before-qa-compensation-priority-fix` and `scripts/weekly-rest-timeline-test.mjs.before-qa-compensation-priority-fix`.

## QA retest 02 blocking fix — timeline ownership after Start
- Root cause confirmed: the same cycle snapshot included the selected current Work day; entering Start made that day touched/incomplete, which made the snapshot unknown and allowed legacy ownership to return.
- Conservative fix: weekly-rest Start ownership is now computed from factual chronology strictly before the selected day (`getWeeklyRestCycleSnapshotBeforeDate`).
- This keeps the decision stable before/after entering Start while still treating any earlier ambiguous incomplete Work day as unknown.
- No compensation integration was added. Timeline-owned Start remains blocked from legacy compensation ledger create/complete writes.
- Added a real state-transition regression test: six completed cycles + current day empty -> current day Start entered -> ownership snapshot must remain known and identical.


### Validation after ownership-stability fix
- `npm test`: PASS (backup/restore + weekly-rest regression).
- `npx tsc --noEmit`: PASS.
- The new regression test simulates the actual before-Start -> after-Start transition using a snapshot strictly before the selected date.
- During test authoring, the first fixture accidentally contained seven completed cycles because the post-rest anchor day itself is a completed cycle; the fixture was corrected to exactly six. No source behaviour was changed for that test-fixture correction.

## QA RETEST 03 source baseline
- Accepted QA RETEST 03 as the rollback/source baseline for next work.
- Marker: QA_WEEKLY_REST_SOURCE_BASELINE_PASS.md

## Conservative End Week / next-day intent step
- Added a prompt only when the factual weekly-rest timeline is known and weekly rest is not yet due: "Working tomorrow?"
- YES: closes the pay period normally, opens the immediate next calendar day (Sunday in the current Saturday-ending pay-period model) as Work, carries forward known km, and leaves weekly-rest legality to the existing timeline/daily-rest helpers.
- NO: preserves the existing legacy weekly-rest flow. No new weekly-rest storage or compensation behaviour was added.
- Standard End Week behaviour is unchanged when weekly rest is due or timeline state is unknown.
- Custom End Week day remains future Setup work; this step intentionally uses the current Saturday-ending model only.
- Rollback files: src/App.tsx.before-endweek-working-tomorrow and scripts/weekly-rest-timeline-test.mjs.before-endweek-working-tomorrow.
- Validation: npm test PASS; npx tsc --noEmit PASS.

## Version discipline reset — v5.2.16
- The accumulated QA-passed weekly-rest timeline + conservative End Week next-day intent change is now formally identified as v5.2.16, not another v5.2.15 checkpoint.
- Rule restored: every future functional/source change advances the version before handoff; descriptive artifact names accompany version numbers.
- Added `scripts/end-week-intent-test.mjs` and wired it into `npm test` to cover Yes/No next-day intent behaviour and source guards.


## v5.2.17 — first timeline compensation integration
- Added exact debt creation for a newly factual reduced mid-week weekly rest (24h to <45h).
- Debt is created only when a later real Start proves the rest duration; no future rest is guessed.
- Exact owed minutes = 45h minus actual factual rest. Regular 45h+ rest creates no debt.
- Added equivalent-fact duplicate protection so timeline and legacy paths cannot create the same debt twice.
- Timeline-driven debt completion is intentionally NOT added in this version; that remains a separate future version/QA step.
- Rollback: `src/App.tsx.before-v5.2.17-timeline-compensation-create` and `scripts/weekly-rest-timeline-test.mjs.before-v5.2.17-timeline-compensation-create`.
- Validation: `tsc --noEmit` PASS; `npm test` PASS.

## v5.2.18 checkpoint

Implemented the second compensation integration step: factual timeline-owned rest may complete one pre-existing compensation obligation.

Safety boundaries:
- no partial repayment;
- chronology and deadline required;
- one rest -> at most one obligation;
- duplicate spending of the same continuous rest is blocked across Start edits;
- v5.2.17 debt creation remains unchanged;
- Monday Start proposal after End Week remains OPEN and untouched.

Local source checks: npm test PASS; tsc --noEmit PASS. Fresh Vite production build not available in this environment.

---
