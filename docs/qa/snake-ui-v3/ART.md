# Authored UI architecture and provenance

## Structural PNGs

`grib/mushroom-snake-ui-v3/` contains 54 PNGs plus exact file/size/SHA inventory. Offline authoring uses approved production wood/frame/button material, NOT reference-concept image crops. Source family remains unchanged.

True panels: four native48px corners, plain top/bottom/left/right edges and tileable wood center. Edge regions exclude decorative crest. State-specific independent96×50 ornaments: calm emerald Pause, burgundy Confirmation, Settings, Guide, Result and Tournament. Crest alpha receives offline contour cleanup; no runtime artwork primitives.

Buttons: separate PNG left/right caps and plain repeating centers (play/wood/danger), plus independent Play jewel. CSS sets content-driven width and uniform cap scale. No ornamental end stretches. Circular control bezel is48px. Close stays48px even inside confirmation CSS.

## Icon inventory

Native transparent48×48: Settings, Guide, Sound On, Sound Off, Fullscreen, Exit Fullscreen, Close, Back, Home, Restart, Share, Trophy, Rank, Normal Attempt, Sponsor, Leaderboard, Music, SFX, Keys, Combo. Supplemental64px Guide/Settings/Trophy/Leaderboard. Gold/moss/ivory palette; no SVG, font glyph or CSS art. Sheets show1×/2×/4× against forest/wood/emerald.

## Generated illustrations

Built-in ImageGen authored the enchanted forest card (export1024×640) and transparent ivory/red-mushroom/moss result hero (512×336). References supplied approved Snake identity, not runtime geometry or source crops. Prompts sought a readable adventure forest, warm lanterns/red mushrooms and same friendly face; result requested clean curled Snake with real transparency and no text. No Fly art copied.

Original generated files preserved outside repo:

- `exec-8c304f40-f618-4c50-890a-59147a9f208d.png` (cover)
- `exec-1ef16c92-7563-4a2b-a779-db0bb89bf905.png` (result)

under the task's Codex `generated_images/01a08321-eab4-7933-939d-19e5a820a209/` directory. `export-generated.py` performs aspect-preserving safe crop/nearest export and updates inventory. Existing Snake menu background/logo/hero remain approved source assets.

## Composition

Main: dedicated wood attempts plaque, separate wider trophy/rank plaque, proportional400px Play at1080p. Constrained embedded/mobile layout hides nonessential hero and inline TOP10 rather than shrinking desktop composition. Rating remains a dedicated action.

Pause:560px calm panel;360px Continue; two secondary controls plus centered Main. Confirmation: own short burgundy composition and danger action. Settings:680px. Guide:860px. Result:1260px at1920 (65.6% viewport), large score/hero/stats and bounded380px action, never700–900px stretched button. Tournament: independently ornamented structural board.

Lower cabinet rail is a read-only render wrapper, no new RAF/timer, no changes to world/camera geometry. It displays biome/world/free/speed only when fullscreen surplus>32px. PNG center bridge uses measured native bottom-strip inset, preserves corner art.

New stylesheet replaces loading old layered product/parity CSS; old files retained for reference. Product-only iframe viewport override removes inherited embedded height cap; standalone Forest Training remains unchanged.
