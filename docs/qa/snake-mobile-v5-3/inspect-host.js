async page=>{
 const rows=[];for(const c of page.context().browser().contexts())for(const p of c.pages())if(p.url().startsWith('https://rytni.live/testpodari')){
  const parent=await p.evaluate(()=>({viewport:[innerWidth,innerHeight],hub:window.RytniArcadeHub?{selected:RytniArcadeHub.selected,screen:RytniArcadeHub.snakeScreen}:null,body:document.body.innerText.slice(-400),fs:!!document.fullscreenElement}));
  const frames=[];for(const f of p.frames())if(f.url().includes('/product/index.html'))frames.push(await f.evaluate(()=>({url:location.href,size:[innerWidth,innerHeight],class:document.querySelector('#cabinet')?.className,screen:document.querySelector('#product')?.dataset.screen,text:document.querySelector('#menu')?.innerText,diagnostics:window.snakePauseDiagnostics?.counts})));
  rows.push({parent,frames});
 }return rows;
}
