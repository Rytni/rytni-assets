async page=>{
 const p=await page.context().newPage(),results=[];
 try{
  await p.goto('http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html?art-fixture=desktop-30');await p.waitForFunction(()=>window.tuningLab?.game?.status==='paused');
  await p.locator('[data-vfx-review="rush"]').click();
  for(let i=0;i<3;i++){
   results.push(await p.evaluate(async()=>{
    const g=tuningLab.game,s=g.session,{effectAssets}=await import('./effect-playground/asset-bank.js');await effectAssets.preload();const hash=s.hash(),keys=[],orig=effectAssets.draw;
    effectAssets.draw=function(ctx,key,...args){if(key==='vfx.rush-ember'||key==='vfx.rush-thorn')keys.push(key);return orig.call(this,ctx,key,...args);};
    try{g.render();}finally{effectAssets.draw=orig;}if(keys.length!==6||hash!==s.hash())throw Error('Rush mode routing');
    return {mode:document.querySelector('#motion-toggle').textContent,hash,anchors:keys.length};
   }));await p.locator('#motion-toggle').click();
  }
  const download=page.waitForEvent('download');await page.evaluate(data=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='modes.json';a.click();},results);await(await download).saveAs('docs/qa/vfx-behavior/modes.json');return results;
 }finally{await p.close();}
}
