# Driver Pay App — Dev Log

## v5.1.2 — Gross Only visible mode

CHANGE:
Added a Gross Only / PAYE Estimate mode indicator and setting.

WHY:
The app is currently used for agency/LTD-style gross pay checking while Pay Setup v2 and snapshots are still being rebuilt. The user must clearly see whether preview numbers are gross-only or PAYE estimates.

IMPORTANT:
This is a small usability patch on v5.1.1. It does not fix the deeper profile/snapshot problem.

DO NOT ASSUME:
Gross Only solves historical recalculation. Day-level pay snapshots are still required.

NEXT ARCHITECTURE FIX:
Day pay snapshot + Quick Setup profile/apply flow.


## v5.1.3 — Gross Only toggle visibility fix

PROBLEM:
v5.1.2 added Gross Only logic/indicator but the switch was not visible enough.

FIX:
Added a clear two-button PAYE Estimate / Gross Only toggle at the top of Settings.

WHY:
The user must clearly control whether preview/pay values include estimated Tax/NI/Pension or show gross-only values.

LIMITATION:
This still does not fix profile/snapshot recalculation. Day-level snapshot remains the next architecture fix.


## v5.1.4 — Clear active Gross Only toggle

PROBLEM:
The PAYE/Gross Only buttons did not clearly show which mode was active after tapping.

FIX:
Active button now uses a clear dark selected state, a ✓ marker, aria-pressed, and a visible Current mode line.

WHY:
Mode selection affects whether preview values are gross-only or PAYE estimates. The user must not guess whether the tap worked.


## v5.1.5 — Gross Only select fixed from v5.1.4

PROBLEM:
The two-button PAYE/Gross Only toggle was unclear and could appear not to switch.

FIX:
Replaced it with a simple select/dropdown:
- PAYE Estimate
- Gross Only

Gross Only now also changes the calculation:
- Tax = 0
- NI = 0
- daily/weekly net = gross

WHY:
The user must be able to clearly select whether values are PAYE estimates or gross-only figures.

LIMITATION:
This does not fix profile/snapshot architecture.


## v5.1.6 — Gross Only select state fix

PROBLEM:
In v5.1.5 the Pay calculation mode select could show options but remain stuck on PAYE Estimate.

FIX:
- grossOnly is explicitly preserved by sanitizeSettings.
- Select uses functional setSettings update.
- Gross Only remains visible as the selected dropdown value.
- Gross Only is real calculation mode: Tax = 0, NI = 0, daily/weekly net = gross.

WHY:
The selected mode must remain visible and must affect the calculation. This is not just a visual setting.

LIMITATION:
This still does not fix the separate profile/snapshot architecture issue.


## v5.1.7 — Restore 9h helper visibility

PROBLEM:
The 9h reduced-rest helper could disappear when the 9h boundary was on the previous calendar day.

CAUSE:
The helper was filtered with isSameLocalDayAbs(...), so boundaries like Tue 23:40 were hidden when viewing Wednesday.

FIX:
Keep the 11h suggestion restricted to the current day as the main Start-field suggestion.
Keep the 9h reduced-rest boundary visible as a helper when it is available, even if it is in the previous calendar day.

WHY:
The user may enter the actual Start later. The 9h option is a boundary/helper, not a live start button.

IMPORTANT:
This patch does not change the 72h weekly/long-rest helper rule.
This patch does not touch pay, archive, profile, or Gross Only logic.


## v5.1.8 — Stop long-shift daily warning carry-over

PROBLEM:
After a >13h shift, the “11h rest unavailable” daily warning could carry through End Week / Off days into a later week.

CAUSE:
The >13h previous-shift condition was still used even when the rest gap had already reached 24h+ and was no longer a daily-rest suggestion situation.

FIX:
- Daily 9h/11h suggestions are active only while the gap from the previous Finish is within the daily-rest window (<24h / up to 24h helper boundary).
- Once the gap is 24h+, daily suggestions and the >13h daily warning stop.
- Rest card still counts factual rest time.

WHY:
A long previous shift affects the next relevant daily rest, not every later day after weekly/long rest or End Week.

IMPORTANT:
This is not a Monday-specific fix. It is based on the actual rest gap from previous Finish.
This patch does not touch pay, archive, profile, or Gross Only logic.


## v5.1.9 — Profile restore safety

PROBLEM:
When switching between archive/current weeks, the app could show or keep the wrong active Pay Setup profile while the week settings were restored from a different profile snapshot.

FIX:
- Saved week data now stores `activePayProfileId` with the week.
- Loading an archived/current saved week restores the matching active profile when available.
- Legacy saved weeks without `activePayProfileId` try to resolve the profile from the saved settings snapshot or organisation name.
- End Week/archive save also carries the active profile id.

WHY:
A week should reopen with the profile/settings context it was saved with. Profile restore is workflow state, not a Pay Engine redesign.

IMPORTANT:
This patch does not change pay formulas, Rest Engine, Archive rules, layout, colour logic, or main screens.


### v5.1.9 release metadata correction

Corrected release metadata so visible title, manifest, service-worker cache, package version and APP_VERSION all identify the same v5.1.9 profile restore build. No UI/layout/colour/engine logic changes.

## v5.1.10 — Profile tax mode persistence

Fixed profile payment-mode persistence.

Changed:
- Pay profiles now preserve `grossOnly` explicitly in the settings snapshot.
- Loading a profile in Pay Setup v2 restores its PAYE/Gross Only mode into the draft.
- Applying a profile restores the profile's saved tax mode together with rates and allowances.
- Added a small Pay calculation mode selector inside Pay Setup v2 so the profile itself can be saved as PAYE estimate or Gross Only.

Not changed:
- No Rest Engine changes.
- No Pay formula changes.
- No Archive workflow changes.
- No main screen layout, colour logic, or core UI semantics changed.

## v5.1.11 — Profile settings and active profile cleanup

Changed:
- Active Pay Profile display uses `Employer/Agency → Profile/Client` style, for example `ARC → Turners`.
- Settings screen uses the existing main visual field to show the active profile. No extra Settings rows were added.
- Pay Setup v2 no longer shows `New from this`.
- `Update Profile` is disabled when the draft is unchanged.
- `Update Profile` archives the previous profile snapshot before saving a real change.
- Updating the active profile also updates current Settings, including PAYE/Gross Only mode.

Not changed:
- Rest Engine untouched.
- Pay formulas untouched.
- Archive workflow untouched.
- Main layout and colour logic untouched.
