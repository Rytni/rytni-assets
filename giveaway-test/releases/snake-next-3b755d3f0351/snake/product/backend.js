// This module has no network, storage, auth-client or Fly dependency.
export const SNAKE_SPONSOR_URL = 'https://t.me/astra_net_bot?start=ryt';
const STATES = new Set(['ready', 'one-attempt-left', 'no-attempts', 'sponsor-available',
  'sponsor-credit', 'not-authenticated', 'arcade-paused', 'network-error',
  'leaderboard-empty', 'record-result']);
const copy = value => structuredClone(value);
const failed = status => ({ success: false, status });
const validText = value => typeof value === 'string' && value.length > 0 && value.length <= 128;

/** Deterministic QA only: each instance owns its in-memory counters and leaderboard. */
export function createMockBackend(state = 'ready') {
  if (!STATES.has(state)) throw new Error(`Unknown mock state: ${state}`);
  let used = state === 'one-attempt-left' ? 2 : ['no-attempts', 'sponsor-available', 'sponsor-credit'].includes(state) ? 3 : 0;
  let claims = state === 'no-attempts' ? 2 : state === 'sponsor-credit' ? 1 : 0;
  let credits = state === 'sponsor-credit' ? 1 : 0;
  let best = state === 'record-result' ? 900 : state === 'leaderboard-empty' ? 0 : 6840;
  let sequence = 0;
  const attempts = new Map(), starts = new Map(), claimed = new Map(), calls = [];
  const others = state === 'leaderboard-empty' ? [] : [
    ['Лесной гость', 12480], ['Грибная королева', 11260], ['Тихий мицелий', 10480],
    ['Лисичка', 9820], ['Боровик', 8960], ['Хранитель леса', 7520],
    ['Грибник', 6120], ['Светлячок', 5280], ['Лесная тропа', 3960]
  ].map(([name, score]) => ({ name, score, is_me: false }));
  const reset = '2030-01-02T12:00:00.000Z'; // Fixed future clock for stable local screenshots.
  const gate = () => state === 'not-authenticated' ? failed('not_authenticated')
    : state === 'arcade-paused' ? failed('disabled')
      : state === 'network-error' ? failed('network_error') : null;
  const board = () => [...others, ...(best > 0 || [...attempts.values()].some(a => a.result) ? [{ name: 'Вы', score: best, is_me: true }] : [])]
    .sort((a, b) => b.score - a.score || Number(a.is_me) - Number(b.is_me) || a.name.localeCompare(b.name, 'ru'))
    .map((row, i) => ({ ...row, place: i + 1 }));
  const hub = () => {
    const blocked = gate();
    if (blocked) return blocked.status === 'disabled' ? { success: true, status: 'disabled', available: false, reward_points: 0 } : blocked;
    const leaderboard = board();
    return { success: true, status: 'ready', available: true, game: 'snake', season_id: 'mock-season',
      attempts_total: 3, attempts_used: used, attempts_remaining: 3 - used,
      next_attempt_at: used >= 3 ? reset : null, cycle: 'rolling_24h',
      sponsor_attempt_limit: 2, sponsor_attempts_used: claims, sponsor_attempt_credits: credits,
      sponsor_attempt_available: used >= 3 && claims < 2,
      next_sponsor_attempt_at: claims >= 2 ? reset : null,
      reward_points: 0, round_seconds: 0, best_score: best,
      my_rank: leaderboard.find(row => row.is_me)?.place ?? null, leaderboard };
  };
  const log = (method, payload = {}) => calls.push({ method, payload: copy(payload) });
  const requestError = payload => !validText(payload.release) || !validText(payload.requestId) ? failed('invalid_request') : null;
  const replay = (cache, payload) => {
    const old = cache.get(payload.requestId);
    return old ? old.release === payload.release ? copy(old.result) : failed('idempotency_conflict') : null;
  };
  return {
    mode: 'mock', state, sponsorUrl: SNAKE_SPONSOR_URL, calls,
    async hub() { log('hub'); return copy(hub()); },
    async start(payload = {}) {
      log('start', payload);
      const error = gate() || requestError(payload); if (error) return error;
      const old = replay(starts, payload); if (old) return old;
      if (used >= 3 && credits === 0) return { ...failed('limit'), attempts_remaining: 0, next_attempt_at: reset };
      const sponsor = used >= 3;
      if (sponsor) credits--; else used++;
      const id = `mock-snake-${++sequence}`;
      const result = { success: true, status: 'started', attempt_id: id, seed: 76193 + sequence,
        started_at: '2030-01-01T12:00:00.000Z', expires_at: '2030-01-02T00:00:00.000Z',
        sponsor_attempt: sponsor, sponsor_attempt_credits: credits, attempts_remaining: 3 - used,
        reward_points: 0, round_seconds: 0 };
      attempts.set(id, { release: payload.release, result: null });
      starts.set(payload.requestId, { release: payload.release, result: copy(result) });
      return result;
    },
    async finish(payload = {}) {
      log('finish', payload);
      const error = gate(); if (error) return error;
      const attempt = attempts.get(payload.attempt_id);
      if (!attempt) return failed('attempt_not_found');
      if (payload.release !== attempt.release) return failed('release_mismatch');
      if (attempt.result) return copy(attempt.result);
      if (!Number.isSafeInteger(payload.score) || payload.score < 0 || payload.score > 10000000) return failed('invalid_result');
      const record = payload.score > best;
      best = Math.max(best, payload.score);
      attempt.result = { success: true, status: 'finished', score: payload.score, best_score: best,
        record, points_awarded: 0, attempts_remaining: 3 - used, sponsor_attempt_credits: credits };
      attempt.result.my_rank = board().find(row => row.is_me)?.place ?? null;
      return copy(attempt.result);
    },
    async claim(payload = {}) {
      log('claim', payload);
      const error = gate() || requestError(payload); if (error) return error;
      const old = replay(claimed, payload); if (old) return old;
      if (used < 3) return failed('regular_attempts_available');
      if (claims >= 2) return { ...failed('cooldown'), next_sponsor_attempt_at: reset };
      claims++; credits++;
      const result = { success: true, status: 'credited', sponsor_attempt_credits: credits,
        sponsor_attempts_used: claims, sponsor_attempt_limit: 2, sponsor_attempt_available: claims < 2 };
      claimed.set(payload.requestId, { release: payload.release, result: copy(result) });
      return result;
    }
  };
}

