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
