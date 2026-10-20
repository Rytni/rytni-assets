async page => {
  const rows = [], failures = [], errors = [], baseline = [], mutations = [];
  for (const mobile of [false, true]) {
    const context = await page.context().browser().newContext({
      viewport:mobile ? {width:844,height:390} : {width:1366,height:768},
      isMobile:mobile, hasTouch:mobile
    });
    const p = await context.newPage();
    p.on('pageerror', e => errors.push(e.message));
    p.on('response', response => {
      if (response.status() >= 400) (response.url().includes('/auth/v1/health') ? baseline : errors)
        .push({url:response.url(), status:response.status()});
    });
    // Defense in depth: no real ranked start/finish/sponsor mutation can leave this test.
    await p.route('**/rest/v1/rpc/**', async route => {
      if (/\/(start_browser_arcade|finish_browser_arcade|claim_browser_arcade)/.test(route.request().url())) {
        mutations.push(route.request().url());
        return route.abort();
      }
      return route.continue();
    });
    // No preview query and no RPC mocks: exercise the actual published non-preview code.
    await p.goto('https://rytni.live/testpodari');
    await p.locator('#rytni-app-loader').waitFor({state:'detached', timeout:30000});
    // Reveal the existing anonymous host, normally behind the participant login screen.
    await p.evaluate(() => {
      let e = document.querySelector('#rytniProgressionHub');
      while (e && e !== document.body) {
        e.hidden = false;
        if (getComputedStyle(e).display === 'none') e.style.display = 'block';
        e = e.parentElement;
      }
    });
    await p.locator('[data-progression-tab=arcade]').click();
    await p.locator('[data-ms-action=game-fly]').click();
    await p.locator('[data-menu-action=training]').click();
    if (mobile && await p.locator('[data-menu-action=mobile-confirm]').isVisible())
      await p.locator('[data-menu-action=mobile-confirm]').click();
    // First real load may still be warming collision/bonus assets after the button enables.
    await p.waitForFunction(() => document.querySelector('#arcadeOverlay').hidden,
      null, {timeout:20000}).catch(() => {});
    const row = {mobile, ...await p.evaluate(() => ({
      overlayHidden:document.querySelector('#arcadeOverlay').hidden,
      menu:document.querySelector('#arcadeDialog').dataset.menu,
      text:document.querySelector('#arcadeOverlayText').textContent,
      releases:performance.getEntriesByType('resource').map(r=>r.name)
        .filter(n=>n.includes('/giveaway-test/releases/') && n.includes('/app.html'))
    }))};
    rows.push(row);
    if (!row.overlayHidden) failures.push((mobile?'mobile':'desktop') + ': Training blocked by menu');
    else {
      await p.locator('#arcadePause').click();
      if (await p.locator('#arcadeDialog').getAttribute('data-menu') !== 'pause') failures.push('Pause failed');
      await p.locator('[data-menu-action=resume]').click();
      if (!await p.locator('#arcadeOverlay').evaluate(e=>e.hidden)) failures.push('Resume failed');
      await p.waitForFunction(() => document.querySelector('#arcadeDialog').dataset.menu === 'result', null, {timeout:20000});
      if (await p.locator('#arcadeOverlayTitle').textContent() !== 'Тренировка завершена') failures.push('Wrong Training result');
      await p.locator('.rytni-arcade-stage').screenshot({path:'docs/qa/fly-training-launch/live-'+(mobile?'mobile':'desktop')+'-result.png', scale:'css'});
    }
    await context.close();
  }
  return {rows, failures, errors, baseline, mutations};
}
