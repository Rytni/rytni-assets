async page=>{
 const checks=[];for(const [width,height]of [[1920,1080],[1366,768],[1280,720],[844,390],[720,405]]){
  await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?preview=main-ready');await page.waitForFunction(()=>window.snakeProduct);await page.locator('[data-action=fullscreen]').click();
  for(const score of [0,99999,99999999])for(const rank of [1,9999]){
   await page.evaluate(([score,rank])=>{const c=snakeProduct.controller;c.hub.best_score=score;c.hub.my_rank=rank;c.emit();},[score,rank]);
   const errors=await page.evaluate(()=>[...document.querySelectorAll('.score-value,.rank-value')].flatMap(e=>{const r=document.createRange();r.selectNodeContents(e);const text=r.getBoundingClientRect(),box=e.getBoundingClientRect();return text.left<box.left-1||text.right>box.right+1?[{key:e.className,text:text.toJSON(),box:box.toJSON()}]:[];}));if(errors.length)throw Error('numeric clip '+JSON.stringify({width,score,rank,errors}));checks.push({width,score,rank});
  }
 }
 return {checks,passed:checks.length};
}
