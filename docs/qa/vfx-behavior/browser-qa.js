async page=>{
 const browser=page.context().browser(),dir='docs/qa/vfx-behavior/',reports=[],errors=[],network=[];
 const save=async()=>{const data={reports,errors,network},download=page.waitForEvent('download');await page.evaluate(data=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'}));a.download='browser.json';a.click();},data);await(await download).saveAs(dir+'browser.json');};
 for(const [mode,seconds,mobile]of [['rush',30,false],['roots',9,false],['mist',20,true]]){
  const context=await browser.newContext({viewport:{width:mobile?844:1920,height:mobile?390:1080},deviceScaleFactor:mobile?2:1,hasTouch:mobile,isMobile:mobile}),p=await context.newPage();
  let stage='load';try{
   await p.bringToFront();
   p.on('pageerror',e=>errors.push(mode+': '+e.message));p.on('console',m=>{if(m.type()==='error')errors.push(mode+': '+m.text());});p.on('response',r=>{if(r.status()>=400)network.push(r.status()+' '+r.url());});p.on('requestfailed',r=>network.push(r.url()));
   await p.goto('http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html?art-fixture='+(mobile?'mobile-30':'desktop-30'));
   await p.waitForFunction(()=>window.tuningLab?.game?.status==='paused');
   await p.evaluate(async()=>{
    const g=tuningLab.game,s=g.session,{effectAssets}=await import('./effect-playground/asset-bank.js');await effectAssets.preload();s.pickups=[];s.feedback=[];
    s.director.next={positive:1e9,negative:1e9,portal:1e9};s.state.food=4*s.arena.width+22;
    document.querySelector('#world-awareness').checked=false;
   });
   await p.locator('[data-vfx-review="'+mode+'"]').click();
   const initial=await p.evaluate(()=>{const s=tuningLab.current;return {tick:s.tick,warnings:s.director.warnings,hash:s.hash()};});
   const hash=await p.evaluate(()=>tuningLab.current.hash());for(let i=0;i<3;i++){await p.locator('#motion-toggle').click();if(await p.evaluate(()=>tuningLab.current.hash())!==hash)throw Error('Mode hash changed');}
   const frozen=await p.evaluate(()=>{const g=tuningLab.game;g.render();return g.renderer.canvas.toDataURL();});await p.waitForTimeout(100);if(await p.evaluate(()=>{const g=tuningLab.game;g.render();return g.renderer.canvas.toDataURL();})!==frozen)throw Error('Paused raster changed');
   stage='fullscreen';await p.frameLocator('#training').locator('[data-action="fullscreen"]').first().click();await p.waitForFunction(()=>!!tuningLab.game.root.ownerDocument.fullscreenElement);
   await p.evaluate(async mode=>{
    const g=tuningLab.game,s=g.session,{bodyCell}=await import('./simulation/body.js'),{rushPositions}=await import('./effect-playground/vfx-presentation.js'),{effectAssets}=await import('./effect-playground/asset-bank.js');
    // QA commands ONLY, through the normal input queue and unchanged 60Hz driver.
    // No autopilot-fun claim. Persistent VFX rehearsal is explicitly DEV-only.
    const loop=[[24,8],[4,8],[4,2],[26,2],[26,8],[4,8],[4,2],[26,2]],intro=[[20,5],[20,7],[24,7],[24,3],[20,3],[20,5],[24,5],...loop];
    let targets=mode==='rush'?intro:[[24,5],...loop],index=0,portalStaged=false,lastMoves=0;
    g.qa={mode,trace:[],rush:[],draws:[],keys:[],pause:true,modes:true,initialHash:s.hash(),portalFrames:0};
    const original=g.tick.bind(g);g.qaOriginalTick=original;g.tick=()=>{
     if(g.status==='playing'){
      const head=bodyCell(s.state,0),x=head%s.arena.width,y=Math.floor(head/s.arena.width);
      if(mode==='rush'&&!portalStaged&&s.tick>=960&&x>=6&&x<=22&&y>=2&&y<=8){
       const dx=[0,1,0,-1][s.state.direction],dy=[-1,0,1,0][s.state.direction];
       s.portals=[head+(dx+dy*s.arena.width)*2,4*s.arena.width+10];s.director.windowEnd=s.tick+600;s.portal.phase='armed';s.preparePortals();portalStaged=true;
       s.devCommands.push({kind:'qa-portal-opportunity',tick:s.tick,cells:[...s.portals]});
      }
      if(s.portal.transfers&&g.qa.portalFrames===0){targets=[[24,4],...loop];index=0;g.qa.portalFrames++;}
      if(x===targets[index][0]&&y===targets[index][1]){index++;if(index===targets.length){targets=loop;index=0;}}
      const [tx,ty]=targets[index],direction=x===tx?(ty>y?2:0):(tx>x?1:3);
      if(!s.state.turnCount&&direction!==s.state.direction&&((direction+2)%4)!==s.state.direction)g.command(direction);
     }
     original();
     if(s.moves!==lastMoves){lastMoves=s.moves;const f=g.motion.frame(s);g.qa.rush.push({tick:s.tick,moves:s.moves,alpha:f.alpha,points:rushPositions(f,g.renderer.last.cell),spans:f.spans?.length||1});}
     if(s.tick%3===0)g.qa.trace.push({tick:s.tick,w:s.director.warnings.map(w=>({...w})),h:s.world.hazards.map(h=>({...h})),r:s.director.retracts.map(r=>({...r})),head:bodyCell(s.state,0)});
    };
    const draw=effectAssets.draw;g.qaOriginalDraw=draw;effectAssets.draw=function(ctx,key,...args){if(key.startsWith('vfx.')&&!g.qa.keys.includes(key))g.qa.keys.push(key);return draw.call(this,ctx,key,...args);};
   },mode);
   stage='native run';await p.bringToFront();await p.screencast.start({path:dir+mode+'.webm',size:{width:mobile?844:1920,height:mobile?390:1080}});await p.frameLocator('#training').locator('[data-action="resume"]').click();
   // Three short chunks keep progress responsive while the native clock runs.
   const target=Math.round(seconds*60),captures=mode==='roots'?[60,100,130,185,214,485,540]:mode==='rush'?[90,175,235,1020,1800]:[240,600,1200];
   for(const tick of captures){
    await p.waitForFunction(t=>tuningLab.current.tick>=t||tuningLab.game.status==='result',tick,{timeout:25000});
    const state=await p.evaluate(()=>({tick:tuningLab.current.tick,status:tuningLab.current.status}));if(state.status!=='playing')throw Error('Run died '+JSON.stringify(state));
    await p.frameLocator('#training').locator('#game').screenshot({path:dir+mode+'-'+tick+'.png',scale:'css'});
   }
   const report=await p.evaluate(()=>{const g=tuningLab.game,s=g.session,targets=[...g.root.querySelectorAll('#pad button')].map(b=>({w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height}));g.pause();g.render();return {...g.qa,tick:s.tick,moves:s.moves,status:s.status,portalTransfers:s.portal.transfers,rootWarnings:s.director.warnings,rootRetracts:s.director.retracts,hash:s.hash(),targets};});
   await p.screencast.stop();
   if(report.tick<target||report.status!=='playing')throw Error('Incomplete live '+mode);
   if(mode==='rush'&&!report.portalTransfers)throw Error('No actual portal traversal');
   if(mode==='roots')for(const phase of ['pending','cancel-decay','active','decay'])if(!report.trace.some(t=>[...t.w,...t.h,...t.r].some(w=>w.phase===phase)))throw Error('Missing canonical phase '+phase);
   if(mobile&&report.targets.some(t=>t.w<44||t.h<44))throw Error('D-pad contract');
   // Final raster freezes on real pause, with a mid-cell alpha preserved.
   const paused=await p.evaluate(()=>tuningLab.game.renderer.canvas.toDataURL());await p.waitForTimeout(100);if(await p.evaluate(()=>{tuningLab.game.render();return tuningLab.game.renderer.canvas.toDataURL();})!==paused)throw Error('Live pause changed raster');
   reports.push({mode,mobile,native60Hz:true,initial,...report});
   await save();await p.bringToFront();stage='restart';
   const starts=await p.evaluate(async()=>{const g=tuningLab.game,{effectAssets}=await import('./effect-playground/asset-bank.js');g.tick=g.qaOriginalTick;effectAssets.draw=g.qaOriginalDraw;await g.root.ownerDocument.exitFullscreen();return g.starts;});await p.waitForFunction(()=>!tuningLab.game.root.ownerDocument.fullscreenElement);
   await p.locator('[data-art-fixture="'+(mobile?'mobile-30':'desktop-30')+'"]').click();await p.waitForFunction(n=>tuningLab.game.starts>n&&tuningLab.game.status==='paused',starts);
   const clean=await p.evaluate(()=>{const g=tuningLab.game,s=g.session;return g.vfxReviewMode==null&&!s.director.warnings.length&&!s.director.retracts.length&&!s.world.hazards.length;});if(!clean)throw Error('Restart retained VFX lifecycle');
  }catch(error){const state=await p.evaluate(()=>({tick:window.tuningLab?.current?.tick,status:window.tuningLab?.game?.status,portrait:window.tuningLab?.game?.portrait,starts:window.tuningLab?.game?.starts}));throw Error(mode+' '+stage+': '+error.message+' '+JSON.stringify(state));}finally{await context.close();}
 }
 const data={reports,errors,network},download=page.waitForEvent('download');await page.evaluate(data=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'}));a.download='browser.json';a.click();},data);await(await download).saveAs(dir+'browser.json');
 if(errors.length||network.length)throw Error(JSON.stringify({errors,network}));return reports.map(r=>({mode:r.mode,tick:r.tick,moves:r.moves,portal:r.portalTransfers,keys:r.keys}));
}
