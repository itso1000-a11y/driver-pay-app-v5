# DRIVER PAY APP — REST ENGINE v1 PHASE 2+3 QA REPORT v5.2.44

## 1. Executive Result

PASS. Combined Phase 2+3 е реализирана като неактивна source-only основа. Working-copy и extracted-package QA са завършени успешно.

## 2. Baseline Identity

- Приет baseline: `driver-pay-app-v5.2.43-rest-engine-time-foundation-source-qa`
- Immutable baseline path: `C:\Users\itso1\Documents\Codex\2026-09-12\this-is-a-fresh-independent-forensic\work\phase1-v5.2.43-build`
- Phase 2+3 working copy: `C:\Users\itso1\Documents\Codex\2026-09-12\this-is-a-fresh-independent-forensic\work\phase2-3-v5.2.44`
- Target release identity: `v5.2.44`

## 3. Scope Implemented

Реализирани са source-neutral `ActivityFact` normalization, factual coverage, deterministic `RestInterval` chronology, review diagnostics и bounded parametric Weekly Rest candidate generation. Няма runtime wiring, allocation, compensation или Phase 4 solver.

## 4. Files Added

- `src/rest-engine/facts.ts`
- `src/rest-engine/chronology.ts`
- `src/rest-engine/weekly-rest-candidates.ts`
- `scripts/rest-engine-phase2-3-test.ts`
- `MASTER_PROJECT_QA_v5.2.44.md` (продължение на преименувания v5.2.43 continuity document)
- `PHASE2_3_QA_REPORT_v5.2.44.md`

## 5. Files Modified

- `src/rest-engine/types.ts`
- `package.json`
- `package-lock.json`
- `src/version.ts`
- `index.html`
- `public/manifest.webmanifest`
- `public/sw.js`
- `VERSION_HISTORY_RECENT.md`

## 6. Files Deleted

- `MASTER_PROJECT_QA_v5.2.43.md` е заменен чрез continuity rename с `MASTER_PROJECT_QA_v5.2.44.md`; съдържанието за по-старите версии е запазено.

## 7. Dependency Changes

Няма dependency промени. Запазена е точно Phase 1 dependency конфигурацията, включително `@js-temporal/polyfill` 0.5.1. Не е добавен test runner или date/time library.

## 8. Data Model Implemented

Добавени са additive типове за `ActivityFact`, source references, factual status/coverage, stable chronology issues, exact rest boundaries, open/closed `RestInterval`, fixed-week crossing/overlap metadata и parametric `WeeklyRestComponentOption`. Legal durations и offsets са integer milliseconds.

## 9. ActivityFact Normalization

`normalizeActivityFacts(...)` разрешава London wall times чрез приетия Phase 1 слой, прилага explicit revision/supersession, deterministic exact deduplication и REVIEW за conflicting duplicates. Derived резултатът е fresh и deterministic.

## 10. Factual Coverage Rules

Untouched/default rows, future blank rows, planned future Off/Holiday и bulk End Week Off/Holiday без completion provenance не доказват rest. Past Off/Holiday дава `FULL_CIVIL_DAY` coverage само при factual completion evidence. Complete saved Work може да даде civil-day coverage, като действителният Work се изважда като busy span.

## 11. RestInterval Derivation

`deriveRestIntervals(...)` изисква explicit safe-integer `asOf`, обединява overlapping Work conservatively, изважда busy spans от установеното coverage и връща maximal continuous no-work intervals. Midnight, Monday, pay-week и End Week metadata не разделят factual interval. Current interval е с `end=null`, `observedThrough=asOf` и ID, основано на factual start boundary.

## 12. REVIEW / Diagnostics Behaviour

Incomplete Work, invalid Finish<=Start, unresolved fold/gap boundaries, overlapping Work, conflicting facts и suspected non-GB legacy timestamps произвеждат stable diagnostics и monotonic `REVIEW_REQUIRED`. REVIEW interval може да даде само `REVIEW_ONLY`, а не confirmed allocatable candidate.

## 13. Weekly Rest Candidate Generation

