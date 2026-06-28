
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
