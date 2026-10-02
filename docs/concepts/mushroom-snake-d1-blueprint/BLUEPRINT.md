# Mushroom Snake — D.1 visual production contract

Status: **DESIGN REVIEW ONLY**. Direction D is approved; D.1 details below await review. No Phase 3B, production sprites, runtime integration or deployment. Reference ≠ Source Asset. The eight PNGs are independently generated concept originals, never extraction sources.

## What is authoritative

This document defines proposed reproducible art constraints. Generated sheets illustrate them; their labels, segment counts, scale and continuity are not technical measurements. Still images do not prove motion, seamless geometry, exact same-state equivalence or performance at 1200 segments. Those require a separately authorized production proof. Food candidates remain unselected.

Existing source was inspected narrowly: camera uses `min(stageWidth/38, stageHeight/22)` in moving-camera mode with its existing minimum; canonical body radius is 0.34 world cell. No source was changed. Use the **actual gameplay stage**, not viewport dimensions. Camera/grid/collision remain independent of art.

## 1. Character geometry and material

All dimensions are proposed **visible art targets**, not collision changes. Unit = existing world cell. Body width 0.68; ordinary head core approximately 0.80 wide × 0.92 long. Head decorative extent may exceed this, but may not obscure adjacent occupied lanes, food or hazards. The existing renderer's larger art envelope is historical, not a new implementation mandate.

- Orthographic top-down. Four directional heads share anatomy/palette, but lighting is authored in world space: warm NW key, cool ambient, restrained contact shadow. Do not rotate a baked NW highlight into four different light directions.
- One continuous silhouette from head through neck/body/taper/tip. No independent full body disc under head or terminal cell. Junction opacity must cover the full joining cross-section; internal alpha overlap is allowed only **inside one silhouette mask**, never as stacked outer rims/shadows.
- Head-neck width transitions continuously over approximately 1 cell. Decorative brow never substitutes for the actual head; rounded triangular short snout, almond amber eyes, cream scales. Recognizable without mushrooms.
- Straight/90°/tight-U/S use one centerline and continuous contour; turn inner/outer surfaces preserve width, material orientation and shading. Avoid miter spikes, stamped corner tiles and stretched scale diamonds. A one-cell separation leaves 0.32 cell between plain bodies: foliage/shadows must not fill that gap or visually merge parallel legs.
- Taper target: final 3 cells for a long body; smoothly declining width ending in an organic pointed tip. At length 8, allocate neck and taper without overlap using available arc length (at most 40% for taper); never consume the entire middle body. Exact spline/contour method is a later renderer proof, not this pass.
- At joins: one world-space centerline, shared tangent, shared scale/pivot convention and shared subpixel transform. No independently rounded segment positions; no mobile-only offset. Verify alpha bounds at DPR 1/1.5/2, all directions, motion phases and camera offsets.
- Fine markings follow continuous arc-length coordinates. No visible periodic tile or repeating mushroom stamp. Stable appearance follows the living body's material coordinates, not screen position, frame count or a chunk boundary. Growth must not scramble all markings.

### Surface grammar and LOD

Cream body is the primary silhouette. Moss/leaf islands are irregular and direction-following; at most about 20% of visible upper surface covered, with unbroken cream corridors. Tiny flowers are tertiary accents. Mushrooms: at most 1 on length 8, 2 on ~30–60, and 2 in any visible ~50-cell fragment; variable gaps, never each segment. No giant mushroom head. These are art caps, not gameplay items.

At <12 CSS px body width: retain cream contour, brow/eyes as one readable face motif, broad moss patches; suppress tiny scales/flowers and one-pixel twinkle. At 12–20 px: selective leaves and markings. Above 20 px: fine materials permitted. Do not sharpen background to compensate for small Snake. Example full 844×390 stage gives cell scale 17.73 and body width 12.05 CSS px; a stage shortened by HUD/control space gives less. This is arithmetic, not measured gameplay QA.

