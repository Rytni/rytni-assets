import test from 'node:test';
import assert from 'node:assert/strict';

// Loading dynamically lets the first run report the missing behavior as an assertion.
let api;
try { api = await import('./backend.js'); } catch {}

test('local adapter supplies the ranked contract without a production transport', async () => {
  assert.equal(typeof api?.createMockBackend, 'function', 'createMockBackend must exist');
  const backend = api.createMockBackend();
  const hub = await backend.hub();
  assert.equal(backend.mode, 'mock');
  assert.equal(hub.attempts_remaining, 3);
  assert.equal(hub.reward_points, 0);
  assert.equal(hub.best_score, 6840);
  assert.equal(hub.my_rank, 7);
  assert.equal(hub.leaderboard.length, 10);
  assert.equal(backend.sponsorUrl, 'https://t.me/astra_net_bot?start=ryt');
  assert.deepEqual(backend.calls, [{ method: 'hub', payload: {} }]);
});

test('start retry and concurrent duplicate spend one attempt', async () => {
  const backend = api.createMockBackend('one-attempt-left');
  const payload = { release: 'local-v1', requestId: 'start-1' };
  const [a, b] = await Promise.all([backend.start(payload), backend.start(payload)]);
  assert.equal(a.success, true);
  assert.deepEqual(b, a);
  assert.equal((await backend.hub()).attempts_remaining, 0);
  assert.equal((await backend.start({ ...payload, requestId: 'start-2' })).status, 'limit');
  assert.equal((await backend.start({ ...payload, release: 'other' })).status, 'idempotency_conflict');
});

test('sponsor credit is claimed twice at most and consumed only by start', async () => {
  const backend = api.createMockBackend('sponsor-available');
  const payload = { release: 'local-v1', requestId: 'claim-1' };
  const a = await backend.claim(payload);
  assert.equal(a.sponsor_attempt_credits, 1);
  assert.deepEqual(await backend.claim(payload), a);
  assert.equal((await backend.hub()).sponsor_attempt_credits, 1);
  const started = await backend.start({ release: 'local-v1', requestId: 'sponsor-1' });
  assert.equal(started.sponsor_attempt, true);
  assert.equal(started.sponsor_attempt_credits, 0);
  assert.equal((await backend.claim({ ...payload, requestId: 'claim-2' })).success, true);
  assert.equal((await backend.claim({ ...payload, requestId: 'claim-3' })).status, 'cooldown');
  assert.equal((await api.createMockBackend().claim(payload)).status, 'regular_attempts_available');
});

test('finish is bound to its attempt and release and retains a single best attempt', async () => {
  const backend = api.createMockBackend('leaderboard-empty');
  const a = await backend.start({ release: 'local-v1', requestId: 'a' });
  assert.equal((await backend.finish({ attempt_id: a.attempt_id, release: 'other', score: 900 })).status, 'release_mismatch');
  assert.equal((await backend.finish({ attempt_id: 'unknown', release: 'local-v1', score: 900 })).status, 'attempt_not_found');
  const finish = { attempt_id: a.attempt_id, release: 'local-v1', score: 900, ticks: 100 };
  const result = await backend.finish(finish);
  assert.equal(result.record, true);
  assert.equal(result.points_awarded, 0);
  assert.deepEqual(await backend.finish({ ...finish, score: 9999 }), result);
  const b = await backend.start({ release: 'local-v1', requestId: 'b' });
  await backend.finish({ attempt_id: b.attempt_id, release: 'local-v1', score: 600 });
  const hub = await backend.hub();
  assert.equal(hub.best_score, 900);
  assert.equal(hub.leaderboard.length, 1);
  assert.equal(hub.leaderboard[0].score, 900);
  assert.equal(hub.my_rank, 1);
});

test('invalid local results never enter the board', async () => {
  for (const score of [undefined, NaN, -1, 1.5, 10000001]) {
    const backend = api.createMockBackend('leaderboard-empty');
    const a = await backend.start({ release: 'local-v1', requestId: 'a' });
    assert.equal((await backend.finish({ attempt_id: a.attempt_id, release: 'local-v1', score })).status, 'invalid_result');
    assert.equal((await backend.hub()).leaderboard.length, 0);
  }
});

