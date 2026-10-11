# Mushroom Snake Premium V5.3.1 — Product ownership + status board

Scope: exactly two fixes, based on `89abbe0` / TEST `2.15.33-8ef02a9595f7` / runtime `snake-next-b24aac6a1150`. TEST-only; physical Android/Yandex acceptance is pending.

## Review entry points

- [LIVE TEST](https://rytni.live/testpodari?arcade_preview=1)
- [Physical trace mode](https://rytni.live/testpodari?arcade_preview=1&qa=1)
- [Visual review](review.html)
- [Targeted QA](QA.md)
- [Status-board art provenance](ART.md)

Final candidate: `2.15.33-c77364482deb`, runtime `snake-next-3efbc8cbe51b`. Publication and LIVE acceptance are recorded in `public.json` and `live.json` after verification. Source/publication checkpoints will be recorded below.

## 1–4. Input/lifecycle architecture and recovery

Previously, the child `TrainingGame` constructor installed root click/input, keyboard, D-pad pointerdown/release, resize/fullscreen, visibility, blur and pagehide listeners. ProductBridge then installed a second D-pad handler and another routing/lifecycle layer. Child resize could decide portrait Pause; child RAF converted FixedClock recovery into Pause. The parent could simultaneously apply its own fullscreen/orientation policy.

Now `frame.html` declares `data-runtime-mode="product"` before construction (also requested with `?mode=product`). Standalone remains the default. In Product mode:

- Legacy root click/input, keyboard and D-pad listeners are not registered.
- Legacy blur/visibility/pagehide pause/dispose listeners are not registered.
- Child resize/fullscreen listeners remain presentation-only. Child portrait start/resume/pause guards are standalone-only.
- `installProductInput` is the sole effective direction owner: capture pointerdown → preventDefault/stopPropagation/stopImmediatePropagation → pointer capture → one command. Product also owns keyboard/HUD routing.
- ProductBridge reports child blur/resize/fullscreen events without independently pausing. Child visibility/pagehide delegates to parent policy. Parent owns hidden, settled portrait/fullscreen exit, host exit and navigation. Transient blur/browser-chrome resize cannot choose Pause.
- Product uses its own timer policy with the unchanged FixedClock. A rejected recovery wake rebases with `clock.resume(at)`, drops debt and synthesizes no canonical ticks. Standalone keeps its old recovery Pause policy.

The old immutable V5.3 software witness (`before-scheduler.json`) reproduces touch + 150 ms main-thread stall → `scheduler-recovery` → Pause. This mechanism **could** explain the phone symptom; it does not prove the exact physical-phone cause without a device trace.

**Architecture now has one Product input/lifecycle owner; all legacy child pause/input paths are disabled or delegated in embedded Product mode.**

## 5–7. Touch/stall evidence

800 real emulated-touch taps: 300 normal, 300 rapid alternating, 100 viewport-height variations, 100 immediately followed by 100/150/250 ms busy-loop stalls. 800 pointerdowns → 800 commands, 100 recoveries, 0 unexpected/scheduler Pauses, 0 double enqueue, 0 horizontal movement/fullscreen loss. Every injected recovery preserves canonical hash/tick and resets debt to zero. Actual/expected command replay hashes agree (`defad4d9`). These are browser-emulation results, not physical Android approval.

## 8–10. Visual evidence

- [Actual embedded host, 720 px cabinet](host-1366-main.png)
- [Same compact scale, 99 999 999 / №9999](desktop-720-stress.png)
- [Mobile Main](390-main.png), [Settings](390-settings-sound.png), [Ranking](390-rating.png), [Guide](390-guide-basics.png)
- [Gameplay / physical trace button](mobile-trace.png)

The desktop Main now has one specifically authored nine-slice board, four intrinsic Grid/Flex blocks, no internal absolute text or detached fallback plaques. It uses two rows when space is limited; four columns only when its own content width reaches 620 px. One permitted 10 px upward hero spacing correction applies only at cabinet ≤800 px wide and ≤480 px high; hero dimensions/art and other approved anchors are unchanged. Mobile V5.3 source/layout remains unchanged.

## Physical-device gate

Open trace mode → Arcade → Snake → Training → landscape fullscreen. Tap directions, alternate quickly, let browser chrome change, then rotate out/back and resume. Confirm no input-triggered Pause. If it still pauses, tap **COPY INPUT TRACE** immediately and paste the JSON. The 300-event journal includes parent/child viewports, visibility/fullscreen/host state, pointer source, pause reason, recent D-pad correlation and scheduler gaps. It persists at lifecycle boundaries and Copy, not on the input/recovery hot path. Diagnostics are absent from normal UI.

## 11–14. Release, checkpoints and protected closure

- Candidate release: `2.15.33-c77364482deb`.
- Runtime: `snake-next-3efbc8cbe51b` (517 immutable files).
- Source/publication/final report checkpoints: pending final publication steps.
- Production manifest SHA256 remains `0c1de483bc275877e9c76b3ddcc187df1cf1eb9a42eb215fbea18d404d9a4591`.

`closure.json` verifies exactly 13 changed runtime files. Canonical simulation/input, Smooth V4, FIT WORLD, portal/history, progression/food, appearance V5.2, controller/backend, mobile UI/CSS/D-pad art and Fly are unchanged. No SQL or Production publication. Effect appearance V5.2 remains DEV-only. Old RecordPlaceValue source is retained but is no longer a runtime dependency.

STOP for physical Android/Yandex human review after verified TEST publication.
