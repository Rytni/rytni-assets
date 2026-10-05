async page=>{
 const errors=[],network=[],report={viewports:[]},browser=page.context().browser();
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:844,height:390}:{width:1920,height:1080},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?2:1}),p=await context.newPage();
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)network.push(r.status()+' '+r.url());});p.on('requestfailed',r=>network.push(r.url()));
  await p.goto('http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html');await p.waitForFunction(()=>window.tuningLab?.game);await p.bringToFront();
  const sizes=[];
  for(let stage=0;stage<4;stage++){
   await p.locator('[data-stage="'+stage+'"]').click();await p.waitForFunction(stage=>tuningLab.game.status==='playing'&&tuningLab.current.stage.index===stage,stage);
   await p.evaluate(()=>{const g=tuningLab.game;g.pause();g.status='playing';g.show();document.querySelector('#world-awareness').checked=false;g.render();});
   const data=await p.evaluate(async()=>{
    const g=tuningLab.game,s=g.session,{sprite,KINDS}=await import('./effect-playground/art.js'),{objectImage}=await import('./forest-training/objects.js'),{objectPresentation,drawReadable}=await import('./effect-playground/readable-objects.js');
    // Legal, frozen native preview; only QA positions/clock are controlled.
    s.pickups=[{kind:'focus',cell:3*112+8,ends:99999},{kind:'harvest',cell:3*112+14,ends:99999},{kind:'rush',cell:3*112+20,ends:99999}];s.state.food=7*112+19;s.portal.phase='armed';s.director.windowEnd=99999;s.preparePortals();g.render();
    const l=g.renderer.last,h=s.hash();g.render();if(s.hash()!==h)throw Error('render mutated hash');
    const objects=[['food',objectImage(g.art,'food-red'),.7],...KINDS.map(k=>[k,sprite(k),g.compact?.94:.68]),['portal',objectImage(g.art,'portal'),1]].map(([kind,im,scale])=>{const r=objectPresentation(im,kind,l.cell,g.compact,scale);return {kind,lod:r.lod,footprint:r.footprint,w:r.w,h:r.h,aspect:r.w/r.h,uniform:r.uniform};});
    const c=document.createElement('canvas');c.width=660;c.height=74;const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.fillStyle='#102922';x.fillRect(0,0,c.width,c.height);
    [['food',objectImage(g.art,'food-red'),.7],...KINDS.map(k=>[k,sprite(k),g.compact?.94:.68]),['portal',objectImage(g.art,'portal'),1]].forEach(([k,im,scale],i)=>{drawReadable(x,im,k,30+i*58,25,l.cell,g.compact,scale);x.fillStyle='#ece2b4';x.font='9px monospace';x.textAlign='center';x.fillText(k,30+i*58,65);});
    return {world:[s.world.width,s.world.height],cell:l.cell,body:l.cell*36/68,arena:l.arena,field:l.field,capacity:s.progressionSummary().capacity,objects,lineup:c.toDataURL(),hash:h,touchTargets:[...g.root.querySelectorAll('#pad button')].map(b=>({w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height}))};
   });
   const world=data.world.join('x'),prefix=mobile?'mobile':'desktop';await p.locator('#training').screenshot({path:'docs/qa/fit-world-v2/'+prefix+'-'+world+'.png',scale:'css'});
   if(stage===3){const hash=await p.evaluate(()=>tuningLab.current.hash());for(let i=0;i<3;i++){await p.locator('#motion-toggle').click();if(await p.evaluate(()=>tuningLab.current.hash())!==hash)throw Error('Actual renderer mode changed hash');}await p.locator('#camera-toggle').click();await p.locator('#camera-toggle').click();if(await p.evaluate(()=>tuningLab.current.hash())!==hash)throw Error('Camera mode changed hash');data.modeHashParity=true;}
   const download=p.waitForEvent('download');await p.evaluate(({url,name})=>{const a=document.createElement('a');a.href=url;a.download=name;a.click();},{url:data.lineup,name:prefix+'-objects-'+world+'.png'});await(await download).saveAs('docs/qa/fit-world-v2/'+prefix+'-objects-'+world+'.png');delete data.lineup;sizes.push(data);
  }
  // Actual input event and pause/resume at the final zoom.
  await p.evaluate(()=>{const g=tuningLab.game;g.status='paused';g.resume();g.root.ownerDocument.defaultView.focus();});
  if(mobile){const b=p.frameLocator('#training').locator('#pad [data-dir="2"]');await b.tap();}
  else await p.keyboard.press('ArrowDown');
  await p.waitForFunction(()=>tuningLab.current.state.direction===2);
  const live=await p.evaluate(()=>{const g=tuningLab.game;g.pause();const s=g.session,m=g.motion,f=m.frame(s),hash=s.hash();g.render();return {direction:s.state.direction,pausedAlpha:f.alpha,alphaStable:m.frame(s,.9).alpha===f.alpha,hashStable:s.hash()===hash,clock:g.clock.status};});
  if(!live.alphaStable||!live.hashStable||live.direction!==2)throw Error('input/pause');
  if(!mobile){
   await p.locator('[data-stage="0"]').click();await p.waitForFunction(()=>tuningLab.game.status==='playing'&&tuningLab.current.stage.index===0);
   await p.evaluate(()=>{const g=tuningLab.game;g.pause();g.status='playing';g.show();g.render();});await p.locator('#training').screenshot({path:'docs/qa/fit-world-v2/expansion-before.png',scale:'css'});
   await p.evaluate(()=>{const g=tuningLab.game,s=g.session;s.forceExpansion();s.advance();g.motion.capture(s);g.render();});
   // Freeze physics for the presentation sequence, not a gameplay benchmark.
   await p.evaluate(()=>{const g=tuningLab.game,s=g.session;s.tick=s.openings.at(-1).tick+30;g.render();});await p.locator('#training').screenshot({path:'docs/qa/fit-world-v2/expansion-mid.png',scale:'css'});
   await p.evaluate(()=>{const g=tuningLab.game,s=g.session;s.tick=s.openings.at(-1).tick+60;g.render();});await p.locator('#training').screenshot({path:'docs/qa/fit-world-v2/expansion-after.png',scale:'css'});
  }
  report.viewports.push({mobile,sizes,live});await context.close();
 }
 report.errors=errors;report.network=network;const download=page.waitForEvent('download');await page.evaluate(r=>{const a=document.createElement('a');a.download='browser.json';a.href=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)],{type:'application/json'}));a.click();},report);await(await download).saveAs('docs/qa/fit-world-v2/browser.json');if(errors.length||network.length)throw Error(JSON.stringify({errors,network}));return report;
}
