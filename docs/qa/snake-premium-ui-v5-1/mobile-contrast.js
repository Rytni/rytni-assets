async page=>{
 const contrast=[];await page.setViewportSize({width:844,height:390});await page.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?preview=main-ready');await page.waitForFunction(()=>window.snakeProduct);await page.evaluate(()=>document.querySelector('#cabinet').classList.add('pseudo-fullscreen'));
 for(const state of ['main','result-normal','result-training','rating']){
  await page.evaluate(async state=>{if(['main','rating'].includes(state))snakeProduct.controller.show(state);else await snakeProduct.fixture(state);await document.fonts.ready;await Promise.all([...document.querySelectorAll('#menu img')].map(i=>i.decode()));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));},state);
  const samples=await page.evaluate(()=>[...document.querySelectorAll('.motto,.shortcut-label,.result-note,.result-share>span,.ranking-summary')].filter(e=>e.getBoundingClientRect().width).map(e=>{const r=document.createRange();r.selectNodeContents(e);const b=r.getBoundingClientRect();return {selector:e.className,text:e.textContent,rect:{x:b.x,y:b.y,w:b.width,h:b.height},color:getComputedStyle(e).color};}));
  await page.evaluate(()=>{for(const e of document.querySelectorAll('.motto,.shortcut-label,.result-note,.result-share>span,.ranking-summary')){e.style.color='transparent';e.style.textShadow='none';}});
  const image='after-mobile-'+state+'-contrast.png';await page.screenshot({path:'docs/qa/snake-premium-ui-v5-1/'+image,scale:'css'});contrast.push({image,samples});
 }
 return {contrast};
}
