# Memory forensic: v5.2.42 vs v5.3.8 using the real backup

## 1. Executive finding

**PROVEN primary regression:** after a version-2 restore, v5.3.8 production UI performs a new, full-lifetime Rest Engine evaluation. It does not use the existing incremental checkpoint runtime. The exact supplied backup produces a 23-fixed-week evaluation horizon; the full allocation solver expands from 56 branches at six weeks to 10,752 branches at twelve weeks, then reached about 4.17 GiB working set in Node while attempting the complete production path. This is the first measured pathological stage and is consistent with the Chrome renderer `Out of Memory` failure.

v5.2.42 restores the same storage snapshot and reloads, but its source contains no `src/rest-engine` directory or allocation-frontier evaluator. Its older weekly-rest UI path is timeline/local-storage based, so it does not construct the v5.3.8 global allocation/compensation graph.

**STRONGLY INDICATED secondary issue:** the B1.2 cold-start loop is also not bounded for this exact legacy-restored state when no incremental checkpoint and no authoritative initial legal context are available. The diagnostic mirror reached 1,696 live allocation alternatives, 4,912 live compensation alternatives, 512 new package branches and about 710 MiB RSS by the 2026-09-21 segment; allocation finalization was zero in every completed segment. It stopped at an intentional 700 MiB RSS cap before the final segment. This is not the UI call path, but it means replacing the UI call alone is not enough evidence for a safe legacy cold-start fix.

**Recommendation: READY FOR FIX TASK.** The fix task must first replace the production full evaluator path with the existing incremental integration, then make legacy/no-checkpoint bootstrap bounded without inventing history authority or changing REVIEW/finalization semantics.

## 2. Exact inputs and reproduction status

| Item | Evidence |
|---|---|
| Known-good source package | `driver-pay-app-v5.2.42-end-week-pay-context-carry-fix-source-qa.zip`, SHA-256 `11016316BA3BEF9B086985B152E7B179F8CD194C4E02AE6327038C20C65A8786` |
| Candidate package | `driver-pay-app-v5.3.8-FINISH-GUIDANCE-PHONE-QA.zip`, SHA-256 `C2F40A2416F9722182855D3AAF7ED7EF2CD5FBAC7E02E231FF4695CD96734424` |
| Mandatory real backup | `driver-pay-backup-2026-10-03-2026-09-28.json`, SHA-256 `3EB217B326CCF9AC2657991C8CA801E88FA106960CB71C73329FB1169AE83123`, 597,597 bytes |
| Backup content used | format v2; 36 snapshot keys; 22 saved-week keys; 20 archive entries / 140 archived days; 154 migrated facts, 142 FACTUAL facts |
| Browser result | User reproduced Chrome renderer `Out of Memory` in v5.3.8 after restoring this backup; same backup is shown loaded normally in v5.2.42. |
| Source changes made by this task | None. All new files are isolated diagnostics under `outputs/memory-forensic-v5242-v538/`. The original backup was read only. |

The reference ZIP supplied in the task name was not present under that exact filename. The extracted v5.2.42 source ZIP above declares `version: 5.2.42` and is the available known-good v5.2.42 PHONE-QA source reference.

## 3. Restore path comparison

### Shared restore mechanics

Both source versions use the same version-2 restore structure in `src/App.tsx`: `restoreLocalStorageSnapshot()` snapshots current localStorage, calls `localStorage.clear()`, writes each backed-up key, then `window.location.reload()` after a successful parse. In v5.3.8 this is at lines 1842-1856 and 1908-1927. The backup therefore restores its archive, saved-week keys, active-week aliases, settings, profile data, migration keys, and current-day aliases exactly as strings.

The backup contains migration snapshot/current/marker keys but contains **no** `driverPayApp:restEngine:v1:incremental-checkpoint-v2` key.

### v5.2.42 after reload

The extracted v5.2.42 source contains four source files (`App.tsx`, `main.tsx`, `react-shim.d.ts`, `version.ts`) and no Rest Engine evaluator/frontier/checkpoint source. It reads saved weeks and archive through its local timeline helpers. There is no call to `evaluateProductionRestEngine`, `evaluateRestEngine`, `orchestrateIncrementalRestEngine`, or an equivalent global allocation solver.

### v5.3.8 after reload

1. `App.tsx` mounts and its `restEngineState` `useMemo` runs (lines 2175-2186).
2. It calls `captureStorageSnapshot(localStorage)`. `src/rest-engine/storage.ts:24-31` deliberately excludes every key beginning `driverPayApp:restEngine:v1:`.
3. `buildAuthoritativeLegacySnapshot()` adds visible-day/archive data.
4. `evaluateProductionRestEngine(snapshot, restEngineAsOf)` runs.
5. `src/rest-engine/presentation.ts:174-190` migrates facts, builds a full historical horizon from the earliest fact through current week, and calls `evaluateRestEngine`.
6. `src/rest-engine/evaluate.ts:122-151` normalizes all facts, derives all intervals, creates all candidate options, calls one-shot `solveWeeklyRestAllocations`, then evaluates compensation over every allocation branch.

