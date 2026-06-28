
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
