async page=>{
 const browser=page.context().browser(),errors=[],network=[],report={cases:[]};
 for(const [w,h,mobile]of [[1920,1080,false],[1366,768,false],[844,390,true]]){
  const c=await browser.newContext({viewport:{width:w,height:h},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?2:1}),p=await c.newPage();
  try{
   p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)network.push(r.status()+' '+r.url());});p.on('requestfailed',r=>network.push(r.url()));
   await p.bringToFront();await p.goto('http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html');await p.waitForFunction(()=>window.tuningLab?.game);
   for(let stage=0;stage<4;stage++){
    await p.locator('[data-stage="'+stage+'"]').click();await p.waitForFunction(stage=>tuningLab.current?.stage.index===stage&&tuningLab.game.status==='playing',stage);
    await p.evaluate(()=>{const g=tuningLab.game;g.pause();g.status='playing';g.show();document.querySelector('#world-awareness').checked=false;g.render();});
    await p.frameLocator('#training').locator('[data-action="fullscreen"]').first().click();await p.waitForFunction(()=>tuningLab.game.root.ownerDocument.fullscreenElement===tuningLab.game.root&&tuningLab.game.renderer.w===tuningLab.game.root.ownerDocument.defaultView.innerWidth);
    const data=await p.evaluate(async()=>{
     const g=tuningLab.game,s=g.session,l=g.renderer.last,{drawEnvironment}=await import('./gate-one/environment.js'),{apertureEdgeGaps}=await import('./effect-playground/aperture-qa.js');
     const aperture=l.cabinetAperture||{x:l.frame.x+57*l.scale,y:l.frame.y+66*l.scale,w:l.frame.w-114*l.scale,h:l.frame.h-132*l.scale};
     const canvas=document.createElement('canvas');canvas.width=l.w;canvas.height=l.h;const x=canvas.getContext('2d'),f=g.motion.frame(s);x.beginPath();x.rect(l.arena.x,l.arena.y,l.arena.w,l.arena.h);x.clip();drawEnvironment(x,s,tuningLab.camera,l,f,false);
     const result=apertureEdgeGaps(x.getImageData(0,0,l.w,l.h),aperture),rasters=[];
     if(l.wallOffsets)for(const dpr of [1.5,2]){const c=document.createElement('canvas');c.width=Math.ceil(l.w*dpr);c.height=Math.ceil(l.h*dpr);const q=c.getContext('2d');q.setTransform(dpr,0,0,dpr,0,0);q.beginPath();q.rect(l.arena.x,l.arena.y,l.arena.w,l.arena.h);q.clip();drawEnvironment(q,s,tuningLab.camera,l,f,false);rasters.push({dpr,...apertureEdgeGaps(q.getImageData(0,0,c.width,c.height),aperture,dpr)});}
     const hash=s.hash();g.render();if(s.hash()!==hash)throw Error('render changed hash');
     return {viewport:[l.w,l.h],world:[s.world.width,s.world.height],body:l.cell*36/68,cell:l.cell,field:l.field,playableGrid:l.playableGrid||null,wallOffsets:l.wallOffsets||null,hash,rasters,...result};
    });report.cases.push(data);
    // Before implementation this records the existing failure, without asserting.
    if(data.wallOffsets&&(!data.pass||data.rasters.some(r=>!r.pass)))throw Error('Aperture gap gate: '+JSON.stringify(data));
    if(data.wallOffsets&&stage===0&&w!==1366){
     await p.frameLocator('#training').locator('#game').screenshot({path:'docs/qa/aperture-zero-gap/'+(mobile?'mobile-clean':'desktop-clean')+'.png',scale:'css'});
     if(!mobile){await p.evaluate(data=>{const g=tuningLab.game,l=g.renderer.last,x=g.renderer.canvas.getContext('2d'),a=data.aperture,b=data.inkBounds;x.save();x.setTransform(g.renderer.dpr,0,0,g.renderer.dpr,0,0);x.lineWidth=2;x.strokeStyle='#ff3a43';x.strokeRect(a.x,a.y,a.w,a.h);x.setLineDash([5,5]);x.strokeStyle='#00eaff';x.strokeRect(b.x,b.y,b.w,b.h);x.setLineDash([]);x.fillStyle='#031a16';x.fillRect(a.x+10,a.y+10,490,28);x.font='16px monospace';x.fillStyle='#ff3a43';x.fillText('RED: cabinet aperture',a.x+18,a.y+30);x.fillStyle='#00eaff';x.fillText('CYAN: visible border ink',a.x+237,a.y+30);x.restore();},data);await p.frameLocator('#training').locator('#game').screenshot({path:'docs/qa/aperture-zero-gap/desktop-diagnostic.png',scale:'css'});}
    }
    await p.evaluate(()=>tuningLab.game.root.ownerDocument.exitFullscreen());await p.waitForFunction(()=>!tuningLab.game.root.ownerDocument.fullscreenElement);
   }
  }finally{await c.close();}
 }
 report.errors=errors;report.network=network;
 const name=report.cases[0].wallOffsets?'after.json':'before.json',d=page.waitForEvent('download');await page.evaluate(({report,name})=>{const a=document.createElement('a');a.download=name;a.href=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));a.click();},{report,name});await(await d).saveAs('docs/qa/aperture-zero-gap/'+name);
 if(errors.length||network.length)throw Error(JSON.stringify({errors,network}));return {file:name,cases:report.cases.map(({viewport,world,gapLeft,gapRight,gapTop,gapBottom})=>({viewport,world,gapLeft,gapRight,gapTop,gapBottom})),errors,network};
}
