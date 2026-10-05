async page=>{
 const context=await page.context().browser().newContext({viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true}),p=await context.newPage(),errors=[];
 try{
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.goto('http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html?art-fixture=mobile-50');await p.waitForFunction(()=>tuningLab?.game?.status==='paused');
  await p.locator('#clear-effects').click();await p.locator('[data-effect="brambles"]').click();
  await p.evaluate(async()=>{
   const g=tuningLab.game,s=g.session,{hazardSafe}=await import('./progressive-run/world.js'),{effectAssets}=await import('./effect-playground/asset-bank.js');await effectAssets.preload();
   s.pickups=[];s.director.warnings=[];s.state.food=16*s.arena.width+20;const cell=14*s.arena.width+6;if(!hazardSafe(s,cell))throw Error('Unsafe live warning cell');
   s.director.warnings=[{cell,starts:120,ends:480}];g.root.ownerDocument.defaultView.rootSamples=[];
   const orig=effectAssets.draw;effectAssets.draw=function(ctx,key,...args){if(key.startsWith('vfx.roots-')){const list=g.root.ownerDocument.defaultView.rootSamples;if(!list.some(r=>r.key===key))list.push({key,tick:s.tick,solid:s.world.hazards.length});}return orig.call(this,ctx,key,...args);};
   const pause=g.pause.bind(g);g.pause=()=>{g.qaPause={clock:g.clock?.status,stack:new Error().stack};return pause();};g.render();
  });
  await p.bringToFront();await p.frameLocator('#training').locator('[data-action="resume"]').click();
  await p.waitForFunction(()=>tuningLab.current.tick>=180||tuningLab.game.status==='result',{},{timeout:6000});
  await p.frameLocator('#training').locator('#pad [data-dir="2"]').tap();
  await p.waitForFunction(()=>tuningLab.current.tick>=270||tuningLab.game.status==='result',{},{timeout:4000});
  await p.frameLocator('#training').locator('#pad [data-dir="3"]').tap();
  await p.waitForFunction(()=>tuningLab.current.tick>=502||tuningLab.game.status==='result',{},{timeout:6000});
  const report=await p.evaluate(()=>{const g=tuningLab.game,s=g.session;g.pause();return {tick:s.tick,status:s.status,samples:g.root.ownerDocument.defaultView.rootSamples,hazards:s.world.hazards.length,warnings:s.director.warnings.length};});
  const keys=report.samples.map(r=>r.key);for(const key of ['roots-crack','roots-sprout','roots-root','roots-decay'])if(!keys.includes('vfx.'+key))throw Error('Missing live '+key+' '+JSON.stringify(report));
  if(report.tick<502||report.hazards||report.warnings||errors.length)throw Error(JSON.stringify({report,errors}));
  const data={native60HzClock:true,legalDpadTurns:true,...report,errors},download=page.waitForEvent('download');await page.evaluate(data=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='roots-live.json';a.click();},data);await(await download).saveAs('docs/qa/effects-production-art-b1/roots-live.json');return data;
 }catch(error){const state=await p.evaluate(()=>({tick:tuningLab.current.tick,runtime:tuningLab.game.status,canonical:tuningLab.current.status,pause:tuningLab.game.qaPause,death:tuningLab.current.events,samples:tuningLab.game.root.ownerDocument.defaultView.rootSamples}));throw Error(error.message+' '+JSON.stringify(state));}finally{await context.close();}
}
