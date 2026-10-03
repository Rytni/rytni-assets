async page=>{
 await page.goto('http://127.0.0.1:8773/arcade/snake-next/game-feel-lab.html');await page.waitForFunction(()=>window.tuningLab?.game);
 await page.evaluate(async()=>{
  const {geometry}=await import('/arcade/snake-next/forest-training/renderer.js');window.stripGeometry=geometry;
  const g=tuningLab.game,tick=g.tick.bind(g);g.tick=()=>{const s=g.session;if(s?.state.movePhase>=s.cadence()-1){const c=s.state.body[s.state.headIndex],x=c%28,y=Math.floor(c/28);if(x===20&&s.state.direction===1)g.command(0);else if(y===4&&s.state.direction===0)g.command(3);else if(x===7&&s.state.direction===3)g.command(2);else if(y===8&&s.state.direction===2)g.command(1);}tick();};window.liveStrips={};
 });
 await page.locator('[data-preset=B]').click();await page.waitForTimeout(300);await page.evaluate(()=>{if(tuningLab.game.status==='paused')tuningLab.game.resume();});
 const result=[];
 for(const [name,moves,zone]of [['growth',2,'tail'],['head-two-turns',8,'head'],['tail-turn',16,'tail']]){
  await page.waitForFunction(moves=>tuningLab.current.moves>=moves,moves,{timeout:15000});
  const samples=[];
  for(let i=0;i<10;i++){
   samples.push(await page.evaluate(zone=>{
    const g=tuningLab.game;g.render();const f=g.motion.frame(g.session,g.renderFraction()),l=stripGeometry(g.renderer.w,g.renderer.h,28,12,false,g.compact),point=f[zone],source=g.renderer.canvas,dpr=g.renderer.dpr,cell=l.cell,c=document.createElement('canvas');
    c.width=Math.round(cell*7);c.height=Math.round(cell*7);const x=c.getContext('2d');x.imageSmoothingEnabled=false;x.drawImage(source,Math.round((l.field.x+(point.x-3)*cell)*dpr),Math.round((l.field.y+(point.y-3)*cell)*dpr),Math.round(cell*7*dpr),Math.round(cell*7*dpr),0,0,c.width,c.height);
    return {image:c.toDataURL(),alpha:f.alpha,tick:g.session.tick,moves:g.session.moves,length:g.session.state.length,foods:g.session.foods,cell,status:g.status};
   },zone));await page.waitForTimeout(100);
  }
  await page.evaluate(async({name,samples})=>{
   const images=await Promise.all(samples.map(async s=>{const image=new Image();image.src=s.image;await image.decode();return image;})),c=document.createElement('canvas');c.width=Math.max(480,images[0].width+24);c.height=(images[0].height+42)*images.length;const x=c.getContext('2d');x.fillStyle='#072a23';x.fillRect(0,0,c.width,c.height);x.font='13px monospace';
   samples.forEach((s,i)=>{const y=i*(images[i].height+42);x.fillStyle='#fff0cf';x.fillText(`${name} · tick ${s.tick} · alpha ${s.alpha.toFixed(3)}`,12,y+17);x.fillText(`length ${s.length} · food ${s.foods} · cell ${s.cell.toFixed(2)}px`,12,y+33);x.drawImage(images[i],12,y+40);});liveStrips[name]=c.toDataURL();
  },{name,samples});
  const pending=page.waitForEvent('download');await page.evaluate(name=>{const a=document.createElement('a');a.href=liveStrips[name];a.download=name+'.png';a.click();},name);await(await pending).saveAs('docs/qa/smooth-v2/live-'+name+'.png');result.push({name,samples:samples.map(({image,...s})=>s)});
 }
 await page.evaluate(()=>tuningLab.game.main());return result.map(r=>({name:r.name,frames:r.samples.length,first:r.samples[0],last:r.samples.at(-1)}));
}
