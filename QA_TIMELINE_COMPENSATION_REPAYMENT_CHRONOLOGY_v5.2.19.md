# Driver Pay App v5.2.19 — Compensation Repayment Chronology QA

## Scope

This version changes only repayment chronology eligibility discovered by external QA of v5.2.18.

## Required rule

A compensation debt may be completed by a continuous rest only when the rest itself begins at or after the debt arose.

Required eligibility:

- `restStartAbs >= sourceStartAbs`
- `enteredStartAbs > sourceStartAbs`
- current date is on/before the saved deadline
- the rest is long enough for the full indivisible compensation block

A rest that begins before the debt boundary and merely ends after it must not repay that debt.

## Regression scenario added

- debt arises 10h before entered Start
- candidate rest is 19h long
- therefore candidate rest began 9h before the debt existed
- expected: debt remains outstanding

Control scenario:

- debt arose before the candidate rest began
- 19h rest for a 10h obligation
- expected: debt completes

## Unchanged behaviour

No changes to Start, Finish, End Week, day state, Pay Engine, Archive, debt creation, partial-credit rules, FIFO ordering, deadline convention, self-completion protection, or rest-reuse protection.

## Open item — do not change yet

Monday Start proposal after End Week remains unresolved. v5.2.15 behaviour is retained only as historical reference. Do not restore or alter current behaviour until explicitly decided.
