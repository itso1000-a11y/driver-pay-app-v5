# DRIVER PAY APP v5.2.30 — PHYSICAL PHONE ROAD TEST

## Status
APPROVED FOR PHYSICAL PHONE ROAD TEST.

This package is created directly from the v5.2.30-r2 source that passed:
- complete npm ci;
- complete npm test;
- all executable regression suites;
- real Vite + Chromium App regression;
- real 15h / 21h / 24h DOM acceptance;
- real Saturday Save & Next workflow;
- real End Week -> Working tomorrow? workflow;
- TypeScript;
- fresh production build;
- source integrity verification.

Runtime application version remains exactly **5.2.30**.

## Important
No runtime source, application text, dependency, configuration, service-worker,
MASTER decision, or executable test has been changed while creating this phone package.

## Required phone checks

1. 15h mandatory weekly rest
   - Start: `Weekly rest required`
   - target includes weekday + time
   - Rest Card: red `Weekly rest not completed`
   - `15h 00m`
   - no `Daily rest`
   - no `Reduced rest • Left: N`

2. 21h mandatory weekly rest
   - same weekly-rest ownership
   - red `Weekly rest not completed`
   - `21h 00m`

3. Exactly 24h
   - yellow `Reduced weekly rest`
   - `24h 00m`
   - `Compensation due: 21h 00m`

4. Historical Saturday
   - without Start: rest capped at end of selected Saturday
   - with Start: recalculated to factual Start
   - factual duration remains exact

5. Saturday Save & Next
   - saves Saturday
   - opens Week Preview
   - End Week remains manual
   - no simple refresh loop

6. End Week
   - `Working tomorrow?` is shown in normal active End Week,
     including six-cycle warning state
   - closed/archive correction must not ask it again

7. Navigation
   - direct `Go to current week` is visible from eligible non-current week
   - hard archive behaviour remains unchanged

8. Weekly Rest proposals
   - 24h / 45h proposals show weekday + time
   - no redundant `Weekly rest in progress`
   - 45h+ visible label remains `Weekly rest`

## Acceptance
If these physical-phone checks pass, v5.2.30 may be locked as the installed stable baseline before Setup work.
