# Driver Pay App — verified recent version history

**Current source package:** v5.3.6 SOURCE-QA  
**History scope:** v5.2.26 → v5.3.6  
**Evidence used:** the consolidated `MASTER_PROJECT_QA_v5.3.3.md`, the actual source/test files carried by this package, version identity files, and the preserved earlier source packages used as direct historical bases.

This document deliberately separates verified runtime changes from QA/packaging-only revisions. It does not invent a promotion status when the carried evidence is incomplete.

## v5.3.6 — Legacy duplicate-source provenance fix

When a pre-provenance historical `Off/Holiday` appears both in a closed archive and in a higher-precedence saved week, the selected saved representation inherits archive historical evidence only if both copies are materially identical. Conflicting, planned, current, future and generated records remain non-factual. This restores the factual Friday Finish to Sunday Start interval without changing legal allocation, compensation, warnings or presentation.

## v5.3.5 — Legacy historical Off/Holiday provenance

Closed archive rows created before `completionSource` existed are recognised as historical factual evidence only when their London civil date is before the explicit as-of date and they were not bulk-marked. Current, future, default/planned, live/current and saved planning rows remain non-factual. This restores factual Friday-Finish-to-Sunday-Start chronology for genuine legacy historical records without changing Phase 1–7 legal evaluation or Pay Engine behavior.

## v5.3.4 — Phone production-path and presentation correction

An explicit user selection of a historical `Off` or `Holiday` row now persists `completionSource: "user"`; it therefore preserves the factual rest interval from a prior Friday Finish to the next factual work Start. Current/future plans and default Sunday `Off` rows remain unconfirmed. The factual Rest Card, compensation and Weekly Rest warning remain separate, the accepted status palettes are locked, and EN/BG presentation avoids internal engine terms and raw severity badges.

**Status:** SOURCE-QA; production-path, focused Phase 8, final regression, TypeScript, version, browser, build and package evidence are recorded in `PHONE_PRODUCTION_PATH_AND_PRESENTATION_FIX_QA_REPORT_v5.3.4.md`. Independent review and physical phone acceptance remain pending.

## v5.3.3 — Phone regression / rest / update correction

Partial Start and Finish values are retained for editing but cannot become legal facts until they are complete `HH:MM` values. Factual rests continue through `Off` and `Holiday` days until a factual work start. Driver-facing Weekly Rest and compensation presentation again uses established EN/BG wording and the historical status palette without internal allocation or rolling-window terminology. A newly installed PWA worker waits for the explicit Update action, which sends `SKIP_WAITING`; activation then causes one controlled reload.

**Status:** SOURCE-QA; P01–P06 add targeted phone-regression coverage. Final QA evidence is recorded in `PHONE_REGRESSION_FIX_QA_REPORT_v5.3.3.md`; independent review and physical phone acceptance remain pending.

## v5.3.1 — Phase 8 branch warning/presentation correction

Public warning, debt, deadline and compensation items now ignore VIOLATED allocation branches whenever a non-VIOLATED branch survives; rejected branches remain available for diagnostics. Pure rolling 144h or fixed two-week Weekly Rest violations with no compensation obligation display as Weekly Rest warnings, without fabricated impossible compensation. Phase 1–6 legal logic, allocation, migration, Pay Engine and UI design are unchanged.

**Status:** SOURCE-QA; T278–T283 added. Final QA evidence is recorded in `PHASE8_BRANCH_WARNING_PRESENTATION_FIX_QA_REPORT_v5.3.1.md`; independent review and physical phone acceptance remain pending.
## v5.3.0 — Phase 8 Rest Engine UI activation

The production UI now recomputes EngineEvaluation from factual legacy rows through the accepted v5.2.60 migration and Phase 1–7 engine. The Rest Card presents factual rest classification separately from branch-aware compensation and warning; Week Preview consumes the same evaluation. Historical navigation and End Week retain their pay-workflow behavior without granting old derived weekly-rest/compensation ledger values legal authority. English and Bulgarian presentation are included. Phase 1–7 legal logic and Pay Engine calculations remain unchanged.

