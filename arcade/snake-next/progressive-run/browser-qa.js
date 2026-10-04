async page=>{
 const browser=page.context().browser(),results=[],errors=[],network=[];
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:844,height:390}:{width:1920,height:1080},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?2:1}),p=await context.newPage();
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('requestfailed',r=>network.push(r.url()));p.on('response',r=>{if(r.status()>=400)network.push(r.status()+' '+r.url());});
  try{
   await p.goto('http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html');await p.waitForFunction(()=>window.tuningLab?.game);await p.bringToFront();
   let initialCell=null;
   for(const stage of [0,2,3,4]){
    await p.locator(`[data-stage="${stage}"]`).click();await p.waitForFunction(stage=>tuningLab.current?.config?.startStage===stage&&tuningLab.game.status==='playing',stage);await p.locator('#training').scrollIntoViewIfNeeded();
    if(mobile)await p.frameLocator('#training').locator('#pad [data-dir="1"]').tap();else await p.frameLocator('#training').locator('canvas[aria-label]').press('ArrowRight');
    await p.waitForTimeout(200);
    const r=await p.evaluate(()=>{const g=tuningLab.game,s=g.session,l=g.renderer.last,h=s.hash();g.render();return {summary:s.progressionSummary(),cell:l.cell,hashStable:s.hash()===h,status:g.status,clock:g.clock.status,mode:document.querySelector('#motion-toggle').textContent,pad:[...g.root.querySelectorAll('#pad button')].map(b=>({w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height})),camera:tuningLab.camera,audio:tuningLab.biomeAudio};});
    if(initialCell===null)initialCell=r.cell;
    if(Math.abs(r.cell-initialCell)>.01||!r.hashStable||r.status!=='playing'||r.clock!=='running'||r.mode!=='SMOOTH V4'||mobile&&r.pad.some(b=>b.w<44||b.h<44))throw Error('Stage regression '+JSON.stringify(r));results.push({mobile,stage,...r});
   }
   await p.locator('[data-stage="0"]').click();await p.waitForFunction(()=>tuningLab.current?.config.startStage===0&&tuningLab.game.status==='playing');await p.locator('#training').scrollIntoViewIfNeeded();
   // Invoke the exact button handler without browser scrolling the iframe
   // out of view; this tests the handler, not physical pointer focus behavior.
   await p.evaluate(()=>document.querySelector('#expand-world').click());await p.waitForFunction(()=>tuningLab.current.stage.index===1);
   await p.evaluate(()=>document.querySelector('#expand-world').click());await p.waitForFunction(()=>tuningLab.current.stage.index===2);
   const transition=await p.evaluate(()=>({world:tuningLab.progression.world,status:tuningLab.game.status,cell:tuningLab.game.renderer.last.cell,age:tuningLab.current.tick-tuningLab.current.transitions.at(-1).tick,audio:tuningLab.biomeAudio}));
   if(transition.status!=='playing'||transition.world[0]!==48||Math.abs(transition.cell-initialCell)>.01||transition.age>=120||transition.audio.sources>3)throw Error('Expansion/transition regression '+JSON.stringify(transition));await p.waitForTimeout(2100);const settled=await p.evaluate(()=>({clock:tuningLab.game.clock.status,audio:tuningLab.biomeAudio}));if(settled.clock!=='running'||settled.audio.sources>2)throw Error('Crossfade lifecycle regression '+JSON.stringify(settled));results.push({mobile,transition,settled});
   await p.locator('[data-stage="4"]').click();await p.waitForFunction(()=>tuningLab.current?.config.startStage===4&&tuningLab.game.status==='playing');await p.locator('#training').scrollIntoViewIfNeeded();
   // Test-only canonical fixture. No autopilot exists in the playable Lab.
   await p.evaluate(async()=>{
    const g=tuningLab.game,s=g.session,{createState}=await import('/arcade/snake-next/entry.js'),{SnakeMotion}=await import('/arcade/snake-next/forest-training/motion.js');g.pause();
    const cycle=[];for(let y=16;y<28;y++){const xs=Array.from({length:27},(_,i)=>33+i);if(y%2)xs.reverse();for(const x of xs)cycle.push(y*112+x);}for(let y=27;y>=16;y--)cycle.push(y*112+32);
    const offset=110,body=Array.from({length:250},(_,i)=>cycle[(offset-i+cycle.length)%cycle.length]),next=cycle[(offset+1)%cycle.length],head=body[0],direction=next===head+1?1:next===head-1?3:next===head+112?2:0;
    s.state=createState({seed:s.state.seed,rules:s.rules,arena:s.arena,body,direction,food:cycle[(offset+12)%cycle.length]});g.motion=new SnakeMotion(s);const tick=g.tick.bind(g);window.progressBaseTick=tick;
    g.tick=()=>{const head=s.state.body[s.state.headIndex],i=cycle.indexOf(head),next=cycle[(i+1)%cycle.length],d=next===head+1?1:next===head-1?3:next===head+112?2:0;if(s.state.movePhase>=s.cadence()-1)g.command(d);tick();};
    g.render();g.resume();
   });
   await p.waitForTimeout(1300);const long=await p.evaluate(()=>({status:tuningLab.game.status,clock:tuningLab.game.clock.status,length:tuningLab.current.state.length,camera:tuningLab.camera}));if(long.status!=='playing'||long.clock!=='running'||long.length<250)throw Error('250+ live regression '+JSON.stringify(long));results.push({mobile,long});
   // Clean restart removes the test-only driver, then a valid portal fixture.
   await p.evaluate(()=>{tuningLab.game.tick=progressBaseTick;});
   await p.locator('[data-stage="2"]').click();await p.waitForFunction(()=>tuningLab.current?.config.startStage===2&&tuningLab.game.status==='playing');
   await p.evaluate(async()=>{const g=tuningLab.game,s=g.session,{createState}=await import('/arcade/snake-next/entry.js'),{SnakeMotion}=await import('/arcade/snake-next/forest-training/motion.js');g.pause();s.state=createState({seed:s.state.seed,rules:s.rules,arena:s.arena,body:Array.from({length:8},(_,i)=>5*112+11-i),direction:1,food:5*112+15});s.portal={phase:'armed',elapsed:0,transfers:0,rejected:0,entry:-1,exit:-1};s.portals=[5*112+12,15*112+35];s.director.windowEnd=s.tick+2000;s.collect('anchor',0);s.collect('portalPrize',0);s.collect('mist',0);g.motion=new SnakeMotion(s);const hash=s.hash();g.render();if(g.root.querySelectorAll('[data-effect]').length!==3||s.hash()!==hash)throw Error('2+1 HUD/hash regression');g.resume();});
   await p.waitForFunction(()=>tuningLab.current.portal.transfers===1,{timeout:5000});
   const portal=await p.evaluate(()=>({phase:tuningLab.current.portal.phase,transfers:tuningLab.current.portal.transfers,camera:tuningLab.camera,score:tuningLab.current.score,slots:tuningLab.game.root.querySelectorAll('[data-effect]').length}));if(portal.transfers!==1||portal.camera.x<=0||portal.score<360)throw Error('Portal camera/reward regression '+JSON.stringify(portal));results.push({mobile,portal});
   await p.evaluate(()=>tuningLab.game.pause());const frozen=await p.evaluate(()=>({hash:tuningLab.current.hash(),alpha:tuningLab.game.motion.frozen,camera:tuningLab.camera,audio:tuningLab.game.audio.sources.size,timers:Number(!!tuningLab.game.cancelTimer),raf:tuningLab.game.raf}));await p.waitForTimeout(180);const stable=await p.evaluate(()=>({hash:tuningLab.current.hash(),alpha:tuningLab.game.motion.frozen,camera:tuningLab.camera}));
   if(frozen.hash!==stable.hash||frozen.alpha!==stable.alpha||frozen.camera.x!==stable.camera.x||frozen.camera.y!==stable.camera.y||frozen.audio||frozen.timers||frozen.raf)throw Error('Pause lifecycle regression '+JSON.stringify({frozen,stable}));
   await p.evaluate(()=>tuningLab.game.resume());await p.waitForTimeout(100);if(await p.evaluate(()=>tuningLab.game.status)!=='playing')throw Error('Resume regression');
   await p.locator('#training').screenshot({path:'docs/qa/progressive-run/'+(mobile?'mobile':'desktop')+'.png',scale:'css'});
   await p.locator('[data-stage="0"]').click();await p.waitForFunction(()=>tuningLab.current?.config.startStage===0&&tuningLab.game.status==='playing');const restart=await p.evaluate(()=>({length:tuningLab.current.state.length,effects:tuningLab.current.effects.length,hazards:tuningLab.current.world.hazards.length,world:tuningLab.progression.world,starts:tuningLab.game.starts}));if(restart.length!==8||restart.effects||restart.hazards||restart.world[0]!==28)throw Error('Restart regression '+JSON.stringify(restart));results.push({mobile,pause:frozen,restart});
   await p.evaluate(async()=>{const g=tuningLab.game,s=g.session,{createState}=await import('/arcade/snake-next/entry.js'),{SnakeMotion}=await import('/arcade/snake-next/forest-training/motion.js');g.pause();s.state=createState({seed:s.state.seed,rules:s.rules,arena:s.arena,body:Array.from({length:8},(_,i)=>5*112+26-i),direction:1,food:5*112+15});g.motion=new SnakeMotion(s);g.render();g.resume();});await p.waitForFunction(()=>tuningLab.game.status==='result');await p.waitForTimeout(await p.evaluate(()=>tuningLab.game.audio.buffers.get('result').duration*1000+50));const death=await p.evaluate(()=>({reason:tuningLab.current.state.reason,status:tuningLab.game.status,raf:tuningLab.game.raf,timer:Number(!!tuningLab.game.cancelTimer),audio:tuningLab.game.audio.sources.size,hazards:tuningLab.current.world.hazards.length}));if(death.reason!=='obstacle'||death.raf||death.timer||death.audio||death.hazards)throw Error('Death cleanup regression '+JSON.stringify(death));results.push({mobile,death});
  }finally{await context.close();}
 }
 const result={results,errors,network},download=page.waitForEvent('download');await page.evaluate(r=>{const a=document.createElement('a');a.download='browser.json';a.href=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)],{type:'application/json'}));a.click();},result);await(await download).saveAs('docs/qa/progressive-run/browser.json');if(errors.length||network.length)throw Error(JSON.stringify({errors,network}));return {checks:results.length,errors,network};
}
