# v5.3.8 — FINISH GUIDANCE DAILY SLICE

## Consolidated through v5.3.8

- The Finish field now provides Daily Rest guidance only after a complete factual Start: normal 11h rest, an available 9h option, or an existing valid Split Rest option.
- Start suggestions and Finish guidance use the shared `daily-rest-boundaries.ts` source for the established 24h, 11h and 9h boundaries.
- Partial raw Start entries of one to three digits produce no Finish guidance. Existing typing, blur normalization and legacy HHMM compatibility are unchanged.
- Finish guidance never writes Finish, creates factual history, invokes the Rest Engine, or consumes a Weekly Rest deadline.
- Weekly Finish caps and pre-Start guidance are intentionally deferred pending a separate authoritative Weekly Rest deadline lifecycle.
- No Rest Engine core legal rule, checkpoint, persistence, migration, Pay, Profile, Archive or PWA behavior changed.

## Automated evidence

FG01–FG28, full npm test, TypeScript, fresh production build and release/version consistency passed. Browser smoke verified progressive Start typing and the exact EN/BG Daily Slice helpers. Physical phone acceptance remains pending.
