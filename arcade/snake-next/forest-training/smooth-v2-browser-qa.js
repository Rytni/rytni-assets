async page=>{
 const base='http://127.0.0.1:8773',dir='docs/qa/smooth-v2/',browser=page.context().browser(),errors=[],failed=[];
 let ctx=await browser.newContext({viewport:{width:1366,height:900}}),p=await ctx.newPage();p.setDefaultTimeout(15000);
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('requestfailed',r=>failed.push(r.url()));p.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url());});
 const assert=(x,m)=>{if(!x)throw Error(m);};
 await p.goto(base+'/arcade/snake-next/game-feel-lab.html');await p.waitForFunction(()=>window.tuningLab?.game);
 const geometry=await p.evaluate(async()=>{
  const {SnakeMotion}=await import('/arcade/snake-next/forest-training/motion.js'),{SmoothSprites}=await import('/arcade/snake-next/forest-training/smooth-sprites.js'),{expand}=await import('/arcade/snake-next/retro-v5/geometry.mjs');
  const art=tuningLab.game.art,sprites=new SmoothSprites(art),toCells=route=>route.map(([x,y])=>({x:x+2,y:y+2}));
  const straight=toCells(expand([[9,2],[2,2]])),turn=toCells(expand([[6,2],[6,3],[0,3]])),u=toCells(expand([[3,1],[6,1],[6,2],[3,2]])),s=toCells(expand([[9,1],[6,1],[6,3],[3,3],[3,5],[0,5]]));
  function frame(route,alpha,growth=false,vacatedTail=false){
   const last=route.at(-1),near=route.at(-2),old=growth?route.slice(1):[...route.slice(1),vacatedTail?route[0]:{x:2*last.x-near.x,y:2*last.y-near.y}],state={body:Uint32Array.from(old,c=>c.y*64+c.x),headIndex:0,length:old.length,cadence:14,movePhase:0,status:'playing'},session={state,arena:{width:64,cells:4096},portal:{phase:'armed'},moves:100},m=new SnakeMotion(session);
   state.body=Uint32Array.from(route,c=>c.y*64+c.x);state.length=route.length;m.capture(session);state.movePhase=alpha*14;return m.frame(session);
  }
  function paint(route,alpha,dpr=1,growth=false,cell=68,vacatedTail=false){
   const f=frame(route,alpha,growth,vacatedTail),xs=f.route.map(c=>c.x),ys=f.route.map(c=>c.y),minX=Math.min(...xs),minY=Math.min(...ys),w=(Math.max(...xs)-minX+1)*cell,h=(Math.max(...ys)-minY+1)*cell,c=document.createElement('canvas');c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);const context=c.getContext('2d');context.imageSmoothingEnabled=false;
   const owner=new Uint8Array(c.width*c.height);let overlaps=0;
   // Inspect the raster already computed by V2. Avoid one synchronous GPU
   // readback per bin (the old diagnostic itself could stall other games).
   const measured={canvas:c,drawImage(image,x,y,width,height){const pixels=sprites.framePixels.data,sw=image.width,sh=image.height;for(let py=0;py<height;py++)for(let px=0;px<width;px++){const sx=Math.min(sw-1,Math.floor((px+.5)*sw/width)),sy=Math.min(sh-1,Math.floor((py+.5)*sh/height));if(pixels[(sy*sw+sx)*4+3]){const at=(py+y)*c.width+px+x;if(owner[at])overlaps++;owner[at]=1;}}context.drawImage(image,x,y,width,height);}};
   sprites.draw(measured,f,cell*dpr,-minX*cell*dpr,-minY*cell*dpr);
   const data=context.getImageData(0,0,c.width,c.height).data,seen=new Uint8Array(owner.length),queue=new Uint32Array(owner.length);let components=0;
   for(let i=0;i<owner.length;i++)if(data[i*4+3]&&!seen[i]){components++;let end=1;queue[0]=i;seen[i]=1;for(let at=0;at<end;at++){const n=queue[at],x=n%c.width;for(const k of [x? n-1:-1,x<c.width-1?n+1:-1,n-c.width,n+c.width])if(k>=0&&k<owner.length&&!seen[k]&&data[k*4+3]){seen[k]=1;queue[end++]=k;}}}
   return {canvas:c,components,overlaps,frame:f};
  }
  const tests=[],rotate=route=>route.map(c=>({x:20-c.y,y:c.x}));let a=straight,b=turn;
  const routes={straight,turn,u,s,growthTurn:turn,tailTurn:toCells(expand([[1,2],[1,4],[6,4],[6,2],[5,2]]))};
  for(let r=0;r<4;r++){routes['direction-'+r]=a;routes['corner-'+r]=b;a=rotate(a);b=rotate(b);}
  for(const [name,route]of Object.entries(routes))for(const dpr of [1,1.5,2])for(const alpha of [0,.125,.25,.5,.75,.875,1]){const q=paint(route,alpha,dpr,name==='growthTurn');tests.push({name,dpr,alpha,components:q.components,overlaps:q.overlaps,cardinalHead:Number.isInteger(q.frame.head.x)||Number.isInteger(q.frame.head.y)});}
  const vacated=toCells([[3,2],[3,1],[4,1],[5,1],[5,2],[5,3],[4,3],[3,3]]);
  for(const [name,route]of Object.entries({turn,u,s,tailTurn:routes.tailTurn,vacatedTail:vacated}))for(const cell of [47.06,29.1])for(const dpr of [1,1.5,2])for(const alpha of [.25,.5,.75]){const q=paint(route,alpha,dpr,false,cell,name==='vacatedTail');tests.push({name,cell,dpr,alpha,components:q.components,overlaps:q.overlaps,cardinalHead:Number.isInteger(q.frame.head.x)||Number.isInteger(q.frame.head.y)});}
  const {loopFixture,directionBetween}=await import('/arcade/snake-next/tests/fixtures.js'),{labSession}=await import('/arcade/snake-next/tuning-lab/session.js'),{PRESETS}=await import('/arcade/snake-next/tuning-lab/config.js'),{bodyCell}=await import('/arcade/snake-next/simulation/body.js');
  const long=[];
  for(const length of [8,30,250,1200]){
   const f=loopFixture(length),session=labSession(PRESETS.B,{arena:f.arena,rules:f.rules}),plain=labSession(PRESETS.B,{arena:f.arena,rules:f.rules});session.state=f.state;plain.state=structuredClone(f.state);const m=new SnakeMotion(session),canvas=document.createElement('canvas');canvas.width=900;canvas.height=500;let tailBoundaryMismatches=0,boundaries=0;
   function tailPixels(frame,view){const c=document.createElement('canvas');c.width=c.height=420;const x=c.getContext('2d');x.imageSmoothingEnabled=false;sprites.draw(x,frame,31,0,0,view,{x:0,y:0,w:420,h:420});return x.getImageData(0,0,420,420).data;}
   for(let tick=0;tick<16;tick++){
    let commands=[],oldPixels,view;
    if(session.state.movePhase===session.state.cadence-1){const at=f.path.indexOf(bodyCell(session.state,0)),direction=directionBetween(f.path[at],f.path[(at+1)%f.path.length],96);if(direction!==session.state.direction)commands=[{tick:1,sequence:tick+1,direction}];const frame=m.frame(session,1);view={x:frame.tail.x-6,y:frame.tail.y-6};oldPixels=tailPixels(frame,view);}
    session.advance(commands);plain.advance(commands);m.capture(session);
    if(oldPixels){boundaries++;const pixels=tailPixels(m.frame(session,0),view);for(let i=3;i<pixels.length;i+=4)if(!!pixels[i]!==!!oldPixels[i])tailBoundaryMismatches++;}
    const before=session.hash();sprites.draw(canvas.getContext('2d'),m.frame(session,.5),31,0,0,{x:0,y:0},{x:0,y:0,w:900,h:500});if(session.hash()!==before||before!==plain.hash())throw Error('Long-body renderer changed replay');
   }
   long.push({length,hash:session.hash(),parity:true,boundaries,tailBoundaryMismatches});
  }
  const {createState}=await import('/arcade/snake-next/entry.js'),f=loopFixture(8),tailSession=labSession(PRESETS.B,{arena:f.arena,rules:f.rules});tailSession.state=createState({seed:1,arena:f.arena,rules:f.rules,body:[[16,10],[15,10],[14,10],[13,10],[12,10],[11,10],[11,11],[10,11]].map(([x,y])=>y*96+x),direction:1,food:97});const tm=new SnakeMotion(tailSession),tc=document.createElement('canvas');tc.width=900;tc.height=500;let tailChanges=0,tailBoundaries=0;
  function terminalPixels(frame){const x=tc.getContext('2d');x.clearRect(0,0,900,500);sprites.draw(x,frame,31,0,0,{x:5,y:5},{x:0,y:0,w:900,h:500});return x.getImageData(0,0,900,500).data;}
  for(let tick=0;tick<30;tick++){let before;if(tailSession.state.movePhase===tailSession.state.cadence-1)before=terminalPixels(tm.frame(tailSession,1));tailSession.advance();tm.capture(tailSession);if(before){tailBoundaries++;const after=terminalPixels(tm.frame(tailSession,0));for(let n=3;n<after.length;n+=4)if(!!after[n]!==!!before[n])tailChanges++;}}
  long.push({name:'two consecutive tail bends',length:8,boundaries:tailBoundaries,tailBoundaryMismatches:tailChanges});
  function sheet(items){const rendered=items.map(item=>({...item,q:paint(item.route,item.alpha)})),w=Math.max(...rendered.map(o=>o.q.canvas.width))+24,h=rendered.reduce((v,o)=>v+o.q.canvas.height+50,0),c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#072a23';x.fillRect(0,0,w,h);x.font='16px monospace';let top=0;for(const item of rendered){x.fillStyle='#f3e9c8';x.fillText(item.label+' · alpha '+item.alpha+' · 68px native cell',12,top+22);x.drawImage(item.q.canvas,12,top+34);top+=item.q.canvas.height+50;}return c.toDataURL();}
  window.motionImages={
   'straight-sequence.png':sheet([0,.25,.5,.75,1].map(alpha=>({route:straight,alpha,label:'Straight length 8'}))),
   'turn-sequence.png':sheet([0,.25,.5,.75,1].map(alpha=>({route:turn,alpha,label:'90° turn / head → neck'}))),
   'u-s-close-up.png':sheet([u,s].flatMap((route,i)=>[.25,.5,.75].map(alpha=>({route,alpha,label:i?'S / taper → tail':'Tight U / adjacent lanes'}))))
  };
  return {tests,long,failures:tests.filter(t=>t.components!==1||t.overlaps||!t.cardinalHead)};
 });
 for(const name of ['straight-sequence.png','turn-sequence.png','u-s-close-up.png']){const pending=p.waitForEvent('download');await p.evaluate(name=>{const a=document.createElement('a');a.href=motionImages[name];a.download=name;a.click();},name);await(await pending).saveAs(dir+name);}
 assert(!geometry.failures.length,'Raster connectivity/ownership: '+JSON.stringify(geometry.failures.slice(0,8)));
 assert(geometry.long.every(r=>r.tailBoundaryMismatches===0),'Tail boundary changed silhouette: '+JSON.stringify(geometry.long));
 // Isolate interactive checks from the large raster diagnostic's allocations.
 await ctx.close();ctx=await browser.newContext({viewport:{width:1366,height:900}});p=await ctx.newPage();p.setDefaultTimeout(15000);
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('requestfailed',r=>failed.push(r.url()));p.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url());});
 await p.goto(base+'/arcade/snake-next/game-feel-lab.html');await p.waitForFunction(()=>window.tuningLab?.game);
 await p.locator('[data-preset=B]').click();await p.waitForTimeout(1500);await p.evaluate(()=>{if(tuningLab.game.status==='paused')tuningLab.game.resume();});await p.waitForFunction(()=>tuningLab.current.tick>20);await p.keyboard.press('ArrowDown');await p.keyboard.press('KeyA');await p.waitForFunction(()=>tuningLab.current.state.direction===3);
 await p.keyboard.press('Space');const pause=await p.evaluate(()=>{const l=tuningLab;return {frame:l.game.motion.frame(l.current),hash:l.current.hash()};});await p.waitForTimeout(80);assert(await p.evaluate(pause=>JSON.stringify(tuningLab.game.motion.frame(tuningLab.current))===JSON.stringify(pause.frame)&&tuningLab.current.hash()===pause.hash,pause),'Pause moved');
 await p.keyboard.press('Space');assert(await p.evaluate(a=>tuningLab.game.motion.alpha>=a,pause.frame.alpha),'Resume jumped backwards');
 await p.locator('#motion-toggle').click();assert(await p.evaluate(()=>!tuningLab.game.smooth),'GRID SNAP toggle');await p.locator('#motion-toggle').click();assert(await p.evaluate(()=>tuningLab.game.smooth),'SMOOTH toggle');
 await p.locator('[data-preset=B]').click();const restart=await p.evaluate(()=>({moved:tuningLab.game.motion.snapshots.moved,floor:tuningLab.game.motion.floor,frozen:tuningLab.game.motion.frozen,tick:tuningLab.current.tick,status:tuningLab.game.status,reason:tuningLab.game.clock.reason}));assert(!restart.moved&&restart.floor===0&&restart.frozen===null,'Stale restart motion: '+JSON.stringify(restart));await ctx.close();
 const mobile=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:2}),q=await mobile.newPage();q.on('pageerror',e=>errors.push(e.message));q.on('console',m=>{if(m.type()==='error')errors.push(m.text());});q.on('requestfailed',r=>failed.push(r.url()));q.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url());});await q.goto(base+'/arcade/snake-next/game-feel-lab.html');await q.waitForFunction(()=>window.tuningLab?.game);await q.locator('[data-preset=B]').tap();await q.waitForTimeout(1500);await q.evaluate(()=>{if(tuningLab.game.status==='paused')tuningLab.game.resume();});await q.waitForFunction(()=>tuningLab.current.tick>25);await q.frameLocator('#training').locator('#pad [data-dir="2"]').tap();await q.waitForFunction(()=>tuningLab.current.state.direction===2);await q.locator('#training').scrollIntoViewIfNeeded();await q.locator('#training').screenshot({path:dir+'mobile-gameplay.png',scale:'css'});assert(await q.evaluate(()=>tuningLab.game.smooth&&tuningLab.game.status==='playing'),'Mobile not playing');await mobile.close();
 const result={geometry,desktopInput:true,pauseResume:true,restart:true,toggle:true,mobileDpad:true,errors,failed};const download=page.waitForEvent('download');await page.evaluate(result=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));a.download='motion-results.json';a.click();},result);await(await download).saveAs(dir+'results.json');assert(!errors.length&&!failed.length,'JS/network failures');return {rasterCases:geometry.tests.length,failures:geometry.failures,desktopInput:true,pauseResume:true,restart:true,toggle:true,mobileDpad:true,errors,failed};
}
