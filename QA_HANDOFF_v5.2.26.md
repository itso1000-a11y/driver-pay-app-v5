# DRIVER PAY APP v5.2.26 — QA HANDOFF

## Purpose
Road-test correction checkpoint built from v5.2.25.

## Required checks
1. Read `PROTECTED_BEHAVIOURS.md`, especially WR-014 through WR-018.
2. Run the complete `npm test`.
3. Run `npx tsc --noEmit`.
4. Run a fresh `npm run build`.
5. Verify no protected behaviour outside the weekly-rest road-test corrections regressed.
6. Do not modify source during QA.

## v5.2.26 intended corrections
- 45h and 24h weekly-rest proposals show weekday + time.
- Weekly Rest block no longer says `Weekly rest in progress`.
- In mandatory/six-cycle weekly-rest context, factual rest below 24h is red `Weekly rest not completed`, not daily `Reduced rest • Left: N`.
- Factual reduced weekly rest (24h–44h59m) visibly shows compensation due.
- Six-cycle latest legal weekly-rest START deadline is calculated from the end of the previous recognized weekly rest and is displayed separately from 24h/45h completion targets.
- Continuous rest is not reset at Sunday 24:00 / Monday 00:00.

## Local validation status in packaging environment
Partial regression execution passed through v5.2.22 after the intentional old UI-contract tests were aligned with WR-018.
The remaining suites, TypeScript and production build could not be completed because `npm ci` was blocked by the package registry (`yallist-3.1.1` returned 404). Therefore this package is **SOURCE-QA**, not phone-deploy/stable.

A separate Heavy QA PASS is required before phone deployment.
