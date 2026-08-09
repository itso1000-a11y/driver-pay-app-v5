# Driver Pay App v5.2.26-r1 — Packaging / Version Integrity Correction

Heavy QA of v5.2.26 passed Weekly Rest scenarios 1–16 but found a release blocker: `public/sw.js` still used `driver-pay-v5-2-25`.

r1 changes only that cache identity to `driver-pay-v5-2-26`.

Runtime application logic, src, tests, Pay Engine, Weekly Rest logic, compensation, archive/storage/navigation, Setup, dependencies and runtime version remain unchanged.

Required QA:
- ZIP/version integrity
- npm ci
- complete npm test
- npx tsc --noEmit
- fresh npm run build
- post-QA source integrity
- scenarios 1–16

The fresh build must not modify `public/sw.js`.
