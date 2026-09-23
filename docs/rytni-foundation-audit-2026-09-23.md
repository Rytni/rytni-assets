# Rytni Подари — foundation / tech-debt audit (2026-09-23)

Scope: static inspection of the current TEST source and public `https://rytni.live/testpodari` baseline. No application, backend, or Production changes. The browser checks used the existing anonymous preview flags to reach Arcade; account-only RPC behavior is therefore not an authenticated-user result.

## Architecture map

`00_T123_ТЕСТОВЫЙ_ЗАГРУЗЧИК.html` selects a content-addressed TEST release from `giveaway-test/manifest.json` (S3 first, GitHub Pages/raw mirrors). `tools/build_tilda_test.ps1` concatenates the 2.12 page blocks, `07_T123_TIKTOK_КВЕСТ_2.12.html`, `08_T123_BROWSER_ARCADE_2.15.34.html`, and the strict `arcade/assemble-snake-v2.cjs` output. The page popup/progression tabs contain `progressionPanelArcade`; `RytniArcadeHub` switches between Fly's `.rytni-arcade-stage` and Snake's `#msStage`. Fly is implemented inside block 08 and exports `RytniMushroomFly`; Snake v2 uses `arcade/snake-core.js` (simulation), `snake-controller.js` (lifecycle/input/canvas), `snake-forest.js` (world renderer), and `snake-ui.html` (scoped styles). Snake audio uses Fly's `AudioManager`. Supabase RPC calls are page/Hub integrations, not game simulation.

## Confirmed findings

| Priority | Evidence and root cause | Observable consequence | Smallest safe correction |
| --- | --- | --- | --- |
| High | `05A_T123_JAVASCRIPT_ЧАСТЬ_1_2.12.html:651-654` closes `activePopup` on every `Escape`. `arcade/snake-controller.js:23` does not consume `Escape` in Main Menu; `arcade/09_T123_ARCADE_HUB_SNAKE.html:85` leaves Snake when the popup hides. Public TEST reproduction: open Snake menu fullscreen at 1366×768, press Escape; fullscreen exits **and** `applicationPopup` becomes `aria-hidden=true`, Hub selection becomes `null`, stage rect becomes 0×0. | User loses the game/popup when intending only to exit fullscreen. | In the parent popup Escape handler, let a game-owned fullscreen exit complete without closing the popup; keep normal Escape-to-close when not fullscreen. Test Fly and Snake menu/play/pause. |
| Medium | Fly block `08_T123_BROWSER_ARCADE_2.15.34.html:553-559` immediately constructs and fetches 42 image assets on script evaluation, before Arcade is selected. | Non-Arcade page load pays game image network/decode cost. This is a proven eager-load pattern; user-visible latency was not measured. | Move asset kickoff behind first Fly activation or schedule idle prewarm; retain one shared promise and the existing S3→mirror fallback. Measure before changing. |
| Medium | Fly CSS in `08_T123_BROWSER_ARCADE_2.15.34.html` has sequential base/recovery/modern rules for the same stage, canvas, overlay and modal (`:21-23`, `:75-79`, `:127-150`, `:192-252`), including **609** `!important` occurrences. `snake-ui.html:7-10,52-55` likewise redefines frame/canvas geometry in a later layer. | High regression risk when changing geometry; source order, not a single contract, decides final layout. No current stage shift reproduced. | Preserve present computed geometry. In a separate scoped pass, document the effective stage/modal contract and remove only overrides proven redundant by computed-style and viewport tests. |
| Low | Anonymous preview produced HTTP 401 from Supabase `/auth/v1/health`, `get_my_top10_status`, and `get_giveaway_tiktok_hub_v21516`, plus TikTok target-origin `postMessage` warnings. Source of account-only RPC calls is the page/progression layer, not Snake. | Noisy console makes genuine game errors harder to spot. No JS exception or asset 404 observed. | Gate account-only RPC on valid auth state if existing product behavior permits; classify known third-party warnings in QA reporting. Do not weaken auth/RLS. |

## Verified protections / negative findings

