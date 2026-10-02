# Mushroom Snake — Phase 3A-R art-direction review

Base: `3c9630645aedecdc1b028587da83f95a98284d4f`; branch `mushroom-snake-rebuild`.
**Six final concepts only. Human selection required. No winner selected. No production assets, integration, renderer changes, Phase 3B, build or publication.**

[Review gallery](index.html): A Gameplay/Main → B Gameplay/Main → C Gameplay/Main, switch all six between native100%,50%,844×390 and915×412 contain previews. [Exact prompts, sources and SHA-256](prompts.json). Built-in ImageGen; originals copied byte-for-byte. Requested16:9; tool returned1672×941 with integer-pixel aspect rounding. One exploratory B was rejected for insufficient differentiation from A; it is not in the final six or repository.

## Diagnosis: why “asset pack + green floor”

- Constant-width textured body, cardinal corners and periodic foliage emphasize a manufactured tube. Independently shaded head does not establish a shared anatomical transition.
- Floor microtexture dominates while similar-size scattered clusters offer no large-scale clearing/landmark composition. Detail density is not environmental storytelling.
- Separate per-cell obstacle images in a collision group read as a collection of icons rather than one grounded structure; scale, light and material response lack a common scene brief.
- Food is too small/quiet to support an expressive anticipation→contact→reaction beat. Technical contour correctness is not an animation/art-quality approval.
- Main illustration and gameplay hero have different expressive richness. Independent sprite prompts do not guarantee a coherent whole scene.

Evidence reviewed: Phase3A report, exact prompts/provenance, `forest-medium`, `turn-right-closeup`, earlier Main/portrait/S/long-body captures. Fly Main/Playing and Rytni Hub/page screenshots show shared fungal fantasy, golden focal light, cream/gold lettering, depth and clear hero focal points. Borrow that universe coherence, not Fly's layouts or another franchise's artwork. The previous technical acceptance remains historical; visuals are rejected.

## Shared hero / readability contract

One living snake: softly triangular short snout, amber eyes, moss-leaf brow, ivory scales/belly, anatomical neck and continuous body, elegant taper. Integrated foliage is irregular; tiny red mushrooms are sparse back accents, never a mushroom head or per-segment stamp. No ears/limbs. Personality must survive gameplay scale, not only menu enlargement.

All gameplay concepts use the same approximate S-route, ≈20-length situation, one coral seed food, and five primary collision silhouettes: boulder, stump, log, bramble, stone outcrop. HUD values are concept labels, not simulated evidence. Positions/proportions have generative drift; these are comparative visual targets, not geometric acceptance captures. Open central floor, composed edge ecology, consistent upper-left key light.

Hierarchy: Snake → food/collectibles → collision obstacles → interactive events → decor. Use silhouette/material/contact treatment as well as color. Decor remains low, flat, low-contrast; solid objects have unified grounded volume. Future category motion must reinforce this hierarchy. No new categories/mechanics implemented.

## A — Storybook fungal forest

- **Philosophy:** rich authored illustration, warm discovery, memorable ecological vignettes rather than scattering more props.
- **Hero proportions/scale:** short expressive snout, head roughly1.3–1.6× neck width; supple substantial middle and long taper. In mockup, body roughly45–60px at1672px width (≈37–49px when fit to1366px), indicative only. Keep head/neck grown together; menu enlarges this same animal.
- **Palette/light:** ivory `#F0DFB5`, fern/olive `#536B35`, umber `#65523A`, russet `#9B5238`, honey `#D9AE57`; one warm canopy key, low-contrast ambient shadow. Palette targets, not exact sampled swatches.
- **Ground:** broad earth/moss masses; leaf beds and roots concentrated into asymmetrical islands; quiet route underneath Snake. Brush texture subordinate to macro shapes.
- **Obstacles:** cohesive painted stone/wood/bramble groups, readable full silhouettes and baked contact shadows; no tiled per-cell icon collection.
- **Food/collectibles:** coral seed, leaf crown, restrained gold glint/contact lift; future collectible families need distinct outlines and cadence, not recolors.
- **UI:** integrated branch/leaf/stone charms, editorial fantasy lettering, quiet ivory surfaces; no enclosing brown window. Future rated action visibly disabled; all required Main features present.
- **Animation/VFX:** relaxed breathing/blink, subtle neck anticipation, turn compression, foliage follow-through; tiny leaf/mote bursts for pickup, expressive recoil for death. Suggested only, not animated.
- **Pipeline/perf:** approved full-scene color/value keys → original orthographic hero model/turn/expression sheets → separately authored continuous skin/head-neck/taper and limited foliage attachments → authored environment compositions under one material/light sheet → bounded layered atlases with baked shadows. Never slice concepts. Rich texture raises atlas/decode memory; cache static compositions, sparse moving details. Cost must later be measured, not assumed.

## B — Clean modern arcade fantasy

