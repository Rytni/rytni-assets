async page=>{
 const base='http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html',dir='docs/qa/effects-production-art-a1/',errors=[],network=[],results=[],browser=page.context().browser();
 const fixtures=[['desktop-30',1920,1080,30,12,'01-desktop-normal.png'],['desktop-50',1920,1080,50,20,'02-desktop-far.png'],['mobile-30',844,390,30,12,'03-mobile-normal.png'],['mobile-40',844,390,40,16,null],['mobile-50',844,390,50,20,'04-mobile-far.png']];
 for(const [id,w,h,cols,rows,file]of fixtures){
  const mobile=id.startsWith('mobile'),context=await browser.newContext({viewport:{width:w,height:h},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?2:1}),p=await context.newPage();
  try{
   p.on('pageerror',e=>errors.push(id+': '+e.message));p.on('console',m=>{if(m.type()==='error')errors.push(id+': '+m.text());});p.on('response',r=>{if(r.status()>=400)network.push(r.status()+' '+r.url());});p.on('requestfailed',r=>network.push(r.url()));
   await p.bringToFront();await p.goto(base+'?art-fixture='+id);await p.waitForFunction(()=>tuningLab?.current?.pickups.length===9&&tuningLab.game.status==='paused');
   await p.evaluate(async()=>{const {effectAssets}=await import('./effect-playground/asset-bank.js');await effectAssets.preload();document.querySelector('#world-awareness').checked=false;tuningLab.game.render();});
   await p.frameLocator('#training').locator('[data-action="fullscreen"]').first().click();await p.waitForFunction(()=>tuningLab.game.root.ownerDocument.fullscreenElement===tuningLab.game.root);await p.waitForFunction(()=>tuningLab.game.renderer.w===tuningLab.game.root.ownerDocument.defaultView.innerWidth);
   const result=await p.evaluate(async()=>{
    const {effectAssets,assetFrame}=await import('./effect-playground/asset-bank.js'),{ASSET_CONTRACT}=await import('./effect-playground/asset-contract.js'),g=tuningLab.game,s=g.session,draws=[],original=effectAssets.draw;
    effectAssets.draw=function(ctx,key,x,y,size,tick,...rest){if(this.image(key))draws.push({key,tick,frame:assetFrame(this.contract[key],tick),size});return original.call(this,ctx,key,x,y,size,tick,...rest);};
    const hash=s.hash();try{g.render();g.render();}finally{effectAssets.draw=original;}
    const frozenTick=s.tick,frame=assetFrame(ASSET_CONTRACT['harvest.idle'],s.tick);g.root.querySelector('#overlay').hidden=true;
    // Still capture only: reveal normal-play controls while canonical time is
    // frozen. Runtime naturally hides them when paused; no input/style change.
    g.root.querySelector('#pad').hidden=!g.touch;
    return {world:[s.world.width,s.world.height],cell:g.renderer.last.cell,renderSize:[g.renderer.w,g.renderer.h],status:g.status,productionKeys:[...effectAssets.ready.keys()],errors:[...effectAssets.errors],draws,hashStable:s.hash()===hash,hash,frozenTick,frame,targets:[...g.root.querySelectorAll('#pad button')].map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})),fixtureForest:g.artFixtureForest};
   });
   if(result.world[0]!==cols||result.world[1]!==rows||result.productionKeys.length!==40||result.errors.length||!result.hashStable)throw Error('State/assets gate failed '+id);
   const pickupDraws=result.draws.filter(d=>!d.key.startsWith('food-'));if(new Set(pickupDraws.map(d=>d.key.split('.')[0])).size!==9)throw Error('Missing production pickup '+id);
   if(pickupDraws.some(d=>!Number.isInteger(d.tick)))throw Error('Noncanonical idle clock');
   const expectLOD=id!=='desktop-30';if(pickupDraws.some(d=>!d.key.endsWith(expectLOD?'.field-lod':'.idle')))throw Error('Semantic zoom gate '+id);
   if(mobile&&result.targets.some(t=>t.w<44||t.h<44))throw Error('D-pad target changed '+JSON.stringify(result));
   await p.waitForTimeout(150);const paused=await p.evaluate(()=>tuningLab.current.tick);if(paused!==result.frozenTick)throw Error('Pause did not freeze active tick');
   if(file)await p.frameLocator('#training').locator('#game').screenshot({path:dir+file,scale:'css'});
   if(id==='desktop-30'){
    await p.evaluate(()=>tuningLab.game.root.ownerDocument.exitFullscreen());await p.waitForFunction(()=>!tuningLab.game.root.ownerDocument.fullscreenElement);
    for(const effect of ['harvest','focus','rush'])await p.locator('[data-effect="'+effect+'"]').click();
    const hud=await p.evaluate(()=>{const g=tuningLab.game;return [...g.root.querySelectorAll('#effects .effect')].map(e=>({kind:e.dataset.effect,src:e.querySelector('img').src,text:e.textContent}));});
    if(hud.length!==3||hud.some(e=>!e.src.includes('/assets/effects/')||!e.src.endsWith('-hud.png')))throw Error('HUD production gate');
    await p.frameLocator('#training').locator('#hud').screenshot({path:dir+'05-hud-2-plus-1.png',scale:'css'});result.hud=hud;
    const foodKeys=async()=>p.evaluate(async()=>{const {effectAssets}=await import('./effect-playground/asset-bank.js'),g=tuningLab.game,hash=g.session.hash(),keys=[],original=effectAssets.draw;effectAssets.draw=function(ctx,key,...args){if(key.startsWith('food-')&&this.image(key))keys.push(key);return original.call(this,ctx,key,...args);};try{g.render();}finally{effectAssets.draw=original;}if(g.session.hash()!==hash)throw Error('Food rendering mutated hash');return keys;});
    const golden=await foodKeys();if(!golden.includes('food-golden.field@1x'))throw Error('Golden food PNG missing');
    await p.locator('[data-effect="weak"]').click();const corrupted=await foodKeys();if(!corrupted.includes('food-corrupted.field@1x'))throw Error('Corrupted food PNG missing');result.food={golden,corrupted};
   }else{await p.evaluate(()=>tuningLab.game.root.ownerDocument.exitFullscreen());await p.waitForFunction(()=>!tuningLab.game.root.ownerDocument.fullscreenElement);}
   const modeHash=await p.evaluate(()=>tuningLab.current.hash());for(let n=0;n<3;n++){await p.locator('#motion-toggle').click();if(await p.evaluate(()=>tuningLab.current.hash())!==modeHash)throw Error('Render mode altered hash');}result.modeHashParity=true;
   if(id==='desktop-30'){
    await p.evaluate(()=>tuningLab.game.resume());await p.waitForFunction(()=>tuningLab.current.tick>=16);await p.evaluate(()=>tuningLab.game.pause());
    const active=await p.evaluate(async()=>{const {assetFrame}=await import('./effect-playground/asset-bank.js'),{ASSET_CONTRACT}=await import('./effect-playground/asset-contract.js');return {tick:tuningLab.current.tick,frame:assetFrame(ASSET_CONTRACT['harvest.idle'],tuningLab.current.tick)};});if(active.frame===result.frame)throw Error('Active tick idle not advancing');result.idleAdvancesOnResume=active;
   }
   // Fresh normal run leaves the diagnostic placement and Forest override.
   await p.locator('#leave-art-fixture').click();await p.waitForFunction(()=>tuningLab.game.status==='playing'&&!tuningLab.game.artFixtureForest);
   const clean=await p.evaluate(()=>({world:[tuningLab.current.world.width,tuningLab.current.world.height],pickups:tuningLab.current.pickups.length}));if(clean.world[0]!==30||clean.pickups===9)throw Error('Fixture leaked');result.normalRunRestored=true;
   if(mobile){await p.frameLocator('#training').locator('#pad [data-dir="2"]').tap();}else{await p.evaluate(()=>tuningLab.game.root.ownerDocument.defaultView.focus());await p.keyboard.press('ArrowDown');}
   await p.waitForFunction(()=>tuningLab.current.state.direction===2);await p.evaluate(()=>tuningLab.game.pause());result.liveInput=true;
   results.push({fixture:id,...result});
  }finally{await context.close();}
 }
 const report={results,consoleErrors:errors,networkFailures:network};if(errors.length||network.length)throw Error(JSON.stringify({errors,network}));
 const dl=page.waitForEvent('download');await page.evaluate(r=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)],{type:'application/json'}));a.download='browser.json';a.click();},report);await(await dl).saveAs(dir+'browser.json');return {fixtures:results.map(r=>({id:r.fixture,cell:r.cell,lod:r.draws[0].key,hashStable:r.hashStable,modeHashParity:r.modeHashParity,liveInput:r.liveInput})),consoleErrors:errors,networkFailures:network};
}
