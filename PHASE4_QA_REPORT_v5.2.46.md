# DRIVER PAY APP — REST ENGINE v1 PHASE 4 QA REPORT v5.2.46

## 1. Executive Result

Phase 4 pure legal allocation solver е реализиран. Working-copy QA и извлеченият пакет са валидирани изцяло: всички задължителни suites, TypeScript, fresh production build, version consistency, App.tsx SHA, runtime isolation и ZIP integrity са PASS.

## 2. Accepted Baseline Identity

- Accepted baseline: `driver-pay-app-v5.2.45-rest-engine-directional-review-fix-source-qa.zip`
- Accepted ZIP SHA-256: `BB9B19BADA2C63D0A4C01EF71CD99B68E51E2215E2A06EFEE0C960C4553F1028`
- Phase 4 working copy: `C:\Users\itso1\Documents\Codex\2026-09-12\this-is-a-fresh-independent-forensic\work\phase4-v5.2.46`
- Target release: `v5.2.46`

## 3. Phase 4 Scope Implemented

Реализиран е pure solver от accepted `RestInterval`/`WeeklyRestComponentOption` inputs към concrete component allocations, fixed-week assignments, preserved branches, two-week evaluations и exact rolling 144h records. Phase 4 остава shadow/inactive.

## 4. Files Added

- `src/rest-engine/weekly-rest-allocation.ts`
- `scripts/rest-engine-phase4-test.ts`
- `MASTER_PROJECT_QA_v5.2.46.md` като continuity rename
- `PHASE4_QA_REPORT_v5.2.46.md`

## 5. Files Modified

- `src/rest-engine/types.ts`
- `scripts/rest-engine-phase2-3-test.ts` — само release-version expectation v5.2.46
- `package.json`
- `package-lock.json`
- `src/version.ts`
- `index.html`
- `public/manifest.webmanifest`
- `public/sw.js`
- `VERSION_HISTORY_RECENT.md`

## 6. Files Deleted

- `MASTER_PROJECT_QA_v5.2.45.md` е заменен чрез continuity rename с `MASTER_PROJECT_QA_v5.2.46.md`; историческото съдържание е запазено.

## 7. Dependency Changes

Няма dependency промени. `@js-temporal/polyfill` остава точно 0.5.1. Не е добавена date/time library или test runner.

## 8. Phase 4 Data Model

Добавени са additive source-oriented типове за `WeeklyRestComponent`, `FixedWeekAssignment`, `AllocationBranch`, `RollingCycleReset`, `TwoWeekEvaluation`, explicit allocation context и Phase 4 diagnostics. Component ranges използват exact integer milliseconds и half-open `[start,end)` semantics.

## 9. Solver API

Primary API е `solveWeeklyRestAllocations(intervals, options, context)`. Context изисква explicit `asOf`, consecutive fixed-week IDs, history start, factual-coverage completeness и optional prior qualifying Weekly Rest. API не чете React, UI, archive, pay, employer, `localStorage` или `Date.now()`.

## 10. Branch Generation

За всеки factual rest solver-ът генерира само meaningful alternatives: ADDITIONAL, eligible single-component fixed-week owners и Phase 3 compound patterns/pairs. След всеки incremental combination step се прилагат overlap elimination и deterministic canonical deduplication.

## 11. Fixed-Week Assignment

Всеки COUNTED component има точно една `COUNTED_FOR_FIXED_WEEK` assignment с exact London week boundaries. Assignment остава отделна от factual `RestInterval` identity. Един component не удовлетворява две седмици едновременно.

## 12. Counted vs Additional Handling

Branch choices различават `COUNTED` и `ADDITIONAL`. Reduced candidate може да остане additional. Нито counted, нито additional role създава compensation/debt consequence в Phase 4.

## 13. Two-Consecutive-Week Evaluation

Всеки consecutive week pair в horizon-а получава explicit evaluation. `REGULAR+REGULAR`, `REGULAR+REDUCED` и `REDUCED+REGULAR` са `SATISFIED`; `REDUCED+REDUCED` или insufficient counted rest стават `VIOLATED`, `PENDING`, `REVIEW` или `INSUFFICIENT_HISTORY` според exact horizon/factual state.

## 14. Cross-Week Allocation

Cross-week rest пази отделни branches за всеки eligible fixed-week owner. Start-week preference не се прилага. Multiple valid owners остават preserved, а source option provenance е reconstructible.

## 15. 69h / 90h Allocation

