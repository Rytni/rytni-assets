async page=>{
 const results=[];await page.setViewportSize({width:1366,height:768});await page.goto('http://127.0.0.1:8773/arcade/snake-next/retro-review.html?qa=1');const cdp=await page.context().newCDPSession(page);
 try{for(const cpu of [1,4]){await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpu});for(const length of [8,100,250,500,1200]){
  await page.evaluate(length=>{retro.audio.enabled=false;retro.start({length,shape:'parallel',speed:6,auto:true,benchmark:true});},length);
  await page.waitForFunction(()=>retro.frames>=120);await page.evaluate(()=>{retro.metrics={simulation:[],renderer:[],whole:[]};retro.recordPerf=true;});await page.waitForFunction(()=>retro.metrics.renderer.length>=600,null,{timeout:30000});
  results.push(await page.evaluate(({length,cpu})=>{const stats=a=>{const b=[...a].sort((a,b)=>a-b);return {samples:b.length,p50:b[Math.floor(b.length*.5)],p95:b[Math.floor(b.length*.95)],max:b.at(-1)};};const summary=retro.summary();retro.main();if(summary.ui!=='playing'||summary.recoveries||summary.length!==length)throw Error('Benchmark left canonical playing state');return {length,cpu,renderer:stats(retro.metrics.renderer),simulation:stats(retro.metrics.simulation),whole:stats(retro.metrics.whole),summary};},{length,cpu}));
 }}return results;}finally{await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});await cdp.detach();}
}
