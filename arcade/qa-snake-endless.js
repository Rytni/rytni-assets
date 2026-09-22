// Playwright CLI run-code function. Start serve-snake-local.cjs first.
async page=>{
 const out='C:/Codex/Rytni Gift/RYTNI_TRANSFER_2026-07-31/CORE/Сайт/artifacts/arcade-snake-competitive/';
 const report={errors:[],failed:[],http:[],screens:[],perf:[]};
 const check=(value,message)=>{if(!value)throw Error(message);};
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});page.on('requestfailed',r=>report.failed.push(r.url()+' '+r.failure()?.errorText));page.on('response',r=>{if(r.status()>=400)report.http.push(r.status()+' '+r.url());});
 const action=name=>page.locator('[data-ms-action="'+name+'"]').filter({visible:true}).last();
 const shot=async name=>{await page.locator('#msStage').screenshot({path:out+name+'.png'});report.screens.push(name);};
 const desktopCDP=await page.context().newCDPSession(page);await desktopCDP.send('Emulation.setTouchEmulationEnabled',{enabled:false});
 await page.setViewportSize({width:1440,height:950});await page.goto('http://127.0.0.1:8827');await action('game-snake').click();await action('start').click();await page.waitForFunction(()=>RytniMushroomSnake.state==='play');await action('pause').click();
 const paused=await page.evaluate(()=>RytniMushroomSnake.engine.ticks);await page.waitForTimeout(150);check(await page.evaluate(()=>RytniMushroomSnake.engine.ticks)===paused,'pause freezes simulation');
 await action('settings').click();await action('back').click();await action('resume').click();await page.waitForFunction(()=>RytniMushroomSnake.state==='play');
 await page.evaluate(()=>{const s=RytniMushroomSnake;s.stop();s.engine.reset(47);s.state='play';});
 await page.keyboard.press('ArrowUp');check(await page.evaluate(()=>{const e=RytniMushroomSnake.engine;e.move();return e.direction===0&&e.y===-1;}),'up input');await page.keyboard.press('ArrowDown');check(await page.evaluate(()=>RytniMushroomSnake.engine.queue.length===0),'no reverse');await page.keyboard.press('ArrowLeft');check(await page.evaluate(()=>{const e=RytniMushroomSnake.engine;e.move();return e.direction===3&&e.x===-1;}),'left input');
 await page.evaluate(()=>{
  // Build a legal static path for screenshot/stress fixtures through real terrain.
  window.competitiveFixture=(x,length=28,startY=0)=>{
   const s=RytniMushroomSnake,C=MushroomSnakeCore,e=s.engine;s.stop();e.reset(47,length);s.state='play';e.occupied.clear();e.head=0;let y=startY;while(e.world.blocked(x,y))y++;e.x=x;e.y=y;const points=[{x,y}],used=new Set([C.key(x,y)]);let back=3;
   while(points.length<=length){const p=points[points.length-1],q=[{x:p.x,y:p.y,first:-1}],seen=new Set([C.key(p.x,p.y)]);let chosen=null;
    for(let i=0;i<q.length&&!chosen;i++){const a=q[i];if(a.x<=p.x-8){chosen=a.first;break;}for(const d of [3,0,2,1]){if(i===0&&d===(back+2)%4)continue;const nx=a.x+C.DX[d],ny=a.y+C.DY[d],k=C.key(nx,ny);if(Math.abs(nx-p.x)>16||Math.abs(ny-p.y)>16||seen.has(k)||used.has(k)||e.world.blocked(nx,ny))continue;seen.add(k);q.push({x:nx,y:ny,first:i===0?d:a.first});}}
    if(chosen===null)throw Error('fixture path unavailable');back=chosen;const next={x:p.x+C.DX[back],y:p.y+C.DY[back]};points.push(next);used.add(C.key(next.x,next.y));
   }
   for(let i=0;i<points.length;i++){const j=C.mod(-i,C.CAPACITY),p=points[i];e.bx[j]=p.x;e.by[j]=p.y;if(i<length)e.occupied.add(C.key(p.x,p.y));}
   e.direction=points[1].x<x?1:points[1].x>x?3:points[1].y<y?2:0;e.previousDirection=e.direction;e.world.stream(x,y);e.phase=1;for(const f of e.items){f.active=false;f.cool=1e9;}e.place(e.items[0]);s.chunks.clear();s.fit();document.getElementById('msOverlay').hidden=true;document.getElementById('msHud').hidden=false;s.biomeId=null;s.hud();s.paint();return{head:[x,y],length};
  };
 });
 for(const [name,x]of [['forest',0],['cave',220],['swamp',420],['transition',157]]){await page.evaluate(x=>competitiveFixture(x),x);await shot(name);}
 for(const name of ['bloom','trail']){await page.evaluate(name=>{competitiveFixture(220,8);const s=RytniMushroomSnake;s.engine.startWorldEvent(name);s.hud();s.paint();},name);await shot('event-'+name);}
 await page.evaluate(()=>{const s=RytniMushroomSnake;let p=null;for(let x=80;x<2000&&!p;x++)for(let y=0;y<64;y++)if(s.engine.world.groveAt(x,y)&&!s.engine.world.blocked(x,y)){p={x,y};break;}if(!p)throw Error('grove not found');competitiveFixture(p.x,8,p.y);if(!s.engine.startWorldEvent('grove'))throw Error('grove absent');s.hud();s.paint();});await shot('event-grove');
 await page.evaluate(()=>{competitiveFixture(220,8);const s=RytniMushroomSnake;for(let i=0;i<20;i++)s.engine.collect(s.engine.items[0]);s.hud();s.paint();});await shot('combo-20');
 const invariant=await page.evaluate(()=>{const s=RytniMushroomSnake,before=s.engine.digest();for(let i=0;i<5;i++){s.fit();s.paint();}return before===s.engine.digest();});check(invariant,'render does not mutate simulation');
 await action('fullscreen').click();check(await page.evaluate(()=>RytniMushroomSnake.full()),'desktop fullscreen');await page.evaluate(()=>competitiveFixture(420,250));await shot('desktop-fullscreen');await page.evaluate(()=>document.exitFullscreen());await page.setViewportSize({width:1180,height:780});
 for(const length of [250,500,1200]){
  await page.evaluate(length=>competitiveFixture(220,length),length);
  const perf=await page.evaluate(async()=>{const s=RytniMushroomSnake,times=[];for(let i=0;i<180;i++){await new Promise(requestAnimationFrame);const t=performance.now();s.engine.phase=(i%60)/60;s.paint();times.push(performance.now()-t);}times.sort((a,b)=>a-b);return{length:s.engine.length,p95:times[171],chunks:s.engine.world.chunks.size,renderChunks:s.chunks.size,dpr:s.view.dpr};});report.perf.push(perf);check(perf.chunks<=25&&perf.renderChunks<=9&&perf.p95<16,'bounded render');await shot('desktop-'+length);
 }
 // Streaming in browser uses the same deterministic core, over 500 regions.
 report.streaming=await page.evaluate(()=>{const w=RytniMushroomSnake.engine.world,original=[...w.chunk(0,0).cells];for(let x=0;x<10000;x+=16)w.stream(x,0);w.stream(0,0);return{regenerated:original.every((v,i)=>v===w.chunk(0,0).cells[i]),count:w.chunks.size,generated:w.generated};});check(report.streaming.regenerated&&report.streaming.count===25,'browser deterministic regeneration');
 await page.evaluate(()=>competitiveFixture(0,8));await action('pause').click();await action('restart-confirm').click();await action('restart-now').click();await page.waitForFunction(()=>RytniMushroomSnake.state==='play');check(await page.evaluate(()=>RytniMushroomSnake.engine.length===8),'restart resets');await action('pause').click();await action('menu').click();check(await page.evaluate(()=>RytniMushroomSnake.state==='menu'&&!RytniMushroomSnake.raf),'main menu stops RAF');await shot('main-menu');
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});await page.setViewportSize({width:393,height:873});await action('start').click();await page.waitForFunction(()=>RytniMushroomSnake.state==='rotate');await shot('mobile-portrait');await action('enter').click();await page.setViewportSize({width:873,height:393});await page.waitForFunction(()=>RytniMushroomSnake.state==='play');await page.evaluate(()=>{RytniMushroomSnake.stop();RytniMushroomSnake.engine.reset(47);RytniMushroomSnake.state='play';});
 await page.locator('#msDpad [data-dir="0"]').click();check(await page.evaluate(()=>{const e=RytniMushroomSnake.engine;e.move();return e.direction===0;}),'real D-pad');await page.locator('#msDpad [data-dir="2"]').click();check(await page.evaluate(()=>RytniMushroomSnake.engine.queue.length===0),'D-pad reverse rejected');
 for(const [name,x]of [['forest',0],['cave',220],['swamp',420]]){await page.evaluate(x=>competitiveFixture(x,250),x);await shot('mobile-'+name);}
 await page.evaluate(()=>{const s=RytniMushroomSnake;s.qaActivate('magnet');s.qaActivate('golden');s.qaActivate('drunk');s.hud();s.paint();});await shot('mobile-effect-stack');
 check(await page.locator('.sp-status:visible').count()===3,'existing compact effect cards');
 for(const quality of ['low','balanced','high']){await page.evaluate(q=>{const s=RytniMushroomSnake;s.quality=q;s.fit();s.paint();},quality);check(await page.evaluate(()=>RytniMushroomSnake.engine.length===250),'quality preserves state');}
 await page.setViewportSize({width:393,height:873});await page.waitForFunction(()=>RytniMushroomSnake.state==='pause');const frozen=await page.evaluate(()=>RytniMushroomSnake.engine.digest());await page.waitForTimeout(120);check(await page.evaluate(()=>RytniMushroomSnake.engine.digest())===frozen,'orientation pauses');await page.setViewportSize({width:873,height:393});await action('resume').click();await page.waitForFunction(()=>RytniMushroomSnake.state==='play');await action('pause').click();await action('menu').click();
 check(report.errors.length===0,'console errors: '+report.errors);check(report.http.length===0,'HTTP errors: '+report.http);check(report.failed.length===0,'failed requests: '+report.failed);return report;
}
