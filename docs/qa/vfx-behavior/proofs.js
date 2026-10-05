async page=>{
 const dir='docs/qa/vfx-behavior/',p=await page.context().newPage();
 const save=async(name,data)=>{const download=page.waitForEvent('download');await page.evaluate(({name,data})=>{const a=document.createElement('a');a.href=data;a.download=name;a.click();},{name,data});await(await download).saveAs(dir+name);};
 try{
  await p.setViewportSize({width:1920,height:1080});await p.goto('http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html?art-fixture=desktop-30');await p.waitForFunction(()=>window.tuningLab?.game?.status==='paused');
  await p.locator('[data-vfx-review="rush"]').click();await p.frameLocator('#training').locator('[data-action="fullscreen"]').first().click();await p.waitForFunction(()=>!!tuningLab.game.root.ownerDocument.fullscreenElement);
  const result=await p.evaluate(async()=>{
   const g=tuningLab.game,s=g.session,{effectAssets}=await import('./effect-playground/asset-bank.js'),{rushPositions}=await import('./effect-playground/vfx-presentation.js');await effectAssets.preload();
   s.pickups=[];s.director.next={positive:1e9,negative:1e9,portal:1e9};s.state.food=4*s.arena.width+22;
   document.querySelector('#world-awareness').checked=false;
   // Manually advance CANONICAL ticks, not an alternate route generator. Only
   // the diagnostic rendering fraction is selected below; no gameplay predictor.
   let sequence=0;while(s.moves<9){s.advance([]);g.motion.capture(s);}
   const older=g.motion.frame(s),oldTick=s.tick;
   while(s.moves<10){s.advance(s.state.turnCount?[]:[{direction:2,sequence:++sequence,tick:s.state.tick+1,repeat:false}]);g.motion.capture(s);}
   const newer=g.motion.frame(s),hash=s.hash(),samples=[];
   const phase=(source,alpha)=>{const start=1-alpha,end=start+s.state.length-1,r=source.route,i=Math.floor(start),t=start-i,a=r[i],b=r[i+1];return {...source,start,end,alpha,head:{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,dx:a.x-b.x,dy:a.y-b.y}};};
   const timeline=[[older,.94],[older,.98],[older,1],[newer,0],[newer,.02],[newer,.06]],original=g.motion.frame;
   const strip=document.createElement('canvas');strip.width=6*460;strip.height=260;const ctx=strip.getContext('2d');ctx.imageSmoothingEnabled=false;
   try{
    timeline.forEach(([source,alpha],i)=>{
     const f=phase(source,alpha);g.motion.frame=()=>f;g.render();const l=g.renderer.last,C=l.cell,x=l.field.x+(14)*C,y=l.field.y+(3.5)*C;
     ctx.drawImage(g.renderer.canvas,x*g.renderer.dpr,y*g.renderer.dpr,460*g.renderer.dpr,220*g.renderer.dpr,i*460,36,460,220);
     ctx.fillStyle='#061e18';ctx.fillRect(i*460,0,460,36);ctx.font='16px monospace';ctx.fillStyle='#efdfae';ctx.fillText((i<3?'OLD ':'NEW ')+alpha.toFixed(2),i*460+10,24);
     samples.push({bracket:i<3?'old':'new',alpha,points:rushPositions(f,C)});
    });
   }finally{g.motion.frame=original;g.render();}
   if(s.hash()!==hash)throw Error('Diagnostic render mutation');
   let maxGap=0;for(let i=0;i<6;i++){const a=samples[2].points[i],b=samples[3].points[i];maxGap=Math.max(maxGap,Math.hypot(a.x-b.x,a.y-b.y)*g.renderer.last.cell);}
   return {data:strip.toDataURL(),samples,maxBracketGapCSS:maxGap,oldTick,newTick:s.tick,hash};
  });
  await save('rush-bracket-strip.png',result.data);delete result.data;
  const composites=await p.evaluate(async()=>{
   const data=await(await fetch('/docs/qa/vfx-behavior/browser.json')).json(),roots=data.reports.find(r=>r.mode==='roots'),l=tuningLab.game.renderer.last;
   const image=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src;});
   const out=[];
   for(const [name,which,states]of [['roots-normal-strip.png',0,[[60,'WARNING'],[100,'SPROUT'],[130,'ACTIVE'],[485,'DECAY']]],['roots-blocked-strip.png',1,[[60,'WARNING'],[100,'SPROUT'],[185,'PENDING'],[214,'RETRACT']]]]){
    const cell=roots.initial.warnings[which].cell,x=l.field.x+(cell%112+.5)*l.cell,y=l.field.y+(Math.floor(cell/112)+.5)*l.cell;
    const c=document.createElement('canvas');c.width=4*180;c.height=210;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
    for(let i=0;i<states.length;i++){
     const [tick,label]=states[i],im=await image('/docs/qa/vfx-behavior/roots-'+tick+'.png');ctx.drawImage(im,x-90,y-90,180,180,i*180,30,180,180);
     ctx.fillStyle='#061e18';ctx.fillRect(i*180,0,180,30);ctx.fillStyle='#efdfae';ctx.font='14px monospace';ctx.fillText(label,i*180+10,21);
    }out.push({name,data:c.toDataURL()});
   }return out;
  });
  for(const c of composites)await save(c.name,c.data);
  const download=page.waitForEvent('download');await page.evaluate(data=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='bracket.json';a.click();},result);await(await download).saveAs(dir+'bracket.json');return {maxBracketGapCSS:result.maxBracketGapCSS,hash:result.hash,proofs:3};
 }finally{await p.close();}
}
