# Rytni Assets

## Purpose and shape

- Canonical checkout: `C:\GitHub\rytni-assets`; public static CDN for Rytni Подари images, audio, browser-game art, and immutable full-page releases.
- This is not a conventional npm app: there is no root package manifest or dev server. The TEST runtime is assembled from versioned source here and delivered through GitHub Pages.
- `giveaway/manifest.json` is Production; `giveaway-test/manifest.json` is TEST. Each selects a content-addressed `releases/<version>-<sha12>/app.html` and a previous rollback release.

## Important paths and entry points

- `grib/`, `web/`, `avatars/`, `chest/`, `sounds/`, `ui-v*/`: public asset families. `manifest.csv` is the legacy Postimg-to-GitHub-Pages mapping.
- `giveaway/` and `giveaway-test/`: channel manifests plus generated immutable release bundles.
- `arcade/09_T123_ARCADE_HUB_SNAKE.html`: Arcade Hub integration and legacy Snake slice.
- Legacy Snake v2: `arcade/snake-core.js` (DOM-free deterministic simulation), `snake-controller.js` (render/input/lifecycle), `snake-ui.html` (styles/markup), and `assemble-snake-v2.cjs` (strict composition and asset gate). It is frozen: retain it for reference/rollback, not ongoing fixes or the foundation of a new Snake.
- `grib/mushroom-snake-v2/`: Snake production art/audio; `arcade/snake-art-qa.html` is the dev asset gallery.
- Durable game behavior and UI requirements live in `docs/mushroom-snake-spec.md` and `docs/mushroom-fly-ui-spec.md`.
- `tilda-test/blocks/`: canonical TEST page blocks, including Mushroom Fly in `08_T123_BROWSER_ARCADE_2.15.34.html`; `00_T123_ТЕСТОВЫЙ_ЗАГРУЗЧИК.html` is the loader verification source. `tools/build_tilda_test.ps1` composes the eight runtime blocks plus the Snake bundle. See `tilda-test/README.md` for input order.

## Frontend, backend, and shared runtime

- Frontend is static HTML/CSS/vanilla JavaScript. Generated releases combine the site, progression UI, Mushroom Fly, Arcade Hub, and Snake.
- Generated app bundles call Supabase through RPC helpers. Database schema, migrations, and RLS are not maintained here.
- Snake reuses the existing Fly audio mixer and Hub lifecycle. Preserve one active RAF/audio owner when moving among Hub, Fly, Snake, tabs, popup close, and page lifecycle events.

## Browser-game invariants

- Keep gameplay coordinates/physics independent of canvas size, camera, DPR, resize, orientation, and fullscreen.
- Mobile gameplay is landscape fullscreen with real D-pad controls; portrait is a safe prompt/pause state. Scrollable dialogs are intentional.
- Decorative frames are nine-slice: fixed corners, axis-only edge scaling, no sprite distortion.
- Legacy performance-sensitive code: 60 Hz Snake simulation, typed ring buffer, bounded 5×5 world streaming, bounded render cache, DPR caps, and interpolation. These are legacy implementation details, not architectural requirements for a rebuild; retain long-body QA at 100/250/500/1200 segments.
- A new Snake requires a separate source entry point and independently designed simulation/render/world/spawn modules. Do not copy legacy architecture; reuse only tiny utilities independently verified safe. New production art/audio must be independently created, not extracted or repackaged from legacy assets.
- Concept images are art direction only. Never crop/reference-segment them into production assets.

## Build and verification

Run from the repository root:

- `node arcade/test-snake-core.cjs`
- `node arcade/assemble-snake-v2.cjs`
- `node arcade/test-snake-v2-release.cjs` — rendered desktop/mobile QA with screenshots.
- `node arcade/test-snake-v2-ui.cjs` — diagnostic only; not visual/release acceptance.
- `node arcade/test-snake-v2-release.cjs --live` — post-deploy TEST QA.

Browser tests use `playwright-core` and Edge from the sibling source workspace; scripts that support it accept `RYTNI_SOURCE_ROOT`.

TEST build inputs and local build/loader verification are in this repository:

- Build: `& .\tools\build_tilda_test.ps1` (writes a local candidate release and updates the local TEST manifest; this is not publication).
- Verify bundle/loader: `& .\tools\test_tilda_test.ps1`.
- The browser test scripts still require `playwright-core`/Edge from the sibling workspace until migrated; they are not build dependencies.
- Mirror/live check: `node 'C:\Codex\Rytni Gift\RYTNI_TRANSFER_2026-07-31\CORE\Сайт\tools\test_live_deployment.js' test`
- Fly regression commands: see `docs/mushroom-fly-recovery-qa.md`.

## Release conventions and protected areas

- Never hand-edit an existing `giveaway*/releases/**/app.html`; change source and create a new content-addressed release.
- Manifest SHA-256 and size must match the selected file; `previous` must reference a real rollback artifact.
- A TEST publish is incomplete until GitHub Pages and the S3 mirror expose the same manifest, followed by live QA. Production requires separate explicit authorization; verify `giveaway/manifest.json` is unchanged during TEST-only work.
- Do not commit ignored high-resolution Mushroom Fly working sources. Preserve unrelated/untracked assets and old build directories; stage exact files.
- Before publishing, run targeted tests, inspect screenshots and browser console/network failures, then verify desktop embedded/fullscreen plus mobile portrait/landscape/orientation transitions.
