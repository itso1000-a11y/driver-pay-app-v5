
## PROFILE-TAXMODE-001

Status: OPEN
Version introduced/tested: v5.1.10

Expected:
A profile saved as Gross Only loads and applies as Gross Only. A profile saved as PAYE estimate loads and applies as PAYE estimate. Switching between the two before starting/saving a day must not require archive edits later.

Test:
1. Create/update Profile A as PAYE estimate.
2. Create/update Profile B as Gross Only.
3. Load/apply Profile B and confirm Settings/Week preview use Gross Only.
4. Load/apply Profile A and confirm PAYE deductions return.
5. Save a day with each profile and reopen the week to confirm the correct profile/tax mode is restored.


## PROFILE-ACTIVE-DISPLAY-001
Status: OPEN
Build: v5.1.11
Expected: Settings main visual field shows the active pay profile name, e.g. `ARC → Turners`, without adding new rows.

## PROFILE-UPDATE-001
Status: OPEN
Build: v5.1.11
Expected: Update Profile is disabled with no changes. When changed, it archives the previous profile, updates the profile, and applies it to current Settings if active.

## PROFILE-TAXMODE-001
Status: RETEST
Build: v5.1.11
Expected: Loading/applying Gross Only profile restores Gross Only; loading/applying PAYE profile restores PAYE estimate.


## WEEKLY-STANDARD-001
Status: OPEN
Build: v5.2.0
Expected: Closing a standard week with End Week stores a Weekly Rest Candidate from the last completed Finish and opens the next standard week through the existing Monday workflow.

## WEEKLY-CARD-001
Status: OPEN
Build: v5.2.0
Expected: On the first post-End Week workday before Start is entered, Worked / OT is replaced by one Weekly Rest card without increasing the screen height. After Start or after a completed post-End Week shift, Worked / OT returns.

## WEEKLY-6CYCLE-001
Status: OPEN
Build: v5.2.0
Expected: If six completed work cycles are detected before End Week, the Weekly Rest card prioritises the 24h reduced weekly option and explains that 45h is unavailable. If fewer than six cycles are completed, 45h remains the main option and the 24h option is shown as helper text.

## REST-9H-SOURCE-001
Status: RETEST
Build: v5.2.0
Expected: When the main Start suggestion comes from reduced daily rest, the field helper says `from 9h rest`. The 9h helper remains visible even if the 9h boundary was on the previous calendar day.
