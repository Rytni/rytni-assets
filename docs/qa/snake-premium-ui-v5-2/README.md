# Premium V5.2 — targeted UI polish + isolated DEV effects

Base: `c9421dc` (current V5.1 source), published TEST `2.15.33-4f26b949910b`. No rollback or new art direction.

## Fixes and evidence

1. Full Ranking TOP‑3 combined `height: 11cqh` (82/88px compact) with flex children that could shrink and a horizontally ellipsized name. Its safe line budget was not guaranteed at the actual font/zoom. V5.2 uses a nonshrinking name, explicit `1.45` line height, 3px bottom padding, and intrinsic podium height (minimum 100/94px). Measurements run after `document.fonts.ready`: five required names, 100/125% content zoom × DPR 1/1.5/2, plus actual embedded host. Overflow remains solely for horizontal ellipsis; the vertical safe line is not cropped.
2. TEST host's far-left button + far-right long TEST label becomes a navy/violet player header. Safe back-button inset 19px measured; avatar 36px when an actual visible profile avatar exists. Same authoritative `currentApplication` as Fly: name, level, points, `rank_name`/top status. Unknown fields hidden; participant number is not misused as leaderboard rank. Text uses `textContent`, no name HTML interpolation. The profile illustration is explicitly a TEST-only QA fixture, not hardcoded runtime data. Tiny TEST chip is confined to the TEST host source, not product/production.
3. Attempts retain their original counters and token semantics. Headings now `ЕЖЕДНЕВНЫЕ` and `ОТ СПОНСОРА`, equal columns with a safe gap. The actual ~720px site aperture requires a wider local plaque than 844px fullscreen; the ≤800px rule reserves sufficient heading space rather than reducing font below 14px.
4. One `RecordPlaceValue` component, no fullscreen branch: after fonts + on stage ResizeObserver, measure rendered Range width against the circular safe center. Choose from 26/24/22/20/18/16px. If 16px cannot fit, attach a restrained dark-glass/brass plate with readable type. Equal circles replace the inherited 1.8:1 column bias. All 8 scores × 5 ranks × 4 viewports × embedded/fullscreen checked. Render-only stress never changes ranked data/backend.
5. Settings inherited a 26/32px content inset while the metal edge was 48px; icons could enter its structural aperture. New explicit grid and 48px panel inset (+4px body safety), 40px compact (+4px), preserve 48/40px icons. Legacy row separator/backing/pseudos are removed, not hidden by z-index.
6. Old `.setting-title .btn` green background and plain tabs are overridden only in Settings by smoked dark glass/metal, brass rim, inset shading, restrained active emerald and a tiny indicator. Actions/volume/settings persistence unchanged.
7. Secondary shortcuts are one flex-column control with shared width, static centered label, centered plate pseudo. Actual icon/label center deltas: 0 CSS px at targeted embedded/fullscreen sizes.
8. New appearance proof is DEV ONLY. All 9 singles, three requested pairs and a 2+1 stress stack at Desktop30/Mobile30/Mobile50. Minimum base unchanged RGB fraction ~91%; alpha difference exactly 0. Face/red-cap overlays and moss exempt; Mist/Roots never recolor. Guard shell / break / interaction quality still requires human review. **Existing TEST effect presentation is unchanged.** No effect replacement is imported into the immutable runtime.
9. Fly known-clean `grib/mushroom-snake-ui-v4-1/fly-cover.png`: 1536×1024, SHA256 `66bb95fb7bdd815770a1a4a36fbb718f4cef5e3474ae76e86f247c706580e7df`. Its 3:2 image inside 16:9 `object-fit:contain` exposed the green container. `cover`, focal `50% 50%`, fixes it without stretching or any PNG/Fly-game edit. Actual rendered box: ~325.125×182.875 CSS px (actual 1920 host); all four viewports in `host.json`. BEFORE is the same card/source with the old contain rule temporarily restored in QA.

## QA

- `node docs/qa/snake-premium-ui-v5-2/run.cjs after`: 346 targeted checks, zero failures/errors (font-ready, value matrix, Settings, centers, zoom/DPR).
- `... run.cjs host`: 33 checks, four actual TEST-site contexts with local candidate routing; no new errors or asset failures. Embedded main/stress/ranking/settings, data omission/population, Fly card, Arcade return.
- `... run.cjs flows`: 442 existing host-flow checks at 1366×768 and 844×390: embedded/fullscreen, Training/pause/settings/result, guide tabs, TOP10, D-pad, host exit and Fly Training/Pause/Result. Zero failures, no Fly ranked RPC calls.
- `... run.cjs effects`: 86 checks, 42 native gameplay-size crops; primary alpha exact, ≥80% (observed ≥91%) original RGB, pause byte-stable, tick-driven motion. No production effect gate claimed.
- Unit tests: V5.2 / V5.1 / V5 art identity, controller, host bridge and DEV material. Canonical bundle validator and TEST deployment guard.
- Viewports: 1920×1080, 1366×768, 1280×720, 844×390. Zoom testing uses explicit CSS content zoom 1/1.25 crossed with actual deviceScaleFactor 1/1.5/2; it is not claimed as a physical browser toolbar interaction.
- Existing `/auth/v1/health` 401 from site diagnostics is recorded separately (`baseline`), not a new Snake/asset error. No scheduler recovery was needed in the targeted 442-check run.

## Publication / safety

UI-only candidate: `2.15.33-bc52be687115`, Snake runtime `snake-next-8d3f1e254a4b`. Rollback points to the actually published V5.1, not an intermediate local build. Canonical build → test → CheckOnly → Publish; LIVE evidence recorded separately in `live.json` after publication.

Production `giveaway/**`, Fly game block, backend/SQL, gameplay scheduler/simulation, Smooth V4, FIT WORLD, scoring/collision/expansion and approved art are unchanged. TEST still uses deterministic demo ranking; this pass does not activate backend contracts. All source changes and exact release artifacts use explicit staging; pre-existing untracked files are preserved.

## Changed source

- `arcade/snake-next/product/{app.js,index.html,ui.js,ui-v5-2.css,record-place-value.js,ui-v5-2.test.mjs}`
- `arcade/snake-next/test-host.html`
- `arcade/snake-next/effect-appearance-v5-2.html`, `effect-appearance-v5-2/{material.js,review.js,material.test.mjs}` (DEV only)
- This review/QA directory and `docs/qa/snake-v5-2-effects/`.
- Generated TEST manifest and exact immutable candidate closure, not hand-edited app bundles.

Final human visual review remains required. Effects are explicitly held out of TEST.