69h може да materialize-не exact adjacent `REGULAR_THEN_REDUCED` и `REDUCED_THEN_REGULAR` components. 90h може да materialize-не adjacent `REGULAR_THEN_REGULAR`. 89h59m не може да създаде два regular components. Component minimum ranges не се застъпват.

## 16. Exact 144h Evaluation

`dueEpochMilliseconds = previousQualifyingEnd + 144 exact elapsed hours`. Status различава `BEFORE_DUE`, `EXACTLY_DUE`, `AFTER_DUE`, `REVIEW`, `INSUFFICIENT_HISTORY` и `PENDING`. Equality е compliant и DST не променя elapsed arithmetic.

## 17. Rolling Reset / Midweek Rest

COUNTED components се подреждат хронологично. Всеки qualifying component end е reset anchor за следващия transition, включително midweek rest и back-to-back components.

## 18. REVIEW / Uncertainty Handling

`REVIEW_ONLY` options никога не стават confirmed COUNTED rest. Source review, actual `AMBIGUOUS_FOLD`, incomplete history и incomplete factual coverage се запазват като branch/evaluation REVIEW; downstream certainty не се повишава.

## 19. Horizon / Pending Handling

Липсващ previous qualifying rest произвежда `INSUFFICIENT_HISTORY`. Ненастъпил open due instant е `PENDING`. След преминал due instant violation се допуска само при explicit complete factual coverage through `asOf`.

## 20. Historical Recomputation

Всички branches са fresh derived output. Stable fingerprints зависят от complete supplied inputs. При замяна на RestInterval старите component/branch source IDs изчезват без ledger или reconciliation effect.

## 21. Anti-Double-Counting

COUNTED minimum ranges се проверяват като half-open intervals. Overlapping proposals се елиминират с `OVERLAPPING_WEEKLY_REST_MINIMUM`; adjacent ranges са позволени. Не се разпределят daily-rest или compensation minutes.

## 22. Branch Canonicalization / Complexity

Phase 3 parametric constraints се materialize-ват само при owner, fixed-week pair или 144h-relevant branch difference. Няма millisecond/minute enumeration. Exact equivalent options и branches се deduplicate-ват със stable fingerprints; representative 1000-day fixture остава до шест branches в two-week horizon.

## 23. T51–T90 Results

| Test | Result | Проверено правило |
|---|---|---|
| T51 | PASS | Single 45h rest може да е counted regular. |
| T52 | PASS | Single 24h rest може да е counted reduced без compensation. |
| T53 | PASS | Reduced candidate може да остане ADDITIONAL. |
| T54 | PASS | Cross-week rest пази и двата valid owners. |
| T55 | PASS | Един component не се брои в две седмици. |
| T56 | PASS | Regular + regular удовлетворява two-week minimum. |
| T57 | PASS | Regular + reduced удовлетворява two-week minimum. |
| T58 | PASS | Reduced + regular удовлетворява two-week minimum. |
| T59 | PASS | Reduced + reduced не удовлетворява ordinary minimum. |
| T60 | PASS | Additional rest не удовлетворява автоматично седмица. |
| T61 | PASS | 69h поддържа regular-then-reduced. |
| T62 | PASS | 69h поддържа reduced-then-regular. |
| T63 | PASS | 69h component claims не се застъпват. |
| T64 | PASS | 90h поддържа adjacent 45h + 45h. |
| T65 | PASS | 89h59m няма two-regular allocation. |
| T66 | PASS | 144h BEFORE due. |
| T67 | PASS | 144h EXACTLY due. |
| T68 | PASS | 144h AFTER due. |
| T69 | PASS | Exact 144h през GMT→BST. |
| T70 | PASS | Exact 144h през BST→GMT. |
| T71 | PASS | Midweek counted rest re-anchor-ва cycle. |
| T72 | PASS | Pay-week boundary не влияе. |
| T73 | PASS | End Week metadata не влияе. |
| T74 | PASS | Archive/UI/navigation state не влияе. |
| T75 | PASS | Няма silent start-week preference. |
| T76 | PASS | Две legal cross-week assignments дават два branches. |
| T77 | PASS | Няма избор по least future consequence. |
| T78 | PASS | Branch IDs/results са deterministic. |
| T79 | PASS | Equivalent branches/options се canonicalize-ват с provenance. |
| T80 | PASS | Historical correction премахва stale branch state. |
| T81 | PASS | REVIEW_ONLY никога не става confirmed COUNTED rest. |
| T82 | PASS | Реален ambiguous fold boundary остава REVIEW. |
| T83 | PASS | Insufficient prior history е explicit. |
| T84 | PASS | Open future deadline е PENDING. |
| T85 | PASS | Passed deadline с complete facts е violation. |
| T86 | PASS | Няма compensation/repayment object. |
| T87 | PASS | Branch не може да consume-ва overlapping ranges. |
| T88 | PASS | Adjacent back-to-back ranges са позволени. |
| T89 | PASS | Long rest не генерира minute-aligned options. |
| T90 | PASS | Branch count остава bounded/canonical. |

