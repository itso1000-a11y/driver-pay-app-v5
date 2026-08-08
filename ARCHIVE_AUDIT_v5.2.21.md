# Driver Pay App v5.2.21 — Archive Audit

## Purpose
Before changing v5.2.20, the historical conversation/export and preserved project notes were checked for older protected decisions. The goal is restoration, not redesign.

## Confirmed protected rules restored

### 1. Date-aware soft archive
Historical records explicitly say:
- `Past date alone does not mean hard archive.`
- Current/active and future/near-current closed periods remain soft/editable.
- A preserved v5.1 log states `Soft archive period: 2 weeks, then hard archive.`
- Hard archive is for genuinely historical weeks and keeps explicit archive-edit protections.

Implementation for the current Sunday→Saturday model:
- current week: soft if closed;
- immediately previous week: soft if closed;
- future closed week: soft while not historical;
- older week: hard archive.

### 2. Pay-week boundary is not rest boundary
The pay/archive week remains Sunday→Saturday. Weekly Rest uses factual chronology from real Finish to later real Start and may cross the pay-week boundary.

### 3. Weekly-rest proposal ownership
Archived approved UX says:
- before real Start, show 45h weekly-rest proposal when available;
- show 24h reduced weekly-rest proposal while valid;
- hide an expired 24h proposal;
- once the relevant weekly-rest endpoint has passed, show `Weekly rest ended` with the factual day/time;
- after real Start, Rest Card owns factual completed-rest information.

### 4. End Week does not equal weekly-rest truth
The later factual timeline design supersedes the old assumption that every End Week starts a legal weekly-rest state. If the timeline is known and weekly rest is not due, the weekly-rest proposal must remain suppressed.

## New display restoration in v5.2.21
When the selected Day Off qualifies for weekly-rest mode, the Rest area now shows:
- `Weekly Rest`;
- `Weekly rest in progress` / `Тече седмична почивка`;
- the applicable primary weekly-rest target;
- the valid secondary 24h option when applicable.

No proposal is saved as a real Start.

## Explicit unresolved detail
The archive repeatedly requires `valid 24h proposal shown / expired 24h proposal hidden`, but no final archived decision was found that says the proposal universally expires at Saturday midnight or Sunday→Monday midnight. The user's current recollection was explicitly tentative.

Therefore v5.2.21 does NOT hard-code a midnight rule. The conservative restored behaviour is:
- 24h reduced option may remain visible during the 24h-to-<45h reduced weekly-rest window;
- once 45h regular weekly rest is reached, the reduced option is no longer shown.

Any future calendar-cutoff rule must be approved explicitly before implementation.

## Scope explicitly not changed
- Pay Engine
- Pay Profiles
- tax/pension/bonus calculations
- compensation creation/repayment semantics
- Daily Rest 9h/11h behaviour
- Rest Card green/yellow/red semantics
- Save & Next meaning
- Sunday→Saturday pay-week boundary
- custom Setup work-week architecture
