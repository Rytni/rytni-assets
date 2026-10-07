async page=>{
 if(await page.evaluate(()=>!!document.fullscreenElement))await page.evaluate(()=>document.exitFullscreen());
 const ctx=await page.context().browser().newContext({viewport:{width:1366,height:768}}),p=await ctx.newPage();
 try{
  await p.bringToFront();
  await p.goto('https://rytni.live/testpodari?progression_preview=1&ttq_preview=1&arcade_preview=1&snake_premium_v5=1');
  await p.waitForSelector('#rytniProgressionHub',{state:'attached'});
  await p.evaluate(()=>{let e=document.querySelector('#rytniProgressionHub');while(e&&e!==document.body){e.hidden=false;if(getComputedStyle(e).display==='none')e.style.display='block';e=e.parentElement;}});
  await p.locator('[data-progression-tab=arcade]').click();await p.locator('[data-ms-action=game-snake]').click();
  await p.waitForFunction(()=>RytniArcadeHub.snakeScreen==='main');
  const f=p.frames().find(f=>f.url().includes('/snake/product/index.html'));
  const act=key=>f.locator('[data-action='+key+']').first().click();
  await act('fullscreen');await p.waitForFunction(()=>!!document.fullscreenElement);
  const results=[];
  for(let n=0;n<3;n++){
   await act('training');await f.waitForFunction(()=>document.querySelector('#product').dataset.screen==='playing');
   const gf=f.childFrames().find(f=>f.url().includes('/product/frame.html'));
   await gf.evaluate(()=>snakeProductGame.pause());await f.waitForFunction(()=>document.querySelector('#product').dataset.screen==='pause');
   await act('settings');await act('back');
   await gf.evaluate(()=>{const g=snakeProductGame;window.__pauseReasons=[];if(!window.__originalPause){window.__originalPause=g.pause;g.pause=function(...args){__pauseReasons.push({reason:this.clock?.reason,status:this.clock?.status,stack:new Error().stack});return __originalPause.apply(this,args);};}g.commands=[{tick:g.session.tick+1,sequence:200,direction:1}];});
   await act('resume');
   try{await f.waitForFunction(()=>document.querySelector('#product').dataset.screen==='result',{},{timeout:12000});}
   catch(error){return {runtime:f.url(),completedCycles:results,error:error.message,state:await f.evaluate(()=>document.querySelector('#product').dataset.screen),diagnostic:await gf.evaluate(()=>({pauses:__pauseReasons,status:snakeProductGame.status,clockStatus:snakeProductGame.clock?.status,clockReason:snakeProductGame.clock?.reason,focus:document.hasFocus(),hidden:document.hidden}))};}
   results.push(await gf.evaluate(()=>({pauses:__pauseReasons,status:snakeProductGame.status,hash:snakeProductGame.session.hash()})));
   await act('main');
  }
  return {runtime:f.url(),description:'Three real LIVE Training/Pause/Settings/Resume/Result cycles, no screenshots or layout queries during motion',results};
 }finally{if(await p.evaluate(()=>!!document.fullscreenElement).catch(()=>false))await p.evaluate(()=>document.exitFullscreen());await ctx.close();}
}
