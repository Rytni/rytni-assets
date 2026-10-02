# Retro V5.2 isolated renderer/material proof

Entry: ../retro-v5-review.html. No Hub registration, public loader, manifest, database, Fly, ranked or legacy imports.

Approved geometry is an exact copy of V5.1:
SHA-2566a3fc44525bdc51368823a12dc5be1060cfc752ab258aedf4bbd1c38557abba5.
Cell68 / body36 / head42 / terminal68. Never change masks to accommodate artwork.

## Art/runtime

- build-art.mjs authors independent discrete raster pixels inside immutable masks. No generated concept pixels are used.
- All variants use one shared palette and world-space upper-left light/lower-right shade. Socket continuation is virtual during shading, so edges are not painted as tile end caps.
- 88% clean material IDs,7% moss,4% leaf,1% tiny mushroom; no fixed-N interval. ID=moved-cells minus body index stays stable for retained material through movement/growth. Head has its own tiny restrained mushroom identity.
- PNGs render nearest-neighbor. Pixel boundaries are integer aligned. No Canvas body strokes, runtime outlines, gradients, blur or detached shadow.
- Floor uses10 original68px tiles,8 normal variants and2 rare variants (.2% combined), deterministic world-cell placement. Seams are in the tile, never a runtime grid overlay.
- Cabinet/HUD/objects are unchanged existing Retro V3 production-proof rasters copied into the new namespace. Fixed corner art, axis-scaled edges and nine-sliced HUD; no concept extraction.
- Head, neck, body, bends and terminal derive from one bodyCells(state) snapshot. No movement interpolation or independently animated body part.
- Existing createRules/createArena/createState/step/FixedClock are used without edits; fixed timer owns simulation, RAF owns rendering. Pause stops both; resize does not change simulation.
- Food/growth, score and collision are actual canonical behavior. Positive/negative timers and portal contact are presentation-only proof events: they do not modify rules/state geometry or introduce unapproved mechanics.
- Tiny four-frame seed/positive/negative/portal bursts,180ms burst phase,550ms max score popup. No full-screen VFX or per-segment effects.
- Touch D-pad44×44 targets. Review tools sit outside the cabinet; no menu redesign.

## Reproduce

```powershell
node arcade/snake-next/retro-v5/build-art.mjs
node arcade/snake-next/retro-v5/build-review.mjs
node --test arcade/snake-next/retro-v5/geometry.test.mjs arcade/snake-next/retro-v5/art.test.mjs
playwright-cli -s=retrokit run-code --filename=arcade/snake-next/retro-v5/browser-qa.js
```

Serve repository root locally on8773. Review gallery: /docs/qa/retro-v5-2/review.html.

STOP gate: local visual/game-feel proof, NOT a final asset approval or production integration. No publication.
