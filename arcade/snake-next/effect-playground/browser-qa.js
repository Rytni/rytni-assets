async page=>{
 const browser=page.context().browser(),errors=[],network=[],results=[];
 await page.goto('http://127.0.0.1:8775/arcade/snake-next/effect-playground/review.html');await page.waitForFunction(()=>window.pickupReview);
 for(const [id,name]of [['native','pickups'],['silhouettes','silhouettes'],['runtime','runtime-sheet'],['slots','hud-mock']])await page.locator('#'+id).screenshot({path:'docs/qa/effect-playground/'+name+'.png'});
 for(const k of await page.evaluate(()=>pickupReview.KINDS)){
  const download=page.waitForEvent('download');await page.evaluate(k=>{const a=document.createElement('a');a.download=k+'.png';a.href=pickupReview.sprite(k).toDataURL();a.click();},k);await(await download).saveAs('arcade/snake-next/effect-playground/sprites/'+k+'.png');
 }
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:844,height:390}:{width:1920,height:1080},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?2:1}),p=await context.newPage();
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)network.push(r.status()+' '+r.url());});p.on('requestfailed',r=>network.push(r.url()));
  try{
   await p.goto('http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html');await p.waitForFunction(()=>window.tuningLab?.game);await p.bringToFront();await p.locator('[data-stage="0"]').click();await p.waitForFunction(()=>tuningLab.game.status==='playing');await p.evaluate(()=>tuningLab.game.pause());
   const dimensions=await p.evaluate(()=>{const g=tuningLab.game;return {hud:g.root.querySelector('#hud').getBoundingClientRect().toJSON(),game:g.root.getBoundingClientRect().toJSON(),cell:g.renderer.last.cell};});
   const effects=[];
   for(const k of ['harvest','focus','spores','guard','portalPrize','rush','weak','brambles','mist']){
    await p.locator('#clear-effects').click();await p.locator('[data-effect="'+k+'"]').click();
    const check=await p.evaluate(k=>{const g=tuningLab.game,s=g.session,before=s.hash();g.render();const card=g.root.querySelector('#effects [data-effect="'+k+'"]');return {kind:k,active:s.effects.some(e=>e.kind===k),text:card?.textContent,notice:s.effectNotices.at(-1),hash:s.hash()===before,children:g.root.querySelector('#effects').children.length,slot:card?[...card.parentElement.children].indexOf(card):-1};},k);
    if(!check.active||!check.hash||check.children!==3||check.slot!==(effects.length<5?0:2))throw Error('Effect gate '+JSON.stringify(check));effects.push(check);
   }
   // One live composite per viewport, not nine screenshot galleries.
   await p.locator('#clear-effects').click();for(const k of ['focus','guard','mist'])await p.locator('[data-effect="'+k+'"]').click();
   await p.evaluate(()=>{const g=tuningLab.game;g.status='playing';g.show();g.render();g.status='paused';});await p.locator('#training').scrollIntoViewIfNeeded();
   await p.locator('#training').screenshot({path:'docs/qa/effect-playground/'+(mobile?'mobile':'desktop')+'.png',scale:'css'});
   const after=await p.evaluate(()=>{const g=tuningLab.game,h=g.root.querySelector('#hud').getBoundingClientRect().toJSON();return {hud:h,mode:tuningLab.camera.mode,preset:tuningLab.profile.id,slots:[...g.root.querySelectorAll('#effects>div')].map(e=>({text:e.textContent,negative:e.classList.contains('negative'),rect:e.getBoundingClientRect().toJSON()})),targets:[...g.root.querySelectorAll('#pad button')].map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}))};});
   const fog=await p.evaluate(()=>{
    const g=tuningLab.game,s=g.session;s.effectNotices=[];s.effects=s.effects.filter(e=>e.kind!=='mist');g.render();const c=g.renderer.canvas,ctx=c.getContext('2d'),a=ctx.getImageData(0,0,c.width,c.height).data,l=g.renderer.last,f=g.motion.frame(s),v=tuningLab.camera,dpr=g.renderer.dpr,hx=(l.field.x+(f.head.x-v.x+.5)*l.cell)*dpr,hy=(l.field.y+(f.head.y-v.y+.5)*l.cell)*dpr;
    s.collect('mist',s.state.food);s.effectNotices=[];g.render();const b=ctx.getImageData(0,0,c.width,c.height).data;let inner=0,outer=0;
    for(let y=Math.ceil(l.arena.y*dpr);y<(l.arena.y+l.arena.h)*dpr;y+=3)for(let x=Math.ceil(l.arena.x*dpr);x<(l.arena.x+l.arena.w)*dpr;x+=3){const k=(y*c.width+x)*4;if(a[k]!==b[k]||a[k+1]!==b[k+1]||a[k+2]!==b[k+2]){if(Math.hypot(x-hx,y-hy)<=4*l.cell*dpr)inner++;else outer++;}}
    return {changedInside4Cells:inner,changedOutside:outer};
   });if(fog.changedInside4Cells!==0||fog.changedOutside<100)throw Error('Fog visibility/safety '+JSON.stringify(fog));
   if(after.hud.width!==dimensions.hud.width||after.hud.height!==dimensions.hud.height||after.mode!=='stable'||after.preset!=='B'||mobile&&after.targets.some(b=>b.w<44||b.h<44))throw Error('Locked layout/camera regression');
   await p.locator('#clear-effects').click();if(await p.evaluate(()=>tuningLab.current.effects.length+tuningLab.current.spores.length+tuningLab.current.director.warnings.length+tuningLab.current.world.hazards.length)!==0)throw Error('Clear failed');
   results.push({mobile,dimensions,effects,after,fog});
  }finally{await context.close();}
 }
 const report={results,errors,network},download=page.waitForEvent('download');await page.evaluate(r=>{const a=document.createElement('a');a.download='effects-browser.json';a.href=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)],{type:'application/json'}));a.click();},report);await(await download).saveAs('docs/qa/effect-playground/browser.json');if(errors.length||network.length)throw Error(JSON.stringify({errors,network}));return {desktopMobile:true,effectsPerViewport:results[0].effects.length,errors,network};
}
