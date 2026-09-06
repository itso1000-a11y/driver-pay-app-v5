# Driver Pay App — verified recent version history

**Current source package:** v5.2.39 SOURCE-QA  
**History scope:** v5.2.26 → v5.2.39  
**Evidence used:** the consolidated `MASTER_PROJECT_QA_v5.2.39.md`, the actual source/test files carried by this package, version identity files, and the preserved earlier source packages used as direct historical bases.

This document deliberately separates verified runtime changes from QA/packaging-only revisions. It does not invent a promotion status when the carried evidence is incomplete.

## v5.2.39 — Weekly-rest-ended card ownership fix

Reason: v5.2.38 correctly removed the long `Weekly rest ended ...` flow helper from only the Start column to keep Start/Finish aligned, but the Weekly Rest card still ignored the already-computed `primaryHelp` and continued to show an obsolete `45h Start: ...` line after the endpoint had passed.

- before endpoint: `45h Start: [day/time]` is unchanged;
- after endpoint and before factual Start: Weekly Rest card now shows `Weekly rest ended [day/time]`;
- no long ended helper is restored under Start;
- no weekly-rest calculation or other application behavior is changed;
- no tests were run for this narrow change by explicit user request.

**Status:** SOURCE-QA; phone verification required.

## v5.2.38 — Mobile Start-row stability / bonus-row fit

Reason: real phone use showed that an already-completed Weekly Rest context could add a duplicate flow hint only under Start and visually misalign Start/Finish, while the bonus quantity field left too little room for the bonus selector.

- completed/behind 45h target no longer injects duplicate `Weekly rest ended ...` text inside only the Start column;
- Start/Finish remain aligned in that scenario;
- daily 11h/9h inline Start provenance is unchanged;
- bonus draft row changes from `1fr 80px 88px` to `minmax(0,1fr) 56px 88px`;
- selector receives smaller 14px text/narrower padding and keeps the Add button width unchanged;
- bonus calculation/storage semantics are unchanged;
- v5.2.37 Week Preview chronology and compensation guard fixes are carried unchanged.

**Status:** SOURCE-QA candidate. Source regressions and isolated TypeScript check pass; fresh Vite/real-App browser acceptance is not claimed in this container because npm dependencies could not be fully installed.

### v5.2.38-r1 — QA harness / historical contract correction

QA-only revision; runtime and production source remain v5.2.38.

Independent Windows QA of the original v5.2.38 package confirmed clean install, TypeScript, production build, current regressions and the dynamic Start-provenance real-App suite. Two QA blockers remained:
- the v5.2.30 real-App acceptance harness still used static August 2026 fixture dates, so once the real calendar moved into September the app correctly selected a different workflow day and the 15h/21h/24h fixture became unreachable;
- the historical v5.2.26 contract runner still expected a normally saved previous week to manufacture Weekly Rest proposal ownership, which conflicts with the intentional v5.2.33 End Week/archive-evidence rule.

Corrections in r1:
- `scripts/v5-2-30-real-app-browser-regression-test.mjs` now derives the fixture from the real current payroll week, uses UTC consistently with the browser test, and explicitly selects the fixture Sunday/Saturday instead of relying on the real weekday; the 15h/21h/24h and Saturday/End Week assertions are unchanged;
- `scripts/v5-2-25-weekly-rest-ui-contract-test.mjs` now tests both sides of the current ownership contract: an open normally-saved previous week must not replace a genuine stored candidate, while the same newer previous-week anchor may win once closed/archive End Week evidence exists; the production rule is not weakened.

**Status:** QA-only correction prepared. Corrected real-App and v5.2.26 runners require independent rerun before phone promotion.

## v5.2.37 — Week Preview factual rest chronology / compensation rest-reuse guard

Reason: backlog inspection against the current v5.2.36 source confirmed that Week Preview still used an adjacent-day clock-only mini Rest Engine, while the legacy compensation effect still duplicated repayment logic without the newer one-rest/one-debt guard.

- Week Preview Rest Snapshot now uses the factual date-aware merged chronology (`archive -> saved week -> current live`) instead of `previous calendar day + clock time` subtraction;
- exact cross-date 24h no longer collapses to 0h;
- Off/Holiday gaps preserve the last factual Finish anchor;
- reduced-rest display totals are separated from the live reduced-rest allowance counter;
- factual 24h+ Weekly Rest resets the reduced-rest cycle for later Preview classification;
- exact 23h59 remains non-reset;
- Split Rest remains separate and does not consume an ordinary reduced-rest allowance;
- previous-pay-week Finish may classify the current Sunday Start in Preview through the existing saved chronology;
- legacy compensation repayment now reuses the guarded earliest-eligible helper, preventing the same continuous rest from repaying a second debt after Start editing;
- no Pay, Start/KM provenance, End Week, archive/navigation, Weekly Rest ownership/layout or bonus-row UI change is included.

