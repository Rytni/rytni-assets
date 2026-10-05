async page=>{
 const browser=page.context().browser(),errors=[],network=[],results=[];
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:844,height:390}:{width:1920,height:1080},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?2:1}),p=await context.newPage();
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('requestfailed',r=>network.push(r.url()));p.on('response',r=>{if(r.status()>=400)network.push(r.status()+' '+r.url());});
  try{
   await p.goto('http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html');await p.waitForFunction(()=>window.tuningLab?.game);await p.bringToFront();await p.locator('[data-stage="0"]').click();await p.waitForFunction(()=>tuningLab.game.status==='playing');await p.locator('#training').scrollIntoViewIfNeeded();
   await p.evaluate(async()=>{
    const g=tuningLab.game,s=g.session,{createState}=await import('/arcade/snake-next/entry.js'),{TunnelMotion}=await import('/arcade/snake-next/gate-one/motion.js');g.pause();
    s.state=createState({seed:17,rules:s.rules,arena:s.arena,body:Array.from({length:8},(_,i)=>5*112+20-i),direction:1,food:3*112+24});s.state.cadence=s.cadence();g.motion=new TunnelMotion(s);
    document.querySelector('#world-awareness').checked=false;g.status='playing';g.show();g.render();g.status='paused';
   });
   const before=await p.evaluate(()=>({hash:tuningLab.current.hash(),head:tuningLab.game.motion.frame(tuningLab.current).head,camera:tuningLab.camera,world:tuningLab.progression.world,pad:[...tuningLab.game.root.querySelectorAll('#pad button')].map(b=>({w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height}))}));
   if(before.camera.wallDistance.right<4||before.camera.wallDistance.right>6||mobile&&before.pad.some(b=>b.w<44||b.h<44))throw Error('Boundary fixture invalid');
   await p.locator('#training').screenshot({path:'docs/qa/gate-one-1/'+(mobile?'04-mobile-boundary':'01-before')+'.png',scale:'css'});
   // Invoke the existing DEV expansion command; gameplay runs normally during
   // the event. Snapshots freeze its active tick only for exact review captures.
   await p.evaluate(()=>{const g=tuningLab.game;g.session.forceExpansion();g.resume();});await p.waitForFunction(()=>tuningLab.current.openings.length>0);
   await p.waitForFunction(()=>tuningLab.current.tick-tuningLab.current.openings.at(-1).tick>=34);
   const middle=await p.evaluate(()=>{const g=tuningLab.game,s=g.session,running=g.status==='playing'&&g.clock.status==='running';g.pause();const age=s.tick-s.openings.at(-1).tick,hash=s.hash();g.status='playing';g.show();g.render();g.status='paused';return {running,age,hash,world:tuningLab.progression.world,moves:s.moves,camera:tuningLab.camera};});
   if(!middle.running||middle.age>=60||middle.world[0]!==36||middle.moves===0)throw Error('Expansion not live '+JSON.stringify(middle));
   if(!mobile)await p.locator('#training').screenshot({path:'docs/qa/gate-one-1/02-middle.png',scale:'css'});
   await p.waitForTimeout(100);if(await p.evaluate(()=>tuningLab.current.hash())!==middle.hash)throw Error('Presentation mutated simulation');
   await p.evaluate(()=>tuningLab.game.resume());await p.waitForFunction(()=>tuningLab.current.tick-tuningLab.current.openings.at(-1).tick>=68);
   const after=await p.evaluate(()=>{const g=tuningLab.game,s=g.session,running=g.status==='playing'&&g.clock.status==='running';g.pause();const hash=s.hash();g.status='playing';g.show();g.render();g.status='paused';return {running,hash,age:s.tick-s.openings.at(-1).tick,moves:s.moves,world:tuningLab.progression.world,camera:tuningLab.camera};});
   if(!after.running||after.age<60||after.moves<=middle.moves)throw Error('Expansion froze gameplay');
   if(!mobile)await p.locator('#training').screenshot({path:'docs/qa/gate-one-1/03-after.png',scale:'css'});
   results.push({mobile,before,middle,after});
  }finally{await context.close();}
 }
 const report={results,errors,network},download=page.waitForEvent('download');await page.evaluate(r=>{const a=document.createElement('a');a.download='expansion-ux.json';a.href=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)],{type:'application/json'}));a.click();},report);await(await download).saveAs('docs/qa/gate-one-1/browser.json');if(errors.length||network.length)throw Error(JSON.stringify({errors,network}));return {desktopMobilePassed:true,errors,network};
}