test('QA states expose deterministic empty, auth, pause, limit and network outcomes', async () => {
  const fixtures = [
    ['ready', 3, 0, true], ['one-attempt-left', 1, 0, true],
    ['no-attempts', 0, 0, false], ['sponsor-available', 0, 0, true],
    ['sponsor-credit', 0, 1, true], ['leaderboard-empty', 3, 0, true],
    ['record-result', 3, 0, true]
  ];
  for (const [state, remaining, credits, sponsor] of fixtures) {
    const hub = await api.createMockBackend(state).hub();
    assert.equal(hub.attempts_remaining, remaining, state);
    assert.equal(hub.sponsor_attempt_credits, credits, state);
    if (remaining === 0) assert.equal(hub.sponsor_attempt_available, sponsor, state);
  }
  for (const [state, status] of [['not-authenticated', 'not_authenticated'], ['arcade-paused', 'disabled'], ['network-error', 'network_error']]) {
    const backend = api.createMockBackend(state);
    assert.equal((await backend.hub()).status, status);
    assert.equal((await backend.start({ release: 'v1', requestId: 'a' })).success, false);
    assert.equal((await backend.claim({ release: 'v1', requestId: 'b' })).success, false);
  }
  assert.throws(() => api.createMockBackend('unknown'), /Unknown mock state/);
});

test('returned hub and calls cannot alter counters or stored results', async () => {
  const backend = api.createMockBackend();
  const hub = await backend.hub();
  hub.attempts_remaining = 100;
  hub.leaderboard[0].score = 99999;
  const next = await backend.hub();
  assert.equal(next.attempts_remaining, 3);
  assert.equal(next.leaderboard[0].score, 12480);
  assert.equal((await api.createMockBackend().hub()).attempts_remaining, 3);
});

test('ranked adapter requires explicit injected transport and filters audit payloads', async () => {
  assert.throws(() => api.createRankedBackend(), /transport/);
  const sent = [];
  const backend = api.createRankedBackend({
    participantId: 'participant-local', clientToken: 'private-local-token',
    transport: async (name, payload) => { sent.push({ name, payload }); return { success: true, status: 'ready' }; }
  });
  await backend.start({ release: 'v1', requestId: 'r1', p_participant_id: 'attacker' });
  await backend.finish({ attempt_id: 'a1', score: 12, release: 'v1', ticks: 30, duration_ms: 3000, audit: { replay: [] }, secret: 'omit' });
  assert.equal(sent[0].name, 'start_snake_product_attempt_v1');
  assert.equal(sent[0].payload.p_participant_id, 'participant-local');
  assert.equal(sent[0].payload.p_request_id, 'r1');
  assert.equal(sent[1].payload.p_score, 12);
  assert.deepEqual(sent[1].payload.p_audit, { replay: [] });
  assert.equal(sent[1].payload.secret, undefined);
  assert.equal(JSON.stringify(backend.calls).includes('private-local-token'), false);
});

test('ranked finish admits the controller aggregate stats without requiring replay', async () => {
  let submitted;
  const backend = api.createRankedBackend({ participantId: 'local-player', clientToken: 'local-private-token',
    transport: async (name, payload) => { submitted = payload; return { success: true, status: 'finished' }; } });
  await backend.finish({ attempt_id: 'a', score: 2480, release: 'local', duration_ms: 114000,
    active_ticks: 6840, foods: 24, length: 32, max_combo: 5, portal_uses: 2,
    expansions: 1, stage: 1, bonuses: 9, seed: 76194, final_hash: 'local-hash', secret: 'omit' });
  assert.equal(submitted.p_ticks, 6840);
  assert.deepEqual(submitted.p_audit, { foods: 24, length: 32, max_combo: 5, portal_uses: 2,
    expansions: 1, stage: 1, bonuses: 9, seed: 76194, final_hash: 'local-hash' });
  assert.equal(submitted.secret, undefined);
});
