async(page,{live=false,recoverStartupPause=false}={})=>{
 if(await page.evaluate(()=>!!document.fullscreenElement))await page.evaluate(()=>document.exitFullscreen());
 let source=await(await page.request.get('http://127.0.0.1:8776/docs/qa/snake-premium-ui-v5-implementation/site-qa.js')).text();
 const probe=await(await page.request.get('http://127.0.0.1:8776/docs/qa/snake-premium-ui-v5-1/text-probe.js')).text();
 const textChecks=[],startupRecoveries=[];
 source=source.replaceAll('snake-premium-ui-v5-implementation/','snake-premium-ui-v5-1/');
 source=source.replace("await page.bringToFront();",`source=source.replace('const result=await f.evaluate',${JSON.stringify('const text=await f.evaluate('+probe+');if(text.errors.length)throw Error("text fit "+name+" "+JSON.stringify(text.errors));textChecks.push({name,...text});const result=await f.evaluate')});await page.bringToFront();`);
 // Keep strict LIVE separate and failing on recovery. This opt-in typography
 // capture uses one normal Resume pointer action only, never clock/tick edits.
 if(recoverStartupPause){const old="await action('training');await f.waitForFunction(()=>document.querySelector('#product').dataset.screen==='playing');",replacement="await action('training');await f.waitForFunction(()=>['playing','pause'].includes(document.querySelector('#product').dataset.screen));if(await f.evaluate(()=>document.querySelector('#product').dataset.screen==='pause')){const game=f.childFrames().find(x=>x.url().includes('/product/frame.html')),reason=await game.evaluate(()=>snakeProductGame.clock?.reason);if(reason!=='scheduler-lag')throw Error('Unexpected startup pause '+reason);startupRecoveries.push({viewport:options.viewport,reason,action:'normal Resume pointer click'});await action('resume');await f.waitForFunction(()=>document.querySelector('#product').dataset.screen==='playing');}";source=source.replace("await page.bringToFront();",`source=source.replace(${JSON.stringify(old)},${JSON.stringify(replacement)});await page.bringToFront();`);}
 const run=eval('('+source+')'),results=[],failures=[];
 for(const viewport of [{width:1920,height:1080},{width:1366,height:768},{width:1280,height:720},{width:844,height:390}]){
  const mobile=viewport.width===844,ctx=await page.context().browser().newContext({viewport,hasTouch:mobile,isMobile:mobile}),p=await ctx.newPage();
  const startupErrors=[],startupResponses=[];p.on('pageerror',e=>startupErrors.push(e.message));p.on('response',r=>{if(r.status()>=400&&!r.url().includes('/auth/v1/health'))startupResponses.push({status:r.status(),url:r.url()});});
  try{results.push({viewport,...await run(p,{live,viewport,tag:String(viewport.width)})});}
  catch(error){const frames=[];for(const f of p.frames())frames.push({url:f.url(),state:await f.evaluate(()=>({screen:document.querySelector('#product')?.dataset.screen,hostSnakeScreen:window.RytniArcadeHub?.snakeScreen,ready:!!window.snakeProduct,gameReady:!!window.snakeProductGame,gameStatus:window.snakeProductGame?.status,clock:window.snakeProductGame?.clock?.status,clockReason:window.snakeProductGame?.clock?.reason,portrait:window.snakeProductGame?.portrait,hidden:document.hidden,focused:document.hasFocus()})).catch(()=>null)});await p.screenshot({path:'docs/qa/snake-premium-ui-v5-1/'+(live?'live':'candidate')+'-failure.png',scale:'css'}).catch(()=>{});failures.push({viewport,error:String(error),stack:error.stack,frames,startupErrors,startupResponses});break;}
  finally{if(await p.evaluate(()=>!!document.fullscreenElement).catch(()=>false))await p.evaluate(()=>document.exitFullscreen());await ctx.close();}
 }
 return {results,textChecks,startupRecoveries,strictStartup:!recoverStartupPause,checks:results.reduce((n,r)=>n+r.checks,0),failures,errors:[...results.flatMap(r=>r.errors),...failures.map(r=>r.error)],failed:results.flatMap(r=>r.failed)};
}
