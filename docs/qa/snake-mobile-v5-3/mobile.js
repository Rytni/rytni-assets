async page=>{
 const rows=[],failures=[],errors=[];let checks=0;
 for(const [width,height] of [[390,844],[393,873],[412,915]]){
  const context=await page.context().browser().newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:2}),p=await context.newPage();
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await p.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?preview=main-ready');await p.waitForFunction(()=>window.snakeProduct?.controller.hub);
  const capture=async name=>{await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.offsetWidth).map(i=>i.decode()));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});await p.screenshot({path:`docs/qa/snake-mobile-v5-3/${width}-${name}.png`,scale:'css'});};
  for(const [screen,tab,name] of [['main','basics','main'],['main','stress','status-stress'],['settings','sound','settings-sound'],['settings','game','settings-game'],['rating','basics','rating'],['rules','basics','guide-basics'],['rules','bonuses','guide-bonuses'],['rules','hazards','guide-hazards'],['mobile-gate','basics','gate']]){
   await p.evaluate(([screen,tab])=>{const c=snakeProduct.controller;if(tab==='stress')Object.assign(c.hub,{best_score:99999999,my_rank:9999});c.tab=tab;c.gateMode='ranked';c.show(screen);},[screen,tab]);await capture(name);
   const m=await p.evaluate(()=>{const root=document.documentElement,menu=document.querySelector('#menu'),panel=document.querySelector('.mobile-panel');const r=e=>e.getBoundingClientRect().toJSON();const text=[...menu.querySelectorAll('.mobile-stat b,.button-label,.mobile-shortcuts span,.tabs button')].filter(e=>e.offsetWidth).map(e=>{const range=document.createRange();range.selectNodeContents(e);return {text:e.textContent,box:r(e),ink:range.getBoundingClientRect().toJSON()};});return {layout:snakeProduct.controller.layout,width:root.clientWidth,scroll:root.scrollWidth,menuOverflow:menu.scrollWidth>menu.clientWidth,footer:panel?r(panel.querySelector('footer')):null,top3:!!document.querySelector('.tournament-preview'),text};});
   checks++;if(m.scroll>m.width||m.menuOverflow||m.layout!=='mobile-portrait'||m.top3||m.footer&&m.footer.bottom>height+.5||m.text.some(t=>t.ink.left<t.box.left-1||t.ink.right>t.box.right+1))failures.push({width,name,m});rows.push({width,name,...m});
  }
  // Real sliders apply to the existing mixer, and persist on device.
  await p.evaluate(()=>{snakeProduct.controller.tab='sound';snakeProduct.controller.show('settings');});await p.locator('#volume-master').fill('0.3');
  const volume=await p.evaluate(()=>({settings:snakeProduct.settings.master,mixer:snakeProduct.game.audio.volumes.master,saved:JSON.parse(localStorage.getItem('mushroom_snake_settings_v1')).master}));checks++;if(Object.values(volume).some(v=>v!==.3))failures.push({width,volume});
  // Actual user activation; fullscreen can succeed but portrait must not spend.
  await p.evaluate(()=>snakeProduct.controller.show('main'));await p.locator('[data-action=play]').click();await p.waitForFunction(()=>snakeProduct.controller.screen==='mobile-gate'&&!snakeProduct.controller.gatePending);
  const gate=await p.evaluate(()=>({run:!!snakeProduct.controller.run,screen:snakeProduct.controller.screen,remaining:snakeProduct.controller.hub.attempts_remaining}));checks++;if(gate.run||gate.remaining!==3)failures.push({width,gate});
  await p.locator('[data-action=gate-cancel]').click();checks++;if(await p.evaluate(()=>snakeProduct.controller.run!==null))failures.push({width,cancel:'spent'});
  await context.close();
 }
 return {checks,failures,errors,rows};
}
