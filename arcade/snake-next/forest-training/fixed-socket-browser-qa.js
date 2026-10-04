async page=>{
 const dir='docs/qa/smooth-v2-2/',context=await page.context().browser().newContext(),p=await context.newPage();
 await p.goto('http://127.0.0.1:8773/arcade/snake-next/game-feel-lab.html');
 await p.waitForFunction(()=>window.tuningLab?.game);
 const result=await p.evaluate(async()=>{
  const base='/arcade/snake-next/forest-training/';
  const {SmoothSprites}=await import(base+'smooth-sprites.js'),{FixedSocketSprites}=await import(base+'fixed-socket-sprites.js');
  const {fixedPath,pointAt}=await import(base+'fixed-socket.js'),{expand}=await import('/arcade/snake-next/retro-v5/geometry.mjs');
  const before=new SmoothSprites(tuningLab.game.art),after=new FixedSocketSprites(tuningLab.game.art);
  const alphas=[0,.05,.10,.15,.20,.30,.40,.50,.65,.80,.95,1],W=950,H=950,rows=[],images={};
  const c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
  function paint(sprites,f){ctx.clearRect(0,0,W,H);sprites.draw(ctx,f,68,0,0);return ctx.getImageData(0,0,W,H).data;}
  function crop(f){const out=document.createElement('canvas');out.width=out.height=204;const x=out.getContext('2d');x.fillStyle='#072a23';x.fillRect(0,0,204,204);x.drawImage(c,Math.floor((f.head.x+.5)*68-102),Math.floor((f.head.y+.5)*68-102),204,204,0,0,204,204);return out;}
  function measure(f,pixels){
   const h=f.head,hx=(h.x+.5)*68,hy=(h.y+.5)*68;
   const at=(x,y)=>pixels[(Math.floor(y)*W+Math.floor(x))*4+3]>0;
   let missing=0,minSocket=Infinity,maxSocket=0;
   for(let rear=34.5;rear<38;rear++){
    let width=0;for(let v=-28.5;v<29;v++)if(at(hx-h.dx*rear-h.dy*v,hy-h.dy*rear+h.dx*v))width++;
    minSocket=Math.min(minSocket,width);maxSocket=Math.max(maxSocket,width);
    if(rear<36)for(let v=-17.5;v<18;v++)if(!at(hx-h.dx*rear-h.dy*v,hy-h.dy*rear+h.dx*v))missing++;
   }
   const path=fixedPath(f),neck=path.find(p=>p.kind==='fixed-neck'),sections=[];
   if(neck){
    // Measure final silhouette, not just the mathematical radius of one
    // selected primitive. Include every other branch that can inflate it.
    for(const [i,part] of neck.parts.entries()){
     for(const t of [.1,.25,.5,.75,.9]){
      const q=pointAt(part,part.d0+(part.d1-part.d0)*t),{x,y,dx,dy}=q,rear=-(x-hx)*h.dx-(y-hy)*h.dy;
      if(rear<34)continue; // opaque approved head is not a BODY width test
      // Count the connected transverse interval containing the centerline,
      // not a distinct parallel lane beyond an actual transparent interval.
      let negative=0,positive=0;
      for(let v=.5;v<60;v++){if(!at(x-dy*v,y+dx*v))break;positive++;}
      for(let v=-.5;v>-60;v--){if(!at(x-dy*v,y+dx*v))break;negative++;}
      sections.push({piece:i,t,width:positive+negative,x,y,nx:-dy,ny:dx});
     }
    }
   }
   let area=0;for(let y=Math.floor(hy-102);y<hy+102;y++)for(let x=Math.floor(hx-102);x<hx+102;x++)if(at(x,y))area++;
   return {missing,minSocket,maxSocket,sections,area,neck:!!neck};
  }
  for(const [name,dx,dy,px,py]of [['RIGHT-UP',0,-1,1,0],['RIGHT-DOWN',0,1,1,0],['LEFT-UP',0,-1,-1,0],['LEFT-DOWN',0,1,-1,0],['UP-LEFT',-1,0,0,-1],['UP-RIGHT',1,0,0,-1],['DOWN-LEFT',-1,0,0,1],['DOWN-RIGHT',1,0,0,1]]){
   const route=[{x:6+dx,y:6+dy},...Array.from({length:12},(_,i)=>({x:6-px*i,y:6-py*i}))];
   const strip=document.createElement('canvas');strip.width=204*12;strip.height=228;const sx=strip.getContext('2d');sx.fillStyle='#072a23';sx.fillRect(0,0,strip.width,strip.height);sx.font='13px monospace';
   let previous=null;
   for(const [n,alpha]of alphas.entries()){
    const start=1-alpha,f={route,start,end:start+7,alpha,head:{x:6+dx*alpha,y:6+dy*alpha,dx:alpha===0?px:dx,dy:alpha===0?py:dy}};
    const baseline=paint(before,f),old=measure(f,baseline);
    if(name==='RIGHT-UP'&&alpha===.05)images['01-before.png']=crop(f).toDataURL();
    const pixels=paint(after,f),m=measure(f,pixels);
    const delta=previous===null?0:Math.abs(m.area-previous);previous=m.area;
    rows.push({name,alpha,...m,areaDelta:delta,beforeMissing:old.missing});
    if(name==='RIGHT-UP'){
     const native=crop(f);sx.drawImage(native,n*204,24);sx.fillStyle='#fff0cf';sx.fillText('alpha '+alpha,n*204+5,17);
     if(alpha===.05)images['02-after.png']=native.toDataURL();
    }
   }
   if(name==='RIGHT-UP')images['04-turn-strip.png']=strip.toDataURL();
  }
  // Required shape fixture: the second bend sits just one cell away.
  const route=expand([[6,5],[6,6],[5,6],[5,5],[2,5]]).map(([x,y])=>({x,y}));
  let worst=null;
  for(const alpha of alphas){
   const start=1-alpha,f={route,start,end:start+6,alpha,head:{x:6,y:6-alpha,dx:alpha===0?1:0,dy:alpha===0?0:-1}};
   const pixels=paint(after,f),m=measure(f,pixels),maximum=Math.max(m.maxSocket,...m.sections.map(s=>s.width));
   rows.push({name:'tight-U',alpha,...m,maximum});
   if(!worst||maximum>worst.maximum){worst={alpha,maximum,minSocket:m.minSocket,sections:m.sections};const out=crop(f),x=out.getContext('2d'),s=m.sections.find(s=>s.width===maximum);if(s){const ox=Math.floor((f.head.x+.5)*68-102),oy=Math.floor((f.head.y+.5)*68-102);x.strokeStyle='#75dbe5';x.beginPath();x.moveTo(s.x-ox-s.nx*s.width/2,s.y-oy-s.ny*s.width/2);x.lineTo(s.x-ox+s.nx*s.width/2,s.y-oy+s.ny*s.width/2);x.stroke();}x.fillStyle='#fff0cf';x.font='12px monospace';x.fillText('U alpha '+alpha+' / max '+maximum+'px',4,15);images['03-tight-U.png']=out.toDataURL();}
  }
  // Accepted straight must be byte-identical, not merely connected.
  let straightChanged=0;
  for(const alpha of alphas){
   const start=1-alpha,f={route:Array.from({length:12},(_,i)=>({x:9-i,y:5})),start,end:start+7,alpha,head:{x:8+alpha,y:5,dx:1,dy:0}};
   const a=paint(before,f),b=paint(after,f);for(let n=0;n<a.length;n++)if(a[n]!==b[n])straightChanged++;
  }
  const failures=rows.filter(r=>r.missing||r.minSocket<35||r.maxSocket>37||r.areaDelta>=68*36||r.sections.some(s=>s.width<35||s.width>37));
  window.fixedSocketImages=images;
  return {pass:!failures.length&&!straightChanged,straightChanged,rows,failures,worst};
 });
 const save=async(name,data)=>{const wait=p.waitForEvent('download');await p.evaluate(({name,data})=>{const a=document.createElement('a');a.download=name;a.href=data.startsWith('data:')?data:URL.createObjectURL(new Blob([data],{type:'application/json'}));a.click();},{name,data});await(await wait).saveAs(dir+name);};
 await save('targeted.json',JSON.stringify(result,null,2));
 for(const name of ['01-before.png','02-after.png','03-tight-U.png','04-turn-strip.png'])await save(name,await p.evaluate(name=>fixedSocketImages[name],name));
 await context.close();return {pass:result.pass,frames:result.rows.length,straightChanged:result.straightChanged,failedFrames:result.failures.length,worst:{alpha:result.worst.alpha,maximum:result.worst.maximum},firstFailures:result.failures.slice(0,3).map(r=>({name:r.name,alpha:r.alpha,missing:r.missing,minSocket:r.minSocket,maxSocket:r.maxSocket,areaDelta:r.areaDelta,sections:r.sections.filter(s=>s.width<35||s.width>37)}))};
}
