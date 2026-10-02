async page=>{
  const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.clearBrowserCache');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  const requests=[],errors=[];page.on('request',r=>{if(r.url().includes('/assets/'))requests.push(r.url());});page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize({width:1366,height:768});
  await page.goto('http://127.0.0.1:8771/arcade/snake-next/slice.html?qa=1');await page.waitForFunction(()=>!!window.snakeDev?.qa);await page.evaluate(()=>snakeNext.ready);
  const cold=await page.evaluate(()=>({timing:{...snakeNext.timing},criticalLoaded:Math.max(...Object.values(snakeNext.assets.timings).slice(0,7).map(t=>t.loaded)),criticalDecoded:Math.max(...Object.values(snakeNext.assets.timings).slice(0,7).map(t=>t.decoded)),critical:snakeNext.criticalCount,game:snakeNext.gameCount,audio:snakeNext.mixer.summary().decoded}));
  await page.getByRole('button',{name:'Тренировка',exact:true}).click();await page.waitForFunction(()=>!!snakeNext.timing.firstForestVisible);
  const first=await page.evaluate(()=>({...snakeNext.timing,bakeMs:snakeNext.assets.forest.bakeMs,assets:snakeNext.assets.images.size}));
  await page.locator('#pause').click();await page.locator('[data-screen=paused] [data-action=main]').click();const before=requests.length;
  await page.getByRole('button',{name:'Тренировка',exact:true}).click();await page.waitForFunction(()=>snakeNext.timing.firstForestVisible>=snakeNext.timing.lastStartClick);
  const repeat=await page.evaluate(()=>({...snakeNext.timing,bakeMs:snakeNext.assets.forest.bakeMs}));const repeatRequests=requests.slice(before);await page.evaluate(()=>snakeDev.main());
  let release;const blocked=new Promise(resolve=>release=resolve);await page.route('**/forest/seed-v1.webp',async r=>{await blocked;await r.continue();});
  await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.snakeNext?.app);await page.getByRole('button',{name:'Тренировка',exact:true}).click();
  const gated=await page.evaluate(()=>({ui:snakeNext.app.ui,resources:snakeNext.app.summary().resources,canvas:getComputedStyle(document.querySelector('canvas')).visibility}));if(gated.ui!=='loading'||gated.resources.timers||gated.canvas!=='hidden')throw Error('Training started before game decode');
  await page.screenshot({path:'.playwright-cli/phase3a/game-loading.png'});await page.locator('[data-screen=loading] [data-action=main]').click();release();await page.evaluate(()=>snakeNext.ready);await page.waitForTimeout(80);
  const cancelled=await page.evaluate(()=>snakeNext.app.summary());if(cancelled.ui!=='main'||cancelled.resources.raf||cancelled.resources.timers)throw Error('Stale async start survived Main');
  await page.unroute('**/forest/seed-v1.webp');await cdp.send('Network.setCacheDisabled',{cacheDisabled:false});await cdp.detach();
  const result={cold,first,repeat,repeatRequests,gated,cancelled,errors,flyRequests:requests.filter(url=>url.includes('mushroom-fly'))};await page.evaluate(result=>window.phase3aLoading=result,result);return result;
}
