# Mushroom Snake D.2 Renderer Proof Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for native execution after human review. Steps use checkbox (`- [ ]`) syntax. No subagent dispatch unless separately selected/authorized.

**Goal:** Build one real, playable Forest visual proof of approved Direction D on unchanged Snake Next simulation, then stop for visual review.

**Architecture:** Isolated `d2-review.html` + `d2/` modules. Canvas2D renderer reads the existing canonical snapshots/one interpolation phase; one continuous silhouette supplies body/head/tail grounding, materials and accents. Reuse existing fixed-timer runtime/input/camera through a narrow DEV adapter, not a new simulation or production integration.

**Tech Stack:** Existing browser ES modules, Canvas2D, typed arrays, vanilla DOM controls, built-in ImageGen, Node tests, Playwright CLI/Edge. No added runtime dependency, Worker, WebGL migration or backend.

**Spec:** Approved `docs/concepts/mushroom-snake-d1-blueprint/BLUEPRINT.md`, overridden by the user's D.2 conditions below. Base `4c7d674e5b479ef2b920fe52fcd02890863d2371`; branch `mushroom-snake-rebuild`. D/D.1 concepts are currently untracked: preserve them and checkpoint the accepted documentation explicitly when implementation is authorized; do not stage unrelated files.

## Global Constraints

- Forest only; no Caves/Swamp production assets, ranked, full VFX set, Phase 3B or TEST/Production publishing.
- Keep `simulation/**`, `world/**`, `input/**`, legacy Snake, Fly, Hub, backend, release manifests and existing production assets unchanged.
- Camera/grid/collision/tick rate remain authoritative; DEV length/speed/track options configure existing APIs, never alter simulation fidelity.
- Head/body/tail/shadow/material positions share one canonical interpolated path and camera transform. No separate lag, body disc chain or terminal-body underlay.
- Cream silhouette; restrained irregular moss/leaves. Mushrooms: length 8 ≤1; ~30–60 ≤2; any visible ~50-cell fragment ≤2; no fixed-interval stamping.
- Two LODs; LOD changes detail only, not silhouette, collision or interpolation.
- Magical Seed selected: independently authored narrower seed (~20–25% less fruit-like), pointed asymmetrical tip, smaller leaf, restrained luminous seam/core; no glow ring.
- Assets independently created with ImageGen; never crop/extract/trace D/D.1 or legacy art. New proof-only files live under `grib/mushroom-snake-d2-proof/`.
- Mobile preferred tracked raster ≤56 MiB; hard ceiling ≤64 MiB. Only Forest resident. Report decoded images, backing stores, ground cache, retained atlas/variants and duplicates separately.
- Render targets: desktop p95 ≤2 ms; mobile/CPU×4 p95 ≤4 ms. Report p50/p95/max and spikes; do not claim a target passed without measurements.
- Debug off by default; manual DEV controls are outside gameplay/UI LOCK, not a menu redesign.

## Review Focus

1. Growth at a turn: stable head/neck/taper and material identity across α=0→1, no teleporting accents.
2. DPR/fractional camera offsets: no seam pixels or independently rounded parts at DPR 1/1.5/2.
3. Parallel lanes/tight U: width respects occupied route, inner-turn decoration does not fuse legs or misrepresent collision.
4. Reopen/resize/suspend: one timer/RAF owner, no duplicate decoded art or retained obsolete backing stores.
5. Failed/slow asset decode: readable loading/error state, never half-painted proof or silent placeholder substitution.

## Chosen rendering approach and alternatives

Canvas2D continuous contour is the first implementation: matches the current stack and makes path invariants testable without a framework. Per-cell body sprites are rejected (tile seams/material repetition); a GPU strip renderer is deferred (new subsystem complexity without measured need). If Canvas2D misses quality/performance gates after targeted profiling, report the blocker rather than silently switching architecture.

Geometry contract: reuse `BodySnapshots` and `ContinuousBody` route sampling, but construct the D.2 organic contour in the new module. Conservative rounded turns remain inside the canonical occupied-cell corridor. During interpolation, the corridor is the swept previous/current route occupancy, not a freely smoothed shortcut across an unoccupied turn corner. One head/neck union, continuous taper and pointed tail; complete silhouette mask clips materials. Head art has four independently lit top-down variants (world NW light), never a full body sprite beneath it. Contact shadow is one low-opacity contour pass at a small fixed world offset, including head/tail union; no blur or per-segment circles.

