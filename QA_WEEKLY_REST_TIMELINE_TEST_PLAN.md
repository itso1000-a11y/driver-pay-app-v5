# QA — Weekly Rest Timeline / Start Helper Checkpoint

## Purpose
Validate the new conservative cross-week weekly-rest logic before it is allowed to control any additional behaviour.

## Scope of this checkpoint
- Existing End Week feedback text/visibility adjustment.
- Internal separation of pay-period close from weekly-rest candidate seeding.
- Read-only detection of qualifying mid-week weekly rest.
- Read-only cross-week weekly-rest timeline.
- Read-only current weekly-rest-cycle snapshot.
- Due-gate: an old End Week candidate must not force weekly rest before the new timeline says it is due.
- When the timeline is certain that 6 completed work cycles have occurred since the last recognised weekly rest, it may provide the weekly-rest Start path even without End Week.
- Standard 45h Start remains the main suggestion; 24h reduced option remains the secondary helper below Start when applicable.

## Explicitly NOT implemented yet
- No `Working tomorrow?` question.
- No new automatic Day Off behaviour.
- No custom End Week day / work-week pattern implementation.
- No new writes to the compensation ledger from the timeline path.
- No automatic migration or new persisted weekly-rest state.
- No change to the meaning of Save & Next beyond existing behaviour.

## Critical regression rule
If the timeline is uncertain, the app must fall back to the previous behaviour rather than guessing.

## Test scenarios

### 1. Five completed work cycles after a recognised weekly rest
Expected:
- Normal daily-rest Start helper remains active.
- Weekly-rest Start must NOT take over.
- No new Day Off marking.
- No compensation-ledger change.

### 2. Six completed work cycles after a recognised weekly rest
Expected:
- Weekly-rest logic becomes due.
- Main Start helper uses the 45h path from the last real Finish.
- Reduced 24h option, when valid, appears only as the secondary helper below Start.
- This must work even if End Week has not been pressed.

### 3. Mid-week regular weekly rest
Example shape: Work -> 45h+ continuous rest -> Work.
Expected:
- The long rest is recognised as a new regular weekly-rest anchor.
- Work-cycle counting restarts after that rest.
- A previous End Week candidate must not continue to force an older weekly-rest suggestion.

### 4. Mid-week reduced weekly rest
Example shape: Work -> 24h to <45h continuous rest -> Work.
Expected:
- The rest is recognised as reduced for timeline purposes.
- Work-cycle counting restarts after it.
- Existing compensation behaviour must not be changed by this checkpoint.

### 5. Ambiguous/incomplete work day inside the timeline
Expected:
- Detector must not jump across an unclear started-but-unfinished Work day.
- State should become unknown/conservative where necessary.
- Old behaviour/fallback should remain available.

### 6. End Week before weekly rest is due
Expected:
- Pay-period close/archive behaviour remains intact.
- If a later recognised mid-week weekly rest means fewer than 6 completed cycles have occurred, End Week must not force a premature weekly-rest Start helper.

### 7. Existing completed week — no changes
Expected:
- No archive rewrite/duplicate.
- Visible feedback: `Week already saved. No changes.`

### 8. Existing completed week — changed data
Expected:
- Existing archive record is updated, not duplicated.
- Visible feedback: `Changes saved. Week updated.`

### 9. New completed week
Expected:
- Normal archive creation.
- Visible feedback: `Week completed.`

### 10. Backup/restore regression
Expected:
- Existing backup/restore round-trip test remains green.
- Failed restore still rolls back safely.

## Real-data reference scenario
The user's 2026 backup contains a useful real example: Monday 15 Jun finished at 15:20, Tuesday and Wednesday were Off, and Thursday 18 Jun started at 06:30. The continuous rest is 63h 10m and should be recognised as a regular weekly rest.

## Pass criteria before further integration
- TypeScript check is clean.
- Existing automated regression tests are green.
- Scenarios 1-6 behave exactly as described.
- No duplicate archived weeks are created.
- No new storage keys or ledger mutations occur from the read-only/timeline path.

## Next work only after QA passes
Integrate the smarter End Week ambiguity flow (`Working tomorrow?`) and the future distinction between pay-period boundary, configured work-week boundary, and regulatory weekly-rest cycle. Do not implement these as part of this checkpoint.
