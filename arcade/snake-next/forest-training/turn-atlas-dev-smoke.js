async page=>{
 const ctx=await page.context().browser().newContext(),p=await ctx.newPage(),errors=[],failed=[],results=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('requestfailed',r=>failed.push(r.url()));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 try{
  await p.goto('http://127.0.0.1:8773/arcade/snake-next/game-feel-lab.html?turnAtlas=1');
  try{await p.waitForFunction(()=>window.tuningLab?.game,{},{timeout:10000});}catch(e){return {ready:false,errors,failed,status:await p.locator('#lab-status').textContent()};}
  for(const label of ['SMOOTH V2.3','SMOOTH V2','GRID SNAP','SMOOTH V2.3']){
   const state=await p.evaluate(()=>({renderer:tuningLab.game.renderer.smoothSprites.constructor.name,label:document.querySelector('#motion-toggle').textContent,smooth:tuningLab.game.smooth}));
   if(state.label!==label)throw Error('Mode label mismatch '+JSON.stringify(state));results.push(state);
   if(results.length<4)await p.locator('#motion-toggle').click();
  }
  if(errors.length||failed.length)throw Error(JSON.stringify({errors,failed}));return {ready:true,results,errors,failed};
 }finally{await ctx.close();}
}
