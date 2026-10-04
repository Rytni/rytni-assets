async page=>{
 const browser=page.context().browser(),errors=[],network=[],results=[],dir='docs/qa/smooth-v4-live/';
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:844,height:390}:{width:1920,height:1080},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?2:1}),p=await context.newPage();
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('requestfailed',r=>network.push(r.url()));p.on('response',r=>{if(r.status()>=400)network.push(r.status()+' '+r.url());});
  try{
   await p.goto('http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html');await p.waitForFunction(()=>window.tuningLab?.game);
   if(await p.locator('#motion-toggle').textContent()!=='SMOOTH V4')throw Error('V4 not default');
   await p.bringToFront();await p.locator('[data-preset=B]').click();
   const gameFrame=p.frameLocator('#training');
   if(mobile){await p.locator('#training').scrollIntoViewIfNeeded();await gameFrame.locator('#pad [data-dir="0"]').tap();}
   else await gameFrame.locator('canvas[aria-label]').press('ArrowUp');
   await p.waitForTimeout(650);
   const input=await p.evaluate(()=>{const g=tuningLab.game;return {status:g.status,clock:g.clock.status,direction:g.session.state.direction,mode:document.querySelector('#motion-toggle').textContent,renderer:g.renderer.smoothSprites.constructor.name};});
   if(input.status!=='playing'||input.clock!=='running'||input.direction!==0)throw Error('Live input/recovery '+JSON.stringify(input));
   const pause=await p.evaluate(()=>{const g=tuningLab.game;g.pause();return {frame:JSON.stringify(g.motion.frame(g.session)),hash:g.session.hash(),alpha:g.motion.alpha};});
   await p.waitForTimeout(80);
   const frozen=await p.evaluate(a=>{const g=tuningLab.game;const ok=JSON.stringify(g.motion.frame(g.session))===a.frame&&g.session.hash()===a.hash;g.resume();const resumed=g.motion.frame(g.session).alpha;g.pause();return ok&&resumed>=a.alpha;},pause);
   if(!frozen)throw Error('Pause/resume jump');
   const restart=await p.evaluate(()=>{const g=tuningLab.game;g.start();g.pause();return {length:g.motion.snapshots.length,moved:g.motion.snapshots.moved,frozen:g.motion.frozen};});
   if(restart.length!==8||restart.moved)throw Error('Stale restart');
   const cases=await p.evaluate(async mobile=>{
    const {createState}=await import('/arcade/snake-next/entry.js'),{SnakeMotion}=await import('/arcade/snake-next/forest-training/motion.js'),{labSession}=await import('/arcade/snake-next/tuning-lab/session.js'),{PRESETS}=await import('/arcade/snake-next/tuning-lab/config.js'),{loopFixture,cycle,directionBetween}=await import('/arcade/snake-next/tests/fixtures.js'),{bodyCell}=await import('/arcade/snake-next/simulation/body.js'),{frameAt}=await import('/arcade/snake-next/smooth-v4-proof/fixtures.js'),{makeSweep,fieldAt}=await import('/arcade/snake-next/smooth-v4-proof/ribbon.js'),{measureSection,pose}=await import('/arcade/snake-next/smooth-v4-proof/validation/local-validator.mjs');
    const g=tuningLab.game;g.stop();const fraction=g.renderFraction;g.renderFraction=()=>0;
    const stats={turnDirections:[],shapes:[],samples:0,widthMin:Infinity,widthMax:0,widthFailures:0,hashFailures:0,lengths:[],portal:{},growth:false};
    function renderCheck(s,m,alpha){
     g.session=s;g.motion=m;g.status='paused';m.frozen=alpha;const hash=s.hash();g.render();if(s.hash()!==hash)stats.hashFailures++;
     const sweep=makeSweep(m.frame(s)),adapter=g.renderer.smoothSprites,box=adapter.bounds,r=adapter.raster;
     const contains=(x,y)=>{const a=Math.floor(x-box.x*68),b=Math.floor(y-box.y*68);return a>=0&&a<r.w&&b>=0&&b<r.h&&!!r.mask[b*r.w+a];};
     for(const part of sweep.parts)for(const t of [.25,.5,.75]){const q=pose(part,t);if(q.x<25||q.x>28*68-25||q.y<25||q.y>12*68-25)continue;const local=measureSection(sweep,q,{contains});if(local.region!=='BODY')continue;stats.samples++;stats.widthMin=Math.min(stats.widthMin,local.localThickness);stats.widthMax=Math.max(stats.widthMax,local.localThickness);if(local.localThickness<35||local.localThickness>38||local.missing)stats.widthFailures++;}
    }
    function installRoute(route,length=8,growth=false){
     const f=loopFixture(length),w=f.arena.width,cells=route.map(p=>p.y*w+p.x),s=labSession(PRESETS.B,{arena:f.arena,rules:f.rules});
     s.view={x:0,y:0,cols:28,rows:12};s.state=createState({seed:123,arena:f.arena,rules:f.rules,body:cells.slice(2,2+length),direction:directionBetween(cells[3],cells[2],w),food:growth?cells[1]:97});const m=new SnakeMotion(s),next=directionBetween(cells[2],cells[1],w);
     for(let i=0;i<30&&!m.snapshots.moved;i++){s.advance(i===0?[{tick:1,sequence:1,direction:next}]:[]);m.capture(s);}
     if(!m.snapshots.moved)throw Error('Fixture failed to move');m.frozen=null;return {s,m,next};
    }
    const rotations=(route,r,mirror)=>route.map(p=>{let x=p.x-11,y=p.y-4;if(mirror)x=-x;for(let i=0;i<r;i++)[x,y]=[-y,x];return {x:x+13,y:y+6};});
    for(let mirror=0;mirror<2;mirror++)for(let r=0;r<4;r++){
     const route=rotations(frameAt('up',0).route,r,mirror),{s,m}=installRoute(route);stats.turnDirections.push({rotation:r,mirror,outgoing:s.state.direction});
     for(const alpha of [0,.2,.5,.8,1])renderCheck(s,m,alpha);
    }
    for(const name of ['straight','U','S','alternating','growth']){
     const {s,m}=installRoute(frameAt(name,0).route,8,name==='growth');for(const alpha of [0,.2,.5,.8,1])renderCheck(s,m,alpha);stats.shapes.push(name);if(name==='growth')stats.growth=s.foods===1&&s.state.length===9;
    }
    for(const length of [8,30,250]){
     const f=loopFixture(length),path=cycle(14,20,7,2,96),offset=40,s=labSession(PRESETS.B,{arena:f.arena,rules:f.rules});s.view={x:0,y:0,cols:28,rows:12};s.state=createState({seed:123,arena:f.arena,rules:f.rules,body:Array.from({length},(_,i)=>path[(offset-i+path.length)%path.length]),direction:directionBetween(path[offset],path[(offset+1)%path.length],96),food:97});const m=new SnakeMotion(s);renderCheck(s,m,1);stats.lengths.push(length);
    }
    const s=labSession(PRESETS.B),entry=s.portals[0];s.state=createState({seed:1,arena:s.arena,rules:s.rules,body:Array.from({length:8},(_,i)=>entry-1-i),direction:1,food:entry+2});s.tick=PRESETS.B.portalFirst*60;s.portal.phase='armed';const m=new SnakeMotion(s);let atomic=true;const phases=[];
    for(let i=0;i<70;i++){const before=s.state;s.advance();m.capture(s);if(!phases.includes(s.portal.phase)){phases.push(s.portal.phase);renderCheck(s,m,1);m.frozen=null;}if(before!==s.state)atomic&&=m.snapshots.previous[0]===m.snapshots.current[0]&&m.frame(s).alpha===1;}
    stats.portal={transfers:s.portal.transfers,atomic,phases};g.renderFraction=fraction;
    const shot=installRoute(frameAt(mobile?'S':'up',0).route);g.session=shot.s;g.motion=shot.m;shot.m.frozen=.45;g.status='playing';g.show();g.render();
    window.ribbonQAScreenshot=()=>{const shot=installRoute(frameAt('U',0).route);g.session=shot.s;g.motion=shot.m;shot.m.frozen=.181818181818;g.status='playing';g.show();g.render();};
    return stats;
   },mobile);
   if(cases.hashFailures||cases.widthFailures||!cases.growth||cases.portal.transfers!==1||!cases.portal.atomic)throw Error('Targeted gate '+JSON.stringify(cases));
   const modeHashes=[];
   for(const expected of ['SMOOTH V4','SMOOTH V2','GRID SNAP']){
    if(await p.locator('#motion-toggle').textContent()!==expected)throw Error('Mode order');
    modeHashes.push(await p.evaluate(()=>tuningLab.game.session.hash()));await p.locator('#motion-toggle').click();
    if(await p.evaluate(()=>tuningLab.game.status)!=='playing')throw Error('DEV toggle paused gameplay');
   }
   if(new Set(modeHashes).size!==1)throw Error('Renderer changes hash');
   await p.locator('#training').scrollIntoViewIfNeeded();await p.locator('#training').screenshot({path:dir+(mobile?'mobile':'live-turn')+'.png',scale:'css'});
   if(!mobile){await p.evaluate(()=>ribbonQAScreenshot());await p.locator('#training').screenshot({path:dir+'live-U.png',scale:'css'});}
   results.push({mobile,input,pauseResume:frozen,restart,cases,modeHashes});
  }finally{await context.close();}
 }
 const result={results,errors,network};
 const pending=page.waitForEvent('download');await page.evaluate(result=>{const a=document.createElement('a');a.download='integration.json';a.href=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));a.click();},result);await(await pending).saveAs(dir+'integration.json');
 if(errors.length||network.length)throw Error(JSON.stringify(result));return result;
}
