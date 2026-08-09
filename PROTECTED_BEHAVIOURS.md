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
