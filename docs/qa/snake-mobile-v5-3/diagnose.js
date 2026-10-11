async page => {
 const context=await page.context().browser().newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?qa=1');
 await p.waitForFunction(()=>window.snakeProduct?.game);
 await p.evaluate(async()=>{document.querySelector('#cabinet').classList.add('pseudo-fullscreen');await snakeProduct.controller.start('training');});
 const game=p.frames().find(f=>f.url().includes('/product/frame.html'));
 const initial=await p.evaluate(()=>({screen:snakeProduct.controller.screen,gate:snakeProduct.gate.ready()}));
 await game.locator('[data-dir="2"]').dispatchEvent('pointerdown',{pointerId:1,pointerType:'touch',bubbles:true,cancelable:true});
 const touch=await p.evaluate(()=>({screen:snakeProduct.controller.screen,log:snakePauseDiagnostics.events}));
 await game.evaluate(()=>window.dispatchEvent(new Event('blur')));
 const blur=await p.evaluate(()=>({screen:snakeProduct.controller.screen,log:snakePauseDiagnostics.events}));
 await p.evaluate(()=>{snakeProduct.controller.show('playing');snakeProduct.game.status='playing';document.querySelector('#cabinet').classList.remove('pseudo-fullscreen');window.dispatchEvent(new Event('resize'));});
 const resize=await p.evaluate(()=>({screen:snakeProduct.controller.screen,log:snakePauseDiagnostics.events}));
 await context.close();return {initial,touch,blur,resize,errors,physicalDeviceAttribution:'not proven: no physical trace supplied'};
}
