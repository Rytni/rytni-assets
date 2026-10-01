// Run after the desktop/mobile audit in its respective Playwright CLI session.
// Public TEST + anonymous preview only; no real ranked attempts.
async page => {
  if (!/^https:\/\/rytni\.live\/testpodari(?:\?|$)/.test(page.url())||!/[?&]arcade_preview=1(?:&|$)/.test(page.url())) throw Error('Anonymous TEST preview only');
  const out='.playwright-cli/foundation-audit', report={errors:[],failures:[],http:[],cases:[]};
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('requestfailed',r=>{if(/\/mushroom-(fly|snake)-/.test(r.url()))report.failures.push(r.url());});
  page.on('response',r=>{if(r.status()>=400&&/\/mushroom-(fly|snake)-/.test(r.url()))report.http.push({url:r.url(),status:r.status()});});
  await page.route('**/rest/v1/rpc/**',r=>/\/(get_|list_|is_)/.test(r.request().url())?r.continue():r.abort());
  const action=n=>page.locator(`[data-ms-action="${n}"]`).filter({visible:true}).last();
  const fly=n=>page.locator(`[data-menu-action="${n}"]`).filter({visible:true}).last();
  const mobile=await page.evaluate(()=>RytniMushroomSnake.mobile());
  if(await page.evaluate(()=>!!document.fullscreenElement))await page.evaluate(()=>document.exitFullscreen());
  if(await page.evaluate(()=>!!RytniArcadeHub.selected))await action('hub').click();
  if (mobile) {
    await page.setViewportSize({width:390,height:844});
    await action('game-snake').click();
    await page.waitForFunction(()=>RytniMushroomSnake.state==='menu');
    await action('start').click();
    await action('enter').waitFor({state:'visible',timeout:20000});
    for(const [width,height] of [[360,800],[390,844],[430,932]]) {
      await page.setViewportSize({width,height});
      await action('enter').waitFor({state:'visible'});
      await page.waitForTimeout(350);
      await page.locator('#msPanel').scrollIntoViewIfNeeded();
      await page.screenshot({path:`${out}/snake-portrait-ready-${width}.png`});
      report.cases.push(await page.evaluate(()=>({viewport:[innerWidth,innerHeight],state:RytniMushroomSnake.state,panel:[msPanel.clientWidth,msPanel.clientHeight],scrollOverflow:msPanel.scrollHeight-msPanel.clientHeight,images:[...msPanel.querySelectorAll('img')].map(i=>({src:i.currentSrc,loaded:i.complete&&i.naturalWidth>0}))})));
    }
    await action('hub').click();
  } else {
    const snapshot=()=>page.evaluate(()=>({selected:RytniArcadeHub.selected,popup:applicationPopup.getAttribute('aria-hidden'),full:!!document.fullscreenElement,fly:RytniBrowserArcade.qaRuntime(),snake:RytniMushroomSnake.state}));
    for(const game of ['fly','snake']) {
      await page.setViewportSize({width:1366,height:768});
      await action('game-'+game).click();
      if(game==='fly')await page.evaluate(()=>RytniBrowserArcade.qaReady());
      else await page.waitForFunction(()=>RytniMushroomSnake.state==='menu');
      await (game==='fly'?fly('fullscreen'):action('fullscreen')).click();
      await page.waitForFunction(()=>!!document.fullscreenElement);
      await page.keyboard.press('Escape');await page.waitForTimeout(120);
      report.cases.push({game,scenario:'Main fullscreen first Escape',after:await snapshot()});
      await (game==='fly'?fly('training'):action('start')).click();
      await page.waitForFunction(game=>game==='fly'?RytniBrowserArcade.qaRuntime().running:RytniMushroomSnake.state==='play',game);
      await page.locator(game==='fly'?'#arcadeFullscreen':'#msSnake [data-ms-action=fullscreen]').click();
      await page.waitForFunction(()=>!!document.fullscreenElement);
      const playing=await snapshot();
      await page.keyboard.press('Escape');await page.waitForTimeout(100);
      report.cases.push({game,scenario:'Playing fullscreen first Escape',before:playing,after:await snapshot()});
      await (game==='fly'?fly('resume'):action('resume')).click();
      await page.locator(game==='fly'?'#arcadeFullscreen':'#msSnake [data-ms-action=fullscreen]').click();
      await page.waitForFunction(()=>!!document.fullscreenElement);
      await page.locator(game==='fly'?'#arcadePause':'#msSnake [data-ms-action=pause]').click();
      const before=await snapshot();
      await page.screenshot({path:`${out}/${game}-paused-fullscreen-before-escape.png`});
      await page.keyboard.press('Escape');await page.waitForTimeout(150);
      const first=await snapshot();
      await page.screenshot({path:`${out}/${game}-paused-fullscreen-after-escape.png`});
      await page.keyboard.press('Escape');await page.waitForTimeout(250);
      const second=await snapshot();
      report.cases.push({game,scenario:'paused fullscreen Escape twice',before,first,second});
      if(second.popup==='true')await page.evaluate(()=>{showPopup('applicationPopup');RytniProgressionTabs.refresh();});
      if(await page.evaluate(()=>!!RytniArcadeHub.selected))await action('hub').click();
      // True page visibility transition via a second foreground tab, not a synthetic event.
      await action('game-'+game).click();
      if(game==='fly')await page.evaluate(()=>RytniBrowserArcade.qaReady());
      else await page.waitForFunction(()=>RytniMushroomSnake.state==='menu');
      await (game==='fly'?fly('training'):action('start')).click();
      const geometry=await page.evaluate(game=>{
        const c=document.querySelector(game==='fly'?'#rytniArcadeCanvas':'#msCanvas');const chain=[];
        for(let e=c;e&&chain.length<7;e=e.parentElement){const s=getComputedStyle(e);chain.push({tag:e.id||e.className,transform:s.transform,filter:s.filter,opacity:s.opacity,willChange:s.willChange,contain:s.contain});}
        return {chain,canvases:document.querySelectorAll('canvas').length,diag:__RYTNI_ARCADE_DIAG__.snapshot(),state:document.visibilityState};
      },game);
      await page.evaluate(()=>{window.__VIS_AUDIT__=[];document.addEventListener('visibilitychange',()=>__VIS_AUDIT__.push(document.visibilityState));});
      const other=await page.context().newPage();await other.goto('about:blank');await other.bringToFront();await page.waitForTimeout(300);
      const hidden=await snapshot();await page.bringToFront();await other.close();await page.waitForTimeout(100);
      const visibility=await page.evaluate(()=>({events:__VIS_AUDIT__,state:document.visibilityState,diag:__RYTNI_ARCADE_DIAG__.snapshot()}));
      report.cases.push({game,scenario:'compositor and real background-tab probe',geometry,hidden,visibility});
      await action('hub').click();await page.waitForTimeout(300);
    }
  }
  report.final=await page.evaluate(()=>__RYTNI_ARCADE_DIAG__.snapshot());
  await page.evaluate(report=>window.__FOUNDATION_SUPPLEMENT_REPORT__=report,report);
  return report;
}
