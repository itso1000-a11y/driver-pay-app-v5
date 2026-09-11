# Driver Pay App v5.2.42 — QA handoff

## Scope

This is a narrow Pay/End Week state fix on top of v5.2.41. Do not redesign Pay Setup, profiles, Rest Engine, Weekly Rest, archive, KM, colours, translations, or general layout during QA.

## Real reproduced defect on v5.2.41

Immediately before Saturday End Week the app showed:

- Pay calculation mode: **Gross Only**
- Active Pay Profile: **ARC → Profile 1**
- Weekday rate: **18.00**
- Saturday rate: **20.00**
- Sunday rate: **21.00**

Immediately after End Week it showed:

- Pay calculation mode: **PAYE estimate**
- Active Pay Profile label still: **ARC → Profile 1**
- Weekday rate: **14.00**
- Saturday rate: **21.00**
- Sunday rate: **21.00**

The 14/21/21 PAYE values are the exact application `initialSettings` defaults.

## Root cause

`loadSavedWeekDataOrBlank(nextSaturday)` returns a blank week with `initialSettings` when the target next week has no persisted week/archive record. The v5.2.41 `openNextPayPeriod()` path then did `setSettings(nextWeek.settings)`, treating the fallback defaults as factual next-week Settings. At the same time, if no next-week profile id could be resolved, the old active profile id was left in React state, so the profile label could stay `ARC → Profile 1` while calculations used default PAYE rates.

This vulnerable path is not new to v5.2.41. Direct source comparison confirms it is present in preserved v5.1.11 and remains present in v5.2.36, v5.2.37, v5.2.38, v5.2.39, v5.2.40 and v5.2.41. Therefore the current evidence does **not** support blaming one of the September Start/Rest/UI patches for introducing the bug.

## Why it appeared now

The bug is state-dependent. It is triggered when End Week opens a target next pay week that has no persisted pay-week record. When a target week already has saved data/context, the loader returns that week instead of the factory fallback and the reset is not seen.

That explains how the same Gross Only profile could be used normally for many weeks and fail for the first time now. The source proves the trigger condition; it does not prove exactly why earlier target weeks happened to already have persisted context. Do not invent that missing historical fact. Classify this as a **latent historical defect newly triggered by an absent target-week record**.

## Required v5.2.42 behavior

1. If the target next pay week does not exist, carry forward the current Settings and current active Pay Profile id.
2. Gross Only must remain Gross Only; PAYE must remain PAYE.
3. Rates, pension mode, overtime, food/night-out allowances, bonus rates and custom bonuses must all carry with the Settings snapshot.
4. If the target next week already has a persisted pay context, preserve it and do not overwrite it with the closing week's context.
5. Existing KM carry and Working tomorrow? behavior must remain unchanged.

## Focused automated acceptance

Run:

```bash
npm run test:v5.2.42
```

Mandatory scenarios in that test:

- Gross Only ARC 18/20/21 + missing next week → inherited unchanged.
- Persist/reload after transition → inherited context remains.
- PAYE + missing next week → PAYE/current rates remain.
- Existing future week with a different profile/settings → future saved context is preserved.

Then run standard project checks:

```bash
npm test
npx tsc --noEmit
npm run build
```

The separate real-App browser suites should also be run in the established Windows QA environment. Do not weaken or rewrite historical contract tests merely to obtain green output.

## Phone acceptance

On a disposable/test week or after making a backup:

1. Confirm Settings immediately before End Week show the intended active profile and Gross/PAYE mode.
2. Complete the normal End Week flow.
3. Open Settings in the newly opened week.
4. Confirm profile, Gross/PAYE mode and all rates are unchanged when the new week did not already have a saved context.
5. Reload/close-reopen the PWA and confirm the same context remains.

Physical-device result remains authoritative for the workflow acceptance.