/** Opt-in only. The host owns authentication, transport timeout/retry and account lifecycle. */
export function createRankedBackend(config = {}) {
  if (typeof config.transport !== 'function') throw new TypeError('Explicit transport is required');
  if (!validText(config.participantId) || !validText(config.clientToken)) throw new TypeError('Linked participant and clientToken are required');
  const calls = [];
  const send = async (method, name, payload, args) => {
    calls.push({ method, payload: copy(payload) });
    try {
      const result = await config.transport(name, { p_participant_id: config.participantId, ...args });
      return result && typeof result.success === 'boolean' ? result : failed('invalid_response');
    } catch { return failed('network_error'); }
  };
  return {
    mode: 'ranked', sponsorUrl: SNAKE_SPONSOR_URL, calls,
    hub: () => send('hub', 'get_snake_product_hub_v1', {}, {}),
    start: ({ release, requestId } = {}) => send('start', 'start_snake_product_attempt_v1', { release, requestId },
      { p_client_token: config.clientToken, p_release: release, p_request_id: requestId }),
    finish: (payload = {}) => {
      const { attempt_id, score, release, duration_ms } = payload;
      const ticks = payload.ticks ?? payload.active_ticks;
      const audit = { ...(payload.audit || {}) };
      for (const key of ['foods', 'length', 'max_combo', 'portal_uses', 'expansions', 'stage', 'bonuses', 'seed', 'final_hash']) {
        if (payload[key] !== undefined) audit[key] = payload[key];
      }
      return send('finish', 'finish_snake_product_attempt_v1', { attempt_id, score, release, duration_ms, ticks, audit },
        { p_client_token: config.clientToken, p_attempt_id: attempt_id, p_score: score, p_release: release,
          p_duration_ms: duration_ms, p_ticks: ticks, p_audit: audit });
    },
    claim: ({ release, requestId } = {}) => send('claim', 'claim_snake_product_sponsor_v1', { release, requestId },
      { p_client_token: config.clientToken, p_release: release, p_request_id: requestId })
  };
}
