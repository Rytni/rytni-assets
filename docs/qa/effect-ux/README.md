# Effect UX + FIT WORLD — diagnostic checkpoint

Base: 5ac5fd8. Human approval pending. No publication.

- Play: http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html#effect-playground
- Requested five review groups: http://127.0.0.1:8775/docs/qa/effect-ux/review.html

## Presentation only

Three fixed slots contain icon, short name, large time/charge and Harvest ×2 only.
No effect explanatory sentences, progress bars or effect banners in the arena.
Pickup feedback is a 27-active-tick (450 ms) slot rim/pop/icon sparkle. All
mechanics, effect durations, scoring and Director frequencies are unchanged.

Focus has authored cyan crystal/leaf wisps. Guard uses the existing shield plus
moss plates and authored crack fragments. Collectible spores have a petal/core
mask, halo, minimum 14 px destination size, bob and magnetic glint trail; decorative
spores are smaller. Harvest has a crown/glint and authored eat burst. Portal+
uses runes and cyan/gold particles/trail on existing portals. Rush uses ember/
thorn sprites. Corruption uses mold masks and spreading pickup motes. Roots use
crack → tips → full roots → decay masks. Mist retains the approved fog/safety
logic. These are cached 32×32 native masks with four shimmer phases, not primary
Canvas circles/lines/rectangles. Pickup sprites themselves are unchanged.

Crystal/root/stump world obstacles all use the clean approved stone fallback.
No type-color marker rectangles. World topology/collision are unchanged.

D-pad investigation: current baseline CSS/HTML already matched 764e180, including
V3 normal/pressed PNGs (31efcd4 used the previous V5 buttons). Those approved V3
assets are preserved. The isolated progressive DEV override uses a four-button
48×48 cross, 2 px gaps, 148×148 cluster, fixed lower-left arena anchoring; runtime
pointer capture/queue logic is unchanged. BEFORE/RESTORED and actual pointer-down
captures are in the review. This is not claimed to be byte-identical placement:
the cross/larger targets implement the current request while retaining the asset
and pressed-treatment provenance. Portrait still hides the controls.

## FIT WORLD experiment

Default FIT WORLD; button switches to the unchanged STABLE CAMERA. Fit uses
uniform scale, 4 px clear perimeter, a centered active-world layout, and no head
follow/dead zone/look-ahead. Scale and world center interpolate by canonical time
for the existing 60-tick (1-second) expansion. Pause freezes, restart reads fresh
openings, and renderer reads cannot mutate gameplay hashes. The cabinet/HUD stay
fixed. Environment changes are only viewport extent substitutions; normalized
28×12 artwork hashes remain identical.

**Unresolved requirements conflict:** immediately displaying every new world cell
at the old larger scale cannot fit the fixed arena. Current diagnostic prioritizes
smooth old-fit → new-fit zoom: the old opening boundary stays visible, but newly
unlocked outer territory/border is clipped during early zoom and enters view by
completion. It is NOT a full-visibility-at-every-frame pass. Human must choose
smooth zoom or immediate new-fit scale. No gameplay timing/topology workaround.

## Measured screen sizes (CSS px, settled FIT WORLD)

Each entry: **cell / Snake body / food ink / pickup ink range**. Food/pickup
footprints measure alpha bounds, not transparent destination padding; excluding
ambient VFX. Whole sprites are fitted uniformly. Body is exactly cell ×36/68.

| World | Desktop 1920×1080 | Mobile 844×390 |
| --- | --- | --- |
| 28×12 | 54.7 / 29.0 / 38.3 / 31.9–35.9 | 24.4 / 12.9 / 17.1 / 19.6–22.1 |
| 36×18 | 36.5 / 19.3 / 25.5 / 21.3–23.9 | 16.2 / 8.6 / 11.4 / 13.1–14.7 |
| 48×24 | 27.4 / 14.5 / 19.2 / 15.9–17.9 | 12.2 / 6.4 / 8.5 / 9.8–11.0 |
| 64×32 | 20.5 / 10.9 / 14.4 / 12.0–13.5 | 9.1 / 4.8 / 6.4 / 7.4–8.3 |
| 80×40 | 16.4 / 8.7 / 11.5 / 9.6–10.8 | 7.3 / 3.9 / 5.1 / 5.9–6.6 |
| 112×56 | 11.7 / 6.2 / 8.2 / 6.8–7.7 | 5.2 / 2.8 / 3.7 / 4.2–4.7 |

Mobile later worlds are too small for reliable art readability, especially Swamp
and beyond. Dimensions/thresholds are deliberately unchanged; human decision
required. This is not an endorsement of FIT WORLD as the final mobile camera.

## Targeted verification

54 Node tests passed: locked mechanics/modules, environment compatibility,
portal/motion/food/regression, authored mask bounds, fit for all six dimensions,
canonical-time zoom/pause/reset, hash parity. All nine effects tested in each
browser viewport; mode toggle/render hashes unchanged. Actual D-pad pointer-down
queued UP and used pressed asset; pointer-up cleared pressed state. Minimum
48×48 targets. No console/network errors. Browser snapshots are controlled
paused QA states, not extended human gameplay/fun validation.

Commands:
```text
node --test arcade/snake-next/effect-playground/ux.test.mjs arcade/snake-next/effect-playground/effects.test.mjs arcade/snake-next/progressive-run/progressive.test.mjs arcade/snake-next/progressive-run/food.test.mjs arcade/snake-next/gate-one/gate.test.mjs arcade/snake-next/gate-one/stable-camera.test.mjs arcade/snake-next/gate-one/expansion-ux.test.mjs
playwright-cli -s=forestqa --raw run-code --filename=arcade/snake-next/effect-playground/ux-browser.js
```

No benchmark, ImageGen, TEST/Production build/deploy or backend mutation.
STOP for human visual/gameplay review and the expansion-transition choice.
