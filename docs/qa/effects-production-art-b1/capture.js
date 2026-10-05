async page=>{
 const phase=await page.evaluate(()=>window.capturePhase||'before'),browser=page.context().browser(),dir='docs/qa/effects-production-art-b1/',reports=[],errors=[],network=[];
 const baseline=phase==='before'?await page.evaluate(async()=>{const r=await fetch('/docs/qa/effects-production-art-b1/baseline-local.json');if(!r.ok)throw Error('Run baseline.py first');return r.json();}):null;
 for(const [id,w,h,mobile]of [['desktop-30',1920,1080,false],['mobile-30',844,390,true],['mobile-40',844,390,true],['mobile-50',844,390,true]]){
  const context=await browser.newContext({viewport:{width:w,height:h},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?2:1}),p=await context.newPage();
  if(baseline)await context.route('**/*',async route=>{const path=route.request().url().split('127.0.0.1:8775')[1]?.split('?')[0],b=baseline[path];if(b)await route.fulfill({status:200,...b});else await route.continue();});
  try{
   p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)network.push(r.status()+' '+r.url());});p.on('requestfailed',r=>network.push(r.url()));
   await p.goto('http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html?art-fixture='+id);await p.waitForFunction(()=>window.tuningLab?.game?.status==='paused');
   await p.evaluate(async()=>{const {effectAssets}=await import('./effect-playground/asset-bank.js');await effectAssets.preload();document.querySelector('#world-awareness').checked=false;const doc=tuningLab.game.root.ownerDocument,style=doc.createElement('style');style.textContent='#overlay{display:none!important}';doc.head.append(style);});
   for(const kind of ['focus','spores','guard','portalPrize','rush']){
    await p.locator('#clear-effects').click();await p.locator('[data-effect="'+kind+'"]').click();
    if(!await p.evaluate(()=>!!tuningLab.game.root.ownerDocument.fullscreenElement)){await p.frameLocator('#training').locator('[data-action="fullscreen"]').first().click();await p.waitForFunction(()=>tuningLab.game.root.ownerDocument.fullscreenElement===tuningLab.game.root);}
    const report=await p.evaluate(async kind=>{
     const g=tuningLab.game,s=g.session,{bodyCell}=await import('./simulation/body.js'),{effectAssets}=await import('./effect-playground/asset-bank.js');s.tick=s.state.tick=100;s.pickups=[];s.feedback=[];const head=bodyCell(s.state,0),stride=s.arena.width;
     s.state.food=head+5+stride;
     if(kind==='spores')s.spores=[{cell:head+2-stride,born:70,ends:900},{cell:head+4,born:70,ends:900},{cell:head+3+stride,born:70,ends:900,magnetTick:94}];
     if(kind==='portalPrize'){s.portals=[head+2-stride,head+4+stride];s.director.windowEnd=900;s.portal.phase='armed';s.preparePortals();}
     g.motion.freeze(s,.4);const hash=s.hash(),draws=[],original=effectAssets.draw;effectAssets.draw=function(ctx,key,x,y,size,tick,...args){if(this.image(key)&&key.startsWith('vfx.'))draws.push({key,x,y,size,tick});return original.call(this,ctx,key,x,y,size,tick,...args);};try{g.render();}finally{effectAssets.draw=original;}
     if(s.hash()!==hash)throw Error('Render hash mutation');g.root.querySelector('#overlay').hidden=true;g.root.querySelector('#pad').hidden=!g.touch;
     const l=g.renderer.last,f=g.motion.frame(s),C=l.cell;
     const cx=l.field.x+(f.head.x+.5)*C,cy=l.field.y+(f.head.y+.5)*C,rect=g.renderer.canvas.getBoundingClientRect();
     const x=Math.max(rect.x,cx-7*C),y=Math.max(rect.y,cy-2.2*C),width=Math.min(12.4*C,rect.right-x),height=Math.min(4.7*C,rect.bottom-y);
     return {kind,world:[s.world.width,s.world.height],C,hash,draws,clip:{x,y,width,height}};
    },kind);
    await p.screenshot({path:dir+phase+'-'+id+'-'+kind+'.png',clip:report.clip,scale:'css'});reports.push({id,...report});
    await p.evaluate(()=>tuningLab.game.root.ownerDocument.exitFullscreen());await p.waitForFunction(()=>!tuningLab.game.root.ownerDocument.fullscreenElement);
   }
  }finally{await context.close();}
 }
 if(errors.length||network.length)throw Error(JSON.stringify({errors,network}));
 const data={phase,reports,consoleErrors:errors,networkFailures:network},download=page.waitForEvent('download');await page.evaluate(data=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='capture.json';a.click();},data);await(await download).saveAs(dir+phase+'.json');return {phase,captures:reports.length,errors,network};
}
