async page=>{
 const browser=page.context().browser(),checks=[],failures=[];
 const context=await browser.newContext({viewport:{width:1920,height:1080}}),p=await context.newPage();
 await p.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?qa=1');await p.waitForFunction(()=>window.snakeProduct);
 for(const size of [[1920,1080],[1366,768],[844,390],[720,405],[608,342]]){
  await p.setViewportSize({width:size[0],height:size[1]});
  for(const score of [0,999,9999,99999,999999,1000000,9999999,99999999])for(const rank of [1,9,99,999,3000,9999]){
   await p.evaluate(({score,rank})=>{const c=snakeProduct.controller;c.hubRequest++;c.hub.best_score=score;c.hub.my_rank=rank;c.show('main');},{score,rank});
   const result=await p.evaluate(()=>[...document.querySelectorAll('.record-safe strong,.rank-safe strong')].map(e=>{const r=e.getBoundingClientRect(),box=e.parentElement.getBoundingClientRect(),icon=e.parentElement.previousElementSibling.getBoundingClientRect();return {text:e.textContent,ok:e.scrollWidth<=e.clientWidth+1&&r.right<=box.right+1&&r.left>=icon.right+2,font:parseFloat(getComputedStyle(e).fontSize)};}));
   for(const r of result)(r.ok&&r.font>=16?checks:failures).push({size,score,rank,...r});
  }
 }
 // Normal-value Main screenshot, distinct from stress fixtures.
 await p.setViewportSize({width:1920,height:1080});await p.evaluate(()=>snakeProduct.controller.refresh());await p.evaluate(()=>document.documentElement.classList.remove('dev-qa'));
 await p.waitForFunction(()=>[...document.querySelectorAll('#menu img')].every(e=>e.complete&&e.naturalWidth));await p.screenshot({path:'docs/qa/snake-ui-v4-2/after-main-normal.png',scale:'css'});
 await context.close();return {checks:checks.length,failures};
}
