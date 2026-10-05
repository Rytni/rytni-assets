async page=>{
 await page.goto('http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html?art-fixture=desktop-50');await page.waitForFunction(()=>window.tuningLab?.game?.status==='paused');
 const report=await page.evaluate(async()=>{
  const {createState}=await import('./simulation/state.js'),{TunnelMotion}=await import('./gate-one/motion.js'),{MOVE_UNIT}=await import('./simulation/timing.js'),{effectAssets}=await import('./effect-playground/asset-bank.js');
  await effectAssets.preload();const g=tuningLab.game,s=g.session,w=s.arena.width,c=(x,y)=>y*w+x;
  // Deterministic DEV witness: approach, actual atomic tunnel, body traversal.
  s.world.obstacles=[];s.world.hazards=[];const {installTopology}=await import('./progressive-run/world.js');installTopology(s);
  const movement={...s.state.movement};s.state=createState({seed:17,rules:s.rules,arena:s.arena,body:Array.from({length:8},(_,i)=>c(18-i,9)),direction:1,food:c(42,6)});s.state.movement=movement;s.state.cadence=s.cadence();
  s.portals=[c(19,9),c(38,9)];s.portal.phase='armed';s.director.windowEnd=100000;s.preparePortals();s.collect('portalPrize',0);g.motion=new TunnelMotion(s);g.status='playing';
  const draws=[],orig=effectAssets.draw,hashes=[],spans=[];
  effectAssets.draw=function(ctx,key,...args){if(this.image(key)&&key.startsWith('vfx.portal'))draws.push(key);return orig.call(this,ctx,key,...args);};
  try{for(let i=0;i<12;i++){
   s.state.movement.progress=MOVE_UNIT-s.state.movement.rate;g.tick();
   const before=s.hash(),fx=JSON.stringify(s.feedback);g.render();if(s.hash()!==before||JSON.stringify(s.feedback)!==fx)throw Error('Tunnel VFX mutated hash');hashes.push(before);
   const f=g.motion.frame(s,.4);if(f.spans)spans.push(f.spans.map(p=>p.route.map(q=>[q.x,q.y])));
  }}finally{effectAssets.draw=orig;g.status='paused';g.render();}
  if(s.portal.transfers!==1||!draws.includes('vfx.portal-body-trail')||!spans.length)throw Error('Missing actual tunnel VFX '+JSON.stringify({transfers:s.portal.transfers,draws,spans:spans.length}));
  const rewards=s.telemetry.events.filter(e=>e.kind==='portal-reward').length;if(rewards!==1)throw Error('Portal reward duplicate/missing');
  return {transfers:s.portal.transfers,rewards,splitFrames:spans.length,draws:[...new Set(draws)],renderHashStable:true,hashes};
 });
 const download=page.waitForEvent('download');await page.evaluate(r=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)],{type:'application/json'}));a.download='portal.json';a.click();},report);await(await download).saveAs('docs/qa/effects-production-art-b/portal.json');return report;
}
