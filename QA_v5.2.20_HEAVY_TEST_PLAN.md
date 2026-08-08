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
