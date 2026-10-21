async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8793/arcade/snake-next/product/index.html?qa=1');
 await page.waitForFunction(()=>window.snakeProduct?.controller?.screen==='main');
 await page.locator('[data-action="training"]').click();
 await page.waitForFunction(()=>window.snakeProduct?.controller?.screen==='playing');
 const result=await page.evaluate(async()=>{
  const p=window.snakeProduct,g=p.game;g.stop();
  for(let i=0;i<36000&&g.status!=='result';i++)g.tick();
  const stats=p.stats(),{verifyClaim}=await import('/server/arcade-verifier/verifier-core.js');
  const verified=verifyClaim('snake',p.bridge.seed,stats.proof,{score:stats.score,active_ticks:stats.active_ticks,final_hash:stats.final_hash});
  return {score:stats.score,ticks:stats.proof.ticks,active_ticks:stats.active_ticks,events:stats.proof.commands.length,match:verified.audit.final_hash===stats.final_hash};
 });
 if(errors.length)throw Error(JSON.stringify(errors));return {pass:true,result,errors,mode:'REAL_BROWSER_TRAINING_NO_RANKED_WRITES'};
}
