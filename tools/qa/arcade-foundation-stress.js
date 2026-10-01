// Reproducible screenshot/compositor stress. Requires the desktop audit fixture
// to have opened Arcade in anonymous preview; never invokes ranked RPCs.
async page=>{
  if(!/^https:\/\/rytni\.live\/testpodari(?:\?|$)/.test(page.url())||!/[?&]arcade_preview=1(?:&|$)/.test(page.url()))throw Error('Anonymous TEST preview only');
  if(!await page.evaluate(()=>!!window.RytniBrowserArcade?.qaRuntime))throw Error('Run arcade-foundation-audit.js first');
  const out='.playwright-cli/foundation-audit',report={captures:[],errors:[],perf:[],lifecycle:[]};
  page.on('pageerror',e=>report.errors.push(e.message));
  const action=n=>page.locator(`[data-ms-action="${n}"]`).filter({visible:true}).last();
  const fly=n=>page.locator(`[data-menu-action="${n}"]`).filter({visible:true}).last();
  await page.setViewportSize({width:1366,height:768});
  if(await page.evaluate(()=>!!RytniArcadeHub.selected))await action('hub').click();
  for(const game of ['fly','snake']){
    await action('game-'+game).click();
    if(game==='fly')await page.evaluate(()=>RytniBrowserArcade.qaReady());else await page.waitForTimeout(500);
    const cdp=await page.context().newCDPSession(page);
    for(const cpu of [1,4]){
      await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpu});
      await (game==='fly'?fly('training'):action('start')).click();
      const samples=[];
      for(let i=0;i<(cpu===1?25:12);i++){
        const alive=await page.evaluate(game=>game==='fly'?RytniBrowserArcade.qaRuntime().running:RytniMushroomSnake.state==='play',game);
        if(!alive){await (game==='fly'?fly('training'):action('start')).click();}
        if(cpu===1&&i===10){await page.locator(game==='fly'?'#arcadeFullscreen':'#msSnake [data-ms-action=fullscreen]').click();await page.waitForFunction(()=>!!document.fullscreenElement);}
        if(cpu===1&&i===20){if(await page.evaluate(()=>!!document.fullscreenElement))await page.evaluate(()=>document.exitFullscreen());await page.setViewportSize({width:1920,height:1080});}
        if(game==='fly'&&i%3===0)await page.keyboard.press('Space');
        await page.waitForTimeout(100);
        const sample=await page.evaluate(game=>game==='fly'?{...RytniBrowserArcade.performance(),...RytniBrowserArcade.qaRuntime()}:{cpuMs:RytniMushroomSnake.cpu,frameMs:RytniMushroomSnake.frameMs,ticks:RytniMushroomSnake.engine.ticks,state:RytniMushroomSnake.state,view:RytniMushroomSnake.view},game);
        samples.push(sample);
        if(cpu===1){const name=`stress-${String(report.captures.length+1).padStart(2,'0')}-${game}.png`;await page.screenshot({path:`${out}/${name}`});report.captures.push({name,game,state:game==='fly'?(sample.running?'playing':'result'):sample.state,time:sample.elapsed??sample.ticks});}
      }
      const costs=samples.map(x=>x.cpuMs).sort((a,b)=>a-b);
      report.perf.push({game,cpu,metric:game==='fly'?'sampled Fly rolling whole-frame CPU':'sampled Snake whole-frame CPU',p50:costs[Math.floor(costs.length*.5)],p95:costs[Math.floor(costs.length*.95)],max:costs.at(-1),samples:samples.length,splitSimulationRender:false});
      if(await page.evaluate(()=>!!document.fullscreenElement))await page.evaluate(()=>document.exitFullscreen());
      await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});await page.setViewportSize({width:1366,height:768});
      // Leaving clears the run even if a screenshot occurred on its death frame.
      await action('hub').click();await page.waitForTimeout(300);
      report.lifecycle.push(await page.evaluate(()=>__RYTNI_ARCADE_DIAG__.snapshot()));
      if(cpu===1){await action('game-'+game).click();if(game==='fly')await page.evaluate(()=>RytniBrowserArcade.qaReady());else await page.waitForTimeout(250);}
    }
    await cdp.detach();
  }
  report.count=report.captures.length;
  await page.evaluate(report=>window.__FOUNDATION_STRESS_REPORT__=report,report);
  return report;
}
