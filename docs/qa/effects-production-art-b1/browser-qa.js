async page=>{
 const base='http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html',dir='docs/qa/effects-production-art-b1/',browser=page.context().browser(),results=[],errors=[],network=[];
 const kinds=['harvest','focus','spores','guard','portalPrize','rush','weak','brambles','mist'];
 for(const [id,w,h,mobile]of [['desktop-30',1920,1080,false],['mobile-30',844,390,true],['mobile-40',844,390,true],['mobile-50',844,390,true]]){
  const context=await browser.newContext({viewport:{width:w,height:h},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?2:1}),p=await context.newPage();
  try{
   p.on('pageerror',e=>errors.push(id+': '+e.message));p.on('console',m=>{if(m.type()==='error')errors.push(id+': '+m.text());});p.on('response',r=>{if(r.status()>=400)network.push(r.status()+' '+r.url());});p.on('requestfailed',r=>network.push(r.url()));
   await p.goto(base+'?art-fixture='+id);await p.waitForFunction(()=>window.tuningLab?.game?.status==='paused');
   await p.evaluate(async()=>{const {effectAssets}=await import('./effect-playground/asset-bank.js');await effectAssets.preload();});
   const inventory=await p.evaluate(async()=>{const {effectAssets}=await import('./effect-playground/asset-bank.js');return {ready:effectAssets.ready.size,errors:[...effectAssets.errors],preset:tuningLab.profile.id};});
   if(inventory.ready!==59||inventory.errors.length||inventory.preset!=='B')throw Error('Load/preset failure '+id);
   const fx=[];
   for(const kind of kinds){
    await p.locator('#clear-effects').click();await p.locator('[data-effect="'+kind+'"]').click();
    const sample=await p.evaluate(async kind=>{
     const g=tuningLab.game,s=g.session,{effectAssets}=await import('./effect-playground/asset-bank.js');
     // Explicit DEV-only presentation fixtures. Canonical hash is checked AFTER setup.
     s.tick=100;s.state.tick=100;s.pickups=[];s.feedback=[];
     if(kind==='spores'){s.director.sporeDrop(s);if(!s.spores.length)throw Error('No collectible spores');s.spores[0].magnetTick=94;}
     if(kind==='brambles'){s.director.warnings.forEach(w=>w.starts=118);}
     const draws=[],orig=effectAssets.draw;effectAssets.draw=function(ctx,key,...args){if(this.image(key))draws.push({key,args:args.slice(0,5)});return orig.call(this,ctx,key,...args);};
     const before=s.hash(),feedback=JSON.stringify(s.feedback);try{g.render();}finally{effectAssets.draw=orig;}
     if(s.hash()!==before||JSON.stringify(s.feedback)!==feedback)throw Error('Renderer mutation');
     const raster=g.renderer.canvas.toDataURL();g.render();if(g.renderer.canvas.toDataURL()!==raster)throw Error('Effect pause raster unstable '+kind);
     const floors={'focus-wisp':17,'spore-idle':18,'spore-trail':8,'guard-plate':20,'guard-charged':25,'rush-ember':17,'rush-thorn':17,'portal-charged-ring':30,'corruption-particle':11,'roots-crack':28,'roots-sprout':24};
     for(const d of draws){const floor=floors[d.key.slice(4)];if(floor&&d.args[2]<floor)throw Error('Runtime floor missed '+d.key);}
     return {kind,keys:[...new Set(draws.map(d=>d.key))],hashStable:true,draws,cell:g.renderer.last.cell,hud:[...g.root.querySelectorAll('#effects .effect')].map(e=>({kind:e.dataset.effect,url:e.querySelector('img').src,rect:e.getBoundingClientRect().toJSON()}))};
    },kind);
    const expected={harvest:['harvest-sparkle'],focus:['focus-wisp'],spores:['spore-idle','spore-trail'],guard:['guard-plate','guard-charged'],portalPrize:['portal-charged-ring'],rush:['rush-ember','rush-thorn'],weak:['corruption-particle'],brambles:['roots-crack','roots-sprout'],mist:['mist-puff']}[kind];
    for(const key of expected)if(!sample.keys.includes('vfx.'+key))throw Error(id+' '+kind+' missing '+key);
    if(kind==='focus'&&sample.draws.filter(d=>d.key==='vfx.focus-wisp').length!==3)throw Error('Focus wisp count');
    fx.push(sample);
   }
   await p.locator('#clear-effects').click();for(const kind of ['harvest','focus','rush'])await p.locator('[data-effect="'+kind+'"]').click();
   await p.locator('#vfx-stress').click();
   const stress=await p.evaluate(async()=>{
    const g=tuningLab.game,s=g.session,{feedbackLanes}=await import('./effect-playground/vfx-presentation.js'),{vfxStressSession}=await import('./effect-playground/vfx-stress.js');
    const hash=s.hash(),feedback=JSON.stringify(s.feedback),effects=JSON.stringify(s.effects);g.render();
    if(s.hash()!==hash||JSON.stringify(s.feedback)!==feedback||JSON.stringify(s.effects)!==effects)throw Error('Stress mutated canonical state');
    const l=g.renderer.last,f=g.motion.frame(s),at=c=>({x:l.field.x+(c%s.arena.width+.5)*l.cell,y:l.field.y+(Math.floor(c/s.arena.width)+.5)*l.cell}),head={x:l.field.x+(f.head.x+.5)*l.cell,y:l.field.y+(f.head.y+.5)*l.cell};
    const lanes=feedbackLanes(vfxStressSession(s,g.vfxStressStart),s.tick+f.alpha,at,l.cell,l.arena,head);
    if(lanes.length>3)throw Error('Clutter glyph count');return {hashStable:true,lanes};
   });
   const pauseStress=await p.evaluate(()=>{const g=tuningLab.game;g.render();return g.renderer.canvas.toDataURL();});await p.waitForTimeout(150);
   if(await p.evaluate(()=>{const g=tuningLab.game;g.render();return g.renderer.canvas.toDataURL();})!==pauseStress)throw Error('Stress pause raster changed');
   await p.locator('[data-effect="focus"]').click();if(await p.evaluate(()=>tuningLab.game.vfxStressStart!=null))throw Error('Single effect retained stress');
   const hash=await p.evaluate(()=>tuningLab.current.hash());for(let i=0;i<3;i++){await p.locator('#motion-toggle').click();if(await p.evaluate(()=>tuningLab.current.hash())!==hash)throw Error('Mode hash changed');}
   const paused=await p.evaluate(()=>{const g=tuningLab.game;g.render();return {tick:tuningLab.current.tick,raster:g.renderer.canvas.toDataURL()};});await p.waitForTimeout(200);
   const frozen=await p.evaluate(()=>{const g=tuningLab.game;g.render();return {tick:tuningLab.current.tick,raster:g.renderer.canvas.toDataURL()};});if(frozen.tick!==paused.tick||frozen.raster!==paused.raster)throw Error('Pause did not freeze final effect raster');
   // One-shot fixtures include real raster cap reaction and the retired-source fallbacks are never used.
   const events=await p.evaluate(async()=>{
    const g=tuningLab.game,s=g.session,{effectAssets}=await import('./effect-playground/asset-bank.js'),{bodyCell}=await import('./simulation/body.js');
    const cell=bodyCell(s.state,0),draws=[],orig=effectAssets.draw;s.feedback=[{kind:'seed',cell,tick:s.tick-4,harvest:true,strong:true,combo:8,maxReached:true,amount:200},{kind:'seed',cell:cell+2,tick:s.tick-4,spore:true,amount:25},{kind:'guard-used',cell,tick:s.tick-4},{kind:'root-decay',cell:cell+112*2,tick:s.tick-4}];
    effectAssets.draw=function(ctx,key,...args){if(this.image(key))draws.push(key);return orig.call(this,ctx,key,...args);};const before=s.hash();try{g.render();}finally{effectAssets.draw=orig;}if(before!==s.hash())throw Error('Event render mutation');
    g.root.querySelector('#overlay').hidden=true;g.root.querySelector('#pad').hidden=!g.touch;
    return {keys:[...new Set(draws)],hashStable:true,targets:[...g.root.querySelectorAll('#pad button')].map(b=>({w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height}))};
   });
   for(const key of ['harvest-third-burst','spore-burst','guard-break','roots-decay'])if(!events.keys.includes('vfx.'+key))throw Error('Missing event '+key);
   if(mobile&&events.targets.some(t=>t.w<44||t.h<44))throw Error('D-pad targets');
   // Actual live fullscreen composite at the requested screen size.
   await p.frameLocator('#training').locator('[data-action="fullscreen"]').first().click();await p.waitForFunction(()=>tuningLab.game.root.ownerDocument.fullscreenElement===tuningLab.game.root);
   await p.evaluate(()=>{const g=tuningLab.game;g.render();g.root.querySelector('#overlay').hidden=true;g.root.querySelector('#pad').hidden=!g.touch;});
   await p.frameLocator('#training').locator('#game').screenshot({path:dir+'qa-composite-'+id+'.png',scale:'css'});
   await p.evaluate(()=>tuningLab.game.root.ownerDocument.exitFullscreen());await p.waitForFunction(()=>!tuningLab.game.root.ownerDocument.fullscreenElement);
   // Real restart clears one-shots; real active-tick input / resume / expiry.
   const starts=await p.evaluate(()=>tuningLab.game.starts);await p.locator('[data-art-fixture="'+id+'"]').click();await p.waitForFunction(n=>tuningLab.game.starts>n&&tuningLab.game.status==='paused',starts);
   if(await p.evaluate(()=>tuningLab.game.vfxStressStart!=null))throw Error('Restart stale stress');
   if(await p.evaluate(()=>tuningLab.current.feedback.length)!==0)throw Error('Restart stale feedback');
   await p.locator('#clear-effects').click();await p.locator('[data-effect="focus"]').click();
   await p.evaluate(()=>{tuningLab.current.effects[0].ends=tuningLab.current.tick+2;tuningLab.game.resume();});await p.waitForFunction(()=>tuningLab.current.tick>=3);await p.evaluate(()=>tuningLab.game.pause());
   if(await p.evaluate(()=>tuningLab.current.effects.some(e=>e.kind==='focus')))throw Error('Expired effect retained');
   await p.locator('#leave-art-fixture').click();await p.waitForFunction(()=>tuningLab.game.status==='playing');
   if(mobile)await p.frameLocator('#training').locator('#pad [data-dir="2"]').tap();else{await p.evaluate(()=>tuningLab.game.root.ownerDocument.defaultView.focus());await p.keyboard.press('ArrowDown');}
   await p.waitForFunction(()=>tuningLab.current.state.direction===2);await p.evaluate(()=>tuningLab.game.pause());
   results.push({id,inventory,fx,events,stress,pause:true,restart:true,expiry:true,liveInput:true,modeHashParity:true});
  }finally{await context.close();}
 }
 if(errors.length||network.length)throw Error(JSON.stringify({errors,network}));
 const report={results,consoleErrors:errors,networkFailures:network},download=page.waitForEvent('download');await page.evaluate(r=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)],{type:'application/json'}));a.download='browser.json';a.click();},report);await(await download).saveAs(dir+'browser.json');
 return {fixtures:results.map(r=>({id:r.id,activeEffects:r.fx.length,ready:r.inventory.ready,pause:r.pause,restart:r.restart,expiry:r.expiry,liveInput:r.liveInput,modeHashParity:r.modeHashParity})),consoleErrors:errors,networkFailures:network};
}
