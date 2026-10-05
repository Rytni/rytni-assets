# Effect clarity / Playground — DEV human review

Approved base: `85a1702`. No publication or production build.

- Playable: http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html#effect-playground
- Sprite/silhouette/runtime/animated grammar/HUD review: http://127.0.0.1:8775/arcade/snake-next/effect-playground/review.html

Start Forest, then use HARVEST / FOCUS / SPORES / GUARD / PORTAL+ / RUSH /
CORRUPTION / ROOTS / MIST. CLEAR EFFECTS resets effect presentation and temporary
hazards. Controls live only in the isolated Lab. Natural collection still obeys
2 positives + 1 negative; DEV buttons replace the oldest matching-category slot
when full. PORTAL+ also opens an existing DEV opportunity immediately for review;
it does not change the natural portal schedule or tunnel traversal architecture.

## Exact DEV rules

| Effect | Duration / charge | Mechanic | Visible feedback channels |
| --- | --- | --- | --- |
| Golden Harvest | 16 s | Existing mushroom ×2 formula; every third mushroom **within this window** has stronger burst | Golden food + gold particles/pop; named HUD slot/banner; upward chime |
| Focus | 15 s | Base cadence ×1.22, rounded to whole ticks (~18% slower, cadence-dependent quantization); freezes combo drain | Cyan front aura; cyan combo pulse + named HUD; chime |
| Spore Bloom | 15 s | A mushroom emits 2–3 optional motes, up to 6 alive; legal reachable placement within 5 Manhattan cells; 5.5 s lifetime; within 1.8 cells and terrain distance ≤2, 18-tick magnetic approach; +25 × biome, once | Luminous cross-shaped collectible/halo + curved approach/pop; tutorial + named HUD; chime |
| Guard | 1 charge; hard expiry 35 s or actual biome change | Existing one environmental-impact absorption; no self protection; no movement through blocker; 5 canonical ticks (~83 ms) **presentation-only** front/body hold | Moss head ring/shield; named charge HUD; crack burst/cue |
| Portal Surge | 1 charge; hard expiry 40 s | +300 × biome, combo +2 capped at 8, combo refreshed on successful **head** traversal; consumed once, not again at tail completion | Charged inner portal ring; trail through the canonical tunnel; reward pop + named charge HUD + cue |
| Rush | 10 s | Existing cadence ×.8 (rounded, minimum 5 ticks); no hidden score reward | Red/orange route pixels + edge streaks; pulsing negative HUD; low descending cue |
| Corruption | 12 s | Mushroom score ×.6 | Purple/dark mushroom + reduced-value pop/particles; ПОРЧА / ОЧКИ −40% HUD/banner; low cue |
| Root Surge | 8 s | Existing safe 2 s warning, up to 2 legal/revalidated hazards; remaining 6 s solid; existing 20 s warning cooldown | Cracks → clipped growing root sprite → solid roots → decay particles; negative HUD/banner + low cue |
| Mist | 10 s | Long-range visibility loss only; no collision change. A hard 4.5-cell clear disk follows the authoritative interpolated head | Layered pixel cloud puffs drifting from all four edges; distant food/portals remain lit; named HUD/banner + low cue |

Harvest + Corruption stack multiplicatively (×2 ×.6). The corrupted silhouette
takes priority, including purple particles; both named HUD slots communicate the stack.
Guard does **not** expire merely on Forest expansion. Anchor and Combo−/Decay
remain implemented but never enter the natural candidate pool.

Learning pools: Forest Harvest / Focus / Guard / Rush; Caves adds Spore Bloom /
Portal Surge; Swamp adds Corruption / Root Surge / Mist; later chapters retain
these. The existing DEV candidates switch can still disable the added candidates.

## Art and feedback

Nine original transparent 56×56 native sprites, authored manually in 2 px paint
cells. Individual PNG exports are in `arcade/snake-next/effect-playground/sprites`;
runtime reuses cached native canvases from the identical authoring source.
No ImageGen, arbitrary rotation, reference extraction, or nonuniform fitting.
Uniform destination box: cell×.68 desktop / cell×.94 compact/mobile. Native
alpha padding is intentional for rims and thorns; actual footprints fall roughly
35–45 desktop / 22–30 mobile px. All canvases use nearest-neighbour rendering.

Positives use bright open/rounded contours and outward particles/calm bob;
negatives use dark irregular/spiked contours, rose danger edges and inward jitter.
Internal gate inspected native silhouettes and 38/26 px review sheet before
integration. Human approval is pending, not inferred from automated uniqueness.

Pickup notices last 78 active ticks (1.3 s), nonmodal. Two named positive HUD
slots and one named negative slot share the existing rail dimensions. Timer or
charge values stay readable on mobile; Corruption's −40% and Harvest's ×2 are
also explicit. No icon-only active states.

Normal mushroom feedback: 80 ms collected-mushroom squash, tiny decorative front
reaction (no V4 mask changes), 4–10 spores / 12 on a Harvest third mushroom,
combo-scaled pop, rising cue pitch up to +17.5%, HUD pulse. Visual reaction ends
within 340 ms. MAX COMBO appears only when crossing into max, not each subsequent
mushroom. Simulation never pauses for mushroom feedback.

## Verification

49 targeted tests: effect durations/pools/category grayscale and silhouette
uniqueness; Focus/Harvest/Corruption/Spore/Guard/Portal semantics; inherited food
reliability/hazard safety; tunnel and stable camera regressions; deterministic
replay/hash parity; locked-source byte comparison against `85a1702`.

```text
node --test arcade/snake-next/effect-playground/effects.test.mjs arcade/snake-next/progressive-run/progressive.test.mjs arcade/snake-next/progressive-run/food.test.mjs arcade/snake-next/gate-one/gate.test.mjs arcade/snake-next/gate-one/stable-camera.test.mjs arcade/snake-next/gate-one/expansion-ux.test.mjs
playwright-cli -s=forestqa --raw run-code --filename=arcade/snake-next/effect-playground/browser-qa.js
```

Desktop 1920×1080/DPR 1 and mobile 844×390/DPR 2: all nine controls, effect slots,
clear, timer/charge labels and render hash immutability pass. HUD dimensions,
Preset B, stable camera mode and 44 px mobile targets remain unchanged. Pixel
comparison shows zero changed fog pixels inside the sampled 4-cell safety disk
and visible changes outside (see `browser.json`). No console/network errors.
Two runtime captures only (`desktop.png`, `mobile.png`), plus small requested art
sheets. No benchmark, no Caves/Swamp final art, no ranked/backend change.

The locked B config, Smooth V4 source/art/motion, stable camera, tunnel/session,
world/border/expansion geometry, grid core/input/collision, progression config,
and food generator remain byte-identical. Only requested effect mechanics and
their presentation changed. STOP for human gameplay/art review.
