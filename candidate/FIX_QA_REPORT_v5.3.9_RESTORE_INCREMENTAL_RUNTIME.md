# v5.3.9 Restore Incremental Runtime — Fix QA Report

## Scope and root cause

The exact regression backup (`driver-pay-backup-2026-10-03-2026-09-28.json`, SHA-256 `3EB217B326CCF9AC2657991C8CA801E88FA106960CB71C73329FB1169AE83123`) caused v5.3.8 production to invoke the full-lifetime `evaluateRestEngine()` path after restore. The forensic run proved branch expansion in `solveWeeklyRestAllocations()` reached a multi-GiB working set over the full historical horizon.

v5.3.9 routes ordinary App presentation through `evaluateStoredProductionRestEngine()`, which uses `orchestrateStoredIncrementalRestEngine()` and the persisted incremental checkpoint. The direct full evaluator remains available only when no storage is supplied, for differential/test use.

## Call graph

Before: `App useMemo -> evaluateProductionRestEngine -> evaluateRestEngine -> solveWeeklyRestAllocations(full lifetime)`.

After: `App useMemo -> evaluateProductionRestEngine(snapshot, asOf, localStorage) -> evaluateStoredProductionRestEngine -> orchestrateStoredIncrementalRestEngine -> valid checkpoint reuse or bounded incremental bootstrap`.

## Legacy bootstrap safety

A legacy restore with no valid checkpoint evaluates chronological segments incrementally. Before compensation work is allowed to expand an unsafe frontier, a 96-live-allocation alternative cap records a derived `STATE_CAP` checkpoint retaining the last safe continuation state. The returned state remains REVIEW; no factual history is fabricated, discarded, or upgraded to CLEAR. The checkpoint semantic version changes to reject incompatible old derived checkpoints. A matching subsequent reload reuses the checkpoint; a factual fingerprint mismatch invalidates it.

## Exact backup result

- Migration storage keys: 37
- Authoritative factual facts: 142
- First no-checkpoint production restore: 817.5 ms
- Process RSS: 70,266,880 bytes before; 160,731,136 bytes after
- Persisted safe checkpoint: yes
- Safety state: `STATE_CAP`, stopped before fixed week `2026-09-07`
- Retained live allocation alternatives: 56
- Retained live compensation alternatives: 56
- Same-snapshot reload: checkpoint reused; serialized checkpoint unchanged
- No renderer/process OOM was observed in the focused production runtime fixture.

These counts are diagnostics for this backup, not runtime constants. The only safety threshold is the explicit conservative 96-live-allocation bootstrap cap.

## Focused verification

- R1–R9 restore/runtime fixture: PASS
  - bounded exact restore, checkpoint creation and reuse, production wiring, fingerprint invalidation, REVIEW preservation, non-factual evidence preservation, Pay settings preservation.
- B1E2E-01..15 / CT1..CT8 persisted continuation: PASS
- P1–P10 package allocation: PASS
- Phase 2–3 T01–T50: PASS
- Phase 4 T51–T99: PASS
- Phase 5 T100–T191: PASS
- Phase 6–7 T192–T245: PASS
- Phase 8 T246–T283: PASS
- Phone production provenance: 22/22 PASS, including the 36h30 and 33h45 historical cases.
- Finish guidance FG01–FG28: PASS.
- `npm test`: PASS.
- `npx tsc --noEmit`: PASS.
- Fresh `npm run build`: PASS.
- Release/version consistency v5.3.9: PASS.

## Legal and product invariants

No changes were made to Weekly Rest allocation, rolling anchors, fixed/two-week rules, Daily or Split Rest, compensation/PackageContinuation semantics, provenance, blank-day policy, Pay/Profile, Archive, PWA workflow, user backup format, or Finish Guidance behaviour. Existing ordinary 32h30 Reduced debt and package `8h30 + 24h` behaviours remain covered by the compensation/package focused tests.

## Version and environment

Runtime identity was updated consistently to v5.3.9 in package metadata, version source, HTML, manifest, service-worker cache and release history. The known Windows native-esbuild ancestor-path issue was avoided using a temporary `R:` `subst` mapping for build/test. The mapping was removed after each command.

## Remaining risk

The legacy backup now receives a controlled REVIEW bounded checkpoint rather than an exhaustive all-history allocation result when the safety cap is reached. This is intentional conservative behaviour: it preserves source facts and avoids a false legal conclusion or browser OOM. Physical phone QA remains pending and is not claimed by this report.
