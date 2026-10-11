async page=>{
 const ctx=await page.context().browser().newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2}),p=await ctx.newPage();const failures=[],errors=[],rows=[];let checks=0;
 p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?qa=1');await p.waitForFunction(()=>window.snakeProduct?.game);
 await p.evaluate(async()=>{document.querySelector('#cabinet').classList.add('pseudo-fullscreen');await snakeProduct.controller.start('training');});
 const f=p.frames().find(f=>f.url().includes('/product/frame.html'));
 await f.evaluate(()=>window.dispatchEvent(new Event('blur')));await p.waitForTimeout(220);
 const blur=await p.evaluate(()=>({screen:snakeProduct.controller.screen,counts:{...snakePauseDiagnostics.counts}}));checks++;if(blur.screen!=='playing'||Object.keys(blur.counts).length)failures.push({blur});rows.push({blur});
 await p.evaluate(()=>{document.querySelector('#cabinet').classList.remove('pseudo-fullscreen');document.dispatchEvent(new Event('fullscreenchange'));setTimeout(()=>{document.querySelector('#cabinet').classList.add('pseudo-fullscreen');window.dispatchEvent(new Event('resize'));},60);});await p.waitForTimeout(230);
 const transient=await p.evaluate(()=>({screen:snakeProduct.controller.screen,game:snakeProduct.game.status,clock:snakeProduct.game.clock.status,counts:{...snakePauseDiagnostics.counts}}));checks++;if(transient.screen!=='playing'||transient.clock!=='running'||Object.keys(transient.counts).length)failures.push({transient});rows.push({transient});
 await p.evaluate(()=>{document.querySelector('#cabinet').classList.remove('pseudo-fullscreen');document.dispatchEvent(new Event('fullscreenchange'));window.dispatchEvent(new Event('resize'));});await p.waitForFunction(()=>snakeProduct.controller.screen==='mobile-gate');
 const exit=await p.evaluate(()=>({screen:snakeProduct.controller.screen,game:snakeProduct.game.status,clock:snakeProduct.game.clock.status,reason:snakePauseDiagnostics.lastPauseReason,counts:{...snakePauseDiagnostics.counts}}));checks++;if(exit.reason!=='fullscreen-exit'||exit.game!=='paused'||exit.counts['fullscreen-exit']!==1)failures.push({exit});rows.push({exit});
 await ctx.close();return {checks,failures,errors,rows};
}
