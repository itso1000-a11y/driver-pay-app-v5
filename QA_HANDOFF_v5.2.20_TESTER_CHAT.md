# DRIVER PAY APP v5.2.20 — TESTER CHAT ASSIGNMENT

You are the independent QA chat for this checkpoint.

## RULES
1. Do NOT correct source code.
2. Do NOT rewrite texts.
3. Do NOT upgrade dependencies or change package versions to make tests pass.
4. Do NOT reinterpret intended behaviour.
5. Report defects only, with exact reproduction steps and expected vs actual result.
6. Treat environment/install failures separately from application defects.
7. Run the complete file `QA_v5.2.20_HEAVY_TEST_PLAN.md`.
8. Run all automated tests with `npm test`.
9. If dependencies are available, run `npx tsc --noEmit` and a fresh Vite production build.
10. No correction is allowed during this QA pass.

## MOST IMPORTANT SCOPE GUARDS
- Existing daily Start warning `Rest not completed` must remain unchanged.
- New weekly cases reuse the existing red Start-field warning presentation only.
- `Weekly rest required` = attempted next work cycle while factual weekly rest is due and minimum weekly-rest boundary is not met.
- `Weekly rest not completed` = legacy weekly-rest validation case below its existing minimum boundary.
- Rest Card three-colour system MUST NOT change.
- Archived/closed week MUST NEVER ask `Working tomorrow?` when End Week is pressed again.
- Existing End Week feedback wording stays unchanged; only visibility/duration is intentionally improved.
- Start km carried suggestion is grey only until Finish km is entered; after Finish km it is visually accepted/dark but editable.
- A completed past day in the active week should look archive-like but must remain editable and must not become a real locked archive.
- Monday Start proposal after End Week is an OPEN ITEM and is OUT OF SCOPE. Do not modify it.

## REQUIRED REPORT FORMAT
Return one report titled:
`DRIVER PAY APP v5.2.20 — HEAVY QA RESULT`

Include:
- QA STATUS: PASS / FAIL
- technical results
- sections A-F from the heavy plan
- any blocking defects with root cause if provable
- TypeScript/build status separately
- explicit confirmation that no corrections were made
