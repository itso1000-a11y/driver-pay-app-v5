# Driver Pay App v5.2.16 — Source QA Report

Date: 2026-08-02
Base: v5.2.15
Release purpose: Weekly Rest Timeline + End Week Intent Boundary
Status: SOURCE CANDIDATE — PASS, production build still blocked by dependency registry.

## Automated regression

- `npm test`: PASS
  - backup/restore round-trip: PASS
  - stale state replacement: PASS
  - atomic rollback on failed restore: PASS
  - production v2 snapshot/reload source guards: PASS
  - weekly-rest timeline regression: PASS
  - End Week next-day intent regression: PASS
- `npx tsc --noEmit --pretty false`: PASS

## Weekly-rest coverage

- repeated weekday IDs across multiple pay periods: PASS
- factual cross-week chronology: PASS
- five completed work cycles do not activate weekly-rest takeover: PASS
- six completed work cycles can activate timeline-driven weekly-rest Start: PASS
- 45h primary / 24h secondary behaviour guards: PASS
- regular mid-week weekly rest resets cycle: PASS
- reduced mid-week weekly rest resets cycle: PASS
- incomplete touched Work day forces conservative unknown state: PASS
- ownership remains stable after Start is entered: PASS
- timeline ownership blocks legacy compensation path: PASS
- no timeline-driven compensation-ledger create/complete write: PASS

## End Week coverage

- unchanged completed week feedback + no rewrite: PASS
- changed completed week update + no duplicate: PASS
- new completed week creates one archive item: PASS
- when factual timeline is known and weekly rest is not yet due, `Working tomorrow?` branch exists: PASS
- YES opens immediate next calendar day as Work in current Sat-ending model: PASS
- YES carries last known km to that target day only: PASS
- NO preserves legacy Monday/weekly-rest flow: PASS
- existing non-empty Sunday is not silently reclassified by the intent helper: PASS

## Real backup probe

Using `driver-pay-backup-2026-08-08-2026-08-02.json`:

- duplicate archived Saturday/week-ending records: none detected
- Mon 15 Jun 15:20 -> Thu 18 Jun 06:30 = 63h10m factual continuous rest: PASS, recognised as qualifying regular weekly rest
- factual >=24h gaps found across available history: 12

## Version / package integrity

- package.json version: 5.2.16
- package-lock.json version/root package: 5.2.16
- generated `src/version.ts`: 5.2.16
- JSON parse: package.json, package-lock.json, public/manifest.webmanifest: PASS
- `src/App.tsx` hash unchanged by version/test/documentation hardening after the End Week intent change: PASS
- node_modules excluded: PASS
- stale `dist/` absent: PASS

## Production build

BLOCKED BY ENVIRONMENT, NOT COUNTED AS PASS.

- `npm ci --cache /mnt/data/npm-cache-driverpay ...` failed because the internal registry returns 404 for `yallist-3.1.1.tgz`.
- direct `npx vite@5.4.2 build` also failed because the same internal registry could not provide Vite.
- No production `dist/` is approved or included until a fresh build succeeds from this exact source.

## Release discipline restored

From v5.2.16 onward:

- every functional/source change advances the version before handoff;
- materially different checkpoints must not share one version number;
- ZIP/checkpoint names include both version and a short descriptive purpose;
- QA-only retests of unchanged source may keep the same version, but any source correction discovered by QA advances the version.
