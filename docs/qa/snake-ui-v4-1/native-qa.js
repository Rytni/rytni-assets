async page=>{
 const browser=page.context().browser(),checks=[],errors=[],dir='docs/qa/snake-ui-v4-1/';
 const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
 for(const dpr of [1,1.5,2]){
  const context=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:dpr}),p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.emulateMedia({reducedMotion:'reduce'});
  for(const phase of ['before','after']){
   const base=phase==='before'?'giveaway-test/releases/snake-next-1cd377655276/snake/product/index.html':'arcade/snake-next/product/index.html';
   await p.goto('http://127.0.0.1:8776/'+base+'?qa=1');await p.waitForFunction(()=>window.snakeProduct?.controller.screen==='main');await p.locator('[data-action=fullscreen]').click();await p.waitForFunction(()=>!!document.fullscreenElement&&innerWidth===1920);
   await p.waitForFunction(()=>[...document.querySelectorAll('#menu img')].every(e=>e.complete&&e.naturalWidth));await p.locator('.normal-tokens .token').first().screenshot({path:dir+phase+'-token-dpr'+dpr+'.png',scale:'device'});
   if(phase==='after'){
    const m=await p.evaluate(()=>{const r=document.querySelector('.title-scene').getBoundingClientRect(),b=document.querySelector('.tournament-preview').getBoundingClientRect(),hero=document.querySelector('.menu-hero').getBoundingClientRect(),info=document.querySelector('.main-info').getBoundingClientRect();return {ratio:b.width/r.width,overlap:hero.bottom>info.top,top3:document.querySelectorAll('.preview-leaders li').length,motto:getComputedStyle(document.querySelector('.motto')).backgroundColor};});
    check(m.ratio>=.27&&m.ratio<=.31,'Main ranking27–31% DPR'+dpr);check(m.top3===3,'only three leaders on Main DPR'+dpr);check(!m.overlap,'attempt UI clear of hero DPR'+dpr);check(m.motto!=='rgba(0, 0, 0, 0)','tagline has deliberate backing DPR'+dpr);
    await p.locator('.tournament-preview [data-action=rating]').click();check(await p.locator('.leaderboard>li').count()===10,'Main preview opens full10 DPR'+dpr);
   }
   await p.evaluate(()=>document.exitFullscreen());
  }
  await context.close();
 }
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true}),p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.emulateMedia({reducedMotion:'reduce'});
 await p.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?qa=1');await p.waitForFunction(()=>window.snakeProduct?.controller.screen==='main');await p.locator('[data-action=fullscreen]').tap();await p.waitForFunction(()=>!!document.fullscreenElement&&innerWidth===844);await p.evaluate(()=>document.documentElement.classList.remove('dev-qa'));
 for(const tab of ['basics','bonuses','hazards']){
  await p.evaluate(tab=>snakeProduct.fixture('rules-'+tab),tab);await p.waitForFunction(()=>[...document.querySelectorAll('#menu img')].every(e=>e.complete&&e.naturalWidth));
  const a=await p.evaluate(()=>({pages:document.querySelectorAll('.book-page').length,aspects:[...document.querySelectorAll('.skin-corner,.skin-crest,.page-corner,.button-cap')].filter(e=>e.getBoundingClientRect().width).map(e=>{const r=e.getBoundingClientRect();return Math.abs((r.width/e.naturalWidth)/(r.height/e.naturalHeight)-1);}),buttons:[...document.querySelectorAll('#menu button')].filter(e=>e.getBoundingClientRect().width).map(e=>{const r=e.getBoundingClientRect();return {w:r.width,h:r.height,x:r.x,right:r.right,y:r.y,bottom:r.bottom};}),icons:[...document.querySelectorAll('.book-entry>img')].map(e=>e.getBoundingClientRect().width)}));
  check(a.pages===2,'mobile '+tab+' is an open book');check(a.aspects.every(v=>v<=.02),'mobile '+tab+' fixed art aspect');check(a.buttons.every(r=>r.w>=44&&r.h>=44&&r.x>=0&&r.right<=844&&r.y>=0&&r.bottom<=390),'mobile '+tab+' controls44px and safe');check(a.icons.every(w=>w>=48),'mobile '+tab+' readable effect icons');
  check(await p.evaluate(()=>{const b=document.querySelector('.panel-body').getBoundingClientRect();return [...document.querySelectorAll('.book-entry,.rule-entries article,.control-illustrations,.control-note')].filter(e=>e.getBoundingClientRect().height).every(e=>{const r=e.getBoundingClientRect();return r.top>=b.top&&r.bottom<=b.bottom+1;});}),'mobile '+tab+' content not cropped behind footer');
  await p.screenshot({path:dir+'after-mobile-guide-'+tab+'.png',scale:'css'});
 }
 await context.close();check(errors.length===0,'no native page errors');return {checks:checks.length,errors};
}
