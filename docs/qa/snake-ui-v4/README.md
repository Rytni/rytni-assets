# Mushroom Snake · UI V4

UI-only rebuild from four human-supplied composite references. Started at `99c9961`; published TEST at start: `2.15.33-a67c23267bc6` / `snake-next-3b755d3f0351`. No old checkpoint checkout/reset.

## Review

- [Side-by-side review](review.html): seven required screens, mobile, Result.
- [Native icons](icons-1x.png), [2×](icons-2x.png), [4×](icons-4x.png).
- [Assets and component system](ART.md).
- [Targeted QA](QA.md).
- [Runtime asset inventory](../../../grib/mushroom-snake-ui-v4/inventory.json).
- [TEST](https://rytni.live/testpodari).

Local read-only preview: `node docs/qa/snake-ui-v4/preview-server.cjs`, then `http://127.0.0.1:8776/docs/qa/snake-ui-v4/review.html`.

## Reference mapping

The attachments contain composites rather than seven separate source images. `reference-review.py` documents the exact QA crop mapping. These crops are documentation ONLY; the assembly includes no docs or reference pixels.

| Target | Implementation |
| --- | --- |
| REF-01 selector | Newly authored 1024×640 Snake key art; global selector contract unchanged |
| REF-02 Main | Three desktop zones: identity/account, capped actions, TOP-10; two-column compact Main |
| REF-03 Guide | Large illustrated manual, three preserved tabs, approved effect icons |
| REF-04 Settings | Medium panel, three compact rows; sound disclosure retains all channel bindings |
| REF-05 Fullscreen | Full viewport shell; existing square-cell FIT WORLD; 64px maximum status rail |
| REF-06 Pause | Dedicated compact composition with green/gold crest |
| REF-07 Restart | Dedicated burgundy confirmation with ruby crest and two capped actions |
| Result | Authored hero, independent trophy for record, dominant score, three primary stats |

## Locks

Simulation, Smooth V4, collision, speed, FIT WORLD calculations, progression, portal tunnel, effect mechanics/materials, scoring, attempts/sponsor/leaderboard contracts and SQL are unchanged. Fly source and Production bytes are checked by `safety-check.cjs` against the actual start. No production deployment/database mutation.

This is a new visual candidate, NOT human-approved art. Human visual review remains authoritative.
