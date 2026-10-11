# Arcade Premium V2 — authored environment

V5.3.2 TEST host presentation only. No application-page, Fly simulation or Snake gameplay redesign.

Art-first sequence, before host integration:

1. [Current chooser](01-current.png)
2. [Independent wide concept](02-backdrop-concept-desktop.png)
3. [Independent portrait concept](03-backdrop-concept-mobile.png)
4. [Actual cards on the concept](04-cards-on-concept.png)

Internal composition review: all five requested checks YES. The navy/violet perimeter connects to the parent cosmic page; mushroom silhouettes connect to both games; the dark central field does not compete with the covers; the background is authored bitmap art, not a CSS-gradient substitute; mobile was generated independently, not stretched from desktop. This is an internal gate, not a claim of human approval.

## Source assets

| Asset | Native pixels | Bytes | Use |
|---|---:|---:|---|
| `grib/arcade-v2/arcade-backdrop-desktop.png` | 1672×941 | 1,697,369 | Wide chooser environment |
| `grib/arcade-v2/arcade-backdrop-mobile.png` | 1024×1536 | 1,749,502 | Independent portrait environment |

Generated with built-in ImageGen. [Exact saved prompts](PROMPTS.md). Original generated files preserved in Codex generated_images. No text, logo, UI card or participant data is baked in. No optional ornament assets were added. Both PNGs plus inventory are frozen into the immutable runtime, and host URLs are rewritten to that same runtime identity.

Cards retain original covers, `object-fit: cover`, uniform height, aligned CTA and restrained translucent navy surfaces. Portrait chooser is intentionally vertically scrollable within the application popup; no horizontal overflow.

[Full QA / LIVE review](../snake-presentation-v5-3-2/review.html)