## File structure

New files only, except an optional narrowly tested runtime factory hook:

- `arcade/snake-next/d2-review.html`: standalone DEV entry, HUD, loading state, transparent D-pad and proof controls.
- `arcade/snake-next/d2/review.js`: host adapter, length/speed/fixture switching, lifecycle and explicit QA API.
- `arcade/snake-next/d2/geometry.js`: canonical contour, neck/taper, route-constrained rounded bends; no simulation writes.
- `arcade/snake-next/d2/material.js`: persistent arc-length material anchors, bounded irregular accents, two LODs.
- `arcade/snake-next/d2/renderer.js`: common world transform, silhouette/material/head/shadow rendering, timings.
- `arcade/snake-next/d2/forest.js`: deterministic visual compositions, existing collision-mask mapping, bounded ground cache and visual category objects.
- `arcade/snake-next/d2/resources.js`: URL-keyed decode promises, bounded variants, memory inventory/disposal.
- `arcade/snake-next/d2/fixtures.js`: validated straight/directions/90/U/S/parallel/stress scenes and safe long-body tracks, using existing arena/state APIs.
- `arcade/snake-next/tests/d2.test.js`, `tests/d2-browser-qa.js`: invariants and real-browser captures/metrics.
- `grib/mushroom-snake-d2-proof/`: only independently generated proof art, provenance/asset manifest; no concept extraction.
- `docs/mushroom-snake-d2-proof.md`: measured results, screenshots, caveats and final review gate.

Do not replace `production/renderer.js`, `production/assets.js` or existing DEV entries. If runtime reuse needs injection, modify only `runtime/training.js` to accept an optional renderer factory defaulting to existing `DevRenderer`; pin unchanged default behavior with tests. Prefer a D.2 adapter using existing APIs if no hook is needed.

### Task 1: Canonical anatomy and material proof

**Files:** Create `d2/geometry.js`, `d2/material.js`, `tests/d2.test.js`, `d2/fixtures.js`.

**Interfaces:**
- Consume existing `BodySnapshots.reset/capture(state)` and `ContinuousBody.build(snapshots,width,alpha)` / `point(distance,out)`, unchanged.
- `D2Geometry(capacity).build(snapshots,width,alpha) -> this`: reusable contour/route buffers, head/tail/tangents, count; exposes `point(distance,out)` and corridor membership for tests.
- `D2Material(seed,capacity).capture(snapshots)` updates travel/material anchor only on accepted canonical moves; `visibleAccents(geometry,bounds,lod,out)` writes bounded reusable records. `reset()` only on a new review run.
- `createD2Fixture({shape,length,direction,speed}) -> {rules,arena,stateOptions,commands,visuals}` uses existing constructors; shapes include straight/90/U/S/parallel/stress. Long tracks are validated non-self-intersecting routes, not forced invalid state mutations.

- [ ] Write failing Node tests: `sharedPhaseAllAnatomy`, `turnCorridorContainment`, `growthKeepsTerminalContinuous`, `materialAnchorSurvivesGrowthResize`, `mushroomCaps`, `parallelLaneClearance`, `lodPreservesGeometry`.
  Assert all directions and α `[0,.125,.25,.5,.75,.875,1]`, lengths `[8,30,100,250,500,1200]`; endpoints equal canonical sampled endpoints; all values finite; no contour escape into unoccupied corners; body core width 0.68 cell; non-terminal plain parallel lanes retain ground separation. Same snapshot/α yields identical geometry regardless of LOD/DPR.
- [ ] Run `node --test arcade/snake-next/tests/d2.test.js`; confirm missing-module/test failures before implementation.
- [ ] Implement buffers/contour and bounded sparse material anchors. Do not use `index % N` body stamps, per-frame random placement, per-segment shadows or separate endpoint interpolation. Stable anchor derives from accumulated authoritative travel, not camera/frame/resize. Clamp fine accents at close lanes and taper.
- [ ] Run D.2 + existing foundation/presentation tests; require all pass and state hashes unchanged for identical seeded command replays.
- [ ] Inspect exact diff and checkpoint only task files: `feat(snake): add D2 canonical anatomy proof`.