**Status:** SOURCE-QA; automated checks and package integrity are documented in `PHASE8_QA_REPORT_v5.3.0.md`. Independent review and physical phone acceptance remain outstanding.
## v5.2.60 — Phase 6+7 migration recovery and source-precedence correction

Interrupted re-migration recovery now resolves a valid staged transaction before returning an older completed migration. When legacy facts change from snapshot A to B and B is interrupted after staging, recovery promotes B, updates the completion marker and removes staging without altering legacy keys.

Legacy factual precedence now follows the accepted order: archive baseline, then saved week, then live/current data. Conflicting top-priority `days` and `driverApp_days` aliases remain explicit REVIEW evidence; neither alias nor lower-priority saved/archive data is selected as certain.

`App.tsx`, `main.tsx`, Phase 1–5 source, evaluation, warnings, UI and runtime wiring remain unchanged. Phase 8 is not started.

**Status:** SOURCE-QA; narrow migration recovery/precedence correction automated QA complete.

## v5.2.59 — Phase 6+7 historical recomputation and warning aggregation

The new shadow pipeline derives one immutable `EngineEvaluation` from authoritative factual inputs, explicit `asOf`, accepted Phase 1–5 rules and explicit ruleset configuration. Facts hashing covers every legal input, derived caches are disposable, and historical corrections rebuild chronology, allocation, compensation and warning inputs instead of retaining stale ledger state.

Legacy migration is versioned, namespaced, non-destructive, idempotent and recoverable after an interrupted staged write. It promotes only legacy factual day rows, preserves the complete legacy snapshot for rollback/audit, and excludes persisted weekly-rest and compensation ledgers from legal authority.

Phase 7 derives branch-aware GREEN/YELLOW/RED warning results from `EngineEvaluation`. RED requires complete factual coverage and impossibility or violation across every valid branch; one valid branch prevents RED. Legal deadlines, candidate planning deadlines and latest-start targets remain separate.

`App.tsx`, `main.tsx`, visible UI and runtime wiring remain unchanged. Phase 6+7 is shadow/source-QA only; Phase 8 is not started.

**Status:** SOURCE-QA; combined Phase 6+7 automated QA complete.

## v5.2.58 — Phase 5 transitive uncertainty provenance correction

Allocation dependency evidence now carries the canonical original factual REVIEW requirements that made the dependency possible. Downstream compatibility merges those leaf requirements instead of treating different immediate clear-record IDs as independent.

Requirements competing for one ordinary non-shareable rest/base/capacity remain incompatible through multiple dependency levels. Requirements from independent factual rests, or from one shareable regular Weekly Rest base with sufficient sequential capacity, may coexist. Equivalent states are deduplicated and the strictest inherited required-by cutoff is retained.

Dependency provenance is preserved even when an obligation later receives a confirmed primary block. The confirmed result still wins; the provenance only allows later analysis to decide whether that primary block could be absent in a jointly possible unresolved history.

`App.tsx`, `main.tsx`, Phase 1–4 source, storage and UI remain unchanged. Phase 5 remains shadow-only; Phases 6–8 are not started.

**Status:** SOURCE-QA; transitive uncertainty provenance correction automated QA complete.

## v5.2.57 — Phase 5 joint uncertainty compatibility correction

Alternate dependency analysis now considers finite jointly compatible sets of uncertain higher-priority blocks on one contested clear allocation record. Independent earlier repayment possibilities may release several primary blocks together, while evidence competing for one non-shareable ordinary rest/base/capacity is rejected.

Shared earlier evidence is combined only when one common chronology and an accepted shareable regular Weekly Rest base can fit the selected obligations sequentially. The resulting release set is replayed through the existing deterministic full-fit/skip-fit allocator. It adds REVIEW dependency evidence only and never changes primary blocks or confirms a favourable history.

The search is bounded by actual blocks and their finite evidence alternatives on the record. Incompatible states are pruned and equivalent release sets are deduplicated.