`generateWeeklyRestComponentOptions(...)` използва exact elapsed milliseconds: под 24h няма option; 24h–<45h дава `SINGLE_REDUCED`; >=45h дава `SINGLE_REGULAR`. Candidate не означава counted Weekly Rest и не създава debt.

## 14. Parametric Component Options

Options съдържат component duration constraints, component start-offset ranges, half-open `[0,duration)` placement domain, adjacency/distinct-week constraints, unallocated capacity и bounded long-rest capacity. Не се materialize-ва option за всяка секунда или placement.

## 15. 69h / 90h Behaviour

Cross-week 69h interval пази `SINGLE_REGULAR`, `REGULAR_THEN_REDUCED` и `REDUCED_THEN_REGULAR`. 89h59m няма `REGULAR_THEN_REGULAR`; при 90h тази capability се добавя. 55h пази 45h regular minimum capacity плюс 10h unallocated capacity, която не се нарича compensation.

## 16. Cross-Week Behaviour

Rest interval, който пресича Monday 00:00, остава един factual interval. Candidate metadata пази exact boundary instant, offset from interval start, week-before/week-after IDs, fixed-week overlaps и eligible adjacent week pairs, без да избира owner.

## 17. Historical Recomputation

Explicit supersession и по-нова revision премахват стария fact от active inputs. Chronology и candidates се преизчисляват от facts; stale intervals/options не се пазят в authoritative ledger.

## 18. Anti-Double-Counting Readiness

Half-open interval coordinates, component ranges и explicit unallocated capacity осигуряват вход за бъдещо consumptive allocation. Phase 2+3 не присвоява `WEEKLY_REST_MINIMUM`, `DAILY_REST_MINIMUM` или `COMPENSATION` ownership.

## 19. 144h Solver Readiness

Пазят се exact interval start/end instants, unresolved boundary candidates, placement constraints, ordering и London fixed-week boundaries. 144h compliance, six-shift shortcut и civil-day shortcut не са реализирани.

## 20. T01–T49 Results

| Test | Result | Проверено поведение |
|---|---|---|
| T01 | PASS | Finish→next Start дава един maximal factual interval. |
| T02 | PASS | Midnight не разделя interval. |
| T03 | PASS | Monday boundary не разделя interval. |
| T04 | PASS | Pay-week/End Week metadata не променя резултата. |
| T05 | PASS | Open interval има `end=null`, stable ID и `asOf` duration. |
| T06 | PASS | Future planned Off дава zero factual credit. |
| T07 | PASS | Past explicitly completed Off/Holiday осигурява coverage. |
| T08 | PASS | Future blank row не дава evidence. |
| T09 | PASS | Past untouched placeholder не дава evidence. |
| T10 | PASS | Incomplete Work създава REVIEW barrier. |
| T11 | PASS | Corrected Start/Finish преизчислява interval. |
| T12 | PASS | Invalid/overlapping Work се диагностицира. |
| T13 | PASS | Точно 24h създава reduced option. |
| T14 | PASS | 23h59m59s не създава Weekly Rest option. |
| T15 | PASS | 44h59m остава reduced и пази actual duration. |
| T16 | PASS | Точно 45h създава regular option. |
| T17 | PASS | 55h пази 45h capacity + 10h unallocated. |
| T18 | PASS | Cross-week 69h пази и двете 45+24 orientations. |
| T19 | PASS | 90h пази 45+45 capability. |
| T20 | PASS | Един `RestInterval` може да създаде multiple options. |
| T21 | PASS | Не се генерира `CompensationObligation`/debt. |
| T22 | PASS | Cross-week option няма permanent start-week owner. |
| T23 | PASS | Pay-week configuration не влияе на резултата. |
| T24 | PASS | UI/archive/navigation state не влияе на резултата. |
| T25 | PASS | Device timezone не влияе на factual chronology. |
| T26 | PASS | Spring DST използва exact elapsed duration. |
| T27 | PASS | Autumn DST използва exact elapsed duration. |
| T28 | PASS | Fold boundary предава REVIEW и candidates. |
| T29 | PASS | Gap boundary предава REVIEW без normalization. |
| T30 | PASS | Exact instants пазят before/equal/after 144h. |
| T31 | PASS | Еднакви facts + `asOf` дават logically identical result. |
| T32 | PASS | Historical edit премахва stale intervals/options. |
| T33 | PASS | Phase 1 A–H остават PASS. |
| T34 | PASS | Full legacy regression suite остава PASS. |
| T35 | PASS | `tsc --noEmit`. |
| T36 | PASS | Fresh production build. |
| T37 | PASS | Version consistency v5.2.44. |
| T38 | PASS | `App.tsx` SHA остава exact baseline SHA. |
| T39 | PASS | Exact duplicate facts се deduplicate-ват. |
| T40 | PASS | Conflicting duplicates произвеждат REVIEW. |
| T41 | PASS | Finish-only fact не създава strong candidate. |
| T42 | PASS | Bulk End Week Off/Holiday без provenance не е factual rest evidence. |
| T43 | PASS | Open interval ID не се променя само при advance на `asOf`. |
| T44 | PASS | 89h59m няма 45+45 option; 90h има. |
| T45 | PASS | Option count остава bounded при very long interval. |
| T46 | PASS | Suspected non-GB legacy timestamp предава REVIEW. |
| T47 | PASS | Finish<=Start не се преобразува мълчаливо в overnight Work. |
| T48 | PASS | Real Work inside rest разделя chronology на два intervals. |
| T49 | PASS | `App.tsx`, runtime bundle и production storage нямат Phase 2+3 import/write. |

