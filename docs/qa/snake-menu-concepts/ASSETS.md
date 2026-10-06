# Authored menu asset inventory

All paths below are under `grib/mushroom-snake-menu-v1/`.

## Runtime exports

| File | Native pixels | Source | Source crop (1280 atlas coordinates) |
| --- | --- | --- | --- |
| title-forest.png | 1008×567 | forest-title.png | alpha-trim/full source |
| snake-hero.png | 512×262 | snake-hero.png | alpha-trim/full source |
| button-play.png | 320×163 | ui-sheet.png | 0, 118, 438, 352 |
| button-wood.png | 256×111 | ui-sheet.png | 440, 150, 816, 326 |
| button-danger.png | 256×121 | ui-sheet.png | 816, 130, 1254, 354 |
| record-plaque.png | 320×154 | ui-sheet.png | 0, 495, 516, 758 |
| icon-bezel.png | 96×96 | ui-sheet.png | 518, 465, 814, 758 |
| guide-book.png | 256×218 | ui-sheet.png | 818, 415, 1254, 795 |
| attempt-mushroom.png | 64×77 | ui-sheet.png | 65, 820, 368, 1195 |
| attempt-sponsor.png | 64×66 | ui-sheet.png | 435, 820, 802, 1195 |
| record-trophy.png | 256×248 | ui-sheet.png | 818, 784, 1254, 1215 |
| board-frame.png | 512×673 | board-frame.png | alpha-trim/full source |
| icon-sound.png | 32×32 | offline pixel authoring | alpha-trim/full source |
| icon-music.png | 32×32 | offline pixel authoring | alpha-trim/full source |
| icon-sfx.png | 32×32 | offline pixel authoring | alpha-trim/full source |
| icon-settings.png | 32×32 | offline pixel authoring | alpha-trim/full source |
| icon-fullscreen.png | 32×32 | offline pixel authoring | alpha-trim/full source |
| icon-back.png | 32×32 | offline pixel authoring | alpha-trim/full source |
| icon-play.png | 32×32 | offline pixel authoring | alpha-trim/full source |
| icon-combo.png | 32×32 | offline pixel authoring | alpha-trim/full source |
| icon-keys.png | 32×32 | offline pixel authoring | alpha-trim/full source |

Exact per-file SHA-256, source rectangle and image mode are in `manifest.json`.
`authoring/export-menu.py` deterministically reproduces these exports from the
preserved source files. Atlas scale is adjusted to the actual 1254 px original.

## Original art provenance

Four original source images generated with the built-in ImageGen tool during
this task, inspected before exporting; transparent sources preserve RGBA.

| Preserved source | Native source size | Original tool output |
| --- | --- | --- |
| sources/forest-title.png | 1672×941 RGB | exec-3417569a-c29d-4c80-83dd-5d45d65e0202.png |
| sources/snake-hero.png | 1717×916 RGBA | exec-1cfcd81b-d3bb-4175-aec1-8a5717a17c29.png |
| sources/ui-sheet.png | 1254×1254 RGBA | exec-982d8feb-837e-47ca-b911-471f95af0833.png |
| sources/board-frame.png | 1122×1402 RGBA | exec-814c114a-d884-4ac9-9d9e-76c4c62f870b.png |

Art briefs: emerald forest depth with framing trees/mushrooms and warm lanterns,
quiet control area; friendly coiled ivory Snake/red cap/moss (menu-only);
separate illuminated Play/wood/burgundy buttons, trophy plaque, round bezel,
book, mushroom/gift attempt tokens and mushroom trophy; blank carved walnut
board with gold/moss/mushroom corners. These are descriptions of the authored
art direction, not a claim to reproduce the exact generation prompt transcript.

The nine 32×32 pictograms are authored offline on a fixed native pixel grid in
`export-menu.py`. No runtime icon-font/emoji fallback. Play uses a proportional
sprite; wood buttons and board/panel frames use fixed-corner nine-slice rails.
Decorative art never receives collision/input/gameplay ownership.

## Existing art reused unchanged

- `grib/mushroom-snake-retro-v5/logo.png` — approved 480×151 identity.
- `grib/mushroom-snake-effects-v1/assets/effects/*-field.png` — the nine approved guide pickups.
- `grib/mushroom-fly-v2/ui/icons-recovery-v1/leader-first-v1.png` — approved #1 badge.

No gameplay Snake PNG, effect skin, HUD or VFX asset was edited. No runtime asset
was obtained by cropping a concept screenshot.
