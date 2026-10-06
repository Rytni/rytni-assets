async (page,phase='before')=>{
 const dir='docs/qa/snake-ui-v4-1/',errors=[];page.on('pageerror',e=>errors.push(e.message));await page.emulateMedia({reducedMotion:'reduce'});
 async function ready(){await page.waitForFunction(()=>window.snakeProduct?.controller.screen==='main');await page.evaluate(()=>document.documentElement.classList.remove('dev-qa'));await page.waitForFunction(()=>[...document.querySelectorAll('#menu img')].every(e=>e.complete&&e.naturalWidth));}
 async function shot(name){await page.waitForFunction(()=>[...document.querySelectorAll('#menu img')].every(e=>e.complete&&e.naturalWidth));await page.screenshot({path:dir+phase+'-'+name+'.png',scale:'css'});}
 await page.setViewportSize({width:1920,height:1080});await page.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?qa=1');await ready();await page.locator('[data-action=fullscreen]').click();await page.waitForFunction(()=>!!document.fullscreenElement&&innerWidth===1920);await shot('main-desktop');
 for(const [tab,file]of [['basics','guide-basics'],['bonuses','guide-bonuses'],['hazards','guide-dangers']]){await page.evaluate(tab=>snakeProduct.fixture('rules-'+tab),tab);await shot(file);}
 await page.evaluate(async()=>{snakeProduct.controller.abandon();await snakeProduct.controller.start('training');snakeProduct.controller.pause();document.querySelector('#product-overlay').style.visibility='hidden';});await shot('gameplay-fullscreen');
 await page.evaluate(()=>document.exitFullscreen());await page.setViewportSize({width:720,height:405});await shot('gameplay-desktop');
 await page.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?qa=1');await ready();await page.setViewportSize({width:844,height:390});await page.locator('[data-action=fullscreen]').click();await page.waitForFunction(()=>!!document.fullscreenElement&&innerWidth===844);await shot('main-mobile');
 await page.evaluate(()=>snakeProduct.controller.dispose());return {phase,errors};
}
