# QA HANDOFF — Driver Pay App v5.2.22

Do a heavy QA pass. **Do not make corrections.** Return a structured PASS/FAIL report with blocking defects and exact reproduction conditions.

Read first:
1. `ARCHIVE_AUDIT_v5.2.22.md`
2. `QA_v5.2.22_HEAVY_TEST_PLAN.md`
3. existing v5.2.20/v5.2.21 QA and weekly-rest regression documents when needed for protected behaviour.

Primary regression to prove:

- A Friday End Week weekly-rest candidate must remain addressable on Saturday of the same Sunday→Saturday pay week when factual due/chronology criteria qualify.
- The candidate must not leak backward before its real Finish.
- Day Off can display the weekly-rest context/proposals without writing Start.
- Day Off → Work hands the same candidate to the existing Start proposal workflow without auto-saving it.
- Today's Saturday in a soft-closed current pay week must not receive historical/archive-like shell styling.

Also run the complete supplied automated suite, TypeScript and fresh production build when the environment permits. Do not introduce a new midnight cutoff for 24h proposals. Do not change old texts or unrelated logic.