## 21. Phase 1 A–H Regression Result

PASS 8/8. Проверени са historical 21:00 +9h/+11h, spring/autumn exact 144h, boundary ordering, device-timezone independence, fold REVIEW, gap REVIEW и Sunday 24:00/deadline boundaries.

## 22. Full Legacy Regression Result

PASS 19/19 npm script групи: backup/restore, weekly-rest timeline, End Week intent, compensation creation/repayment и release regressions v5.2.20, .21, .22, .23, .24, .26, .27, .31, .32, .33, .36, .37, .38 и .42.

## 23. TypeScript Result

PASS: `node node_modules/typescript/bin/tsc --noEmit`.

## 24. Production Build Result

PASS: clean build към `C:\Users\itso1\Documents\Codex\2026-09-12\this-is-a-fresh-independent-forensic\work\phase2-3-v5.2.44\.qa-build-v5.2.44-release`. Vite трансформира 31 modules и създаде 10 build files.

## 25. Version Consistency

PASS: `package.json`, `package-lock.json`, lock root, `src/version.ts`, `index.html`, `public/manifest.webmanifest` и `public/sw.js` са v5.2.44. `test:release-version` е PASS.

## 26. App.tsx SHA Integrity

- Before: `0D8951CC56B94ABE609914BB1391BF6B4C63C5EB15D08844ACEB6A3E8D5B0BA0`
- After: `0D8951CC56B94ABE609914BB1391BF6B4C63C5EB15D08844ACEB6A3E8D5B0BA0`
- Result: PASS, byte-for-byte unchanged.

## 27. Runtime Isolation Confirmation

PASS: `App.tsx`/`main.tsx` нямат Phase 2+3 imports или calls; production bundle няма Phase 2+3 API/pattern markers; новите modules нямат `localStorage`; няма `prebuild`/`postinstall` runtime hook, backup schema или production storage change.

## 28. Package Integrity

PASS. Source-only package съдържа 54 файла под един project root. Stage-to-extraction SHA-256 сравнението е идентично за всеки файл. Архивът не съдържа `node_modules`, `dist`, npm cache, test temp, QA build directories, editor junk или `.git`. От extracted root са изпълнени успешно offline `npm ci`, пълна `npm test`, отделен `tsc --noEmit` и fresh production build. След финализиране на report-а окончателният архив е извлечен повторно и е потвърден чрез file-count, path и SHA-256 equality.

## 29. Known Limitations

По contract не са реализирани fixed-week allocation, branch selection, two-week compliance, 144h solver, rolling reset, compensation obligations/blocks/repayment, attachment allocation, warning severity, UI integration, storage migration, production Rest replacement, AETR, international special rules или ferry/train rules.

## 30. Phase 4 Status

Phase 4 не е започната.

## 31. Final Verdict

PHASE 2+3 PASS — READY FOR REVIEW
