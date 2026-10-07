async (page,options={})=>{
 // Real TEST host interactions retained; candidate overrides only when !live.
 let source=await(await page.request.get('http://127.0.0.1:8776/docs/qa/snake-ui-v4-1/site-qa.js')).text();
 if(options.viewport)source=source.replace('mobile?{width:844,height:390}:{width:1920,height:1080}','mobile?{width:844,height:390}:'+JSON.stringify(options.viewport));
 if(options.tag)source=source.replace("mode=options.live?'live':'candidate'","mode=options.live?'live-"+options.tag+"':'candidate-"+options.tag+"'");
 const run=eval('('+source.replaceAll('docs/qa/snake-ui-v4-1/','docs/qa/snake-ui-v4-3/').replaceAll('snake_ui_v4_1=1','snake_ui_v4_3=1')+')');
 const result=await run(page,options);
 await page.locator('[data-ms-action=game-snake]').click();await page.waitForFunction(()=>RytniArcadeHub.snakeScreen==='main');
 const f=page.frames().find(f=>f.url().includes('/snake/product/index.html'));
 const capture=async(name)=>{await f.waitForFunction(()=>[...document.querySelectorAll('#menu img')].filter(e=>e.getBoundingClientRect().width).every(e=>e.complete&&e.naturalWidth));await page.screenshot({path:'docs/qa/snake-ui-v4-3/'+(options.live?'live':'candidate')+(options.tag?'-'+options.tag:'')+'-'+name+(result.mobile?'-mobile':'')+'.png',scale:'css'});};
 for(const phase of ['embedded','fullscreen']){
  if(phase==='fullscreen'){await f.locator('[data-action=fullscreen]').first().click();await page.waitForFunction(()=>!!document.fullscreenElement);const size=await page.evaluate(()=>[innerWidth,innerHeight]);await f.waitForFunction(([w,h])=>innerWidth===w&&innerHeight===h,size);}
  await f.locator('[data-action=rating]').first().click();await f.waitForFunction(()=>document.querySelector('#product').dataset.screen==='rating');
  const fit=await f.evaluate(()=>{const a=document.querySelector('#menu').getBoundingClientRect();return [...document.querySelectorAll('.panel-rating,.panel-rating>.panel-heading,.panel-rating>.actions,.panel-rating>.panel-skin>.skin-crest,.ranking-podium,.ranking-summary')].every(e=>{const b=e.getBoundingClientRect();return b.left>=a.left-.5&&b.top>=a.top-.5&&b.right<=a.right+.5&&b.bottom<=a.bottom+.5;});});
  if(!fit)throw Error('real host Ranking cropped '+phase);result.checks++;
  if(!await f.evaluate(()=>getComputedStyle(document.querySelector('.panel-rating .panel-body')).overflowY==='hidden'))throw Error('Ranking shell scrolls');result.checks++;
  await f.locator('.ranking-list').evaluate(e=>e.scrollTop=e.scrollHeight);if(!await f.locator('.ranking-list li').last().evaluate(e=>{const r=e.getBoundingClientRect(),b=e.closest('.ranking-list').getBoundingClientRect();return r.top>=b.top-.5&&r.bottom<=b.bottom+.5;}))throw Error('ranking row10 not reachable');result.checks++;
  await f.locator('.ranking-list').evaluate(e=>e.scrollTop=0);await capture('ranking-'+phase);await f.locator('.panel-rating>.actions [data-action=back]').click();
  await f.locator('[data-action=rules]').click();await f.waitForFunction(()=>document.querySelector('#product').dataset.screen==='rules');
  for(const tab of ['basics','bonuses','hazards']){await f.locator('[data-tab='+tab+']').click();const ok=await f.evaluate(()=>{const a=document.querySelector('#menu').getBoundingClientRect();return [...document.querySelectorAll('.panel-rules,.manual-book,.panel-rules>.actions,.panel-rules .skin-crest')].every(e=>{const b=e.getBoundingClientRect();return b.top>=a.top-.5&&b.bottom<=a.bottom+.5;});});if(!ok)throw Error('Guide crop '+phase+'/'+tab);result.checks++;}
  await capture('guide-'+phase);await f.locator('.panel-rules>.actions [data-action=back]').click();
 }
 await page.evaluate(()=>RytniArcadeHub.leave());return result;
}