**Status:** SOURCE-QA candidate. Dependency-free/current-source regressions and isolated TypeScript check pass. Fresh Vite build and real-App Chromium are not claimed in this container because dependency installation is incomplete.

## v5.2.36 — Start helper restore / KM provenance correction

Reason: phone review of v5.2.35 showed that ordinary daily Start proposals had been over-compacted and that carried Start KM provenance was incorrectly tied to unrelated work/time completion.

- normal daily HH:MM Start proposals remain 24px; only longer weekday/time context uses the compact narrow-screen fit;
- `from 11h rest` / `from 9h rest` are restored inside the Start field; existing 9h alternative / 11h-unavailable / limit helper wording remains below;
- long `Weekly rest ended ...` context keeps separate mobile flow space;
- Start KM gains explicit user/suggested/confirmed provenance;
- Start/Finish time, Save & Next, End Week, bonuses, Night out and Split do not confirm an untouched carried Start KM;
- Finish KM confirms the carried Start KM for the KM run and becomes the next carry anchor;
- only the last factual Finish KM propagates across no-KM Work days and pay-week boundaries;
- no KM entry is required for a valid paid Work day;
- the old v5.2.20 source-contract assertion that coupled KM suggestion status to general destructive work data is intentionally updated to the new explicit Finish-KM/provenance rule.

**Status:** SOURCE-QA candidate. Targeted real-App QA has since passed for Start presentation and KM-01 through KM-09, including the corrected deterministic Chromium provenance harness. It remains not stable/QA ACCEPTED pending phone road test and the separate rendered `Weekly rest ended ...` fixture/acceptance decision.

### v5.2.36-r1 — final Source-QA packaging

QA/documentation and test-harness packaging only; runtime remains v5.2.36.

- Corrected `scripts/v5-2-32-start-provenance-real-app-test.mjs` so its existing Sunday-finish fixture selects the following pay week, avoiding stale Monday 05:00/03:00 expectations when run later on the real current Monday.
- Assertions were not weakened; `test:browser:v5.2.32-start` subsequently passed all four real-App assertions.
- Final targeted evidence records Start presentation and KM-01 through KM-09 as PASS. `Weekly rest ended ...` remains BLOCKED pending a dedicated deterministic real-App fixture.

## v5.2.35 — Mobile UI cleanup / fixed PWA install name

Reason: narrow mobile Start/helper rendering and empty Work-day density needed a presentation-only correction; installed PWA naming needed to stop exposing patch versions.

- narrow-only Start proposal fit and non-overlapping hint layout;
- narrow-only compaction for empty Day Summary and empty mini-stat presentation, with all sections and order retained;
- manifest install `name` and `short_name` fixed to `Driver Pay App v5` while runtime identity remains versioned.

**Status:** SOURCE-QA candidate.

## v5.2.34 — Start context placeholder fit

Visual-only runtime patch:
- long contextual placeholders in the empty Start field use a smaller display size so they fit the fixed two-column Shift layout;
- factual/user-entered time values keep the existing 24px presentation;
- no Weekly Rest, Rest Engine, compensation, Split Rest, KM, Pay, archive/navigation, storage, colour-state, or wording logic was intentionally changed.


## v5.2.26 — Weekly Rest road-test corrections

Verified runtime changes recorded in the master history:
- weekday + time restored on 45h/24h Weekly Rest proposals;
- redundant `Weekly rest in progress` presentation removed;
- mandatory Weekly Rest under 24h shown as red `Weekly rest not completed`;
- visible reduced-weekly-rest compensation restored;
- six-cycle latest legal Weekly Rest **start** deadline separated from 24h/45h completion targets;
- uninterrupted rest across Sunday 24:00 / Monday 00:00 no longer reset by the pay-week boundary.

### v5.2.26-r1 — packaging/version integrity only

Verified non-runtime correction:
- `public/sw.js` cache identity aligned from v5.2.25 to v5.2.26.
- No runtime logic or behavioral test change recorded.

## v5.2.27 — road-test ownership/workflow correction

Verified runtime corrections:
- mandatory Weekly Rest timeline ownership survives factual Start;
- Rest Card factual ownership uses stored `currentDay.start`, not presentation-only `displayStartValue`;
- mandatory factual Weekly Rest states remain weekly-rest states after Start (<24h red, 24h–44h59m reduced/yellow, 45h+ regular);
- historical no-Start rest keeps end-of-selected-day arithmetic and receives the historical label;
- Saturday `Save & Next` opens Week View / End Week instead of self-navigating Saturday;
- `Working tomorrow?` is separated from the six-cycle warning gate;
- direct current-week navigation is available from non-current non-hard-archive weeks.

The master explicitly records no intentional Pay Engine, KM, backup/restore, compensation repayment, Setup or hard-archive-unlock change in this version.

## v5.2.28 — physical-road-test acceptance checkpoint

