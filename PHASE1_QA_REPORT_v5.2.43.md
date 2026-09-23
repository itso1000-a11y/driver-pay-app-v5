# PHASE 1 QA REPORT — v5.2.43

## 1. Executive Result

PASS. Rest Engine v1 Phase 1 adds an isolated, standards-based `Europe/London` time foundation. The module compiles and all new and existing automated tests pass. It is not imported by the application runtime.

## 2. Scope Implemented

- Typed representation of exact UTC instant, entered London wall date/time, IANA timezone, resolved offset, provenance and review state.
- Explicit detection of autumn DST folds and spring DST gaps.
- Exact elapsed millisecond/minute/hour arithmetic.
- UTC-instant to London civil conversion.
- London civil-day and Monday–Sunday fixed legal-week boundaries.
- Exact Sunday 24:00/Monday 00:00 and compensation deadline boundary primitives.
- Direct deterministic Phase 1 tests.

No Phase 2 factual chronology or runtime integration was implemented.

## 3. Files Added

- `src/rest-engine/types.ts`
- `src/rest-engine/time.ts`
- `scripts/rest-engine-time-foundation-test.ts`
- `MASTER_PROJECT_QA_v5.2.43.md`
- `PHASE1_QA_REPORT_v5.2.43.md`

## 4. Files Modified

- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `src/version.ts`
- `index.html`
- `public/manifest.webmanifest`
- `public/sw.js`
- `VERSION_HISTORY_RECENT.md`

## 5. Files Deleted

- `MASTER_PROJECT_QA_v5.2.42.md` was replaced by the consolidated `MASTER_PROJECT_QA_v5.2.43.md` continuity file.
- No production functionality was deleted.

## 6. Dependency Changes

- Added exactly pinned runtime dependency `@js-temporal/polyfill` `0.5.1`.
- Its sole new transitive package is `jsbi`.
- No existing dependency version changed and no existing package was removed.
- Native `Temporal` is unavailable in the validated Node 24.15.0 environment, so the polyfill is required for standards-based IANA timezone and disambiguation behaviour.
- No second date library and no additional test-runner dependency was added.
- `npm audit fix` was not run.

## 7. New Time Data Types

- `FactTimeProvenance`: `EXPLICIT | ASSUMED`.
- `FactTimeResolution`: `VALID | AMBIGUOUS_FOLD | NONEXISTENT_GAP | REVIEW_REQUIRED`.
- `InstantCandidate`: UTC instant, epoch milliseconds and resolved offset.
- `ZonedFactTime`: entered wall fields, `Europe/London`, provenance, resolution, review reasons and zero/one/two instant candidates.
- `LondonCivilTime`, `LondonCivilDayBounds`, `FixedLegalWeek` and `LegalBoundary`.

## 8. New Time API

- `resolveLondonWallTime`
- `formatLondonInstant`
- `addElapsedMilliseconds`
- `addElapsedMinutes`
- `addElapsedHours`
- `compareInstants`
- `londonCivilDayBounds`
- `fixedLegalWeekForInstant`
- `legalSundayEndForWeek`
- `compensationDeadlineForWeek`

All APIs use explicit `Europe/London` or UTC instants. None reads the device timezone as legal authority.

## 9. Phase 1 Test Results

Command: `npm run test:rest-engine-time`

Result: PASS — Tests A through H all passed against `src/rest-engine/time.ts` directly.

## 10. Historical 21:00 Regression Result

PASS — `2026-02-02 21:00 Europe/London + 9 elapsed hours` produced `2026-02-03 06:00`; `+11 elapsed hours` produced `08:00`. The prohibited 05:00 result was explicitly rejected.

## 11. GMT→BST Result

PASS — `Mon 23 Mar 2026 08:00 GMT + 144 elapsed hours` produced `Sun 29 Mar 2026 09:00 BST`, with an exact instant difference of 144 hours.

## 12. BST→GMT Result

PASS — `Mon 19 Oct 2026 08:00 BST + 144 elapsed hours` produced `Sun 25 Oct 2026 07:00 GMT`, with an exact instant difference of 144 hours.

## 13. Exact 144h Result

PASS — one second and one minute before, exact equality, and one second and one minute after the 144h instant preserve strict ordering.

## 14. Device Timezone Independence Result

PASS — the same London fact was resolved under process timezones `America/Los_Angeles` and `Pacific/Auckland`; both produced the identical UTC instant and London civil result.

## 15. DST Fold Result

PASS — `25 Oct 2026 01:30 Europe/London` returned `AMBIGUOUS_FOLD`, required review, no silently selected instant, and two candidates one elapsed hour apart with offsets `+01:00` and `+00:00`.

## 16. DST Gap Result

PASS — `29 Mar 2026 01:30 Europe/London` returned `NONEXISTENT_GAP`, required review, no instant and no silently normalised 02:30 value.

## 17. Sunday 24:00 Boundary Result

