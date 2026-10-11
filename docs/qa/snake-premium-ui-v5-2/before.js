async page=>{
 const dir='docs/qa/snake-premium-ui-v5-2/',rows=[];await page.setViewportSize({width:1366,height:768});
 await page.goto('http://127.0.0.1:8776/giveaway-test/releases/snake-next-07afb2c15b05/snake/product/index.html?preview=main-ready');await page.waitForFunction(()=>window.snakeProduct);
 for(const screen of ['main','rating','settings']){await page.evaluate(async screen=>{document.querySelector('#cabinet').classList.add('pseudo-fullscreen');snakeProduct.controller.show(screen);await document.fonts.ready;await Promise.all([...document.querySelectorAll('#menu img')].map(i=>i.decode()));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));},screen);await page.waitForFunction(()=>[...document.querySelectorAll('.title-scene,.fantasy-panel')].every(e=>Number(getComputedStyle(e).opacity)>=.999));await page.screenshot({path:dir+'before-'+screen+'.png',scale:'css'});
 rows.push({screen,metrics:await page.evaluate(()=>[...document.querySelectorAll('.ranking-podium .name,.setting-icon,.shortcut-label,.record-plaque strong')].map(e=>{const r=document.createRange();r.selectNodeContents(e);return {text:e.textContent,box:e.getBoundingClientRect().toJSON(),ink:r.getBoundingClientRect().toJSON(),font:getComputedStyle(e).font,lineHeight:getComputedStyle(e).lineHeight,overflow:getComputedStyle(e).overflow};}))});}
 return {rows};
}