The carried master records v5.2.28 primarily as an acceptance/QA checkpoint. Verified contract changes include:
- mandatory Weekly Rest ownership must survive factual Start;
- exact under-24h / 24h–44h59m / 45h+ rendered-state expectations;
- weekday + time on 45h target context;
- historical selected-day rest boundaries;
- Saturday Save & Next, Working tomorrow and Go to current week as mandatory acceptance scenarios;
- accepted 45h+ visible label clarified as `Weekly rest`.

The master also records a mounted React/JSDOM state-transition suite for this checkpoint. That harness was later superseded by v5.2.29 real-application browser acceptance. This history makes no unsupported claim about additional v5.2.28 runtime source deltas beyond the documented acceptance contract.

## v5.2.29 — real-application browser acceptance architecture

Verified QA architecture change:
- replacement-component/JSDOM proof was superseded;
- acceptance moved to headless Chromium against the actual Vite-served application and real `src/App.tsx` render path;
- localStorage fixtures seed the real application; no recreated substitute UI is accepted as proof.

The carried history presents this as test architecture/acceptance work; no unsupported runtime-logic change is claimed here.

## v5.2.30 — portable real-App Chromium harness

Verified test-only revision. The master explicitly states `src/App.tsx` and business logic were unchanged.

Changes:
- portable Chromium discovery;
- clean browser spawn error reporting;
- fixture/reload sequencing moved to CDP-safe operations;
- mandatory real-App acceptance retained for 15h, 21h, 24h, Saturday Save & Next and Working tomorrow.

### v5.2.30-r1

Artifact/test revision only:
- fixture writes moved to CDP `DOMStorage`;
- exception description/stack preservation improved.

### v5.2.30-r2

Artifact/test revision only:
- fixed CDP `Runtime.evaluate` response unpacking (`r.result?.value` instead of double-unwrapping);
- added an in-test response-shape guard.

No runtime application logic change is recorded for v5.2.30/r1/r2.

## v5.2.31 — Rest state / allowance / lifecycle correction

Verified runtime changes:
- explicit Start provenance protects manually typed Start even when numerically equal to a current suggestion;
- reduced daily-rest allowance follows factual chronology between Weekly Rests instead of resetting at the pay-week boundary;
- Split Rest explanatory text remains with the factual Rest Card;
- completion alone does not make the current active day archive-like;
- `Go to current week` compares against the active workflow week.

Verified freeze:
- no semantic Rest/traffic-light/archive colour values intentionally changed.

Subsequent real-App QA exposed a backward-compatibility problem for legacy Start records, leading to v5.2.32.

## v5.2.32 — Start provenance backward-compatibility fix

Verified narrow runtime fix:
- a legacy persisted record with non-empty Start but no valid `startEntrySource` is migrated to factual/user provenance;
- suggestion-draft hiding requires explicit `startEntrySource === "acceptedSuggestion"`;
- missing/unknown provenance cannot hide a factual legacy Start merely because its value equals the current 9h/11h proposal.

Added v5.2.32 source and real-App Start-provenance regression runners.

**Carried status note:** the consolidated master in the v5.2.32 source package still labelled v5.2.32 `SOURCE-QA candidate`. Later handover material reported additional QA/phone observations, but the package itself did not contain a fully reconciled promotion record. This history therefore does not silently rewrite that status.

## v5.2.33 — saved-week factual chronology / End Week ownership correction

**Direct base:** the supplied v5.2.32 Start-provenance source-QA package.

Verified runtime corrections in this package:
- normal `driverApp_week_*` saved weeks now feed factual Weekly Rest and reduced-daily-rest chronology across pay-week/calendar rollover;
- merge precedence for the same date is archive -> normal saved week -> current live week;
- pre-day ownership snapshots cap saved history before the selected day, preventing the autosaved selected day from feeding its own Start back into the earlier ownership calculation;
- normal saved history does not create Weekly Rest proposal intent;
- previous-week legacy candidate backfill requires End Week evidence via closed-week state or an existing archive record.

Verified QA/release-only corrections:
- new behavioral `v5.2.33` regression for rollover, cross-boundary 24h rest, source precedence and candidate ownership;
- active Node QA scripts use `fileURLToPath(import.meta.url)` for Windows-safe filesystem paths;
- dependency-free release/version consistency regression added.

Explicitly not changed in v5.2.33:
- UI/layout/colours/text/translations;
- Pay Engine;
- KM logic;
- Week Preview presentation;
- Daily Rest thresholds / Split rules;
- 45h/24h Weekly Rest presentation;
- compensation model;
- End Week / Working tomorrow / archive correction / navigation semantics;
- backup format and storage key identities.

### v5.2.33 QA status at packaging time

- dependency-free regression set through v5.2.33: PASS;
- active `.mjs` syntax parse check: PASS;
- full dependency installation: BLOCKED by environment (`EAI_AGAIN` while fetching npm registry packages);
- TypeScript / esbuild-dependent suites / fresh Vite build / real-App Chromium: not claimed as passed in this environment and remain required before stable promotion.

**Status:** SOURCE-QA candidate.
