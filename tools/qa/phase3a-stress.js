async page=>{
  const mobile=await page.evaluate(()=>matchMedia('(pointer:coarse)').matches),mode=mobile?'mobile':'desktop';
  const errors=[],warnings=[],failures=[],notFound=[],captures=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text());});
  page.on('requestfailed',r=>failures.push(r.url()));page.on('response',r=>{if(r.status()===404)notFound.push(r.url());});
  await page.setViewportSize(mobile?{width:844,height:390}:{width:1366,height:768});
  await page.goto('http://127.0.0.1:8771/arcade/snake-next/slice.html?qa=1');await page.waitForFunction(()=>!!window.snakeDev?.qa);await page.evaluate(()=>snakeNext.ready);
  if(mobile){await page.locator('[data-screen=main] [data-action=training]').click();await page.locator('[data-screen=prompt] [data-action=continue-landscape]').click();}
  else await page.locator('[data-screen=main] [data-action=training]').click();
  // QA readback uses its own software canvas, never changing the runtime canvas
  // to willReadFrequently or using stress capture timings as performance data.
  await page.evaluate(()=>{window.phase3aProbe=document.createElement('canvas');window.phase3aProbeContext=phase3aProbe.getContext('2d',{willReadFrequently:true});});
  const capture=async(name,wait=160)=>{
    await page.waitForTimeout(wait);
    const evidence=await page.evaluate(()=>{
      const s=snakeDev.summary(),c=snakeDev.canvas,p=phase3aProbe,ctx=phase3aProbeContext;
      if(p.width!==c.width||p.height!==c.height){p.width=c.width;p.height=c.height;}
      ctx.clearRect(0,0,p.width,p.height);ctx.drawImage(c,0,0);const data=ctx.getImageData(0,0,c.width,c.height).data;let holes=0;
      for(let i=3;i<data.length;i+=4)if(data[i]!==255)holes++;
      return {...s,holes};
    });
    if(evidence.holes||evidence.rendererFaults)throw Error('Uninjected render fault/transparent canvas: '+name);
    const path=`.playwright-cli/phase3a/stress/${mode}-${String(captures.length).padStart(2,'0')}-${name}.png`;
    await page.screenshot({path});captures.push({name,path,...evidence});await page.evaluate(captures=>window.phase3aStress={captures},captures);
  };
  const run=async(label,count)=>{const start=await page.evaluate(()=>snakeDev.state.tick);for(let i=0;i<count;i++)await capture(label+'-'+i);if(await page.evaluate(()=>snakeDev.state.tick)<=start)throw Error('Stress did not run real simulation');};
  await page.evaluate(()=>snakeDev.qa.startAutoplay());
  await run('normal',mobile?8:12);
  if(!mobile){await page.locator('[data-action=fullscreen]').click();await run('fullscreen',8);}
  await page.setViewportSize(mobile?{width:915,height:412}:{width:1920,height:1080});await run('resize',mobile?6:4);
  await page.locator('#pause').click();const pausedHash=await page.evaluate(()=>snakeDev.summary().hash);await capture('pause');
  await page.locator('[data-screen=paused] [data-action=settings]').click();await capture('settings');await page.locator('[data-screen=settings] [data-action=back]').first().click();
  if(pausedHash!==await page.evaluate(()=>snakeDev.summary().hash))throw Error('Pause mutated state');await page.locator('[data-screen=paused] [data-action=resume]').first().click();await capture('resume');
  for(const length of mobile?[250]:[250,1200]){await page.evaluate(length=>snakeDev.qa.startLoop(length),length);await run('length-'+length,mobile?6:8);}
  // A real collision in the normal arena, not the synthetic tiny collision fixture.
  await page.evaluate(()=>snakeDev.start());
  await page.waitForFunction(()=>snakeDev.ui==='result',null,{timeout:35000});await capture('natural-result',0);
  await page.screenshot({path:`.playwright-cli/phase3a/review/result-${mode}.png`});
  await page.locator('[data-screen=result] [data-action=main]').click();await page.waitForFunction(()=>snakeNext.mixer.sources.size===0);
  const end=await page.evaluate(()=>snakeDev.summary());if(Object.values(end.resources).some(Boolean))throw Error('Main resource leak');
  const result={mode,count:captures.length,captures,end,errors,warnings,failures,notFound};await page.evaluate(result=>window.phase3aStress=result,result);
  return {...result,captures:captures.map(({name,tick,length,holes,rendererFaults,backing})=>({name,tick,length,holes,rendererFaults,backing}))};
}
