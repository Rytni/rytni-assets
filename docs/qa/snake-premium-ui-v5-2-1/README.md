# Premium V5.2.1 — bounded status dock / Result backing / Settings inset

Base: `23f2de3`, published V5.2 `2.15.33-bc52be687115` / `snake-next-8d3f1e254a4b`. No rollback. Human-approved Premium V5 art is unchanged.

## Exact causes and changes

1. Main used `display:contents` for `.main-info`; attempts and medallions independently anchored against the scene. At 1118px, attempt heading slots were 94.50/94.52px, but their ink required 94.80/96.03px. The long score plate was 90.97px in an 83.84px record cell, spilling 7.13px into adjacent space. At the actual 720px TEST aperture, a 90.97px plate occupied a 72px cell; previous QA checked the text against its overflowing plate, not its owner. New `.lower-status-dock` owns the attempts plus the nested record/place grid. Scene-container breakpoints at 1200/800px reserve readable cells; no viewport query, full-scene scale or separate fullscreen sizing logic. The spacious grid reproduces old anchors. A plate's padding/border are subtracted before measuring its font, and the plate stays inside its allocated cell, anchored at the bottom.
2. Result's authored stat PNGs already contain glass number plaques. `ui-v5.css` additionally gave each `b` a semi-opaque dark rectangle; V5.1 made its line height 1.25, so it extended below the authored plinth. `ui-v5-1.css` also applied a radial dark scrim to the 50.46%-scene-wide result status (968.83px at 1920). The group itself has no background, clip, skew or pseudo backing. Remove only the `b` background and status gradient/padding; retain restrained text shadow, the full-scene lighting, hero, stat PNGs, buttons and no-scroll composition.
3. Settings measured old icon inset from the panel/48px strip box. The opaque `material-glass.png` includes another metal rail: its visible inner contour is around source x30–32, farther in (~60 CSS px under cover) than that strip box. Old first substantial icon ink crosses it by ~5px desktop / ~13px compact. Only `.settings-stack` gains left padding 19px desktop / 27px compact. Icon canvas now starts at panel+71px; icon alpha padding contributes ~3px. Panels, headings, tabs, right controls, icon dimensions and row gaps are untouched. Conservative x32 contour QA gives 13.57–14.26px visible clearance. The contour is manually inspected art ownership, not an automatic opaque-alpha assertion (the glass interior is opaque too).

## Targeted evidence

Five scores × five ranks × six actual scene sizes: 150 value checks plus six Result backing checks, zero failures or asset/page errors. Values never shrink below 16px. Requested scores 6840 / 99999 / 999999 / 1000000 / 99999999; ranks 7 / 99 / 999 / 3000 / 9999.

| Scene | Dock width | Score cell | Long value box | Bottom safety |
|---|---:|---:|---:|---:|
| 1118×629 reproduction | 491.91 | 106.64 | 90.97 | 10 |
| 720×405 actual embedded | 430 | 93.78 | 90.97 | 10 |
| 1920×1080 fullscreen | 719.80 | 144 | 91.22 (no plate) | 57.00 |
| 1366×768 fullscreen | 512.11 | 102.45 | 100.09 | 40.53 |
| 1280×720 fullscreen | 479.86 | 96 | 90.97 | 38.00 |
| 844×390 mobile | 440 | 95.11 | 90.97 | 10 |

All dimensions CSS px; exact data in `after.json`. Separate bounded record/place cells; no overlaps, and every component retains ≥8px scene safety. Fullscreen 1920 normal max child-box delta 0.0312px; raster outside the dock is byte-identical. Current art byte-identity tests also pass.

Native BEFORE/AFTER, actual TEST host, stress, dock rectangles, Result details and Settings contour overlays: [review.html](review.html). Mobile includes normal/stress plus the third Settings row reached by its existing intentional scroll. Browser emulation is not a claim of human smartphone approval.

## Verification and publication

- `node --test arcade/snake-next/product/ui-v5-2-1.test.mjs arcade/snake-next/product/ui-v5-2.test.mjs arcade/snake-next/product/ui-v5-1.test.mjs arcade/snake-next/product/ui-v5.test.mjs arcade/snake-next/product/controller.test.mjs`: 26/26.
- `node docs/qa/snake-premium-ui-v5-2-1/run.cjs before|after`: native repro, font-ready score/rank matrix, Result and Settings.
- `python docs/qa/snake-premium-ui-v5-2-1/raster-review.py`: QA crops/overlays only; never edits assets.
- `... run.cjs host`: fresh actual TEST host with exact local immutable candidate routing, embedded + native fullscreen 1920/1366/1280/844, normal + stress, Settings entry/return and Arcade return.
- Host: 20/20 checks. `... run.cjs live`: 22/22 checks in fresh published contexts, no source route replacement. Includes real Training → Pause → Resume → canonical wall collision → Result at 1920/1366, with transparent stat/status backgrounds and no scroll. No ranked RPC or presentation result injection. Existing site `/auth/v1/health` 401 is recorded separately; zero new Snake console/page/network failures.
- Canonical build → bundle validator → CheckOnly → Publish; rollback remains the genuinely published V5.2.

Published TEST: `2.15.33-e21b593b2116`, runtime `snake-next-4542e6f6ae7d`. Pages and S3 agree on manifest, app size/hash, runtime hash and all three changed modules (`public.json`). Rollback: `2.15.33-bc52be687115`. Source checkpoint `948b47f`; publication checkpoint `0648425`. Production is forbidden and unchanged. No backend, Fly, DEV effect candidate, gameplay, Smooth V4, art or sound edits.

LIVE screenshots: [embedded stress](live-1366-embedded-stress.png), [desktop fullscreen](live-1920-fullscreen-normal.png), [mobile fullscreen stress](live-844-fullscreen-stress.png), [actual Training Result](live-1920-result.png). [Fresh-context LIVE measurements](live.json).

`closure.json`: the immutable dependency set is unchanged (506 dependencies + runtime descriptor). Exactly three files differ from V5.2: `ui.js`, `ui-v5-2.css`, `record-place-value.js`. All assets, effect appearance, simulation, game geometry and Fly source remain byte-identical. Production manifest SHA-256: `0c1de483bc275877e9c76b3ddcc187df1cf1eb9a42eb215fbea18d404d9a4591`.

STOP for human visual review after LIVE verification.
