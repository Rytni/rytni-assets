# Mushroom Snake — TEST vertical slice

## Architecture and rules

`arcade/09_T123_ARCADE_HUB_SNAKE.html` contains the scoped Hub UI, game registry, Fly adapter consumer and isolated Snake engine/controller. The existing Fly source exposes only activate/deactivate/best and its AudioManager; its physics, collision, camera, rankings and art are unchanged. TEST build appends this block after Fly. Only one selected game owns an animation loop. AbortController removes Snake input listeners; leaving Arcade, closing progression or pagehide stops game/audio and returns to Hub.

Snake is training-only. Keyboard/WASD select direction; mouse points toward a target; touch uses a relative steering anchor. Mobile play requires landscape fullscreen (native with CSS fallback). Rotation/fullscreen exit pauses; resuming never advances hidden time. Menu/pause/results can scroll.

Fixed 1200×675 world, 1/60 s physics, uniform render scale; DPR/aspect ratio never change simulation. Head radius 17, world inset 20, segment spacing 19. Start with 10 segments, grow per food to a bounded 110-segment pool; subsequent food still scores. Self collision skips the first eight connected segments. Forest stones have radius 28 and 2.5 s warning. Spawn candidates exclude head, body and existing stones; failed placement retries later.

## Score and difficulty

Food: 20 + 5 × (combo − 1), combo capped at 10. Chain window decreases from 7 s toward 3.2 s. Survival: 2 points/s. Speed approaches 145 from 95 world units/s over 220 s; turning is capped at 2.65 rad/s. Stone cap grows gradually to 10; placement is checked, not based on screen pixels. No near-miss reward in Phase 1. Seeded randomness permits deterministic tests. Longer survival needs more balance testing; no claim of a mathematically guaranteed route through every future configuration.

## Effects

- **Mycelium Magnet — implemented:** 7 s, pulls only food within 160 units, not bad pickups; green-gold spores and distinct rising sound. Respawns after 15 s.
- **Drunk Mushroom — implemented:** avoidable purple/orange pickup with warning ring; deterministic small sinusoidal heading sway for 4 s; steering remains responsive. Distinct wobbling sound, countdown; 18 s respawn.
- **Ghost Cap — Phase 2:** short cyan transparency; bypass self/eligible stones, never world boundary; safe expiry grace while overlapping.
- **Golden Harvest — Phase 2:** next limited pickups ×2, gold aura; explicit remaining count.
- **Pocket Mycelium — Phase 2:** compress segment spacing, retain segment count/score; interpolate restoration, defer unsafe expansion, no expiry overlap death.
- **Fairy Ring — Phase 2:** paired mushroom portals; validate destination against swept head/body/stone geometry, preserve a discontinuous trail across portal, cooldown to avoid ping-pong; spawn a safe bonus-spore trail.
- **Hiccup — Phase 2:** small periodic forward pulses after visible/audio warning; swept collision and bounded impulse, never random teleport.
- **Sticky Slime — Phase 2:** mild speed and turning reduction with green segment coating/countdown; restore smoothly. Test combinations before enabling stacking.

## Art, audio and performance

Eight separately generated original raster assets in `grib/mushroom-snake-v1`: two key arts, arena, wingless head, segment (tapered for tail in slice), spores, magnet, drunk mushroom. No screenshot crops or emoji art. Seven original pre-rendered PCM clips are reproducible with `node arcade/build-snake-audio.cjs`; playback uses existing Fly master/music/SFX buses and saved settings, not a second mixer.

Typed ring-buffer trail and segment arrays, fixed food/stone/particle pools; background cached on resize. No realtime blur. Sprite cache built once; mobile DPR ≤1.5, desktop ≤2. Balanced default on touch; repeated slow windows reduce particles/quality without changing physics. `mf_perf=1` exposes FPS/frame time/CPU/DPR. Desktop emulation is not proof of Redmi Note 11 hardware performance; real-device testing remains required.

## Ranked backend — design only

Training best uses `rytni_mushroom_snake_training_best_v1` locally and never calls Fly score/attempt RPC. No fake seasonal ranking and no migration in this slice. Plan additive `game_id` (`mushroom_fly`, `mushroom_snake`) on sessions/results and leaderboard keys `(season_id, game_id, application_id)`, with server-side game/rules-version validation. Preserve/backfill old results as Fly; existing Fly RPC defaults stay compatible. Snake ranked RPC and separate seasonal top/personal rank require additive migration, RLS tests and replay/score validation before release.

**Decision required before backend implementation:** shared Arcade attempts or per-game attempts. No new economy or production semantics are introduced now.
