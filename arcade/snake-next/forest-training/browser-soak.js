async page=>{
 const context=await page.context().browser().newContext({viewport:{width:1366,height:768}}),p=await context.newPage();
 const errors=[],warnings=[],failed=[],http=[],requests=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',e=>{if(e.type()==='warning')warnings.push(e.text());});
 p.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()}));p.on('request',r=>requests.push(r.url()));p.on('response',r=>{if(r.status()>=400)http.push({url:r.url(),status:r.status()});});
 await p.goto('http://127.0.0.1:8773/arcade/snake-next/forest-training.html?qa=1');await p.waitForFunction(()=>window.forestTraining);
 await p.locator('[data-action=start]').click();
 await p.evaluate(()=>{forestTraining.renderer.recordPerf=true;});
 const started=Date.now(),result={durationMs:0,foods:0,deaths:0,recoveries:0,transfers:0,maxLength:8,activeTicks:0,frames:[]};
 let lastFoods=0,lastTicks=0,lastTransfers=0,sessionStart=1;
 while(Date.now()-started<600000){
   const info=await p.evaluate(sample=>{
     const game=forestTraining,s=game.session;if(!s)return {status:game.status};
     const a=s.arena,state=s.state,w=a.width,head=state.body[state.headIndex],body=Array.from({length:state.length},(_,i)=>state.body[(state.headIndex+i)%state.body.length]),tail=body.at(-1),occ=new Set(body);
     const neighbour=(c,d)=>{const x=c%w+[0,1,0,-1][d],y=Math.floor(c/w)+[-1,0,1,0][d];return x<0||x>=w||y<0||y>=a.height?-1:y*w+x;};
     const bfs=(target)=>{const queue=[head],seen=new Set([head]),first=new Map();for(let i=0;i<queue.length;i++){const c=queue[i];for(let d=0;d<4;d++){
       if(i===0&&d===(state.direction+2)%4)continue;const n=neighbour(c,d);if(a.blocked(n)||seen.has(n)||occ.has(n)&&n!==tail)continue;
       seen.add(n);first.set(n,c===head?d:first.get(c));if(n===target)return first.get(n);queue.push(n);
     }}return -1;};
     const room=(dir)=>{const next=neighbour(head,dir);if(a.blocked(next)||occ.has(next)&&next!==tail)return -1;
       const busy=new Set(body);if(next!==state.food&&state.growth===0)busy.delete(tail);busy.delete(next);
       const queue=[next],seen=new Set([next]);for(let i=0;i<queue.length;i++)for(let d=0;d<4;d++){const n=neighbour(queue[i],d);if(!a.blocked(n)&&!seen.has(n)&&!busy.has(n)){seen.add(n);queue.push(n);}}return queue.length;};
     let dir=bfs(state.food);if(dir<0||room(dir)<Math.min(state.length+8,a.freeCount-state.length-2))dir=bfs(tail);
     if(dir<0){let best=-1;for(let d=0;d<4;d++)if(d!==(state.direction+2)%4){const n=room(d);if(n>best){best=n;dir=d;}}}
     return {status:game.status,foods:s.foods,tick:s.tick,transfers:s.portal.transfers,length:state.length,dir:state.turnCount?state.direction:dir,current:state.direction,
       recovery:game.clock?.reason||null,metrics:sample?game.renderer.metrics:null};
   },result.frames.length<Math.floor((Date.now()-started)/5000));
   if(info.foods!==undefined){result.foods+=info.foods-lastFoods;lastFoods=info.foods;result.activeTicks+=info.tick-lastTicks;lastTicks=info.tick;
     result.transfers+=info.transfers-lastTransfers;lastTransfers=info.transfers;result.maxLength=Math.max(result.maxLength,info.length);}
   if(info.status==='result'){
     result.deaths++;await p.locator('[data-action=restart]').click();lastFoods=0;lastTicks=0;lastTransfers=0;sessionStart++;
   }else if(info.status==='paused'){
     result.recoveries++;await p.locator('[data-action=resume]').click();
   }else if(info.status==='playing'&&info.dir>=0&&info.dir!==info.current)await p.keyboard.press(['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'][info.dir]);
   if(info.metrics?.length){const sorted=info.metrics.slice().sort((a,b)=>a-b);result.frames.push({samples:sorted.length,p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],max:sorted.at(-1)});}
   await p.waitForTimeout(70);
 }
 result.durationMs=Date.now()-started;result.sessions=sessionStart;result.errors=errors;result.warnings=warnings;result.failed=failed;result.http=http;
 result.duplicatePreload=requests.filter((u,i)=>u.includes('/grib/mushroom-snake-retro-v5/')&&requests.indexOf(u)!==i);
 await p.screenshot({path:'docs/qa/forest-training/soak-last.png'});await p.evaluate(()=>forestTraining.main());result.cleanup=await p.evaluate(()=>forestTraining.summary());
 const downloadPromise=p.waitForEvent('download');await p.evaluate(data=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='soak-results.json';a.click();},result);
 await (await downloadPromise).saveAs('docs/qa/forest-training/soak-results.json');await context.close();
 if(result.foods<50||errors.length||warnings.length||failed.length||http.length||result.duplicatePreload.length)throw Error('Soak acceptance failed; see soak-results.json');
 return {...result,frames:result.frames.length};
}
