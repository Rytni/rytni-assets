async page=>{
 const dir='docs/qa/mushroom-fly-premium-v2/',failures=[],errors=[],baseline=[],rows=[];let checks=0;
 const check=(ok,name,data)=>{checks++;if(!ok)failures.push({name,data});};
 for(const [w,h,mobile]of [[1366,768,false],[390,844,true],[844,390,true]]){
  const c=await page.context().browser().newContext({viewport:{width:w,height:h},isMobile:mobile,hasTouch:mobile}),p=await c.newPage();
  p.on('pageerror',e=>errors.push(e.message));p.on('console',e=>{if(e.type()==='error')(e.location().url.includes('/auth/v1/health')?baseline:errors).push(e.text());});
  p.on('response',r=>{if(r.status()>=400){const url=r.url();(url.includes('/auth/v1/health')?baseline:errors).push({url,status:r.status()});}});
  p.on('requestfailed',r=>{if(r.failure()?.errorText!=='net::ERR_ABORTED')errors.push({url:r.url(),failure:r.failure()});});
  // Real public loader/assets; no candidate/resource interception and no RPC writes.
  await p.goto('https://rytni.live/testpodari?arcade_preview=1&progression_preview=1&ttq_preview=1');await p.waitForSelector('#rytniProgressionHub',{state:'attached'});await p.locator('#rytni-app-loader').waitFor({state:'detached',timeout:20000});
  // Anonymous review harness: reveal the existing host, not a replacement shell.
  await p.evaluate(()=>{let e=document.querySelector('#rytniProgressionHub');while(e&&e!==document.body){e.hidden=false;if(getComputedStyle(e).display==='none')e.style.display='block';e=e.parentElement;}});
  await p.locator('[data-progression-tab=arcade]').click();await p.locator('[data-ms-action=game-fly]').click();await p.evaluate(()=>RytniBrowserArcade.qaReady());await p.waitForTimeout(350);
  check(await p.locator('[data-fly-build=premium-v2]').count()===1,'public Fly Premium V2 '+w);
  check(await p.locator('#arcadeLeaderboard li').count()===3,'public TOP-3 '+w);
  check(await p.evaluate(()=>[...document.querySelectorAll('.rytni-arcade-head')].every(e=>getComputedStyle(e).display==='none')),'no duplicate outer Fly header '+w);
  check(await p.locator('#msFlyWrap').evaluate(e=>e.scrollWidth<=e.clientWidth),'no host horizontal overflow '+w);
  await p.locator('#msFlyWrap').screenshot({path:dir+'live-main-'+w+'.png',scale:'css',animations:'disabled'});
  if(w===844){await p.locator('[data-menu-action=fullscreen]').click();await p.waitForTimeout(200);check(await p.evaluate(()=>Boolean(document.fullscreenElement)),'mobile landscape fullscreen');}
  for(const screen of ['ranking','rules','settings','result','record']){
   if(screen==='result'||screen==='record')await p.evaluate(k=>RytniBrowserArcade.qaResult(k==='result'?'ranked':'record'),screen);else await p.evaluate(k=>RytniBrowserArcade.qaShowMenu(k),screen);
   check(await p.locator('#arcadeDialog').getAttribute('data-menu')===(screen==='record'?'result':screen),'public screen '+screen+' '+w);
   if(screen==='ranking')check(await p.locator('#arcadeFullLeaderboard .mf-ranking-row').count()===6,'all six public preview leaderboard rows '+w);
   if(screen==='rules'){await p.locator('[data-ui-tab=hazards]').click();check(await p.locator('[data-tab-panel=hazards]').evaluate(e=>getComputedStyle(e).display)!=='none','hazards tab '+w);}
   if(screen==='settings'){
    check(await p.locator('[data-audio-volume]:visible').count()===3,'real audio sliders '+w);await p.locator('[data-ui-tab=game]').click();check(await p.locator('[data-audio-volume]:visible').count()===0,'separate Game tab '+w);
   }
   if(screen==='result'||screen==='record')check(await p.locator('.rytni-arcade-modal-body').evaluate(e=>e.scrollHeight<=e.clientHeight+1),'public result no scroll '+w);
   await p.locator(w===844?'.rytni-arcade-stage':'#msFlyWrap').screenshot({path:dir+'live-'+screen+'-'+w+'.png',scale:'css',animations:'disabled'});
  }
  await p.evaluate(()=>RytniBrowserArcade.qaShowMenu('main'));
  if(!mobile){
   await p.locator('[data-menu-action=fullscreen]').click();check(await p.evaluate(()=>Boolean(document.fullscreenElement)),'desktop fullscreen');await p.evaluate(()=>RytniMushroomFly.exitFullscreen());
   await p.locator('[data-menu-action=training]').click();await p.waitForTimeout(100);await p.locator('#arcadePause').click();const s=await p.evaluate(()=>RytniBrowserArcade.qaRuntime());check(s.running&&s.paused,'public actual Training/Pause',s);await p.locator('#msFlyWrap').screenshot({path:dir+'live-pause-'+w+'.png',scale:'css'});
   await p.locator('[data-menu-action=settings]').click();await p.locator('[data-menu-action=back]').click();check(await p.locator('#arcadeDialog').getAttribute('data-menu')==='pause','public Settings returns Pause');await p.locator('[data-menu-action=resume]').click();check(!(await p.evaluate(()=>RytniBrowserArcade.qaRuntime())).paused,'public Resume');
   await p.locator('#arcadePause').click();await p.locator('[data-menu-action=home]').click();await p.locator('[data-menu-action=exit-confirm]').click();
  }
  if(w===844)await p.evaluate(()=>RytniMushroomFly.exitFullscreen());
  await p.locator('#msFlyWrap [data-ms-action=hub]').click();await p.locator('[data-ms-action=game-snake]').click();await p.waitForFunction(()=>RytniArcadeHub.snakeScreen==='main');await p.waitForTimeout(500);const f=p.frames().find(f=>f.url().includes('/snake/product/index.html'));
  check(f?.url().includes('snake-next-78436309631c'),'public locked Snake runtime '+w,f?.url());check(await p.locator('#msNextSnake').evaluate(e=>e.scrollWidth<=e.clientWidth),'public Snake smoke '+w);await p.locator('#msNextSnake').screenshot({path:dir+'live-snake-'+w+'.png',scale:'css',animations:'disabled'});
  rows.push({w,h,mobile,snake:f?.url(),requests:(await p.evaluate(()=>performance.getEntriesByType('resource').map(r=>r.name))).filter(n=>n.includes('giveaway-test')||n.includes('mushroom-fly-premium-v2'))});await c.close();
 }
 return {checks,failures,errors,baseline,rows};
}
