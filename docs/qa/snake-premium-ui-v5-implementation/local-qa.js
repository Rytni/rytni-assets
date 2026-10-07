async page=>{
 const dir='docs/qa/snake-premium-ui-v5-implementation/',results=[],errors=[],failed=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push([r.status(),r.url()]);});
 await page.emulateMedia({reducedMotion:'reduce'});
 const check=(ok,label)=>{if(!ok)throw Error(label);};
 const ready=async()=>{await page.waitForFunction(()=>window.snakeProduct&&document.querySelector('#product').dataset.screen!=='loading');await page.waitForFunction(()=>[...document.querySelectorAll('#menu img')].every(e=>e.complete&&e.naturalWidth));};
 const capture=async(name)=>{await ready();await page.screenshot({path:dir+name+'.png',scale:'css'});};
 const fit=async(name)=>{const value=await page.evaluate(()=>{const box=document.querySelector('#cabinet').getBoundingClientRect(),els=[...document.querySelectorAll('#menu button,.result-score,.primary-stats,.result-note,.result-audit,.result-hero,.panel-rating,.panel-rating>.panel-heading,.panel-rating>.actions,.ranking-podium,.ranking-summary')].filter(e=>e.getBoundingClientRect().width);return {size:[innerWidth,innerHeight],screen:document.querySelector('#product').dataset.screen,scroll:document.documentElement.scrollHeight>innerHeight+1||document.documentElement.scrollWidth>innerWidth+1,outside:els.filter(e=>{const b=e.getBoundingClientRect();return b.left<box.left-.5||b.right>box.right+.5||b.top<box.top-.5||b.bottom>box.bottom+.5;}).map(e=>e.className),tiny:els.filter(e=>e.tagName==='BUTTON'&&(e.offsetWidth<44||e.offsetHeight<44)).map(e=>e.dataset.action)};});check(!value.scroll&&!value.outside.length&&!value.tiny.length,name+' fit '+JSON.stringify(value));results.push({name,...value});};
 for(const [width,height] of [[1920,1080],[1366,768],[1280,720],[844,390]]){
  await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?preview=main-ready');await ready();
  await page.locator('[data-action=fullscreen]').click();await page.waitForFunction(()=>!!document.fullscreenElement);await capture('main-'+width);await fit('main '+width);
  await page.locator('[data-action=rating]').first().click();await capture('ranking-'+width);await fit('ranking '+width);
  check(await page.locator('.ranking-list li').count()===7,'seven list rows');await page.locator('.ranking-list').evaluate(e=>e.scrollTop=e.scrollHeight);check(await page.locator('.ranking-list li').last().evaluate(e=>{const b=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect();return b.bottom<=p.bottom+1&&b.top>=p.top-1;}),'row10 reachable');
  await page.locator('.panel-rating>.actions [data-action=back]').click();
  for(const name of ['result-training','result-record','result-normal']){
   await page.evaluate(async name=>{await snakeProduct.fixture(name);const r=snakeProduct.controller.result;r.stats={...r.stats,score:215,foods:2,length:10,max_combo:2};if(r.accepted)r.response.score=215;snakeProduct.controller.emit();},name);await capture(name+'-'+width);await fit(name+' '+width);
   check(await page.locator('.panel-result').count()===0,'no result modal');
   await page.evaluate(()=>{const c=snakeProduct.controller;c.result.stats.score=99999999;if(c.result.accepted)c.result.response.score=99999999;c.hub.best_score=99999999;c.hub.my_rank=9999;c.emit();});await fit('large result '+width);
   await page.locator('[data-action=main]').click();await ready();await fit('large main '+width);
  }
 }
 check(!errors.length&&!failed.length,'errors '+JSON.stringify({errors,failed}));return {results,errors,failed};
}
