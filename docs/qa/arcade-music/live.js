async page=>{
 const rows=[],errors=[],baseline=[],failures=[],mutations=[];let checks=0;
 const check=(ok,name,data)=>{checks++;if(!ok)failures.push({name,data});};
 for(const mobile of [false,true]){
  let phase='public loader';
  const context=await page.context().browser().newContext({viewport:mobile?{width:844,height:390}:{width:1366,height:768},isMobile:mobile,hasTouch:mobile});
  const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
  p.on('response',r=>{if(r.status()>=400)(r.url().includes('/auth/v1/health')?baseline:errors).push({url:r.url(),status:r.status()});});
  await p.route('**/rest/v1/rpc/**',async route=>{if(/\/(?:start|finish|claim)_(?:browser_arcade|snake_product)/.test(route.request().url())){mutations.push(route.request().url());return route.abort();}return route.continue();});
  try{
   await p.goto('https://rytni.live/testpodari');await p.locator('#rytni-app-loader').waitFor({state:'detached',timeout:30000});
   await p.evaluate(()=>{let e=document.querySelector('#rytniProgressionHub');while(e&&e!==document.body){e.hidden=false;if(getComputedStyle(e).display==='none')e.style.display='block';e=e.parentElement;}});
   await p.locator('[data-progression-tab=arcade]').click();await p.locator('[data-ms-action=game-fly]').click();
   phase='Fly Training launch';
   await p.locator('[data-menu-action=training]').click();
   if(mobile&&await p.locator('[data-menu-action=mobile-confirm]').isVisible())await p.locator('[data-menu-action=mobile-confirm]').click();
   await p.waitForFunction(()=>document.querySelector('#arcadeOverlay').hidden);
   phase='Fly first music';
   await p.waitForFunction(()=>window.RytniMushroomFly?.audio.state().soundtrack?.track==='fly-skyline');
   let state=await p.evaluate(()=>RytniMushroomFly.audio.state());
   check(state.soundtrack.rates.every(r=>r===1),'LIVE Fly ×1 '+mobile,state.soundtrack);
   check(!state.musicError&&!state.soundtrack.error,'LIVE Fly music loaded '+mobile,state);
   check(await p.locator('#arcadeOverlay').evaluate(e=>e.hidden),'LIVE Training launch '+mobile);
   await p.locator('#arcadePause').click();const frozen=await p.evaluate(()=>RytniMushroomFly.audio.state().soundtrack);
   await p.waitForTimeout(150);state=await p.evaluate(()=>RytniMushroomFly.audio.state());
   check(state.soundtrack.voices===0&&state.soundtrack.seconds===frozen.seconds,'LIVE Fly pause '+mobile,state.soundtrack);
   phase='Fly resume';await p.locator('[data-menu-action=resume]').click();await p.waitForFunction(()=>RytniMushroomFly.audio.state().soundtrack.voices===1);
   rows.push({game:'fly',mobile,soundtrack:state.soundtrack});
   if(mobile)await p.evaluate(()=>RytniMushroomFly.exitFullscreen());
   await p.locator('#msFlyWrap [data-ms-action=hub]').click();
   check(await p.evaluate(()=>RytniMushroomFly.audio.state().sources===0),'LIVE Fly exit '+mobile);
   await p.locator('[data-ms-action=game-snake]').click();
   phase='Snake bootstrap';
   await p.waitForFunction(()=>['main','error'].includes(RytniArcadeHub.snakeScreen));
   const product=p.frames().find(f=>f.url().includes('/snake/product/index.html'));
   check(!!product,'LIVE current Snake frame '+mobile);
   const url=new URL(product.url()),identity=url.pathname.match(/\/(snake-next-[a-f0-9]{12})\//)?.[1];
   check(url.searchParams.get('release')===identity&&!url.searchParams.has('mock'),'LIVE real hosted release identity '+mobile,{identity,release:url.searchParams.get('release')});
   const appSource=await product.evaluate(async()=>await(await fetch(new URL('./app.js',location.href))).text());
   check(appSource.includes('createHostedBackend(window.SnakeTestHost)'),'LIVE authenticated adapter present '+mobile);
   await product.locator('#menu [data-action=training]').click();
   phase='Snake Training music';
   if(mobile&&await product.locator('[data-action=gate-confirm]').isVisible())await product.locator('[data-action=gate-confirm]').click();
   const engine=p.frames().find(f=>f.url().includes('/snake/product/frame.html'));
   await engine.waitForFunction(()=>window.snakeProductGame?.audio.summary().soundtrack?.track==='snake-moss');
   state=await engine.evaluate(()=>snakeProductGame.audio.summary());
   check(state.soundtrack.rates.every(r=>r===1)&&!state.error,'LIVE Snake music '+mobile,state);
   await engine.locator('#hud [data-action=pause]').click();
   check(await engine.evaluate(()=>snakeProductGame.audio.summary().soundtrack.voices===0),'LIVE Snake pause '+mobile);
   await product.locator('#menu .btn-play[data-action=resume]').click();
   await engine.waitForFunction(()=>snakeProductGame.audio.summary().soundtrack.voices===1);
   rows.push({game:'snake',mobile,soundtrack:state.soundtrack,frame:engine.url()});
  }catch(error){failures.push({mobile,phase,error:error.message,state:await p.evaluate(()=>({menu:document.querySelector('#arcadeOverlayTitle')?.textContent,overlay:document.querySelector('#arcadeOverlay')?.hidden,fullscreen:!!document.fullscreenElement,audio:window.RytniMushroomFly?.audio.state()})).catch(()=>null)});}
  finally{await context.close();}
 }
 check(mutations.length===0,'No ranked/sponsor mutation attempts',mutations);
 return {checks,rows,failures,errors,baseline,mutations};
}
