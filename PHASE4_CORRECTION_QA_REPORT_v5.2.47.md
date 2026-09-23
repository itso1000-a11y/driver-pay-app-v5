# DRIVER PAY APP — REST ENGINE v1 PHASE 4 NARROW CORRECTION QA REPORT v5.2.47

## 1. Executive Result

Трите release blockers от независимия v5.2.46 review са коригирани в изолирания Phase 4 solver. Working-copy QA, ZIP integrity и extracted-package install/test/build validation са изцяло PASS.

## 2. v5.2.46 Baseline Identity

- Baseline candidate: `driver-pay-app-v5.2.46-rest-engine-legal-allocation-solver-source-qa.zip`
- Baseline ZIP SHA-256: `10662AF1C4B35AC3F1CFB3F18BECC3B90DF75241021739AC49DDBCA4C6864FEC`
- Preserved baseline working copy: `C:\Users\itso1\Documents\Codex\2026-09-12\this-is-a-fresh-independent-forensic\work\phase4-v5.2.46`
- Correction working copy: `C:\Users\itso1\Documents\Codex\2026-09-12\this-is-a-fresh-independent-forensic\work\phase4-correction-v5.2.47`
- Target version: `v5.2.47`

v5.2.46 остава evidence baseline, но не се приема като окончателен Phase 4 baseline поради трите коригирани findings.

## 3. Correction Scope

Промените са ограничени до Phase 4 allocation solver-а, неговите additive types, focused test suite и нормалните release/continuity metadata файлове. Няма App, UI, storage, migration или runtime integration промяна.

## 4. Rolling Qualification Independent of COUNTED Role

Fixed-week `COUNTED`/`ADDITIONAL` ролята вече не определя rolling 144h qualification. Всеки clear factual `RestInterval`, който има qualifying Weekly Rest option, се материализира отделно като `RollingQualifyingWeeklyRest`. Затова `ADDITIONAL` Weekly Rest участва в rolling chronology и може да стане следващ reset anchor.

## 5. Complete RestInterval External Anchor

Minimum component ranges остават authority за fixed-week assignment, overlap ownership и provenance. External rolling relation използва factual `RestInterval.startEpochMilliseconds` за следващия Weekly Rest start и `RestInterval.endEpochMilliseconds` за следващия 144h anchor. Вътрешни 24h/45h component boundaries и trailing uninterrupted surplus не създават външен restart.

## 6. Redundant COUNTED Components

Branch construction премахва комбинации с повече от един `COUNTED` component, assigned към една и съща fixed week. Алтернативите по factual source се пазят като отделни canonical branches; неизползваният qualifying source остава `ADDITIONAL`. Не се използва future compensation amount, least-debt, deadline или earliest/latest heuristic.

## 7. Additive Type Separation

Добавени са `RollingWeeklyRestQualification`, `RollingQualifyingWeeklyRest`, explicit RestInterval identities върху `RollingCycleReset`, branch-level `rollingQualifyingRests` и diagnostic code `REDUNDANT_COUNTED_COMPONENT`. Съществуващите Phase 2+3 inputs не са променени breaking-wise.

## 8. T91–T97 Individual Results

| Test | Result | Rule |
|---|---|---|
| T91 | PASS | ADDITIONAL Weekly Rest resets 144h |
| T92 | PASS | 48h regular rest anchors at complete RestInterval end |
| T93 | PASS | 110h long rest anchors at complete RestInterval end |
| T94 | PASS | Long Off/Holiday factual rest uses the same RI-end rule |
| T95 | PASS | Redundant reduced rest stays ADDITIONAL |
| T96 | PASS | Distinct factual source alternatives are preserved |
| T97 | PASS | No artificial future debt sources |

Result: **7/7 PASS**.

## 9. Existing Phase 4 T51–T90

Result: **40/40 PASS**. Засегнатите T54 и T71 fixtures бяха приведени към locked minimal-counting rule, като legal assertions за cross-week owner alternatives и rolling re-anchor останаха запазени.

## 10. Accepted T01–T50

Result: **50/50 PASS**, включително nested Phase 1, complete legacy regression, TypeScript, build, version, App SHA и runtime isolation assertions.

## 11. Phase 1 A–H

Result: **8/8 PASS**. Europe/London, DST fold/gap, exact elapsed 144h и fixed-week boundaries не са регресирали.

## 12. Complete Legacy Regression

Result: **19/19 npm suites PASS**: backup, weekly-rest, End Week intent, compensation create/repayment и версионните regressions v5.2.20, v5.2.21, v5.2.22, v5.2.23, v5.2.24, v5.2.26, v5.2.27, v5.2.31, v5.2.32, v5.2.33, v5.2.36, v5.2.37, v5.2.38 и v5.2.42.