| Length | Visual contract / future proof |
|---|---|
| 8 | Head/neck/body/taper all present; no head-tail collision of art; 0–1 mushroom |
| ~30 | Straight, 90°, tight U, S; irregular decoration; tail pointed |
| 100 / 250 | Parallel-lane clearance, no material reset during growth; clip offscreen detail |
| 500 / 1200 | Same silhouette; screen-density LOD; no 1200 animated props or per-cell shadows; no effect multipliers with length |

### Reproducible art tokens (proposed D.1 targets)

Use these as one shared art brief, not independently improvised per asset. Values are proposed, not sampled/extracted from Direction D. Linear-light compositing and local contrast still need a production proof.

| Token | Target |
|---|---|
| Body base / highlight / olive shade | `#E4D7B2` / `#F2E7C9` / `#9AA17A` |
| Moss / leaf deep / eye amber | `#526341` / `#344C37` / `#B57B38` |
| Thin contour/contact dark | `#29382C`; never a thick black segmented rim |
| Ground family / atmospheric edge | Earth/moss low-saturation values / dusk petrol `#20343B` family |
| Light | World NW key, cool ambient; no independent per-sprite opposing shadows |
| Food / positive / negative size | About 0.60–0.80 cell compact silhouette; no oversized UI token in field |
| Portal footprint | ≥3× pickup width, grounded aperture; exact gameplay trigger stays existing |
| Decoration contrast | Below nearby collider/food contours; suppress where it obscures gameplay |

Surface accent recipe: irregular moss islands approximately 0.5–1.8 cells long with 2–5-cell unadorned gaps; secondary leaves 1–3 per selected island, flowers only on a minority of islands. Avoid copying a full island image every interval. Mushroom accents at least ~12 cells apart and only if screen-density/length caps allow; omit at tight inner bends or close parallel runs. The numeric range is a starting authoring constraint, not a guarantee that every random sample looks good.

Reproducibility contract: versioned art tokens + explicit seed + stable material coordinate + selected recipe IDs determine accents; never random each frame. Store/derive variation in a stable body material domain that advances with travel and does not reset on resize/growth/reentry. Ground compositions use canonical world coordinates and shared boundary samples, not mirrored per-chunk seeds. Recipe IDs define dominant patch, secondary motif and negative-space mask; constrain density rather than scatter one object per cell. Reject any recipe that produces repeated bands, obscure routes or false blocking silhouettes. This describes the future visual data contract, not a change to simulation/world generation.

## 2. Personality, not caricature

Illustrated poses are proposals, not exported animation frames. Always preserve silhouette, material, pivot and gameplay facing. Eyes are expressive but small; no oversized infant eyes, added ears/horns/limbs.

| State | Proposed restrained visual / duration |
|---|---|
| Neutral | Calm alert eyes, closed relaxed mouth; default |
| Blink | Eyelids only, 80–120 ms; rare irregular idle cadence |
| Tongue/focus | Short forward tongue or narrowed attention, 120–180 ms; no silhouette-sized lash |
| Eat | Small jaw/throat squash, 160–220 ms; neck cannot detach |
| Positive | Brow lifts, local leaf/dust response, 200–300 ms |
| Negative | Eyes narrow, restrained local wilt/dark flakes, 200–300 ms; no whole-body tint hiding hazards |
| Hurt/death | Brief recoil/closed eyes, 200–350 ms; no gore, no disassembly or extra collision implication |

Suggested visual priority: hurt/death > eat > pickup reaction > focus > blink > neutral. Never change input, collision or timing of gameplay to fit animation. Body displacement is contour-safe and small; no extra full-Snake glow layer per effect.

## 3. Object-category contract

Color is redundant information, not the classifier. Compare silhouettes in grayscale and at native stage size. Category-specific ground marks are modest; never identical collectible circles.