### Task 2: Proof-only art, resource gate and Forest composition

**Files:** Create proof art/provenance, `d2/resources.js`, `d2/forest.js`; extend `tests/d2.test.js`.

**Interfaces:**
- `D2Resources.load(manifest) -> Promise<resources>` deduplicates URL fetch/decode; `get(id)` returns decoded image; `inventory() -> {images,backings,ground,variants,duplicates,totalBytes}`; `dispose()` releases owned references/caches.
- `D2Forest(resources,seed).prepare(arena,visuals)` builds immutable visual recipes from existing topology. `draw(ctx,bounds,clock)` culls cached ground/props; `dispose()` frees caches. No writes to arena or gameplay state.
- `visuals` contains explicit category/position/footprint records. COLLISION maps only to existing `arena.blocked(cell)`; DECOR never participates in collision. Positive/negative/portal are minimum **visual representations**, not new effect/portal mechanics.

- [ ] Write tests `decodeDeduplicates`, `decodeFailureIsVisible`, `boundedForestCache`, `colliderArtMatchesTopology`, `decorDoesNotMutateCollision`, `seededCompositionsStable`, `memoryInventoryNoDoubleCount`.
- [ ] Run tests and confirm failures, then generate art independently via built-in ImageGen: top-down four-way head/neck studies suitable for integration; restrained moss/leaf accents; Magical Seed; positive/negative/portal; collision rock/root/stump; low flat decor; quiet Forest material variations. Generate separate purpose-built sprites/tiles, not a sheet to cut from concepts. Inspect visible alpha bounds/pivots/material/light before acceptance.
- [ ] Implement URL-keyed load/decode gate and bounded resource owner. No eager app-wide preload. Use atlas packing only if useful; no retained originals plus duplicate downsample/atlas copies without accounting. No 2× full 2K biome atlases.
- [ ] Implement macro variation and authored-looking deterministic clusters; cache static majority; cull/recycle chunks; reserve clear routes around Snake/food. Provide recognizable rooted portal, open positive and closed angular negative; no color-only classification, rings or blur.
- [ ] Verify asset manifest/hash/dimensions, no missing art substitutes, collision/decor tests and mobile inventory ≤56 MiB preferred / ≤64 MiB hard after accounting for all owned raster resources.
- [ ] Inspect exact diff and checkpoint task files: `feat(snake): add D2 Forest proof art and resource gate`.

### Task 3: Playable DEV route, unified renderer and controls

**Files:** Create `d2-review.html`, `d2/review.js`, `d2/renderer.js`; optional factory hook in `runtime/training.js`; extend tests.

**Interfaces:**
- `D2Renderer(canvas,capacity,resources,options)` provides existing renderer contract `resize(width,height,dpr)`, `draw({snapshots,arena,food,alpha,dt,resetCamera})`, plus `setView({lod,grayscale,debug})`, `inventory()`, `dispose()`.
- `D2Review(root).start({shape,length,speed,stress})`, `.pause()`, `.resume()`, `.stop()`, `.summary()`; input/clock/state use existing foundation. `setView` is presentation-only.
- Test-only `window.d2QA` is enabled by `?qa=1`: `scene(options)`, `phase(alpha)`, `captureMetrics(frameCount)`, `inventory()`, `geometrySummary()`. It sets valid DEV fixtures/shared phase, never runs in public game entries.

