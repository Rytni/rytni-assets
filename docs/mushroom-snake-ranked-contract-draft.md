# Mushroom Snake ranked run contract — DRAFT, not implemented

This is a contract proposal, not an API/SQL migration or a claim that these endpoints exist. No attempt, sponsor, leaderboard or backend calls are connected to the DEV Lab.

## Policy and boundaries

- Game namespace: `mushroom-snake`, separate from Fly ledger/metrics. Best **single validated run** per player/season, never cumulative daily score.
- Budget: 3 regular + 2 verified sponsor attempts per site eligibility window. The Phase 1 source audit reports **rolling 24h**, not midnight reset, with sponsor eligibility after regular budget exhaustion. Live policy has not been inspected here. Server returns versioned `windowMode`, window/expiry timestamps, remaining counts and season; client cannot invent a calendar-day interpretation. Any product change to calendar days must be an explicit server policy decision.
- Authentication/participant/season membership comes from server-owned identity. Payload identity fields are not authority. Every operation is scoped to authenticated player + game + season.
- DEV previews, changed configs, forced expansions, test fixtures, local seeds and local storage are never ranked evidence or attempts.
- Assets/controls/audio readiness comes before reservation; renderer, viewport, camera, DPR and render FPS are excluded from authoritative rules. Production rules/content configuration is immutable and server-selected for each attempt.

## Proposed operations (semantic names, not existing RPC names)

| Operation | Input | Atomic server effect / response |
|---|---|---|
| Read eligibility | Authenticated session | Season, policy version, regular/sponsor counts, active reservation/attempt and next rolling expiry. No debit. |
| Reserve run | Persistent operation id, supported release/rules/content versions | Lock budget and reserve one eligible slot; issue reservation id/TTL; no debit yet. Same operation retry returns same reservation. |
| Commit start | Reservation id, persistent start operation id | Exactly one debit and immutable attempt record; issue server seed, signed/config-hashed rules, opaque attempt token, server start timestamp. Same operation retry returns the same attempt/seed. |
| Reconcile | Reservation/attempt/operation id | Authoritative RESERVED/ACTIVE/FINALIZING/FINISHED/CANCELLED/EXPIRED state and stored receipt. Read-only. |
| Cancel reservation | Reservation id, operation id | Only uncommitted reservation can be released; repeat is idempotent. Active attempts are not silently refunded. |
| Issue sponsor credit | Persistent issuance operation id + verified sponsor evidence | Verify eligibility/evidence server-side, grant at most one credit per evidence id within cap; unique issuance/evidence constraints prevent duplicate credits. A link click/local flag is not proof. |
| Finalize run | Attempt id/token, finalize operation id, immutable evidence digest/reference, claimed summary | Verify ownership/state/evidence; recompute score; commit one result/ledger effect and update best single-run record in one transaction. Store immutable receipt. |

Reservation prevents races across tabs/devices; define a reviewed TTL and recovery policy, not an arbitrary client timeout. Budget debit and attempt creation must be one transaction with row locks/uniqueness. No client-created tokens: attempt capability is high-entropy opaque server issuance, bound to owner/season/game/attempt, never logged or shown in screenshots.

## Finalization and network ambiguity

One token may finalize once. Identical retry with the **same finalize operation id and payload digest** returns the existing receipt without a second effect. A different finalize operation id or changed digest for an already finalized token is rejected as `duplicate_finalize` / conflict. Idempotent delivery must not mean accepting a second score submission.

If start/finalize response is lost, reconcile before any new attempt. Persist operation id before sending; do not discard reconciliation when UI host epoch changes. UI must say “status being checked”, not “attempt was not consumed” when commit is ambiguous. Leaving a committed game cannot create free attempts. Crash recovery/refunds require server-reviewed policy and evidence; no automatic client-requested refund.

Final results may use an outbox keyed by attempt + finalize operation + digest. Duplicate retries have exactly-once budget/result effects. Invalid replay is rejected and audited; evidence-upload retention, active attempt expiry, pause limits, season-boundary grace and abandoned attempt policy remain backend/product review decisions.

## Replay/evidence hook

Record server seed and immutable versioned rules/content config; canonical tick-stamped input commands and sequence numbers; topology/expansion/director transitions; final logical tick, score, foods, length, death reason and optional checkpoints. A server verifier runs the same deterministic core/progression/director and recalculates the entire result, including effects, hazards, portal transfer and biome multiplier.

The current 32-bit DEV replay hash is a diagnostic, **not cryptographic validation**. Future evidence uses SHA-256 digests, authenticated upload references and server-owned receipts/checkpoints. A digest alone does not prove legitimate play; full deterministic replay and abuse/rate/time checks are required. Rendered screenshots, camera movement and claimed client score are never authoritative. Training has no attempt token or submit path.

Sponsor verification provider semantics and proof replay protection must be reviewed before implementation. Do not reuse Fly-specific start/sponsor RPCs or metric plausibility contracts: Phase 1 identified missing operation-id deduplication and ambiguous debit handling there.

## Required future contract tests

Double-click start; two tabs reserving last slot; lost successful commit response; expired reservation; duplicate sponsor proof; issuance retry; altered participant/season/version; finalize retry versus new operation/different digest; forged score; replay mismatch; cross-owner token; finalized token replay; rolling-window boundaries; season-end grace; reconnect/outbox delivery. No real daily attempts should be spent to test these flows.

Backend implementation remains gated on explicit authorization and contract review. No DB/schema/RLS/auth changes in this checkpoint.
