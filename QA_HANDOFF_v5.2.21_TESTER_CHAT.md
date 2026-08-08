# QA HANDOFF — Driver Pay App v5.2.21

You are the independent QA tester. Test the supplied ZIP; do not modify or correct source.

Read first:
1. `ARCHIVE_AUDIT_v5.2.21.md`
2. `QA_v5.2.21_HEAVY_TEST_PLAN.md`
3. `MASTER_PROJECT_REFERENCE.md`

Then execute the entire heavy QA plan.

Special attention:
- v5.2.20 incorrectly hard-archived a just-closed current week. Verify date-aware two-week soft archive restoration.
- A qualifying Day Off must show weekly-rest context, including `Weekly rest in progress`, applicable 45h target and valid 24h option.
- End Week alone must NOT create premature weekly-rest state if the factual timeline says weekly rest is not due.
- Do not invent or require an exact Saturday/Sunday midnight expiry for the 24h proposal. That timing remains OPEN in this checkpoint.
- Do not accept duplicate archive records, compensation double writes, altered Rest Card colours, changed Pay Engine results, or changed Save & Next semantics.

Report:
- QA STATUS: PASS / FAIL
- technical results
- each plan section A–K
- every defect with exact reproduction and likely source location
- TypeScript/build status separately; environment limitation is not automatically an application defect
- explicit confirmation whether QA changed any source (it must not).
