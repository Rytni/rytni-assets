async page=>{
 await page.setViewportSize({width:1366,height:768});await page.goto('http://127.0.0.1:8773/arcade/snake-next/retro-review.html?qa=1');await page.locator('#start').click();
 const result=await page.evaluate(async()=>{
  const checks=[],assert=(ok,name)=>{if(!ok)throw Error(name);checks.push(name);};
  assert(retro.audio.ctx.state==='running'&&retro.audio.sources.size>0,'gesture-unlocked Forest audio running');
  await retro.audio.ctx.suspend();retro.audio.stop();retro.audio.music();await new Promise(r=>setTimeout(r,50));assert(retro.audio.ctx.state==='running'&&retro.audio.sources.size===1,'suspended context resumes exactly one loop');
  for(const shape of ['straight','90','U','S'])for(const direction of [0,1,2,3])for(const dpr of [1,1.5,2]){
   retro.start({shape,direction,length:8,benchmark:true});retroQA.freeze();const g=retro,r=g.renderer;r.resize(r.w,r.h,dpr);g.paint(1,true);const t=r.transform,data=r.ctx.getImageData(0,0,g.canvas.width,g.canvas.height),c=g.snapshots.current;
   for(let i=1;i<g.state.length;i++)for(let j=0;j<=20;j++){const a=c[i-1],b=c[i],k=j/20,x=((a%96)*(1-k)+(b%96)*k+.5)*t.s+t.ox,y=(Math.floor(a/96)*(1-k)+Math.floor(b/96)*k+.5)*t.s+t.oy;const at=(Math.floor(y*dpr)*data.width+Math.floor(x*dpr))*4;assert(data.data[at+1]>70,`${shape}/${direction}/DPR${dpr} seam ${i}:${j}`);}
  }
  retro.main();assert(retro.audio.sources.size===0,'main clears audio sources');assert(retro.effects.pool.every(p=>p.life===0),'main clears VFX');assert(!retro.raf&&!retro.timer&&!retro.cleanups.length&&!retro.observer,'main zero lifecycle resources');
  return {centerlinePixelChecks:checks.length-5,dpr:[1,1.5,2],tracks:4,directions:4,audio:'gesture and suspended-context resume; one loop; zero after main',lifecycle:'zero after main'};
 });
 const baseline=await page.evaluate(async()=>{
  const {DevRenderer}=await import('/arcade/snake-next/presentation/renderer.js');retro.rendererFactory=(canvas,capacity)=>new DevRenderer(canvas,capacity);retro.audio.enabled=false;
  // Unmodified renderer has no disposal method; proof owns only its native resources.
  retro.start({length:1200,shape:'parallel',benchmark:true,auto:true});retro.recordPerf=false;await new Promise(resolve=>{const wait=()=>retro.frames>=120?resolve():requestAnimationFrame(wait);wait();});retro.metrics={simulation:[],renderer:[],whole:[]};retro.recordPerf=true;await new Promise(resolve=>{const wait=()=>retro.metrics.renderer.length>=600?resolve():requestAnimationFrame(wait);wait();});
  const sorted=[...retro.metrics.renderer].sort((a,b)=>a-b);return {length:1200,samples:sorted.length,p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.floor(sorted.length*.95)],max:sorted.at(-1),simulationP95:[...retro.metrics.simulation].sort((a,b)=>a-b)[Math.floor(retro.metrics.simulation.length*.95)]};
 });await page.reload();return {result,baseline};
}
