# DRIVER PAY APP — NEW CHAT HANDOVER

**This file is mandatory reading for every new chat/developer session.**

## STOP — BEFORE TOUCHING CODE

Read in this order:

1. `PROTECTED_BEHAVIOURS.md`
2. `MASTER_PROJECT_REFERENCE.md`
3. `VERSION_INDEX.md`
4. latest section of `CHANGELOG.md`
5. `docs/QA_HISTORY.md`
6. only then inspect the source area you intend to change

## PRIMARY LAW

`PROTECTED_BEHAVIOURS.md` is the canonical Master Decision Register.

Do not silently change a protected behaviour because:
- the current code looks simpler another way;
- an old test seems inconvenient;
- a newer feature appears to conflict;
- the chat does not remember why the rule exists.

If code, tests and the Register disagree:

1. stop;
2. identify the protected rule IDs;
3. inspect project history/source;
4. tell the user exactly what conflicts;
5. do not modify the protected behaviour until the user explicitly resolves the conflict.

## CURRENT DEVELOPMENT GOAL

First achieve a stable, physically tested working baseline with no lost functions or decisions.

Only after that baseline is accepted should Setup development begin.

## CURRENT BRANCH

Runtime application source: **v5.2.25 source-QA line**.

v5.2.25 is an attempted Weekly Rest UI-contract recovery after v5.2.24 passed heavy source QA but failed the real-phone UX expectation by not visibly presenting Weekly Rest / proposals in the actual user workflow.

Do not call v5.2.25 stable until:
- heavy QA passes;
- required physical-phone scenarios pass;
- no protected function is missing.

## CRITICAL RECENT HISTORY

- v5.2.16 contains important stable and pre-due-gate historical source.
- v5.2.17–v5.2.19 are intermediate compensation checkpoints; useful evidence, not automatically authoritative stable baselines.
- v5.2.20 introduced later UX/archive changes.
- v5.2.21 restored date-aware soft archive and weekly-rest visibility after archive audit.
- v5.2.22 corrected same-pay-week/current-day road-test regressions.
- v5.2.23 separated End Week candidate visibility from six-cycle mandatory warning.
- v5.2.24 removed arbitrary 72h candidate expiry and added factual candidate consumption; heavy QA passed.
- Physical-phone testing still showed missing visible Weekly Rest / Start proposal UX and missing direct current-week return from soft archive.
- v5.2.25 is the focused UI-contract recovery branch.

## NEVER LOSE THESE THREE WEEKLY-REST SCENARIOS

See `WR-013` in `PROTECTED_BEHAVIOURS.md`.

They must be behaviorally simulated, not only source-pattern checked.

## SETUP

Do not start Setup redesign in the same version as baseline recovery.

When the stable baseline is accepted, create a separate Setup design plan that references the protected behaviour IDs it may configure and the IDs it must never override.

## DOCUMENTATION DISCIPLINE

A future release ZIP without an updated `PROTECTED_BEHAVIOURS.md` is incomplete.

If a new decision is made in chat:
- add it to the Register in the same version;
- do not rely on chat memory alone.

## v5.2.26
WR-014–WR-018 are protected. Keep legal weekly-rest START deadline, 24h reduced completion and 45h regular completion as separate concepts. Cross-day proposals require weekday + time.
