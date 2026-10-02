async page=>{
  const report={errors:[],failed:[],http:[],cases:[]},out='.playwright-cli/phase2b';
  page.on('pageerror',e=>report.errors.push(e.message));page.on('requestfailed',r=>report.failed.push(r.url()));page.on('response',r=>{if(r.status()>=400)report.http.push([r.url(),r.status()]);});
  await page.setViewportSize({width:1366,height:768});
  await page.goto('http://127.0.0.1:8771/arcade/snake-next/dev.html?qa=1');await page.waitForFunction(()=>!!window.snakeDev?.qa);
  await page.getByRole('button',{name:'Start Training'}).click();await page.waitForTimeout(1400);
  const food=await page.evaluate(()=>snakeDev.summary());if(food.score!==100||food.length!==9)throw Error('First food/growth failed');report.food=food;
  await page.getByRole('button',{name:'Pause',exact:true}).click();const paused=await page.evaluate(()=>snakeDev.summary());await page.waitForTimeout(250);
  if((await page.evaluate(()=>snakeDev.summary().hash))!==paused.hash)throw Error('Pause changed state');
  await page.getByRole('button',{name:'Resume',exact:true}).click();await page.waitForTimeout(80);if((await page.evaluate(()=>snakeDev.state.tick))<=paused.tick)throw Error('Resume stalled');
  // Real keyboard events, including repeated held key and two queued turns.
  await page.evaluate(()=>snakeDev.start());await page.keyboard.press('ArrowDown');await page.keyboard.press('KeyA');await page.waitForTimeout(550);
  const input=await page.evaluate(()=>({direction:snakeDev.state.direction,latencies:snakeDev.latencies,log:snakeDev.inputLog}));if(input.direction!==3||input.latencies.length!==2)throw Error('Two queued keyboard turns failed');report.input=input;
  await page.keyboard.down('KeyS');await page.keyboard.down('KeyS');await page.keyboard.down('KeyS');await page.keyboard.up('KeyS');await page.waitForTimeout(300);
  report.repeat=await page.evaluate(()=>({turns:snakeDev.latencies.length,log:snakeDev.inputLog.slice(-3)}));if(report.repeat.turns!==3)throw Error('Held/repeated key duplicated turn');
  await page.evaluate(()=>snakeDev.pause());
  for(const [width,height] of [[1366,768],[1920,1080],[2560,1440],[844,390],[915,412]]){
    const hash=await page.evaluate(()=>snakeDev.summary().hash);await page.setViewportSize({width,height});await page.waitForTimeout(60);
    const result=await page.evaluate(()=>({summary:snakeDev.summary(),rect:(()=>{const r=snakeDev.canvas.getBoundingClientRect();return {width:r.width,height:r.height};})()}));
    if(result.summary.hash!==hash)throw Error('Resize changed simulation');report.cases.push({width,height,...result});await page.screenshot({path:`${out}/viewport-${width}x${height}.png`});
  }
  await page.setViewportSize({width:1366,height:768});await page.getByRole('button',{name:'Fullscreen',exact:true}).click();await page.waitForFunction(()=>!!document.fullscreenElement);
  const before=await page.evaluate(()=>snakeDev.summary());await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.fullscreenElement);
  if((await page.evaluate(()=>snakeDev.summary().hash))!==before.hash)throw Error('Fullscreen Escape changed paused state');report.fullscreen='PASS';
  await page.evaluate(()=>{snakeDev.resume();snakeDev.renderer.injectFault=true;});await page.waitForTimeout(120);
  const fault=await page.evaluate(()=>snakeDev.summary());if(fault.rendererFaults!==1||fault.tick<=before.tick||fault.ui!=='playing')throw Error('Renderer fault not recovered');report.fault=fault;await page.screenshot({path:`${out}/fault-recovered.png`});
  for(const kind of ['self','obstacle']){await page.evaluate(kind=>snakeDev.qa.collision(kind),kind);await page.waitForFunction(()=>snakeDev.ui==='result');const result=await page.evaluate(()=>snakeDev.summary());if(Object.values(result.resources).some(n=>n))throw Error('Resources after death');report.cases.push({kind,...result});await page.screenshot({path:`${out}/result-${kind}.png`});await page.getByRole('button',{name:'Restart',exact:true}).click();await page.waitForTimeout(50);if((await page.evaluate(()=>snakeDev.ui))!=='playing')throw Error('Restart failed');}
  for(let i=0;i<6;i++){await page.evaluate(()=>snakeDev.start());const active=await page.evaluate(()=>snakeDev.summary().resources);if(active.raf!==1||active.timers!==1||active.listeners!==5)throw Error('Duplicate session resources');await page.getByRole('button',{name:'Main',exact:true}).click();if(Object.values(await page.evaluate(()=>snakeDev.summary().resources)).some(n=>n))throw Error('Main leaked resources');}
  // Geometry gallery: every alpha, four turn directions, U/S and growing tail.
  for(const name of ['horizontal','vertical','turn-right','turn-down','turn-left','turn-up','u','s'])for(const alpha of [0,.25,.5,.75,.999]){
    await page.evaluate(({name,alpha})=>snakeDev.qa.fixture(name,alpha),{name,alpha});await page.screenshot({path:`${out}/geometry/${name}-alpha-${alpha}.png`});
  }
  for(const name of ['horizontal','turn-down'])for(const alpha of [0,.25,.5,.75,.999]){await page.evaluate(({name,alpha})=>snakeDev.qa.fixture(name,alpha,8,true),{name,alpha});await page.screenshot({path:`${out}/geometry/growth-${name}-${alpha}.png`});}
  for(const length of [100,250,500,1200])for(const alpha of [0,.25,.5,.75,.999]){await page.evaluate(({length,alpha})=>snakeDev.qa.fixture('horizontal',alpha,length),{length,alpha});await page.screenshot({path:`${out}/geometry/length-${length}-${alpha}.png`});}
  await page.evaluate(()=>snakeDev.main());report.afterLeave=await page.evaluate(()=>snakeDev.summary().resources);
  if(report.errors.length||report.failed.length||report.http.length)throw Error(JSON.stringify(report));
  await page.evaluate(report=>window.phase2bUI=report,report);return report;
}
