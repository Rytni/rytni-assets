# Premium UI V5 implementation

Approved static art: `95163e3`. Runtime reference: published V4.3. This implementation promotes **26 individual masters byte-identically** into `grib/mushroom-snake-ui-v5/`; provenance, native dimensions and hashes are in that family's `inventory.json`. No flattened concept enters runtime. Historical static-art approval metadata is left intact.

## Composition

Main uses normalized 1920×1080 anchors from `composition-metrics.json`: identity/hero/account objects left, primary actions and three object controls center, small physical TOP-3 right. Below 1000 host px, mobile/compact Main keeps the account objects, large Play and 48 px icons; Rating remains a separate reachable screen. The existing forest is retained, without a new global dark filter. Local smoke gradients isolate text/actions only.

Result is an independent full-scene region, never a panel/modal. Large original hero, dominant score, three authored physical stat objects, compact canonical supplemental stats and original action routing. The 844×390 layout has dedicated anchors and safe-area insets. Ranked accepted, record, failed submission and Training remain distinct; share is available only for accepted results.

Ranking uses the approved wide smoked-glass/brass master, physical trophy objects, TOP-3, escaped backend-ordered rows4–10, own row and fixed summary/Back. Only rows4–10 can scroll. Guide's book construction and gameplay icons are unchanged; general navigation now uses V5 masters. Settings/Pause/confirmation retain their geometry with glass material. Existing seamless button caps/center and optical baseline are retained.

Twelve premium utility masters are normal anti-aliased raster PNGs: 64 px when space permits, 48 px compact; separate physical control backing. No SVG redraw or new foliage. Motion is a bounded fade/settle with reduced-motion support.

## Review and targeted gates

[Approved concept ↔ runtime](review.html) pairs Main1920/1366, Result1920/1366/mobile, Ranking and all twelve utility icons at actual64/48px. Right-hand result215 images are explicitly deterministic local review fixtures, not live ranked scores. Real candidate-host Training captures contain the actual Training result.

- Product tests: **61 passed** (`node --test arcade/snake-next/product/*.test.mjs`). Updated only obsolete icon-path/disclosure expectations; data escaping, backend order, retry/share, counters and seed checks remain.
- Immutable package tests: **11 passed** (`node arcade/test-snake-next-package.cjs`).
- Appearance tests: **9 passed**, including alpha/hash/pause/portal invariants. No renderer/material/simulation files changed in this pass.
- Local browser: 44 fit checks across1920×1080,1366×768,1280×720,844×390; score99,999,999/rank9999; zero document overflow, off-stage controls or sub44px actions. Ranking row10 remains reachable. Zero page errors/failed resources.
- Numeric text-range clipping: **30 passed** at1920/1366/1280/844/720 host widths, scores0/99999/99999999 and ranks1/9999 (`number-qa.js`). This checks actual text bounds, not only container boxes.
- Functional local flows: Main/Guide three tabs/Settings volume+mixer/quality/mute, Training, Pause, restart/exit cancel and confirm, Resume, Ranked mock seed, Result→Main, clipboard share, one-attempt/sponsor/no-attempt/error/empty-board states. Native OS share UI is not automated; unchanged navigator.share routing is retained.
- Real TEST host with local candidate override: **888 checks** across four fresh contexts. Desktop embedded/fullscreen; mobile landscape fullscreen/D-pad; real Training→Pause→Settings→Confirm→Resume→Result; Guide; TOP10; game switching; Fly Training/Pause/Result smoke. No new console errors, failed assets or Fly ranked RPCs. Baseline anonymous auth-health401 is recorded separately in `candidate-qa.json`.
- Canonical TEST build/loader verified504 immutable files. Candidate release `2.15.33-b6f68b158ca0`, runtime `snake-next-5259c7bef436`. Rollback is published V4.3 `2.15.33-1a9ac1a0018c` / `snake-next-480660bcb2d8`.

One historical `ribbon-live.test.mjs` source-pin assertion still expects Motion86379ba, predating the approved Tunnel changes. It fails against the unmodified current Motion file; this pass does not alter it or relax that historical gate. Current appearance tests and protected-source diff confirm no gameplay/geometry changes.

Production (`giveaway/`), Fly source, backend/SQL, app/controller/backend/gameplay/simulation/progression/portal/audio/D-pad are unchanged against95163e3. No production ranked calls are introduced; existing TEST scores remain mock demonstration data.

## Published TEST and LIVE evidence

- [Real TEST](https://rytni.live/testpodari?arcade_preview=1) — choose Mushroom Snake. Existing TEST/demo accounting remains unchanged.
- Source checkpoint: `186859a`; TEST publication checkpoint: `6685148`. GitHub Pages deployment `37662093338` succeeded.
- Release: `2.15.33-b6f68b158ca0`, app SHA256 `b6f68b158ca0f01e9c8b0074190a651d6df5ea68c4043fc9acccc97b89943b41`.
- Runtime: `snake-next-5259c7bef436`, descriptor SHA256 `3f959eeb47991b3ab497a653c736f9f1087e101db7d470d654762af083230deb`.
- Both CDN mirrors verified503 runtime dependencies plus the descriptor, manifest/current/rollback, hashes, sizes and MIME. A later repeat saw one transient GitHub503 on the old `settings-64.png`; the exact file retry returned200, correct6812 bytes and SHA. S3 repeat was clean. This was not hidden as a passing repeat.
- External live verifier: `TEST: OK, 2.15.33, участников=1904, S3=53, GitHub=0`.
- `live-qa.json`: **888 checks** in four fresh LIVE contexts,1920×1080/1366×768/1280×720/844×390, with zero new console/page errors, failed assets or forbidden Fly ranked RPCs. Fly Training/Pause/Result and Hub switching smoke passed. Known anonymous auth-health401 is listed separately, not represented as zero raw network errors.
- Clean decoded LIVE captures: [Main desktop](live-1920-main-fullscreen.png), [Result desktop1366](live-focus-result.png), [Main mobile](live-844-mobile-main.png), [Result mobile844](live-844-mobile-result.png). Actual Training results, not fabricated ranked records. Desktop Result100 is one collected mushroom; mobile Result0 is a separate completed Training run.
- Screenshot QA now waits for image decode and two painted frames in both nested product and host. This avoids capturing a DOM-ready Result before its pixels are composited; no runtime behavior was changed for screenshots.
- `safety-check.cjs` confirms Production, Fly, prior art, gameplay/scheduler/renderer/progression/portal/effects/audio/input/backend unchanged against95163e3.

### Explicit remaining limitation

Additional headless LIVE repeats intermittently return to Pause after Resume instead of reaching Result. Read-only instrumentation proves `clock.status=recovery`, `clock.reason=scheduler-lag`, called by the existing `forest-training/runtime.js:69` guard while focus is true and document hidden is false. A minimal repeat **without screenshots/layout queries during motion** completed two real Training/Pause/Settings/Resume/Result cycles; the third entered the same recovery pause. Therefore it is not attributed solely to capture overhead. The exact main-thread delay source and prevalence in headed human play are **not established**. Successful full LIVE runs and a clean desktop Result do not erase these failed repeats. See `scheduler-diagnostic.json`, `focus-diagnostic.js` and `resume-qa.js`; the unchanged safety pause was not disabled or tuned. Human review should include Resume. This is not an unconditional all-repeats performance/lifecycle PASS.

Final QA checkpoint is documentation/evidence only; it does not rebuild or republish the already delivered runtime. **STOP FOR HUMAN VISUAL REVIEW.**
