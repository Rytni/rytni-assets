async page=>{
 const browser=page.context().browser(),results=[],errors=[],network=[];
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:844,height:390}:{width:1920,height:1080},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?2:1}),p=await context.newPage();
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('requestfailed',r=>network.push(r.url()));p.on('response',r=>{if(r.status()>=400)network.push(r.status()+' '+r.url());});
  try{
   await p.goto('http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html');await p.waitForFunction(()=>window.tuningLab?.game);await p.bringToFront();
   await p.locator('[data-stage="0"]').click();await p.waitForFunction(()=>tuningLab.game.status==='playing');await p.locator('#training').scrollIntoViewIfNeeded();
   if(mobile)await p.frameLocator('#training').locator('#pad [data-dir="1"]').tap();else await p.frameLocator('#training').locator('canvas[aria-label]').press('ArrowRight');
   const start=await p.evaluate(()=>({status:tuningLab.game.status,clock:tuningLab.game.clock.status,motion:tuningLab.game.motion.constructor.name,mode:document.querySelector('#motion-toggle').textContent,pad:[...tuningLab.game.root.querySelectorAll('#pad button')].map(b=>({w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height})),bounds:tuningLab.camera}));
   if(start.status!=='playing'||start.motion!=='TunnelMotion'||start.mode!=='SMOOTH V4'||mobile&&start.pad.some(b=>b.w<44||b.h<44))throw Error('Start/input failure '+JSON.stringify(start));results.push({mobile,start});
   // Explicit QA fixture only; actual fixed-clock movement and input remain live.
   await p.evaluate(async()=>{
    const g=tuningLab.game,s=g.session,{createState}=await import('/arcade/snake-next/entry.js'),{TunnelMotion}=await import('/arcade/snake-next/gate-one/motion.js');g.pause();
    const route=[];for(let row=0;row<5;row++)for(let n=0;n<12;n++)route.push((4+row)*112+(row%2?2+n:13-n));
    s.state=createState({seed:17,rules:s.rules,arena:s.arena,body:route.slice(0,30),direction:1,food:2*112+23});s.state.cadence=s.cadence();s.moves=0;s.portalEdges=[];s.portalCompleted=0;
    s.portals=[4*112+14,7*112+19];s.portal.phase='armed';s.portal.transfers=0;s.director.windowEnd=s.tick+3000;s.director.next={positive:100000,negative:100000,portal:100000};s.preparePortals();
    g.motion=new TunnelMotion(s);g.render();g.resume();
   });
   await p.waitForFunction(()=>tuningLab.current.portal.transfers===1&&tuningLab.current.moves>=3);
   const live=await p.evaluate(()=>{const g=tuningLab.game,s=g.session;g.pause();const hash=s.hash(),f=g.motion.frame(s);g.render();return {status:s.status,length:s.state.length,edge:s.portalEdges[0],head:f.head,spans:f.spans?.length,hashReadStable:hash===s.hash(),phase:s.portal.phase,camera:tuningLab.camera};});
   if(live.status!=='playing'||live.length!==30||live.spans!==2||!live.hashReadStable)throw Error('Progressive live split failed '+JSON.stringify(live));results.push({mobile,live});
   await p.evaluate(()=>{const g=tuningLab.game,status=g.status;g.status='playing';g.show();g.render();g.status=status;}); // frozen capture with no pause panel; no running clock
   await p.locator('#training').screenshot({path:'docs/qa/gate-one/'+(mobile?'mobile':'desktop-tunnel')+'.png',scale:'css'});
   // Compare render modes with simulation paused: no mode owns gameplay state.
   const parity=await p.evaluate(()=>{const g=tuningLab.game,s=g.session,hash=s.hash(),frames=[];for(let i=0;i<3;i++){document.querySelector('#motion-toggle').click();frames.push({mode:document.querySelector('#motion-toggle').textContent,hash:s.hash(),same:s.hash()===hash});}return frames;});
   if(parity.some(f=>!f.same))throw Error('Mode hash divergence');results.push({mobile,parity});
   const frozen=await p.evaluate(()=>({hash:tuningLab.current.hash(),alpha:tuningLab.game.motion.frozen,camera:tuningLab.camera}));await p.waitForTimeout(160);
   const stable=await p.evaluate(()=>({hash:tuningLab.current.hash(),alpha:tuningLab.game.motion.frozen,camera:tuningLab.camera}));if(JSON.stringify(frozen)!==JSON.stringify(stable))throw Error('Paused portal/camera drift');
   await p.evaluate(()=>tuningLab.game.resume());await p.waitForTimeout(140);const resumed=await p.evaluate(()=>({status:tuningLab.game.status,edges:tuningLab.current.portalEdges.length,clock:tuningLab.game.clock.status}));if(resumed.status!=='playing'||resumed.clock!=='running'||!resumed.edges)throw Error('Resume failed');results.push({mobile,resumed});
   // Expansion is simultaneous with legal gameplay, never a blocking modal.
   await p.locator('[data-stage="0"]').click();await p.waitForFunction(()=>tuningLab.current.state.length===8&&tuningLab.game.status==='playing');await p.locator('#training').scrollIntoViewIfNeeded();
   await p.evaluate(()=>document.querySelector('#expand-world').click());await p.waitForFunction(()=>tuningLab.current.openings.length===1);await p.waitForTimeout(270);
   const expansion=await p.evaluate(()=>({world:tuningLab.progression.world,opening:tuningLab.current.openings.at(-1),age:tuningLab.current.tick-tuningLab.current.openings.at(-1).tick,status:tuningLab.game.status,moves:tuningLab.current.moves,camera:tuningLab.camera}));
   if(expansion.world[0]!==36||expansion.age<=0||expansion.age>=60||expansion.status!=='playing'||expansion.moves===0)throw Error('Expansion presentation failed '+JSON.stringify(expansion));results.push({mobile,expansion});
   if(!mobile)await p.locator('#training').screenshot({path:'docs/qa/gate-one/desktop-expansion.png',scale:'css'});
   await p.evaluate(()=>{const g=tuningLab.game;g.command(2);});await p.waitForTimeout(1100);
   const settled=await p.evaluate(()=>({age:tuningLab.current.tick-tuningLab.current.openings.at(-1).tick,status:tuningLab.game.status}));if(settled.age<60)throw Error('Opening not settled');results.push({mobile,settled});
   // Live long-body portal rendering, not a benchmark or autopilot run.
   await p.locator('[data-stage="4"]').click();await p.waitForFunction(()=>tuningLab.current.config.startStage===4&&tuningLab.game.status==='playing');
   await p.evaluate(async()=>{
    const g=tuningLab.game,s=g.session,{createState}=await import('/arcade/snake-next/entry.js'),{TunnelMotion}=await import('/arcade/snake-next/gate-one/motion.js');g.pause();
    const route=[];for(let row=0;row<12;row++)for(let n=0;n<30;n++)route.push((12+row)*112+(row%2?1+n:30-n));
    s.state=createState({seed:17,rules:s.rules,arena:s.arena,body:route.slice(0,250),direction:1,food:8*112+65});s.state.cadence=s.cadence();s.moves=0;s.portalEdges=[];s.portalCompleted=0;
    s.portals=[12*112+31,12*112+53];s.portal.phase='armed';s.director.windowEnd=s.tick+3000;s.director.next={positive:100000,negative:100000,portal:100000};s.preparePortals();g.motion=new TunnelMotion(s);g.render();
    const pause=g.pause.bind(g);g.pause=()=>{window.gatePause={reason:g.clock?.reason,stack:new Error().stack};pause();};g.resume();
   });
   await p.waitForFunction(()=>tuningLab.current.moves>=4||tuningLab.game.status==='paused');
   const long=await p.evaluate(()=>{const g=tuningLab.game,s=g.session,running=g.status==='playing'&&g.clock.status==='running',pause=window.gatePause;g.pause();return {status:s.status,moves:s.moves,running,pause,length:s.state.length,edges:s.portalEdges.length,spans:g.motion.frame(s).spans?.length,clock:g.clock.status,camera:tuningLab.camera};});
   if(!long.running||long.moves<4||long.status!=='playing'||long.length!==250||long.spans!==2||long.edges!==1)throw Error('Live 250 tunnel failed '+JSON.stringify(long));results.push({mobile,long});
   // Restart clears all tunnel/expansion presentation history and queued input.
   await p.locator('[data-stage="0"]').click();await p.waitForFunction(()=>tuningLab.current.moves===0&&tuningLab.game.status==='playing');
   const clean=await p.evaluate(()=>({edges:tuningLab.current.portalEdges.length,openings:tuningLab.current.openings.length,length:tuningLab.current.state.length,queue:tuningLab.current.state.turnCount}));if(clean.edges||clean.openings||clean.queue||clean.length!==8)throw Error('Restart stale state');results.push({mobile,clean});
   await p.evaluate(async()=>{const g=tuningLab.game,s=g.session,{createState}=await import('/arcade/snake-next/entry.js'),{TunnelMotion}=await import('/arcade/snake-next/gate-one/motion.js');g.pause();s.state=createState({seed:17,rules:s.rules,arena:s.arena,body:Array.from({length:8},(_,i)=>5*112+26-i),direction:1,food:2*112+15});g.motion=new TunnelMotion(s);g.resume();});await p.waitForFunction(()=>tuningLab.game.status==='result');
   const death=await p.evaluate(()=>({reason:tuningLab.current.state.reason,status:tuningLab.game.status,raf:tuningLab.game.raf,timer:Number(!!tuningLab.game.cancelTimer),hazards:tuningLab.current.world.hazards.length}));if(death.reason!=='obstacle'||death.raf||death.timer||death.hazards)throw Error('Death cleanup failed');results.push({mobile,death});
  }catch(error){const state=await p.evaluate(()=>({status:window.tuningLab?.game?.status,clock:window.tuningLab?.game?.clock?.status,length:window.tuningLab?.current?.state.length,moves:window.tuningLab?.current?.moves,phase:window.tuningLab?.current?.portal.phase,reason:window.tuningLab?.current?.state.reason,edges:window.tuningLab?.current?.portalEdges,world:window.tuningLab?.progression?.world,pause:window.gatePause}));throw Error(JSON.stringify({error:String(error),checks:results.length,mobile,state,errors,network}));}finally{await context.close();}
 }
 const report={checks:results.length,results,errors,network},download=page.waitForEvent('download');await page.evaluate(r=>{const a=document.createElement('a');a.download='browser.json';a.href=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)],{type:'application/json'}));a.click();},report);await(await download).saveAs('docs/qa/gate-one/browser.json');if(errors.length||network.length)throw Error(JSON.stringify({errors,network}));return {checks:results.length,errors,network};
}
