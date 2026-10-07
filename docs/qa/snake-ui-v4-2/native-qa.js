async (page, phase='after')=>{
 const dir='docs/qa/snake-ui-v4-2/',checks=[],failures=[],errors=[],metrics=[];
 const check=(ok,label)=>{(ok?checks:failures).push(label);};
 const browser=page.context().browser();
 for(const dpr of [1,1.5,2]){
  const context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:dpr}),p=await context.newPage();
  p.on('pageerror',e=>errors.push(e.message));await p.emulateMedia({reducedMotion:'reduce'});
  const entry=phase==='before'?'giveaway-test/releases/snake-next-8d20d4ba2174/snake/product/index.html':'arcade/snake-next/product/index.html';
  await p.goto('http://127.0.0.1:8776/'+entry+'?qa=1');await p.waitForFunction(()=>window.snakeProduct?.controller.screen==='main');
  await p.evaluate(()=>document.documentElement.classList.remove('dev-qa'));
  const ready=()=>p.waitForFunction(()=>[...document.querySelectorAll('#menu img')].filter(e=>e.getBoundingClientRect().width).every(e=>e.complete&&e.naturalWidth));
  if(dpr===1){
   for(const size of [[1920,1080],[1366,768],[844,390],[720,405]]){
    await p.setViewportSize({width:size[0],height:size[1]});
    for(const tab of ['basics','bonuses','hazards']){
     await p.evaluate(t=>snakeProduct.fixture('rules-'+t),tab);await ready();
     const m=await p.evaluate(()=>{const b=e=>e.getBoundingClientRect().toJSON(),q=s=>b(document.querySelector(s));return {panel:q('.panel-rules'),book:q('.manual-book'),footer:q('.panel-rules>.actions'),crest:q('.panel-rules .skin-crest'),body:q('.panel-body'),scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],size:[innerWidth,innerHeight],safe:q('#menu'),pages:[...document.querySelectorAll('.book-page')].map(b)};});
     metrics.push({size,tab,...m});
     for(const key of ['panel','book','footer','crest'])check(m[key].top>=m.safe.top-.1&&m[key].bottom<=m.safe.bottom+.1&&m[key].left>=0&&m[key].right<=size[0],size+' '+tab+' complete '+key);
     check(m.book.bottom<=m.footer.top,size+' '+tab+' book not behind footer');
     check(m.scroll[0]<=size[0]+1&&m.scroll[1]<=size[1]+1,size+' '+tab+' no document scroll');
     check(await p.evaluate(()=>getComputedStyle(document.querySelector('.panel-rules .panel-body')).overflowY==='hidden'),size+' '+tab+' shell does not scroll');
     if(tab==='basics'&&size[0]!==720)await p.screenshot({path:dir+phase+'-guide-'+size[0]+'.png',scale:'css'});
    }
   }
   for(const size of [[1920,1080],[1366,768],[844,390],[720,405]]){
    await p.setViewportSize({width:size[0],height:size[1]});
    await p.evaluate(()=>{const c=snakeProduct.controller;c.hubRequest++;c.hub.best_score=99999999;c.hub.my_rank=3000;c.hub.leaderboard=c.hub.leaderboard.map((r,i)=>({...r,name:'Александр Константинович Лесной Путешественник '+i,score:99999999-i}));c.show('main');});await ready();
    check(await p.evaluate(()=>[...document.querySelectorAll('.record-safe strong,.rank-safe strong,.preview-leaders b')].every(e=>{const r=e.getBoundingClientRect(),p=e.parentElement.getBoundingClientRect();return e.scrollWidth<=e.clientWidth+1&&r.right<=p.right+.1;})),size+' large score/rank no overflow');
    await p.screenshot({path:dir+phase+'-main-stress-'+size[0]+'.png',scale:'css'});
    await p.evaluate(()=>snakeProduct.controller.show('rating'));await ready();
    check(await p.evaluate(()=>[...document.querySelectorAll('.leaderboard .score')].every(e=>{const r=e.getBoundingClientRect(),p=e.closest('li').getBoundingClientRect();return r.left>=p.left&&r.right<=p.right+.1&&e.scrollWidth<=e.clientWidth+1;})),size+' top10 stress scores never ellipsized');
    if(size[0]!==720){await p.locator('.leaderboard').scrollIntoViewIfNeeded();await p.screenshot({path:dir+phase+'-ranking-stress-'+size[0]+'.png',scale:'css'});}
   }
  }
  await p.setViewportSize({width:1920,height:1080});
  for(const [screen,action] of [['main','play'],['main','training'],['pause','resume'],['pause','restart'],['confirm-restart','cancel'],['rules','back'],['main','rating']]){
   await p.evaluate(screen=>{const c=snakeProduct.controller;c.tab='basics';c.show(screen);},screen);await ready();
   const selector=screen==='main'&&action==='rating'?'.tournament-preview [data-action=rating]':'.btn[data-action='+action+']:not(.panel-close)';
   const button=p.locator(selector).first();
   check(await button.evaluate(e=>{const parts=[...e.querySelectorAll('.button-cap,.button-center')];return parts.every(p=>getComputedStyle(p).filter==='none')&&parts.every(p=>getComputedStyle(p).boxShadow==='none');}),action+' coherent cap/center color DPR'+dpr);
   await button.screenshot({path:dir+phase+'-button-'+action+'-dpr'+dpr+'.png',scale:'device'});
  }
  await p.evaluate(()=>snakeProduct.controller.dispose());await context.close();
 }
 check(errors.length===0,'no native page errors');return {phase,passed:checks.length,failures,errors,metrics};
}
