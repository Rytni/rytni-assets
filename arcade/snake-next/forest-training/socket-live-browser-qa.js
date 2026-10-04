async page=>{
 const browser=page.context().browser(),results=[],errors=[],failed=[],dir='docs/qa/smooth-v2-1/';
 for(const length of [8,30,250]){
  const mobile=length===30,ctx=await browser.newContext({viewport:mobile?{width:844,height:390}:{width:1366,height:900},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?2:1}),p=await ctx.newPage();p.setDefaultTimeout(15000);
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('requestfailed',r=>failed.push(r.url()));p.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url());});
  await p.goto('http://127.0.0.1:8773/arcade/snake-next/game-feel-lab.html?socketProof=1');await p.waitForFunction(()=>window.tuningLab?.game);
  await p.evaluate(async length=>{
   const {loopFixture,cycle,directionBetween}=await import('/arcade/snake-next/tests/fixtures.js'),{createState}=await import('/arcade/snake-next/entry.js'),{labSession}=await import('/arcade/snake-next/tuning-lab/session.js'),{PRESETS}=await import('/arcade/snake-next/tuning-lab/config.js'),{bodyCell}=await import('/arcade/snake-next/simulation/body.js');
   const g=tuningLab.game,f=loopFixture(length,14),path=cycle(14,18,7,2,96),offset=12,body=Array.from({length},(_,i)=>path[(offset-i+path.length)%path.length]),direction=directionBetween(path[offset],path[(offset+1)%path.length],96),factory=g.sessionFactory;
   const state=createState({seed:123,arena:f.arena,rules:f.rules,body,direction,food:length<250?path[(offset+4)%path.length]:97});state.cadence=14;
   window.liveFactory=factory;
   const plain=labSession(PRESETS.B,{touch:g.touch,arena:f.arena,rules:f.rules});plain.state=structuredClone(state);
   g.sessionFactory=options=>{const s=factory({...options,arena:f.arena,rules:f.rules});s.state=state;s.view={x:0,y:0,cols:28,rows:12};stats.start=performance.now();return s;};
   const original=g.tick.bind(g),stats={length,mobile:innerHeight<=500,start:performance.now(),ticks:0,moves:0,turns:0,foods:0,hashFailures:0,frames:0,recoveries:0,paused:false};window.liveMotion=stats;
   const render=g.render.bind(g);g.render=()=>{stats.frames++;render();};
   g.tick=()=>{
    const s=g.session;
    const head=bodyCell(s.state,0),index=path.indexOf(head),next=directionBetween(head,path[(index+1)%path.length],96);
    if(s.state.movePhase>=s.cadence()-1&&next!==s.state.direction)g.command(next);
    const commands=g.commands.slice();const prior=s.moves;original();plain.advance(commands);stats.ticks++;if(s.hash()!==plain.hash())stats.hashFailures++;
    if(s.moves!==prior){stats.moves++;if(s.state.direction!==stats.direction)stats.turns++;stats.direction=s.state.direction;stats.foods=s.foods;}
    // Test-only viewport jumps between two bounded inspection windows. Do not
    // rebuild a full ground canvas every cell just to move the QA camera.
    const y=Math.floor(head/96);if(y>s.view.y+10)s.view.y=8;else if(y<s.view.y+2)s.view.y=0;
   };
   const pause=g.pause.bind(g);g.pause=()=>{if(g.clock?.status==='recovery')stats.recoveries++;pause();};
  },length);
  await p.bringToFront();await p.locator('[data-preset=B]').click();
  // Cold long-body fixture preparation is reported separately, never hidden
  // by relaxing FixedClock. The required run counts active motion after this
  // one-second warm-up; any recovery inside that window remains a failure.
  await p.waitForTimeout(1500);
  await p.evaluate(()=>{const g=tuningLab.game;liveMotion.warmupRecoveries=liveMotion.recoveries;liveMotion.warmupTicks=liveMotion.ticks;if(g.status==='paused')g.resume();liveMotion.recoveries=0;liveMotion.start=performance.now();});
  // Real wall-clock RAF + fixed timer gameplay, not an accelerated sim loop.
  await p.waitForTimeout(4000);
  const mid=await p.evaluate(()=>{const g=tuningLab.game;const before=g.motion.freeze(g.session,g.renderFraction());g.pause();return {alpha:before,hash:g.session.hash(),frame:JSON.stringify(g.motion.frame(g.session))};});
  await p.waitForTimeout(100);const freeze=await p.evaluate(mid=>{const g=tuningLab.game,ok=g.session.hash()===mid.hash&&JSON.stringify(g.motion.frame(g.session))===mid.frame;g.resume();return ok&&g.motion.alpha>=mid.alpha;},mid);
  await p.waitForTimeout(4000);
  const result=await p.evaluate(()=>({...liveMotion,wallSeconds:(performance.now()-liveMotion.start)/1000,status:tuningLab.game.status,hash:tuningLab.current.hash(),summary:tuningLab.current.summary()}));result.pauseResume=freeze;results.push(result);
  if(result.status!=='playing'||result.hashFailures||result.recoveries||!freeze)throw Error('Live motion failed '+JSON.stringify(result));
  // A clean restart uses the ordinary B factory, not the scripted loop fixture.
  const restart=await p.evaluate(()=>{const g=tuningLab.game;g.tick=()=>{};g.sessionFactory=liveFactory;g.start();return {alpha:g.motion.alpha,history:g.motion.snapshots.moved,frozen:g.motion.frozen,length:g.session.state.length};});result.restart=restart;
  await ctx.close();
 }
 const result={results,activeWallSeconds:results.reduce((n,r)=>n+r.wallSeconds,0),errors,failed};
 const pending=page.waitForEvent('download');await page.evaluate(result=>{const a=document.createElement('a');a.download='live.json';a.href=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));a.click();},result);await(await pending).saveAs(dir+'live-results.json');return result;
}
