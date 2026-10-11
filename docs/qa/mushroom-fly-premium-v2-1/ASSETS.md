# V2.1 assets / built-in ImageGen

Existing V2 desktop/portrait Main art direction, hero/logo, primary Play, journal and all gameplay sprites remain intact. No asset was extracted from a screenshot or concept.

Runtime source of truth in `grib/mushroom-fly-premium-v2-1/`:

- `sky-desktop-v2-1.webp`, `sky-mobile-v2-1.webp`, `celebration-v2-1.webp`: .94 WebP siblings of the locked opaque V2 scenes, exact native dimensions.
- `celebration-portrait-v2-1.webp`: .94 WebP derivative of new independently authored portrait PNG.
- `secondary-trimmed-v2-1.png`: authored cream/brass material, fixed-cap horizontal 3-slice. Native 1939×349; source caps 300px, destination ~40px at 46px button height (rounding only). No wing ornaments. Near-invisible alpha≤15 exterior generator haze excluded in a sibling derivative; original preserved. `prepare-assets.ps1` records the bounds 20,211…1958,559.
- `sponsor-token-128-v2-1.png`: downsampled 128×128 alpha gift/wing token. Available/locked/used opacity and color treatments are presentation-only; counters come unchanged from authoritative hub.

Original generated PNGs preserved in this same family: `celebration-portrait-v2-1.png`, `secondary-source-v2-1.png`, `sponsor-token-v2-1.png`. Default generator originals also remain in the Codex generated-images directory. Conversion pipeline is `assets.js`/`assets.cjs`; originals are never overwritten.

Guide mini-diagrams are code-native SVG illustrations with real existing `player/idle-1.webp`, coin and Ghost icons; live DOM labels. They explain hold/release, safe gap, PERFECT zone, columns, moving gap and post-Ghost route. Bonus illustrations remain the actual approved pickup art. No new gameplay art or HUD sprite replacement.

## ImageGen prompts

Portrait: “Use case: stylized-concept. Asset type: standalone Mushroom Fly portrait celebration background for responsive Result, portrait 1024x1536. Image 1 is STYLE AND CHARACTER REFERENCE ONLY, not an edit target. Create a NEW independently authored portrait composition retaining the same bright cyan/gold/amber floating mushroom kingdom and same cute cream flying mushroom hero with red white-spotted cap, ivory wings, joyful face. Hero entirely visible in upper third below a small calm title area (roughly y20–40%); gold coins near outside sides, floating islands, warm sunlight. Broad calm lower-middle cyan/golden sky for DOM score/stats around y45–75%, with airy cloud footer for buttons. At 390x844 the winged red-capped hero must remain unmistakable and not be cropped by cover. Polished premium 3D storybook finish matching reference. No words, numbers, logos, buttons, UI panels or live data. Not dark forest. Preserve bright premium Fly identity.” Reference: V2 `celebration-v2.png` only for character/style.

Sponsor: “Use case: stylized-concept. Asset type: isolated production game UI sponsor-attempt token on genuine transparent background, square 512x512. One clear symmetrical small warm amber gold gift parcel with cream ribbon/bow and two tiny ivory wings. Front-facing orthographic, polished 3D hand-painted Mushroom Fly premium brass/cream style, restrained dimensional bevel. Strong large gift-box silhouette instantly distinguishable from circular coin when displayed at 20–28 CSS px. Centered compact token fills 80% of square, alpha around all edges. No text, no emoji, no circular coin, no background, no UI panel, no shadow cloud, no micro-detail. Single object only.”

Secondary: “Use case: stylized-concept. Asset type: one standalone production Mushroom Fly SECONDARY UI button material on genuine transparent background, wide 1024x256, absolutely front facing. A quiet warm cream parchment inset with very subtle fibrous texture, thin dimensional polished light-brass rim, rounded rectangular ends, tiny bevel and restrained carved notch at each end. Broad empty center; ends only decorated. Premium 3D hand-painted game UI, matching airy amber/gold fantasy but subordinate to bright amber Play. Safe horizontal 3-slice with fixed end caps, no center ornaments. No wings, mushrooms, coins, text, icons, labels, background scene, perspective or cast shadow. One button only, opaque cream center and transparent exterior.”
