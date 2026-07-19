# Driver Pay App v5.2.13 — Full QA Report

Date: 2026-07-19

## Verdict

**NOT APPROVED AS STABLE BASELINE.**

The submitted v5.2.12 contained a proven TypeScript validation defect. The narrow source correction requires version **v5.2.13**. Technical validation and the exact v5.2.11 regression comparison pass after the fix, but the full interactive suite could not be executed because this QA environment has no browser binary and its Chromium download is blocked.

v5.2.13 is therefore a **QA candidate**, not a stable baseline.

## Results

| Test | Result | Evidence / limitation |
|---|---|---|
| QA-TECH-001 ZIP integrity | PASS | `unzip -t` passed; no nested ZIP, temp files, or missing documentation. `dist` is the deploy output and was reproducibly rebuilt. |
| QA-TECH-002 Version consistency | PASS after fix | package, lockfile, UI source, title, manifest, service-worker cache, docs and output all report 5.2.13. Final ZIP filename reports 5.2.13. |
| QA-TECH-003 Dependencies | PASS | `npm ci` installed 64 packages. Non-blocking warning: inherited npm `http-proxy` config is deprecated. Initial cache-path failure was environment-only and passed with a writable cache. |
| QA-TECH-004 Production build | FAIL in v5.2.12; PASS after fix | Vite bundled v5.2.12 but warned about duplicate keys; `tsc --noEmit` failed with 14 TS1117 errors. v5.2.13 passes Vite build and TypeScript validation cleanly. |
| QA-TECH-005 Regression comparison to v5.2.11 | PASS | Exact source/file diff completed. The only functional v5.2.11 → v5.2.12 change is the intended `updateTimeValue` daily Start auto-accept path when Finish is entered. Other differences are version identity, release documentation and rebuilt bundle names. No CSS, Pay Engine, Archive, Weekly Rest Engine, compensation-ledger or unrelated source changes were found. v5.2.12 → v5.2.13 changes only duplicate English translation-key cleanup plus version/docs/build output. |
| QA-APP-001 Clean startup | FAIL — BLOCKED | Requires real browser execution. |
| QA-APP-002 Existing database | FAIL — BLOCKED | Requires browser storage and a representative existing backup/database fixture. |
| QA-APP-003 Reload persistence | FAIL — BLOCKED | Requires browser execution. |
| QA-START-001 First day/no previous Finish | FAIL — BLOCKED | Requires browser execution. |
| QA-START-002 11h suggestion | FAIL — BLOCKED | Requires browser execution. |
| QA-START-003 Accept 11h suggestion | FAIL — BLOCKED | Requires browser execution. |
| QA-START-004 Accept then edit Start | FAIL — BLOCKED | Requires browser execution. |
| QA-START-005 Move Start earlier | FAIL — BLOCKED | Requires browser execution. |
| QA-START-006 9h suggestion | FAIL — BLOCKED | Requires browser execution. |
| QA-START-007 Accept 9h suggestion | FAIL — BLOCKED | Requires browser execution. |
| QA-START-008 Reject 9h/use later Start | FAIL — BLOCKED | Requires browser execution. |
| QA-START-009 Less than 9h | FAIL — BLOCKED | Requires browser execution. |
| QA-START-010 Suggested is not saved | FAIL — BLOCKED | Requires browser execution and reload. |
| QA-REG-001 Manual Start + Finish | FAIL — BLOCKED | Requires browser execution. |
| QA-REG-002 Suggested Start + Finish | FAIL — BLOCKED | Requires browser execution. |
| QA-REG-003 Edit accepted Start + Finish | FAIL — BLOCKED | Requires browser execution. |
| QA-REG-004 Edit Finish | FAIL — BLOCKED | Requires browser execution. |
| QA-REG-005 Reload | FAIL — BLOCKED | Requires browser execution. |
| Phase 5 Daily Rest Engine matrix | FAIL — BLOCKED | Exact 11h, above 11h, exact 9h, 9–11h and below 9h were not interactively executed. |
| Phase 6 Split Daily Rest | FAIL — BLOCKED | Requires browser execution. |
| Phase 7 Weekly Rest Engine | FAIL — BLOCKED | Requires multi-day browser scenarios. |
| Phase 8 Compensation Ledger | FAIL — BLOCKED | Persistence and duplicate-entry checks require multi-week browser/storage scenarios. |
| Phase 9 Day Off / Holiday | FAIL — BLOCKED | Requires browser execution. |
| Phase 10 Archive | FAIL — BLOCKED | Requires browser execution with archived fixture. |
| Phase 11 Pay Engine regression | FAIL — BLOCKED | Requires browser execution and reference expected totals. |
| Phase 12 UI / Navigation | FAIL — BLOCKED | Requires browser execution. |
| Phase 13 PWA | FAIL — PARTIALLY BLOCKED | Manifest, cache version, service worker source, icons and built assets pass static validation; install, update prompt, cache lifecycle and refresh require a real browser. |
| Phase 14 Complete realistic week | FAIL — BLOCKED | Requires end-to-end browser execution. |

## Failure found and fixed

### Duplicate English translation keys

- Root cause: repeated pay/tax entries had accumulated inside the English `UI_TEXT` object.
- Effect: JavaScript used the final duplicate values, so the app could still bundle, but strict TypeScript validation failed with 14 TS1117 errors and Vite emitted warnings.
- Fix: removed only shadowed duplicate entries and retained the exact final runtime values already used by v5.2.12.
- Behavioural scope: no Rest Engine, Pay Engine, Archive, storage, navigation, layout, colour, or calculation changes.
- File changed: `src/App.tsx`.

## Release files changed

- `src/App.tsx`
- `package.json`
- `package-lock.json`
- `src/version.ts` (generated by version sync)
- `index.html` (generated version sync)
- `public/manifest.webmanifest` (generated version sync)
- `public/sw.js` (generated version sync)
- `dist/*` (rebuilt output)
- `CHANGELOG.md`
- `VERSION_INDEX.md`
- `docs/DEV_LOG.md`
- `docs/PROJECT_HISTORY.md`
- `docs/VERSION_HISTORY.md`
- `docs/QA_HISTORY.md`
- `QA_FULL_REPORT_v5.2.13.md`

## Required before stable approval

1. Run every browser/storage test above in Chromium or Edge, including a representative existing-data restore fixture.
2. Rerun the full realistic-week scenario after any failure fix.
3. Approve v5.2.13 as stable only when every blocked item passes.
