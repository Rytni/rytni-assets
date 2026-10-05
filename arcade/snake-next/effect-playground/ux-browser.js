async page=>{
 const browser=page.context().browser(),errors=[],network=[],report={viewports:[]};
 for(const mobile of [false,true]){
  const c=await browser.newContext({viewport:mobile?{width:844,height:390}:{width:1920,height:1080},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?2:1}),p=await c.newPage();
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)network.push(r.status()+' '+r.url());});p.on('requestfailed',r=>network.push(r.url()));
  try{
   await p.goto('http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html');await p.waitForFunction(()=>window.tuningLab?.game);await p.bringToFront();await p.locator('[data-stage="0"]').click();await p.waitForFunction(()=>tuningLab.game.status==='playing'&&tuningLab.current.stage.index===0);await p.evaluate(()=>{const g=tuningLab.game;g.pause();g.status='playing';g.show();g.render();document.querySelector('#world-awareness').checked=false;});
   for(const k of ['harvest','guard','rush'])await p.locator('[data-effect="'+k+'"]').click();
   const checks=await p.evaluate(()=>{const g=tuningLab.game,s=g.session,h=s.hash();g.render();return {hashUnchanged:h===s.hash(),mode:tuningLab.camera.mode,hud:g.root.querySelector('#hud').getBoundingClientRect().toJSON(),slots:[...g.root.querySelectorAll('#effects .effect')].map(e=>({text:e.textContent,prose:e.querySelectorAll('em,progress').length,width:e.getBoundingClientRect().width,icon:e.querySelector('img').getBoundingClientRect().width})),targets:[...g.root.querySelectorAll('#pad button')].map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})),pad:g.root.querySelector('#pad').getBoundingClientRect().toJSON(),cell:g.renderer.last.cell};});
   if(!checks.hashUnchanged||checks.mode!=='fit'||checks.slots.some(e=>e.prose)||mobile&&checks.targets.some(e=>e.w<44||e.h<44))throw Error(JSON.stringify(checks));
   await p.locator('#training').screenshot({path:'docs/qa/effect-ux/'+(mobile?'mobile':'desktop')+'.png',scale:'css'});
   if(mobile){const button=p.frameLocator('#training').locator('#pad [data-dir="0"]'),box=await button.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();
    if(!await p.evaluate(()=>tuningLab.game.commands.at(-1)?.direction===0&&tuningLab.game.root.querySelector('#pad [data-dir="0"]').classList.contains('pressed')))throw Error('D-pad input/pressed failed');
    await p.locator('#training').screenshot({path:'docs/qa/effect-ux/mobile-pressed.png',scale:'css'});await p.mouse.up();if(await button.evaluate(e=>e.classList.contains('pressed')))throw Error('D-pad release failed');
   }
   await p.locator('#clear-effects').click();
   const sizes=await p.evaluate(async()=>{const {fitWorldLayout,readability}=await import('./effect-playground/fit-world.js'),{KINDS,sprite}=await import('./effect-playground/art.js'),{objectImage}=await import('./forest-training/objects.js'),g=tuningLab.game,s=g.session,base={...g.renderer.last},f=g.motion.frame(s);
    const fraction=im=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d');ctx.drawImage(im,0,0);const d=ctx.getImageData(0,0,c.width,c.height).data;let x0=c.width,y0=c.height,x1=0,y1=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>0){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}return Math.max(x1-x0+1,y1-y0+1)/Math.max(c.width,c.height);};
    const pickups=KINDS.map(k=>fraction(sprite(k))),food=fraction(objectImage(g.art,'food-red'));
    return [[28,12],[36,18],[48,24],[64,32],[80,40],[112,56]].map(([width,height])=>{const r=readability(fitWorldLayout(base,{...s,world:{...s.world,width,height},openings:[]},f).layout.cell,g.compact);return {world:[width,height],...r,foodInk:r.food*food,pickupInk:[r.pickupBox*Math.min(...pickups),r.pickupBox*Math.max(...pickups)]};});});
   const individual=[];for(const kind of ['harvest','focus','spores','guard','portalPrize','rush','weak','brambles','mist']){await p.locator('#clear-effects').click();await p.locator('[data-effect="'+kind+'"]').click();individual.push(await p.evaluate(kind=>{const g=tuningLab.game,s=g.session,before=s.hash();g.render();const card=g.root.querySelector('#effects [data-effect="'+kind+'"]');return {kind,active:s.effects.some(e=>e.kind===kind),slot:card?.textContent,renderHashUnchanged:s.hash()===before};},kind));}if(individual.some(e=>!e.active||!e.renderHashUnchanged))throw Error('Individual effect failed');await p.locator('#clear-effects').click();
   // Compare camera readers without mutating the canonical hash.
   const hash=await p.evaluate(()=>tuningLab.current.hash());await p.locator('#camera-toggle').click();if(await p.evaluate(()=>tuningLab.camera.mode)!=='stable')throw Error('Stable unavailable');await p.locator('#camera-toggle').click();if(hash!==await p.evaluate(()=>tuningLab.current.hash()))throw Error('Mode hash mismatch');
   if(!mobile){
    // Exact expansion presentation sequence; physics is paused only in QA.
    await p.evaluate(()=>{const g=tuningLab.game;g.render();});await p.locator('#training').screenshot({path:'docs/qa/effect-ux/expansion-before.png',scale:'css'});
    await p.evaluate(()=>{const g=tuningLab.game,s=g.session;s.state.movePhase=-20000;s.forceExpansion();s.advance();g.motion.capture(s);g.render();});
    await p.evaluate(()=>{const g=tuningLab.game,s=g.session;for(let i=0;i<30;i++){s.advance();g.motion.capture(s);}g.render();});await p.locator('#training').screenshot({path:'docs/qa/effect-ux/expansion-mid.png',scale:'css'});
    await p.evaluate(()=>{const g=tuningLab.game,s=g.session;for(let i=0;i<30;i++){s.advance();g.motion.capture(s);}s.announcements=[];g.render();});await p.locator('#training').screenshot({path:'docs/qa/effect-ux/expansion-after.png',scale:'css'});
    await p.locator('#camera-toggle').click();for(const k of ['focus','spores'])await p.locator('[data-effect="'+k+'"]').click();await p.evaluate(()=>{const g=tuningLab.game,s=g.session;s.director.sporeDrop(s);g.render();});await p.locator('#training').screenshot({path:'docs/qa/effect-ux/vfx.png',scale:'css'});
    // Swamp contains inherited crystal/root/stump obstacles: clean stone fallback.
    await p.locator('#camera-toggle').click();await p.locator('[data-stage="3"]').click();await p.waitForFunction(()=>tuningLab.game.status==='playing'&&tuningLab.current.stage.index===3);await p.evaluate(()=>{const g=tuningLab.game;g.pause();g.status='playing';g.show();g.render();});await p.locator('#training').screenshot({path:'docs/qa/effect-ux/obstacles.png',scale:'css'});
   }
   report.viewports.push({mobile,checks,sizes,individual});
  }finally{await c.close();}
 }
 report.errors=errors;report.network=network;const download=page.waitForEvent('download');await page.evaluate(r=>{const a=document.createElement('a');a.download='effect-ux.json';a.href=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)],{type:'application/json'}));a.click();},report);await(await download).saveAs('docs/qa/effect-ux/browser.json');if(errors.length||network.length)throw Error(JSON.stringify({errors,network}));return report;
}
