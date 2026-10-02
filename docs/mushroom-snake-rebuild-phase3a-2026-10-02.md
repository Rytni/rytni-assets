# Mushroom Snake Next — Phase3A human-review handoff

Branch: `mushroom-snake-rebuild`. Base: `69f1b448a630c988b5eeb408d246b5155695da0f`.
Local entry: `http://127.0.0.1:8771/arcade/snake-next/slice.html`.
**Isolated vertical slice only. No Hub registration, release build, push, TEST or Production publication. Stop before Phase3B.**

## 1–5. Production art and presentation

1. Character: independently generated head/cream scale skin/moss + small red mushrooms. Four head orientations baked once from the original head. Body/turn/taper/pointed tail/shadow use one canonical continuous contour; no terminal body sprite underneath a tail. Menu hero is separately generated, not a gameplay crop; natural snake head, not a mushroom.
2. Neutral character QA before Forest:55 screenshots, straight/vertical/all90°/U/S, alpha0/.25/.5/.75/.999, lengths8/100/250/1200. No observed head/tail separation, double body or holes. Original foundation/snapshot/path/camera/input/scoring/simulation files unchanged.
3. Forest: quiet ground-v2, irregular rotated/phased tonal patches; deterministic fern/leaf/flower/tiny-mushroom compositions, rare24 baked fireflies per arena. Five collision families: rock/stump/root/bush/log, drawn only on existing blocked cells. Decor never writes collision. Ground and object canvases cached by immutable arena, bounded2. Final correction: rectangular obstacle backing shadows replaced by small grounded contact ellipses, baked once.
4. Food: original golden enchanted sprouting seed, not a gem; restrained pulse/glow. Food ownership unchanged; pickup SFX follows buffered visible-food transition. Review captures a real consume at tick75, alpha.999 (QA presentation freeze only).
5. UI: original background/frame/dark wood surface/logo/hero/button skin + authored pixel SVG icon atlas. Russian Main/How/Settings/Pause/Result/Restart/Loading/fullscreen prompt; ranked controls really disabled. Fixed nine-slice frame→bevel→surface→scrollable safe-area,7px bevel. Close visual35×35, transparent48×48 hit area. Short landscape content scrolls inside, not with the shell; D-pad space is retained during paused Settings/Restart.

Runtime art/audio files:29,3,150,196bytes;17 accepted raster assets, one SVG atlas,10 SFX + one music loop. High-resolution art sources remain local, not legacy sources.

## 6–8. Decode-gated loading

6. `BOOT → CRITICAL_ASSETS → MAIN_READY → GAME_ASSETS → READY`:7 critical visuals, then11 gameplay visuals +11 audio files. Main and canvas hidden before decode; explicit clean loading state. Async Training can be cancelled via Main without stale starts. Single-request promises retained on repeat entry; no new global eager preloader. This is standalone navigation, not a measured Hub click.
7. Clean-cache localhost desktop1366×768:BOOT48.4ms after navigation; critical loaded69.1ms; decoded105.8ms; Main visible106.4ms (**58.0ms from BOOT**). Controlled delayed-critical test also proves hidden Main/canvas. These timings are local, not deployed/network performance.
8. Gameplay assets/audio decoded248.6ms after navigation (**200.2ms from BOOT**). First Training click284.8→Forest visible298.6ms (**13.8ms**); first terrain bake6.0ms. Repeat click350.1→visible360.2ms (**10.1ms**); new requests0. Stalled seed proves loading gate/timers0/RAF0/canvas hidden; cancellation stays Main. Fly requests0 in the isolated route.

Raw: [loading](qa/snake-next-phase3a-loading.json), [UI](qa/snake-next-phase3a-ui.json), [loading failure/retry](qa/snake-next-phase3a-loading-error.json). Final error-path correction: a controlled critical-hero404 exposed a retry guard that required an app before one existed. Retry is now handled before that guard; removing the intentional failure and clicking retry reloads into fully ready Main, JS errors0/resources0. This deliberately injected404 is not a normal-flow asset failure.

