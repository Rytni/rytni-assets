async page=>{
 const dir='docs/qa/smooth-v2-3/',context=await page.context().browser().newContext(),p=await context.newPage();
 try{
 await p.goto('http://127.0.0.1:8773/arcade/snake-next/game-feel-lab.html');await p.waitForFunction(()=>window.tuningLab?.game);
 const result=await p.evaluate(async()=>{
  const base='/arcade/snake-next/forest-training/',{SmoothSprites}=await import(base+'smooth-sprites.js'),{TurnAtlasSprites}=await import(base+'turn-atlas-sprites.js');
  const {tubePath,tubeSample}=await import(base+'tube-path.js'),{master,activeTurn,atlasSample}=await import(base+'turn-atlas.js'),{expand}=await import('/arcade/snake-next/retro-v5/geometry.mjs'),{SnakeMotion}=await import(base+'motion.js');
  const before=new SmoothSprites(tuningLab.game.art),after=new TurnAtlasSprites(tuningLab.game.art),head=after.source('head-0-v0');
  const c=document.createElement('canvas');c.width=c.height=1300;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
  const images={},rows=[],atlasCaptures=[];let baselineAreaWorst=0,baselineChangedWorst=0,headChanged=0,straightChanged=0;
  function paint(s,f){ctx.clearRect(0,0,1300,1300);s.draw(ctx,f,68,0,0);return ctx.getImageData(0,0,1300,1300).data;}
  function crop(f){const out=document.createElement('canvas');out.width=out.height=204;const x=out.getContext('2d');x.fillStyle='#072a23';x.fillRect(0,0,204,204);x.drawImage(c,Math.floor((f.head.x+.5)*68-102),Math.floor((f.head.y+.5)*68-102),204,204,0,0,204,204);return out;}
  function measure(f,pixels){
   const h=f.head,hx=(h.x+.5)*68,hy=(h.y+.5)*68;
   const at=(x,y)=>pixels[(Math.floor(y)*1300+Math.floor(x))*4+3]>0;
   const ownedHead=(x,y)=>{const dx=x-hx,dy=y-hy,u=Math.floor(34+dx*h.dx+dy*h.dy),v=Math.floor(34-dx*h.dy+dy*h.dx);return u>=0&&u<68&&v>=0&&v<68&&head[(v*68+u)*4+3]>0;};
   let gap=0,minSocket=Infinity,maxSocket=0,headMismatch=0,maxRearSpan=0;
   for(let r=32.5;r<34;r++){
    // The attachment interface is the common rear alpha aperture, not
    // the whole horizontal projection of an incoming perpendicular leg.
    const turn=activeTurn(f,tubePath(f));let width=0;
    for(let v=-29.5;v<30;v++){const x=hx-h.dx*r-h.dy*v,y=hy-h.dy*r+h.dx*v;if(!ownedHead(x,y)||!at(x,y))continue;if(!turn){width++;continue;}let current=null;for(const p of tubePath(f)){const q=tubeSample(p,x,y);if(q&&(!current||Math.abs(q.v)<Math.abs(current.v)))current=q;}const q=atlasSample(turn,x,y,current);if(q===undefined?current:q)width++;}
    minSocket=Math.min(minSocket,width);maxSocket=Math.max(maxSocket,width);
   }
   for(let r=34.5;r<36;r++)for(let v=-17.5;v<18;v++)if(!at(hx-h.dx*r-h.dy*v,hy-h.dy*r+h.dx*v))gap++;
   // Projection diagnostic: do NOT restrict the visible posterior
   // span to the head's opaque aperture or skip it when a turn crosses it.
   // This may include the incoming perpendicular arm; report it explicitly
   // rather than silently treating aperture=36 as proof of bounded width.
   for(let r=34.5;r<36;r++){
    let lo=0,hi=0;
    for(let v=.5;v<100;v++){if(!at(hx-h.dx*r-h.dy*v,hy-h.dy*r+h.dx*v))break;hi++;}
    for(let v=-.5;v>-100;v--){if(!at(hx-h.dx*r-h.dy*v,hy-h.dy*r+h.dx*v))break;lo++;}
    maxRearSpan=Math.max(maxRearSpan,lo+hi);
   }
   for(let yy=Math.floor(hy-34);yy<hy+34;yy++)for(let xx=Math.floor(hx-34);xx<hx+34;xx++){
    const dx=xx+.5-hx,dy=yy+.5-hy,u=Math.floor(34+dx*h.dx+dy*h.dy),v=Math.floor(34-dx*h.dy+dy*h.dx);
    if(u<0||u>=68||v<0||v>=68)continue;const k=(v*68+u)*4;if(!head[k+3])continue;
    for(let n=0;n<4;n++)if(pixels[(yy*1300+xx)*4+n]!==head[k+n])headMismatch++;
   }
   const sections=[],path=tubePath(f);
   for(const part of path){if(part.d0>f.start+1.5)break;
    for(const t of [.1,.25,.5,.75,.9]){
     const d=part.d0+(part.d1-part.d0)*t;if(d<f.start+32/68||d>f.start+1.5)continue;
     let x,y,dx,dy;
     if(part.kind==='line'){x=part.a.x+(part.b.x-part.a.x)*t;y=part.a.y+(part.b.y-part.a.y)*t;const l=Math.hypot(part.b.x-part.a.x,part.b.y-part.a.y);dx=(part.b.x-part.a.x)/l;dy=(part.b.y-part.a.y)/l;}
     else {const a=part.angle+part.delta*t;x=part.cx+part.r*Math.cos(a);y=part.cy+part.r*Math.sin(a);dx=-Math.sin(a)*Math.sign(part.delta);dy=Math.cos(a)*Math.sign(part.delta);}
     let occluded=false;for(let v=-17.5;v<18;v++)if(ownedHead(x-dy*v,y+dx*v)){occluded=true;break;}
     if(occluded){sections.push({d,occluded:true});continue;} // head width is deliberately 42, not BODY
     let width=0;for(let v=.5;v<60;v++){if(!at(x-dy*v,y+dx*v))break;width++;}for(let v=-.5;v>-60;v--){if(!at(x-dy*v,y+dx*v))break;width++;}
     sections.push({d,width,x,y,nx:-dy,ny:dx});
    }
   }
   const local=new Uint8Array(204*204*4);let area=0;
   for(let y=0;y<204;y++)for(let x=0;x<204;x++){const at=((Math.floor(hy-102)+y)*1300+Math.floor(hx-102)+x)*4;for(let k=0;k<4;k++)local[(y*204+x)*4+k]=pixels[at+k];if(pixels[at+3])area++;}
   return {gap,minSocket,maxSocket,maxRearSpan,headMismatch,sections,area,local};
  }
  const delta=(a,b)=>{let n=0;if(!a)return 0;for(let i=0;i<a.length;i+=4)if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2]||a[i+3]!==b[i+3])n++;return n;};
  for(const [name,dx,dy,px,py]of [['RIGHT-UP',0,-1,1,0],['RIGHT-DOWN',0,1,1,0],['LEFT-UP',0,-1,-1,0],['LEFT-DOWN',0,1,-1,0],['UP-LEFT',-1,0,0,-1],['UP-RIGHT',1,0,0,-1],['DOWN-LEFT',-1,0,0,1],['DOWN-RIGHT',1,0,0,1]]){
   const route=[{x:8+dx,y:8+dy},...Array.from({length:14},(_,i)=>({x:8-px*i,y:8-py*i}))];
   const strip=document.createElement('canvas');strip.width=204*16;strip.height=228;const sx=strip.getContext('2d');sx.fillStyle='#072a23';sx.fillRect(0,0,strip.width,strip.height);sx.font='12px monospace';
   let previous=null,oldPrevious=null;
   for(let n=0;n<16;n++){
    const alpha=n/15,start=1-alpha,f={route,start,end:start+7,alpha,head:{x:8+dx*alpha,y:8+dy*alpha,dx:n?dx:px,dy:n?dy:py}};
    const old=measure(f,paint(before,f)),m=measure(f,paint(after,f));
    const areaDelta=previous?Math.abs(m.area-previous.area):0,changed=delta(previous?.local,m.local);
    baselineAreaWorst=Math.max(baselineAreaWorst,oldPrevious?Math.abs(old.area-oldPrevious.area):0);baselineChangedWorst=Math.max(baselineChangedWorst,delta(oldPrevious?.local,old.local));
    headChanged+=m.headMismatch;const {local,...measurements}=m;rows.push({name,alpha,...measurements,areaDelta,changed});previous=m;oldPrevious=old;
    if(['RIGHT-UP','RIGHT-DOWN'].includes(name)){const native=crop(f);sx.drawImage(native,204*n,24);sx.fillStyle='#fff0cf';sx.fillText('alpha '+alpha.toFixed(3),204*n+5,17);if(name==='RIGHT-UP')atlasCaptures.push(native);}
   }
   if(['RIGHT-UP','RIGHT-DOWN'].includes(name))images[name+'.png']=strip.toDataURL();
  }
  const u=expand([[8,7],[8,8],[7,8],[7,7],[4,7]]).map(([x,y])=>({x,y}));
  for(let n=0;n<16;n++){const alpha=n/15,start=1-alpha,f={route:u,start,end:start+6,alpha,head:{x:8,y:8-alpha,dx:n?0:1,dy:n?-1:0}};const m=measure(f,paint(after,f)),{local,...measurements}=m;rows.push({name:'tight-U',alpha,...measurements});if(n===5)images['tight-U.png']=crop(f).toDataURL();}
  for(const [name,shape] of [['U',[[8,7],[8,8],[6,8],[6,7],[2,7]]],['S',[[8,7],[8,8],[6,8],[6,10],[2,10]]]]){
   const points=expand(shape).map(([x,y])=>({x,y}));let y=points.at(-1).y;
   while(points.length<253){points.push({x:2,y:++y});for(let x=3;x<=5;x++)points.push({x,y});points.push({x:5,y:++y});for(let x=4;x>=2;x--)points.push({x,y});}
   for(const length of [8,30,250])for(const growth of [false,true]){
    const route=points.slice(0,length),old=growth?route.slice(1):points.slice(1,length+1),state={body:Uint32Array.from(old,p=>p.y*96+p.x),headIndex:0,length:old.length,cadence:14,movePhase:0,status:'playing'},s={state,arena:{width:96,cells:9216},portal:{phase:'armed'},moves:100},m=new SnakeMotion(s);
    state.body=Uint32Array.from(route,p=>p.y*96+p.x);state.length=length;m.capture(s);
    for(const alpha of [.01,.17,.37,.53,.73,.99]){state.movePhase=alpha*14;const f=m.frame(s),q=measure(f,paint(after,f)),{local,...measurements}=q;rows.push({name:name+'-'+length+(growth?'-growth':''),alpha,...measurements});}
   }
  }
  for(let n=0;n<16;n++){const alpha=n/15,start=1-alpha,f={route:Array.from({length:14},(_,i)=>({x:12-i,y:7})),start,end:start+7,alpha,head:{x:11+alpha,y:7,dx:1,dy:0}};const a=paint(before,f),b=paint(after,f);for(let k=0;k<a.length;k++)if(a[k]!==b[k])straightChanged++;}
  const sheet=document.createElement('canvas');sheet.width=4*136;sheet.height=4*156;const ss=sheet.getContext('2d');ss.fillStyle='#132e27';ss.fillRect(0,0,sheet.width,sheet.height);ss.font='12px monospace';
  atlasCaptures.forEach((f,i)=>{ss.drawImage(f,34,34,136,136,(i%4)*136,Math.floor(i/4)*156+20,136,136);ss.fillStyle='#fff0cf';ss.fillText('phase '+i,(i%4)*136+3,Math.floor(i/4)*156+14);});
  images['atlas-native.png']=sheet.toDataURL();window.turnAtlasImages=images;
  const areaLimit=Math.min(1224,baselineAreaWorst+288),changedLimit=baselineChangedWorst+288;
  // maxRearSpan is a projection ALONG the incoming arm, not its thickness.
  // Do not use it as a width assertion. The independent distance-transform
  // contour check is in turn-atlas-width-qa.mjs; both results are required.
  const failures=rows.filter(r=>r.gap||r.minSocket<35||r.maxSocket>37||r.headMismatch||r.sections.some(s=>!s.occluded&&(s.width<35||s.width>37))||r.areaDelta>areaLimit||r.changed>changedLimit);
  return {pass:!failures.length&&!headChanged&&!straightChanged,frames:rows.length,baselineAreaWorst,baselineChangedWorst,areaLimit,changedLimit,worstRearSpan:Math.max(...rows.map(r=>r.maxRearSpan)),worstArea:Math.max(...rows.map(r=>r.areaDelta||0)),worstChanged:Math.max(...rows.map(r=>r.changed||0)),headChanged,straightChanged,failures,rows};
 });
 const save=async(name,data)=>{const wait=p.waitForEvent('download');await p.evaluate(({name,data})=>{const a=document.createElement('a');a.download=name;a.href=data.startsWith('data:')?data:URL.createObjectURL(new Blob([data],{type:'application/json'}));a.click();},{name,data});await(await wait).saveAs(dir+name);};
 await save('targeted.json',JSON.stringify(result));for(const name of ['atlas-native.png','RIGHT-UP.png','RIGHT-DOWN.png','tight-U.png'])await save(name,await p.evaluate(n=>turnAtlasImages[n],name));
 return {...result,rows:undefined,failures:result.failures.map(r=>({name:r.name,alpha:r.alpha,gap:r.gap,minSocket:r.minSocket,maxSocket:r.maxSocket,maxRearSpan:r.maxRearSpan,headMismatch:r.headMismatch,areaDelta:r.areaDelta,sections:r.sections.filter(s=>!s.occluded&&(s.width<35||s.width>37))})).slice(0,8),failedFrames:result.failures.length};
 }finally{await context.close();}
}
