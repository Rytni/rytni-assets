async page=>{
  const errors=[],warnings=[],failures=[],notFound=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text());});page.on('requestfailed',r=>failures.push({url:r.url(),error:r.failure()?.errorText}));page.on('response',r=>{if(r.status()===404)notFound.push(r.url());});page.on('request',r=>{if(r.url().includes('/assets/'))requests.push(r.url());});
  const out='.playwright-cli/phase3a',screens=[];const shot=async name=>{await page.screenshot({path:`${out}/${name}.png`});screens.push(name);};
  await page.unroute('**/assets/ui/hero-v1.webp');await page.setViewportSize({width:1366,height:768});
  const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.clearBrowserCache');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  let releaseCritical;const held=new Promise(resolve=>releaseCritical=resolve);await page.route('**/assets/ui/hero-v1.webp',async route=>{await held;await route.continue();});
  await page.goto('http://127.0.0.1:8771/arcade/snake-next/slice.html?qa=1',{waitUntil:'domcontentloaded'});await page.locator('[data-screen=loading]').waitFor();
  const loading=await page.evaluate(()=>({state:document.querySelector('main').dataset.state,mainHidden:document.querySelector('[data-screen=main]').hidden,canvas:getComputedStyle(document.querySelector('canvas')).visibility}));
  if(!loading.mainHidden||loading.canvas!=='hidden')throw Error('Critical UI leaked');await shot('loading');releaseCritical();await page.waitForFunction(()=>window.snakeNext?.app?.ui==='main');await page.unroute('**/assets/ui/hero-v1.webp');await page.evaluate(()=>snakeNext.ready);
  const cold=await page.evaluate(()=>({timing:snakeNext.timing,critical:snakeNext.criticalCount,game:snakeNext.gameCount}));await shot('main-desktop');
  const act=async name=>page.locator(`[data-screen]:not([hidden]) [data-action=${name}]`).first().click();
  await act('how');await shot('how-desktop');await act('back');await act('settings');await shot('settings-desktop');
  const slider=await page.locator('input[data-volume=music]').boundingBox();await page.mouse.click(slider.x+slider.width*.4,slider.y+slider.height/2);await page.locator('#quality').selectOption('quiet');await page.locator('#quality').selectOption('full');await act('back');
  await act('training');await page.waitForFunction(()=>snakeNext.app.state.score>=100);await shot('food-pickup');await page.locator('#pause').click();
  const paused=await page.evaluate(()=>snakeNext.app.summary());await shot('pause');await act('settings');await act('back');
  const hash=await page.evaluate(()=>snakeNext.app.summary().hash);if(hash!==paused.hash)throw Error('Pause settings changed simulation');await act('restart');await shot('restart-confirm');await act('back');await act('resume');
  await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowLeft');await page.evaluate(()=>{snakeDev.qa.collision('self');});await page.waitForFunction(()=>snakeNext.app.ui==='result');await shot('result-desktop');await act('main');
  const beforeRepeat=requests.length,repeatStart=Date.now();await act('training');await page.locator('#pause').click();await act('main');const repeat={wallMs:Date.now()-repeatStart,newRequests:requests.slice(beforeRepeat)};
  for(const size of [{width:360,height:800},{width:390,height:844},{width:430,height:932}]){
    await page.setViewportSize(size);await shot(`main-${size.width}`);await act('training');await shot(`prompt-${size.width}`);
    const bounds=await page.locator('[data-screen=prompt] article').boundingBox();if(bounds.y<0||bounds.y+bounds.height>size.height+1)throw Error('Portrait panel overflow');
    if(await page.evaluate(()=>snakeNext.app.summary().resources.timers))throw Error('Portrait simulation ran');await act('main');
  }
  for(const size of [{width:1920,height:1080},{width:1366,height:768}]){await page.setViewportSize(size);await act('how');await shot(`how-${size.width}`);await act('back');}
  await page.locator('[data-action=fullscreen]').click();await page.waitForFunction(()=>!!document.fullscreenElement);await shot('main-fullscreen');await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.fullscreenElement);
  const mainEnd=await page.evaluate(()=>snakeNext.app.summary());
  const close=page.locator('[data-screen=how] .sn-close');await act('how');await close.screenshot({path:`${out}/close-normal.png`});await close.hover();await close.screenshot({path:`${out}/close-hover.png`});const box=await close.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await close.screenshot({path:`${out}/close-pressed.png`});await page.mouse.up();
  await cdp.send('Network.setCacheDisabled',{cacheDisabled:false});await cdp.detach();
  const result={loading,cold,repeat,paused,mainEnd,screens,errors,warnings,failures,notFound,requests,duplicates:requests.filter((url,index)=>requests.indexOf(url)!==index)};
  await page.evaluate(result=>window.phase3aUI=result,result);return result;
}
