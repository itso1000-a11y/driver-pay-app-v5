# Driver Pay App v5.3.4 — Phone production-path and presentation QA

## Scope and result

The v5.3.4 correction is limited to production provenance and driver presentation. `setCurrentDayType` persists `completionSource: "user"` only when the driver explicitly chooses `Off` or `Holiday` for a past civil day. Current/future rows and untouched default Sunday rows remain unconfirmed. The result is a factual rest interval from Friday Finish through the confirmed non-work day to the next factual work Start.

The release also simplifies unresolved weekly-rest driver copy, retains the accepted red/yellow/green palette, removes a raw severity badge from the compensation panel, and prevents the heading `Compensation due` where the displayed items are completed or only under review. Phase 1–7 legal logic, Pay Engine logic, `src/main.tsx`, navigation/archive/End Week behavior and the PWA update action were not changed.

## Executed verification

- `npm run test:phone-production-path`: PASS, 15/15 assertions. It includes Friday `19:30` → explicit past Off/Holiday → Sunday `08:00` = `36h 30m`, Sunday `05:15` = `33h 45m`, reload consistency, compact `HHMM`, partial-entry exclusion, planned/default non-factual behavior, historical labels, palettes and presentation checks.
- `npm run test:phone-regression`: PASS, P01–P06.
- `npm run test:rest-engine-phase8`: PASS, T246–T283 (38/38).
- One final `npm test`: PASS. This executes the Phase 1 foundation A–H, T01–T245, T246–T283, phone tests, backup/restore, weekly-rest, End Week, compensation, historical UX, archive, daily-rest, Split Rest and Pay regressions, plus release consistency.
- `npx tsc --noEmit`: PASS.
- Fresh `npm run build`: PASS. The built identity is `v5.3.4`; `dist/index.html`, manifest, service worker and production asset are present.
- Browser/mobile QA: PASS in the current production preview at `http://127.0.0.1:41752/`. The loaded page displayed `Driver Pay App V5.3.4`; the English main screen and Week Preview rendered, including Rest snapshot, Back and End Week, without an observed UI failure. This is browser emulator evidence; physical phone acceptance remains pending.
- Version consistency: PASS through the final regression. `package.json`, `package-lock.json`, `src/version.ts`, `index.html`, manifest, service-worker cache, master QA file and recent version history all identify `v5.3.4`.

## Frozen-file and runtime checks

- `src/main.tsx` SHA-256: `EB2078BF9A00D647A589B71BEE995E54D105AF60CAD8E71EB018BE40B33D33A6`.
- `src/App.tsx` SHA-256 after the authorised provenance/presentation work: `41B68A48E98484561A6598AC10D089307332584E222A42BCE858EC60B39995EE`.
- No dependency was added and no audit/fix operation was run.
- The final source package excludes `node_modules`, transient test directories and workspace-only artifacts. The built `dist` is included as the inspected production artifact.

## Package integrity

The final ZIP is created only after this report is present in the source tree. It is extracted into a clean workspace directory and every extracted file is compared by path and SHA-256 against its package staging copy. The resulting ZIP hash and file count are recorded with the delivery artifact rather than recursively inside the ZIP itself.

Physical phone acceptance is a user step after independent review.
