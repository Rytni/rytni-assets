// Focused real clicks, canonical death/result, share/fullscreen and native mobile menu.
async page=>{
 const browser=page.context().browser(),context=await browser.newContext({viewport:{width:1440,height:1000}}),p=await context.newPage(),checks=[],errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 const verify=(ok,name)=>{if(!ok)throw Error(name);checks.push(name);};
 const url='http://127.0.0.1:8775/arcade/snake-next/product/index.html?qa=1';
 await p.goto(url);await p.waitForFunction(()=>window.snakeProduct);
 await p.locator('[data-action="fullscreen"]').click();verify(await p.evaluate(()=>!!document.fullscreenElement),'desktop fullscreen');await p.evaluate(()=>document.exitFullscreen());
 await p.locator('[data-action="play"]').click();await p.waitForFunction(()=>snakeProduct.controller.screen==='playing');await p.screenshot({path:'docs/qa/snake-product/live-desktop30.png'});
 await p.waitForFunction(()=>snakeProduct.controller.screen==='result',{},{timeout:20000});
 verify(await p.evaluate(()=>snakeProduct.controller.result.accepted&&snakeProduct.controller.result.stats.final_hash===snakeProduct.game.session.hash()&&snakeProduct.backend.calls.filter(c=>c.method==='finish').length===1),'natural wall death canonical result exactly once');
 await p.goto(url+'&preview=result-record');await p.waitForFunction(()=>window.snakeProduct?.controller.result?.accepted);
 await context.grantPermissions(['clipboard-read','clipboard-write']);
 await p.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:undefined}));await p.locator('[data-action="share"]').click();verify((await p.evaluate(()=>navigator.clipboard.readText())).includes('12 480'),'share clipboard canonical confirmed record');
 await p.goto(url+'&mock=sponsor-available');await p.waitForFunction(()=>window.snakeProduct);
 await p.evaluate(()=>{snakeProduct.backend.claim=async()=>({success:false,status:'network_error'});});await p.locator('[data-action="sponsor"]').click();verify(await p.evaluate(()=>snakeProduct.controller.screen==='error'&&snakeProduct.controller.hub.attempts_used===3&&snakeProduct.controller.hub.sponsor_attempt_credits===0),'sponsor failure no fake credit/debit');
 await p.goto(url);await p.waitForFunction(()=>window.snakeProduct);await p.locator('[data-action="play"]').click();await p.locator('#game-frame').contentFrame().locator('[data-action="pause"]').click();await p.locator('[data-action="settings"]').click();await p.locator('[data-action="back"]').click();verify(await p.evaluate(()=>snakeProduct.controller.screen==='pause'),'real Pause Settings Back');
 await p.locator('[data-action="restart"]').click();await p.locator('[data-action="cancel"]').click();await p.locator('[data-action="exit"]').click();await p.locator('[data-action="confirm"]').click();verify(await p.evaluate(()=>snakeProduct.controller.screen==='main'&&snakeProduct.backend.calls.filter(c=>c.method==='finish').length===0),'confirmed exit no incomplete finish');
 await context.close();
 const mc=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),m=await mc.newPage();m.on('pageerror',e=>errors.push(e.message));await m.goto(url);await m.waitForFunction(()=>window.snakeProduct);await m.screenshot({path:'docs/qa/snake-product/main-mobile.png'});
 verify(await m.evaluate(()=>document.documentElement.scrollWidth===innerWidth),'mobile menu no horizontal overflow');
 await m.locator('[data-action="training"]').click();await m.locator('[data-action="gate-confirm"]').click();await m.waitForFunction(()=>snakeProduct.controller.screen==='playing');await m.evaluate(()=>snakeProduct.controller.pause());
 for(const stage of [0,1,2]){
  await m.evaluate(stage=>{snakeProduct.controller.abandon();snakeProduct.bridge.previewStage=stage;},stage);await m.evaluate(()=>snakeProduct.controller.start('training'));if(await m.evaluate(()=>snakeProduct.controller.screen==='mobile-gate'))await m.locator('[data-action="gate-confirm"]').click();await m.waitForFunction(()=>snakeProduct.controller.screen==='playing');
  verify(await m.evaluate(stage=>snakeProduct.game.session.world.width===[30,40,50][stage],stage),'mobile actual stage '+stage);await m.evaluate(()=>snakeProduct.controller.pause());
 }
 await mc.close();verify(errors.length===0,'interaction console errors zero');return {checks,errors};
}
