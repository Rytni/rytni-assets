async page=>{
 const c=await page.context().browser().newContext({viewport:{width:1366,height:768}}),p=await c.newPage(),rows=[];
 const original=await(await p.request.get('http://127.0.0.1:8776/giveaway-test/releases/snake-next-3efbc8cbe51b/snake/product/ui.js')).text();
 await p.route('**/product/ui.js',r=>r.fulfill({body:original.replaceAll('../../grib/','/grib/'),contentType:'text/javascript'}));
 await p.route('**/ui-v5-3-2.css',r=>r.fulfill({body:'',contentType:'text/css'}));
 for(const preview of ['settings','result-record']){
  await p.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?preview='+preview);await p.waitForFunction(()=>window.snakeProduct?.game);
  await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('#menu img')].map(i=>i.decode()));});
  await p.waitForTimeout(550);
  await p.locator('#cabinet').screenshot({path:`docs/qa/snake-presentation-v5-3-2/before-${preview}-1366.png`,scale:'css'});
  if(preview==='result-record')rows.push(await p.locator('.primary-stats').evaluate(e=>({html:e.outerHTML,background:getComputedStyle(e).background,before:getComputedStyle(e,'::before').cssText,after:getComputedStyle(e,'::after').content,images:[...e.querySelectorAll('img')].map(i=>i.src)})));
 }
 await c.close();return {checks:2,errors:[],failures:[],rows};
}
