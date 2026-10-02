async page => {
 const host=page,cpu=Number(await page.evaluate(()=>window.d2PerfCPU||1));const viewport=cpu===4?{width:844,height:390}:{width:1366,height:768};let mobileContext;
 if(cpu===4){mobileContext=await page.context().browser().newContext({viewport,deviceScaleFactor:2,isMobile:true,hasTouch:true});page=await mobileContext.newPage();await page.goto('http://127.0.0.1:8773/arcade/snake-next/d2-review.html?qa=1');}else await page.setViewportSize(viewport);
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpu});
 const records=[];try{
  for(const length of [8,100,250,500,1200]){
   await page.evaluate(async length=>{await d2QA.scene({shape:'parallel',length,speed:4,automatic:true,benchmark:true});d2QA.view({grayscale:false,debug:false,lod:'auto'});},length);
   const cold=await page.evaluate(()=>d2QA.summary().groundPreparation);await page.evaluate(async()=>{for(let i=0;i<120;i++)await new Promise(r=>requestAnimationFrame(r));});
   const metrics=await page.evaluate(()=>d2QA.captureMetrics(600)),summary=await page.evaluate(()=>d2QA.summary());if(summary.length!==length)throw Error('Measured length drift');records.push({viewport,dpr:cpu===4?2:1,length,actualLength:summary.length,cpuRate:cpu,lod:cpu===4?'small':'large',cold,travel:summary.groundPreparation,...metrics});
   await host.evaluate(r=>{window.d2PerfRecords=window.d2PerfRecords||[];window.d2PerfRecords.push(r);},records.at(-1));
  }
 }finally{await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});await cdp.detach();await mobileContext?.close();}return records;
}
