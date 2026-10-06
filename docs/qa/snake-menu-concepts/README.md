# Mushroom Snake menu art replacement

Base `9656138`; local only. Seven native concepts were captured, inspected and
revised **before** changing any product source. `capture-concepts.js` waits for
image decode and the 220 ms entrance animation to finish, avoiding misleading
half-opacity captures. Product logic/gameplay remains the existing foundation.

## Internal Phase A gate

| Question | Internal assessment |
| --- | --- |
| Commercial game title screen? | Yes: original forest stage, character, differentiated physical controls. |
| Identity without text? | Yes: ivory/red-cap/moss Snake, mushrooms, emerald/gold/wood art. |
| Play dominates? | Yes: largest luminous emerald control; Training and shortcuts subordinate. |
| Result rewarding? | Yes: large golden mushroom trophy/score, three primary stats; details subordinate. |
| Pause is a game overlay? | Yes: compact physical board over darkened actual game; not a full-screen card. |
| Rating is a fantasy object? | Yes: carved walnut board, raised top-three arrangement, no spreadsheet rules. |
| Mobile a dedicated composition? | Yes: 38% identity/62% actions; separate Rating, no mini desktop leaderboard. |

This is an internal design assessment, **not human approval**. Initial revisions:
mobile hero face moved out from behind the record plaque; source-proportional
Play and nine-slice medium buttons; settled captures; readable guide caption;
custom slider rail/thumb. Final human review still required.

## References / source policy

Existing logo, effect pickup PNGs and approved #1 badge remain references/reused
UI assets. New backdrop, hero, buttons/plaque/tokens/trophy/book/board have their
own source originals in `grib/mushroom-snake-menu-v1/sources/`. No concept PNG is
a runtime asset. Offline exports use nearest-neighbour and retain alpha bounds.
Menu hero is decorative only; no gameplay art was changed.

## Review

- `review.html`: native concepts, seven clickable sections.
- `final/review.html`: final product screenshots and preview links.
- `ASSETS.md` and asset `manifest.json`: exact inventory, source/crop/dimensions/hash.
- `QA.md`: targeted tests and scope verification.

No deployment, backend work, SQL edit, state-controller or gameplay change.
