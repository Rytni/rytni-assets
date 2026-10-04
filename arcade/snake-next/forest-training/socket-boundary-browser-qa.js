async page=>{
 const dir='docs/qa/smooth-v2-1/',context=await page.context().browser().newContext(),p=await context.newPage();
 await p.goto('http://127.0.0.1:8773/arcade/snake-next/game-feel-lab.html');await p.waitForFunction(()=>window.tuningLab?.game);
 const result=await p.evaluate(async()=>{
  const {SnakeMotion}=await import('/arcade/snake-next/forest-training/motion.js'),{SocketPrototypeSprites:SmoothSprites}=await import('/arcade/snake-next/forest-training/socket-prototype-sprites.js'),{expand}=await import('/arcade/snake-next/retro-v5/geometry.mjs');
  const sprites=new SmoothSprites(tuningLab.game.art),cell=68,W=1300,H=750;
  const routes={straight:[[12,3],[3,3]],headTurn:[[8,2],[8,3],[2,3]],neckTurn:[[9,2],[8,2],[8,3],[2,3]],U:[[5,2],[8,2],[8,3],[5,3]],S:[[12,2],[9,2],[9,4],[6,4],[6,6],[3,6]],growth:[[8,2],[8,3],[2,3]],tailTurn:[[3,2],[3,4],[8,4],[8,2],[7,2]]};
  const results=[],images={};
  for(const [name,points]of Object.entries(routes)){
   const route=expand(points).map(([x,y])=>({x,y})),last=route.at(-1),near=route.at(-2),old=name==='growth'?route.slice(1):[...route.slice(1),{x:2*last.x-near.x,y:2*last.y-near.y}];
   const state={body:Uint32Array.from(old,c=>c.y*64+c.x),headIndex:0,length:old.length,cadence:14,movePhase:0,status:'playing'},s={state,arena:{width:64,cells:4096},portal:{phase:'armed'},moves:100},m=new SnakeMotion(s);
   const capture=r=>{state.body=Uint32Array.from(r,c=>c.y*64+c.x);state.length=r.length;m.capture(s);};capture(route);
   const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
   const frames=[],phases=[.8,.9,.95,1,0,.05,.1,.2];let boundary;
   for(let i=0;i<phases.length;i++){
    if(i===4){const a=route[0],b=route[1],next=[name==='straight'?{x:a.x,y:a.y-1}:name==='headTurn'?{x:a.x-1,y:a.y}:{x:2*a.x-b.x,y:2*a.y-b.y},...route];if(name!=='growth')next.pop();s.moves++;capture(next);}
    state.movePhase=phases[i]*14;const f=m.frame(s);x.clearRect(0,0,W,H);sprites.draw(x,f,cell,0,0);const pixels=x.getImageData(0,0,W,H).data;
    if(i===3)boundary={pixels,frame:f};
    if(i===4){let all=0,head=0,tail=0;for(let n=0;n<W*H;n++){const k=n*4;if(pixels[k]!==boundary.pixels[k]||pixels[k+1]!==boundary.pixels[k+1]||pixels[k+2]!==boundary.pixels[k+2]||pixels[k+3]!==boundary.pixels[k+3]){all++;const px=n%W,py=Math.floor(n/W);if(Math.abs(px-(f.head.x+.5)*cell)<cell*3.5&&Math.abs(py-(f.head.y+.5)*cell)<cell*3.5)head++;if(Math.abs(px-(f.tail.x+.5)*cell)<cell*3.5&&Math.abs(py-(f.tail.y+.5)*cell)<cell*3.5)tail++;}}results.push({name,boundaryChangedPixels:all,headChangedPixels:head,tailChangedPixels:tail});}
    frames.push({image:x.getImageData(0,0,W,H),frame:f,phase:(i<4?'prior ':'next ')+phases[i]});
   }
   for(const zone of ['head','tail']){const out=document.createElement('canvas');out.width=5*cell+20;out.height=frames.length*(3*cell+30);const o=out.getContext('2d');o.fillStyle='#072a23';o.fillRect(0,0,out.width,out.height);o.font='14px monospace';for(let i=0;i<frames.length;i++){x.putImageData(frames[i].image,0,0);const center=boundary.frame[zone],sx=(center.x-2)*cell,sy=(center.y-1)*cell;o.fillStyle='#fff0cf';o.fillText(name+' '+zone+' '+frames[i].phase,10,i*(3*cell+30)+20);o.drawImage(c,sx,sy,5*cell,3*cell,10,i*(3*cell+30)+28,5*cell,3*cell);}images[name+'-'+zone+'.png']=out.toDataURL();}
  }
  sprites.release();window.temporalImages=images;return {results,pass:results.every(r=>r.boundaryChangedPixels===0)};
 });
 const pending=p.waitForEvent('download');await p.evaluate(result=>{const a=document.createElement('a');a.download='temporal.json';a.href=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));a.click();},result);await(await pending).saveAs(dir+(result.pass?'after':'before')+'-temporal.json');await context.close();return result;
}
