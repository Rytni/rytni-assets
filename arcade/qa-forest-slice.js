async page => {
 const errors=[],network=[],out='C:/Users/rytni/.codex/visualizations/snake-reset/';
 const watch=p=>{
  p.on('pageerror',e=>errors.push(e.message));
  p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  p.on('requestfailed',r=>network.push({url:r.url(),error:r.failure()?.errorText}));
  p.on('response',r=>{if(r.status()>=400)network.push({url:r.url(),status:r.status()});});
 };
 const setup=async(p,mobile=false)=>{
  watch(p);await p.goto('http://127.0.0.1:8825/?arcade_preview=1');
  await p.locator('[data-ms-action="game-snake"]').click();
  await p.locator('[data-ms-action="start"]').click();
  if(mobile)await p.locator('[data-ms-action="enter"]').click();
  await p.waitForFunction(()=>RytniMushroomSnake.state==='play');
 };
 const freeze=async p=>p.evaluate(()=>{const s=RytniMushroomSnake;s.stop();s.engine.reset(127);s.engine.phase=1;s.acc=0;s.paint();s.hud();});
 const snapshot=async(p,name)=>{
  await p.screenshot({path:out+name+'.png'});
  return p.evaluate(()=>{
   const s=RytniMushroomSnake,stage=document.getElementById('msStage').getBoundingClientRect(),canvas=s.canvas.getBoundingClientRect(),hud=document.getElementById('msHud').getBoundingClientRect();
   if(canvas.left<=stage.left||canvas.top<=stage.top||canvas.right>=stage.right||canvas.bottom>=stage.bottom)throw Error('Canvas must reserve the frame');
   if(hud.right>stage.right||hud.bottom>stage.bottom)throw Error('HUD overflow');
   return {viewport:[innerWidth,innerHeight],view:s.view,full:s.full(),chunks:s.chunks.size,overflow:document.documentElement.scrollWidth>innerWidth};
  });
 };
 await page.setViewportSize({width:1366,height:768});await setup(page);await freeze(page);
 await page.keyboard.press('ArrowUp');
 if(!await page.evaluate(()=>RytniMushroomSnake.engine.queue.some(q=>q.direction===0)))throw Error('Keyboard direction input failed');
 await freeze(page);
 const desktop=await snapshot(page,'forest-desktop');
 await page.locator('[data-ms-action="pause"]:visible').click();
 if(await page.evaluate(()=>RytniMushroomSnake.state!=='pause'||!!RytniMushroomSnake.raf))throw Error('Pause failed');
 await page.screenshot({path:out+'forest-pause.png'});
 await page.locator('[data-ms-action="resume"]:visible').last().click();await page.waitForFunction(()=>RytniMushroomSnake.state==='play');await freeze(page);
 await page.setViewportSize({width:1920,height:1080});await page.locator('[data-ms-action="fullscreen"]:visible').click();await page.waitForFunction(()=>!!document.fullscreenElement);
 await page.waitForTimeout(250);const fullscreen=await snapshot(page,'forest-fullscreen');
 const perf=await page.evaluate(()=>{
  const s=RytniMushroomSnake,rows=[];s.stop();
  for(const length of [100,250,500,1200]){
   s.engine.reset(127,length);s.engine.phase=1;s.paint();const times=[];
   for(let i=0;i<120;i++){const t=performance.now();s.paint();times.push(performance.now()-t);}
   times.sort((a,b)=>a-b);rows.push({length,p95RenderMs:times[114],renderChunks:s.chunks.size,simulationChunks:s.engine.world.chunks.size});
  }s.hud();return rows;
 });
 await page.screenshot({path:out+'forest-long-1200.png'});
 for(const [w,h]of [[1024,768],[1366,768]]){await page.setViewportSize({width:w,height:h});await page.waitForTimeout(150);}
 const context=await page.context().browser().newContext({viewport:{width:915,height:412},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 let mobile,orientation,exitPause;
 try{
  const p=await context.newPage();await setup(p,true);await freeze(p);
  await p.locator('#msDpad [data-dir="0"]').tap();
  if(!await p.evaluate(()=>RytniMushroomSnake.engine.queue.some(q=>q.direction===0)))throw Error('D-pad input failed');
  await freeze(p);mobile=await snapshot(p,'forest-mobile');
  const digest=await p.evaluate(()=>RytniMushroomSnake.engine.digest());
  await p.setViewportSize({width:412,height:915});await p.waitForFunction(()=>RytniMushroomSnake.state==='pause');
  await p.screenshot({path:out+'forest-portrait-pause.png'});
  await p.setViewportSize({width:915,height:412});await p.waitForTimeout(150);
  orientation=await p.evaluate(()=>RytniMushroomSnake.engine.digest())===digest;if(!orientation)throw Error('Orientation changed physics');
  await p.locator('[data-ms-action="resume"]:visible').last().click();await p.waitForFunction(()=>RytniMushroomSnake.state==='play');
  await p.locator('[data-ms-action="fullscreen"]:visible').click();await p.waitForFunction(()=>!document.fullscreenElement&&RytniMushroomSnake.state==='pause');exitPause=true;
 }finally{await context.close();}
 if(errors.length||network.length)throw Error(JSON.stringify({errors,network}));
 return {desktop,fullscreen,mobile,orientation,exitPause,perf,errors,network};
}
