# Project History

## REST-START-SOURCE-001 — Start helper source labels

Decision:
The Start field must clearly explain the source of the suggested Start time.

Accepted behaviour:
- If the suggested Start is based on 11h normal daily rest, show `from 11h rest`.
- If the suggested Start is based on 9h reduced daily rest, show `from 9h rest`.
- If 11h rest is unavailable, keep `11h rest unavailable` as a separate explanation. It must not replace `from 9h rest`.

Boundary:
v5.1.12 is a safe UX clarification only. It must not change Rest Engine logic, Start calculations, reduced rest logic, split break behaviour, weekly rest, 72h helper, End Week, Archive, or Pay Engine.

Backlog:
Review Split Break / Week Active wording later as a separate UX task.



## REST-9H-HELPER — accepted behaviour restored

Decision:
- Start field uses the 11h normal-rest suggestion as the main suggested start time.
- 9h reduced-rest is shown as a small helper/boundary below the field when reduced rest is available.
- The 9h helper should not be hidden only because the boundary was reached on the previous calendar day.

Reason:
The app is not a live tachograph logger. A driver may start work first and enter the Start time later.

Boundary:
- The 72h weekly/long-rest helper handling is separate and is not changed by this patch.


## REST-WEEK-CARRY-001 — long-shift warning carry-over fixed

Decision:
A >13h previous workday warning is a daily-rest context only. It must not be persisted as state or carried through End Week, Off days, or weekly/long rest.

Rule:
- If the gap from previous Finish is still in the daily-rest window, show the daily warning/helper when relevant.
- If the gap is 24h+, stop daily 9h/11h suggestions and stop the >13h daily warning.
- The Rest card still shows factual elapsed rest time.

Reason:
The app works from real Finish → real/current Start context, not from a sticky day flag.


## PROFILE-RESTORE-001 — saved weeks keep their active profile

Problem:
Archive/current week navigation could restore saved settings while the active profile selector still pointed at another profile. This created confusion and risked editing/applying the wrong profile.

Rejected idea:
Rebuild Pay Setup v2 or introduce company-specific behaviour.

Reason rejected:
The app direction is Payment Models, not company versions. This bug is about restoring the correct saved profile context, not redesigning Pay Engine.

Accepted decision:
Save `activePayProfileId` with each week/archive entry. When a week is loaded, restore that profile if it still exists. For older weeks without that field, resolve the closest profile by settings snapshot, then by organisation name.

Reason:
A saved week should reopen with the same profile context it had when saved. This keeps current/archive navigation stable without changing pay formulas or UI design.

Boundary:
No visual changes. No Rest Engine changes. No Pay Engine formula changes. No Archive rule redesign.


## VERSION-RELEASE-001 — PWA update version identity

Decision:
A real app update may bump the version, but the version must be changed consistently everywhere: APP_VERSION, package.json, browser title, manifest description/name where used, service-worker cache name, ZIP filename and release notes.

Reason:
For this PWA the update is normally offered inside the installed app/browser flow and accepted by the user. Mixed version strings make it unclear whether the installed app, browser tab, service worker and ZIP are the same build.

Rule:
Never ship a ZIP where title/footer/manifest/cache disagree.

## Decision: Profile owns tax mode

ID: PAY-PROFILE-TAX-001

Problem:
When moving between agency/LTD style work and normal company/PAYE work, the same driver may need different tax modes per profile. If a Gross Only profile loads as PAYE by default, a day/week can be saved with the wrong deductions and then the user has to edit archive data later.

Accepted behaviour:
A payment profile must store and restore its own tax calculation mode (`grossOnly` / PAYE estimate). Loading/applying a profile must restore that mode with the profile's rates and allowances.

Reason:
Tax mode is part of how the profile pays, not a temporary screen preference. It must travel with the profile to prevent accidental wrong pay calculations.

Rejected behaviour:
Defaulting every loaded profile to PAYE/tax ON.

Reason rejected:
Unsafe for agency/LTD gross-only weeks and can force unnecessary archive edits.

## PROFILE-SETTINGS-001 — Active Pay Profile owns Settings context

Decision:
When an active Pay Profile exists, Settings are not a separate source of truth. They are the current working values of the active profile.

Accepted behaviour:
- The visible active profile should be clear, for example `ARC → Turners`.
- The profile stores the pay model context, including PAYE/Gross Only mode.
- Updating the active profile updates current Settings.
- Updating an unchanged profile should be disabled/no-op.
- The previous profile snapshot is archived before a real profile update.
- Completed days must keep their saved/snapshot values and must not be silently recalculated by a later profile update.

Rejected behaviour:
- Treating Settings and Profiles as two independent competing systems.
- Showing only the payer/agency name when multiple profiles can share it.
- Keeping `New from this` as a duplicate of `Save as new profile`.

Reason:
The app's primary purpose is correct pay checking. The user must immediately know which pay profile is driving calculations, and profile changes must not accidentally corrupt already saved work.