`App.tsx`, `main.tsx`, Phase 1–4 source, storage and UI remain unchanged. Phase 5 remains shadow-only; Phases 6–8 are not started.

**Status:** SOURCE-QA; joint uncertainty compatibility correction automated QA complete.

## v5.2.56 — Phase 5 alternate deterministic allocation correction

Cross-obligation dependency review now replays each contested clear-capacity record once after removing only the uncertain higher-priority block. The replay preserves every other actual occupied block and reserved range, then processes lower obligations in the accepted priority and full-fit/skip-fit order against one mutable copy of free capacity.

An ordinary 9h base can support only the first fitting alternate obligation. A shareable regular Weekly Rest base may support multiple fitting lower obligations, with each hypothetical allocation consuming capacity before the next obligation is considered. The replay creates uncertainty evidence only; it does not change primary allocations or expose hypothetical blocks, bases or attachments.

`App.tsx`, `main.tsx`, Phase 1–4 source, storage and UI remain unchanged. Phase 5 remains shadow-only; Phases 6–8 are not started.

**Status:** SOURCE-QA; alternate deterministic allocation correction automated QA complete.

## v5.2.55 — Phase 5 structured uncertainty-timing correction

Cross-obligation allocation dependency now uses structured timing evidence instead of the evaluator order in which uncertainty was discovered. Accepted boundary candidates and elapsed ranges are retained as possibilities, no-candidate evidence is bounded by remaining exact facts, and dependency-derived possibilities carry their possible package-completion instant.

The final dependency check asks whether an unresolved higher-priority repayment could have completed by the contested clear-capacity instant. It does not promote candidates to fact, guess a timestamp, change the deterministic primary allocation or mark the lower obligation completed. Full-fit, reserved-range, base-sharing and lower-deadline materiality checks remain required.

`App.tsx`, `main.tsx`, Phase 1–4 source, storage and UI remain unchanged. Phase 5 remains shadow-only; Phases 6–8 are not started.

**Status:** SOURCE-QA; structured uncertainty-timing correction automated QA complete.

## v5.2.54 — Phase 5 multi-obligation allocation-uncertainty correction

The deterministic primary allocator now records bounded clear-capacity contention. When an unresolved repayment state of a higher-priority obligation could have freed that exact capacity and the lower-priority obligation could then fit in full before its own deadline, the lower obligation remains `REVIEW` instead of becoming a false strong `OVERDUE` result.

The check does not select the favourable history or create an alternate block, base, attachment or completion. It preserves priority, skip-fit, indivisibility, reserved Weekly Rest ranges, base-sharing restrictions, branch locality and confirmed positive outcomes. Capacity that cannot fit the lower debt or exists only after its deadline does not propagate uncertainty.

`App.tsx`, `main.tsx`, Phase 1–4 source, storage and UI remain unchanged. Phase 5 remains shadow-only; Phases 6–8 are not started.

**Status:** SOURCE-QA; multi-obligation uncertainty correction automated QA complete.

## v5.2.53 — Phase 5 final review-order and bounded-irrelevance correction

The final obligation result is now gated after every candidate RestInterval has been examined, so relevant unresolved chronology cannot be erased by processing order. Confirmed Case A and provisional positive results remain authoritative; otherwise a later clear late relation cannot turn a result into strong `OVERDUE` while earlier deadline-relevant uncertainty remains. A Case B attachment relation is preserved while the obligation result remains generic `REVIEW` when separate earlier uncertainty can still change the legal outcome.

No-candidate unresolved boundaries are bounded by exact facts. An exact start is irrelevant only when the remaining time before deadline is strictly shorter than the indivisible compensation block. An exact end with unresolved start is irrelevant when even the most favorable permitted start at obligation creation cannot fit a legal package after reserved Weekly Rest components are excluded.

`App.tsx`, `main.tsx`, Phase 1–4 source, storage and UI remain unchanged. Phase 5 remains shadow-only; Phases 6–8 are not started.

**Status:** SOURCE-QA; final review-order correction automated QA complete.

