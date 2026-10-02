# Approved Retro V2 — independent production raster kit

Local human-review candidate, 2026-10-02. No gameplay integration or deployment.

Inventory: `inventory.json` is authoritative for filenames, dimensions, connection ports, source provenance, UI slices and VFX frames. 62 production PNGs; an optional 48² corner ornament is not loaded by the proof. The small 256² master in `sources/` is manufacturing input, never a runtime texture.

## Families

| Family | Count | Raster sizes | Contract |
|---|---:|---|---|
| Snake | 28 | 36² | 32-unit cell, 2-unit overhang on each side, opaque ports |
| Arena | 5 | four 32² variants + 256² atlas | calm emerald grid; authored deterministic 8×8 macro |
| Frame | 7 | four 64² corners, 128×32 / 32×128 edges, optional 48² ornament | fixed corners, repeated axis-only rails, no whole-frame stretching |
| Objects | 5 | 64² with 3px padding | seed / winged crest / spiked hazard / hollow portal / stone |
| HUD | 8 | 32² panel, 16² inner fill, six 24² icons | panel is 9-slice, slice=8; no text or numbers baked |
| D-pad | 8 | 40² | up/right/down/left × normal/pressed |
| VFX | 1 | 256×128 | eight rows × eight 32×16 frames, 320ms per sequence |

Names use `snake-{part}-{direction/connection}`, `arena-floor-{variant}`, `frame-{part}`, `icon-{role}`, `dpad-{direction}-{state}`. VFX rows are recorded in the inventory; final implementation must schedule these bounded sequences, not enlarge them into halos or fullscreen flashes.

## Snake assembly

- Source tile origin is **(-2,-2)** relative to its 32-unit occupied cell. Draw size is 36/32 of the cell, using one shared world transform for every part.
- Straight/corner/head ports have diameter 20; taper output and tail input have diameter 14. All connecting pixels are fully opaque. Terminal cells contain the tail sprite only.
- Taper replaces the penultimate body tile. Straight taper is rotated 180° for the reverse direction. Eight taper-corner choices support either traversal of all four corners immediately before the tail.
- Separate neck sprite is deliberately unnecessary: each head includes a matching diameter-20 rear connector.
- Two restrained leaf-mark variants exist for each straight axis. Choose them with `hash(stableSegmentId)`, never by position, frame, or fixed interval. An actual runtime must retain that ID when moving/growing; this proof demonstrates translation invariance without implementing mechanics.
- Compact red mushroom belongs to the head/neck identity; no mushroom stamps on the body. There is no separate moving shadow layer: dark silhouette edge provides grounding.
- Do not introduce interpolation, independently shifted head/tail offsets or an underlying terminal body stamp.

## Frame / controls

The NEW generated production frame master was normalized to 256² and manufactured into its own slices. This is not a crop of any review screenshot. The proof uses 96px uniform corner footprints on desktop and 48px on mobile. The corners retain aspect ratio; edges repeat only along their long axis, with bottom/right rails mirrored inward. Frame safe inset is 30/64 of the corner footprint, under the inner bevel.

Visible D-pad sprite boxes are 34×34 CSS px, with a compact ~106×106 visual footprint (approximately 10–15% below the approved mobile control composition). Each transparent circular hit area has 44×44 bounds; the complete hit-area bounding rectangle is 116². It stays inside the arena safe edge. `noSpawn` protects the hit-area rectangle plus object extent/margin. It is a **proof predicate**, not a modification of the existing game spawner. Full production integration must apply the same rejection to food, pickup, hazard and portal candidates.

## Manufacture and provenance

`node arcade/snake-next/retro-kit/build-assets.cjs` rebuilds the manual geometry, floor, UI/control/VFX art and frame slices deterministically, retaining the normalized independent ImageGen objects and their source SHA-256. Runtime PNGs are compact; there are no oversized source images in this kit.

Objects and frame art were independently generated with the built-in ImageGen tool. The reference was used **only for style**, never cropped/traced/extracted. Original generated masters remain in Codex generated-images; only the small normalized production inputs are used here. Alpha-threshold / nearest-neighbor raster manufacture removes low-alpha halos and keeps crisp sprites. Prompt set: `prompts.md`.

## Stop gate

This is a raster asset kit and isolated static browser renderer proof, not a playable replacement, not new mechanics, and not Phase 3B. The approved reference remains the art target; matching its final perceived quality needs human review. Legacy Snake, Snake Next simulation/grid/collision, Fly, Hub, ranked, backend and both manifests are unchanged. TEST / Production were not published.
