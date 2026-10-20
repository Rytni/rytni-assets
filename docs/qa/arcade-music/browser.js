async page => {
 const errors=[],failures=[],rows=[],contexts=[];let checks=0,phase='initialization',activePage;
 const check=(ok,name,data)=>{checks++;if(!ok)failures.push({name,data});};
 const base='http://127.0.0.1:8789';
 try { for(const mobile of [false,true]){
  phase='Fly '+mobile;
  const context=await page.context().browser().newContext({viewport:mobile?{width:844,height:390}:{width:1366,height:768},isMobile:mobile,hasTouch:mobile});
  contexts.push(context);const p=await context.newPage();activePage=p;p.on('pageerror',e=>errors.push(e.message));
  p.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
  p.on('response',r=>{if(r.status()>=400)errors.push({url:r.url(),status:r.status()});});
  await p.goto(base+'/docs/qa/snake-test-parity/host-fixture.html?arcade_preview=1');
  await p.waitForFunction(()=>window.hostFixtureReady);
  await p.locator('[data-ms-action=game-fly]').click();await p.evaluate(()=>RytniBrowserArcade.qaReady());
  await p.locator('[data-menu-action=training]').click();
  if(mobile&&await p.locator('[data-menu-action=mobile-confirm]').isVisible())await p.locator('[data-menu-action=mobile-confirm]').click();
  await p.waitForFunction(()=>RytniBrowserArcade.qaAudioState().soundtrack?.track==='fly-skyline');
  const fly=[];
  for(const [score,track]of [[0,'fly-skyline']]){
   await p.evaluate(s=>RytniBrowserArcade.qaPreviewScore(s),score);
   await p.waitForFunction(id=>RytniBrowserArcade.qaAudioState().soundtrack?.track===id,track);
   const state=await p.evaluate(()=>RytniBrowserArcade.qaAudioState());fly.push(state.soundtrack);
   check(state.soundtrack.rates.every(r=>r===1),'Fly rate ×1 '+track);
   check(state.soundtrack.voices<=2&&state.soundtrack.decoded<=2,'Fly bounded '+track,state.soundtrack);
   check(!state.musicTimer,'Fly has no music timer');
  }
  await p.locator('#arcadePause').click();
  const frozen=await p.evaluate(()=>RytniBrowserArcade.qaAudioState().soundtrack);
  await p.waitForTimeout(150);
  const still=await p.evaluate(()=>RytniBrowserArcade.qaAudioState().soundtrack);
  check(still.voices===0&&still.seconds===frozen.seconds,'Fly pause freezes music',still);
  await p.locator('[data-menu-action=resume]').click();
  await p.waitForFunction(()=>RytniBrowserArcade.qaAudioState().soundtrack.voices===1);
  await p.evaluate(()=>RytniMushroomFly.audio.setMode('bonus'));
  check((await p.evaluate(()=>RytniBrowserArcade.qaAudioState().soundtrack.rates)).every(r=>r===1),'Fly portal does not transpose/speed music');
  if(mobile)await p.evaluate(()=>RytniMushroomFly.exitFullscreen());
  await p.locator('#msFlyWrap [data-ms-action=hub]').click();
  check((await p.evaluate(()=>RytniMushroomFly.audio.state())).sources===0,'Fly exit releases every source');
  rows.push({game:'fly',mobile,tracks:fly});

  phase='Snake bootstrap '+mobile;await p.goto(base+'/arcade/snake-next/product/index.html?mock=ready&qa=1');
  await p.waitForFunction(()=>window.snakeProduct?.game&&snakeProduct.controller.hub);
  await p.locator('#menu [data-action=training]').click();
  if(mobile&&await p.locator('[data-action=gate-confirm]').isVisible())await p.locator('[data-action=gate-confirm]').click();
  await p.waitForFunction(()=>snakeProduct.game.audio.summary().soundtrack?.track==='snake-moss');
  await p.evaluate(()=>snakeProduct.controller.pause());
  check(await p.evaluate(()=>snakeProduct.game.audio.summary().soundtrack.voices===0),'Snake pause stops music');
  const hash=await p.evaluate(()=>snakeProduct.game.session.hash());
  const snake=[];
  for(let i=0;i<4;i++){
   await p.evaluate(async index=>{const g=snakeProduct.game;await g.audio.unlock();g.audio.syncMusic({tick:index*60,stage:{index}});},i);
   await p.waitForFunction(index=>snakeProduct.game.audio.summary().soundtrack.track===['snake-moss','snake-root','snake-crystal','snake-spore'][index],i);
   const state=await p.evaluate(()=>snakeProduct.game.audio.summary());snake.push(state.soundtrack);
   check(state.soundtrack.rates.every(r=>r===1),'Snake rate ×1 stage '+i);
   check(state.soundtrack.voices<=2&&state.soundtrack.decoded<=2,'Snake bounded stage '+i,state.soundtrack);
   check(await p.evaluate(h=>snakeProduct.game.session.hash()===h,hash),'Music leaves canonical Snake hash unchanged');
  }
  await p.evaluate(()=>{snakeProduct.settings.master=.7;snakeProduct.settings.music=.25;snakeProduct.settings.sfx=.4;snakeProduct.bridge.applySettings();});
  check(await p.evaluate(()=>snakeProduct.game.audio.musicBus.gain.value===.25&&Math.abs(snakeProduct.game.audio.sfxBus.gain.value-.4)<.0001),'Snake independent music/SFX sliders');
  await p.evaluate(()=>{snakeProduct.settings.muted=true;snakeProduct.bridge.applySettings();});
  check(await p.evaluate(()=>snakeProduct.game.audio.master.gain.value===0),'Snake master mute');
  await p.evaluate(()=>{snakeProduct.game.audio.stopAll();});
  check(await p.evaluate(()=>snakeProduct.game.audio.summary().sources===0),'Snake stop releases music and SFX');
  rows.push({game:'snake',mobile,hash,tracks:snake});
  await context.close();
 }
 phase='Review';const c=await page.context().browser().newContext(),p=await c.newPage();contexts.push(c);activePage=p;
 p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'/docs/qa/arcade-music/review.html');
 check(await p.locator('audio').count()===8,'Review exposes all eight actual files');
 await p.locator('#fly').click();await p.waitForFunction(()=>document.querySelector('#state').textContent.includes('Источников'));
 for(const title of ['Cloud Club','Daydream Delivery','Aurora Avenue']){
  await p.locator('#next').click();await p.waitForFunction(name=>document.querySelector('#now').textContent.includes(name)&&document.querySelector('#state').textContent.includes('Источников'),title);
  check(await p.locator('#state').textContent().then(t=>!t.includes('unavailable')),'Fly complete-track crossfade '+title);
 }
 await c.close();return {checks,failures,errors,rows};
 } catch(error){failures.push({phase,error:error.message});return {checks,failures,errors,rows};}
 finally{for(const context of contexts)await context.close().catch(()=>{});}
}
