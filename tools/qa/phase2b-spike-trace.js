async page=>{
  await page.goto('http://127.0.0.1:8771/arcade/snake-next/dev.html?qa=1');await page.waitForFunction(()=>!!snakeDev.qa);
  const cdp=await page.context().newCDPSession(page),events=[];cdp.on('Tracing.dataCollected',e=>events.push(...e.value));
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  await cdp.send('Tracing.start',{categories:'devtools.timeline,blink.user_timing,v8,disabled-by-default-v8.gc',transferMode:'ReportEvents'});
  const result=await page.evaluate(()=>snakeDev.qa.benchmark(8,true));
  const complete=new Promise(resolve=>cdp.once('Tracing.tracingComplete',resolve));await cdp.send('Tracing.end');await complete;
  await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});await cdp.detach();
  const samples=[];
  for(let i=0;i<100;i++){
    const start=events.find(e=>e.name===`p2b-eat-start-${i}`),end=events.find(e=>e.name===`p2b-eat-end-${i}`);if(!start||!end)continue;
    const gc=events.filter(e=>/GC|Scavenge|MarkCompact/i.test(e.name)&&e.ph==='X'&&e.ts<end.ts&&e.ts+(e.dur||0)>start.ts).map(e=>({name:e.name,ms:(e.dur||0)/1000}));
    if((end.ts-start.ts)/1000>12||gc.length)samples.push({sample:i,wallMs:(end.ts-start.ts)/1000,gc});
  }
  const report={result,samples,traceEvents:events.length,classification:'Only explicit GC intervals are labelled GC; untraced original outlier is not attributed.'};
  await page.evaluate(report=>{snakeDev.main();window.phase2bSpikeTrace=report;},report);return report;
}
