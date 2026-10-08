async page=>{
 const probe=await(await page.request.get('http://127.0.0.1:8776/docs/qa/snake-premium-ui-v5-1/text-probe.js')).text(),results=[];
 for(const [width,height]of [[1920,1080],[1366,768],[1280,720]]){
  await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?preview=main-ready');await page.waitForFunction(()=>window.snakeProduct);
  await page.evaluate(async()=>{document.querySelector('#cabinet').classList.add('pseudo-fullscreen');await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
  const fixed=await page.evaluate(eval('('+probe+')'));
  await page.evaluate(()=>{document.querySelector('.preview-leaders').style.cssText='position:static;display:flex;flex-direction:column;justify-content:space-evenly';for(const li of document.querySelectorAll('.preview-leaders li'))li.style.alignSelf='auto';});
  const old=await page.evaluate(eval('('+probe+')'));results.push({width,height,fixedErrors:fixed.errors,oldDividerErrors:old.errors.filter(e=>e.reason==='TOP3 painted divider')});
  await page.evaluate(()=>{document.querySelector('.preview-leaders').style.cssText='';for(const li of document.querySelectorAll('.preview-leaders li'))li.style.alignSelf='';});
 }
 const failures=results.filter(r=>r.fixedErrors.length||r.width===1920&&!r.oldDividerErrors.length);
 return {checks:4,failedChecks:failures.length,failures,results};
}
