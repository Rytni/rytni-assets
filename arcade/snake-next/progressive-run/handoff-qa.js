async page=>{
 const browser=page.context().browser(),checks=[],errors=[],network=[];
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:844,height:390}:{width:1920,height:1080},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?2:1}),p=await context.newPage();
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('requestfailed',r=>network.push(r.url()));p.on('response',r=>{if(r.status()>=400)network.push(r.status()+' '+r.url());});
  try{
   await p.goto('http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html');await p.waitForFunction(()=>window.tuningLab?.game);
   for(const stage of [0,2,3,4]){
    await p.locator(`[data-stage="${stage}"]`).click();await p.waitForFunction(stage=>tuningLab.current?.config.startStage===stage&&tuningLab.game.status==='playing',stage);
    await p.waitForFunction(()=>document.querySelector('#telemetry').textContent.includes('stage base cap '+tuningLab.current.config.speedCaps[Math.min(4,tuningLab.current.stage.index)])&&document.querySelector('#telemetry').textContent.includes('× biome '+tuningLab.current.stage.multiplier.toFixed(2)));
    const r=await p.evaluate(()=>({measurements:tuningLab.measurements(),status:document.querySelector('#lab-status').textContent}));
    if(r.measurements.world[0]!==[28,0,48,64,80][stage]||r.measurements.viewport[0]!==28||r.measurements.backing[0]!==112||!r.status.includes('fixed 28×12 viewport'))throw Error('Progressive readout mismatch '+JSON.stringify(r));
    checks.push({mobile,stage,world:r.measurements.world,speed:r.measurements.speed,multiplier:r.measurements.multiplier});
   }
   await p.evaluate(()=>tuningLab.game.pause());
   const before=await p.evaluate(()=>tuningLab.current.hash()),labels=[];
   for(let i=0;i<3;i++){
    await p.locator('#motion-toggle').click();labels.push(await p.locator('#motion-toggle').textContent());
    if(await p.evaluate(()=>tuningLab.current.hash())!==before)throw Error('Mode switch altered canonical state');
   }
   if(labels.join('|')!=='SMOOTH V2|GRID SNAP|SMOOTH V4')throw Error('Mode cycle '+labels);
   checks.push({mobile,modes:labels,hashStable:true});
   await p.locator('#run-model').selectOption('static');await p.waitForFunction(()=>tuningLab.current&&!tuningLab.current.world&&tuningLab.game.status==='playing');
   if(await p.evaluate(()=>tuningLab.current.arena.width)!==28)throw Error('Static comparison changed');
   await p.locator('[data-stage="0"]').click();await p.waitForFunction(()=>tuningLab.current?.world&&tuningLab.current.stage.index===0&&tuningLab.game.status==='playing');
   const focusSafe=await p.evaluate(()=>!document.querySelector('#expand-world').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true})));
   if(!focusSafe)throw Error('Expand pointerdown steals focus');
   checks.push({mobile,staticComparison:true,restoredForest:true,focusPrevention:true});
  }finally{await context.close();}
 }
 const result={checks,errors,network},download=page.waitForEvent('download');await page.evaluate(r=>{const a=document.createElement('a');a.download='handoff.json';a.href=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)],{type:'application/json'}));a.click();},result);await(await download).saveAs('docs/qa/progressive-run/handoff.json');
 if(errors.length||network.length)throw Error(JSON.stringify({errors,network}));return {checks:checks.length,errors,network};
}
