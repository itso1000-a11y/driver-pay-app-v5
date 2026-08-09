# Driver Pay App v5.2.23-r2 — QA Evidence Correction

This is a QA-artifact revision only. Runtime application version remains **5.2.23**.

## Why r2 exists
The first v5.2.23 heavy QA correctly failed for two reasons:

1. VERSION_INDEX, CHANGELOG and VERSION_HISTORY were not promoted to v5.2.23.
2. The mandatory three End Week scenarios were described in the plan but the supplied regression test only inspected source patterns.

## Corrections in r2
- Version documentation is promoted consistently to v5.2.23.
- The v5.2.23 regression test now behaviorally executes the three mandatory scenarios.
- It compiles an instrumented in-memory copy of the actual `src/App.tsx` and calls the real helper functions used by the application.
- It constructs real day states, weekly-rest candidates, factual timeline/cycle state and Off → Work transitions.
- The application source on disk is not modified by the test.

## Application scope
No runtime application logic, UI text, dependencies, storage schema, Pay Engine, Rest Engine, Archive logic, compensation formula or version number was changed in r2.
