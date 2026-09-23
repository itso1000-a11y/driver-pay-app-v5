# Driver Pay App v5.3.2 — Phone Regression Fix QA Report

## Scope and evidence

The accepted v5.3.1 source package was used as the baseline. Archived releases were inspected as evidence only; no archived package was modified. This release makes four narrow corrections: partial time-input isolation, factual rest continuity through non-work days, driver-facing Weekly Rest presentation, and explicit PWA update activation.

## Forensic findings and correction

| Regression | Historical point and root cause | Narrow correction | Evidence |
| --- | --- | --- | --- |
| Partial Start/Finish white screen | The v5.3.0 Phase 8 `EngineEvaluation` adapter re-evaluated visible rows on every edit. `formatTimeInput` persisted a first digit such as `"0"`; migration treated any non-empty value as a factual timestamp and `Temporal.PlainTime.from("0")` threw. Earlier v5.2.43 editing did not enter the production engine. | `src/rest-engine/facts.ts` treats only complete `HH:MM` or legacy-complete `HH:MM:SS` values as factual wall times. Incomplete text remains editable UI state. | P01 and real-browser first-digit check. |
| Friday Finish → Off → Sunday Start rest | Direct v5.3.1 engine evaluation already produced the factual 36h30 interval. The legal chronology did not cut rest at `Off`; the reported phone symptom could therefore not be reproduced as a current engine defect. The regression protection was absent from the active phone QA. | No allocation or chronology rule was changed. P02/P03 lock the observed 36h30 continuity through `Off` and `Holiday` rows. | P02, P03, T01–T245. |
| Rest-card wording and colour treatment | Phase 8 introduced internal terms such as `allocation pending` and `rolling 144h` into driver-facing presentation and replaced the established gradient status palette with flat colours. | `src/rest-engine/presentation.ts` restores driver wording; `src/App.tsx` restores the historical palette while retaining factual Rest Card / separate warning and compensation architecture. | P04, P06, T246–T283, browser EN/BG check. |
| PWA update prompt | `public/sw.js` called `skipWaiting()` during `install`, so an update could activate before the waiting-worker banner flow. | The worker now waits. The existing Update action posts `SKIP_WAITING`; `controllerchange` performs the single controlled reload. `src/main.tsx` no longer reloads blindly when no waiting worker exists. | P05 and production-build inspection. |

## Changed files

- `src/rest-engine/facts.ts`
- `src/rest-engine/presentation.ts`
- `src/App.tsx`
- `src/main.tsx`
- `public/sw.js`
- `scripts/phone-regression-test.ts`
- `scripts/rest-engine-phase2-3-test.ts`
- `scripts/rest-engine-phase8-test.ts`
- `package.json`, `package-lock.json`, version/release metadata, and this report

No Phase 1–7 legal allocation, compensation, warning aggregation or Pay Engine calculation was changed. The complete regression includes the established byte-identical Pay calculation assertion.

## Executed validation

- New phone regression P01–P06: PASS.
- Phase 1 A–H: PASS.
- Phase 2+3 T01–T50: PASS.
- Phase 4 T51–T99: PASS.
- Phase 5 T100–T191: PASS.
- Phase 6+7 T192–T245: PASS.
- Phase 8 T246–T283: PASS.
- Full legacy, backup/restore, Weekly Rest, End Week, compensation, Pay/daily-rest/split-rest and UI/workflow regression command: PASS.
- TypeScript `tsc --noEmit`: PASS.
- Release/version consistency v5.3.2: PASS.
- Fresh Vite production build: PASS.
- Browser QA on the production build: PASS for mobile 390×844 and desktop 1280×900, no horizontal overflow, partial time-entry survival, Week Preview, and EN/BG switching. The bundled Chrome CDP runner could not run because the sandbox has no Chrome/Chromium executable; the available in-app browser was used instead.

## Packaging

The source-QA ZIP excludes `node_modules`, transient test directories and local build-workaround state. A clean extraction is checked against the ZIP source file set using per-file SHA-256 hashes. The actual ZIP SHA-256 and file count are recorded after package generation.

## Physical-phone status

The production artifact is ready for independent review and physical phone acceptance. Physical phone acceptance itself remains a user step and has not been claimed by this automated/browser QA.
