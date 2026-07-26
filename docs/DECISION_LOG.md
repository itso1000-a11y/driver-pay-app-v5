## Locked — Backup/Restore and future cloud sync

- Backup/Restore transfers the complete application state between devices.
- Restore replaces destination state rather than merging stale data.
- Historical facts are restored from the backup; derived/live values may be recalculated only when safe and unambiguous.
- Restore failure must roll back atomically.
- Future cloud sync must reuse the same state contract and restore/recalculation rules; cloud is transport only.
- No separate cloud-specific Rest, Pay, Archive or Compensation logic.

# Driver Pay App — Decision Log

This file records accepted decisions that must be checked before changing behaviour. Later entries may clarify an earlier decision, but accepted rules are not silently discarded.

## GOV-001 — One app, model-based architecture

**Status:** LOCKED  
**Decision:** Maintain one application. Future commercial separation is Core plus optional Professional unlock, not separate employer-specific apps. Pay logic uses reusable payment models rather than company engines.

## GOV-002 — Small, versioned changes

**Status:** LOCKED  
**Decision:** Every fix receives its own version or subversion. Independent changes are not bundled under one version. Version numbers are primary release identifiers.

## GOV-003 — Documentation belongs to the release

**Status:** LOCKED  
**Decision:** Documentation is maintained by the development process and included in every release ZIP. It must be detailed enough for AI continuity. It is updated after every affected change and before packaging.

## GOV-004 — History before redesign

**Status:** LOCKED  
**Decision:** Before proposing changes to Rest Engine, Pay Engine, Pay Profiles, Archive or storage, search project history and restore accepted behaviour where possible. Do not reinvent settled solutions.

## UX-001 — Suggested is not saved

**Status:** LOCKED  
**Decision:** Suggestions and helpers remain proposals until explicitly accepted or handled by an already approved safe workflow. They must not silently become stored historical facts.

## UX-002 — Start proposals, Rest facts

**Status:** LOCKED  
**Decision:** Start area contains planning/suggestions. Rest Card contains factual elapsed or completed rest information. Do not duplicate one regime in both areas.

## UX-003 — Colour semantics

**Status:** LOCKED  
**Decision:** Green = compliant/complete; yellow = reduced/attention before infringement; red = actual violation/error; grey = neutral/suggested. Split rest may use the accepted green-yellow meaning.

## REST-001 — Daily rest boundaries

**Status:** LOCKED  
**Decision:** 11h is normal daily rest; 9h is reduced daily rest where available. A >13h shift affects the next daily-rest context but must not persist as a sticky warning through long rest, Day Off or End Week.

## REST-002 — Split daily rest

**Status:** LOCKED  
**Decision:** A valid split daily rest does not consume one of the reduced 9h daily-rest allowances. Any wording change must preserve this meaning.

## REST-003 — Weekly rest priority

**Status:** LOCKED  
**Decision:** Once Weekly Rest Candidate is active, weekly-rest mode overrides normal daily 9h/11h suggestions until resolved. Only one active rest regime is shown.

## REST-004 — Continuous shift across midnight

**Status:** FUTURE MAJOR PROJECT  
**Decision:** Cross-midnight shifts are not a small bug fix. Future architecture must keep the shift continuous until real Finish; daily rest starts from that Finish. Rest Engine remains independent from Pay Engine, and pay attribution may vary by company/model.

## REST-005 — Regulatory week vs calendar display

**Status:** LOCKED DIRECTION  
**Decision:** Monday–Sunday tachograph presentation is a data boundary, not automatically a legal violation. Regulatory calculation may use rolling 6×24-hour logic and must not flag a breach solely because the display week changed.

## COMP-001 — Indivisible weekly-rest compensation

**Status:** LOCKED  
**Decision:** Each obligation is separate. Compensation is indivisible, partial periods do not reduce it, partial rests are not combined, and completion follows FIFO using a qualifying continuous rest within the deadline.

## PAY-001 — Guaranteed hours and overtime

**Status:** LOCKED  
**Decision:** In a model with guaranteed daily hours, overtime begins after the guaranteed hours. This behaviour is intentional and must not be classified as a defect.

## PAY-002 — Profiles own tax mode

**Status:** LOCKED  
**Decision:** PAYE Estimate/Gross Only is stored in and restored from the Pay Profile. It is not a temporary global preference.

## PAY-003 — Active profile owns Settings context

**Status:** LOCKED  
**Decision:** When a Pay Profile is active, Settings are its current working values. Updating the profile updates active Settings. Payer and client should be visible together, for example `ARC → Turners`.

## PAY-004 — Historical pay stability

**Status:** REQUIRED ARCHITECTURAL DIRECTION  
**Decision:** Completed days must preserve the rates, tax mode, allowances and calculation context used when saved. A later profile update must not silently recalculate them. Full day-level snapshot implementation remains a separate major task.

## ARCHIVE-001 — Soft edit vs hard history

**Status:** LOCKED  
**Decision:** Current editable data and archived records are different states. Archive editing saves only the selected record. Repeated End Week must not rewrite an unchanged saved week.

## STORAGE-001 — Complete backup snapshot

**Status:** LOCKED CURRENT BEHAVIOUR  
**Decision:** Backup v2 captures the complete localStorage state. Restore replaces it atomically, supports old v1 backups, and uses rollback protection if restore fails.

## VERSION-001 — Single version identity

**Status:** LOCKED  
**Decision:** Package, lockfile, generated UI version, title, manifest, service-worker cache, release documents, output and ZIP filename must report the same release version.
