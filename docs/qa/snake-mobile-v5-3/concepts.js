async page=>{
 const context=await page.context().browser().newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});const p=await context.newPage();
 await p.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?mobile-concept=1&preview=main-ready');await p.waitForFunction(()=>window.snakeProduct?.controller.hub);
 await p.evaluate(()=>{document.querySelector('#cabinet').style.height='100dvh';snakeProduct.controller.emit();});
 const capture=async name=>{await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.offsetWidth).map(i=>i.decode().catch(()=>{})));});await p.screenshot({path:'docs/qa/snake-mobile-v5-3/'+name+'.png',scale:'css'});};
 await capture('main-portrait-concept');await p.locator('.mobile-status').screenshot({path:'docs/qa/snake-mobile-v5-3/status-board-concept.png',scale:'css'});
 for(const [screen,tab,name] of [['settings','sound','settings-sound-portrait'],['settings','game','settings-game-portrait'],['rating','basics','ranking-portrait'],['rules','basics','guide-basics-portrait'],['rules','bonuses','guide-bonuses-portrait'],['rules','hazards','guide-dangers-portrait']]){
  await p.evaluate(([screen,tab])=>{snakeProduct.controller.tab=tab;snakeProduct.controller.show(screen);},[screen,tab]);await capture(name);
 }
 const measurements=await p.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,layout:snakeProduct.controller.layout}));await context.close();return measurements;
}
