async page=>{
 const errors=[],network=[],report={viewports:[]},browser=page.context().browser();
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:844,height:390}:{width:1920,height:1080},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?2:1}),p=await context.newPage();
  try{
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)network.push(r.status()+' '+r.url());});p.on('requestfailed',r=>network.push(r.url()));
  await p.bringToFront();await p.goto('http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html');await p.waitForFunction(()=>window.tuningLab?.game);
  const sizes=[];
  for(let stage=0;stage<4;stage++){
   await p.locator('[data-stage="'+stage+'"]').click();await p.waitForFunction(stage=>tuningLab.game.status==='playing'&&tuningLab.current.stage.index===stage,stage);
   await p.evaluate(()=>{const g=tuningLab.game;g.pause();g.status='playing';g.show();document.querySelector('#world-awareness').checked=false;g.render();});
   const embedded=await p.evaluate(()=>{const g=tuningLab.game,l=g.renderer.last,r=g.root.getBoundingClientRect();return {rootHeight:r.height,cabinetHeight:l.cabinet.h,unusedBelow:r.height-l.cabinet.y-l.cabinet.h};});
   if(!mobile&&Math.abs(embedded.unusedBelow)>1)throw Error('Embedded stage no longer shrink-wraps');
   // Trusted UI fullscreen action, not synthetic options.fullscreen.
   await p.frameLocator('#training').locator('[data-action="fullscreen"]').first().click();
   await p.waitForFunction(()=>tuningLab.game.root.ownerDocument.fullscreenElement===tuningLab.game.root);
   await p.waitForFunction(()=>{const g=tuningLab.game;return g.renderer.w===g.root.ownerDocument.defaultView.innerWidth&&g.renderer.last.playfieldRect;});
   const data=await p.evaluate(async()=>{
    const g=tuningLab.game,s=g.session,{apertureEdgeGaps}=await import('./effect-playground/aperture-qa.js'),{drawEnvironment}=await import('./gate-one/environment.js'),{sprite,KINDS}=await import('./effect-playground/art.js'),{objectImage}=await import('./forest-training/objects.js'),{objectPresentation}=await import('./effect-playground/readable-objects.js'),{effectAssets}=await import('./effect-playground/asset-bank.js');
    s.pickups=[{kind:'focus',cell:3*112+8,ends:99999},{kind:'harvest',cell:3*112+14,ends:99999},{kind:'rush',cell:3*112+20,ends:99999}];s.state.food=7*112+19;s.portal.phase='armed';s.director.windowEnd=99999;s.preparePortals();g.render();
    const l=g.renderer.last,h=s.hash();g.render();if(s.hash()!==h)throw Error('render mutated hash');
    const b=document.createElement('canvas');b.width=l.w;b.height=l.h;const x=b.getContext('2d'),f=g.motion.frame(s),view=tuningLab.camera;
    x.beginPath();x.rect(l.playfieldRect.x,l.playfieldRect.y,l.playfieldRect.w,l.playfieldRect.h);x.clip();drawEnvironment(x,s,view,l,f,false);
    const edgeGaps=apertureEdgeGaps(x.getImageData(0,0,b.width,b.height),l.cabinetAperture);
    const objects=[['food',objectImage(g.art,'food-red'),.7],...KINDS.map(k=>[k,sprite(k),g.compact?.94:.68])].map(([kind,im,scale])=>{const r=objectPresentation(im,kind,l.cell,g.compact,scale);return {kind,lod:r.lod,footprint:r.footprint,w:r.w,h:r.h,uniform:r.uniform};});
    return {world:[s.world.width,s.world.height],fullscreen:true,renderer:[l.w,l.h],cell:l.cell,body:l.cell*36/68,cabinetAperture:l.cabinetAperture,frame:l.frame,field:l.field,edgeGaps,objects,hash:h,pendingAssetRequests:effectAssets.cache.size,touchTargets:[...g.root.querySelectorAll('#pad button')].map(b=>({w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height})),pad:g.root.querySelector('#pad').getBoundingClientRect().toJSON()};
   });
   if(!data.edgeGaps.pass)throw Error('Visible border does not meet cabinet aperture');
   if(data.pendingAssetRequests!==0)throw Error('Pending art requested');
   if(mobile&&data.touchTargets.some(b=>b.w<44||b.h<44))throw Error('D-pad shrunk');
   data.embedded=embedded;const prefix=mobile?'mobile':'desktop',world=data.world.join('x');
   if(!mobile&&(stage===0||stage===2)||mobile&&(stage===1||stage===2))await p.frameLocator('#training').locator('#game').screenshot({path:'docs/qa/playfield-assets/'+prefix+'-'+world+'.png',scale:'css'});
   if(mobile&&stage===2){
    await p.evaluate(async()=>{const g=tuningLab.game,s=g.session,{KINDS}=await import('./effect-playground/art.js');s.pickups=KINDS.map((kind,i)=>({kind,cell:4*112+7+i*4,ends:s.tick+900}));s.effects=[{kind:'focus',started:s.tick,ends:s.tick+900},{kind:'guard',started:s.tick,ends:s.tick+900},{kind:'rush',started:s.tick,ends:s.tick+600}];s.spores=[{cell:6*112+23,ends:s.tick+900}];g.render();});
    await p.frameLocator('#training').locator('#game').screenshot({path:'docs/qa/playfield-assets/fallback-placement-lod.png',scale:'css'});
   }
   const hash=await p.evaluate(()=>tuningLab.current.hash());
   // Mode switches are parent controls; exit fullscreen first.
   await p.evaluate(()=>tuningLab.game.root.ownerDocument.exitFullscreen());await p.waitForFunction(()=>!tuningLab.game.root.ownerDocument.fullscreenElement);
   for(let i=0;i<3;i++){await p.locator('#motion-toggle').click();if(await p.evaluate(()=>tuningLab.current.hash())!==hash)throw Error('Mode changed hash');}data.modeHashParity=true;sizes.push(data);
  }
  await p.evaluate(()=>{const g=tuningLab.game;g.status='paused';g.resume();g.root.ownerDocument.defaultView.focus();});
  if(mobile)await p.frameLocator('#training').locator('#pad [data-dir="2"]').tap();else await p.keyboard.press('ArrowDown');
  await p.waitForFunction(()=>tuningLab.current.state.direction===2);
  const live=await p.evaluate(()=>{const g=tuningLab.game;g.pause();const f=g.motion.frame(g.session),h=g.session.hash();g.render();return {direction:g.session.state.direction,alphaStable:g.motion.frame(g.session,.9).alpha===f.alpha,hashStable:g.session.hash()===h};});
  if(!live.alphaStable||!live.hashStable)throw Error('pause');report.viewports.push({mobile,sizes,live});
  }finally{await context.close();}
 }
 report.errors=errors;report.network=network;
 const download=page.waitForEvent('download');await page.evaluate(r=>{const a=document.createElement('a');a.download='browser.json';a.href=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)],{type:'application/json'}));a.click();},report);await(await download).saveAs('docs/qa/playfield-assets/browser.json');
 if(errors.length||network.length)throw Error(JSON.stringify({errors,network}));return report;
}
