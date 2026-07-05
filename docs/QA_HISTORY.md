
## v5.2.2 – Weekly Rest Visual / Start Validation Fix
- Weekly Rest preview card now uses existing app colours: standard dark main time, grey source helper, existing helper warning/success colours.
- Added Start field violation validator: if entered Start is before the earliest legal rest boundary, the Start field turns red and shows “Rest not completed”.
- Legal entered Start values remain visually standard. Rest Card logic is not changed by this UX validator.


## REST-START-SOURCE-001
Status: OPEN
Build: v5.1.12
Expected:
- 11h suggestion displays `from 11h rest` under the Start field.
- 9h suggestion displays `from 9h rest` under the Start field.
- If 11h is unavailable, `11h rest unavailable` remains a separate explanation and does not replace `from 9h rest`.
- Suggested Start times remain exactly the same as v5.1.11.

## REST-9H-PREVIOUS-DAY-001
Status: RETEST
Build: v5.1.12
Expected:
The 9h helper remains visible even when the 9h boundary was on the previous calendar day.


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

## v5.2.1 QA – Standard Weekly Rest Candidate Fix

- npm install --no-package-lock: PASS
- npm run build: PASS
- Known existing warning: duplicate translation keys in src/App.tsx. Not introduced by this patch.
- Manual test needed: close week on Friday, open next Monday, confirm Weekly Rest card appears in place of Worked / OT.
