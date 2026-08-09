# Driver Pay App v5.2.22 — Archive Audit Before Change

Date: 2026-08-08

## Reason for this checkpoint

Physical-phone road testing of v5.2.21 found two regressions that automated QA had not reproduced:

1. A weekly-rest candidate created by End Week on Friday was not visible on Saturday of the same Sunday→Saturday pay week.
2. The current Saturday was rendered with archive-like styling immediately after the week had been soft-closed, although the calendar day was still current and editable.

## Archive decisions confirmed before coding

Protected historical decisions were checked before changing source:

- Start Card / Start field owns weekly-rest proposals before a factual Start.
- When applicable, this includes the 45h weekly-rest proposal and valid 24h reduced weekly-rest proposal.
- `Weekly rest ended [day/time]` remains pre-Start information after the relevant endpoint has passed.
- Suggested is not Saved. Weekly-rest proposals must not silently become `day.start` merely because Day Off is changed to Work.
- Day Off may display weekly-rest context while remaining informational only.
- End Week is a closing workflow; factual timeline/due-gate rules remain authoritative and End Week alone must not manufacture a weekly-rest requirement.
- Pay-week membership remains Sunday→Saturday: Saturday belongs to the week ending that Saturday; Sunday belongs to the following pay week.
- Soft archive is date-aware and remains editable. A current/future calendar day must not look like a historical hard archive merely because the pay week has been closed.
- Exact Saturday/Sunday midnight expiry for the 24h reduced proposal remains OPEN. No new midnight cutoff is introduced here.

## Root cause found in source

### Same-pay-week weekly-rest candidate loss

`getWeeklyRestCandidateForSelectedWeek()` accepted the stored candidate only when:

`selectedSaturdayISO > stored.closingSaturdayISO`

This discarded a Friday-created candidate while the user was still viewing Saturday of the same pay week, because both use the same closing Saturday ISO date.

The later chronology check already safely verifies that the selected day is actually after the factual Finish. The strict `>` comparison therefore removed the candidate too early.

### Current-day archive-like styling

v5.2.21 defined:

`archiveLikeVisual = archiveMode || softArchiveMode || pastSavedDayVisual`

This made every soft-closed day look archived, including today's Saturday. That mixed two separate decisions: editable soft close and visual treatment of genuinely past saved days.

## Conservative v5.2.22 correction

Only two functional source changes are intended:

1. Stored weekly-rest candidate remains available when the selected pay week is the same closing Saturday or a later week (`>=`). Existing factual chronology and due-gate checks still decide whether it may actually drive display/Start proposals.
2. Soft-close archive-like styling is applied only when the selected calendar day is already in the past. Today/future remain normal active styling. Hard archive and past-saved-day styling remain unchanged.

No Pay Engine, compensation formula, storage migration, Rest Card colour semantics, End Week intent flow, Save & Next meaning, KM logic, profile logic, or accepted text is changed.
