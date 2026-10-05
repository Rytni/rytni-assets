async page=>{
 const browser=page.context().browser(),dir='docs/qa/effects-production-art-b1/',results=[],errors=[],network=[];
 for(const id of ['desktop-30','mobile-50']){
  const mobile=id.startsWith('mobile'),context=await browser.newContext({viewport:{width:mobile?844:1920,height:mobile?390:1080},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile}),p=await context.newPage();
  try{
   p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)network.push(r.status()+' '+r.url());});p.on('requestfailed',r=>network.push(r.url()));
   await p.goto('http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html?art-fixture='+id);await p.waitForFunction(()=>tuningLab?.game?.status==='paused');
   await p.evaluate(async()=>{const {effectAssets}=await import('./effect-playground/asset-bank.js');await effectAssets.preload();document.querySelector('#world-awareness').checked=false;const style=tuningLab.game.root.ownerDocument.createElement('style');style.textContent='#overlay{display:none!important}';tuningLab.game.root.ownerDocument.head.append(style);});
   for(const kind of ['mist','stress','roots']){
    await p.locator('#clear-effects').click();if(kind==='stress')await p.locator('#vfx-stress').click();else await p.locator('[data-effect="'+(kind==='roots'?'brambles':'mist')+'"]').click();
    await p.frameLocator('#training').locator('[data-action="fullscreen"]').first().click();await p.waitForFunction(()=>tuningLab.game.root.ownerDocument.fullscreenElement);
    const r=await p.evaluate(async kind=>{
     const g=tuningLab.game,s=g.session,{bodyCell}=await import('./simulation/body.js'),{effectAssets}=await import('./effect-playground/asset-bank.js'),{hazardSafe}=await import('./progressive-run/world.js');
     s.tick=s.state.tick=kind==='mist'?430:100;s.pickups=[];s.feedback=[];
     if(kind==='stress')g.vfxStressStart=96;
     const head=bodyCell(s.state,0);s.state.food=head+5+s.arena.width;
     if(kind==='roots'){
      s.director.warnings=[];let candidate=-1;
      for(const dy of [-3,3,4,-4])for(const dx of [4,6,8]){const c=head+dx+dy*s.arena.width;if(candidate<0&&hazardSafe(s,c))candidate=c;}
      if(candidate<0)throw Error('Unsafe root fixture');
      s.director.warnings=[{cell:candidate,starts:118,ends:478}];
     }
     g.motion.freeze(s,.4);const hash=s.hash(),calls=[],original=effectAssets.draw;
     effectAssets.draw=function(ctx,key,x,y,size,tick,...rest){if(this.image(key)&&key.startsWith('vfx.'))calls.push({key,size,tick});return original.call(this,ctx,key,x,y,size,tick,...rest);};
     try{g.render();}finally{effectAssets.draw=original;}if(hash!==s.hash())throw Error('Extra render mutation');
     g.root.querySelector('#overlay').hidden=true;g.root.querySelector('#pad').hidden=!g.touch;
     return {kind,hashStable:true,calls,C:g.renderer.last.cell};
    },kind);
    await p.frameLocator('#training').locator('#game').screenshot({path:dir+kind+'-'+id+'.png',scale:'css'});results.push({id,...r});
    if(kind==='roots'){
     // Frame-by-frame canonical active tick at native 60Hz duration, not a
     // different Roots renderer. Advance Director only in the paused QA fixture.
     const lifecycle=await p.evaluate(async()=>{
      const g=tuningLab.game,s=g.session,{effectAssets}=await import('./effect-playground/asset-bank.js');const samples=[];
      for(const tick of [100,117,118,477,478,481,496,500]){
       s.tick=s.state.tick=tick;s.director.step(s);g.motion.freeze(s,.4);const hash=s.hash(),keys=[],orig=effectAssets.draw;
       effectAssets.draw=function(ctx,key,...args){if(this.image(key)&&key.startsWith('vfx.roots-'))keys.push(key);return orig.call(this,ctx,key,...args);};try{g.render();}finally{effectAssets.draw=orig;}
       if(s.hash()!==hash)throw Error('Roots render mutation');samples.push({tick,warning:s.director.warnings.length,solid:s.world.hazards.length,keys});
      }
      if(!samples[0].keys.includes('vfx.roots-sprout')||!samples[2].keys.includes('vfx.roots-root')||samples[2].solid!==1||!samples[4].keys.includes('vfx.roots-decay')||samples.at(-1).solid||samples.at(-1).keys.includes('vfx.roots-decay'))throw Error('Roots lifecycle');
      return samples;
     });results.at(-1).lifecycle=lifecycle;
    }
    await p.evaluate(()=>tuningLab.game.root.ownerDocument.exitFullscreen());await p.waitForFunction(()=>!tuningLab.game.root.ownerDocument.fullscreenElement);
   }
  }finally{await context.close();}
 }
 if(errors.length||network.length)throw Error(JSON.stringify({errors,network}));
 const data={results,errors,network},download=page.waitForEvent('download');await page.evaluate(data=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='extras.json';a.click();},data);await(await download).saveAs(dir+'extras.json');return {captures:results.length,rootsLifecycle:'PASS',errors,network};
}