## 13. TypeScript

`tsc --noEmit`: **PASS**.

Първият pre-final cycle правилно спря в T35 поради widened string literal в новото qualification поле. Полето беше type-narrowed без runtime промяна, focused TypeScript стана PASS и след това беше изпълнен нов непрекъснат final QA cycle от T91 нататък.

## 14. Fresh Production Build

**PASS** — Vite 5.4.21, 31 transformed modules, 10 build файла.

Working-copy build path: `C:\Users\itso1\Documents\Codex\2026-09-12\this-is-a-fresh-independent-forensic\work\phase4-correction-v5.2.47\.qa-build-v5.2.47-release`

## 15. Version Consistency

`package.json`, `package-lock.json`, lock root, `src/version.ts`, `index.html`, `public/manifest.webmanifest` и `public/sw.js` са consistent с `v5.2.47`. `npm run test:release-version`: **PASS**.

## 16. App.tsx SHA Integrity

- Before SHA-256: `0D8951CC56B94ABE609914BB1391BF6B4C63C5EB15D08844ACEB6A3E8D5B0BA0`
- After SHA-256: `0D8951CC56B94ABE609914BB1391BF6B4C63C5EB15D08844ACEB6A3E8D5B0BA0`
- Result: **PASS**, byte-for-byte unchanged.

## 17. Runtime Isolation

**PASS**. `App.tsx` и `main.tsx` нямат Phase 4 imports/calls; `main.tsx` е byte-for-byte unchanged; production bundle няма Phase 4 correction markers; solver-ът няма `localStorage` или `Date.now()`; няма backup schema, migration, UI или runtime activation.

## 18. Dependency Changes

Няма dependency или devDependency промени спрямо v5.2.46. Не е добавяна time/date library или test runner. Няма `prebuild`/`postinstall` hook и не е изпълняван `npm audit fix`.

## 19. Exact Files Added

- `MASTER_PROJECT_QA_v5.2.47.md`
- `PHASE4_CORRECTION_QA_REPORT_v5.2.47.md`

## 20. Exact Files Modified

- `index.html`
- `package-lock.json`
- `package.json`
- `public/manifest.webmanifest`
- `public/sw.js`
- `scripts/rest-engine-phase2-3-test.ts`
- `scripts/rest-engine-phase4-test.ts`
- `src/rest-engine/types.ts`
- `src/rest-engine/weekly-rest-allocation.ts`
- `src/version.ts`
- `VERSION_HISTORY_RECENT.md`

## 21. Exact Files Deleted

- `MASTER_PROJECT_QA_v5.2.46.md` — superseded by the v5.2.47 continuity file.

## 22. Compensation / Phase 5 Boundary

Solver output не съдържа `CompensationObligation`, `CompensationBlock`, repayment, attachment или debt ordering. Phase 4 пази only source identity и fixed-week allocation role, нужни за бъдеща отделна Phase 5 работа.

## 23. Package and Extracted-Package Validation

**PASS**.

- Preliminary и final package validation: един expected root и 59 source/QA файла.
- Staging→extraction SHA-256 comparison: 59/59 PASS.
- Забранени package директории (`node_modules`, build output, test temp, cache, VCS metadata): 0.
- Extracted `npm ci --offline --no-audit`: PASS, 66 packages от съществуващия workspace cache.
- Extracted Phase 4 T51–T97: 47/47 PASS, включително T91–T97 = 7/7 PASS.
- Extracted T01–T50: 50/50 PASS; nested complete legacy regression в T34: PASS.
- Extracted Phase 1 A–H: 8/8 PASS.
- Extracted TypeScript noEmit и version consistency v5.2.47: PASS.
- Extracted fresh production build: PASS, 31 transformed modules и 10 build файла в `C:\Users\itso1\Documents\Codex\2026-09-12\this-is-a-fresh-independent-forensic\work\phase4-correction-zip-validation-v5.2.47-prelim\driver-pay-app-v5.2.47-rest-engine-allocation-anchor-counted-fix-source-qa\.zip-qa-build-v5.2.47`.
- След install/test/build всички 59 пакетируеми файла останаха byte-for-byte идентични със staging source-а.

## 24. Known Non-Blocking Limitation

Приетото Phase 2+3 ограничение остава непроменено: historical logical duplicate records с различни `factId` стойности не се обединяват автоматично без authoritative cross-storage identity policy.

## 25. Windows Sandbox Build Workaround

Когато е необходимо, tests/build се изпълняват през workspace-contained temporary `subst` mapping. Това не разширява filesystem permissions и не променя test или product semantics.

## 26. Phase 5 Status

PHASE 5 NOT STARTED.

## 27. Final Verdict

PHASE 4 CORRECTION PASS — READY FOR INDEPENDENT REVIEW
