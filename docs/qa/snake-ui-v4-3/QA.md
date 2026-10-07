# V4.3 focused material / hierarchy QA

Base `b624986` and actual V4.2 TEST runtime `snake-next-7cb676c44096`. Structure locked. Human approval: PENDING.

## Causes / implementation

1. Menu scenery competed with labels because its chroma/exposure matched action art. Exported the SAME1920×1080 forest into a menu-only PNG: chroma multiplier0.76 around Rec.709 luma; exposure0.83 (selective warm lantern/mushroom highlights0.86), tiny teal shadow lift. No blur, resampling, scene replacement or runtime full-screen color filter. A cheap static vignette completes focus. `.playing` and `.paused-game` retain original gameplay background.
2. Large brown backings were repeated wood sources. New bounded CSS smoked-emerald surfaces combine charcoal/emerald gradients, very low-opacity grain, restrained internal light/shadow and thin antique-gold outline. Original nine-slice wood edges/corners/crests and button caps/centers retained. Main/TOP-3/attempts/record layout unchanged; primary green remains concentrated on Play.
3.18 clean128×128 transparent RGBA symbols exported from authored vector sources: Guide, Trophy, Leaderboard, Settings, Sound On/Off, Fullscreen/Exit Fullscreen, Back, Close, Home, Restart, Share, Rank/growth, Combo, Gold/Silver/Bronze medals. No foliage/text/baked frames. Runtime uses PNGs with anti-aliased scaling and uniform plates,56px desktop primary controls /44px compact controls. Home/Restart are available symbols without adding unnecessary icons to existing text buttons. Guide instructional/pickup art and gameplay HUD stay approved originals; only Guide Close/baseline/background grade changed.
4. Result title/hero/stats now share a calm emerald focus surface; title has its own soft radial focus underlay. The old duplicate forest inside the Result frame is gone. Ivory title contrast is not dependent on text-shadow alone; record/training/ranked routing unchanged.
5. FINAL-raster ownership found an actual source-ink mismatch: old backing inset16px, opaque inner rail ends approximately top17 /bottom10 /left13 /right13px from bounds. Old gaps at DPR1 /1.5 /2: top0, bottom6, left/right≈3px. Destination rails themselves are48px but mostly transparent. New backing inset `16px 12px 9px`: approximately1px underlap into actual ink, NOT20px hidden overlap. Source rail/corner PNGs unchanged. Final raster gap **L/R/T/B0/0/0/0** at all three DPRs; clean normal-scale plus×8 crops reviewed.
6. All text buttons share `.button-label` grid-centering, line-height1 and `--button-label-optical-y:1px`. Calibrated against actual Georgia Play and Trebuchet secondary font rasters;8 requested labels captured BEFORE/AFTER at DPR1 /1.5 /2, with×4 review. No per-button offsets or cap/color seam reintroduction.
7. Ranking previously nested a second illustrated board/crest inside an overflow:auto body; clipping/scrolling applied to the artwork as well as rows. New outer shell uses real host safe budget (cqh AND menu height), owns the only nine-slice panel, fixes title/season/TOP-3/own summary/Back, and scrolls only rows4–10. Existing ordering/escaping/own-row/leader semantics and data untouched. Reduced compact ornaments remain proportional and inside safe area.

## Passed local gates

