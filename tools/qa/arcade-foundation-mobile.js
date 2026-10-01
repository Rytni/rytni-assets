// Playwright CLI run-code fixture; open TEST with --mobile before running.
async page => {
  const out='.playwright-cli/foundation-audit',result={errors:[],failures:[],http:[],portrait:[],landscape:[]};
  if(!/^https:\/\/rytni\.live\/testpodari(?:\?|$)/.test(page.url()))throw Error('TEST only');
  page.on('pageerror',e=>result.errors.push(e.message));
  page.on('requestfailed',r=>{if(/\/mushroom-(fly|snake)-/.test(r.url()))result.failures.push(r.url());});
  page.on('response',r=>{if(r.status()>=400&&/\/mushroom-(fly|snake)-/.test(r.url()))result.http.push({url:r.url(),status:r.status()});});
  await page.route('**/rest/v1/rpc/**',r=>/\/(get_|list_|is_)/.test(r.request().url())?r.continue():r.abort());
  await page.setViewportSize({width:390,height:844});
  await page.goto('https://rytni.live/testpodari?arcade_preview=1&progression_preview=1&arcade_diag=1&mf_perf=1');
  await page.waitForFunction(()=>!!window.RytniArcadeHub);await page.locator('#rytni-app-loader').waitFor({state:'hidden'});
  if(!await page.evaluate(()=>RytniMushroomSnake.mobile()))throw Error('A real mobile browser context is required');
  await page.evaluate(()=>{applicationToolMode='boost';renderApplicationProfile({id:'audit-preview',user_id:'audit-preview-user',email_linked:true,name:'QA fixture',participant_number:7,steamid:'111111111',region:'Беларусь',games:'QA',level:11,points:7575,correct_streak:6,boost_count:41,daily_chest_count:72,daily_chest_streak:5,best_daily_chest_streak:12,can_daily_chest:true,can_sponsor_chest:true,sponsor_chest_enabled:true,sponsor_chest_reward:150,can_boost:true,test_mode:true});showPopup('applicationPopup');RytniProgressionTabs.refresh();});
  await page.locator('[data-progression-tab=arcade]').click();
  const snake=n=>page.locator(`[data-ms-action="${n}"]`).filter({visible:true}).last();
  const fly=n=>page.locator(`[data-menu-action="${n}"]`).filter({visible:true}).last();
  await snake('game-snake').click();await page.waitForTimeout(1000);await snake('start').click();
  for(const [width,height] of [[360,800],[390,844],[430,932]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(300);
    await page.locator('#msPanel').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/snake-portrait-${width}.png`});
    result.portrait.push(await page.evaluate(()=>{const p=msPanel.getBoundingClientRect();return{viewport:[innerWidth,innerHeight],state:RytniMushroomSnake.state,panel:[p.width,p.height],overflow:msPanel.scrollHeight-msPanel.clientHeight,full:RytniMushroomSnake.full()};}));
  }
  await snake('enter').click();await page.setViewportSize({width:844,height:390});await page.waitForFunction(()=>RytniMushroomSnake.state==='play');
  await page.waitForTimeout(100);await page.screenshot({path:`${out}/snake-mobile-landscape.png`});
  await snake('pause').click();await snake('resume').click();await page.waitForFunction(()=>RytniMushroomSnake.state==='play');
  for(const [width,height] of [[844,390],[915,412]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(100);
    result.landscape.push(await page.evaluate(()=>({viewport:[innerWidth,innerHeight],state:RytniMushroomSnake.state,full:RytniMushroomSnake.full(),view:RytniMushroomSnake.view,pad:!!msDpad.getClientRects().length})));
    await page.screenshot({path:`${out}/snake-landscape-${width}.png`});
  }
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);
  result.orientation=await page.evaluate(()=>({state:RytniMushroomSnake.state,raf:!!RytniMushroomSnake.raf}));
  // The external Hub backbar is intentionally outside the native fullscreen stage.
  await page.evaluate(()=>RytniMushroomSnake.exitFullscreen());await page.waitForFunction(()=>!RytniMushroomSnake.full());
  await snake('hub').click();await snake('game-fly').click();await page.evaluate(()=>RytniBrowserArcade.qaReady());
  await fly('training').click();await page.waitForTimeout(150);await page.screenshot({path:`${out}/fly-portrait-prompt.png`});
  await page.setViewportSize({width:915,height:412});
  const enter=fly('mobile-confirm');if(await enter.count())await enter.click();
  await page.waitForFunction(()=>RytniBrowserArcade.qaRuntime().running,{},{timeout:15000});
  await page.waitForTimeout(120);await page.screenshot({path:`${out}/fly-mobile-landscape.png`});
  await page.locator('#arcadePause').click();await fly('resume').click();await page.waitForFunction(()=>!RytniBrowserArcade.qaRuntime().paused);
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);
  result.flyOrientation=await page.evaluate(()=>RytniBrowserArcade.qaRuntime());
  await page.evaluate(()=>RytniMushroomFly.exitFullscreen());
  await snake('hub').click();await page.waitForTimeout(300);result.final=await page.evaluate(()=>__RYTNI_ARCADE_DIAG__.snapshot());
  await page.evaluate(result=>window.__FOUNDATION_MOBILE_REPORT__=result,result);return result;
}