- [ ] Write tests `viewDoesNotWriteState`, `defaultRuntimeRendererUnchanged`, `lifecycleOneOwner`, `loadBeforeCanvasReveal`, `stopReleasesResources`; run and confirm initial failures.
- [ ] Implement one transform/one silhouette/material/face solution. Clip surface to contour, avoid double neck silhouette; one coherent shadow silhouette, no realtime blur. Small LOD: cream/broad moss/readable eyes; large LOD adds selective detail. Foreground never hides categories. Render/performance samples use bounded buffers.
- [ ] Add manual controls: keyboard/D-pad play, length 8/30/100/250/500/1200, safe speed options through existing rules, U/S fixtures, stress, grayscale, auto/small/large LOD, collision/debug bounds, pause/resume/restart/fullscreen. Debug off by default. Track modes have explicit manual/fixture-automation ownership; user input must not fight an auto command stream.
- [ ] Keep proof controls outside safe gameplay area, mobile landscape touch targets ≥44 CSS px. Preserve existing grid/camera behavior. Restart/scene change tears down old timers/RAF/listeners/resources before one new owner starts.
- [ ] Run foundation/presentation/D.2 tests, then a targeted Playwright smoke for loading → play → growth → pause/resume → scene switch → resize/fullscreen → stop/reopen. State hashes with presentation toggles must match baseline.
- [ ] Inspect exact diff and checkpoint task files: `feat(snake): expose playable D2 Forest review route`.

### Task 4: Native-scale visual, memory and timing evidence / stop gate

**Files:** Create `tests/d2-browser-qa.js`, final measured report; captures under `.playwright-cli/d2-proof/` (not concept outputs).

**Interfaces:** QA invokes `window.d2QA` only on isolated `d2-review.html?qa=1`; CDP CPU throttling is test-only. Report has per-case `{viewport,dpr,length,lod,cpuRate,p50,p95,max,spikes,memory,errors,failures}`.

- [ ] Add failing browser assertions for 4 facing directions, straight/90/U/S/parallel lanes and growth at fractional interpolation. Capture α `.125/.5/.875` close-ups head→neck and taper→tail from actual renderer, not independent art. Programmatic corridor/alpha checks plus visual inspection must agree; don't call a still-image assertion a motion proof.
- [ ] Run Playwright CLI on desktop embedded/fullscreen, mobile 844×390 and 915×412, DPR 1/1.5/2. Capture lengths 8/30/250/1200, all directions/turns/growth/parallel/stress/grayscale; test 100/500 in geometry/perf matrix too. Capture short moving sequences for junctions and stable surface identity, not only paused snapshots.
- [ ] Measure render wall time on real RAF after ≥120 warmup frames, ≥600 measured frames per length 8/100/250/500/1200: desktop CPU×1 and mobile viewport CPU×4. Report p50/p95/max, >4/>8/>16.7 ms counts; separate cold decode/cache insertion/resize from warm render. Restore CPU×1 afterward. Do not reuse simulation-only benchmark as render evidence.
- [ ] Inventory decoded images (`naturalWidth×naturalHeight×4`), canvas backing stores, cached ground/variants, retained atlases, duplicate resource IDs before/after scene switch and reopen. CPU+GPU retained copies are separate estimates where browser internals are unavailable; report measurement limitations. Track ≤56 MiB preferred, ≤64 MiB hard; missing ownership data is not a PASS.
- [ ] Review normal/grayscale/mobile category recognition, no false collision decor, head/body light match, tile/stamp repetition, neck/tail gaps/double thickness, shadows, stage safe areas. Inspect captures personally. Human one-second categorization and final Direction D quality approval remain the user's gate.
- [ ] If a target fails: reproduce/evidence/profile → smallest scoped fix → repeat affected case + smoke. If quality or ≤4 ms/64 MiB remains unattained, report FAIL/deviation and stop; no unapproved GPU rewrite or gameplay compromise.
- [ ] Run existing foundation/presentation plus D.2 tests; confirm protected paths/manifests unchanged and console/game-asset failures/404 zero. Review only exact D.2 changes/assets/docs; never stage old release directories or unrelated untracked files.
- [ ] Save final report and review URL `http://127.0.0.1:<local-port>/arcade/snake-next/d2-review.html`; create final checkpoint commit. No push/build-channel manifest update/deploy.
- [ ] **STOP:** request human visual review. No additional biomes, ranked/full VFX or Phase 3B until separate approval.

## Execution handoff

This plan is ready for human review; no D.2 code/assets exist yet. Recommended execution: **Native**, directly in this chat, because geometry/material/fixture interfaces are tightly coupled and the proof is isolated. Review and confirm this plan before implementing; keep the user's final visual approval as a separate stop gate after measured proof.
