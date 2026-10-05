async page=>{
 const context=await page.context().browser().newContext({viewport:{width:844,height:390},deviceScaleFactor:2,hasTouch:true,isMobile:true}),p=await context.newPage();
 try{
  await p.bringToFront();await p.goto('http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html?art-fixture=mobile-30');await p.waitForFunction(()=>window.tuningLab?.game?.status==='paused');
  await p.locator('[data-vfx-review="mist"]').click();await p.frameLocator('#training').locator('[data-action="fullscreen"]').first().click();await p.waitForFunction(()=>!!tuningLab.game.root.ownerDocument.fullscreenElement);
  const report=await p.evaluate(async()=>{
   const g=tuningLab.game,s=g.session,{drawObject}=await import('./forest-training/objects.js'),{effectAssets}=await import('./effect-playground/asset-bank.js'),{nearMistSafety}=await import('./effect-playground/visuals.js');await effectAssets.preload();s.pickups=[];s.feedback=[];s.director.next={positive:1e9,negative:1e9,portal:1e9};
   const compare=()=>{
    g.vfxReviewMode=null;g.render();const base=g.renderer.canvas.getContext('2d').getImageData(0,0,g.renderer.canvas.width,g.renderer.canvas.height);
    g.vfxReviewMode='mist';g.render();const fog=g.renderer.canvas.getContext('2d').getImageData(0,0,g.renderer.canvas.width,g.renderer.canvas.height),f=g.motion.frame(s),l=g.renderer.last,stone=s.world.obstacles[0].cell;
    const mask=document.createElement('canvas');mask.width=base.width;mask.height=base.height;const ctx=mask.getContext('2d');ctx.setTransform(g.renderer.dpr,0,0,g.renderer.dpr,0,0);ctx.imageSmoothingEnabled=false;
    drawObject(ctx,g.art,'stone',l.field.x+(stone%s.arena.width+.5)*l.cell,l.field.y+(Math.floor(stone/s.arena.width)+.5)*l.cell,l.cell);
    const pixels=ctx.getImageData(0,0,mask.width,mask.height).data;let opaque=0,changed=0;
    let maxAlpha=0,maxDelta=0,totalDelta=0;for(let k=0;k<pixels.length;k+=4)maxAlpha=Math.max(maxAlpha,pixels[k+3]);
    for(let k=0;k<pixels.length;k+=4)if(pixels[k+3]>=250){opaque++;const delta=Math.max(Math.abs(base.data[k]-fog.data[k]),Math.abs(base.data[k+1]-fog.data[k+1]),Math.abs(base.data[k+2]-fog.data[k+2]));maxDelta=Math.max(maxDelta,delta);totalDelta+=delta;if(delta)changed++;}
    return {tick:s.tick,near:nearMistSafety(f,stone,s.arena.width),opaque,changed,maxAlpha,maxDelta,meanDelta:totalDelta/opaque,stone,hash:s.hash()};
   };
   const near=compare();if(!near.near||!near.opaque||near.maxDelta>3)throw Error('Nearby solid stone obscured '+JSON.stringify(near));
   while(s.moves<13){s.advance([]);g.motion.capture(s);}g.motion.frozen=null;g.motion.floor=1;g.motion.alpha=1;
   const far=compare();if(far.near||!far.changed)throw Error('Far terrain not obscured '+JSON.stringify(far));
   return {near,far};
  });
  await p.evaluate(()=>tuningLab.game.root.ownerDocument.exitFullscreen());await p.waitForFunction(()=>!tuningLab.game.root.ownerDocument.fullscreenElement);
  await p.locator('[data-art-fixture="mobile-30"]').click();await p.waitForFunction(()=>tuningLab.current.tick===0&&tuningLab.game.status==='paused');
  await p.bringToFront();await p.frameLocator('#training').locator('[data-action="resume"]').click();await p.frameLocator('#training').locator('#pad [data-dir="2"]').tap();
  await p.waitForFunction(()=>tuningLab.current.state.direction===2);await p.evaluate(()=>tuningLab.game.pause());
  const download=page.waitForEvent('download');await page.evaluate(data=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({...data,dpadInput:true},null,2)],{type:'application/json'}));a.download='safety.json';a.click();},report);await(await download).saveAs('docs/qa/vfx-behavior/safety.json');return report;
 }finally{await context.close();}
}
