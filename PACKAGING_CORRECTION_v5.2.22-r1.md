# Driver Pay App v5.2.22 — Packaging Correction r1

This checkpoint is a **packaging-only correction** of the QA-tested v5.2.22 source.

## Reason
The previous QA ZIP incorrectly used the internal root folder name:

`driver-pay-app-v5.2.21-STABLE`

while the contained application source and version identity were v5.2.22.

## Correction
The internal root folder is now:

`driver-pay-app-v5.2.22-weekly-rest-roadtest-fix-source-qa-r1`

## Scope
- No application source logic changed.
- No user-facing application text changed.
- No dependencies changed.
- No storage, Pay Engine, Rest Engine, Archive or compensation behaviour changed.
- Runtime application version remains v5.2.22.
- This `r1` suffix identifies only the corrected QA package artifact.

The previous heavy QA reported:
- application regressions: PASS
- TypeScript: PASS
- production build: PASS
- package integrity: FAIL only because of the incorrect internal root folder name

Required retest for this artifact:
1. ZIP opens.
2. Internal root folder identifies v5.2.22.
3. Version identity inside remains v5.2.22.
4. Confirm application/source files match the previously tested v5.2.22 checkpoint.
5. No functional rework is expected from this packaging correction.
