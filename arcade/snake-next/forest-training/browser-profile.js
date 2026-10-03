async page=>{
 const c=await page.context().browser().newContext({viewport:{width:1366,height:768}}),p=await c.newPage(),cdp=await c.newCDPSession(p);
 await p.goto('http://127.0.0.1:8773/arcade/snake-next/forest-training.html?qa=1');await p.waitForFunction(()=>window.forestTraining);
 await p.evaluate(async()=>{
   const g=forestTraining;g.stop();const {createRules,createArena}=await import('/arcade/snake-next/entry.js'),{Session}=await import('/arcade/snake-next/forest-training/session.js');
   const w=96,h=64,route=[],blocked=[];for(let x=0;x<w;x++)blocked.push(x,(h-1)*w+x);for(let y=1;y<h-1;y++)blocked.push(y*w,y*w+w-1);
   for(let y=2;y<62;y++)for(let x=0;x<92;x++)route.push(y*w+(y%2?93-x:2+x));const body=route.slice(0,1200).reverse(),head=body[0],direction=head-body[1]===1?1:head-body[1]===-1?3:2;
   g.session=new Session({arena:createArena({width:w,height:h,blockedCells:blocked,initialBody:body,initialDirection:direction}),rules:createRules({width:w,height:h})});
   g.session.view={x:Math.max(0,Math.min(68,head%w-14)),y:Math.max(0,Math.floor(head/w)-6),cols:28,rows:12};g.status='playing';g.show();g.render();
 });
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});await cdp.send('Profiler.enable');await cdp.send('Profiler.start');
 const metrics=await p.evaluate(async()=>{
   const values=[];for(let i=0;i<240;i++){await new Promise(requestAnimationFrame);const t=performance.now();forestTraining.render();if(i>=30)values.push(performance.now()-t);}
   const sorted=values.slice().sort((a,b)=>a-b);return {p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],max:sorted.at(-1),over16:values.filter(v=>v>16).length};
 });
 const {profile}=await cdp.send('Profiler.stop'),counts=new Map();for(const id of profile.samples||[])counts.set(id,(counts.get(id)||0)+1);
 const functions=profile.nodes.map(n=>({function:n.callFrame.functionName,url:n.callFrame.url,line:n.callFrame.lineNumber+1,samples:counts.get(n.id)||0})).filter(n=>n.samples).sort((a,b)=>b.samples-a.samples).slice(0,18);
 const result={metrics,functions};await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});await p.evaluate(()=>forestTraining.main());
 const downloadPromise=p.waitForEvent('download');await p.evaluate(data=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='profile.json';a.click();},result);
 await (await downloadPromise).saveAs('docs/qa/forest-training/profile.json');await c.close();return result;
}
