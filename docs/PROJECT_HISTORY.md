# Project History


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
