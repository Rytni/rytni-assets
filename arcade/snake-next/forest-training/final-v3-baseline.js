async page=>{
 const browser=page.context().browser(),result=[];
 for(const [width,height,touch] of [[1920,1080,false],[1366,768,false],[844,390,true]]){
  const ctx=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,deviceScaleFactor:1}),p=await ctx.newPage();
  await p.goto('http://127.0.0.1:8773/arcade/snake-next/forest-training.html?qa=1');await p.waitForFunction(()=>window.forestTraining);
  if(!await p.evaluate(()=>forestTraining.renderer.art.board[0].src.includes('forest-cabinet-v2/')))throw Error('Baseline capture requires unmodified 31efcd4 V2; do not overwrite baseline with V3');
  await p.evaluate(touch=>{const g=forestTraining;g.touch=touch;g.start();g.stop();g.status='playing';g.show();g.render();},touch);
  await p.waitForFunction(()=>{const g=forestTraining,r=g.root.getBoundingClientRect();return Math.abs(g.renderer.w-r.width)<1&&Math.abs(g.renderer.h-r.height)<1;});
  result.push(await p.evaluate(()=>({viewport:[innerWidth,innerHeight],layout:forestTraining.renderer.last,boxes:[...document.querySelectorAll('#game,#hud,#hud .stat,#effects,#hud button,#pad,#pad button')].map(n=>({id:n.id||n.dataset.action||n.dataset.dir||n.className,box:n.getBoundingClientRect().toJSON()}))})));
  await ctx.close();
 }
 const pending=page.waitForEvent('download');await page.evaluate(result=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));a.download='baseline.json';a.click();},result);
 await(await pending).saveAs('docs/qa/forest-final-v3/baseline.json');return result.map(r=>({viewport:r.viewport,boxes:r.boxes}));
}
