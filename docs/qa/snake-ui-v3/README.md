# Snake PRODUCT UI V3

Starting HEAD: `14eeb95` (current checkout, no rollback/reset).
Published TEST at start: `2.15.33-eaf73478e2df`; Snake runtime: `snake-next-6822599860b1`.
Source: https://rytni.live/testpodari and supplied Screenshot_1…11.

Scope: product UI / art / responsive presentation only. Simulation, Smooth V4, effect skins/mechanics, FIT WORLD/collision, progression, ranked contracts/SQL and Fly stay unchanged.

Plan: capture live baseline → author native PNG slices/buttons/icons/cover/result hero → replace product presentation component/layout system → fill unavoidable square-grid fullscreen remainder with an intentional cabinet rail → native desktop/mobile visual gates and functional smoke → canonical TEST-only publication → real live comparison → stop for human visual review.

Initial causes visible in source: complete `button-play`/danger images are sized to unrelated aspect ratios; a crest baked into the board-frame's stretching top edge deforms; layered CSS contains fixed maxima and tiny short-stage labels; a square-cell cabinet has unavoidable surplus fullscreen height but no authored lower shell; leaderboard and attempts are squeezed instead of deliberately switching layouts.

Implemented: native sliced panels/capped buttons,20 authored48px icons, state crests, premium cover/result hero, dedicated Main plaques/compact composition and product-only lower rail.

Review: `http://127.0.0.1:8775/docs/qa/snake-ui-v3/review.html`. Architecture/provenance: `ART.md`; scoped verification: `QA.md`; exact54-PNG inventory: `grib/mushroom-snake-ui-v3/inventory.json`.

Candidate before publication: `2.15.33-a10ca16878b7`, runtime `snake-next-958664f591a6`.61 targeted Node tests;362 native,112 desktop-container,107 mobile-container and40 host functional assertions. Production/Fly/860 locked files unchanged.

Final TEST: `2.15.33-a67c23267bc6` / `snake-next-3b755d3f0351`. A post-publication exhaustive byte audit caught Git newline normalization of UI inventory metadata; assembler now freezes LF before hashing, regression test added (62 total). UI/gameplay/PNG bytes did not change. Final LIVE112 desktop/107 mobile, dual-CDN431-file byte/MIME audit and canonical live deployment check PASS. See `REPORT.md`; `review.html` now defaults to final LIVE captures.
