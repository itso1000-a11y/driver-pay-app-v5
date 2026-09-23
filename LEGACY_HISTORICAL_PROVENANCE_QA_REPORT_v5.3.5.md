# Driver Pay App v5.3.5 — legacy historical Off/Holiday provenance QA

## Problem and root cause

Records written before `completionSource` existed can contain a genuine historical `Off` or `Holiday` with `completionSource: undefined`. The production migration treated every such row as a placeholder. A Friday Finish could therefore be disconnected from the next Sunday Start even where the non-work day came from a closed historical archive.

## Exact correction

`src/rest-engine/migration.ts` now carries a `historicalPersisted` marker only for rows read from the closed `archive` storage source. `src/rest-engine/facts.ts` promotes a missing-provenance `Off/Holiday` only when all of these conditions hold: it is archive-backed historical persistence, it has a London civil date before the explicit as-of date, and it is not bulk-marked. All live/current, saved planning, default/planned, current and future rows without provenance remain non-factual. Explicit provenance behavior remains unchanged.

`src/App.tsx` now compares an explicit day selection to `formatLondonInstant(Date.now()).wallDate`, using the existing Europe/London utility instead of browser-local calendar time.

## Files changed

- `src/rest-engine/facts.ts`
- `src/rest-engine/migration.ts`
- `src/App.tsx`
- `scripts/phone-production-path-test.ts`
- `package.json`, `package-lock.json`, generated `src/version.ts`, `index.html`, `public/manifest.webmanifest`, `public/sw.js`
- `MASTER_PROJECT_QA_v5.3.5.md`, `VERSION_HISTORY_RECENT.md`, this report

## Executed tests

- `npm run test:phone-production-path`: PASS, 17/17. This starts the legacy regressions with `completionSource === undefined`: Friday `19:30` → archive legacy Saturday Off → Sunday `08:00` = `36h30`; Sunday `05:15` = `33h45`; archive persist/reload/restore is identical. It also verifies current/future/default rows remain non-factual and the London past/current/future boundary.
- `npm run test:phone-regression`: PASS, P01–P06.
- `npm run test:rest-engine-phase2-3`: PASS, T01–T50.
- `npm run test:rest-engine-phase6-7`: PASS, T192–T245.
- `npm run test:rest-engine-phase8`: PASS, T246–T283.
- `npx tsc --noEmit`: PASS.
- `npm run build`: PASS; fresh production build completed for `v5.3.5`.
- `npm run test:release-version`: PASS; package, lockfile, generated version, HTML, manifest, service worker, master QA and history identify `v5.3.5`.

## Preservation confirmation

No Pay Engine file or calculation logic was changed. No Phase 1–7 legal evaluator, allocation, compensation or warning rule was changed. Existing wording, palette, partial time typing, compact `HHMM`, archive/navigation/End Week and explicit PWA update behavior remain covered by the executed relevant regression checks.

Physical-phone acceptance was not performed and is not claimed by this report.
