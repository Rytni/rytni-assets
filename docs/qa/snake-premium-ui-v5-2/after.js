async page=>{
 const dir='docs/qa/snake-premium-ui-v5-2/',checks=[],failures=[],errors=[],rows=[];
 const check=(ok,name,data)=>{checks.push(name);if(!ok)failures.push({name,data});};
 const browser=page.context().browser();
 for(const viewport of [{width:1920,height:1080},{width:1366,height:768},{width:1280,height:720},{width:844,height:390}]){
  const ctx=await browser.newContext({viewport}),p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await p.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?preview=main-ready');await p.waitForFunction(()=>window.snakeProduct?.controller.hub);
  const setup=async(screen,tab)=>{await p.evaluate(async({screen,tab})=>{const c=snakeProduct.controller;c.tab=tab;c.show(screen);await document.fonts.ready;await Promise.all([...document.querySelectorAll('#menu img')].map(i=>i.decode()));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));}, {screen,tab});await p.waitForFunction(()=>[...document.querySelectorAll('.title-scene,.fantasy-panel')].every(e=>Number(getComputedStyle(e).opacity)>=.999));};
  const probe=async()=>p.evaluate(()=>{
   const r=e=>e.getBoundingClientRect(),ink=e=>{const t=document.createRange();t.selectNodeContents(e);return t.getBoundingClientRect();};
   return {values:[...document.querySelectorAll('[data-record-place]')].map(e=>{const a=r(e),t=ink(e);return {text:e.textContent,font:Number.parseFloat(getComputedStyle(e).fontSize),plate:e.classList.contains('attached-value'),box:a.toJSON(),ink:t.toJSON(),overflow:e.scrollWidth>e.clientWidth+1};}),
    alignment:[...document.querySelectorAll('.shortcut')].map(e=>{const a=r(e.querySelector('img')),b=r(e.querySelector('.shortcut-label'));return {text:e.textContent,delta:Math.abs((a.left+a.right-b.left-b.right)/2)};}),
    podium:[...document.querySelectorAll('.ranking-podium .name')].map(e=>{const a=r(e),t=ink(e);return {text:e.textContent,bottomSafe:a.bottom-t.bottom,topSafe:t.top-a.top,font:Number.parseFloat(getComputedStyle(e).fontSize),height:a.height};}),
    settings:[...document.querySelectorAll('.setting-icon')].map(e=>{const a=r(e),b=r(e.closest('.panel-settings'));return {inset:a.left-b.left,rightInset:b.right-a.right};}),
    attempts:[...document.querySelectorAll('.title-scene .attempt-tray small')].map(e=>({text:e.textContent,fit:e.scrollWidth<=e.clientWidth+1})),
    viewport:[innerWidth,innerHeight],scroll:document.documentElement.scrollWidth>innerWidth+1};
  });
  await setup('main');
  for(const full of [false,true]){
   await p.evaluate(full=>{document.querySelector('#cabinet').classList.toggle('pseudo-fullscreen',full);Object.assign(snakeProduct.controller.hub,{best_score:6840,my_rank:7});},full);await setup('main');
   const m=await probe();check(m.alignment.every(a=>a.delta<=1),'shortcut centered '+viewport.width+' '+full,m.alignment);check(m.attempts.every(a=>a.fit),'attempt headings '+viewport.width+' '+full,m.attempts);
   if(full)await p.screenshot({path:dir+'after-main-'+viewport.width+'.png',scale:'css'});
   for(const score of [0,999,9999,99999,999999,1000000,9999999,99999999])for(const rank of [1,99,999,3000,9999]){
    await p.evaluate(({score,rank})=>{Object.assign(snakeProduct.controller.hub,{best_score:score,my_rank:rank});snakeProduct.controller.emit();},{score,rank});
    await p.waitForFunction(()=>[...document.querySelectorAll('[data-record-place]')].every(e=>e.style.fontSize));const m=await probe();
    check(m.values.every(v=>v.font>=16&&!v.overflow&&v.ink.left>=v.box.left-1&&v.ink.right<=v.box.right+1&&v.box.left>=0&&v.box.right<=m.viewport[0]), 'measured values '+viewport.width+' '+full+' '+score+' '+rank,m.values);
    if(score===99999999&&rank===9999){rows.push({viewport,full,stress:m});if(full){await p.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.title-scene')).opacity)>=.999);await p.screenshot({path:dir+'after-stress-'+viewport.width+'.png',scale:'css'});}}
   }
  }
  await setup('settings','sound');const s=await probe();check(s.settings.every(a=>a.inset>=40),'settings icons inside metal '+viewport.width,s.settings);await p.screenshot({path:dir+'after-settings-'+viewport.width+'.png',scale:'css'});
  await setup('settings','game');await p.screenshot({path:dir+'after-settings-game-'+viewport.width+'.png',scale:'css'});await ctx.close();
 }
 // CSS zoom at 125% is explicit content zoom, independently crossed with DPR.
 for(const dpr of [1,1.5,2])for(const zoom of [1,1.25]){
  const ctx=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:dpr}),p=await ctx.newPage();await p.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?preview=main-ready');await p.waitForFunction(()=>window.snakeProduct?.controller.hub);
  const data=await p.evaluate(async zoom=>{document.body.style.zoom=zoom;const names=['Лесной гость','Грибная королева','Тихий мицелий','Хранитель волшебного леса','А'.repeat(30)],c=snakeProduct.controller;const rows=[];
   for(let offset=0;offset<names.length;offset++){c.hub.leaderboard.slice(0,3).forEach((p,i)=>p.name=names[(i+offset)%names.length]);c.show('rating');await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));for(const e of document.querySelectorAll('.ranking-podium .name')){const r=e.getBoundingClientRect(),t=document.createRange();t.selectNodeContents(e);const ink=t.getBoundingClientRect();rows.push({name:e.textContent,top:(ink.top-r.top)/zoom,bottom:(r.bottom-ink.bottom)/zoom,height:r.height/zoom});}}return rows;},zoom);
  check(data.every(r=>r.bottom>=2&&r.top>=0),'TOP3 vertical safety DPR '+dpr+' zoom '+zoom,data);rows.push({dpr,zoom,podium:data});
  await p.waitForFunction(()=>[...document.querySelectorAll('.fantasy-panel')].every(e=>Number(getComputedStyle(e).opacity)>=.999));if(dpr===1&&zoom===1)await p.screenshot({path:dir+'after-rating.png',scale:'css'});await ctx.close();
 }
 return {checks:checks.length,failures,errors,rows};
}
