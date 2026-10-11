async (page,{before=false}={})=>{
 const dir='docs/qa/snake-premium-ui-v5-2-1/',tag=before?'before':'after',rows=[],failures=[],errors=[];let checks=0;
 const cases=[['embedded-1118',1118,629],['embedded-720',720,405],['fullscreen-1920',1920,1080],['fullscreen-1366',1366,768],['fullscreen-1280',1280,720],['mobile-844',844,390]];
 for(const [name,width,height] of cases){
  const ctx=await page.context().browser().newContext({viewport:{width,height},hasTouch:width===844,isMobile:width===844}),p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await p.goto('http://127.0.0.1:8776/'+(before?'giveaway-test/releases/snake-next-8d3f1e254a4b/snake/product/':'arcade/snake-next/product/')+'index.html?preview=main-ready');await p.waitForFunction(()=>window.snakeProduct?.controller.hub);
  await p.evaluate(()=>document.querySelector('#cabinet').classList.add('pseudo-fullscreen'));
  const settle=async()=>{await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('#menu img')].map(e=>e.decode()));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});await p.waitForFunction(()=>[...document.querySelectorAll('.title-scene,.fantasy-panel,.primary-stats>div')].every(e=>Number(getComputedStyle(e).opacity)>=.999));};
  const probe=()=>p.evaluate(()=>{
   const box=e=>e.getBoundingClientRect().toJSON(),range=e=>{const r=document.createRange();r.selectNodeContents(e);return r.getBoundingClientRect().toJSON();};
   return {scene:box(document.querySelector('.title-scene')||document.querySelector('#cabinet')),dock:document.querySelector('.lower-status-dock')?box(document.querySelector('.lower-status-dock')):null,children:[...document.querySelectorAll('.attempt-tray,.record-safe,.rank-safe')].map(e=>({class:e.className,box:box(e)})),headings:[...document.querySelectorAll('.attempt-tray small')].map(e=>({text:e.textContent,ink:range(e),box:box(e.parentElement)})),values:[...document.querySelectorAll('[data-record-place]')].map(e=>({text:e.textContent,font:parseFloat(getComputedStyle(e).fontSize),plate:e.classList.contains('attached-value'),ink:range(e),box:box(e),owner:box(e.closest('.value-box'))})),settings:[...document.querySelectorAll('.setting-icon')].map(e=>({box:box(e),panel:box(e.closest('.panel-settings')),frame:box(e.closest('.panel-settings').querySelector('.skin-left')),src:e.src})),result:[...document.querySelectorAll('.result-note,.primary-stats,.primary-stats>div,.primary-stats b')].map(e=>({class:e.className,background:getComputedStyle(e).background,shadow:getComputedStyle(e).boxShadow,clip:getComputedStyle(e).clipPath,before:getComputedStyle(e,'::before').background,box:box(e)}))};
  });
  await p.evaluate(()=>{Object.assign(snakeProduct.controller.hub,{best_score:6840,my_rank:7});snakeProduct.controller.show('main');});await settle();
  rows.push({name,state:'normal',...(await probe())});await p.screenshot({path:dir+tag+'-'+name+'-main.png',scale:'css'});
  for(const score of (before?[99999999]:[6840,99999,999999,1000000,99999999]))for(const rank of (before?[9999]:[7,99,999,3000,9999])){
   await p.evaluate(({score,rank})=>{Object.assign(snakeProduct.controller.hub,{best_score:score,my_rank:rank});snakeProduct.controller.emit();},{score,rank});await settle();await p.waitForFunction(()=>[...document.querySelectorAll('[data-record-place]')].every(e=>e.style.fontSize));
   const m=await probe();rows.push({name,state:'stress',score,rank,...m});
   if(!before){const safe=m.scene,inside=b=>b.left>=safe.left+8-.1&&b.right<=safe.right-8+.1&&b.top>=safe.top&&b.bottom<=safe.bottom-8+.1,overlap=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>.5&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>.5;const good=m.dock&&inside(m.dock)&&m.children.every(c=>inside(c.box))&&m.children.every((a,i)=>m.children.slice(i+1).every(b=>!overlap(a.box,b.box)))&&m.values.every(v=>v.font>=16&&v.box.left>=v.owner.left-.5&&v.box.right<=v.owner.right+.5&&v.ink.left>=v.box.left-.5&&v.ink.right<=v.box.right+.5)&&m.headings.every(h=>h.ink.left>=h.box.left-.5&&h.ink.right<=h.box.right+.5);checks++;if(!good)failures.push({name,score,rank,m});}
   if(score===99999999&&rank===9999){await p.screenshot({path:dir+tag+'-'+name+'-stress.png',scale:'css'});if(!before){await p.evaluate(()=>{for(const [i,e] of [...document.querySelectorAll('.lower-status-dock,.attempt-tray,.record-safe,.rank-safe,.value-box')].entries()){e.style.outline='1px solid '+(i?'#65ffff':'#ff6688');}});await p.screenshot({path:dir+'overlay-'+name+'.png',scale:'css'});}}
  }
  for(const state of ['result-record','settings']){
   await p.goto('http://127.0.0.1:8776/'+(before?'giveaway-test/releases/snake-next-8d3f1e254a4b/snake/product/':'arcade/snake-next/product/')+'index.html?preview='+(state==='result-record'?'result-record':'main-ready'));
   await p.waitForFunction(()=>window.snakeProduct?.controller.hub);if(state==='settings')await p.evaluate(()=>snakeProduct.controller.show('settings'));await p.evaluate(()=>document.querySelector('#cabinet').classList.add('pseudo-fullscreen'));await settle();const stateMetric=await probe();rows.push({name,state,...stateMetric});
   if(!before&&state==='result-record'){checks++;if(stateMetric.result.some(b=>!b.background.startsWith('rgba(0, 0, 0, 0) none')))failures.push({name,state,backgrounds:stateMetric.result});}
   await p.screenshot({path:dir+tag+'-'+name+'-'+state+'.png',scale:'css'});
   if(state==='settings'&&width===844){await p.evaluate(()=>document.querySelector('.panel-settings .panel-body').scrollTop=999);await p.screenshot({path:dir+tag+'-'+name+'-settings-lower.png',scale:'css'});}
  }
  await ctx.close();
 }
 return {checks,failures,errors,rows};
}
