async page=>{
 const c=await page.context().browser().newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1}),p=await c.newPage();await p.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?preview=main-ready');await p.waitForFunction(()=>window.snakeProduct?.game);
 await p.evaluate(async()=>{document.querySelector('#cabinet').classList.add('pseudo-fullscreen');await snakeProduct.controller.start('training');snakeProduct.game.stop();});
 const f=p.frames().find(f=>f.url().includes('/product/frame.html'));
 await f.evaluate(async()=>{const css=await fetch('./premium-dpad.css').then(r=>r.text());const s=document.createElement('style');s.textContent=css;document.head.append(s);document.querySelector('#pad').classList.add('product-dpad');snakeProductGame.render();});
 await p.screenshot({path:'docs/qa/snake-mobile-v5-3/landscape-gameplay-dpad.png',scale:'css'});
 await c.close();return 'concept-only: fixed 180px object; four 64px independent hit regions';
}
