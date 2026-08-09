# Driver Pay App v5.2.23 — Heavy QA Plan

Do not correct source during QA. Report defects only.

## Technical
- ZIP/root/version identity = v5.2.23 everywhere.
- npm ci.
- npm test.
- npx tsc --noEmit.
- fresh npm run build.
- source hashes unchanged after QA.

## Scenario 1 — Normal End Week
With fewer than six factual cycles, complete a normal Monday–Friday week, press End Week Friday, and mark remaining days Off.
Verify Saturday shows Weekly Rest, candidate anchored to Friday Finish, 45h primary target and valid 24h secondary option. No `Weekly rest required` warning merely because End Week was pressed. No Start is silently saved.

Change Saturday Off → Work before 24h. Verify normal daily-rest validation decides legality and no false weekly-rest violation/debt is created.

## Scenario 2 — Mid-week weekly rest + weekend work
Create factual 45h+ weekly rest Tuesday–Thursday, then Work Friday/Saturday, press End Week Saturday, change Sunday Off → Work.
Verify the earlier factual rest remains cycle anchor, cycle count is correct, End Week creates a new informational candidate from Saturday Finish, Sunday proposal is visible, and an early-but-daily-legal Start is not falsely treated as weekly-rest violation.

## Scenario 3 — Rest already accrued before End Week
Finish Wednesday; Thursday/Friday/Saturday Off; press End Week Saturday.
Verify anchor stays Wednesday Finish, accrued hours are retained, no restart at button press, passed 45h endpoint uses existing `Weekly rest ended [day/time]` context, and Sunday Start is allowed if factual rest is sufficient.

## Six-cycle mandatory warning
Create factual weekly-rest anchor followed by exactly six completed work cycles without relying on End Week. Verify timeline ownership activates, early Start uses existing red warning presentation and `Weekly rest required`, and ownership remains stable after Start.

## Regression
Run backup/restore, weekly timeline, End Week intent, compensation creation/repayment/chronology, v5.2.20, v5.2.21, v5.2.22, v5.2.23, Pay Engine, archive feedback/duplicate protection, Start KM and past-saved-day visual checks.

PASS only if all three End Week scenarios and the six-cycle warning scenario pass without weakening factual chronology, compensation or archive protections.

==================================================
R2 QA COVERAGE CORRECTION
==================================================

The first v5.2.23 package was rejected because `scripts/v5-2-23-endweek-weekly-rest-regression-test.mjs` performed source-pattern checks only.

In r2 the same test now MUST:

- compile an instrumented copy of the actual `src/App.tsx` in memory using the installed build toolchain;
- execute the real App.tsx helper functions;
- instantiate concrete DayRecord states;
- seed/read the real weekly-rest candidate storage path;
- execute the three mandatory scenarios and assert anchors, 24h/45h targets, cycle state, Off → Work unsaved Start behaviour, daily-rest legality separation and factual weekly-rest recognition;
- leave the on-disk application source unchanged.

QA must inspect the test and confirm it is not merely regex/source-pattern validation.