PASS — Sunday 24:00 equals the exact following Monday 00:00 London instant in normal, spring-transition and autumn-transition weeks. The transition weeks were correctly measured as 167 and 169 elapsed hours. The third-following-week deadline primitive also resolved to an exact London boundary.

## 18. Full Existing Regression Suite Result

Command: `npm test`

Result: PASS. The complete suite passed:

- Phase 1 time foundation
- backup/restore round trip
- weekly-rest timeline
- End Week intent
- timeline compensation creation
- timeline compensation repayment
- v5.2.20 UX/validation
- v5.2.21 rest/archive
- v5.2.22 current-day Weekly Rest
- v5.2.23 End Week behavioural scenarios
- v5.2.24 long-rest context
- v5.2.26 Weekly Rest UI contract
- v5.2.27 ownership/workflow
- v5.2.31 Rest state/counter/lifecycle
- v5.2.32 Start provenance
- v5.2.33 saved-week chronology
- v5.2.36 Start helper/KM provenance
- v5.2.37 Week Preview chronology
- v5.2.38 mobile layout/bonus
- v5.2.42 End Week pay-context carry-forward
- release/version consistency

## 19. TypeScript Result

Command: `node_modules/.bin/tsc --noEmit`

Result: PASS with no diagnostics.

## 20. Production Build Result

Command: `npm run build`

Result: PASS using Vite 5.4.21; 31 modules transformed. Output included `dist/index.html` and a 260.04 kB production JavaScript bundle. The build was run from:

`C:\Users\itso1\Documents\Codex\2026-09-12\this-is-a-fresh-independent-forensic\work\phase1-v5.2.43-build`

The native esbuild subprocess was run through a process-local mapped drive with preserved symlink paths to keep all access inside the permitted workspace. No broader filesystem permission was used.

## 21. Version Consistency Result

PASS. Checked locations:

- `package.json`: `5.2.43`
- `package-lock.json` top-level and root package: `5.2.43`
- `src/version.ts`: `v5.2.43`, `5.2.43`, `V5.2.43`
- `index.html`: `Driver Pay App v5.2.43`
- `public/manifest.webmanifest`: description `Driver Pay App v5.2.43`
- `public/sw.js`: cache `driver-pay-v5-2-43`
- `MASTER_PROJECT_QA_v5.2.43.md`: `Consolidated through v5.2.43`
- `VERSION_HISTORY_RECENT.md`: v5.2.43 entry
- Built `dist/index.html` and `dist/sw.js`

Dedicated result: `Release/version consistency v5.2.43: PASS`.

## 22. App.tsx SHA-256 Integrity

- Before v5.2.42: `0D8951CC56B94ABE609914BB1391BF6B4C63C5EB15D08844ACEB6A3E8D5B0BA0`
- After v5.2.43 Phase 1: `0D8951CC56B94ABE609914BB1391BF6B4C63C5EB15D08844ACEB6A3E8D5B0BA0`

Additional hashes:

- `src/rest-engine/types.ts`: `D82E397ED803F2DC663B7F15790B0EF91D600DAD1BE2D95701F50985458EF1D2`
- `src/rest-engine/time.ts`: `F683B4599867C92F42E99A63C65E0FB83A6B7EB6914C46699D6D969A9480364D`
- `scripts/rest-engine-time-foundation-test.ts`: `10DE42A5C72F847B3C230A60D55645604A4985452A7788AC595A0E5ECA8202D9`

`APP.TSX FUNCTIONAL CHANGE: NO`

## 23. Runtime Behaviour Confirmation

- `App.tsx` and `main.tsx` contain no import or reference to `src/rest-engine`, `resolveLondonWallTime` or `@js-temporal/polyfill`.
- The production bundle contains no Phase 1 API or Temporal-polyfill marker.
- Existing regression behaviour remains green.

`CURRENT REST ENGINE RUNTIME CHANGED: NO`

`CURRENT USER-VISIBLE REST BEHAVIOUR CHANGED: NO`

Only normal v5.2.43 version identity is user-visible.

## 24. Package Integrity

- Complete source package with one project root.
- Includes `package.json`, `package-lock.json`, all source, scripts, continuity files and this report.
- Excludes `node_modules`, npm caches, test temporary files and `dist` build output.
- Dependency installation was independently reproduced with `npm ci --offline --no-audit` in the isolated QA copy.
- ZIP extraction, required-file inventory, file hashes, full tests, TypeScript and fresh build are verified against an extracted copy before delivery.

## 25. Known Limitations

- The Phase 1 test command uses Node 24 native TypeScript type stripping; the validated toolchain is Node 24.15.0.
- The new time foundation is intentionally inactive. It does not correct existing runtime Rest Engine DST behaviour in Phase 1.
- No factual chronology, storage migration, allocation solver, compensation rewrite or UI integration is included.
- Existing dependency advisories were reported by npm. `npm audit fix` was not run, per scope.

## 26. Phase 2 Status

NOT STARTED

## 27. Final Verdict

PHASE 1 PASS — READY FOR REVIEW
