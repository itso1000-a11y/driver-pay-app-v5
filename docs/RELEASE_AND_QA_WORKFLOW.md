# Release and QA Workflow

## Before editing

- Verify ZIP integrity.
- Confirm actual package/app version.
- Read continuity and decision documents.
- Identify the precise base release.
- Record hashes of sensitive source files when the change should not touch them.

## During editing

- Every functional or source change must advance the application version before handoff. Do not accumulate multiple materially different checkpoints under the same version number.
- Use a short descriptive release/checkpoint name alongside the number (for example `v5.2.16-weekly-rest-endweek-intent`) so the artifact remains identifiable later.
- Keep a strict scope boundary.
- Avoid unrelated formatting churn.
- Record root cause and accepted behaviour.
- Update documentation alongside the change, not from memory afterward.

## Technical validation

Where the environment permits:

1. `npm ci`
2. `npx tsc --noEmit`
3. `npm run build`
4. inspect generated version strings
5. compare source diff with the base
6. test ZIP integrity

If dependency installation or browser execution is blocked by the environment, record that limitation explicitly. Do not convert a blocked test into a PASS or a discovered application failure.

## QA levels

### Documentation-only release

- application source hash unchanged
- version identity consistent
- documentation files present
- links/paths valid
- ZIP integrity passes

### Local patch

- all documentation-only checks
- targeted manual test
- TypeScript/build
- affected persistence/reload test where relevant

### Major release

- full technical validation
- full interactive suite
- existing-data restore fixture
- realistic complete week
- archive and reload
- PWA update/cache checks
- regression totals for Pay Engine
- multi-day/multi-week Rest scenarios when affected

## Release documentation

Every release entry must state:

- version and date
- base version
- purpose/problem
- exact files changed
- behaviour changed
- behaviour explicitly unchanged
- tests passed
- tests blocked or not run
- status: candidate, working baseline, or stable baseline

## Packaging

- Exclude nested ZIPs, temporary files, editor files and `node_modules`.
- Include source, reproducible build output when the project currently carries it, and all permanent documentation.
- Final ZIP filename must match the internal version.
