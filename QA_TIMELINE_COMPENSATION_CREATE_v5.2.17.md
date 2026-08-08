# Driver Pay App v5.2.17 — Timeline Reduced Weekly Rest Debt Creation QA

## Scope
Test only the first timeline/compensation integration step.

## Must pass
1. A factual reduced mid-week weekly rest from 24h to less than 45h creates one outstanding compensation obligation only after a later real Start proves the rest duration.
2. Exact debt = 45h minus actual factual rest.
3. 24h rest creates 21h debt.
4. 35h rest creates 10h debt.
5. 45h or longer regular weekly rest creates no debt.
6. Re-evaluating the same factual rest does not create a duplicate.
7. The same factual rest must not duplicate if both timeline and legacy source paths can describe it.
8. Two distinct reduced weekly rests create two separate obligations.
9. New obligation starts outstanding; no partial amount and no completed metadata are stored.
10. No new timeline-driven compensation completion/repayment logic is introduced in this version.
11. Weekly-rest timeline, End Week intent, backup/restore, Start helper, day state, Pay Engine and Archive regressions remain green.

## Automated checks
- npm test
- tsc --noEmit

## Production build
A fresh Vite production build is required before any production-release approval. This source checkpoint does not claim a fresh production build.
