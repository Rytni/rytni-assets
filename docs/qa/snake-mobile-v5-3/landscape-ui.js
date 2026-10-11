async page=>{
 const rows=[],failures=[],errors=[];let checks=0;
 for(const [width,height] of [[844,390],[873,393],[915,412],[800,360]]){
  const c=await page.context().browser().newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:2}),p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?preview=main-ready');await p.waitForFunction(()=>window.snakeProduct?.game);
  await p.evaluate(async()=>{document.querySelector('#cabinet').classList.add('pseudo-fullscreen');await snakeProduct.controller.start('training');snakeProduct.controller.pause();});
  for(const state of ['pause','result-record']){
   if(state==='result-record')await p.evaluate(async()=>{snakeProduct.controller.abandon();await snakeProduct.fixture('result-record');});
   await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('#menu img')].map(e=>e.decode()));});
   await p.waitForFunction(()=>[...document.querySelectorAll('.fantasy-panel,.result-scene,.result-hero,.result-score,.primary-stats>div')].every(e=>Number(getComputedStyle(e).opacity)>=.999));
   await p.screenshot({path:`docs/qa/snake-mobile-v5-3/${width}-${state}-settled.png`,scale:'css'});
   const m=await p.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,width:innerWidth,menuScroll:document.querySelector('#menu').scrollHeight>document.querySelector('#menu').clientHeight,buttons:[...document.querySelectorAll('#menu .actions .btn,#menu .result-actions .btn')].filter(e=>e.offsetWidth).map(e=>({action:e.dataset.action,box:e.getBoundingClientRect().toJSON()})),score:document.querySelector('.result-score')?.getBoundingClientRect().toJSON()}));rows.push({width,height,state,m});checks++;
   if(m.scrollWidth>m.width||m.menuScroll||m.buttons.some(b=>b.box.height<44||b.box.bottom>height+.5||b.box.left<0||b.box.right>width))failures.push({width,state,m});
  }
  await c.close();
 }
 return {checks,failures,errors,rows};
}
