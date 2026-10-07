async (page,phase='after')=>{
 const dir='docs/qa/snake-ui-v4-3/',base='http://127.0.0.1:8776/',checks=[],failures=[],errors=[],measurements=[];
 const browser=page.context().browser(),check=(v,n)=>(v?checks:failures).push(n);
 for(const dpr of [1,1.5,2]){
  const ctx=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:dpr}),p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));await p.emulateMedia({reducedMotion:'reduce'});
  const entry=phase==='before'?'giveaway-test/releases/snake-next-7cb676c44096/snake/product/index.html':'arcade/snake-next/product/index.html';
  await p.goto(base+entry+'?qa=1');await p.waitForFunction(()=>window.snakeProduct?.controller.screen==='main');await p.evaluate(()=>document.documentElement.classList.remove('dev-qa'));
  const ready=()=>p.waitForFunction(()=>[...document.querySelectorAll('#menu img')].filter(e=>e.getBoundingClientRect().width).every(e=>e.complete&&e.naturalWidth));
  const show=async(screen)=>{await p.evaluate(screen=>{const c=snakeProduct.controller;if(screen.startsWith('result'))c.result={training:screen==='result-training',accepted:screen!=='result-training',record:screen==='result-record',response:{score:12480},stats:{score:2480,foods:24,length:32,max_combo:5,world:[40,16],active_ticks:6840}};c.tab='basics';c.show(screen.startsWith('result')?'result':screen);},screen);await ready();};
  if(dpr===1)for(const [w,h]of [[1920,1080],[1366,768],[1280,720],[844,390],[608,342]]){
   await p.setViewportSize({width:w,height:h});
   for(const screen of ['main','result-training','result-record','rating','rules']){
    await show(screen);
    const m=await p.evaluate(()=>{const safe=document.querySelector('#menu').getBoundingClientRect(),items=[...document.querySelectorAll('.fantasy-panel,.fantasy-panel>.panel-heading,.fantasy-panel>.actions,.fantasy-panel>.panel-skin>.skin-crest,.ranking-podium,.ranking-summary')];return {screen:document.querySelector('#product').dataset.screen,safe:safe.toJSON(),bounds:items.filter(e=>e.getBoundingClientRect().width).map(e=>({cls:e.className,...e.getBoundingClientRect().toJSON()})),scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],size:[innerWidth,innerHeight]};});
    measurements.push(m);for(const b of m.bounds)check(b.left>=m.safe.left-.5&&b.right<=m.safe.right+.5&&b.top>=m.safe.top-.5&&b.bottom<=m.safe.bottom+.5,screen+' '+w+' safe '+b.cls);
    check(m.scroll[0]<=w+1&&m.scroll[1]<=h+1,screen+' '+w+' no document scroll');
    if(screen==='rating'&&phase==='after'){
     check(await p.evaluate(()=>getComputedStyle(document.querySelector('.panel-rating .panel-body')).overflowY==='hidden'),'Ranking shell fixed '+w);
     await p.locator('.ranking-list').evaluate(e=>e.scrollTop=e.scrollHeight);
     check(await p.locator('.ranking-list li').last().evaluate(e=>{const r=e.getBoundingClientRect(),b=e.closest('.ranking-list').getBoundingClientRect();return r.top>=b.top-.5&&r.bottom<=b.bottom+.5;}),'last ranking row reachable '+w);
     await p.locator('.ranking-list').evaluate(e=>e.scrollTop=0);
    }
    if(w!==608)await p.screenshot({path:dir+phase+'-'+screen+'-'+w+'.png',scale:'css'});
   }
  }
  await p.setViewportSize({width:1920,height:1080});await show('result-training');
  await p.locator('.panel-result').screenshot({path:dir+phase+'-result-dpr'+dpr+'.png',scale:'device'});
  const edges=await p.evaluate(()=>Object.fromEntries(['panel-result','skin-wood','skin-top','skin-bottom','skin-left','skin-right'].map(k=>[k,document.querySelector('.panel-result .'+k)?.getBoundingClientRect().toJSON()||document.querySelector('.'+k)?.getBoundingClientRect().toJSON()])));measurements.push({dpr,resultEdges:edges});
  // Ownership diagnostic uses the same DOM placement/raster, not rectangle math.
  await p.addStyleTag({content:'.panel-result>.panel-heading,.panel-result>.panel-body,.panel-result>.actions,.panel-result>.panel-close{visibility:hidden}.panel-result .skin-wood{background:#0060ff!important;box-shadow:none!important;opacity:1!important;mask:none!important}.panel-result .skin-edge,.panel-result .skin-corner{filter:brightness(0) invert(1)!important}.panel-result .skin-crest{visibility:hidden}.cabinet{background:#ff00ff!important}.cabinet:before{display:none!important}'});
  await p.locator('.panel-result').screenshot({path:dir+phase+'-result-ownership-dpr'+dpr+'.png',scale:'device'});
  await p.reload();await p.waitForFunction(()=>window.snakeProduct?.controller.screen==='main');await p.evaluate(()=>document.documentElement.classList.remove('dev-qa'));
  for(const [screen,action]of [['main','play'],['main','training'],['pause','resume'],['result-training','training'],['result-training','main'],['rating','back'],['rules','back'],['main','rating']]){
   await show(screen);const sel=screen==='main'&&action==='rating'?'.tournament-preview [data-action=rating]':'.btn[data-action='+action+']:not(.panel-close)';
   await p.locator(sel).first().screenshot({path:dir+phase+'-label-'+screen+'-'+action+'-dpr'+dpr+'.png',scale:'device'});
  }
  await ctx.close();
 }
 check(!errors.length,'no native page errors');return {phase,checks:checks.length,failures,errors,measurements};
}