| Category | Silhouette / material | Motion language | Value / ground | VFX |
|---|---|---|---|---|
| FOOD | One compact asymmetrical seed/pod with leaf crown; satin organic shell, small core | Short gentle breathing, no large levitation | Warm bright core below Snake; tiny soft contact shadow | One inward seed/crumb response at pickup; no aura ring |
| POSITIVE | OPEN bifurcated wings/sprout, airy negative space; ivory/gold living petals | Upward opening/lift, sparse rising leaves | Bright controlled tips; small interrupted leaf bed | Rising authored leaf/spore wisps |
| NEGATIVE | CLOSED triangular hooked thornpod; dry dark resin, serrated rim | Inward contraction/twitch, falling flakes | Dark mass plus narrow pale outline; broken angular ground flecks | Falling/directional thorn dust, not positive sparkle |
| PORTAL | Large grounded asymmetrical root/fungal arch, clear traversable opening; destination footprint ≥3× pickup | Slow inward drift through opening; architecture remains rooted | Jamb light only, center not brightest; approach path/threshold | Dust flows toward destination, not collectible burst |
| COLLISION | Solid raised CLOSED mass; stone/stump/root with consistent firm rim and contact | Static; no collectible hover | Crisper/higher than decor, lower than active pickups; anchored shadow | No pickup particles; tiny material response only if needed |
| DECOR | Flat/open/broken fern/leaf/flower compositions; low soft material | Rare low-amplitude leaf sway | Muted, low local contrast, no hard closed footprint/contact rim | Rare ambient spore; no interaction halo |

Collision and decor must not share an indistinguishable prop silhouette: no decorative solid stump/boulder that appears blocking. A decorative twig is thin/flat; a colliding root is thick/raised with a continuous contact rim. Category truth comes from gameplay data in a future implementation, never inferred from palette.

Food review candidates: **magical seed**, **forest spore/fruit**, **fungal seedpod**. None selected. Stress/biome illustrations use a provisional coral seed marker; this is not a selection. Review each as a distinct tiny silhouette, not an apple reskin, and against positive/negative objects.

Portal refinement: rooted threshold, wide hollow aperture, asymmetric frame; luminous pixels occupy ≤15% of prop area as a proposed art cap. No bloom/blur, giant ring, floating orb or gold-positive collectible shape. Portal should read as a place to reach even with all glow disabled.

## 4. World composition and stress frame

Hierarchy: **Snake > active food/pickup > collision > interactive environment > decor > ground**. No fixed numeric luminance ladder across every biome: protect local edge contrast and category shapes. Snake outline/shadow must remain visible on light and dark patches without a new neon halo.

Use broad authored-looking deterministic clusters, environmental landmarks, paths and irregular patches. Negative space follows gameplay corridors; never dense random scatter every N cells. Foreground frames **edges**, never overlays live Snake, food, pickup or collider contours. Ground details have lower frequency/contrast than game objects. Decorations do not alter collision.

Stress illustration target: ~50-cell continuous Snake, several solid colliders, one food, 2 positive and 1 negative **world objects**, one portal, controlled decor, local VFX, HUD. HUD active-effect indicators are not extra world pickups. Count labels/cell lengths in generative art are approximate. Future max active-effect stack remains 2 positive + 1 negative; this document creates no new mechanic.

Human review gate: hide category labels; show the gameplay image for 1 second at intended stage scale. Reviewer identifies Snake head/tail, food, both positives, negative, blockers and destination. Repeat grayscale and mobile. If any category is ambiguous, revise its shape/ground language before production. This gate has not yet been passed by human testing.

## 5. One system, three biomes

The comparison sheet repeats the intended route/object arrangement; ImageGen is not a deterministic scene renderer, so exact registration is **not** guaranteed. Future proof must render the same canonical snapshot in each biome. Never use these panels as ground tiles.

