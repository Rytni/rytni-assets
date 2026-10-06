# V4.1 art / exact provenance

New runtime family: `grib/mushroom-snake-ui-v4-1/`. Inventory contains18 PNGs and SHA-256/dimensions. Existing V4 key art, icons, fixed corners/caps and all gameplay/effect art remain byte-identical.

## Book

Built-in ImageGen generated `exec-fda7a9a6-6132-470f-9443-fc9bffed0b3f.png`; working master remains under the task's Codex generated_images directory. `export-assets.py` records exact export coordinates. Runtime gets nine page pieces (`tl/tr/bl/br`, four edges, paper) plus independent spine; it NEVER stretches the complete book master. Right page skin is mirrored exactly; text is not mirrored. Botanical corners preserve aspect.

Exact generation prompt:

> Use case: stylized-concept. Asset type: production pixel-art OPEN FOREST FIELD GUIDE interior, a reusable UI skin. Generate a straight-on, orthographic flat open book on genuinely transparent background, wide landscape 3:2. Two warm ivory parchment pages, narrow dark brown center binding/gutter. Clean rectangular page surfaces with gold-green edge accents, restrained ink botanical/mushroom corner sketches ONLY in the four outer corners. At least 85 percent of each page is BLANK, lightly textured ivory paper for dark brown runtime text and existing illustrated Snake/pickups. Pixel-art aesthetic with deliberate crisp pixel clusters, low-noise texture, commercial retro fantasy UI, no blurry painting. No words, no letters, no numerals, no characters, no UI controls, no cursor/browser toolbar, no text boxes, no tabs, no ornaments in the middle of the writing areas. Keep all page corners and binding inside the canvas. Output just blank open book interior; external wood/moss/gold frame and all text are separate runtime components. This source will be offline cut into true nine-slice page/corner assets and a separate spine, not stretched as a complete panel. No Mushroom Fly art.

New native PNGs also include keyboard/D-pad illustrations,64px gold/silver/bronze medals and a rank medallion. Approved64px positive/negative pickup art is reused unchanged in the guide. Typography is dark brown on light parchment. Bookmarks are UI controls, not green cards.

## Attempt residue

V4 `icons/attempt-48.png` contains two disconnected opaque components:953-pixel mushroom/moss and17-pixel extraneous stroke at inclusive source bounds `(4,26)–(5,39)`. It came through the fixed-cell atlas export; alpha occupancy/aspect QA did not reject disconnected residue. Not a runtime9-slice border or scaling issue.

V4.1 sibling removes ONLY those17 pixels. All953 retained pixels,48×48 canvas and anchor are identical. Existing V4 asset is preserved for before/after. Final composite token captures at DPR1/1.5/2 and×8 are in this report, as are source×8 crops and `raster-metrics.json`.

## Fly — no generation, crop or retouch

| Role | Path / URL | SHA-256 |
| --- | --- | --- |
| Historical known-good source | `grib/mushroom-snake-v1/fly-card.png`, commit `e4b203c` | `66bb95fb7bdd815770a1a4a36fbb718f4cef5e3474ae76e86f247c706580e7df` |
| Current old TEST asset inspected | `https://storage-1090.s3hoster.by/rytnistatictest/grib/mushroom-snake-v1/fly-card.png` (GitHub origin also inspected) | same hash |
| Restored/pinned TEST copy | `grib/mushroom-snake-ui-v4-1/fly-cover.png`, snapshotted inside immutable runtime | same hash |

Important: the reported toolbar-corrupted raster was NOT reproduced. The fresh BEFORE selector and both original CDN files were already clean and identical to the historical known-good source. No fabricated “corrupted hash”. We pin the exact known-good bytes into TEST's immutable closure so stale/mixed unversioned artwork cannot enter this card. Fly game code/production asset remain untouched; Snake cover remains exactly V4.
