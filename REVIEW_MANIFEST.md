# v5.3.9 STATE_CAP Prefix Continuation Review r2

Baseline: preserved v5.3.9 r1 review candidate. Candidate: v5.3.9 r2 correction.

## Changed files and SHA-256

| File | r1 SHA-256 | r2 SHA-256 |
|---|---|---|
| $f | 62FD872F4F923D7A5A54BA495E08FA8BB6100163BE610CEC2D8FA7F2CC0005AA | F148E4BFC772F3FDFC79574236189ADB678486AAFAF1565C550FA36993E2BDB3 |
| $f | 2D47DD5F7E024BA6970FC3DA3CA7067B3E4D65AB2D25DD3C09CF36287DF09C88 | 5732FE4454134E15532106EC4E7C3419284BD8D6F797E9D0F05E41B882E40AB8 |
| $f | 0402C3A26C635CF4036E049D1443D86B0A467DF114FE9FB2A23D5CE75D4B82C4 | 414A603803FCBFA237DDDC769F7627E669DE6A4C346A130543348C76011CCFA3 |

## Contract

- STATE_CAP source authenticates only the evaluated prefix; suffix facts are excluded.
- Prefix edits invalidate. Future-only/suffix edits retain the checkpoint and use seeded continuation.
- Last-safe allocation and compensation states are canonical immutable snapshots.
- STATE_CAP remains REVIEW. No legal, UI, Pay/Profile, Archive, PWA or backup-format behaviour changed.
- C1-C10, B1E2E-01..15, CT1-CT8, P1-P10, FG01-FG28, full npm test, TypeScript and fresh build: PASS.

## Packaging

candidate/src is the complete current source tree. Baseline copies cover every r2-changed file. The patch is r1 -> r2. No node_modules, dist, backup, caches, credentials, or personal storage are included.
