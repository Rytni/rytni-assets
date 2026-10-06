# Snake Next TEST / Fly interaction parity

Task base: `2c7a6d4`; functional product base: `9656138`.

- Local product: http://127.0.0.1:8775/arcade/snake-next/product/index.html
- DEV Lab: http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html
- Paired visual review: http://127.0.0.1:8775/docs/qa/snake-test-parity/review.html
- Target TEST: https://rytni.live/testpodari

Current candidate: `2.15.33-eaf73478e2df`; immutable runtime: `snake-next-6822599860b1`. Deployed rollback retained: `2.15.33-451886dbbce4`. Publication acceptance is recorded separately in QA.md; a local build is not a deployment.

## Changes

Snake keeps its approved artwork and gameplay. Main is a bounded 16:9 scene; other states use compact 560 / medium 680 / large 860 / result 760 CSS-pixel maxima, fixed actions and internally scrolling content. Buttons are at least 48px and close controls 48×48. Fullscreen and tiny/portrait stage adaptations are part of the same geometry system. Current Fly has later width overrides, documented in FLY_UI_PARITY.md; the explicit requested Snake maxima take priority.

The TEST Hub now mounts the existing Snake Next product in an immutable iframe instead of appending legacy Snake v2. Each opening starts at Main. Source/origin/channel-authenticated messages own close, game switching and fullscreen fallback; shutdown removes the iframe and its timer/RAF/audio owner. Legacy source and releases are retained. Fly is delegated to its current implementation without editing that block.

Static packaging records the exact module/art/audio closure, hashes and sizes. Source inspection follows static imports, HTML references and literal `new URL(..., import.meta.url)` dependencies. Runtime validation fails closed on missing/tampered/stale files. Deploy permissions cover only the active, individually hash-verified candidate files, not an arbitrary directory wildcard.

The product accesses the existing TrainingGame through an exported binding, not a QA global. Initial TEST URLs expose no product QA controls. Resuming settles the menu and game viewport before restarting the unchanged fixed clock, so layout/raster preparation is not gameplay debt. Internal iframe focus no longer masquerades as page focus loss.

## Backend boundary

**BACKEND NOT APPLIED.** TEST attempts, sponsor credit, rank, top-ten and submitted results are isolated in-memory preview data. No Snake action calls Fly ranked/sponsor RPCs or modifies production accounts. Training remains unlimited. The small TEST label is intentional; these are not real seasonal results or rewards.

## Exact source changes

- `arcade/assemble-snake-next.cjs`, `arcade/test-snake-next-package.cjs`
- `arcade/snake-next/test-host.html`
- `arcade/snake-next/product/{app,bridge,controller,ui}.js`, `controller.test.mjs`
- `arcade/snake-next/product/{index,frame}.html`, `frame-runtime.js`
- `arcade/snake-next/product/{host-bridge.js,host-bridge.test.mjs,parity.css}`
- `arcade/snake-next/forest-training/runtime.js`: exported binding only
- `arcade/snake-next/progressive-run/adapter.js`: module-relative stylesheet URL
- `tools/{build_tilda_test,test_tilda_test,deploy_tilda_test,test-deploy-guard,test-snake-runtime-deploy-guard}.ps1`
- `tilda-test/README.md`, this QA/review directory
- Generated `giveaway-test/manifest.json`, selected app release and exact immutable runtime closure are publication outputs, not hand-edited application code.

No Production, Fly source, simulation/collision, Smooth V4 geometry, food policy, world dimensions, balance or art changes. Daily Challenge/King are not added. No Supabase migration execution.
