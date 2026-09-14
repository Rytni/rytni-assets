# Mushroom Snake — classic grid rebuild (v2)

**Release status:** TEST candidate. Production remains unchanged. The strict assembly gate requires the complete v2 runtime and art set before a TEST bundle can be built.

## Simulation and world

Training only: no ranked RPC, attempts or database migrations. `arcade/snake-core.js` is a DOM-free deterministic 60 Hz simulation. Four cardinal directions, two-turn queue, no 180° reversal; the drunk effect adds a predictable six-tick turn delay. Movement advances whole grid cells; presentation interpolates the previous/current path independently of camera, aspect ratio and DPR. Pause clears accumulated time. Long browser stalls pause rather than silently changing speed.

Body uses an 8192-entry typed ring buffer and occupied-cell set. Initial length 8; food growth is committed on the next movement step, including magnet pickups. Vacating-tail moves are legal only without growth. Capacity is bounded at 8190; further food still scores. This cap is a practical pool limit, not infinite body storage.

Infinite seeded world: 16×16-cell chunks, 5×5 simulation window. Coordinate-stable obstacle generation never changes under the snake. Two-cell-wide connected streets divide 2×2 obstacle islands; every unblocked island cell connects to a street. Radius 24 starts open; density rises gradually with distance. This guarantees terrain connectivity, not protection against the player's own tail trapping a route. Collision can recompute unloaded terrain from coordinates; the tail occupancy does not depend on chunk retention.

Renderer has a separate bounded visible-chunk cache and never writes to simulation chunks. Uniform scale expands visible world rather than stretching sprites. Camera follows the interpolated head; mobile places it to the right of the left-hand controls. Maximum visible width is 64 cells to bound rendering cost.

## Competitive loop

1 food target initially, 2 after 90 seconds, 3 after 240 seconds. Bounded cardinal BFS selects a reachable nearby free location; failed placement retries. Food is worth 100 + 20 × (combo − 1), up to combo 10. Chain window gradually shortens from 12 to 6 seconds. Survival gives 1 point/second. Speed smoothly approaches 12 from 7.5 cells/second. No random free score or unverified near-miss reward.

Magnet: 7 seconds, pulls food within four Manhattan cells along available cardinal steps; never attracts debuffs. Drunk Mushroom: 4 seconds, six-tick delay for newly queued turns, visible violet state and timer, no random directions. Separate icons, progress chips and existing distinct audio clips.

## Presentation, menus and lifecycle

`snake-controller.js` and `snake-ui.html` are isolated v2 presentation modules. `assemble-snake-v2.cjs` prepares them with the existing Hub registry/lifecycle without changing Fly or its card. Default assembly fails if required art is absent; incomplete mode is diagnostic-only.

Intentional modern pixel art in `grib/mushroom-snake-v2`: four directional snake heads, five controlled body variants, tapered tail art, moss/earth tiles, teal shadows, amber food and violet hazards. No screenshot-derived assets. Source prompts are recorded in `prompts.json`. Desktop/mobile frames are separate required art rendered nine-slice with fixed corners. The main menu, buttons, D-pad states, HUD chips and all modal states use the same wood/moss/gold art language.

Ten data-driven biome definitions share one simulation and chunk system. Green Forest, Dark Cave and Winter World have production ground/obstacle art; the remaining seven definitions currently use explicit fallback assets and transition hooks. Distance zones blend over transition chunks rather than switching the simulation or teleporting the player.

States: main, how-to-play, settings, pause, result, mobile fullscreen prompt. Settings adapt the existing Fly audio mixer (music/SFX/master/mute) and real DPR quality. Result shows score, length, food, combo, bonuses, survival time and local v2 best (old free-movement scores are deliberately separate).

Mobile accepts a fullscreen/orientation click, waits for landscape and a stable 180 ms viewport, then starts. The adapter follows Fly's proven request/lock retry and viewport-cover protocol; Fly's functions are private and tied to its model, so Fly is not refactored or modified. CSS fullscreen is only a fallback when the native API is absent, not when a native request is rejected. Exit/portrait pauses immediately. Four actual D-pad buttons on the left replace touch steering and swipes.

One animation loop; AbortController and ResizeObserver cleanup; host close, Hub return and pagehide stop audio/RAF. No full-world allocation, realtime blur or particle bursts. DPR ≤1.5 mobile, ≤2 desktop, 1 in economy mode; quality never changes physics.

## Verification status

Core tests PASS: cardinal movement, reversal/queue, interpolation, growth, selective magnet, drunk delay, self collision, connected terrain, bounded streaming, biome progression and matching 30/60/144 FPS replays. Simulation/interpolation stress PASS at 100/250/500/1200 segments.

Strict local release QA PASS on desktop and touch emulation with the real shared audio mixer: main/how/settings/pause/restart-confirm/result, keyboard and D-pad control, native fullscreen, orientation transitions, render/simulation independence, host-close cleanup, asset loading and browser console/network checks. Actual canvas rendering stress passes at 100/250/500/1200 segments with a bounded 25-chunk simulation window and eight visible render chunks. Redmi Note 11 hardware validation remains separate from emulation.

## Phase 3 / ranked roadmap

After approval: Ghost Cap (safe expiry), Golden Harvest (limited ×2 pickups), Pocket Mycelium (visual compression with grid-safe occupancy rules), Fairy Ring (validated destination and discontinuous trail); Hiccup (warned extra cardinal step), Sticky Slime (bounded turn commitment). Each needs original icon, timer, audio and combination tests.

Ranked is a separate approved phase: additive game_id/session/leaderboard keys, server replay/rules validation and RLS tests. Decide shared versus per-game attempts first. No economy changes now.