The runtime checkpoint API exists (`incremental-checkpoint-runtime.ts:3-4`) but no production UI source imports or calls `orchestrateStoredIncrementalRestEngine`. The existing migration state restored from the backup is also not read by the UI evaluator because `captureStorageSnapshot()` intentionally removes the entire Rest Engine namespace before migration/evaluation.

## 4. Production call graph

```text
App.tsx restEngineState useMemo
  -> captureStorageSnapshot(localStorage)       // filters Rest Engine keys
  -> buildAuthoritativeLegacySnapshot(...)
  -> evaluateProductionRestEngine(...)
       -> migrateLegacyFacts(...)
       -> evaluationHorizon(all factual facts)  // 23 fixed weeks here
       -> evaluateRestEngine(...)
            -> normalizeActivityFacts(all facts)
            -> deriveRestIntervals(all facts)
            -> generateWeeklyRestComponentOptions(all intervals)
            -> solveWeeklyRestAllocations(...)  // one-shot; allocationChoiceGenesis/combineChoices
            -> evaluateCompensation(all branches)
```

This memo is invalidated by `days`, `archive`, visible/active week identifiers, and `restEngineAsOf`. `restEngineAsOf` is advanced on a 60-second interval (`App.tsx:2206+`), so a completed instance would re-run the full calculation at least once per minute as well as on the listed state changes. The evaluation object is retained in React memo state; no separate object-retention leak is proven, because the branch explosion alone exceeds the renderer budget.

## 5. Checkpoint/frontier usage status

| Question | Finding |
|---|---|
| Does the restored backup contain an incremental checkpoint? | No. |
| Does production UI load/reuse it? | No. `orchestrateStoredIncrementalRestEngine()` is not in the `App.tsx` call path. |
| Does production UI call the full evaluator? | Yes, on each `restEngineState` memo recomputation. |
| Does production UI get finalized-history/suffix-only behavior? | No. It invokes one-shot `solveWeeklyRestAllocations()` on the full horizon. |
| Is the B1.2 checkpoint runtime otherwise present? | Yes: `incremental-checkpoint-runtime.ts` loads, validates, orchestrates, and writes a checkpoint, but is disconnected from presentation. |

## 6. Stage measurements

All measurements use the exact backup and `asOf = 2026-09-28T19:57:46.569Z`. Memory is Node process memory and is diagnostic only; browser renderer memory was not modified or repeatedly stressed.

### Safe stages of production-equivalent pipeline

| Stage | Time | Heap after | RSS after |
|---|---:|---:|---:|
| migration | 37.31 ms | 14.51 MiB | 75.23 MiB |
| normalization | 41.01 ms | 13.46 MiB | 76.55 MiB |
| chronology | 64.05 ms | 13.26 MiB | 85.48 MiB |
| weekly candidate generation | 19.28 ms | 17.20 MiB | 85.55 MiB |

Counts at this point: 142 factual facts, 49 RestIntervals, 27 WeeklyRestComponentOptions. Option patterns: 4 `SINGLE_REDUCED`, 18 `SINGLE_REGULAR`, 2 `REDUCED_THEN_REGULAR`, 2 `REGULAR_THEN_REDUCED`, 1 `REGULAR_THEN_REGULAR`.

### First pathological stage: one-shot full allocation

| Evaluated fixed-week horizon | Allocation branches | Time | Heap after | RSS after |
|---|---:|---:|---:|---:|
| 6 weeks | 56 | 60.03 ms | 13.60 MiB | 84.16 MiB |
| 12 weeks | 10,752 | 9,213.65 ms | 224.23 MiB | 395.99 MiB |
| production horizon (23 weeks) | did not complete | process observed at ~67.75 CPU seconds | not safely completed | **~4.17 GiB** working set |

The stage-by-stage process wrote its measurement file after every safe stage. It did not write an allocation result because `solveWeeklyRestAllocations()` was still expanding state. The process was allowed to exit rather than being retried. Therefore the exact first measured divergence is `solveWeeklyRestAllocations()` in `evaluateRestEngine()`, not migration, chronology, or candidate generation.

### Separate cold-start incremental diagnostic (not production UI)

A disposable diagnostic mirror used the existing segmented solver, frontier projection/finalization, compensation transition, and package continuation primitives week-by-week. It intentionally exited above 700 MiB RSS.

