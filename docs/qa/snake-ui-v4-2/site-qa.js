async (page,options={})=>{
 // Reuse the existing real-host interactions, not a replacement product host.
 const source=await(await page.request.get('http://127.0.0.1:8776/docs/qa/snake-ui-v4-1/site-qa.js')).text();
 const run=eval('('+source.replaceAll("docs/qa/snake-ui-v4-1/","docs/qa/snake-ui-v4-2/").replaceAll('snake_ui_v4_1=1','snake_ui_v4_2=1')+')');
 const previousScreenshot=page.screenshot.bind(page);
 page.screenshot=async opts=>{
  if(/(?:mobile-gameplay|gameplay-fullscreen)\.png$/.test(opts?.path||'')){
   const product=page.frames().find(f=>f.url().includes('/snake/product/index.html'));
   const game=product?.childFrames().find(f=>f.url().includes('/product/frame.html'));
   if(!product||!game)throw Error('gameplay frame missing');
   if(!await product.locator('#run-label').evaluate(e=>e.hidden&&getComputedStyle(e).display==='none'))throw Error('normal gameplay label visible');
   if(!await game.evaluate(()=>snakeProductGame.renderer.last.perimeter===false&&snakeProductGame.renderer.canvas.style.clipPath==='none'))throw Error('perimeter or canvas clip regression');
  }
  return previousScreenshot(opts);
 };
 const result=await run(page,options);
 page.screenshot=previousScreenshot;result.checks+=2;
 await page.locator('[data-ms-action=game-snake]').click();await page.waitForFunction(()=>RytniArcadeHub.snakeScreen==='main');
 const f=page.frames().find(f=>f.url().includes('/snake/product/index.html'));
 for(const phase of ['embedded','fullscreen']){
  if(phase==='fullscreen'){await f.locator('[data-action=fullscreen]').first().click();await page.waitForFunction(()=>!!document.fullscreenElement);const size=await page.evaluate(()=>[innerWidth,innerHeight]);await f.waitForFunction(([w,h])=>innerWidth===w&&innerHeight===h,size);}
  await f.locator('[data-action=rules]').click();
  for(const tab of ['basics','bonuses','hazards']){
   await f.locator('[data-tab='+tab+']').click();
   const fit=await f.evaluate(()=>{const safe=document.querySelector('#menu').getBoundingClientRect();return [...document.querySelectorAll('.panel-rules,.manual-book,.panel-rules>.actions,.panel-rules .skin-crest,.panel-rules .panel-close')].every(e=>{const r=e.getBoundingClientRect();return r.left>=safe.left-.5&&r.top>=safe.top-.5&&r.right<=safe.right+.5&&r.bottom<=safe.bottom+.5;});});
   if(!fit)throw Error('real host Guide cropped '+phase+'/'+tab);result.checks++;
   if(tab==='basics')await page.screenshot({path:'docs/qa/snake-ui-v4-2/'+(options.live?'live':'candidate')+'-guide-'+phase+(result.mobile?'-mobile':'')+'.png',scale:'css'});
  }await f.locator('[data-action=back]').first().click();
 }
 await page.evaluate(()=>RytniArcadeHub.leave());return result;
}
