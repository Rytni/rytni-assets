async page=>{
 const browser=page.context().browser(),results=[],errors=[],network=[];
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:844,height:390}:{width:1920,height:1080},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?2:1}),p=await context.newPage();
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('requestfailed',r=>network.push(r.url()));p.on('response',r=>{if(r.status()>=400)network.push(r.status()+' '+r.url());});
  try{
   await p.goto('http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html');await p.waitForFunction(()=>window.tuningLab?.game);await p.bringToFront();
   if(await p.locator('#camera-toggle').textContent()!=='STABLE CAMERA')throw Error('Wrong default');
   await p.locator('#progress-stage').selectOption('1');await p.waitForFunction(()=>tuningLab.game.status==='playing');await p.locator('#training').scrollIntoViewIfNeeded();
   await p.evaluate(async()=>{
    const g=tuningLab.game,s=g.session,{createState}=await import('/arcade/snake-next/entry.js'),{TunnelMotion}=await import('/arcade/snake-next/gate-one/motion.js');g.pause();
    // QA-only clear loop fixture, not a gameplay mode or production override.
    s.state=createState({seed:17,rules:s.rules,arena:s.arena,body:Array.from({length:8},(_,i)=>7*112+16-i),direction:1,food:4*112+24});s.state.cadence=s.cadence();s.moves=0;s.startsKey++;
    s.director.next={positive:100000,negative:100000,portal:100000};g.motion=new TunnelMotion(s);g.resume();
    window.cameraQA={started:performance.now(),samples:0,variation:0,axisLeak:0,restoreError:0,last:null,directions:[],hash:null};
    const render=g.render.bind(g);g.render=()=>{
     render();const q=cameraQA,v=tuningLab.camera,h=g.motion.frame(s).head;
     if(q.last){const dx=v.x-q.last.x,dy=v.y-q.last.y;q.variation+=Math.abs(dx)+Math.abs(dy);
      if(h.x===q.last.hx&&dx!==0||h.y===q.last.hy&&dy!==0)q.axisLeak++;
      const ex=Math.max(0,Math.min(s.world.width-28,h.x-q.last.x<v.safe.left?h.x-v.safe.left:h.x-q.last.x>v.safe.right?h.x-v.safe.right:q.last.x));
      const ey=Math.max(0,Math.min(s.world.height-12,h.y-q.last.y<v.safe.top?h.y-v.safe.top:h.y-q.last.y>v.safe.bottom?h.y-v.safe.bottom:q.last.y));
      q.restoreError=Math.max(q.restoreError,Math.abs(v.x-ex),Math.abs(v.y-ey));
     }
     q.samples++;q.last={x:v.x,y:v.y,hx:h.x,hy:h.y};
    };
    document.querySelector('#training').contentWindow.focus();
   });
   const buttons=mobile?await Promise.all([0,1,2,3].map(d=>p.frameLocator('#training').locator('#pad [data-dir="'+d+'"]').boundingBox())):[];
   let moves=0,turns=0;
   while(await p.evaluate(()=>performance.now()-cameraQA.started)<30500){
    await p.waitForFunction(m=>tuningLab.current.moves>m||tuningLab.game.status!=='playing',moves,{timeout:3000});
    const now=await p.evaluate(()=>({moves:tuningLab.current.moves,direction:tuningLab.current.state.direction,status:tuningLab.game.status}));
    if(now.status!=='playing')throw Error('Loop fixture stopped '+JSON.stringify(now));moves=now.moves;
    const r=moves%12,d=r<4?1:r<6?2:r<10?3:0;
    if(d!==now.direction){
     if(mobile){const b=buttons[d];await p.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);}
     else await p.keyboard.press(['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'][d]);
     turns++;
    }
   }
   const run=await p.evaluate(()=>{const g=tuningLab.game,pad=[...g.root.querySelectorAll('#pad button')].map(b=>({w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height}));g.pause();return {...cameraQA,elapsed:(performance.now()-cameraQA.started)/1000,moves:g.session.moves,camera:tuningLab.camera,hash:g.session.hash(),pad};});
   if(run.variation!==0||run.axisLeak!==0||run.restoreError>1e-9||run.elapsed<30||turns<20)throw Error('Camera instability '+JSON.stringify({run,turns}));
   // Frozen render + resume do not recenter. Toggle is immediate, DEV-only,
   // and preserves canonical state. Restart returns a clean stable camera.
   const lifecycle=await p.evaluate(()=>{const g=tuningLab.game,b=tuningLab.camera;g.render();const a=tuningLab.camera;g.resume();g.pause();return {before:b,after:a,resumed:tuningLab.camera,hash:g.session.hash()};});
   for(const v of [lifecycle.after,lifecycle.resumed])if(v.x!==run.camera.x||v.y!==run.camera.y)throw Error('Pause/resume recentered');
   if(lifecycle.hash!==run.hash)throw Error('Lifecycle mutated hash');
   await p.locator('#camera-toggle').click();if(await p.locator('#camera-toggle').textContent()!=='OLD LOOK-AHEAD')throw Error('Old A/B missing');
   await p.locator('#camera-toggle').click();if(await p.locator('#camera-toggle').textContent()!=='STABLE CAMERA')throw Error('Stable A/B missing');
   if(await p.evaluate(()=>tuningLab.current.hash())!==run.hash)throw Error('Toggle changed simulation');
   if(mobile&&run.pad.some(b=>b.w<44||b.h<44))throw Error('Mobile targets too small');
   await p.locator('[data-stage="0"]').click();await p.waitForFunction(()=>tuningLab.game.status==='playing'&&tuningLab.current.world.width===28);
   const restarted=await p.evaluate(()=>({x:tuningLab.camera.x,y:tuningLab.camera.y,mode:tuningLab.camera.mode}));if(restarted.x!==0||restarted.y!==0||restarted.mode!=='stable')throw Error('Restart retained camera');
   results.push({mobile,turns,run,lifecycle,restarted});
  }finally{await context.close();}
 }
 const report={results,errors,network},download=page.waitForEvent('download');await page.evaluate(r=>{const a=document.createElement('a');a.download='stable-camera.json';a.href=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)],{type:'application/json'}));a.click();},report);await(await download).saveAs('docs/qa/stable-camera/browser.json');
 if(errors.length||network.length)throw Error(JSON.stringify({errors,network}));return {results:results.map(r=>({mobile:r.mobile,seconds:r.run.elapsed,turns:r.turns,moves:r.run.moves,displacement:r.run.variation,axisLeak:r.run.axisLeak,restoreError:r.run.restoreError})),errors,network};
}