## 9–10. Audio

9. Original80s/32bar/96BPM Forest melody, four8bar phrases, flute/pluck/bass/light pulse, no borrowed samples. WebAudio buffer loops at exact80s.3,528,000 decoded samples; source first/last PCM sample0. Encoded peak−5.97dB/RMS−17.05dB, NaN/Inf0. Technical continuity is checked; subjective fatigue/melody/10-minute headphone approval is **not** claimed.
10. Hover/click/pickup/combo/turn/death/result/pause/resume/arrival. Combo/turn remain optional framework cues, not nonexistent mechanics. SFX≤.52s, peak≤.5, end at silence. Isolated Master/Music/SFX contract, bounded8 sources, stop/dispose. No Fly import; host shared-mixer injection deliberately deferred to public integration.

## 11–12. Performance

p95 in milliseconds, same sequential DEV/production browser protocol; music active and ambient enabled.1,000 warm movement+draw samples and100 cloned real consumption+draw samples per row. Setup excluded. CPU measurements only, **not** GPU/compositor/audio-thread time.

| Length | Desktop sim | Desktop render | Desktop whole | CPU×4 whole | CPU×4 eat+draw |
|---:|---:|---:|---:|---:|---:|
| 8 | 0.1 | 0.2 | 0.2 | 1 | 3.6 |
| 100 | 0.1 | 0.3 | 0.3 | 1.3 | 3.3 |
| 250 | 0.1 | 0.3 | 0.4 | 1.6 | 3.1 |
| 500 | 0.1 | 0.4 | 0.4 | 2 | 3.3 |
| 1200 | 0.1 | 0.7 | 0.7 | 2.9 | 3.5 |

Same-run DEV1200 render/whole p95=.4ms desktop; CPU×4 whole1.5ms. Production adds texture/world cost (.7ms /2.9ms), not zero overhead; below Phase2B6ms desktop-render/12ms CPU×4 whole targets. Across production captures max7.8ms; no captured >16.7ms sample. Prior concurrent preliminary1200 result2.8/6.8ms is not substituted for this same-run comparison. Historical Phase2B unclassified17.9ms maximum remains a caveat, **not a proven fix**. Do not infer max-budget/GPU safety on physical devices from a passing p95.

Raw: [performance](qa/snake-next-phase3a-perf.json). No blind core optimization.

## 13–14. Browser verification

13. **68 screenshot/compositor stress captures**:44 desktop +24 mobile, real timer/RAF movement, embedded/fullscreen, resize,250/1200 body, pause/settings/resume, actual normal-arena death/result. Final captures:transparent pixels0, renderer faults0, recoveries0, errors/warnings/failures/404 all0. QA alpha readback uses a separate software canvas; capture timings are not benchmarks. Selected screenshots visually inspected; full set available for human review. Synthetic long-body/shape fixtures explicitly labeled; no claim of naturally growing1200 through real food. After Main:RAF/timers/listeners/observers/audio0.
14. Edge desktop1366×768/1920×1080; actual coarse-pointer DPR3 mobile emulation (canvas cap2), portrait360×800/390×844/430×932 and landscape844×390/915×412 PASS. D-pad commands/food-growth/pause/settings/resume/restart/result/reopen/fullscreen Escape/orientation freezing tested. First fullscreen Escape leaves modal state; second returns Settings→Pause without unintended resume. Mobile resume without fullscreen routes to prompt. No physical-device/browser portability claim.

Raw: [mobile](qa/snake-next-phase3a-mobile.json), [desktop stress](qa/snake-next-phase3a-stress-desktop.json), [mobile stress](qa/snake-next-phase3a-stress-mobile.json), [render contract](qa/snake-next-phase3a-render-contract.json).
Render contract:50 repaints preserve simulation hash; forced Forest cache reload reproduces floor/object pixel hashes; deliberately injected render fault recovers full opaque next frame, no simulation change. The injected fault is separate from zero-fault normal stress.

