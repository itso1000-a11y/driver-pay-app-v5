# Backlog and Next Work

This is a planning reference, not permission to implement everything listed. Each major item requires a separate review and version.

## Suitable small/local work

- Review `Split Break` / `Week Active` wording for clarity without changing Split Rest logic.
- Verify Start helper wording and previous-calendar-day visibility in real use.
- Remove isolated visual noise only after confirming saved/completed-state meaning remains clear.
- Small feedback/message corrections with no engine or storage impact.

## Next major architectural candidate

### Day-level Pay Snapshot

Goal: completed days preserve exact pay configuration and results after later profile/Settings changes.

Must include:
- rates/model/tax mode/allowances snapshot
- day-to-profile association
- scope for applying a new profile from next day or selected date
- old data compatibility
- archive behaviour
- weekly totals based on saved day context
- backup/restore coverage

Do not implement as a quick patch.

## Other major future work

### Cross-midnight shifts

Continuous shift until real Finish; rest begins at real Finish. Pay attribution must support different policies and remain separate from Rest Engine.

### Pay Setup v2 completion

Draft → Preview → Save/Confirm, no accidental autosave, optional Pay Setup mode, clearer profile create/update flow, and correct application scope.

### Weekly rest continuation

Preserve legal/regulatory calculation separately from tachograph calendar-week presentation. Review explicit cross-week attribution and longer-term ledger presentation before changing the locked compensation rules.

### Work patterns / custom boundaries

4-on/4-off, custom End Week boundaries and variable patterns remain separate from the current standard workflow.

### Other projects

`Where Is My Money`, revision/stock app and traffic-office checker are separate products or modules. They must not be casually merged into Driver Pay App.
