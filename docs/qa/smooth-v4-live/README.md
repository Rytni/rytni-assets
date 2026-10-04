# Smooth V4 — DEV live integration

Local review: http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html
Preset B is selected initially. Click B (or Apply) to start. The DEV button
cycles SMOOTH V4 → SMOOTH V2 → GRID SNAP, without restarting the run.
No TEST/Production release or manifest changes.

## Integration boundary

Only the Game Feel Lab installs `RibbonSprites`; ordinary Forest Training
still uses V2. The adapter receives the existing `SnakeMotion.frame()` without
owning simulation, history, time, growth, collision or portal state. Existing
arena clipping and portal dissolve/reassembly remain in ForestRenderer.
V4 draws one unified cap/body/taper mask, with clipped cardinal decorations.
No old head, tail, socket or turn-atlas geometry is combined with it.

V4 centerline, radius, cap, taper, material and overlays are unchanged. The
only proof-module edit exports its existing material function for read-only
reuse. Tests compare the remaining module text to f4c4985, and V2 motion/path
to 86379ba. Cabinet, floor, HUD, objects, runtime lifecycle, balance and
authoritative simulation files are untouched.

The first naive full-arena proof raster caused fixed-clock recovery pauses.
The live adapter now crops to integer-cell visible bounds, reuses buffers,
memoizes unchanged constant-width inverse fields, and obtains interior
material lookup tables from the original V4 material function. Cap/taper
material still uses the original function directly. This is equivalent
evaluation, not a geometry/art change. Pixel-for-pixel regression compares
native RGBA with the original proof raster across 32 shape/progress cases
and subsequent canonical history shifts/growth. Cache size is bounded.

## Targeted evidence

- `integration.json`: desktop 1920×1080 and mobile 844×390 DPR2. Actual keyboard
  and D-pad input, eight cardinal turn cases, straight/U/S/alternating turns,
  growth, lengths 8/30/250, pause/resume, restart, and portal phases/atomic reset.
  Corrected local-width gate reads the live raster mask: 36–36 px, failures0.
  Mode switching leaves hash unchanged and does not pause the run. Console
  errors0, page errors0, failed/HTTP-error requests0.
- `clock.json`: short real fixed-timer + RAF checks, 2.5 seconds at each of
  lengths 8/30/250. Each completes 150 ticks, growth1, recoveries0, and hash
  mismatches0 against a non-rendered B session given the same commands.
- Node tests compare deterministic replay/hash reads across all three modes,
  protect the original motion/geometry, check exact pixels, and retain the
  corrected validator's injected-defect tests. No benchmark/full art gallery.

The three screenshots are the actual DEV cabinet renderer with controlled
canonical gameplay fixtures (turn/U/mobile S), not standalone proof art or
uncontrolled multi-minute human play. Human review is still required.

Reproduce from repository root:

```powershell
node --test arcade/snake-next/forest-training/ribbon-live.test.mjs arcade/snake-next/forest-training/motion.test.mjs arcade/snake-next/smooth-v4-proof/validation/validator.test.mjs
playwright-cli -s=forestqa run-code --filename=arcade/snake-next/forest-training/ribbon-live-browser-qa.js
playwright-cli -s=forestqa run-code --filename=arcade/snake-next/forest-training/ribbon-clock-qa.js
```

One local integration checkpoint. STOP for human play review; no GAME FEEL LOCK.