## 15–18. Review / provenance / checkpoint

15. Screenshot directory: `C:/GitHub/rytni-assets/.playwright-cli/phase3a`.
Local gallery: `http://127.0.0.1:8771/.playwright-cli/phase3a/review/index.html`.

1. [Main Menu desktop](../.playwright-cli/phase3a/review/main-desktop.png)
2. [Main Menu portrait](../.playwright-cli/phase3a/review/main-portrait-390.png)
3. [Forest early — real session](../.playwright-cli/phase3a/review/forest-early.png)
4. [Forest medium — real session](../.playwright-cli/phase3a/review/forest-medium.png)
5. [Forest250 — QA long-body fixture, gameplay camera](../.playwright-cli/phase3a/review/forest-250.png)
6. [Forest1200 — QA long-body fixture, gameplay camera](../.playwright-cli/phase3a/review/forest-1200.png)
7. [90° canonical fixture close-up](../.playwright-cli/phase3a/review/turn-right-closeup.png)
8. [S canonical fixture close-up](../.playwright-cli/phase3a/review/s-closeup.png)
9. [Real food consume, presentation frozen at alpha .999](../.playwright-cli/phase3a/review/food-contact.png)
10. [Pause](../.playwright-cli/phase3a/review/pause.png)
11. [Result — real normal-arena collision](../.playwright-cli/phase3a/review/result-desktop.png)
12. [Settings](../.playwright-cli/phase3a/review/settings-desktop.png)
13. [How to Play](../.playwright-cli/phase3a/review/how-desktop.png)
14. [Mobile landscape — real session](../.playwright-cli/phase3a/review/mobile-landscape.png)
15. [Mobile portrait fullscreen prompt](../.playwright-cli/phase3a/review/prompt-390.png)

Also:geometry55 neutral captures,250/1200 full-arena overview, close normal/hover/pressed, all portrait sizes, loading/game-loading and stress68. Screenshots/high-res source archives stay local/untracked; runtime assets and raw QA records are committed.

16. Exact prompts/tool/source filenames/accepted-rejected status: [prompt record](qa/snake-next-phase3a-prompts.json). Runtime SHA256/bytes: [asset provenance](../arcade/snake-next/assets/provenance.json). Built-in ImageGen in small batches; first ground rejected as noisy, hero halo cleaned with one precise edit. Preparation script now reads accepted local source archive with explicit width map (including ground-v2), never overwrites accepted outputs. Fresh reproduction:17 WebP and10 WAV byte-identical; Ogg container serial differs but decoded PCM16 SHA256 identical. Original synthesis/notation source in `tools/qa/create-snake-next-audio.cjs`; icon atlas authored as SVG.
17. Checkpoint:commit containing this report; exact hash returned in the final handoff. To recover:`git log -1 --format=%H -- arcade/snake-next/production/renderer.js`.
18. Remaining confirmed functional UI/gameplay failures in tested scope:none. Review still required for art/readability/music and subjective game feel; physical-device touch/fullscreen/orientation/audio-unlock/GPU behavior, other browsers,10-minute listening and public host integration unverified. Historical17.9ms Phase2B spike caveat retained. No Caves/Swamp/effects/portals/ranked/backend/attempts or Phase3B.

## Verification and protected areas

-26/26 Node foundation/presentation/production tests PASS; all accepted22 foundation/presentation tests retained unchanged.
- JS syntax and staged diff checks; manifests/legacy Snake/Fly/Hub/host/gameplay foundation unchanged.
- Serena targeted symbols; built-in ImageGen + mechanical ffmpeg preparation; Playwright CLI QA. No Repomix/Context7/heavy workflow/subagents.
- No push, build candidate, TEST or Production publication. Unrelated untracked releases/assets preserved.