## v5.2.52 — Phase 5 NONEXISTENT_GAP no-candidate correction

The unresolved-boundary path now distinguishes an empty accepted candidate set from proof of irrelevance. A closed `REVIEW_REQUIRED` boundary with structured no-candidate upstream state, including `NONEXISTENT_GAP`, adds obligation-level REVIEW when no remaining exact fact can prove deadline irrelevance.

Candidate/range reasoning remains primary. Exact start, exact end and source identity can still prove irrelevance, confirmed Case A remains positive, genuine certain Case C remains overdue, and `OPEN` rest retains its provisional lifecycle. No timestamp, block, base or attachment is invented.

`App.tsx`, runtime entry points, Phase 1–4 source, storage and UI remain unchanged. Phase 5 remains shadow-only; Phases 6–8 are not started.

**Status:** SOURCE-QA; final gap correction automated QA complete.

## v5.2.51 — Phase 5 unresolved-boundary REVIEW correction

Closed/history `REVIEW_REQUIRED` RestIntervals with unresolved exact boundaries are now assessed before the exact-boundary early skip. The evaluator uses only accepted boundary candidate instants and `elapsedRangeMilliseconds` bounds to decide whether any chronology could contain an eligible indivisible compensation package affecting the deadline result.

Relevant unresolved chronology adds obligation-level REVIEW without creating a block, base, attachment or invented timestamp. Proven-irrelevant candidate ranges do not erase genuine overdue. `OPEN` intervals remain on the existing exact-start plus `observedThroughEpochMilliseconds` provisional path.

`App.tsx`, runtime entry points, Phase 2–4 source, storage and UI remain unchanged. Phase 5 remains shadow-only; Phases 6–8 are not started.

**Status:** SOURCE-QA; final narrow Phase 5 correction automated QA complete.

## v5.2.50 — Phase 5 narrow uncertainty-propagation correction

The Phase 5 evaluator now permits a strong `CASE_C / OVERDUE` result only when factual coverage through the deadline is complete and no relevant REVIEW RestInterval could contain a sufficient on-time attachment package. A REVIEW interval beginning only after the deadline remains diagnostic provenance and does not erase a certain breach.

Confirmed clear on-time completion continues to win over unrelated REVIEW information. Case B, branch-local allocation, indivisible blocks, fit/skip priority and all Phase 4 inputs remain unchanged. T151–T155 cover the defect and the positive/negative controls.

`App.tsx`, runtime entry points, storage and UI remain unchanged. Phase 5 remains shadow-only; Phases 6–8 are not started.

**Status:** SOURCE-QA; narrow Phase 5 correction automated QA complete.

## v5.2.49 — Rest Engine v1 Phase 5 compensation obligations and attachment

Phase 5 adds a pure branch-local compensation evaluator over accepted Phase 4 allocation branches and factual `RestInterval` inputs. Only counted reduced Weekly Rest creates an exact integer-millisecond obligation. Source fixed-week identity comes from the Phase 4 assignment, and the civil deadline uses the accepted Europe/London time foundation at the end of the third following fixed week.

The bounded allocator models indivisible compensation blocks, ordinary 9h or Weekly Rest attachment bases, non-overlap with reserved Weekly Rest minimums, deterministic multi-debt fit/skip priority, supported multi-block regular bases and explicit Case A, Case B and Case C results. It preserves REVIEW uncertainty, branch alternatives and fresh derivation without a ledger.

`App.tsx`, runtime entry points, storage and UI remain unchanged. Phase 5 is shadow-only; Phases 6–8 are not started.

**Status:** SOURCE-QA; Phase 5 automated QA complete.

## v5.2.48 — Phase 4 final REVIEW uncertainty propagation correction

The `prior qualifying rest + no materialised rolling rest` path now checks current branch REVIEW uncertainty before returning a strong `AFTER_DUE` result. A `REVIEW_ONLY` possibility remains unconfirmed and creates no reset or replacement anchor, while keeping the rolling result at `REVIEW`. A complete, uncertainty-free no-rest case still returns `AFTER_DUE` and makes the branch `VIOLATED`.

