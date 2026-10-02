async page=>{
  const report=await page.evaluate(()=>{
    const summarize=a=>{const s=[...a].sort((a,b)=>a-b);return {p50:s[Math.floor(s.length*.5)],p95:s[Math.floor(s.length*.95)],max:s.at(-1),samples:s.length};};
    const wallSeconds=(performance.now()-phase2bLongStart)/1000;
    if(wallSeconds<600||snakeDev.state.tick<36000||snakeDev.ui!=='playing'||snakeDev.recoveries||snakeDev.renderer.faults)throw Error('10 minute run failed');
    return {wallSeconds,...snakeDev.summary(),metrics:Object.fromEntries(Object.entries(snakeDev.metrics).map(([k,a])=>[k,summarize(a)]))};
  });
  await page.screenshot({path:'.playwright-cli/phase2b/long-training.png'});
  await page.getByRole('button',{name:'Pause',exact:true}).click();const hash=await page.evaluate(()=>snakeDev.summary().hash);await page.waitForTimeout(200);if((await page.evaluate(()=>snakeDev.summary().hash))!==hash)throw Error('Long pause mutated state');
  await page.setViewportSize({width:1920,height:1080});await page.getByRole('button',{name:'Fullscreen',exact:true}).click();await page.waitForFunction(()=>!!document.fullscreenElement);await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.fullscreenElement);
  if((await page.evaluate(()=>snakeDev.summary().hash))!==hash)throw Error('Long resize/fullscreen changed state');await page.getByRole('button',{name:'Resume',exact:true}).click();await page.waitForTimeout(100);
  await page.evaluate(()=>snakeDev.qa.startLoop(1200));await page.waitForTimeout(2100);const longBody=await page.evaluate(()=>snakeDev.summary());if(longBody.ui!=='playing'||longBody.length!==1200||longBody.tick<120)throw Error('Live 1200 body failed');report.longBody=longBody;
  await page.screenshot({path:'.playwright-cli/phase2b/live-1200.png'});
  await page.getByRole('button',{name:'Pause',exact:true}).click();await page.getByRole('button',{name:'Resume',exact:true}).click();
  for(let i=0;i<3;i++){await page.evaluate(()=>snakeDev.start());await page.keyboard.press('KeyS');await page.keyboard.press('ArrowLeft');await page.waitForTimeout(510);if((await page.evaluate(()=>snakeDev.state.direction))!==3)throw Error('Rapid turns after restart lost');}
  await page.getByRole('button',{name:'Main',exact:true}).click();report.afterLeave=await page.evaluate(()=>snakeDev.summary().resources);if(Object.values(report.afterLeave).some(n=>n))throw Error('Long leave leaked');
  await page.evaluate(report=>window.phase2bLong=report,report);return report;
}
