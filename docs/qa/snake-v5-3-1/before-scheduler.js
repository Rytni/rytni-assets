async page=>{
 const c=await page.context().browser().newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2}),p=await c.newPage();
 await p.goto('http://127.0.0.1:8776/giveaway-test/releases/snake-next-b24aac6a1150/snake/product/index.html?qa=1');await p.waitForFunction(()=>window.snakeProduct?.game);await p.locator('[data-action=training]').click();await p.waitForFunction(()=>snakeProduct.controller.screen==='playing');
 const f=p.frames().find(f=>f.url().includes('/product/frame.html'));await f.locator('[data-dir="2"]').tap();
 await f.evaluate(()=>{const at=performance.now();while(performance.now()-at<150){};});await p.waitForFunction(()=>snakeProduct.controller.screen==='pause');
 const result=await p.evaluate(()=>({screen:snakeProduct.controller.screen,reason:snakePauseDiagnostics.lastPauseReason,counts:snakePauseDiagnostics.counts,clockStatus:snakeProduct.game.clock.status,physicalDeviceAttribution:'software witness only; physical cause not yet proven'}));await c.close();return result;
}