## 24. T01–T50 Regression Result

PASS 50/50. След еднократен Windows/npm subprocess exit `0xC0000409`, настъпил след отпечатан PASS от child regression, приетият T01–T50 suite беше повторен самостоятелно и премина изцяло. Отказът не се възпроизведе; нито един тест не беше отслабен или пропуснат.

## 25. Phase 1 A–H Result

PASS 8/8: historical 21:00, spring/autumn exact 144h, boundary ordering, device-timezone independence, fold, gap и Sunday 24:00/deadline tests.

## 26. Legacy Regression Result

PASS 19/19 direct npm script групи: backup/restore, weekly-rest timeline, End Week intent, compensation creation/repayment и regressions v5.2.20, .21, .22, .23, .24, .26, .27, .31, .32, .33, .36, .37, .38 и .42.

## 27. TypeScript Result

PASS: `node node_modules/typescript/bin/tsc --noEmit`.

## 28. Production Build Result

PASS: fresh production build към `C:\Users\itso1\Documents\Codex\2026-09-12\this-is-a-fresh-independent-forensic\work\phase4-v5.2.46\.qa-build-v5.2.46-release`. Vite трансформира 31 modules и създаде 10 files.

## 29. Version Consistency

PASS: `package.json`, `package-lock.json`, lock root, `src/version.ts`, `index.html`, `public/manifest.webmanifest` и `public/sw.js` са v5.2.46. `test:release-version` е PASS.

## 30. App.tsx SHA Integrity

- Before: `0D8951CC56B94ABE609914BB1391BF6B4C63C5EB15D08844ACEB6A3E8D5B0BA0`
- After: `0D8951CC56B94ABE609914BB1391BF6B4C63C5EB15D08844ACEB6A3E8D5B0BA0`
- Result: PASS, byte-for-byte unchanged.

## 31. Runtime Isolation

PASS. `App.tsx`/`main.tsx` нямат Phase 4 imports/calls; production bundle няма Phase 4 API/diagnostic markers; solver-ът няма `localStorage` или `Date.now()`; няма `prebuild`/`postinstall`, backup schema change или runtime integration.

## 32. Package Integrity

PASS.

- Финалният source/QA package съдържа един root и 58 пакетируеми файла.
- Предварителното extraction сравнение е 58/58 SHA-256 PASS; няма `node_modules`, build output, test temp, cache или VCS metadata в ZIP съдържанието.
- `npm ci --offline --no-audit` в извлечения пакет инсталира 66 packages от workspace cache.
- Извлечен пакет: Phase 1 A–H = 8/8 PASS; T01–T50 = 50/50 PASS; complete legacy regression = 19/19 PASS в T34; T51–T90 = 40/40 PASS; TypeScript = PASS.
- Извлеченият fresh production build е PASS: 31 transformed modules и 10 build файла в `C:\Users\itso1\Documents\Codex\2026-09-12\this-is-a-fresh-independent-forensic\work\phase4-zip-validation-v5.2.46-prelim\driver-pay-app-v5.2.46-rest-engine-legal-allocation-solver-source-qa\.zip-qa-build-v5.2.46`.
- След install/test/build всички 58 пакетируеми файла остават byte-for-byte идентични със staging source-а.
- Дълбоко вложеният Windows path първоначално възпроизведе познатото esbuild parent-traversal `Access is denied`; същият неизменен suite премина изцяло през workspace-contained `subst` mapping, без разширяване на filesystem permissions.

## 33. Known Limitations

Приетото Phase 2+3 ограничение остава: historical logical duplicates с различни `factId` стойности не се обединяват без authoritative cross-storage identity policy. Phase 4 приема подадените Phase 2+3 inputs като authority.

Solver-ът оценява само explicit supplied horizon/history. Той не измисля facts извън него и не агрегира UI warnings.

## 34. Phase 5 Status

Phase 5 не е започната. Няма `CompensationObligation`, amount, deadline, block, repayment, attachment, debt ordering, warning aggregation, UI или storage migration.

## 35. Final Verdict

PHASE 4 PASS — READY FOR INDEPENDENT REVIEW
