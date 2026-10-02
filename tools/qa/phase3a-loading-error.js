async page=>{
  const errors=[],statuses=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()===404)statuses.push(r.url());});
  await page.setViewportSize({width:1366,height:768});await page.route('**/ui/hero-v1.webp',r=>r.fulfill({status:404,body:'intentional QA failure'}));
  await page.goto('http://127.0.0.1:8771/arcade/snake-next/slice.html?qa=1');await page.locator('[data-action=retry]').waitFor({state:'visible'});
  const before=await page.evaluate(()=>({origin:performance.timeOrigin,mainHidden:document.querySelector('[data-screen=main]').hidden,canvas:getComputedStyle(document.querySelector('canvas')).visibility,appExists:!!window.snakeNext}));
  await page.screenshot({path:'.playwright-cli/phase3a/loading-error.png'});await page.unroute('**/ui/hero-v1.webp');
  const navigated=page.waitForEvent('domcontentloaded');await page.locator('[data-action=retry]').click();await navigated;await page.waitForFunction(()=>window.snakeNext?.app.ui==='main');await page.evaluate(()=>snakeNext.ready);
  const after=await page.evaluate(()=>({origin:performance.timeOrigin,ui:snakeNext.app.ui,resources:snakeNext.app.summary().resources}));if(before.origin===after.origin||!before.mainHidden||before.appExists||after.ui!=='main'||errors.length)throw Error('Retry/error gate failed');
  await page.screenshot({path:'.playwright-cli/phase3a/retry-recovered.png'});const result={intentional404:statuses,before,after,errors};await page.evaluate(result=>window.phase3aLoadingError=result,result);return result;
}
