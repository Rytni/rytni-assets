# Snake product effect materials

Local review: `/arcade/snake-next/product/appearance/review.html`.
The page shows one locked Smooth V4 fixture at a time, base beside active, on
the real Forest floor. Desktop panels stack when needed so native pixel scale
is retained; mobile panels use the actual FIT WORLD cell scale. Select any of
nine effects, eight requested pairs or four legal three-effect combinations;
scrub the
250 ms transition, pause it, or enable a discontinuous portal span.

## Ownership and geometry

`EffectRibbonSprites` subclasses the original `RibbonSprites`. Its eight
`.sources` are the original read-only PNG pixels. `setSession(session,
{quality})` reads only effects, canonical tick, seed and starts key. It does
not alter simulation, frame/history, head/tail, radius, collision or portal
spans. Both normal and TunnelRibbon raster paths call optional RGB painters
only after the original material fills an existing mask pixel. The optional
head painter runs after the original clipped decorative overlay. Default
rendering with no painter is byte-identical to original V4.

No extra shape, particle, floating icon, plate or wake is emitted by this
module. World pickups, HUD, Roots/Mist environment layers and approved one-shot
responses remain owned by their existing renderers. Product bridge owns
removing the former active wisps, floating plates/icons and Rush ember wake.
No original PNG is edited or re-exported.

## Explicit composition policy

| Channel | Order / overlap rule | Appearance |
| --- | --- | --- |
| Palette | Harvest, then Rush, then Weak | Honey gold, ember orange, bruised plum; each retains original luminance and underlying shading |
| Pattern | Spores, then Portal+, then Guard | Rose/cream spore islands; violet transverse bands with gold marks; emerald armor scales with gold seams |
| Brambles | Above patterns, narrow seam only | Internal brown angular vein; no thorn geometry outside the body |
| Edge | Focus, then Mist, then Rush | Pale cyan breathing edge; cool gray-blue edge; warm orange edge |
| Head accent | Harvest warmth / gold sprig; mint Spores/Portal+/Focus sprig; Guard gold sprig; Rush warmth; Weak purple cap | Only original cap/foliage RGB changes; pupil/eye ink and white highlights stay exact |

All legal pairs use the same order regardless of the order of `session.effects`.
Guard owns overlapping dorsal pattern pixels. Portal's outer lateral marks
stay exposed beside Guard. Spores remains visible between the larger patterns.
The negative palette does not hide the positive pattern channel; e.g.
Harvest+Guard+Weak is plum flesh with emerald/gold armor, while
Spores+Portal+Rush is orange flesh with rose spore islands and violet bands.
Focus+Harvest+Mist is warm flesh with a cool restrained edge, where Mist wins
the shared outer edge. Guard+Portal+Brambles retains the armor/band colors with
an internal bark seam. These four combinations are directly selectable.

The eight requested review pairs are Harvest+Focus, Harvest+Guard,
Focus+Portal+, Spores+Guard, Harvest+Rush, Harvest+Weak, Guard+Brambles,
and Focus+Mist. They are also covered by native-alpha and mobile-scale checks.

Material coordinates are existing head-relative body distance `d-frame.start`
and signed lateral `v`. This stays continuous across canonical history
rebasing and uses the same coordinates for portal spans; no screen/camera,
canvas, DPR or arbitrary world coordinates enter the material.

## Clock and bounds

Onset and expiry use a smooth 15-tick transition at 60 Hz (250 ms). Known
`started` ticks determine onset; timed expiry or early charge consumption
retains a fading appearance for 15 ticks without retaining a gameplay effect.
Refreshing an effect uses its new canonical `started` tick. Restart/tick
rewind clears presentation tracks. Pause freezes all weights and breathing
because no wall clock or RAF interpolation enters the material.

The affine material table is one reused 272×73×7 Float32 buffer (555,968 bytes,
about 543 KiB), with at most nine tracks. Active breathing is sampled every
four canonical ticks (15 table updates/s); transition weights update at the
canonical tick. Desktop/mobile share the same artwork and clocks. No per-frame
body-length table, unbounded cache, Worker, extra asset or particle pool is
introduced. The existing V4 field cache remains bounded at 128 entries.

## Actual scale measurements

Measured by the current `fitWorldLayout` at the listed viewport, with the
unchanged native `BODY=36`, `CELL=68`:

| Fixture | Viewport | Cell | Body |
| --- | --- | ---: | ---: |
| Desktop 30×12 | 1920×1080 | 60.17 px | 31.86 px |
| Mobile 30×12 | 844×390 | 25.00 px | 13.23 px |
| Mobile 40×16 | 844×390 | 18.66 px | 9.88 px |
| Mobile 50×20 | 844×390 | 14.89 px | 7.88 px |
| Mobile 60×24 diagnostic | 844×390 | 12.38 px | 6.55 px |

At mobile50 the material palette and large Guard/Portal marks remain visible;
fine original foliage and face details are naturally small. Mobile60 loses
more fine detail and is a diagnostic, not a suggested acceptance threshold.
The product's progression/readability decision is owned by the product bridge.

## Verification

Run `node --test arcade/snake-next/product/appearance/material.test.mjs`.
Nine focused tests verify default V4 pixels, identical alpha for all skins,
eight pairs and four triples, unchanged source PNG hashes, decorative head/eye
contract, pause stability, canonical history rebase, actual TunnelSession
hash/replay read-only sampling, 250 ms onset/expiry and discontinuous spans.

Browser check (with the review open in `skin-review`):
`playwright-cli -s=skin-review run-code --filename=arcade/snake-next/product/appearance/browser-qa.js`.
It checks native fixture scale, nine distinct and visible mobile50 appearances,
all eight requested pairs and four legal triples,
paused pixels, base equality at onset/expiry, and a skinned portal split.
Review canvases explicitly request CPU readback because repeated QA readbacks
otherwise cause Edge's GPU-to-CPU promotion to change background sampling
between compared canvases. This is confined to the review page.

Existing V4 default-byte and TunnelRibbon pixel/hash tests pass. The legacy
source-lock checks in `forest-training/ribbon-live.test.mjs` (historical motion
reference) and `gate-one/gate.test.mjs` (historical raster source reference)
need their audit expectations updated/documented for the approved current
baseline and optional RGB integration; runtime geometry tests pass.

The screenshots `effects-mobile50-combo.png` and
`effects-mobile50-patterns.png` are compact comparisons on the actual floor;
`effects-desktop30-combo.png` shows the native desktop pair.
Only the review pair is shown; no full VFX/asset gallery is generated.
