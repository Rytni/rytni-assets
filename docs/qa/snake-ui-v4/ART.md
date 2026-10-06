# Runtime art / components

56 new PNGs in `grib/mushroom-snake-ui-v4/`; `inventory.json` lists dimensions, alpha occupancy and SHA-256 for every file. This family is included in the immutable TEST closure. No human reference pixels enter runtime.

## Provenance

New illustrations/component sources were generated with the built-in ImageGen workflow during this task. Working masters remain outside the repository in the task's `generated_images` directory. `author-assets.py` records exact source filenames and exports; no runtime dependency on that directory.

| Source file | Purpose |
| --- | --- |
| `exec-6c26c79d-9a65-4f7c-9df9-7c2489201481.png` | Enchanted forest, lanterns, gold light, stream/depth; runtime 1920×1080 |
| `exec-8d6ea50f-3357-46dd-9051-c19a3f42455f.png` | Transparent ivory Mushroom Snake hero; bounded 640×432 export |
| `exec-6fd81a0d-b747-45cf-a1a3-3263234e1697.png` | Dedicated selector illustration, safe crop; runtime 1024×640 |
| `exec-225dd743-470d-4dff-9abe-b993c0dd12d3.png` | New gold/wood/emerald icon source sheet |
| `exec-c717a7da-8d76-4b80-8bf1-8b3ad8fd1378.png` | New corners, capped buttons and independent ornaments |

The icon masters are larger than the final glyphs. Sixteen glyphs are offline nearest-neighbour exports with alpha cleanup to independent 48/64px PNGs, not hand-painted 48px originals. Four extra glyphs are manually authored at native scale. They are inspected at true 1× on forest, wood and emerald; no high-resolution atlas is scaled by CSS at runtime. This provenance distinction is intentional, not a claim that all icons were hand-edited pixel by pixel.

Exact original generation prompt transcripts are not stored in this report; the design directions above are summaries, not invented verbatim prompts. References were art direction only.

## Components

- Panel: four fixed 48×48 corners, four tiled edge strips, independent repeating wood center. No full-panel PNG. Surface hue varies by panel role.
- Ornaments: independent transparent crest PNGs at 128×64; mobile 80×40 preserves ratio. Trophy 128×128, separate from hero/frame.
- Buttons: independent left cap / repeating center / right cap. Caps scale uniformly by button height; only the center expands horizontally. Primary desktop width370px; Pause330px; Result360px. Danger uses its own family.
- Icon controls: authored square bezel, independent native48 glyph,48px Close and44px compact touch controls.
- Account plaques: normal three mushroom tokens, sponsor two gifts, independent trophy, readable record/rank.

Native QA rejects ornament/corner/cap aspect error above2%, transparent center joins, unsafe Russian labels, offscreen controls and sub44px button targets. Invisible-overflow ancestors do not bypass the button bounds gate.

## Fullscreen surplus

Canonical FIT WORLD cannot fill both axes on a wide square-cell arena without changing geometry. The cabinet remains exactly the original fit. The status rail is capped64px and appears only for surplus above32px. Remaining area receives a decorative forest cabinet base, including side regions; it is not a100–160px status panel. There is no added gameplay clock, camera transform or world scaling.
