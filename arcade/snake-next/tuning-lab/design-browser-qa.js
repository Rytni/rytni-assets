async page=>{
 const browser=page.context().browser(),errors=[],network=[],results=[];
 for(const mobile of [false,true]){
  const ctx=await browser.newContext({viewport:mobile?{width:844,height:390}:{width:1920,height:1080},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?2:1}),p=await ctx.newPage();
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('requestfailed',r=>network.push(r.url()));p.on('response',r=>{if(r.status()>=400)network.push(r.status()+' '+r.url());});
  try{
   await p.goto('http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html');await p.waitForFunction(()=>tuningLab?.game);await p.bringToFront();
   await p.evaluate(()=>{window.pauseReasons=[];const g=tuningLab.game,pause=g.pause.bind(g);g.pause=()=>{pauseReasons.push({clock:g.clock?.status,stack:new Error().stack});pause();};});
   for(const arena of ['A','B','C'])for(const density of ['LOW','MEDIUM','HIGH']){
    await p.locator('#arena-preset').selectOption(arena);await p.waitForTimeout(150);await p.locator('#obstacle-density').selectOption(density);await p.waitForTimeout(150);
    await p.locator('[data-preset=B]').click();await p.locator('#training').scrollIntoViewIfNeeded();
    if(mobile)await p.frameLocator('#training').locator('#pad [data-dir="0"]').tap();else await p.frameLocator('#training').locator('canvas[aria-label]').press('ArrowUp');
    await p.waitForTimeout(250);
    const r=await p.evaluate(()=>{const g=tuningLab.game,l=g.renderer.last,root=g.root.getBoundingClientRect(),pad=g.root.querySelector('#pad').getBoundingClientRect(),buttons=[...g.root.querySelectorAll('#pad button')].map(b=>{const r=b.getBoundingClientRect();return {w:r.width,h:r.height};}),hash=g.session.hash();tuningLab.measurements();tuningLab.summary();return {design:tuningLab.design,balance:tuningLab.profile.id,mode:document.querySelector('#motion-toggle').textContent,status:g.status,clock:g.clock.status,width:g.session.arena.width,height:g.session.arena.height,cell:l.cell,bodyScreenPx:l.cell*36/68,headScreenPx:l.cell*36/68,rootHeight:root.height,cabinetHeight:l.cabinet.h,embeddedUnused:root.height-l.cabinet.h,padInside:pad.top-root.top>=l.arena.y-1&&pad.bottom-root.top<=l.arena.y+l.arena.h+1,buttons,food:g.session.state.food,portals:g.session.portals.length,hashReadsPreserved:hash===g.session.hash(),telemetry:document.querySelector('#world-telemetry').textContent};});
    if(r.status!=='playing'||r.clock!=='running'||r.mode!=='SMOOTH V4'||r.balance!=='B'||r.portals!==2||r.food<0||!r.hashReadsPreserved||!mobile&&Math.abs(r.embeddedUnused)>2||mobile&&(!r.padInside||r.buttons.some(b=>b.w<44||b.h<44)))throw Error('DEV review regression '+JSON.stringify({r,pauseReasons:await p.evaluate(()=>pauseReasons)}));
    results.push({mobile,arena,density,...r});
   }
   await p.locator('#arena-preset').selectOption('B');await p.locator('#obstacle-density').selectOption('MEDIUM');await p.locator('#training').scrollIntoViewIfNeeded();
   await p.locator('#training').screenshot({path:'docs/qa/forest-design-review/'+(mobile?'mobile-current':'desktop-current')+'.png',scale:'css'});
  }finally{await ctx.close();}
 }
 const result={results,errors,network};const pending=page.waitForEvent('download');await page.evaluate(result=>{const a=document.createElement('a');a.download='browser.json';a.href=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));a.click();},result);await(await pending).saveAs('docs/qa/forest-design-review/browser.json');
 if(errors.length||network.length)throw Error(JSON.stringify(result));return {combinations:results.length,errors,network,dimensions:results.filter(r=>r.density==='MEDIUM').map(({mobile,arena,width,height,cell,bodyScreenPx,embeddedUnused})=>({mobile,arena,width,height,cell,bodyScreenPx,embeddedUnused}))};
}
