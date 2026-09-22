# Local competitive core

## Rules and boundaries

- `arcade/snake-rules.js`: three active biome records, difficulty, scoring and event tuning. The registry has no fixed world-count limit; adding future biomes requires production art and a complete record, not placeholder worlds.
- `arcade/snake-world.js`: seed/coordinate-only immutable terrain, 16×16 chunks, 5×5 streaming window. Rendering caches only visible chunks. No ranked service or attempt accounting.
- `snake-core.js`: existing cardinal movement/effects with run progression and ten preallocated pickup slots (three normal foods, one special, six event foods). Snake character geometry/input/lifecycle remain unchanged.

Difficulty is a weighted saturating curve of score (25%), length (20%), steps (30%) and lifetime (25%). The value slews at most 0.00004 per simulation tick. Base speed approaches 12 cells/s from 7.5; existing slow effects still apply.

Terrain difficulty deliberately depends on **world distance**, biome and pre-generated grove regions, not mutable run score. This preserves collision after eviction/revisit and never creates obstacles under a player. Coordinate-hashed local-minimum anchors are at least four cells apart; each island fits in 2×2, leaving at least two free cells between islands. Density increases by extending isolated objects into small compositions, not by making a maze. This guarantees connected terrain, not immunity from trapping oneself with one's own tail.

Food placement uses bounded cardinal BFS around the real occupied body. Ordinary food remains within five Manhattan cells of the head. Specials require two open exits and avoid the five cells directly ahead. Failed placement waits instead of forcing an unsafe spawn.

Food starts at 100 points. Combo count caps at 20; reward is `min(5, 1 + 0.2*(combo-1))`. Window decreases smoothly from 12 to 8 seconds; difficulty adds up to 35%, Golden Harvest doubles food reward. Travel adds one point per eight steps and survival one per eight seconds. Milestone flashes occur only on crossing 5/10/20, not repeatedly at the cap.

Events never overlap: Spore Bloom (six food targets, ×1.5), Fairy Trail (up to six adjacent safe cells, ×1.25), Dense Grove (×1.4 food reward inside an already generated dense region). First opportunity is after 75 seconds, then 90–120 seconds after expiry. Grove opportunities may wait up to 45 seconds for an appropriate region. Event food expires after 18 seconds; no new collision is spawned.

## Presentation and art

Forest art is retained. Cave and Swamp each add a seamless ground and a transparent 3×2 production atlas (three obstacles, three decor variants). These were generated from scratch with ImageGen, not cut from concept art. Corrected atlases were visually inspected and their alpha/cell bounds checked before integration.

Asset prompts: calm blue-slate crystal floor; olive peat/puddle floor; isolated cave rocks/mushrooms/crystals and small luminous plants; isolated swamp stumps/mushrooms/boulders and reeds/lilies. Runtime atlas copies are 384×256; ground patterns are 416×416. Masters remain in `grib/mushroom-snake-v2/`.

Biomes use warped radial bands, 40-cell ground blending and seeded mixed object sets. Ground UVs are world-aligned, independent of chunks. Tiny ambient pixels use biome palettes. Existing ambience is reused with smoothly adjusted playback rate (Forest 1, Cave 0.78, Swamp 0.9); no new mixer/audio owner. Short biome/event notices and the combo timer reuse the compact HUD styling.

## Verification

```powershell
node arcade/test-snake-core.cjs
node arcade/test-snake-forest.cjs
node arcade/test-snake-endless.cjs
node arcade/assemble-snake-v2.cjs
node arcade/serve-snake-local.cjs
# Separate terminal; local-only preview, no publish:
playwright-cli -s=competitive open http://127.0.0.1:8827 --browser=msedge
playwright-cli -s=competitive run-code --filename=arcade/qa-snake-endless.js --raw
```

The preview uses `RYTNI_SOURCE_ROOT` for the existing Fly host/audio owner. The CLI QA script writes screenshots under the sibling source workspace's `artifacts/arcade-snake-competitive/`. The accelerated test navigates real obstacles/body through an hour of simulation and checks initial lengths 8/28/100/250/500/1200. It deliberately routes around optional special pickups; effect behavior has separate core regression tests. No claim of physical-device QA is implied by mobile emulation.
