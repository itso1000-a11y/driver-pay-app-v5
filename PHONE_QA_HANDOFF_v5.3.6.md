# Driver Pay App v5.3.6 — Physical phone QA handoff

## Package and build identity

- Source/build identity: `v5.3.6` (`Driver Pay App v5.3.6`).
- Source package is accepted by automated regression: `npm test`, TypeScript, fresh production build and version consistency all passed.
- No production source, visuals, colours, layout or driver-facing wording was changed while preparing this PHONE-QA package.

## PWA installability audit

- Manifest link: `/manifest.webmanifest` in final `dist/index.html`.
- Stable installed identity: `name` and `short_name` `Driver Pay App v5`; `id` and `start_url` `/?app=driver-pay-v5-clean`; `scope` `/`; `display` `standalone`.
- Manifest: valid name, short name, icons, start URL, display, portrait orientation, existing background/theme colours and v5.3.6 description. `prefer_related_applications` is absent.
- Icons: `/icons/icon-v5-192.png` valid PNG `192x192`; `/icons/icon-v5-512.png` valid PNG `512x512`; `/apple-touch-icon.png` valid PNG `180x180`; `favicon.ico` valid ICO. Manifest icon src, sizes, type and `any maskable` purpose match the files.
- Mobile metadata retained: viewport, theme-color, mobile-web-app-capable, apple-mobile-web-app-capable, apple-mobile-web-app-title, apple-touch-icon and apple status-bar style.
- Service worker: final `/sw.js`, cache `driver-pay-v5-3-6`, app-shell paths present, old cache cleanup on activation, root scope registration, explicit `SKIP_WAITING` only from the `Update` button, and one guarded `controllerchange` reload. P05 regression passed.
- Final build has no `/src/main.tsx` reference and has its current `/assets/index-D7Letnbx.js` production asset.

## Deployment and installation requirement

**The PHONE-QA ZIP is not an installer.** Deploy its `dist` from a normal HTTPS origin, then open that origin in the target browser and use its existing Install control/browser install UI. `localhost`/`127.0.0.1` are suitable only for local development checks; `file://` is not a normal phone-install origin.

For an update and data-preservation test, deploy to the **same origin/domain** as the existing installed Driver Pay App. A new preview domain is only a **CLEAN INSTALL TEST**: it has independent localStorage, service worker, cache storage and PWA origin identity and cannot prove update preservation.

## Physical phone checklist

Use Chromium/Android where install eligibility permits `beforeinstallprompt`; unsupported platform/browser behavior alone is not an app failure.

1. **P01:** Fri Finish `19:30`, Sat Day Off, Sun Start `08:00` → Reduced weekly rest `36h30`, never a false `8h00` violation.
2. **P02:** same history, Sun Start `05:15` → `33h45`, never a false `5h15` violation.
3. **P03:** type time digit-by-digit; no white screen; `0800` normalizes to `08:00`.
4. **P04:** compare with v5.2.42 phone baseline: visual model, colours, layout and wording unchanged; no raw GREEN/YELLOW/RED badge or engine jargon.
5. **P05:** close and reopen after P01/P02; the correct result and local data persist.
6. **P06:** install from the HTTPS browser origin; confirm installed name `Driver Pay App v5`, v5 icon, standalone launch and `/?app=driver-pay-v5-clean` start URL.
7. **P07:** on the same installed origin only, test `New version available` → `Update`: no silent reload, one reload after Update, new version active and local data preserved.

After one online load/install, also close and reopen offline: the app shell should reopen without a blank screen or reload loop. Physical phone acceptance remains pending.