| Through fixed week | Allocation branches in segment | Live allocation | Live compensation | Package branches | Finalized allocation | Segment time | RSS |
|---|---:|---:|---:|---:|---:|---:|---:|
| 2026-08-31 | 48 | 56 | 56 | 8 | 0 | 109.08 ms | 109.07 MiB |
| 2026-09-07 | 112 | 144 | 232 | 32 | 0 | 371.45 ms | 167.90 MiB |
| 2026-09-14 | 432 | 592 | 1,192 | 160 | 0 | 2,549.21 ms | 315.23 MiB |
| 2026-09-21 | 1,184 | 1,696 | 4,912 | 512 | 0 | 10,598.13 ms | 709.93 MiB |

The trace halted before 2026-09-28. This indicates that the current legacy/no-checkpoint bootstrap path is also not demonstrated bounded. The most likely retention reason is not asserted as legal fact: `finalizeAllocationFrontier()` must retain REVIEW alternatives, and cold-start context passes no authoritative initial legal context. A fix must investigate this without treating REVIEW as CLEAR.

## 7. Root-cause classification

### PROVEN

- The production v5.3.8 UI bypasses incremental checkpoint orchestration and calls the full one-shot evaluator after restore.
- The restored snapshot has no incremental checkpoint, and UI filtering drops the restored migration namespace before it evaluates.
- The one-shot full allocation stage grows catastrophically on the exact backup; candidate construction does not.
- v5.2.42 has no corresponding global Rest Engine allocation pipeline.

### STRONGLY INDICATED, requires fix-task validation

- A direct switch to the current cold-start incremental loop is not yet a sufficient remedy for this backup. Its week-by-week diagnostic trace grows rapidly with zero finalization before the cap.
- The absence of an authoritative `initialLegalContext` and the resulting conservative REVIEW retention are relevant. They must not be bypassed by inferred facts, blank days, or an unsafe history assumption.

### NOT PROVEN

- A separate browser-only leak after a bounded evaluation.
- A defect in the exact PackageContinuation/D1-D2-D3 legal semantics.
- Backup corruption; the backup is accepted by v5.2.42 and all safe v5.3.8 pre-allocation stages.

## 8. Exact affected source locations

- `src/App.tsx:1842-1856, 1908-1927` — storage replacement and reload.
- `src/App.tsx:2175-2186` — production render invokes full presentation evaluator.
- `src/App.tsx:2194-2205` — writes migration state after state/archive changes; this is not consumed by that presentation evaluator.
- `src/rest-engine/storage.ts:24-31` — captures legacy source by explicitly filtering Rest Engine namespace keys.
- `src/rest-engine/presentation.ts:115-136` — full historic horizon based on factual facts; `:174-190` calls full evaluator.
- `src/rest-engine/evaluate.ts:122-151` — full graph construction and one-shot allocation/compensation.
- `src/rest-engine/weekly-rest-allocation.ts:749-751` — `solveWeeklyRestAllocations()` delegates to one-shot solver; `:360-361` combines all choice groups.
- `src/rest-engine/incremental-checkpoint-runtime.ts:3-4` — existing, but not wired to UI.
- `src/rest-engine/incremental-orchestration.ts:46-70` — checkpoint/suffix branch and cold-start chronological loop.
- `src/rest-engine/allocation-finalization.ts:51-58` — conservative retention of REVIEW alternatives.

## 9. Minimal safe fix direction

A separate source-changing task should be constrained to these stages:

1. Introduce a presentation adapter that uses the existing stored incremental runtime rather than `evaluateProductionRestEngine()` / `evaluateRestEngine()` for the normal UI evaluation path.
2. Define a safe restore bootstrap for a backup without an incremental checkpoint. It must preserve unknown/review legality and cannot infer history authority from earliest fact, OFF rows, archive age, or pay-week boundaries.
3. Add an exact real-backup regression with stage counters and a renderer-compatible memory budget. It must verify one cold bootstrap, checkpoint serialization, and one reload/suffix reuse.
4. Only after the bootstrap is bounded, remove or gate the legacy full-lifetime presentation path. Do not silently select a branch, finalize REVIEW, alter package semantics, or alter compensation rules.

## 10. Explicitly out of scope for the fix task

Do not change Weekly Rest, compensation, PackageContinuation, rolling anchor, 144-hour, fixed-week, two-week, Daily/Split Rest, provenance, blank-day, archive facts, Pay/Profile, PWA, UI text/layout/colour, Finish Guidance, backup format, dependencies, or the original backup.

## 11. Recommendation

**READY FOR FIX TASK.** The evidence is sufficient to target the production evaluation wiring and legacy checkpoint bootstrap. Physical phone QA remains blocked until the exact backup completes in a browser/PWA renderer within bounded memory.
