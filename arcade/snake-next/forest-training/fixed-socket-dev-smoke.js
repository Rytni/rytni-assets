async page=>{
 const ctx=await page.context().browser().newContext(),p=await ctx.newPage(),errors=[],results=[];
 p.on('pageerror',e=>errors.push(e.message));
 try{for(const query of ['', '?fixedSocketProof=1']){
  await p.goto('http://127.0.0.1:8773/arcade/snake-next/game-feel-lab.html'+query);
  await p.waitForFunction(()=>window.tuningLab?.game);
  const state=await p.evaluate(()=>({renderer:tuningLab.game.renderer.smoothSprites.constructor.name,label:document.querySelector('#motion-toggle').textContent,warning:document.querySelector('#lab-status').textContent}));
  const expected=query?'FixedSocketSprites':'SmoothSprites';
  if(state.renderer!==expected)throw Error('Wrong DEV renderer '+JSON.stringify(state));
  if(query&&!state.warning.includes('QA FAIL'))throw Error('Missing candidate warning');
  await p.locator('#motion-toggle').click();
  if(await p.locator('#motion-toggle').textContent()!=='GRID SNAP')throw Error('Snap toggle failed');
  await p.locator('#motion-toggle').click();
  if(await p.locator('#motion-toggle').textContent()!==state.label)throw Error('Smooth toggle failed');
  results.push(state);
 }}finally{await ctx.close();}
 if(errors.length)throw Error(errors.join('\n'));return {results,errors};
}
