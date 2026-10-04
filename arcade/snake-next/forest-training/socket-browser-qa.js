async page=>{
 const context=await page.context().browser().newContext(),p=await context.newPage();
 await p.goto('http://127.0.0.1:8773/arcade/snake-next/game-feel-lab.html');await p.waitForFunction(()=>window.tuningLab?.game);
 const result=await p.evaluate(async()=>{
  const {SocketPrototypeSprites:SmoothSprites}=await import('/arcade/snake-next/forest-training/socket-prototype-sprites.js'),{expand}=await import('/arcade/snake-next/retro-v5/geometry.mjs'),{SnakeMotion}=await import('/arcade/snake-next/forest-training/motion.js');
  const sprites=new SmoothSprites(tuningLab.game.art),head=sprites.source('head-0-v0'),columns=[];
  for(let x=0;x<16;x++){const ys=[];for(let y=0;y<68;y++)if(head[(y*68+x)*4+3])ys.push(y);columns.push({x,min:Math.min(...ys),max:Math.max(...ys),width:ys.length});}
  const canvas=document.createElement('canvas');canvas.width=canvas.height=600;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  const results=[],images={};let worst=null;
  for(const [name,forward,oldForward]of [['RIGHT-UP',[0,-1],[1,0]],['RIGHT-DOWN',[0,1],[1,0]],['LEFT-UP',[0,-1],[-1,0]],['LEFT-DOWN',[0,1],[-1,0]],['UP-LEFT',[-1,0],[0,-1]],['UP-RIGHT',[1,0],[0,-1]],['DOWN-LEFT',[-1,0],[0,1]],['DOWN-RIGHT',[1,0],[0,1]]]){
   const [dx,dy]=forward,[px,py]=oldForward,route=[{x:4+dx,y:4+dy},...Array.from({length:10},(_,i)=>({x:4-px*i,y:4-py*i}))];
   const samples=[],strip=document.createElement('canvas');strip.width=9*180;strip.height=208;const stripCtx=strip.getContext('2d');stripCtx.fillStyle='#072a23';stripCtx.fillRect(0,0,strip.width,strip.height);stripCtx.font='13px monospace';
   for(let n=0;n<=100;n++){
    const alpha=n/100,start=1-alpha,head={x:4+dx*alpha,y:4+dy*alpha,dx:alpha===0?px:dx,dy:alpha===0?py:dy},frame={route,start,end:start+7,alpha,head};
    ctx.clearRect(0,0,600,600);sprites.draw(ctx,frame,68,0,0);const rgba=ctx.getImageData(0,0,600,600).data;
    let missing=0,cut=0;const hx=(head.x+.5)*68,hy=(head.y+.5)*68;
    // Entire approved rear cross-section plus two native columns behind it.
    for(let u=-36;u<-34;u++){let count=0;for(let v=-18;v<18;v++){const x=Math.floor(hx+head.dx*(u+.5)-head.dy*(v+.5)),y=Math.floor(hy+head.dy*(u+.5)+head.dx*(v+.5));if(!rgba[(y*600+x)*4+3]){missing++;count++;}}if(count===36)cut++;}
    let area=0;for(let y=Math.max(0,Math.floor(hy-130));y<Math.min(600,hy+130);y++)for(let x=Math.max(0,Math.floor(hx-130));x<Math.min(600,hx+130);x++)if(rgba[(y*600+x)*4+3])area++;
    samples.push({alpha,missing,cut,area});
    if(['RIGHT-UP','RIGHT-DOWN'].includes(name)&&[1,5,10,20,35,50,65,80,100].includes(n)){const i=[1,5,10,20,35,50,65,80,100].indexOf(n);stripCtx.fillStyle='#fff0cf';stripCtx.fillText(name+' alpha '+alpha,180*i+4,20);stripCtx.drawImage(canvas,Math.floor(hx-90),Math.floor(hy-90),180,180,180*i,28,180,180);}
    if(name==='RIGHT-UP'&&n===1){const crop=document.createElement('canvas');crop.width=crop.height=180;const x=crop.getContext('2d');x.fillStyle='#072a23';x.fillRect(0,0,180,180);x.drawImage(canvas,Math.floor(hx-90),Math.floor(hy-90),180,180,0,0,180,180);images['socket-native.png']=crop.toDataURL();}
    if(!worst||missing>worst.missing){worst={name,alpha,missing,cut};const crop=document.createElement('canvas');crop.width=crop.height=180;const x=crop.getContext('2d');x.fillStyle='#072a23';x.fillRect(0,0,180,180);x.drawImage(canvas,Math.floor(hx-90),Math.floor(hy-90),180,180,0,0,180,180);images['worst.png']=crop.toDataURL();}
   }
   if(['RIGHT-UP','RIGHT-DOWN'].includes(name))images[name+'.png']=strip.toDataURL();
   results.push({name,maxMissing:Math.max(...samples.map(s=>s.missing)),maxCut:Math.max(...samples.map(s=>s.cut)),maxAreaStep:Math.max(...samples.slice(2).map((s,i)=>Math.abs(s.area-samples[i+1].area))),samples});
  }
  const special=[],sheet=document.createElement('canvas');sheet.width=4*240;sheet.height=2*260;const sx=sheet.getContext('2d');sx.fillStyle='#072a23';sx.fillRect(0,0,sheet.width,sheet.height);sx.font='13px monospace';
  for(const [name,points]of [['tight-U',[[5,3],[5,4],[4,4],[4,3],[1,3]]],['S',[[5,3],[5,4],[3,4],[3,6],[1,6]]],['growth',[[5,3],[5,4],[1,4]]]]){
   const route=expand(points).map(([x,y])=>({x,y})),last=route.at(-1),near=route.at(-2),old=name==='growth'?route.slice(1):[...route.slice(1),{x:2*last.x-near.x,y:2*last.y-near.y}];
   for(const dpr of [1,1.5,2])for(const cell of [68,24]){
    const state={body:Uint32Array.from(old,c=>c.y*64+c.x),headIndex:0,length:old.length,cadence:14,movePhase:0,status:'playing'},s={state,arena:{width:64,cells:4096},portal:{phase:'armed'},moves:100},m=new SnakeMotion(s);
    state.body=Uint32Array.from(route,c=>c.y*64+c.x);state.length=route.length;m.capture(s);
    const c=document.createElement('canvas');c.width=c.height=Math.ceil(750*dpr);const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.scale(dpr,dpr);
    for(const alpha of [0,.01,.1,.25,.5,.75,.95,1]){
     state.movePhase=alpha*14;const f=m.frame(s);x.clearRect(0,0,750,750);sprites.draw(x,f,cell,0,0);const rgba=x.getImageData(0,0,c.width,c.height).data,scale=cell*dpr/68,h=f.head,hx=(h.x+.5)*cell*dpr,hy=(h.y+.5)*cell*dpr;
     let emptySections=0,minWidth=Infinity,maxWidth=0;
     // Physical pixels in the 36px socket width; one-pixel edge tolerance
     // accommodates rounded cell boundaries at fractional backing scales.
     for(let rear=34*scale+.5;rear<38*scale;rear++){
      let width=0;for(let v=-24*scale+.5;v<24*scale;v++){const px=Math.floor(hx-h.dx*rear-h.dy*v),py=Math.floor(hy-h.dy*rear+h.dx*v);if(rgba[(py*c.width+px)*4+3])width++;}
      if(!width)emptySections++;minWidth=Math.min(minWidth,width);maxWidth=Math.max(maxWidth,width);
     }
     special.push({name,alpha,dpr,cell,emptySections,minWidth,maxWidth,expectedWidth:36*scale});
     if(cell===68&&dpr===1&&name!=='growth'&&[.01,.25,.5,.95].includes(alpha)){const column=[.01,.25,.5,.95].indexOf(alpha),row=name==='S'?1:0;sx.fillStyle='#fff0cf';sx.fillText(name+' alpha '+alpha,240*column+6,260*row+20);sx.drawImage(c,Math.floor(hx-120),Math.floor(hy-120),240,240,240*column,260*row+24,240,240);}
    }
   }
  }
  images['U-S.png']=sheet.toDataURL();window.socketImages=images;
  const failures=special.filter(s=>s.emptySections||s.minWidth<s.expectedWidth-1.6||s.maxWidth>s.expectedWidth+1.6);
  return {columns,worst,results,special,failures,pass:results.every(s=>!s.maxMissing&&!s.maxCut&&s.maxAreaStep<100)&&!failures.length};
 });
 const dir='docs/qa/smooth-v2-1/';
 for(const [name,data]of [['after-socket.json',JSON.stringify(result,null,2)]]){const wait=p.waitForEvent('download');await p.evaluate(({name,data})=>{const a=document.createElement('a');a.download=name;a.href=URL.createObjectURL(new Blob([data],{type:'application/json'}));a.click();},{name,data});await(await wait).saveAs(dir+name);}
 for(const name of ['RIGHT-UP.png','RIGHT-DOWN.png','socket-native.png','U-S.png']){const wait=p.waitForEvent('download');await p.evaluate(name=>{const a=document.createElement('a');a.download=name;a.href=socketImages[name];a.click();},name);await(await wait).saveAs(dir+name);}
 await context.close();return {pass:result.pass,worst:result.worst,turns:result.results.map(({name,maxMissing,maxCut,maxAreaStep})=>({name,maxMissing,maxCut,maxAreaStep})),specialCases:result.special.length,failures:result.failures};
}
