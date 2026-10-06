# UI V3 targeted acceptance

Starting HEAD `14eeb95`; published TEST `2.15.33-eaf73478e2df` / `snake-next-6822599860b1`. No checkout/reset. Actual starting manifest is retained in `starting-manifest.json`.

## Candidate before publication

Candidate `2.15.33-a10ca16878b7` / `snake-next-958664f591a6`, 432 immutable dependencies. Rollback is the actual deployed `eaf73478e2df`, never an unpublished local candidate.

- Product/controller/appearance/packaging: 61 targeted Node tests.
- Native UI: 362 assertions, including ornament aspect, Russian label-safe bounds, 44px targets and exact 48×48 Close. 1920×1080, 720×405, 436×245 and 844×390. Local state fixtures are explicitly labelled.
- Actual `rytni.live/testpodari` container, with only `/giveaway-test/**` responses replaced by the exact local candidate: desktop 112 and mobile 107 assertions. Clean contexts. `candidate-desktop.json` / `candidate-mobile.json` retain results.
- Training Result on the real container is a naturally terminal canonical run after a queued legal direction, NOT a fabricated ranked score.
- Local host functional QA: 40 assertions. Ranked preview server seed reaches canonical session; attempts/no-attempts/sponsor credit/network error/empty board; pause clock freeze; Restart/Exit Cancel preserve run; Settings back; Share-denied copy fallback; clean Hub reopening; rejected forged channel; no remaining timer/RAF on close; Fly Main/Training/Pause/Result smoke.
- Mobile: portrait gate spends zero attempts; landscape fullscreen starts once; native touch D-pad; fullscreen rejection fallback retains same document and fills host viewport; exit restores scrolling.
- Unit coverage additionally verifies duplicate/idempotent starts/finishes, sponsor serialization, escaping/order/top10/own row and no Training ranked calls.

## Visual findings

Corners 48×48, independent crests 96×50 and button caps retain source proportions (measured error 0 for these captures). No complete panel/button bitmap stretch. Close 48×48. Desktop Russian Restart stays one line. Compact layout deliberately omits hero/inline board and exposes Rating separately.

1920×1080: existing square-cell cabinet ends at y≈973.94. Authored lower rail begins y=974, height106, bottom1080. A 51px central wood bridge fills the straight bottom strip's native38px inset, excluding fixed corner ornaments; no world/seam geometry changes. No plain fullscreen surplus rectangle remains.

Screenshot timing is settled/reduced-motion; native mobile output uses CSS pixels despite DPR3. Mobile files never overwrite desktop gameplay. Selector capture waits for loaded card art and captures the actual visible Hub, not its initially offscreen ancestor.

Console/page/asset/Fly-ranked-RPC failures in candidate runs: zero. Initial unauthenticated site load has its preexisting auth-health401; no new Snake failure is attributed to that baseline. Preview flags reveal anonymous TEST fixtures; no real Fly attempt/score mutation.

## Safety

`node docs/qa/snake-ui-v3/safety-check.cjs`: 860 existing approved-art and canonical files unchanged against starting HEAD. Production aggregate SHA256 `5003cfcd190b3e2071e422bf4b12ca597fcf0fdcb16c1109f9e4186e0fa356ed`; Fly source SHA256 `1c76cc728a16ab87ff0c7f122884154f7fa63edc27630b0e1930cc949681e506`.

No SQL, backend, skins, progression, portals, collision, speed, input or standalone Training changes. New family only; old approved artwork preserved. Packaging accepts safe nested PNG inventory names, rejects traversal/missing files, snapshots cover and leaves Fly cover URL unchanged.

First publication `a10ca16878b7` passed visible LIVE UI (112 desktop/107 mobile) and the canonical loader check, but an additional exhaustive runtime SHA audit caught Git line-ending normalization of the new UI inventory JSON on Pages. S3 matched. This is an integrity FAIL, not a gameplay/art change. The old immutable snapshot is retained, never overwritten.

Packaging now canonicalizes inventory metadata to LF BEFORE hashing (PNG/audio unchanged), with a CRLF/LF identity regression test.62 Node tests. Corrected candidate `2.15.33-a67c23267bc6` / `snake-next-3b755d3f0351`; the ONLY changed runtime dependency is UI `inventory.json`. Rollback stays the fully verified starting `eaf73478e2df`. Final dual-CDN audit/live captures pending corrected publication. Production readiness is NOT claimed.
