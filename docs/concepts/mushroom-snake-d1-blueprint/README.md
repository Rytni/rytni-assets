# Mushroom Snake D.1 — review package

Direction D approved; D.1 is **design review only**. Base `4c7d674e5b479ef2b920fe52fcd02890863d2371`, branch `mushroom-snake-rebuild`.

[One review gallery](index.html) · [Normative proposed blueprint + runtime plan](BLUEPRINT.md) · [Exact ImageGen prompts, reference roles, rejected iterations, native dimensions and SHA-256](prompts.json).

## Deliverables

1. `01-anatomy.png`: top-down direction/head-neck/body/90°/U/S/taper/tail, short/~30/long-fragment studies.
2. `02-personality.png`: seven restrained states; not exported animation frames.
3. `03-stress.png`: long-route gameplay concept; food, 2 positive, 1 negative, five principal colliders, portal, decor, VFX and HUD.
4. `04-grammar.png`: FOOD/POSITIVE/NEGATIVE/PORTAL/COLLISION/DECOR, silhouette and grayscale studies.
5. `05-food.png`: magical seed / forest spore-fruit / fungal seedpod. None selected.
6. `06-portal.png`: rooted destination, overhead/context views, controlled local light and inward flow.
7. `07-biomes.png`: Forest/Caves/Swamp intended same-state comparison.
8. `08-main-layers.png`: separate environment/hero/logo/UI/ambient/interaction ownership; retained action set.
9. `BLUEPRINT.md` §7: asset representations, atlas arithmetic, layer/particle/cache budgets and future proof gates; also summarized in gallery.

All eight concept PNGs were independently generated through **built-in ImageGen** and copied byte-for-byte into this folder. No crop/extract/trace from Direction D; no transparent final sprites or runtime integration. Anatomy was regenerated after a side-profile draft; stress frame was regenerated for thinner/longer Snake, quieter portal and cleaner food/ground. Rejected files remain outside the project at their original generated-image locations.

## Review limitations — not concealed acceptance

Generated labels/counts are illustrative; actual scale comes from world-cell ratios and stage formula in the blueprint. `GAME SCALE` in the personality PNG is not pixel calibration. Directional head studies differ slightly in contour; production needs a shared model/pivot/scale proof. Scale markings are richer/more repetitive than permitted at mobile size: the blueprint's selective-marking/LOD rule takes precedence.

Stress frame has the required two positive and one negative world pickups; HUD effect indicators are separate. Its food remains a provisional generic coral marker, not a selection from the new three-candidate sheet. Tiny mushrooms/accents and painted bends are not exact cell-level fixtures; enforce the written sparse cap and shared silhouette before production. Small decorative stone flecks in ground art need explicit non-colliding flattening/classification before final art approval, rather than guessed collision from concept pixels.

Biome sheet is unusually close in route/placement across panels, but not exact registered coordinates or a deterministic rendering test. Some environment details still compete at reduced scale; future proof must simplify them through the shared contrast/LOD rules, not add hero glow. Main layer preview is explanatory, not replacement UI/layout/assets; record is information, not a newly mandated button. The brighter focus illustration is an authored state study, not authorization for CSS glow or geometry changes.

Still images cannot prove flawless animated joins, four-way world lighting, one-second human categorization or 1200-segment performance. Budgets are hypotheses, not measured results. These remain explicit approval/proof gates; no runtime PASS claimed.

## Gallery verification

Playwright CLI checked the completed local gallery at 1366×768, 844×390 and 915×412: all eight originals decoded, fit preserves native ratios, document overflow 0, native view preserves exact image width, grayscale and runtime-section navigation work. Completed verification run: JS/console errors 0, warnings 0, failed requests 0, HTTP≥400 0. An earlier gallery opening while deliverables were still being copied was not the completed QA run.

Captures/fixture are under `.playwright-cli/d1-review/`: stress and biome sheets at all three sizes, grayscale grammar, runtime plan and desktop gallery overview. Mobile stress, grayscale grammar and overview were visually inspected. This is gallery QA only, not mobile game, fullscreen, motion or physical-device QA.

Only this new concept/documentation folder and local review QA files were added. Existing tracked code/assets/manifests remain unchanged. No stage/commit/build/push, TEST/Production publish or Phase 3B. Stop for human review.
