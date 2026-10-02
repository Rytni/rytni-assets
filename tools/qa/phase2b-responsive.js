async page=>{
  const rows=[],errors=[],network=[],browser=page.context().browser();
  for(const [width,height] of [[1366,768],[1920,1080],[2560,1440],[844,390],[915,412]])for(const dpr of [1,1.5,2]){
    const mobile=width<1000,context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,isMobile:mobile,hasTouch:mobile}),p=await context.newPage();
    try{
      p.on('pageerror',e=>errors.push(e.message));p.on('requestfailed',r=>network.push(r.url()));p.on('response',r=>{if(r.status()>=400)network.push(r.url()+':'+r.status());});
      await p.goto('http://127.0.0.1:8771/arcade/snake-next/dev.html?qa=1');await p.waitForFunction(()=>!!snakeDev.qa);
      await p.getByRole('button',{name:'Start Training'}).click();await p.waitForTimeout(100);
      const start=await p.evaluate(()=>({summary:snakeDev.summary(),rect:{width:snakeDev.canvas.clientWidth,height:snakeDev.canvas.clientHeight}}));
      if(Math.abs(start.summary.backing.width-start.rect.width*dpr)>1||Math.abs(start.summary.backing.height-start.rect.height*dpr)>1)throw Error('DPR backing mismatch');
      const resizes=start.summary.backing.resizes;await p.waitForTimeout(50);if((await p.evaluate(()=>snakeDev.renderer.resizes))!==resizes)throw Error('Backing resized every frame');
      if(mobile){
        await p.evaluate(()=>snakeDev.start());await p.tap('[data-dir="2"]');await p.tap('[data-dir="3"]');await p.waitForTimeout(530);
        const input=await p.evaluate(()=>({direction:snakeDev.state.direction,latencies:snakeDev.latencies}));if(input.direction!==3||input.latencies.length!==2)throw Error('Rapid D-pad taps lost/duplicated');
        start.input=input;
        const targets=await p.locator('#dpad button').evaluateAll(nodes=>nodes.map(n=>({w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height})));if(targets.some(t=>t.w<44||t.h<44))throw Error('Touch target small');start.targets=targets;
        await p.setViewportSize({width:390,height:844});await p.waitForFunction(()=>snakeDev.ui==='paused');const hash=await p.evaluate(()=>snakeDev.summary().hash);await p.waitForTimeout(50);if((await p.evaluate(()=>snakeDev.summary().hash))!==hash)throw Error('Portrait runs ticks');
        if(width===844&&dpr===2)await p.screenshot({path:'.playwright-cli/phase2b/mobile-portrait-paused.png'});
        await p.setViewportSize({width,height});await p.getByRole('button',{name:'Resume',exact:true}).click();await p.waitForTimeout(70);
        await p.getByRole('button',{name:'Pause',exact:true}).click();await p.getByRole('button',{name:'Resume',exact:true}).click();
      }
      await p.getByRole('button',{name:'Fullscreen',exact:true}).click();await p.waitForFunction(()=>!!document.fullscreenElement);await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.fullscreenElement);
      if((await p.evaluate(()=>snakeDev.ui))!=='playing')throw Error('Fullscreen exit changed state');
      await p.screenshot({path:`.playwright-cli/phase2b/responsive-${width}x${height}-dpr-${dpr}.png`});
      if(mobile){
        await p.setViewportSize({width:390,height:844});await p.waitForFunction(()=>snakeDev.ui==='paused');const tick=await p.evaluate(()=>snakeDev.state.tick);
        await p.getByRole('button',{name:'Restart',exact:true}).click();await p.waitForTimeout(70);
        if((await p.evaluate(()=>snakeDev.ui))!=='main'||(await p.evaluate(()=>snakeDev.state.tick))!==tick)throw Error('Portrait Restart starts simulation');start.portraitRestart='PASS';
        if(width===844&&dpr===2)await p.screenshot({path:'.playwright-cli/phase2b/portrait-restart-after.png'});
      }
      await p.evaluate(()=>snakeDev.main());start.afterLeave=await p.evaluate(()=>snakeDev.summary().resources);if(Object.values(start.afterLeave).some(n=>n))throw Error('Leave resources');rows.push({width,height,dpr,...start});
    }finally{await context.close();}
  }
  if(errors.length||network.length)throw Error(JSON.stringify({errors,network}));await page.evaluate(report=>window.phase2bResponsive=report,{rows,errors,network});return {rows,errors,network};
}
