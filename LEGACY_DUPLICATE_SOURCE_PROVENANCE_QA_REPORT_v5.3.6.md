# Driver Pay App v5.3.6 — Legacy duplicate-source provenance QA

## Reproduction

Untouched v5.3.5 reproduced the defect with an archive historical Saturday `2026-09-19` Off and an equivalent `driverApp_week_2026-09-19` record, both with `completionSource: undefined`, plus live Sunday work data. The saved-week candidate won precedence. It did not carry `historicalPersisted`, migrated as `PLACEHOLDER`, and split the Friday `19:30` rest at midnight. The factual Rest Card selected the Sunday civil-day `08:00` interval (`BELOW_9H`) instead of the Friday-to-Sunday interval.

## Root cause and fix

`migrateLegacyFacts` selected only the highest-precedence saved-week candidate, so the equivalent lower-ranked closed archive row's pre-provenance historical evidence was discarded.

`src/rest-engine/migration.ts` now transfers archive historical evidence to a selected non-work candidate only if both rows have the same date, row identity, day type, Start, Finish, explicit completion provenance, bulk state and non-GB state. Any material disagreement leaves ordinary precedence unchanged and transfers nothing. `src/rest-engine/facts.ts` continues to require a past London date, non-bulk state and either explicit provenance or this narrowly inherited archive evidence. Current, future, default and saved-only rows remain non-factual.

## Changed files

- `src/rest-engine/migration.ts`
- `scripts/phone-production-path-test.ts`
- Version/release metadata: `package.json`, `package-lock.json`, `src/version.ts`, `index.html`, `public/manifest.webmanifest`, `public/sw.js`, `MASTER_PROJECT_QA_v5.3.6.md`, `VERSION_HISTORY_RECENT.md`
- This report

## Test results

- R01 duplicate source / Sunday `08:00`: PASS — `36h30`, `WEEKLY_REDUCED`.
- R02 duplicate source / Sunday `05:15`: PASS — `33h45`.
- R03 reload/restore: PASS.
- R04 saved-week only, no archive evidence: PASS — non-factual.
- R05 conflicting archive/saved copies: PASS — no inheritance.
- R06 current/future/default: PASS — non-factual/planned.
- R07 explicit user provenance: PASS.
- R08 Europe/London date authority: PASS.
- Affected phone production-path regression: PASS, 22/22.
- Full `npm test`: PASS (Phase 1 A–H; T01–T283; phone, Pay, daily/split rest, archive, End Week, backup and historical regressions; version consistency).
- `npx tsc --noEmit`: PASS.
- Fresh `npm run build`: PASS.
- Release/version consistency: PASS inside the full regression.

## Protected areas

- Pay Engine changed: **NO**.
- Phase 1–5 legal logic changed: **NO**.
- Phase 6 logic changed beyond the required migration boundary: **NO**.
- Phase 7 warning logic changed: **NO**.
- Phase 8 presentation logic changed: **NO**.
- `src/App.tsx` changed: **NO** in v5.3.6.
- Driver-facing wording changed: **NO**.
- Colours/CSS/layout changed: **NO**.
- PWA update behavior changed: **NO**.

No physical-phone acceptance is claimed.
