# Mushroom Snake — D concept review

Base `4c7d674`; branch `mushroom-snake-rebuild`. **Concept only; awaiting human approval.**
Six new illustrations generated through built-in ImageGen. No production assets or application changes. A/B/C remain references, not sources to crop/extract/trace into runtime art.

[One review gallery](index.html) — fit/native100%/50%/mobile844×390/915×412. [Exact prompts, reference roles, iteration history and file hashes](prompts.json).

## Six deliverables

1. [D Gameplay — desktop](d-gameplay-desktop.png)
2. [D Gameplay — mobile landscape](d-gameplay-mobile-landscape.png)
3. [D Main Menu — desktop](d-main-desktop.png)
4. [D Main Menu — mobile landscape](d-main-mobile-landscape.png)
5. [D Character sheet — head/body/turn/taper/tail](d-character-sheet.png)
6. [D Visual-language sheet — six categories + biome material vignettes](d-visual-language-sheet.png)

## B + C, not two unrelated styles

- From **B**: broad quiet floor regions, clean perimeter shapes, immediate category recognition, separation/negative space around traversal, compact readable information. No confetti texture carpet.
- From **C**: dusk atmospheric edge planes, golden key/cool bounce, crafted ivory/bark/moss materials, fungal woodland landmarks, grounded depth and Main composition. Not C's high-frequency floor or universally glowing objects.
- D binds them with one material/light grammar: foreground detail selective, background detail grouped, silhouette/value first. World remains rich in large ecological clusters, paths, earth/moss patches and edge framing instead of evenly scattered props.

## Whole living Snake

Soft triangular snout, restrained almond amber eye, moss-leaf brow, shared ivory scale flow, anatomical head→neck→body→progressive taper→point. Moss grows with curvature in irregular islands; a few tiny back mushrooms, never a mushroom head or per-segment stamping. One lighting direction and contact-shadow treatment across all anatomy.

Character sheet shows connected head/neck, body arc, compressed turn and continuous taper. Future breathing/blink/anticipation/leaf follow-through must remain subordinate to silhouette. **None implemented.** The sheet's small-scale inset and written dimensions are illustrative generated annotations, not calibrated measurements; gallery previews provide the actual downscaled review.

## Readability / category grammar

`Snake > active food/pickup > collision obstacle > interactive environment > decor > ground`

| Category | Form/material | Future authored motion language, not implemented |
|---|---|---|
| Food | Compact round coral seed + leaf crown, cream-gold rind | Brief juicy response, small directional fungal dust |
| Positive | Open ivory/gold sprout, two unfurled leaf wings | Upward/opening leaf motion |
| Negative | Closed angular hooked thorn pod, smoky violet/umber | Contracting/inward curled spores |
| Obstacle | Raised unified volume, crisp solid perimeter, firm contact shadow | Mostly stationary, never misleading pickup pulse |
| Decor | Flat low silhouette, muted leaf/fern bed, minimal contact weight | Sparse peripheral leaf/spore movement |
| Portal | Hollow asymmetrical root/fungal doorway, visible aperture | Restrained directional leaf current through threshold |

Shape, material and spatial treatment distinguish categories without labels or color alone. Portal is not a neon ring; positive/negative are not recolored versions of one token. VFX should be authored spores/leaves/fungal light/ground response/directional trails, attached to an origin and action. No CSS halos, generic rings, random technical particles, blur or fullscreen effects.

Desktop floor now significantly calmer than C, without removing large environmental structure. First draft was rejected for texture noise and oversized pickups/portal light. Mobile is independently composed for a shorter wide field, not a desktop crop. A D-pad/bramble overlap in the first mobile draft was corrected by moving the bramble into clear field space; final controls do not conceal that obstacle. No simulated collision or input was altered.

## Main Menu

C-family hero-left/action-right composition; Snake stands on the same painted ground and shares environment lighting, not a detached portrait cutout. World-integrated botanical/stone/bronze action bodies, no large enclosing brown HTML panel or nested frames.

All features preserved: Mushroom Snake logo, future ranked Play (disabled), Training, How, Settings, Sound, Fullscreen, Other game, local record. Mobile pairs How/Settings as sibling secondary actions without changing information hierarchy. Image labels/UI are painted concepts, not functional controls or implemented responsive geometry.

## Biome system rules

The language sheet includes Forest/Caves/Swamp material vignettes, **not new biomes or production assets**.

- Preserve hero identity/ivory foreground value, category silhouette and contact grammar across every world. Change environmental palette/materials, not what pickup or collision means.
- Forest: broad moss/earth, authored root/leaf clusters. Caves: exposed cool stone, restrained mineral accents and darker macro regions. Swamp: muted wet earth/reed islands and localized quiet reflections.
- Maintain broad base → composed mid-detail → local landmark → clear gameplay object → restrained ambience layers. Low ground contrast under routes in every biome.
- Global key/bounce remains coherent; cave cool bounce must not recolor the hero into the floor, swamp reflections must not imitate pickup emission. Only selected fungal objects emit light.
- Solid-looking reachable props need explicit gameplay classification before any later production; background decor must not look like an unmarked collider. No new collision geometry is proposed in this phase.
- Transitions would reuse this grammar with organic material patches and clusters; no new transition implementation or simulation changes now.

## Scope / review limitations

Original PNGs preserved byte-for-byte: desktop/sheets1672×941; mobile gameplay1864×843, mobile Main1868×842. Nominal16:9/2.22:1 with ImageGen aspect rounding. Preview uses contain without cropping/stretching.

These are visual targets, not a release acceptance or measured performance/touch report. Mushroom counts, subtle head proportions and exact object scales vary slightly between generated studies; require one approved model/scale sheet before independent production. Small decorative stones in edge dressing need explicit classification in a future art pass; don't infer collision from concept pixels. No physical-device, grayscale-user-test, animated-gameplay or1200-segment approval is claimed.

Observed review caveats: character-sheet main study and mobile Main contain more mushroom accents than the requested2–3, although none forms a mushroom head. The language-sheet portal is substantially brighter than the quieter gameplay portal; gameplay hierarchy, not sheet illumination, is the production target if approved. Sheet annotations require native view; small-preview text is not a mobile UI typography specification. These are retained for human review, not silently claimed as fully locked production designs.

## Gallery verification

Playwright CLI: all6 originals decoded;100% and50% dimensions match native PNGs;844×390 and915×412 stages use contain, without stretching/cropping. Fit/fixed views at1366×768,844×390 and915×412 have document overflow0. Section navigation passed. Console JS errors0, warnings0, failed requests0, HTTP≥400 responses0. Twelve half-size/mobile-size captures plus the full six-image gallery were saved under `.playwright-cli/d-review/`; six915×412 previews and gallery were visually inspected. This verifies the review package only, not a running game.

Only this documentation/concept folder and local review QA artifacts were created. Gameplay/renderer/foundation, current production art, Fly/Hub/backend and manifests unchanged. No build, commit, push, TEST or Production publication. Stop here for human review.