-73/73 product/appearance/stable-camera Node tests. Two historical UI assertions updated specifically for the new PNG medal and outer-owned Ranking crest; data security/escaping/order assertions retained.
-126 native layout checks at1920×1080,1366×768,1280×720,844×390 plus608×342 embedded-sized stress; all safe bounds pass. Pinned BEFORE reproduces crest cropping at1280. Ranking's earlier inner artwork clipping is separately visible in BEFORE images, not inferred from outer boxes.
-480 unchanged large-number regression checks,8 scores ×6 ranks ×2 value columns ×5 hosts; zero failures.
-18 exported PNG contracts verified:128×128 RGBA, transparent exterior;44/56px and monochrome silhouettes reviewed.
-Final seam raster ownership/crops:3DPR ×4sides;0 gaps after, root cause above. Diagnostic tint preserves actual source alpha and placement; CLEAN composites reviewed separately.
-Exact canonical candidate in REAL TEST host:1920desktop260 /1366desktop260 /1280desktop260 /844mobile249 checks PASS. Includes embedded and fullscreen Ranking/Guide fit, row10 reachability, switching, Training/Pause/confirm/Result/Settings, D-pad/fullscreen gate. No new page/console errors, failed assets or Fly ranked RPCs. Baseline anonymous auth-health401 remains separately recorded.
-Protected-source audit against actual base: gameplay/Smooth V4/ribbon, grid/frame/FIT WORLD, portal/expansion/food/audio/effect skins, attempts/sponsor/leaderboard/backend/controller, original art/Fly/Production unchanged. Packaging only adds the new asset-family whitelist.

## Publication / LIVE

Source checkpoint `6452f98`; canonical CheckOnly passed, then `tools/deploy_tilda_test.ps1 -Publish` built/validated the exact candidate, staged TEST artifacts only, committed `7a60531`, pushed main and synchronized the TEST S3 mirror. GitHub Pages run `37645787431` completed successfully. No guard bypass.

- App: `2.15.33-1a9ac1a0018c`, SHA-256 `1a9ac1a0018c20ebf585a64bf5c627110565328e8dff7dcb6d24ed6401a50519`.
- Runtime: `snake-next-480660bcb2d8`, manifest SHA-256 `d549dce95f217fc97d84466df07430a97c9b04f912372cf98de77cb2ea231ff5`.
- Rollback preserved: published V4.2 `2.15.33-148eb3c56595` / `snake-next-7cb676c44096`, not an intermediate local candidate.
- Both GitHub Pages and S3 return the correct current/previous identities. All 474 current dependencies plus runtime manifest and app match local SHA-256/size; MIME checks pass. Previous V4.2 app and runtime manifest bytes also match their original SHA-256/size on BOTH origins. First GitHub sweep received two transient HTTP 503s (neck-3-v6 PNG/material.js); complete repeat passed with zero errors. These were reported, not ignored.
- External canonical `test_live_deployment.js test`: PASS, TEST version 2.15.33, 1904 participants, 53 S3 resources, zero page errors/broken visible images.
- Fresh Edge contexts, NO candidate routing/resource overrides: 1920×1080 **258**, 1366×768 **260**, 1280×720 **260**, mobile 844×390 **249** checks PASS (**1027 total**). Verified exact published runtime URL, embedded/fullscreen Ranking and Guide safe bounds, row 10 reachability, only list scrolling, Training → Pause → confirmation/cancel → Settings → Result, mobile D-pad, fullscreen layout, host switching and Fly Training/Pause/Result smoke. No Fly ranked RPCs, new console/page errors or failed asset responses. The existing anonymous `/auth/v1/health` 401 remains baseline, NOT a new Snake error.
- LIVE screenshots visually reviewed: Main embedded/fullscreen, Result, Ranking desktop/mobile and mobile Guide. Result heading has independent contrast; Ranking crest/footer/Back stay visible. Preview scores/leaderboards are explicitly demonstration data, not production ranked results.
- Review page: **87 images decoded, zero broken**, including expanded native comparisons, baseline ×4, seams ×8 and LIVE evidence.
- Protected-source audit rerun after publication: **1022 tracked files unchanged** against `b624986`; Production manifest/releases, Fly source, gameplay, geometry, attempts/sponsor/backend and old art unchanged. Backend remains unapplied; no database operations.

Reproduce LIVE UI checks with `playwright-cli -s=snakev43 run-code --filename=docs/qa/snake-ui-v4-3/live-qa.js` while the local read-only preview server is running on port 8776. Byte audit: `node docs/qa/snake-ui-v4/live-byte-audit.cjs`. Machine-readable summary: [results.json](results.json).

**Technical/local and publication gates: PASS. Human visual approval: PENDING. STOP FOR HUMAN VISUAL REVIEW.**
