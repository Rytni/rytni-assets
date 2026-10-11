async page=>{
 const failures=[],errors=[],rows=[];let checks=0;
 for(const [width,height] of [[720,405],[1366,768],[1920,1080]]){
  const ctx=await page.context().browser().newContext({viewport:{width,height}}),p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
  const screenshots={};
  for(const [tag,base] of [['before','giveaway-test/releases/snake-next-4542e6f6ae7d/snake/product'],['after','arcade/snake-next/product']]){
   await p.goto(`http://127.0.0.1:8776/${base}/index.html?preview=main-ready`);await p.waitForFunction(()=>window.snakeProduct?.controller.hub);
   await p.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});
   if(width>720)await p.evaluate(()=>document.querySelector('#cabinet').classList.add('pseudo-fullscreen'));
   for(const [screen,tab] of [['main','basics'],['settings','sound'],['rating','basics'],['rules','basics']]){
    await p.evaluate(([screen,tab])=>{snakeProduct.controller.tab=tab;snakeProduct.controller.show(screen);},[screen,tab]);
    await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('#menu img')].map(e=>e.decode()));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});await p.waitForTimeout(250);
    screenshots[tag+'-'+screen]=await p.screenshot({path:`docs/qa/snake-mobile-v5-3/desktop-${width}-${tag}-${screen}.png`,scale:'css',animations:'disabled'});
   }
  }
  for(const screen of ['main','settings','rating','rules']){const same=screenshots['before-'+screen].equals(screenshots['after-'+screen]);rows.push({width,height,screen,byteIdentical:same});checks++;if(!same)failures.push({width,screen,reason:'desktop raster changed'});}
  await ctx.close();
 }
 return {checks,failures,errors,rows};
}
