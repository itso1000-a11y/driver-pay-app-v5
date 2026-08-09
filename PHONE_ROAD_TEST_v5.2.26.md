# DRIVER PAY APP v5.2.26 — PHYSICAL PHONE ROAD TEST

## Package status
This phone-deploy package is created directly from the Heavy-QA-PASS v5.2.26-r1 source.

Runtime application version: **5.2.26**

No runtime source, test, dependency, service-worker, manifest, configuration, protected-behaviour or application-text change was made while creating this phone package.

## Required real-phone acceptance checks

1. Normal End Week:
   - `Weekly Rest`
   - `45h Start` shows weekday + time
   - `24h Start` shows weekday + time
   - no redundant `Weekly rest in progress`

2. Saturday 22:00 example:
   - 24h target = `Sun 22:00`
   - 45h target = `Mon 19:00`
   - crossing Sunday/Monday midnight must not reset continuous rest

3. Six-cycle state:
   - `Weekly rest required` remains the Start warning
   - legal weekly-rest START deadline is distinct from the 24h/45h completion targets

4. Mandatory weekly rest below 24h:
   - Rest Card is red
   - `Weekly rest not completed`
   - no `Reduced rest • Left: N` as the primary Rest Card identity

5. Exactly 24h:
   - yellow `Reduced weekly rest`
   - `Compensation due: 21h 00m`

6. 32h:
   - yellow `Reduced weekly rest`
   - `Compensation due: 13h 00m`

7. 45h+:
   - regular weekly-rest compliant/green state
   - no reduced-weekly-rest compensation debt

8. Day Off → Work:
   - proposal remains anchored to the same factual Finish
   - no Start is silently saved

9. Candidate consumption:
   - after factual Start, old weekly-rest proposal does not reappear

10. Soft archive:
   - editable recent closed week remains soft
   - direct `Go to current week` is available
   - current day must not look like hard archive merely because End Week was used

## Acceptance
If these checks pass on the physical phone, v5.2.26 may be locked as the installed stable baseline before Setup work begins.
