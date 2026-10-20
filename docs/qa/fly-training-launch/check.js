async page => {
  const rows = [], failures = [], errors = [];
  for (const state of ['ready', 'network-error', 'not-authenticated', 'paused', 'no-profile', 'mobile-network']) {
    const mobile = state.startsWith('mobile');
    const context = await page.context().browser().newContext({
      viewport: mobile ? {width:844, height:390} : {width:1366, height:768},
      isMobile:mobile, hasTouch:mobile
    });
    const p = await context.newPage();
    p.on('pageerror', e => errors.push({state, message:e.message}));
    await p.addInitScript(state => {
      window.currentApplication = state === 'no-profile' ? null : {id:'local-training-check'};
      window.getClientToken = () => 'mock-only';
      window.__calls = [];
      window.callSupabaseRpc = async name => {
        __calls.push(name);
        if (!name.startsWith('get_')) throw Error('Training must not mutate backend: ' + name);
        if (state.includes('network')) throw Error('Mock network failure');
        if (state === 'not-authenticated') return {success:false, status:'not_authenticated'};
        return {success:true, status:'ready', available:state !== 'paused',
          attempts_total:3, attempts_remaining:3, leaderboard:[]};
      };
    }, state);
    // Exercise the non-preview launch branch with exclusively local RPC mocks.
    await p.route('**/08_T123_BROWSER_ARCADE_2.15.34.html', async route => {
      const response = await p.request.get(route.request().url());
      const source = (await response.text())
        .replace(/^  const preview=.*$/m, '  const preview=false;')
        .replace('if(preview)Object.assign(window.RytniBrowserArcade,{',
          'if(localHost)Object.assign(window.RytniBrowserArcade,{');
      await route.fulfill({body:source, contentType:'text/html'});
    });
    await p.goto('http://127.0.0.1:8776/docs/qa/snake-test-parity/host-fixture.html?arcade_preview=1');
    await p.waitForFunction(() => window.hostFixtureReady);
    await p.locator('[data-ms-action=game-fly]').click();
    await p.evaluate(() => RytniBrowserArcade.qaReady());
    const callsBeforeTraining = await p.evaluate(() => __calls.length);
    await p.locator('[data-menu-action=training]').click();
    if (mobile && await p.locator('[data-menu-action=mobile-confirm]').isVisible())
      await p.locator('[data-menu-action=mobile-confirm]').click();
    await p.waitForTimeout(200);
    const row = {state, ...await p.evaluate(() => ({runtime:RytniBrowserArcade.qaRuntime(),
      calls:__calls, overlayHidden:document.querySelector('#arcadeOverlay').hidden,
      text:document.querySelector('#arcadeOverlayText').textContent}))};
    rows.push(row);
    if (!row.runtime.running || !row.overlayHidden) failures.push(state + ': Training did not start');
    if (row.calls.some(name => !name.startsWith('get_'))) failures.push(state + ': backend mutation');
    if (row.calls.length !== callsBeforeTraining) failures.push(state + ': Training unexpectedly fetched ranked hub');
    if (row.runtime.running) {
      await p.locator('#arcadePause').click();
      const frozen = await p.evaluate(() => RytniBrowserArcade.qaRuntime().elapsed);
      await p.waitForTimeout(120);
      if (await p.evaluate(() => RytniBrowserArcade.qaRuntime().elapsed) !== frozen)
        failures.push(state + ': pause advanced gameplay');
      await p.locator('[data-menu-action=resume]').click();
      if (await p.evaluate(() => RytniBrowserArcade.qaRuntime().paused))
        failures.push(state + ': resume failed');
      await p.waitForFunction(() => document.querySelector('#arcadeDialog').dataset.menu === 'result', null, {timeout:20000});
      if (await p.locator('#arcadeOverlayTitle').textContent() !== 'Тренировка завершена')
        failures.push(state + ': wrong result');
      if (await p.evaluate(() => __calls.some(name => !name.startsWith('get_'))))
        failures.push(state + ': backend mutation on finish');
    }
    await context.close();
  }
  return {rows, failures, errors};
}