| System | CONSTANT | Forest variable | Caves variable | Swamp variable |
|---|---|---|---|---|
| Character | Anatomy, cream/moss identity, world key direction, silhouette/LOD | Warm bounced green | Cool stone bounce, cream preserved | Muted wet green bounce, cream preserved |
| Categories | Shape, scale, animation/ground/VFX grammar; collision truth | Bark/stone skins | Mineral/stone skins | Wet root/stone skins; no fake-decor blockers |
| Ground | Quiet gameplay contrast, irregular macro patches | Moss/earth/path | Dark exposed stone/mineral veins | Muted mud/shallow water/dry islands |
| Foliage/decor | Cluster scale and negative-space rules | Fern/leaves/flowers | Sparse lichen/fragments | Reeds/low fungi/wet leaves |
| Lighting | Same key orientation; no obscuring full-screen effects | Warm filtered dusk | Controlled local crystal light | Restrained fungal light/reflections |
| Ambient | Bounded particles, no mechanical dots/rings | Rare fireflies/spores | Rare mineral dust | Slow spores, sparse ground response |
| Environment motion | Low duty cycle, no category-changing motion | Leaf sway | Tiny crystal flicker | Reed sway, local puddle frames |
| UI/VFX/readability | Same UI, hierarchy, effect direction/shape and budgets | Palette tint only | Palette tint only | Palette tint only |

Future biomes may change these materials, not category topology or hero identity. Transitions blend irregular ground/cluster patches, not two rectangular full-screen textures. Gameplay geometry stays authoritative; mixed transition decor must not imitate a blocker.

## 6. Main Menu layer ownership — composition retained

Preserve Direction D hero-left/actions-right composition, responsive landscape safe areas and menu information architecture. Layer sheet is an independently drawn explanatory study, not permission to redesign.

| Back → front | Ownership / representation |
|---|---|
| Background | Static independently authored forest illustration, **no text/buttons/logo/hero baked in** |
| Atmospheric foreground | Separate edge-only foliage/near branches; cached/static, no UI occlusion |
| Hero Snake | Separate character illustration; same anatomy, materials, sparse mushrooms; cannot overlap action safe-area |
| Logo | Separate logo art; accessible title text remains live; not baked into background |
| Menu UI | Existing UI LOCK frame → bevel → textured surface → safe-area; live/localizable labels, separate button states |
| Ambient animation | Sparse bounded leaf/spore frames behind labels; no decorative continuous RAF when inactive |
| Interactive states | Normal/focus/hover/pressed/disabled without geometry shift; accessible transparent hit-area |

Keep: Играть / ranked, Тренировка, Как играть?, Настройки, Звук, Полный экран, Другая игра, личный рекорд. Concept text in PNG is explanatory only; production labels must remain DOM/live text. No background text extraction.

## 7. Proposed asset/runtime plan (not implementation)

| Visual family | Proposed production representation |
|---|---|
| Snake | One continuous contour/material mapping; independently authored head 4-way variants and small personality frames in atlas; sparse surface accents placed along stable arc length; no full body sprite chain |
| Ground | 3–4 quiet static variants + deterministic macro patches; bounded cached chunk composites; neighboring samples agree at seams |
| Collider | 3–5 silhouette-safe static variants per family in atlas; gameplay footprint separate from art |
| Decor | 3–5 cluster recipes from small atlas sprites; deterministic placement, chunk cull/recycle; cached static majority |
| Food/pickups | Separate static shapes + 4–6 restrained animation frames; one common category atlas; chosen food only after approval |
| Portal | Static rooted frame + 4–6 aperture response frames; sparse inward particles, no realtime blur |
| VFX | Small authored sprite sequences + capped pooled particles; additive light only local and controlled, no full-screen filters |
| Main | Independent background/foreground/hero/logo/UI files; critical set decoded before reveal; gameplay deferred |
| UI | Existing shell/assets retained; atlas states and live text; no baked HTML/buttons or new modal architecture |

This is a capability plan, **not a chosen renderer rewrite**. Continuous contour/texture feasibility requires a later isolated benchmark. Reuse safe existing foundation where compatible; do not implement a mesh/Worker/backend during this phase. No per-frame object allocation, no one effect per body segment, no unlimited caches. Prepare nearby chunks before viewport exposure without changing deterministic geometry.

### Initial budgets / hypotheses to validate

