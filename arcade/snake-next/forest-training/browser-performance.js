async page=>{
 const options=await page.evaluate(()=>window.forestPerfOptions||{});
 const c=await page.context().browser().newContext({viewport:{width:1366,height:768}}),p=await c.newPage(),cdp=await c.newCDPSession(p);
 await p.goto('http://127.0.0.1:8773/arcade/snake-next/forest-training.html?qa=1');await p.waitForFunction(()=>window.forestTraining);
 const results=[];
 for(const cpu of options.cpus||[1,4]){
   await cdp.send('Emulation.setCPUThrottlingRate',{rate:cpu});
   for(const length of options.lengths||[8,100,250,500,1200]){
     const measurement=await p.evaluate(async length=>{
       const g=forestTraining;g.stop();const {createRules,createArena}=await import('/arcade/snake-next/entry.js'),{Session}=await import('/arcade/snake-next/forest-training/session.js');
       const width=96,height=64,route=[],blocked=[];for(let x=0;x<width;x++)blocked.push(x,(height-1)*width+x);for(let y=1;y<height-1;y++)blocked.push(y*width,y*width+width-1);
       for(let y=2;y<62;y++)for(let col=0;col<92;col++)route.push(y*width+(y%2?93-col:2+col));
       const body=route.slice(0,length).reverse(),head=body[0],neck=body[1],direction=head-neck===1?1:head-neck===-1?3:2;
       const arena=createArena({width,height,blockedCells:blocked,initialBody:body,initialDirection:direction}),rules=createRules({width,height,minFreeCells:1201});
       g.session=new Session({arena,rules});g.session.view={x:Math.max(0,Math.min(68,head%width-14)),y:Math.max(0,Math.min(52,Math.floor(head/width)-6)),cols:28,rows:12};
       g.status='playing';g.show();g.render();
       const values=[];for(let i=0;i<210;i++){await new Promise(requestAnimationFrame);const t=performance.now();g.render();if(i>=30)values.push(performance.now()-t);}
       const sorted=values.slice().sort((a,b)=>a-b),quantile=q=>sorted[Math.floor((sorted.length-1)*q)];
       return {length,p50:quantile(.5),p95:quantile(.95),max:Math.max(...values),spikes:values.map((ms,index)=>({ms,index})).filter(s=>s.ms>4),samples:values.length,memory:g.summary().raster};
     },length);
     results.push({cpu,...measurement});if(cpu===1&&length===1200)await p.screenshot({path:'docs/qa/forest-training/long-snake.png'});
   }
 }
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});await p.evaluate(()=>forestTraining.main());
 const downloadPromise=p.waitForEvent('download');await p.evaluate(data=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='performance.json';a.click();},results);
 await (await downloadPromise).saveAs('docs/qa/forest-training/'+(options.file||'performance.json'));await c.close();return results;
}
