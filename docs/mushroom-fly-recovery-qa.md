# UI recovery — 2026-09-10

- Previous good: 39bf99d. Starting point: b1c78ec.
- Checkpoint: checkpoint/mushroom-fly-before-recovery-b1c78ec.
- Working branch: mushroom-fly-ui-recovery-final.
- TEST release: 2.15.33-0d90cba87e5e; production not changed.
- Source of truth before bundling: C:/Codex/Rytni Gift/RYTNI_TRANSFER_2026-07-31/CORE/Сайт/02_Tilda_7_блоков/08_T123_BROWSER_ARCADE_2.15.34.html.

## Selective recovery

Desktop tutorial again displays basics plus all powerups; desktop settings use two full-width columns. Portrait keeps ornamental section navigation and preserves the selected settings section when toggling controls. The inner frame backing no longer inherits the legacy 11px mobile pseudo-element height. Main control widths and text containment are corrected. A very short embedded container (≤560×300) puts actions in a compact three-row layout without reducing hit targets. Short pause omits its nonessential explanatory sentence so actions remain inside the frame.

Title-scene art, stable stage, fullscreen mechanism, 9-slice frame and gameplay are retained. No Rating, Daily/King or duplicate main-menu stats restored. Twelve independently generated PNG icons replace the outlined glyph set; secondary result information uses typography. Icon prompts and gallery: ../mushroom-fly/icon-qa/.

## Verification

- Menu matrix: 21 viewport sizes × 11 states; stage containment, no horizontal document overflow, footer containment, ≥44px targets.
- Recovery matrix: embedded 1366/1920/2560, tablets 768/1024, portrait 360/390/412, landscape 844; fullscreen 1920/2560/3440; main/tutorial/settings/pause/result, both portrait sections.
- 125% checked by CSS viewport ÷1.25 with deviceScaleFactor 1.25. This is layout emulation, not a manual browser-zoom check.
- All desktop descriptions fit without inner scrolling at standard stage size. Small portrait and low landscape may scroll content, while actions remain reachable.
- All twelve icons: genuine alpha, 20/24/32/40/48 CSS px on wood/green/dark/checkerboard; visually inspected before integration.
- Stable-stage/fullscreen/21:9/frame checks passed. Gameplay test: 50 seeded courses, visual/gameplay/late-profile/retry regression passed.
- Real https://rytni.live/testpodari checked at 390 and 1366: main/tutorial/settings/pause/result, image loading, no generic SVG in dialogs, footer containment; fullscreen scene and tutorial. Preview parameters supply test data, not real player transactions.
- The real TEST page exposed a smaller 436×245 game container: final compact main/pause fixes were verified there.
- In that exceptionally short container, settings/tutorial/result content scrolls; full two-column desktop content remains available at the normal ~800×450 stage and in fullscreen. The action footer stays visible.
- Preview polling no longer resets preview menus every 750ms; authenticated polling and gameplay were not changed.
- Bundle hash and syntax validation passed. Twelve new media files uploaded to TEST before manifest switch.

Re-run tools in the sibling source project's tools folder: test_browser_arcade_menu_redesign.js, test_browser_arcade_recovery.js, test_browser_arcade_stage_architecture.js, test_browser_arcade_2.15.34.js, test_mushroom_fly_live_test.js. Screenshots are under its artifacts/mushroom-fly-recovery and artifacts/mushroom-fly-menu-redesign; selected evidence is retained in mushroom-fly/qa.
