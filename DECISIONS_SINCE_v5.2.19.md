# Decisions captured after v5.2.19

This file prevents decisions made between ZIP checkpoints from being lost.

## Implemented in v5.2.20
1. Weekly-rest Start errors reuse the existing red Start-field violation presentation. Existing old texts and logic are not renamed/reworked. New English reasons are `Weekly rest required` and `Weekly rest not completed` only where the corresponding weekly validation context applies.
2. The Rest Card three-colour system is not changed.
3. Re-ending an already archived/closed week must never ask `Working tomorrow?`. Existing feedback text is preserved but made larger and shown longer.
4. A carried/suggested Start km is grey only while still a suggestion. Once Finish km is entered, Start km is visually accepted/dark but remains editable, including when Finish km equals Start km.
5. After Save & Next, navigating back to a completed earlier day in the active week should make the whole screen visually archive-like, but the day remains an editable active-week record. True archive lock/banner logic is not applied to this visual-only state.

## Explicitly still open / not changed
- Monday Start proposal after End Week. v5.2.15 behaviour was inspected only as reference. Do not restore or change it until separately discussed.
- Custom End Week day / custom work-week pattern belongs to future Setup work.
