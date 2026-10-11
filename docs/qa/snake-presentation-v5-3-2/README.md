# Premium V5.3.2 — presentation / shared TEST host

Base `e750631`, published V5.3.1 release `2.15.33-c77364482deb`, runtime `snake-next-3efbc8cbe51b`.

Final candidate: `2.15.33-e56b72a011df` / `snake-next-78436309631c`. Publication evidence is recorded separately in PUBLIC.md after both mirrors and LIVE QA pass.

[Visual review](review.html) · [Authored Arcade concepts, inventory and prompts](../arcade-premium-v2/README.md)

## Exact causes / changes

- **Settings crossover:** `ui.js` always emitted Sound, Visual Effects and Fullscreen; only a collapsed `<details>` block was conditional on Sound. Desktop now selects one complete sound or game subtree. Three ranges appear immediately; existing `data-setting`, real values, persistence and mixer handler are reused. Mobile's already-correct semantics remain unchanged. A compact height-specific grid keeps all three 44px ranges in view without moving/resizing the frame.
- **Icon safe area:** `material-glass.png` contains its own visible inner bevel, farther inward than the old strip DOM box. Explicit stack inset and fixed icon/text/control grid replace the insufficient inset. No negative margins or translation hacks. Raster-traced source aperture is transformed through the actual center/cover crop; a conservative bound across the whole icon is measured. Red diagnostic = inner metal, cyan = icon box. Minimum desktop 26.3px; mobile 29px. The earlier exploratory strongest-contrast scan was rejected because it selected the outer rail instead of the inner bevel.
- **Result artifact:** the settled live metrics wrapper and children are transparent, with no backing pseudo-element. Isolation capture `result-no-png.png` removes the unwanted plates, proving they are baked into the bottoms of `stat-food.png`, `stat-length.png`, `stat-combo.png`. Clip only their old number plaques: lower 20%, 17%, 20% respectively. Complete trophies/bronze pedestals and readable text shadows remain. Approved PNG source bytes and `premium.js` are unchanged. No hero, scene, score or routing redesign.
- **Main duplicate:** remove only `mainRanking()`'s `.board-own` record/rank paragraph. Player Status Board remains authoritative; full Ranking retains its own summary.
- **Arcade:** two independent authored PNG backgrounds, translucent navy cards, equal card/cover height and CTA alignment. Original Fly cover and `object-fit:cover` retained. [Art-first gate](../arcade-premium-v2/README.md).
- **Fly header/footer:** Fly and Snake call the exact same `playerHeader()` component and `refreshPlayer()` data source, using currentApplication and profileAvatar. Refresh targets both mounted headers. Unknown values remain hidden; participant_number is not interpreted as rank. Old outer game-name bar removed. Technical accounting note hidden only by the TEST host's scoped selector; Fly source/gameplay remains byte-identical. LIVE review exposed the parent popup close-button covering the portrait TEST badge; the shared header now reserves a 48px right inset, giving 16px measured clearance from that button for both 390/412 widths. No input/fullscreen/mobile game layout change.

## Responsive QA

| Flow | Matrix | Result |
|---|---|---|
| Settings both tabs | 1920×1080, 1366×768, 720×405 real embedded-size equivalent | PASS: no crossover; three fully visible 44px ranges; safe icon inset |
| Settings both tabs | 390×844, 412×915 touch/portrait | PASS: no crossover, no clipped icon, 29px inner-frame clearance |
| Result / Main | 1920×1080, 1366×768, 844×390 | PASS: trophy plates removed; scene retained; no Main own-summary duplicate |
| Actual TEST host candidate | desktop 1920/1366; mobile 390/412 + landscape 844/915 | PASS: both games, shared header, no visible technical note/old label; chooser asset identity, equal cards, cover mode |
| New errors / assets | local 21 checks + candidate host 26 checks | 0 new console/page errors, 0 failed relevant assets; existing anonymous auth-health 401 recorded separately |

32 targeted UI/controller/host tests PASS; 12 immutable package tests PASS. Package fixtures caught an initial over-broad host dependency inclusion; implementation was narrowed to the bounded `arcade-v2` family, retaining standalone fixture compatibility and not importing Fly runtime. One old sponsor UI assertion expected a retired pre-status-board caption; updated to approved board counter and Play routing, without changing accounting.

Commands:

```text
node docs/qa/snake-presentation-v5-3-2/run.cjs local
node docs/qa/snake-presentation-v5-3-2/run.cjs host
node --test arcade/snake-next/product/ui.test.mjs arcade/snake-next/product/ui-v5-3-2.test.mjs arcade/snake-next/product/ui-v5-3-1.test.mjs arcade/snake-next/product/ui-v5.test.mjs arcade/snake-next/product/controller.test.mjs arcade/snake-next/product/host-bridge.test.mjs
node arcade/test-snake-next-package.cjs
node docs/qa/snake-presentation-v5-3-2/closure.cjs
tools/test_tilda_test.ps1
```

## Protected closure / scope

Only six runtime files differ from the published base: two backdrop PNGs, their inventory, product index, ui.js, new presentation CSS. No removed runtime file. `closure.json` verifies all other runtime bytes unchanged, including simulation, movement geometry, FIT WORLD, input-owner, clock-driver, pause diagnostics, bridge, frame runtime, controller, backend, mobile semantic renderer, D-pad, approved artwork and Fly source.

Production manifest SHA256 remains `0c1de483bc275877e9c76b3ddcc187df1cf1eb9a42eb215fbea18d404d9a4591`. No SQL/backend mutations. No physical Android-input claims.

Anonymous public QA intentionally has no fabricated participant avatar/name/level/points. Actual authenticated participant content needs the human's existing login for visual review. Current Fly's own narrow 720px embedded title/stat crowding is pre-existing, outside this host-header/footer pass, and not redesigned. Portrait popup vertical scrolling/site footer are existing host behavior, not horizontal overflow; screenshots retain the actual host, not a fabricated account or standalone replacement.

## Exact source edits

`arcade/assemble-snake-next.cjs`, `arcade/test-snake-next-package.cjs`, `arcade/snake-next/test-host.html`, `arcade/snake-next/product/ui.js`, `index.html`, new `ui-v5-3-2.css`, new `ui-v5-3-2.test.mjs`, `ui.test.mjs`; new `grib/arcade-v2/{arcade-backdrop-desktop.png,arcade-backdrop-mobile.png,inventory.json}`. New evidence/docs in this folder and `docs/qa/arcade-premium-v2/`. Generated TEST manifest and immutable release/runtime closure only; old immutable releases are not edited.
