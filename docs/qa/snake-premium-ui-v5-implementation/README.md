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
- Functional local flows: Main/Guide three tabs/Settings volume+mixer/quality/mute, Training, Pause, restart/exit cancel and confirm, Resume, Ranked mock seed, Result→Main, clipboard share, one-attempt/sponsor/no-attempt/error/empty-board states. Native OS share UI is not automated; unchanged navigator.share routing is retained.
- Real TEST host with local candidate override: **888 checks** across four fresh contexts. Desktop embedded/fullscreen; mobile landscape fullscreen/D-pad; real Training→Pause→Settings→Confirm→Resume→Result; Guide; TOP10; game switching; Fly Training/Pause/Result smoke. No new console errors, failed assets or Fly ranked RPCs. Baseline anonymous auth-health401 is recorded separately in `candidate-qa.json`.
- Canonical TEST build/loader verified504 immutable files. Candidate release `2.15.33-b6f68b158ca0`, runtime `snake-next-5259c7bef436`. Rollback is published V4.3 `2.15.33-1a9ac1a0018c` / `snake-next-480660bcb2d8`.

One historical `ribbon-live.test.mjs` source-pin assertion still expects Motion86379ba, predating the approved Tunnel changes. It fails against the unmodified current Motion file; this pass does not alter it or relax that historical gate. Current appearance tests and protected-source diff confirm no gameplay/geometry changes.

Production (`giveaway/`), Fly source, backend/SQL, app/controller/backend/gameplay/simulation/progression/portal/audio/D-pad are unchanged against95163e3. No production ranked calls are introduced; existing TEST scores remain mock demonstration data.

TEST publication and final LIVE evidence: pending canonical publish and verification.
