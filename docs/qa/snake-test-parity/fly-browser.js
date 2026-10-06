async page => {
  await page.route('**/*',route=>route.continue());
  await page.emulateMedia({reducedMotion:'reduce'});
  const results=[];
  for(const [label,width,height,mobile,fullscreen] of [['desktop1366',1366,768],['desktop1920',1920,1080],['desktop2560',2560,1440],['zoom125',1093,614],['embedded436',1366,768],['fullscreen844',844,390,true,true],['portrait390',390,844,true]]) {
    await page.setViewportSize({width,height});
    await page.goto(`http://127.0.0.1:8775/docs/qa/snake-test-parity/host-fixture.html?arcade_preview=1${label==='embedded436'?'&tiny=1':''}${mobile?'&mobile=1':''}`);
    await page.waitForFunction(()=>window.hostFixtureReady&&window.RytniBrowserArcade?.qaShowMenu);
    await page.locator('[data-ms-action="game-fly"]').click();
    await page.waitForSelector('#arcadeStart');
    await page.evaluate(()=>window.RytniBrowserArcade.qaReady());
    if(label==='embedded436')await page.evaluate(()=>{
      const stage=document.querySelector('.rytni-arcade-stage');
      stage.style.setProperty('width','436px','important');
      stage.closest('.rytni-arcade-layout').style.display='block';
    });
    if(fullscreen){await page.locator('#arcadeActions [data-menu-action="fullscreen"]').click();await page.waitForFunction(()=>!!document.fullscreenElement);}
    for(const screen of ['main','pause','settings','rules','result']) {
      await page.evaluate(screen=>{if(screen==='result')window.RytniBrowserArcade.qaResult('record');else window.RytniBrowserArcade.qaShowMenu(screen)},screen);
      await page.waitForTimeout(80);
      const metrics=await page.evaluate(()=>{
        const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
        const dialog=document.querySelector('#arcadeDialog'),stage=rect(dialog.closest('.rytni-arcade-stage'));
        const actions=[...dialog.querySelectorAll('button')].filter(e=>e.getClientRects().length).map(e=>({action:e.dataset.menuAction||e.id,...rect(e)}));
        const body=dialog.querySelector('.rytni-arcade-modal-body');
        return {stage,panel:rect(dialog),size:dialog.dataset.size,buttons:actions,minTarget:Math.min(...actions.map(b=>b.height)),close:rect(document.querySelector('#arcadeMenuClose')),bodyScroll:getComputedStyle(body).overflowY,panelScroll:getComputedStyle(dialog).overflowY,overflow:dialog.scrollWidth>dialog.clientWidth};
      });
      results.push({viewport:label,screen,...metrics});
      if(['desktop1366','fullscreen844','embedded436','portrait390'].includes(label))await page.locator('.rytni-arcade-stage').screenshot({path:`docs/qa/snake-test-parity/fly-${label}-${screen}.png`});
    }
    await page.evaluate(()=>window.RytniArcadeHub.leave());
  }
  await page.evaluate(results=>window.flyParityResults=results,results);
  return results.map(({viewport,screen,stage,panel,minTarget,close,bodyScroll,panelScroll,overflow})=>({viewport,screen,stage:[stage.width,stage.height],panel:[panel.width,panel.height],minTarget,close:[close.width,close.height],bodyScroll,panelScroll,overflow}));
}
