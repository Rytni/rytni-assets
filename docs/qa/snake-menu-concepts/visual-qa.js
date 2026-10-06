// Native screenshots and presentation contracts. No gameplay score substitution.
async page=>{
 const browser=page.context().browser(),base='http://127.0.0.1:8775/arcade/snake-next/product/index.html',checks=[],errors=[],requests=[],warnings=[];
 const verify=(ok,name)=>{if(!ok)throw Error(name);checks.push(name);};
 const ctx=await browser.newContext({viewport:{width:1920,height:1080}}),p=await ctx.newPage();
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text());});p.on('response',r=>{if(r.status()>=400)requests.push(r.url());});
 const ready=async()=>{await p.waitForFunction(()=>document.querySelector('#product').dataset.screen!=='loading');await p.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));await Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{})));});};
 const capture=async(file,query='',w=1366,h=768)=>{await p.setViewportSize({width:w,height:h});await p.goto(base+query);await ready();await p.screenshot({path:'docs/qa/snake-menu-concepts/final/'+file+'.png',scale:'css'});};
 const targets=async()=>p.evaluate(()=>[...document.querySelectorAll('#menu button,#menu input,#menu summary')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {name:e.dataset.action||e.dataset.tab||e.id||e.textContent,w:r.width,h:r.height,x:r.x,y:r.y};}));
 for(const [w,h] of [[1920,1080],[1366,768],[844,390]]){
  await capture(w===844?'main-mobile':w===1920?'main-desktop':'main-1366','',w,h);
  verify(await p.evaluate(()=>document.documentElement.scrollHeight<=innerHeight&&document.documentElement.scrollWidth<=innerWidth),'Main no document scroll '+w);
  verify(await p.locator('#preview-controls:visible,.local-badge:visible').count()===0,'Default no DEV chrome '+w);
  const t=await targets();verify(t.every(e=>e.w>=44&&e.h>=44),'Main touch >=44 '+w);
  verify(t.every(e=>e.x>=0&&e.y>=0&&e.x+e.w<=w+1&&e.y+e.h<=h+1),'Main controls inside viewport '+w);
  verify(await p.evaluate(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0)),'All menu PNGs loaded '+w);
  verify(await p.locator('.title-scene>.board:visible').count()===(w===844?0:1),'Dedicated mobile Rating '+w);
 }
 for(const [file,query,w,h] of [['pause','?preview=pause-ranked',1366,768],['result-record','?preview=result-record',1920,1080],['how-to-play','?preview=rules-basics',1366,768],['settings','?preview=settings',1366,768]]){
  await capture(file,query,w,h);
  const t=await targets();verify(t.every(e=>e.w>=44&&e.h>=44),file+' targets >=44');
  verify(await p.locator('#preview-controls:visible,.local-badge:visible').count()===0,file+' preview has no QA chrome without qa=1');
  verify(t.every(e=>e.x>=0&&e.y>=0&&e.x+e.w<=w+1&&e.y+e.h<=h+1),file+' controls inside viewport');
 }
 await p.goto(base+'?qa=1');await p.waitForFunction(()=>window.snakeProduct);await p.evaluate(()=>snakeProduct.controller.show('rating'));await ready();await p.screenshot({path:'docs/qa/snake-menu-concepts/final/leaderboard.png',scale:'css'});
 // Same logic runs with QA enabled, but remove external chrome from clean captures.
 for(const file of ['pause','result-record','how-to-play','settings']){
  const query={pause:'pause-ranked','result-record':'result-record','how-to-play':'rules-basics',settings:'settings'}[file];
  await capture(file,'?preview='+query,file==='result-record'?1920:1366,file==='result-record'?1080:768);
  await p.evaluate(()=>{document.querySelector('#preview-controls').hidden=true;document.querySelector('.local-badge').hidden=true;});await ready();await p.screenshot({path:'docs/qa/snake-menu-concepts/final/'+file+'.png',scale:'css'});
 }
 await p.evaluate(()=>snakeProduct.controller.show('rating'));await ready();await p.screenshot({path:'docs/qa/snake-menu-concepts/final/leaderboard.png',scale:'css'});
 await p.setViewportSize({width:844,height:390});await p.goto(base+'?qa=1');await p.waitForFunction(()=>window.snakeProduct);await p.evaluate(()=>{document.querySelector('#preview-controls').hidden=true;document.querySelector('.local-badge').hidden=true;});
 for(const [screen,tab]of [['rules','basics'],['rules','bonuses'],['rules','hazards'],['settings','sound'],['settings','game'],['rating',''],['no-attempts',''],['mobile-gate','']]){
  await p.evaluate(([screen,tab])=>{snakeProduct.controller.tab=tab;snakeProduct.controller.show(screen);},[screen,tab]);await ready();
  const t=await targets();verify(t.every(e=>e.w>=44&&e.h>=44),'Mobile '+screen+'/'+tab+' touch >=44');
  verify(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile '+screen+'/'+tab+' no document overflow');
  // Dialogs intentionally scroll if needed, but no action is lost behind an unscrollable clip.
  for(const a of await p.locator('#menu button[data-action]').all()){await a.scrollIntoViewIfNeeded();verify(await a.isVisible(),'Mobile reachable '+await a.getAttribute('data-action'));}
 }
 // Pending source images must reserve dimensions rather than shift the scene.
 await p.goto(base);await ready();
 const before=await p.locator('.menu-hero').boundingBox();
 let release;await p.route('**/snake-hero.png*',async r=>{await new Promise(resolve=>release=resolve);await r.continue();});
 await p.evaluate(()=>document.querySelector('.menu-hero').src='/grib/mushroom-snake-menu-v1/snake-hero.png?uncached=1');
 await p.waitForFunction(()=>!document.querySelector('.menu-hero').complete);
 const after=await p.locator('.menu-hero').boundingBox();verify(Math.abs(before.height-after.height)<.01,'Hero reserved aspect while source pending');
 while(!release)await p.waitForTimeout(10);release();await p.locator('.menu-hero').evaluate(i=>i.decode());await p.unroute('**/snake-hero.png*');
 await ctx.close();verify(errors.length===0,'No console/page errors: '+errors.join('; '));verify(requests.length===0,'No HTTP asset failures: '+requests.join('; '));return {checks,errors,requests,warnings:[...new Set(warnings)]};
}