Counts exclude continuous body samples (not individual sprites). All numbers are starting ceilings, not achieved measurements. No all-biome eager loading; at most current + adjacent biome resident. Screen-space culling applies regardless of logical length.

| Budget | Mobile landscape | Desktop |
|---|---:|---:|
| Visible world sprites (objects + decor) | ≤220 | ≤360 |
| Visible Snake accent sprites | ≤48 | ≤96 |
| Independently animated environment props | ≤8 | ≤16 |
| Total particles incl. active effects | ≤24 | ≤48 |
| Concurrent head reaction | 1 | 1 |
| Game canvas backing layers | ≤3 incl. main; DOM HUD separate | ≤3 |
| Cached ground raster pixels total | ≤1.5M (~5.7 MiB RGBA) | ≤2M (~7.6 MiB) |
| Backing pixels per canvas layer | ≤1.25M; DPR adapt/cap | ≤2.1M; DPR adapt/cap |
| Render CPU p95 target | ≤4 ms | ≤2 ms |
| New visual preparation task target | ≤2 ms, no active-frame blocking decode | ≤2 ms |

Max-length 1200 uses the same screen caps, fewer fine accents at density, and culls offscreen spans. Budget checks include legal effect stack and biome transition. Never lower gameplay tick rate or geometry to meet these art targets. Targets require representative device measurement, including CPU×4 emulation; no guarantee follows from the concept.

RGBA texture arithmetic (no mipmaps): `width × height × 4 / 1048576` MiB. 1024² = 4 MiB; 2048² = 16 MiB; 2048×1024 = 8 MiB. PNG/WebP download size is **not decoded/GPU memory**.

| Resident family | Mobile proposal | Desktop proposal |
|---|---:|---:|
| Snake atlas | 1024² / 4 MiB | 2048² / 16 MiB |
| Common object atlas | 1024² / 4 MiB | 1024² / 4 MiB |
| UI atlas | 1024² / 4 MiB | 2048² / 16 MiB |
| Current + adjacent biome atlases | 2 × 2048² / 32 MiB | 2 × 2048² / 32 MiB |
| VFX atlas | 1024² / 4 MiB | 1024² / 4 MiB |
| Gameplay textures subtotal | **48 MiB** | **72 MiB** |
| Menu background/hero composite equivalent | 1024×512 / 2 MiB | 2048×1024 / 8 MiB |

Release menu-only textures after transition where safe; do not count on instant GC. Mobile gameplay raster layers ≤14.3 MiB plus ground cache ~5.7 → ~68 MiB GPU/raster target before overhead; desktop ≤24 MiB + cache ~7.6 → ~104 MiB. Initial ceilings: mobile 80 MiB, desktop 128 MiB for tracked resident raster resources. Decoded CPU copies, double buffering/driver allocations can exceed these; measure process memory and prevent retained duplicate image/canvas copies. Mipmaps, if introduced, add ~33%. Atlas packing/padding and device limits must be verified before production; use 2K maximum atlas baseline, no assumed 4K device requirement.

## 8. Approval and future proof gates

D.1 review asks approval of anatomy, category grammar, food shortlist (not a selection), controlled portal, biome constants and budget hypotheses. Before production acceptance, a separately authorized proof must test:

- Straight, 90°, U, S; head/tail UP/RIGHT/DOWN/LEFT; lengths 8/~30/100/250/500/1200; growth and continuous movement phases.
- Actual stage desktop embedded/fullscreen and mobile landscape; DPR 1/1.5/2; native-scale and grayscale; no alpha gap, stacked silhouette, thickened joins or parallel-lane merge.
- Canonical same snapshot in Forest/Caves/Swamp, transition and chunk boundary traversal; category one-second human review.
- 2 positive + 1 negative effects; bounded VFX/particles/animation; cold asset reveal, no partial UI; pause/inactive lifecycle.
- Measured p95/spikes/texture residency on representative mobile; game-scale readability beats illustration detail.

No claims of production readiness, runtime PASS or seamless animation are made here. Stop for human review. No commit, build, TEST/Production update or final asset pack in this pass.
