async page => {
 const errors=[],network=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 page.on('requestfailed',r=>network.push({url:r.url(),error:r.failure()?.errorText}));page.on('response',r=>{if(r.status()>=400)network.push({url:r.url(),status:r.status()});});
 await page.goto('http://127.0.0.1:8825/?arcade_preview=1&snake_geometry=1');
 await page.locator('[data-ms-action="game-snake"]').click();await page.locator('[data-ms-action="start"]').click();
 await page.waitForFunction(()=>RytniMushroomSnake.state==='play');
 await page.locator('[data-ms-action="pause"]:visible').click();
 const paused=await page.evaluate(()=>{const s=RytniMushroomSnake;return s.state==='pause'&&!s.raf;});
 if(!paused)throw Error('Pause failed');
 await page.locator('[data-ms-action="resume"]:visible').last().click();
 await page.waitForFunction(()=>RytniMushroomSnake.state==='play');
 await page.locator('[data-ms-action="fullscreen"]:visible').click();
 await page.waitForFunction(()=>!!document.fullscreenElement);
 const samples=[];
 for(const [w,h]of [[1366,768],[1920,1080],[1024,768]]){
  await page.setViewportSize({width:w,height:h});await page.waitForTimeout(250);
  samples.push(await page.evaluate(()=>({view:RytniMushroomSnake.view,fullscreen:document.fullscreenElement?.id,overflow:document.documentElement.scrollWidth>innerWidth})));
 }
 const perf=await page.evaluate(()=>{
  const s=RytniMushroomSnake;s.stop();const result=[];
  for(const length of [100,250,500,1200]){
   s.engine.reset(127,length);s.engine.phase=1;const durations=[];
   for(let i=0;i<120;i++){const start=performance.now();s.paint();durations.push(performance.now()-start);}
   durations.sort((a,b)=>a-b);result.push({length,p95RenderMs:durations[114],simulationChunks:s.engine.world.chunks.size});
  }
  return result;
 });
 await page.screenshot({path:'C:/Users/rytni/.codex/visualizations/snake-reset/geometry-long-1200.png'});
 await page.evaluate(()=>{
  const s=RytniMushroomSnake,e=s.engine;e.reset(127);const p=[[2,0],[1,0],[0,0],[0,1],[0,2],[-1,2],[-2,2],[-3,2],[-4,2]];
  for(let i=0;i<p.length;i++){const j=(e.head-i+e.bx.length)%e.bx.length;e.bx[j]=p[i][0];e.by[j]=p[i][1];}
  e.x=2;e.y=0;e.phase=1;s.paint();
 });
 await page.screenshot({path:'C:/Users/rytni/.codex/visualizations/snake-reset/geometry-corners.png'});
 const context=await page.context().browser().newContext({viewport:{width:915,height:412},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const mobile=await context.newPage();mobile.on('pageerror',e=>errors.push(e.message));mobile.on('requestfailed',r=>network.push({url:r.url(),error:r.failure()?.errorText}));
 await mobile.goto('http://127.0.0.1:8825/?arcade_preview=1&snake_geometry=1');
 await mobile.locator('[data-ms-action="game-snake"]').click();await mobile.locator('[data-ms-action="start"]').click();await mobile.locator('[data-ms-action="enter"]').click();
 await mobile.waitForFunction(()=>RytniMushroomSnake.state==='play');
 await mobile.setViewportSize({width:412,height:915});await mobile.waitForFunction(()=>RytniMushroomSnake.state==='pause');
 const before=await mobile.evaluate(()=>RytniMushroomSnake.engine.digest());
 await mobile.setViewportSize({width:915,height:412});await mobile.waitForTimeout(250);
 if(await mobile.evaluate(()=>RytniMushroomSnake.engine.digest())!==before)throw Error('Resize mutated simulation');
 await mobile.locator('[data-ms-action="resume"]:visible').last().click();await mobile.waitForFunction(()=>RytniMushroomSnake.state==='play');
 await mobile.locator('[data-ms-action="fullscreen"]:visible').click();await mobile.waitForFunction(()=>!document.fullscreenElement&&RytniMushroomSnake.state==='pause');
 await context.close();
 if(errors.length||network.length)throw Error(JSON.stringify({errors,network}));
 return {geometryOnly:true,paused,samples,perf,orientationPause:true,exitPause:true,errors,network};
}
