# Driver Pay App — verified recent version history

**Current source package:** v5.2.33  
**History scope:** v5.2.26 → v5.2.33  
**Evidence used:** the consolidated `MASTER_PROJECT_QA_v5.2.33.md`, the actual source/test files carried by this package, version identity files, and the v5.2.32 package used as the direct base for v5.2.33.

This document deliberately separates verified runtime changes from QA/packaging-only revisions. It does not invent a promotion status when the carried evidence is incomplete.

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