- **Philosophy:** strong identity in a few graphic forms, maximum immediate category recognition and animation friendliness.
- **Hero proportions/scale:** same snout/amber-eye/moss-brow identity, slightly clearer facial shapes, broad selective scale arcs rather than a patterned skin; head≈1.3–1.6× neck. Mockup body≈45–60px at1672px (≈37–49px at1366px), not a grid change.
- **Palette/light:** ivory `#F0E1BA`, sage `#82957A`, jade `#3C6251`, deep teal `#153D3D`, coral `#DA634C`, honey `#DEBE73`;2–3 shading planes, restrained soft key.
- **Ground:** few large irregular tonal regions, intentionally calm central floor, sculptural leaves/roots at margins. No confetti microtexture.
- **Obstacles:** broad facets/rings/thorns make five families immediately distinct; consistent dark-teal contact shadows establish solid collision category.
- **Food/collectibles:** compact high-contrast seed, clear leaf crown/specular spot; future category shape and motion differentiated, not only color.
- **UI:** clean botanical lozenges/leaf tablets, clear sans lettering and icon medallions; generous negative space, no dashboard framing.
- **Animation/VFX:** springy but restrained anticipation/contact/recovery, readable squash/turn compression, separate eyes and few leaf groups; brief geometric leaf/spark accents, not a particle storm.
- **Pipeline/perf:** original vector/painted shape masters and shared shading rules → approved identity/expression/turn sheets → continuous body presentation with sparse stable attachments → exported crisp2D atlases and authorable low-frequency floor compositions. Runtime rasterized art is generated independently in a later phase, not traced from concepts. Fewer texture/layer needs, potentially lower memory, still measure long-body draw/animation cost.

## C — Cinematic enchanted woodland

- **Philosophy:** depth through value and atmospheric color, not expensive realtime effects; bright living hero in a calm dusk clearing.
- **Hero proportions/scale:** same ivory/amber/moss identity, slender flowing anatomical neck, finer taper; head≈1.3–1.6× neck. Mockup body≈32–44px at1672px (≈26–36px at1366px); compare small-scale facial clarity before choosing. No mechanics scale decision here.
- **Palette/light:** ivory `#EEE2B9`, petrol `#1B4346`, indigo-green `#183346`, emerald `#315847`, gold `#C9A253`, restrained blue edge accents `#386EA4`. One painted golden opening, dark peripheral planes; no luminous floor carpet.
- **Ground:** broad moss/earth regions with low-amplitude texture, composed root/fern layers, restrained edge landmarks. No fog obscuring playable space.
- **Obstacles:** grounded silhouettes with controlled pale top planes; dark log/bramble must retain separation from surrounding foliage on mobile.
- **Food/collectibles:** isolated coral seed with gold rim, strongest tiny focal accent after hero; future category silhouettes and bounded pulse rhythms distinguish pickups.
- **UI:** dark botanical charms/bronze edges, ivory-gold lettering on calm gaps in scene; disabled stone action, no nested brown shell.
- **Animation/VFX:** quieter breathing/eye reactions, graceful foliage follow-through, few drifting edge motes; lighting mostly static/baked. No runtime blur, fullscreen effects or heavy particles.
- **Pipeline/perf:** approved dusk value keys plus daytime-neutral material masters → separately authored hero/obstacles under one key light → independent limited depth planes/macropatch art with baked illumination/contact shadows → bounded atlas/cache preparation. Atmospheric planes increase overdraw/memory risk; keep translucent layers few and away from hero. No requirement for3D/WebGL/postprocessing or a new engine.

## Review limitations / next gate

All six were visually inspected before inclusion. Hero/food/five primary hazards remain recognizable in half-size/mobile contain views; B has less floor competition, A more microdetail, C darker peripheral masses. These observations do **not** select a winner. Menus preserve logo, hero, future Play/rated area, Training, How, Settings, Sound, Fullscreen, Other game and local record.

Still concepts exaggerate character/environment scale and do not prove animation, exact collision footprints, responsive text/touch layout, physical-device readability, performance or1200-segment presentation. Menu hero proportions and mushroom counts have slight generative variation; a selected direction needs one approved character model sheet before independently producing any assets. Peripheral solid-looking art must later be classified outside traversal or as collision, never ambiguous non-colliding decor. Painted defocus is visual reference only, not a realtime blur requirement.

Stop here for human A/B/C or hybrid selection. Any future pipeline must preserve the locked Phase2A/2B world coordinates, simulation, input/lifecycle and gameplay; art cannot drive mechanics changes.

## Verification / scope

Playwright CLI gallery QA passed: six originals decoded; all six stages measured1672×941 at100%,836×470.5 at50%,844×390/915×412 with contain; section navigation works; document overflow0 at1366×768,844×390,915×412. Console errors/warnings0, failed requests0, HTTP≥400 responses0. Twelve50%/844×390 captures and the desktop gallery screenshot were saved; six mobile captures and gallery visually inspected. No gameplay QA rerun or performance claims, because no application files changed. QA evidence is local under `.playwright-cli/phase3ar/`.

Only this concept/review folder may be checkpointed. Gameplay foundation, rejected Phase3A runtime/art, Fly/Hub/host, TEST/Production manifests untouched. No push/deploy.
