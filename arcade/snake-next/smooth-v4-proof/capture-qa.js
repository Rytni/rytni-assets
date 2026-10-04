async page=>{
 const context=await page.context().browser().newContext({viewport:{width:1366,height:900}}),p=await context.newPage();
 try{
  await p.goto('http://127.0.0.1:8774/arcade/snake-next/smooth-v4-proof/review.html');await p.waitForFunction(()=>window.ribbonProof);
  const outputs=await p.evaluate(()=>ribbonProof.captures());
  for(const [name,data]of Object.entries(outputs)){const wait=p.waitForEvent('download');await p.evaluate(({name,data})=>{const a=document.createElement('a');a.download=name;a.href=data;a.click();},{name,data});await(await wait).saveAs('docs/qa/smooth-v4/'+name);}
  const metrics=await p.evaluate(()=>{
   const rows=[];
   for(const name of ['straight','up','down','U','S','alternating','growth','length30'])for(let phase=0;phase<12;phase++){
    const alpha=phase/11,{r,frame}=ribbonProof.render(name,alpha),{w,h,mask,sweep}=r;
    const sections=[];
    const at=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y);return ix>=0&&iy>=0&&ix<w&&iy<h&&mask[iy*w+ix];};
    for(const part of sweep.parts)for(const t of [.1,.25,.5,.75,.9]){
     const d=part.d0+(part.d1-part.d0)*t;
     if((d-frame.start)*68<24||(sweep.limit-d)*68<61.2)continue;
     let x,y,dx,dy;
     if(part.kind==='line'){x=part.a.x+(part.b.x-part.a.x)*t;y=part.a.y+(part.b.y-part.a.y)*t;const l=Math.hypot(part.b.x-part.a.x,part.b.y-part.a.y);dx=(part.b.x-part.a.x)/l;dy=(part.b.y-part.a.y)/l;}
     else {const a=part.angle+part.delta*t;x=part.cx+part.r*Math.cos(a);y=part.cy+part.r*Math.sin(a);dx=-Math.sin(a)*Math.sign(part.delta);dy=Math.cos(a)*Math.sign(part.delta);}
     if(x<25||x>w-25||y<25||y>h-25)continue;
     let width=0;for(let v=.5;v<60;v++){if(!at(x-dy*v,y+dx*v))break;width++;}for(let v=-.5;v>-60;v--){if(!at(x-dy*v,y+dx*v))break;width++;}
     sections.push({kind:part.kind,d,width,x,y});
    }
    // One final silhouette, including cap + taper; no head/neck seam exists.
    const seen=new Uint8Array(mask.length);let components=0,area=0;
    for(let i=0;i<mask.length;i++)if(mask[i]){area++;if(seen[i])continue;components++;const queue=[i];seen[i]=1;for(let j=0;j<queue.length;j++){const n=queue[j],x=n%w,y=Math.floor(n/w);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=y+dy,k=b*w+a;if(a>=0&&b>=0&&a<w&&b<h&&!seen[k]&&mask[k]){seen[k]=1;queue.push(k);}}}}
    rows.push({name,phase,alpha,components,area,sections});
   }
   const widths=rows.flatMap(r=>r.sections.map(s=>s.width));const failures=rows.filter(r=>r.components!==1||r.sections.some(s=>s.width<35||s.width>38));
   return {frames:rows.length,widthMin:Math.min(...widths),widthMax:Math.max(...widths),failures,rows};
  });
  const wait=p.waitForEvent('download');await p.evaluate(data=>{const a=document.createElement('a');a.download='geometry.json';a.href=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'}));a.click();},metrics);await(await wait).saveAs('docs/qa/smooth-v4/geometry.json');
  return {frames:metrics.frames,widthMin:metrics.widthMin,widthMax:metrics.widthMax,failures:metrics.failures.map(r=>({name:r.name,alpha:r.alpha,components:r.components,sections:r.sections.filter(s=>s.width<35||s.width>38)})).slice(0,10)};
 }finally{await context.close();}
}