- Snake `activate()` listeners and `ResizeObserver` are scoped to an `AbortController` and disconnected on `deactivate()` (`snake-controller.js:22-32`). Three `Snake → Hub → Snake` cycles left `active=false`, `raf=false`, aborted listener signal, and audio sources 0 after each exit. No accumulating listener leak was demonstrated.
- Snake `play → pause` on TEST kept stage 1118×628.875, canvas CSS 1070×580.875, backing 1070×581; pause set RAF false. `menu → How to Play` also kept those dimensions. Fly `main → Settings` kept stage 802.234×451.25 and canvas 798.234×447.25. Temporarily increasing adjacent leaderboard height to 1500px did not change Fly stage/canvas dimensions. Thus neighboring block and tested overlays did not resize the game stage.
- Snake portrait 390×844 correctly displayed its fullscreen/orientation gate. After entry and resize to 844×390, state became `play`, fullscreen was active, D-pad appeared; tapping UP changed direction. Exiting fullscreen and returning to portrait restored embedded canvas 324×704 / backing 486×1056. Desktop Snake fullscreen stage measured 1366×768, canvas 1318×720. The Escape parent-popup defect above is the exception.
- One mobile viewport resize (390×844 → 412×915) invoked Snake `viewport()` **three** times (window/visual viewport/observer sources); its RAF guard coalesced measurement. This is redundant dispatch, not evidence of three canvas resets. `snake-controller.js:29,55,63` owns these paths. Fly also binds window resize, orientation, screen orientation, visual viewport, stage `ResizeObserver`, and fullscreenchange (`08_T123_BROWSER_ARCADE_2.15.34.html:684-692,800-804`), but duplicate expensive work was not measured.
- Fly `clearRun()` cancels its RAF and run timers, and `deactivateArcade()` clears the refresh interval (`08_T123_BROWSER_ARCADE_2.15.34.html:740-753`). Its page-lifetime `MutationObserver` and `ResizeObserver` (`:691,1480`) are not disconnected, but only one block initializer was observed; they are **retained observers**, not a proven cycle leak.
- TEST network: release and game assets loaded; no 404 found. Mirror manifest/release requests aborted after the S3 winner (`ERR_ABORTED`) are expected loader races, not unavailable assets. No Snake/Fly JS exception observed. Current TEST release: `2.15.33-faabc5ea03fd`.

## Candidates requiring verification, not deletion yet

- `arcade/09_T123_ARCADE_HUB_SNAKE.html:28-76` still contains the v1 Snake engine/renderer; `arcade/assemble-snake-v2.cjs:13-19` slices that range out and injects v2. It is dead in the current assembled TEST bundle, but may support standalone/legacy uses; check references before removing.
- Older `02_Tilda_7_блоков/*2.9.html` and `01_T123_ОСНОВНЫЕ_СТИЛИ_2.9.html` are excluded by `tools/build_tilda_test.ps1:8-18`; do not delete until other publishing paths are checked.
- Fly's 42 eager images and Snake's `preload()` decode/raster work (`snake-controller.js:21`) should be profiled for cold navigation and repeated page loads. Snake `ready` reuses its promise across in-page game cycles, so duplicate decode per open was **not** established. Largest Snake art files are around 1.6–2.2 MB each; audit transfer/decode waterfall before considering compression or removal.
- The global popup `MutationObserver` and Fly host `MutationObserver` watch broad subtrees; inspect callback counts under heavy page updates before treating them as performance defects. No forced layout/reflow spike was captured in this baseline.
- CSS `transform:scale()` and fixed dimensions exist in Fly responsive HUD/modal rules (`08_T123_BROWSER_ARCADE_2.15.34.html:114,145-146`). Their computed desktop/mobile result passed the tested sizes; avoid speculative removal.

## Minimal target Game Host contract

Keep Hub as the adapter, not a rewrite: page owns tabs/popup/auth; Host owns selected game, one activation/deactivation transaction, fullscreen/visibility handoff, and stable stage element; each game owns only its canvas geometry, simulation, input, RAF/audio/timers and overlays inside that stage. Parent Escape/navigation should first offer an active fullscreen game the event, then close the popup only when no game transition consumed it. Keep the existing Fly and Snake stages unless a measured failure requires consolidation.

## Repair order

1. **Critical:** none established in this baseline.
2. **High:** fix fullscreen Escape propagation/ownership; targeted desktop/mobile regression for Fly and Snake.
3. **Medium:** measure Fly eager-load impact, then defer/idle-prewarm without changing assets; reduce competing CSS only with computed-style snapshots and stage invariants; instrument resize callback and canvas backing reset counts.
4. **Cleanup:** classify preview-only 401/TikTok warnings, verify legacy references, then remove proven-dead v1/2.9 code in separate review.

## Baseline coverage and limits

Playwright CLI on public TEST: desktop 1366×768 page → Arcade → Fly Main/Settings/Training/Result → Hub → Snake Main/How-to/Training/Result, stage metrics, repeated open/exit, fullscreen/Escape; mobile 390×844 → fullscreen prompt → 844×390 play/D-pad → exit fullscreen → portrait; mobile resize 412×915. Fly Pause, authenticated ranked flow, prolonged gameplay, device-specific browser chrome/audio, DPR migration, and quantitative RAF/observer/asset timing were not established here. Do not infer their failure or success from this audit.

Checkpoint at audit start: `9a5813b7c7e97ab4b87118965c0ec29cd96cdf2f`; tracked worktree clean. Existing untracked QA/output files were not modified. Source inspected: TEST build/loader, current 2.12 page CSS/JS blocks, Arcade/Fly block 08, Snake assembler/core/controller/world/UI, Hub adapter, and current TEST browser runtime. Production manifest, Supabase backend/schema/RLS/RPC, Fly/Snake gameplay and page design were not changed.
