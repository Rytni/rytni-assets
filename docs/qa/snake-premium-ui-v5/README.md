# Mushroom Snake — Premium UI V5 · STATIC ART ONLY

Reference checkpoint: `4f944c5` (published TEST UI V4.3). **V4.3 is NOT visually approved; UI is NOT locked. V5 human art approval is PENDING.**

[Review](review.html) defaults to native 1×. The review document may scroll to compare images; each individual proposed Result is a complete fixed-size image, NOT a scrollable modal. [Single-frame viewer](scene.html?name=result-premium-desktop) contains one raster image and no game runtime.

## Authored-source inventory

Built-in `image_gen` was used, not the CLI/API fallback. Exact prompt set: [PROMPTS.json](PROMPTS.json).

- `sources/icons-atlas.png`: newly authored transparent 4×3 atlas. Twelve isolated premium dimensional objects, NOT vector line drawings. `masters/{guide,ranking,settings,sound-on,fullscreen,back,close,home,restart,share,sound-off,exit-fullscreen}.png` are center-padded **256×256 RGBA concept masters**; art occupies at most 224 px. No large control frame baked into icon masters. Runtime-size previews use a separate consistent physical backing.
- `sources/physical-objects.png`: newly authored plaque/medallion/TOP-3/control/stat-object study. Eight derived concept PNG objects in `masters/`: attempts, record-rank, top-three, ranking-board, control, stat-food, stat-length, stat-combo. First ranking study had redundant pills/circles; it was revised, not accepted as final.
- `sources/ranking-source.png`: revised slim dark-metal/brass/glass scoreboard, replacing the original slot-filled ranking study. No per-row cards/discs or big crest. Dark-neutral pixels are alpha-composited offline for translucent glass, preserving brass/enamel. Generated originals are retained unchanged.
- `sources/materials-source.png`: coherent brass/enamel/smoked glass/resin/wood/parchment material source board. Six `masters/material-*.png` crops; [materials.png](materials.png) includes six real **128×96 px** application-size samples plus larger material views.
- `author.py`: authorized offline raster authoring/composition. Only reads existing art; only writes into THIS diagnostic folder. It does not import or alter product JS/CSS/HTML. Uses source atlas crops, preserved alpha, anti-aliased raster scaling, exact separate Cyrillic typesetting and local smooth-alpha smoke overlays. No forest blur, no CSS-generated premium art.
- `main-premium-desktop.png` **1920×1080**, `main-premium-1366.png` **1366×768**.
- `result-premium-desktop.png` **1920×1080**, `result-premium-1366.png` **1366×768**, `result-premium-mobile.png` **844×390**. Mobile is a dedicated arrangement, not a desktop resize. All result content fits inside these single images.
- `ranking-premium.png` **1920×1080**.
- `icons-concept.png` **1536×1410**: all twelve masters with actual 64 px / 48 px previews on the intended Forest and physical control surface.
- `asset-inventory.json`: exact dimensions, alpha modes, byte sizes and SHA-256 for every authored PNG; also lists reused existing source paths.
- `composition-metrics.json`: recorded component rectangles and native canvas dimensions. Bound checks are mechanical fit evidence, NOT an automatic art-approval claim.

Reused EXISTING OWN source art, never screenshot extraction: menu forest, original hero, Snake logo, Play/wood caps+center, mushroom attempt and sponsor-gift tokens. Full paths are enumerated in `asset-inventory.json`. No existing source asset is overwritten. Current V4.3 images in review are reference-only links to the earlier diagnostic folder.

## Art-direction self-check

- Icons now have volume, painted material, specular edges and object silhouettes. All are inspected at master/64/48 px. No foliage-wrapped controls or deliberately pixelated UI. Home has small environmental details intrinsic to the physical cabin, not a decorative border.
- Main uses discrete small physical status objects; no shared large green/brown pane. Background remains visible between identity, actions, controls and scoreboard. Existing bright ornate Play button retained.
- Result uses the full forest, large original hero, score **215**, and separate mushroom **2**, length **10**, combo **×2** trophy objects. No single stats card, no modal frame, no scroll. Typography and localized smoke isolate important content.
- Ranking is a real material object with depth/translucency, TOP-3, all places 4–10, current player and Back; it is not a solid emerald fill. The complete scoreboard is intentionally a larger object because the list needs a surface. It does not replace Main's smaller TOP-3.
- Material vocabulary is limited to the six requested families; no per-component new fantasy material.
- The concepts are ready for human art review, **NOT approved commercial artwork** and NOT production-ready extracted assets.

## Safety / verification

No product HTML, CSS, runtime JS, gameplay, backend, SQL, Fly, release, manifest or deployment changes. No TEST publication, no push, no database/network gameplay calls. Final checkpoint contains only `docs/qa/snake-premium-ui-v5/`.

Mechanical checks: twelve transparent 256×256 masters; all recorded components inside native canvas bounds; requested native outputs present. Browser verification concerns ONLY this local static review and its single-frame viewer, not game QA. Human visual approval is required before any implementation.

Targeted local Playwright CLI verification passed: all **11 review images** decoded, native 1× is the default, fit/native switch works. Six single-frame views (Main desktop/1366, Result desktop/1366/mobile, Ranking) have raster dimensions equal to their intended viewport and **zero document overflow**; zero iframe/canvas game execution. No page errors, failed resources or remote requests. This is static-image integrity/fit, not a claim that production Result behavior was fixed.

Manually reviewed all eight proposed PNG compositions at native size, including the 48/64 px icon previews and the full 1366/mobile Result. Internal revision removed the first Ranking study's slot/pill decorations and improved small Main status-label sizing. Artwork is submitted for approval, not marked locked.

**STOP FOR HUMAN ART APPROVAL.**
