// Read-only public TEST audit. Run from repo root with Playwright CLI:
// playwright-cli -s=foundation open https://rytni.live/testpodari --browser=msedge
// playwright-cli -s=foundation run-code --filename=tools/qa/arcade-foundation-audit.js
// Only built-in anonymous preview fixtures are used; all non-read RPCs are blocked.
async page => {
  const out='.playwright-cli/foundation-audit', report={errors:[],assetFailures:[],asset404:[],blockedWrites:[],flows:[],geometry:[],cycles:[]};
  if(!/^https:\/\/rytni\.live\/testpodari(?:\?|$)/.test(page.url()))throw Error('This fixture runs on TEST only');
  const gameAsset=url=>/\/mushroom-(fly|snake)-v\d+\//.test(url);
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('requestfailed',r=>{if(gameAsset(r.url()))report.assetFailures.push({url:r.url(),error:r.failure()?.errorText});});
  page.on('response',r=>{if(gameAsset(r.url())&&r.status()>=400)report.asset404.push({status:r.status(),url:r.url()});});
  await page.route('**/rest/v1/rpc/**',r=>{
    const name=r.request().url().split('?')[0].split('/').at(-1);
    if(!/^(get_|list_|is_)/.test(name)){report.blockedWrites.push(name);return r.abort();}
    return r.continue();
  });
  await page.setViewportSize({width:1366,height:768});
  const cold=await page.context().newCDPSession(page);await cold.send('Network.clearBrowserCache');await cold.detach();
  await page.goto('https://rytni.live/testpodari?arcade_preview=1&progression_preview=1&arcade_diag=1&mf_perf=1');
  await page.waitForFunction(()=>!!window.RytniArcadeHub&&!!window.RytniMushroomFly);
  await page.locator('#rytni-app-loader').waitFor({state:'hidden'});
  report.boot=await page.evaluate(()=>({release:RYTNI_RELEASE,diag:__RYTNI_ARCADE_DIAG__.snapshot(),resources:performance.getEntriesByType('resource').filter(e=>/\/mushroom-(fly|snake)-v\d+\//.test(e.name)).map(e=>e.name),releaseResources:performance.getEntriesByType('resource').filter(e=>/releases\/.*app.html/.test(e.name)).map(e=>e.name)}));
  await page.evaluate(()=>{
    applicationToolMode='boost';
    renderApplicationProfile({id:'audit-preview',user_id:'audit-preview-user',email_linked:true,name:'QA fixture',participant_number:7,steamid:'111111111',region:'Беларусь',games:'QA',level:11,points:7575,correct_streak:6,boost_count:41,daily_chest_count:72,daily_chest_streak:5,best_daily_chest_streak:12,can_daily_chest:true,can_sponsor_chest:true,sponsor_chest_enabled:true,sponsor_chest_reward:150,can_boost:true,test_mode:true});
    showPopup('applicationPopup');RytniProgressionTabs.refresh();
  });
  await page.locator('[data-progression-tab=arcade]').click();
  const snakeAction=n=>page.locator(`[data-ms-action="${n}"]`).filter({visible:true}).last();
  const flyAction=n=>page.locator(`[data-menu-action="${n}"]`).filter({visible:true}).last();
  const shot=async name=>{await page.screenshot({path:`${out}/${name}.png`});};
  const geometry=async label=>report.geometry.push(await page.evaluate(label=>{
    const rect=e=>{const r=e?.getBoundingClientRect();return r?{w:r.width,h:r.height,x:r.x,y:r.y}:null;};
    return{label,viewport:[innerWidth,innerHeight],fly:rect(document.querySelector('#msFlyWrap .rytni-arcade-stage')),snake:rect(document.querySelector('#msStage')),canvas:[...document.querySelectorAll('#rytniArcadeCanvas,#msCanvas')].map(e=>({id:e.id,css:rect(e),backing:[e.width,e.height]}))};
  },label));
  await shot('test-hub');
  const click=await page.evaluate(()=>performance.now());
  await snakeAction('game-fly').click();await page.evaluate(()=>RytniBrowserArcade.qaReady());
  await page.waitForFunction(()=>document.querySelector('#arcadeDialog').dataset.menu==='main');
  report.flyCold=await page.evaluate(click=>({click,visible:performance.now(),diag:__RYTNI_ARCADE_DIAG__.snapshot()}),click);
  await geometry('fly-main-1366');await shot('fly-main-desktop');
  for(const mode of ['rules','settings']){await flyAction(mode).click();await geometry('fly-'+mode);await shot('fly-'+mode);await flyAction('back').click();}
  await flyAction('mute').click();await flyAction('mute').click();report.flows.push('Fly Main → Rules → Settings → Sound → Main');
  await flyAction('play').click();await page.waitForFunction(()=>RytniBrowserArcade.qaRuntime().running);
  report.previewRanked={tested:true,serverVerified:false};
  await page.locator('#arcadePause').click();await flyAction('home').click();await flyAction('exit-confirm').click();
  await page.evaluate(()=>RytniBrowserArcade.qaSponsorState());await flyAction('sponsor').click();
  report.sponsor=await page.evaluate(()=>document.querySelector('#arcadeAttempts').textContent);
  await page.evaluate(()=>RytniBrowserArcade.refresh());
  await flyAction('training').click();await page.waitForFunction(()=>RytniBrowserArcade.qaRuntime().running);
  await page.waitForTimeout(300);await shot('fly-playing');await page.locator('#arcadePause').click();
  const paused=await page.evaluate(()=>RytniBrowserArcade.qaRuntime().elapsed);await page.waitForTimeout(180);
  report.pauseFrozen=paused===await page.evaluate(()=>RytniBrowserArcade.qaRuntime().elapsed);
  await flyAction('settings').click();await flyAction('back').click();await flyAction('resume').click();
  await page.waitForFunction(()=>!RytniBrowserArcade.qaRuntime().paused);
  await page.locator('#arcadePause').click();await flyAction('restart').click();await flyAction('restart-confirm').click();
  await page.waitForFunction(()=>RytniBrowserArcade.qaRuntime().running&&!RytniBrowserArcade.qaRuntime().paused);
  await page.waitForFunction(()=>document.querySelector('#arcadeDialog').dataset.menu==='result',{},{timeout:15000});
  await shot('fly-result');await flyAction('home').click();report.flows.push('Fly Training → Pause → Settings → Resume → Restart → real death/Result → Main');
  await flyAction('fullscreen').click();await page.waitForFunction(()=>!!document.fullscreenElement);
  await page.keyboard.press('Escape');await page.waitForTimeout(200);
  report.escape=await page.evaluate(()=>({fullscreen:!!document.fullscreenElement,popupHidden:document.querySelector('#applicationPopup').getAttribute('aria-hidden'),selected:RytniArcadeHub.selected,menu:document.querySelector('#arcadeDialog').dataset.menu}));
  await snakeAction('hub').click();await page.waitForTimeout(250);report.cycles.push(await page.evaluate(()=>__RYTNI_ARCADE_DIAG__.snapshot()));
  const before=await page.evaluate(()=>__RYTNI_ARCADE_DIAG__.fly.requestedAssetCount),warm=await page.evaluate(()=>performance.now());
  await snakeAction('game-fly').click();await page.evaluate(()=>RytniBrowserArcade.qaReady());
  report.flyWarm=await page.evaluate(({before,warm})=>({ms:performance.now()-warm,newRequests:__RYTNI_ARCADE_DIAG__.fly.requestedAssetCount-before,duplicates:__RYTNI_ARCADE_DIAG__.fly.duplicateAssetRequests}),{before,warm});
  await snakeAction('hub').click();await snakeAction('game-snake').click();await page.waitForTimeout(1000);
  await geometry('snake-main-1366');await shot('snake-main-desktop');
  await snakeAction('start').click();await page.waitForFunction(()=>RytniMushroomSnake.state==='play');await page.waitForTimeout(250);
  await shot('snake-playing-desktop');await snakeAction('pause').click();await snakeAction('resume').click();await page.waitForFunction(()=>RytniMushroomSnake.state==='play');
  await page.waitForFunction(()=>RytniMushroomSnake.state==='result',{},{timeout:15000});await shot('snake-result');
  await snakeAction('hub').click();report.flows.push('Legacy Snake Main → Training → Pause → Resume → real Result → Hub');
  for(let i=0;i<3;i++){for(const game of ['fly','snake']){await snakeAction('game-'+game).click();await page.waitForTimeout(120);await snakeAction('hub').click();await page.waitForTimeout(220);}report.cycles.push(await page.evaluate(()=>__RYTNI_ARCADE_DIAG__.snapshot()));}
  for(const size of [{width:1920,height:1080},{width:2560,height:1440}]){await page.setViewportSize(size);await snakeAction('game-fly').click();await page.waitForTimeout(250);await geometry('fly-main-'+size.width);await shot('fly-main-'+size.width);await snakeAction('hub').click();}
  report.final=await page.evaluate(()=>__RYTNI_ARCADE_DIAG__.snapshot());
  await page.evaluate(report=>window.__FOUNDATION_AUDIT_REPORT__=report,report);
  return report;
}
