# Driver Pay App v5.2.23 — End Week / Weekly Rest Archive Audit

## Recovered protected logic
Archive review before coding recovered these decisions:

- End Week is a closing workflow, not a planner.
- End Week seeds weekly-rest tracking from the last real Finish.
- Suggested values remain suggestions until accepted; `Suggested ≠ Saved`.
- A candidate is intent, not proof of completed weekly rest. If work resumes before 24h, normal daily/long-rest logic applies.
- A factual 24h+ mid-week rest is recognized from chronology without needing End Week.
- Six completed work cycles are a due/warning guard. They are not a prerequisite for showing the weekly-rest candidate the driver explicitly started with End Week.
- Pay week remains Sunday → Saturday, while rest chronology continues across the pay boundary.
- Current/future Off days remain soft-editable because plans can change.

## Conflict found in v5.2.22
The factual six-cycle due gate had also become a proposal-visibility gate. That changed the meaning from “weekly rest is not mandatory yet” into “do not show the End Week weekly-rest candidate”. This contradicted the older candidate design.

## v5.2.23 reconciliation
- End Week candidate path = informational proposal/tracking path, always based on the last real Finish.
- Timeline due path = mandatory warning/violation path, based on factual chronology and the six-cycle boundary.
- The due path may escalate warnings but does not suppress the End Week candidate.

## Mandatory real-world scenarios

### 1. Normal week
Monday–Friday/Saturday work → End Week → rest.
Expected: Weekly Rest context plus 45h primary and valid 24h secondary proposal even if fewer than six factual cycles have elapsed.

### 2. Mid-week weekly rest, then weekend work
Long factual rest Tuesday–Thursday → work Friday/Saturday → End Week Saturday → Sunday Off → Work.
Expected: earlier factual rest remains the cycle anchor; End Week still starts a new informational candidate from Saturday Finish; early Sunday work is judged by normal daily-rest legality if the new candidate has not reached 24h.

### 3. Rest already running before End Week
Last work finishes Wednesday → rest Thursday/Friday/Saturday → End Week Saturday.
Expected: candidate anchor remains Wednesday Finish; accrued hours are retained; the counter does not restart at the button press; if the 45h endpoint is already past, existing `Weekly rest ended [day/time]` context is used.

## Protected areas not changed
Pay Engine, Save & Next, archive duplicate protection, soft/hard archive rules, compensation chronology, Rest Card colour semantics, KM logic, backup/restore, and Setup.
