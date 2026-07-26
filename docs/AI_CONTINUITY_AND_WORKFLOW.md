# AI Continuity and Development Workflow

## Purpose

This document tells a future AI or developer how to continue the Driver Pay App without reopening settled discussions or redesigning accepted behaviour.

## Session startup

1. Confirm the exact uploaded ZIP and its actual version. Never assume the latest remembered version is the uploaded one.
2. Inspect ZIP integrity and project structure.
3. Read the continuity documents in the order listed in `MASTER_PROJECT_REFERENCE.md`.
4. Identify the affected module and search project history for earlier decisions.
5. Compare the requested change against locked boundaries.
6. State the intended scope and explicit non-scope before editing.
7. Preserve a copy or hash of sensitive source files before modification.

## Change classification

### Documentation-only

Examples: continuity files, decision records, release history, QA notes. No functional source change. Version metadata may still advance to keep release identity consistent.

Required checks:
- ZIP integrity
- version consistency
- source hash comparison
- documentation presence and cross-reference review

### Small/local change

Examples: wording, helper text, one local visual state, narrow regression repair.

Required checks:
- targeted source review
- TypeScript validation
- production build
- affected manual scenarios
- source diff proving no unrelated change

### Major/risky change

Examples: Rest Engine, Pay Engine, snapshots, archive, storage migration, backup/restore, weekly compensation or profile lifecycle.

Required checks:
- written design and accepted behaviour first
- migration/backward-compatibility plan
- focused unit/static checks where available
- full regression suite
- representative existing-data fixture
- realistic week scenario
- PWA/storage reload checks

## Editing rules

- Make the smallest change that solves the proven problem.
- Do not combine independent fixes in one version.
- Do not rename, move or visually redesign unrelated controls.
- Do not “clean up” unfamiliar logic without first proving it is unused or defective.
- Preserve old-data compatibility unless an explicit migration is approved.
- Do not treat a user-visible proposal as saved data.
- Do not let documentation claims exceed completed tests.

## Version workflow

1. Choose the next unused version number.
2. Update the package version as the single source of version identity.
3. Run the version-sync process so UI/title/manifest/service-worker references match.
4. Update release documents.
5. Rebuild output where applicable.
6. Confirm every version string matches.
7. Name the final ZIP with the same version and a clear release label.

Every fix or release purpose gets its own version. Never reuse a number or hide multiple independent fixes under one version.

## Documentation workflow

For every release, record:

- exact base version
- problem or purpose
- root cause, when applicable
- accepted behaviour
- files changed
- explicit non-scope
- validation performed
- limitations or blocked tests
- rollback/base reference

Update existing documents rather than replacing their history. Add a new file only when it has a distinct permanent role.

## Handover standard

The final ZIP must be understandable without access to the original chat. A future AI should be able to determine:

- what the app is for
- which version is the base
- which behaviours are locked
- what changed recently
- what remains open
- what must be tested
- which areas must not be touched casually

## User collaboration style

The user prefers small portions, direct language and practical choices. Do not repeatedly ask them to reconfirm settled project governance. Present the next sensible action and keep architecture discussions separate from small fixes.
