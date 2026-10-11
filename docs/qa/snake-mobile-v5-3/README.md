# Mushroom Snake Mobile V5.3

Base: `e8b7c7e` (published TEST V5.2.1). Desktop Premium V5 remains locked.

## Diagnosis, not a physical-device claim

`diagnosis-before.json` and `diagnose.js` reproduce two old software mechanisms:

- nested TrainingGame `window.blur` unconditionally paused an otherwise valid landscape/pseudo-fullscreen run;
- Product `resize` immediately paused and opened the gate if fullscreen-state was temporarily missing.

An ordinary emulated D-pad pointerdown did **not** pause. No physical Android/Yandex event trace or new screenshot files accompanied the latest request. Therefore the exact physical D-pad → Pause cause is not yet proven. The QA-only journal must identify it on the next phone review. Do not present software reproduction as physical approval.

## Lifecycle/input

Product-only lifecycle adapter confirms portrait/fullscreen exit after 180 ms. During an invalid-state settle the canonical clock is held, interpolation frozen, no elapsed-time debt accumulated, then either safely resumed or paused. Valid landscape height-only changes are presentation-only. Mobile blur without hidden/portrait/fullscreen loss is ignored; actual hidden page still pauses. Host fullscreen-state is not mislabeled host inactivity; shutdown remains host-owned.

D-pad capture uses immediate pointerdown, preventDefault, stopPropagation, pointer capture, isolated click handling. Four independent 64×64 hit regions are fixed at 12 px + safe area in the bottom-left. One authored emerald/brass object, no generic square arrow art.

Mobile Play/Training requests fullscreen from the user activation path before audio/assets/backend awaits, then attempts landscape lock. Portrait never spends. Pending starts continue on valid landscape; resumed runs require explicit action. Cancellation invalidates pending requests using existing controller guards.

## UI ownership / CSS audit

`ui-mobile-v5-3.css` and `controller.layout` derive layout from the actual product cabinet and touch capability, not outer Tilda dimensions. Three classes: desktop, mobile-portrait, mobile-landscape.

- Main: logo → Play/Training → hero → shortcuts → compact controls → one two-row status panel. No desktop TOP3.
- Sound: real master/music/sfx sliders, numeric values, mixer bridge and existing device persistence. Game: quality/fullscreen only. Fixed header/tabs/footer; content-only scroll.
- Ranking: full-width #1, #2/#3 two-column row, 4–10 scrollable list, fixed own rank/record/footer.
- Guide: single parchment surface, normal Russian wrapping, fixed tabs/footer; desktop two-page book untouched.
- Gameplay is landscape-only; existing approved landscape Pause/Result art retained.

Historical `product.css`, `ui-v3.css`, `parity.css` portrait selectors are not loaded by current `index.html`; they were not blindly deleted. Loaded `ui-v4.css` portrait cabinet aspect-ratio/max-height conflicts are overridden only by explicit V5.3 mobile class. Inherited `manual-book::after` spine, desktop page padding/min-height, compact hidden book headings and podium placement are explicitly neutralized in the mobile composition. Concept screenshots exposed and confirmed these conflicts before integration.

## Art provenance / internal concept gate

ImageGen built-in created the three-concept transparent D-pad sheet and extracted the center diamond into a separate transparent asset. Prompt: three top-down coherent controllers, smoked dark metal/aged brass/deep emerald enamel, rounded cross/diamond/angular cross, no text/foliage/mushrooms/generic square buttons. Second prompt extracts only the center unchanged. `export-art.py` resamples only; no painting or alpha edits.

Final runtime asset: `grib/mushroom-snake-ui-v5-3/dpad.png` (384×384, displayed at180×180). Concept sheet: `dpad-concepts.png` (540×180). The remaining named concept files are real HTML/CSS previews using approved existing art, captured before enabling default mobile routing. First concept review corrected book spine and podium order, then reviewed revised native images.

## Verification / limits

See `mobile.json`, `stress.json`, `desktop.json`, `review.html`. Emulation is not physical Android/Yandex approval. Input burst isolates input at live status with clock held; toolbar/orientation tests run the real canonical clock. No invulnerability, collision patch, autoplay-fun claim, or score injection is used. Ranked preview uses existing memory-only backend; no production RPC/SQL.

## Final TEST candidate / checkpoints

- `8635618`: dedicated mobile implementation and targeted review package.
- `395c847`: first TEST candidate; superseded after LIVE revealed a late stylesheet restoring D-pad arrow glyphs.
- `ef28b98`: final D-pad isolation and refreshed local evidence.
- `e97cbff`: final TEST publication, explicitly authorized by the human after local gates passed.

Final release: `2.15.33-8ef02a9595f7`; runtime: `snake-next-b24aac6a1150`. Rollback: `2.15.33-f2842dc8be63`. Final LIVE host run has 22/22 checks with no new errors, including empty D-pad text and four 64px hit regions after late styles load. `live.json` names the exact release/runtime; LIVE captures in this review were refreshed from that final runtime, not the first candidate.

Both Pages and S3 passed final acceptance: manifest IDs, bundle SHA/size, runtime manifest SHA and all 12 changed runtime files match. Evidence: `public.json` (`pass:true`).

- Human TEST: https://rytni.live/testpodari?arcade_preview=1
- Phone pause journal: https://rytni.live/testpodari?arcade_preview=1&qa=1
- Local review: http://127.0.0.1:8776/docs/qa/snake-mobile-v5-3/review.html

Production manifest SHA256 remains `0c1de483bc275877e9c76b3ddcc187df1cf1eb9a42eb215fbea18d404d9a4591`. Production, Fly, gameplay geometry, V5.2 effect candidate and backend contracts are unchanged. STOP for physical Android/Yandex review; emulator success is not phone approval.