T98 covers the unresolved REVIEW_ONLY case and T99 is the genuine no-rest control. `App.tsx`, runtime entry points, Phase 2+3 facts/chronology, fixed-week allocation, RestInterval-end anchors and compensation boundaries remain unchanged.

**Status:** SOURCE-QA; final narrow Phase 4 correction checks complete.

## v5.2.47 — Phase 4 allocation-anchor/counting correction

The Phase 4 solver now models rolling-cycle qualification separately from the fixed-week `COUNTED`/`ADDITIONAL` role. Every clear qualifying factual Weekly Rest participates once in rolling chronology, including an `ADDITIONAL` rest, and the next external 144h anchor is the end of the complete factual `RestInterval` rather than a reserved 24h/45h minimum-component boundary.

Canonical branch construction now eliminates allocations containing more than one counted component for the same fixed week. When either of two factual rests can satisfy the same week, separate source-identity branches remain available while the unused rest stays `ADDITIONAL`. No compensation, debt, repayment or Phase 5 object is created.

`App.tsx` and runtime entry points remain unchanged. The corrected solver remains inactive/shadow infrastructure.

**Status:** SOURCE-QA; narrow Phase 4 correction automated QA complete.

## v5.2.46 — Rest Engine v1 Phase 4 legal allocation solver

Phase 4 adds a pure, inactive legal allocation solver over the accepted `RestInterval` and `WeeklyRestComponentOption` outputs. It materializes exact counted/additional Weekly Rest components, keeps fixed-week assignment separate from factual rest identity, preserves alternative cross-week branches, evaluates the ordinary two-consecutive-week minimum, and computes rolling 144h transitions with exact elapsed instants.

The solver supports back-to-back 69h 45+24/24+45 and 90h 45+45 allocations without overlapping minute ownership. It canonicalizes equivalent branches, preserves source option provenance, rebuilds deterministically after historical changes, and retains REVIEW, insufficient-history and pending states. It does not create compensation debt or any Phase 5 object.

`App.tsx` and all existing runtime paths remain unchanged. The Phase 4 module is not imported by production entry points, performs no storage writes, and remains shadow/source-only infrastructure.

**Status:** SOURCE-QA; Phase 4 automated QA complete.

## v5.2.45 — Phase 2+3 directional REVIEW propagation correction

Independent review of v5.2.44 found that a uniquely resolved factual Start with a missing Finish correctly blocked chronology after Start, but its forward-only missing-Finish reason was also copied backward onto the factual rest ending at that known Start. A confirmed 34h preceding rest therefore became `REVIEW_ONLY` instead of retaining `SINGLE_REDUCED` capability.

The correction separates review reasons affecting the busy span's known Start boundary from reasons applying only after Start. The incomplete-work diagnostic and Start→`asOf` barrier remain intact; no post-Start rest is invented. Independent ambiguity at the Start boundary still propagates REVIEW. T50 covers reduced and regular preceding rest, forward blocking, stable identity as `asOf` advances, and the ambiguous-Start negative control.

`App.tsx` and the Phase 1 `time.ts` authority remain byte-for-byte unchanged. Phase 2+3 remains inactive at runtime, dependencies are unchanged, and Phase 4 is not started.

**Status:** SOURCE-QA; narrow correction automated QA complete.

## v5.2.44 — Rest Engine v1 combined Phase 2+3 chronology and candidate foundation

Phase 2+3 adds an isolated factual activity layer, deterministic `RestInterval` chronology, explicit `REVIEW_REQUIRED` diagnostics and bounded parametric Weekly Rest component options. It preserves continuous rest across midnight and fixed-week boundaries, supports historical recomputation, handles exact 24h/45h/69h/90h thresholds, and retains both legal orientations for qualifying cross-week 69h intervals.

