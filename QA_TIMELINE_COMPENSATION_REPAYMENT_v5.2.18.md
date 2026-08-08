# Driver Pay App v5.2.18 — Timeline Compensation Repayment QA

## Scope

This version adds only the second timeline compensation step: when the factual weekly-rest timeline owns the current Start decision, a real continuous rest may complete one already-existing weekly-rest compensation obligation.

It does **not** add partial repayment, does not change debt creation from v5.2.17, and does not change Start / Finish / End Week / Pay Engine / Archive behaviour.

## Required behaviour

- Compensation remains indivisible.
- A 10h debt is not reduced by an 18h rest.
- A 19h continuous rest may complete a 10h debt (9h base + 10h compensation).
- 21h and 55h qualifying continuous rests may also complete the same 10h debt.
- Completion must be after the obligation was created.
- Completion must be on or before the saved deadline.
- One factual rest completes at most one obligation, including after editing the Start that ends the same continuous rest.
- When more than one obligation is eligible, the earliest deadline has priority; ties use the older source boundary.
- A debt created by the current factual reduced weekly rest cannot immediately complete itself because its sourceStartAbs equals the current Start.
- An older eligible debt may be completed by that same factual rest while the newly-created debt remains outstanding.
- No partial balance is stored.

## Regression scope

Also run the existing:
- backup/restore suite;
- weekly-rest timeline suite;
- End Week intent suite;
- v5.2.17 timeline debt-creation suite.

## Open item — Monday Start proposal after End Week

This is intentionally **not changed in v5.2.18**.

Reference behaviour observed in stable v5.2.15:
- if Finish + 45h falls on Monday, the Start field can show that weekly-rest Start proposal;
- if the 45h target has already passed before Monday begins, the Start field may remain without a time proposal and the helper may show when weekly rest ended.

The desired future behaviour still requires explicit product discussion. Do not restore, remove, or redesign it by assumption.
