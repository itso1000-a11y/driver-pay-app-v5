# DRIVER PAY APP — REST ENGINE v1 PHASE 2+3 CORRECTION QA REPORT v5.2.45

## 1. Executive Result

PASS. Narrow v5.2.45 correction е реализирана, а working-copy и extracted-package QA са завършени успешно.

## 2. Baseline / Failed Candidate Identity

- Failed independent-review candidate: `driver-pay-app-v5.2.44-rest-engine-chronology-candidates-source-qa.zip`
- Corrected working copy: `C:\Users\itso1\Documents\Codex\2026-09-12\this-is-a-fresh-independent-forensic\work\phase2-3-v5.2.45`
- Target release: `v5.2.45`
- Required `App.tsx` SHA-256: `0D8951CC56B94ABE609914BB1391BF6B4C63C5EB15D08844ACEB6A3E8D5B0BA0`

## 3. Independent Review Finding

При uniquely resolved factual Start без Finish v5.2.44 правилно блокира chronology след Start, но пренася forward-only missing-Finish reason назад към вече установения rest, който завършва на този Start. Така clear 34h rest става REVIEW и губи `SINGLE_REDUCED` capability.

## 4. Root Cause

Busy span-ът Start→`asOf` държи едно общо `reviewReasons` множество. При emission на preceding `RestInterval` chronology добавя всички тези причини към интервала, включително причината „Work Start is factual but Work Finish is missing“, въпреки че тя не прави самия Start boundary несигурен.

## 5. Exact Correction

`Span` вече може да пази отделно `reviewReasonsAtStart`. За Start-without-Finish общите busy-span reasons продължават да съдържат missing-Finish diagnostic, а причините при известния Start съдържат само независимата uncertainty на Start. Preceding rest използва `reviewReasonsAtStart`; forward barrier продължава да използва пълните `reviewReasons`. Overlap diagnostics се запазват и в двата канала.

## 6. Files Added

- `MASTER_PROJECT_QA_v5.2.45.md` като continuity rename на v5.2.44 документа.
- `PHASE2_3_CORRECTION_QA_REPORT_v5.2.45.md`.

## 7. Files Modified

Functional correction:

- `src/rest-engine/chronology.ts`
- `scripts/rest-engine-phase2-3-test.ts`

Version/document identity:

- `package.json`
- `package-lock.json`
- `src/version.ts`
- `index.html`
- `public/manifest.webmanifest`
- `public/sw.js`
- `VERSION_HISTORY_RECENT.md`

## 8. Files Deleted

- `MASTER_PROJECT_QA_v5.2.44.md` е заменен чрез continuity rename с `MASTER_PROJECT_QA_v5.2.45.md`; историческото съдържание е запазено.

## 9. Dependency Changes

Няма dependency промени. `@js-temporal/polyfill` остава точно 0.5.1. Не е добавена date/time library или test runner.

## 10. T50 Result

PASS. T50 проверява всички изисквани свойства: existing preceding interval, exact known-Start endpoint, CLEAR status, exact 34h duration, `SINGLE_REDUCED`, >=45h `SINGLE_REGULAR`, запазен `INCOMPLETE_WORK_START`, липса на post-Start rest, stable ID/status/duration при advance на `asOf`, липса на allocation/debt и ambiguous-fold Start negative control с two exact candidates и `REVIEW_ONLY`.

## 11. T01–T49 Regression Result

PASS 49/49. Съществуващата Phase 2+3 test matrix е изпълнена без премахнати или отслабени assertions. T10 е засилен с explicit CLEAR assertion за rest преди uniquely resolved incomplete Start.

## 12. Phase 1 A–H Result

PASS 8/8. Historical 21:00, spring/autumn exact 144h, before/equal/after ordering, device-timezone independence, fold, gap и Sunday 24:00/deadline tests остават успешни.

## 13. Legacy Regression Result

PASS 19/19 npm script групи: backup/restore, weekly-rest timeline, End Week intent, compensation creation/repayment и regressions v5.2.20, .21, .22, .23, .24, .26, .27, .31, .32, .33, .36, .37, .38 и .42.

## 14. Known-Start/Missing-Finish Acceptance Case

- Preceding factual rest Sunday 00:00→Monday 10:00: **CLEAR**.
- Exact duration: **34h**.
- Candidate: **SINGLE_REDUCED**.
- Post-Start rest: **NONE**.
- `INCOMPLETE_WORK_START`: **PRESENT**.
- `asOf` advance: preceding interval identity/status/duration **UNCHANGED**.

## 15. Known-Start/Known-Finish Control

PASS. T01 и T11 потвърждават нормалната known Start + known Finish chronology, maximal interval derivation и historical recomputation без промяна.

## 16. Ambiguous-Start Negative Control

PASS. Autumn 01:30 Start е `AMBIGUOUS_FOLD` с два exact candidates. Preceding chronology остава `REVIEW_REQUIRED` и downstream capability е само `REVIEW_ONLY`; fix-ът не създава false CLEAR result.

## 17. TypeScript Result

PASS: `node node_modules/typescript/bin/tsc --noEmit`.

## 18. Fresh Build Result

PASS: fresh production build към `C:\Users\itso1\Documents\Codex\2026-09-12\this-is-a-fresh-independent-forensic\work\phase2-3-v5.2.45\.qa-build-v5.2.45-release`. Vite трансформира 31 modules и създаде 10 build files.

## 19. Version Consistency

PASS: `package.json`, `package-lock.json`, lock root, `src/version.ts`, `index.html`, `public/manifest.webmanifest` и `public/sw.js` са v5.2.45. `test:release-version` е PASS.

## 20. App.tsx SHA Integrity

- Before: `0D8951CC56B94ABE609914BB1391BF6B4C63C5EB15D08844ACEB6A3E8D5B0BA0`
- After: `0D8951CC56B94ABE609914BB1391BF6B4C63C5EB15D08844ACEB6A3E8D5B0BA0`
- Result: PASS, byte-for-byte unchanged.

`src/rest-engine/time.ts` също е byte-for-byte unchanged с SHA-256 `F683B4599867C92F42E99A63C65E0FB83A6B7EB6914C46699D6D969A9480364D`.

## 21. Runtime Isolation

PASS. `App.tsx`/`main.tsx` нямат Phase 2+3 imports или calls; production bundle няма Phase 2+3 API/pattern markers; няма `localStorage` в Phase 2+3 modules, няма `prebuild`/`postinstall`, backup schema change или runtime wiring.

## 22. Package Integrity

PASS. Complete source package съдържа 55 файла под един project root. Stage-to-extraction SHA-256 сравнението е идентично за всеки файл. Архивът не съдържа `node_modules`, `dist`, npm cache, test temp, QA build directories, editor junk или `.git`. От preliminary extracted root са изпълнени успешно offline `npm ci`, пълна `npm test`, отделен `tsc --noEmit` и fresh production build. След финализиране на report-а окончателният ZIP е извлечен повторно и е потвърден чрез file-count, path и per-file SHA-256 equality.

## 23. Known Limitations

Exact duplicate facts се deduplicate-ват по общ `factId` и canonical signature. Исторически записи с различни `factId` стойности не се обединяват без authoritative cross-storage identity policy. Това secondary observation не е променяно в narrow correction.

Phase 4 функции като fixed-week allocation, branch selection, two-week compliance, 144h solver, compensation ownership/repayment и UI/storage integration не са реализирани.

## 24. Phase 4 Status

Phase 4 не е започната.

## 25. Final Verdict

PHASE 2+3 CORRECTION PASS — READY FOR INDEPENDENT REVIEW
