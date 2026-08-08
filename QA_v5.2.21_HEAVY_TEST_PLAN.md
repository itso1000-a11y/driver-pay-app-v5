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