The new modules remain inactive at runtime. `App.tsx` is byte-for-byte unchanged from v5.2.43, production code does not import the Phase 2+3 modules, and no compensation debt, weekly allocation, 144h solver, UI, storage or migration behavior is introduced. Phase 4 is not started.

**Status:** SOURCE-QA; combined Phase 2+3 automated QA complete.

## v5.2.43 — Rest Engine v1 Phase 1 time foundation

Phase 1 adds an isolated, directly tested `Europe/London` time layer. It represents exact UTC instants, entered wall date/time, resolved offset, `EXPLICIT`/`ASSUMED` provenance, ambiguous autumn folds, nonexistent spring gaps and explicit review states. It also provides exact elapsed arithmetic, London civil display conversion, civil-day bounds, Monday–Sunday fixed legal weeks and exact Sunday 24:00 boundaries.

The implementation uses exactly pinned `@js-temporal/polyfill` 0.5.1 because the supported Node 24 environment does not expose native `Temporal`. No other date library was added. The tests use Node 24 native TypeScript type stripping, so no separate test-runner dependency is required.

The module is inactive infrastructure. `App.tsx` remains byte-for-byte unchanged from v5.2.42, and no existing Rest Engine, UI, storage, ledger, End Week, archive, Pay, KM or daily-rest behaviour is routed through it. Phase 2 is not started.

**Status:** SOURCE-QA; Phase 1 automated QA complete.

## v5.2.42 — End Week pay-context carry-forward fix

Reason: a real Saturday End Week reproduction on v5.2.41 showed an unchanged Gross Only profile switching to the exact factory PAYE/rate defaults when the newly opened next pay week had no saved record. The active-profile label could remain unchanged, producing a misleading split between displayed profile identity and calculation Settings.

- a genuinely new next pay week inherits the current Settings and active Pay Profile id;
- Gross Only/PAYE mode and all rates/allowances therefore carry forward unless the user deliberately changes them;
- an already persisted target week keeps its own saved pay context and is not overwritten;
- the underlying bad branch existed historically (confirmed in v5.1.11 and v5.2.36–v5.2.41) and is state-dependent on the target week being absent, so it is classified as a latent defect rather than a proven direct regression from the September Start/Rest/UI patches;
- no Pay formula, Rest Engine, Weekly Rest, compensation, KM, archive, colour or general layout changes.

**Status:** SOURCE-QA; focused regression prepared; physical End Week verification required.

## v5.2.41 — Cross-day 11h Daily Start proposal restore

Reason: phone verification of v5.2.40 showed that once the regular 11h boundary fell on the previous calendar day, the main Start field became empty while the retained 9h helper remained visible. The protected Daily Start UX requires 11h to remain the normal primary proposal within the existing <24h daily-suggestion window.

- retain the 11h boundary across the calendar-day boundary while the existing <24h daily-suggestion window is active;
- show it as the primary Start proposal with `from 11h rest`;
- keep 9h as the secondary helper when allowed;
- preserve the >13h rule where 11h is genuinely unavailable and 9h may become primary;
- preserve the existing 24h cutoff and all Rest/Weekly Rest/Split/KM/Pay/archive semantics.

**Status:** SOURCE-QA; narrow source inspection only, phone verification required.


## v5.2.40 — Daily Start primary 11h/9h ownership fix

Reason: phone review showed a false primary reduced-rest suggestion when the regular 11h boundary was already on the previous calendar day. The retained historical 9h helper was being promoted into the main Start field, producing duplicate `21:30 from 9h rest` / `9h option: 21:30` even though 11h was not genuinely unavailable.

- 11h remains the normal primary Daily Start proposal when valid for the selected day;
- 9h becomes primary only when 11h is genuinely unavailable because the previous duty exceeded 13h;
- a previous-calendar-day 11h boundary no longer causes the retained 9h helper to become a false primary Start proposal;
- historical cross-day 9h helper visibility is preserved;
- no Rest Engine thresholds, Weekly Rest, compensation, KM, Pay, navigation/archive, storage or other UI behavior is changed.

**Status:** SOURCE-QA; narrow source sanity checked, phone verification required.


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
