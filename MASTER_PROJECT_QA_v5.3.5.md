# v5.3.5 — LEGACY HISTORICAL OFF/HOLIDAY PROVENANCE

## Consolidated through v5.3.5

- A legacy `Off` or `Holiday` without `completionSource` is factual only when it is a past, non-bulk row recovered from the closed `archive` source.
- Current, future, default/planned, live/current and saved planning rows without provenance remain non-factual.
- Past/current/future provenance uses the existing Europe/London date utilities.
- Phase 1–7 Rest Engine legal logic, Pay Engine, presentation, compact-time compatibility, PWA update flow, archive/navigation and End Week behavior remain unchanged.
