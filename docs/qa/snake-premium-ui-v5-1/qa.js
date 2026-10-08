async (page,{phase='after'}={})=>{
 const dir='docs/qa/snake-premium-ui-v5-1/',inventory=[],checks=[],errors=[],failed=[],captures=[],legacy=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push([r.status(),r.url()]);});
 await page.emulateMedia({reducedMotion:'reduce'});
 const ready=async()=>{await page.waitForFunction(()=>window.snakeProduct);await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('#menu img')].map(i=>i.decode()));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});};
 const measure=async(name)=>{
  await ready();const data=await page.evaluate(()=>{
   const rows=[],walker=document.createTreeWalker(document.querySelector('#menu'),NodeFilter.SHOW_TEXT),rect=r=>({x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom});
   let n;while(n=walker.nextNode()){
    if(!n.textContent.trim())continue;const e=n.parentElement,s=getComputedStyle(e),box=e.getBoundingClientRect();if(!box.width||s.visibility==='hidden')continue;
    const range=document.createRange();range.selectNode(n);const text=range.getBoundingClientRect();if(!text.width)continue;
    const safe=e.matches('.button-label')?e.closest('button'):e;
    const ss=getComputedStyle(safe),b=safe.getBoundingClientRect(),p=[parseFloat(ss.paddingLeft)||0,parseFloat(ss.paddingTop)||0,parseFloat(ss.paddingRight)||0,parseFloat(ss.paddingBottom)||0];
    const safeRect={x:b.x+p[0],y:b.y+p[1],right:b.right-p[2],bottom:b.bottom-p[3]};
    const plaque=e.closest('.title-scene .attempt-tray,.title-scene .record-plaque');if(plaque){const p=plaque.getBoundingClientRect();safeRect.x=Math.max(safeRect.x,p.x+4);safeRect.y=Math.max(safeRect.y,p.y+4);safeRect.right=Math.min(safeRect.right,p.right-4);safeRect.bottom=Math.min(safeRect.bottom,p.bottom-4);}
    // Inline text may wrap intentionally; only one-line controls/values have
    // a no-wrap gate. Names are explicitly allowed to ellipsize, never scores.
    const gated=e.matches('.button-label,.shortcut-label,.score-value,.rank-value,.count,.score,.result-score,.primary-stats small,.primary-stats b,.ranking-summary,.board-own,.result-note,.motto,.attempt-tray small,.record-plaque small');
    const lines=[...range.getClientRects()].filter(r=>r.width>0).length;
    const scrollParent=e.closest('.page-content,.panel-body,.ranking-list');
    const role=e.matches('.result-score')?'DISPLAY SCORE':e.matches('h1')?'SCREEN TITLE':e.matches('h2,h3,h4')?'SECTION TITLE':e.matches('.button-label')?'BUTTON LABEL':e.matches('.score,.score-value,.rank-value,.count,.primary-stats b')?'VALUE':e.matches('.panel-rules .eyebrow')?'MICROCOPY':e.matches('small,.eyebrow')?'UI LABEL':e.matches('.control-note')?'MICROCOPY':'SECONDARY TEXT';
    rows.push({text:n.textContent.trim(),selector:e.className||e.tagName,role,container:rect(box),textRect:rect(text),safeTextRect:safeRect,font:s.fontFamily,fontSize:parseFloat(s.fontSize),lineHeight:s.lineHeight,alignment:s.textAlign,color:s.color,background:ss.backgroundColor,shadow:s.textShadow,overflow:s.overflow,whiteSpace:s.whiteSpace,wrap:lines,scrollRegion:!!scrollParent,gated,fit:!gated||text.x>=safeRect.x-1&&text.right<=safeRect.right+1&&text.y>=safeRect.y-2&&text.bottom<=safeRect.bottom+2&&lines===1});
   }
   const shortcuts=[...document.querySelectorAll('.shortcut')].map(e=>{const i=e.querySelector('img');return {src:i?.src,bg:getComputedStyle(e,':before').backgroundImage,display:getComputedStyle(e).display};});
   const extra=[];
   const overlap=(a,b)=>Math.min(a.right,b.right)-Math.max(a.x,b.x)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>1;
   for(const e of document.querySelectorAll('.btn:not(.btn-icon)')){const label=e.querySelector('.button-label'),icon=e.querySelector('.button-icon');if(icon&&label){const r=document.createRange();r.selectNodeContents(label);if(overlap(r.getBoundingClientRect(),icon.getBoundingClientRect()))extra.push('button icon overlap '+e.dataset.action);}}
   const labels=[...document.querySelectorAll('.shortcut-label')];for(let i=1;i<labels.length;i++)if(overlap(labels[i-1].getBoundingClientRect(),labels[i].getBoundingClientRect()))extra.push('shortcut label overlap');
   for(const e of document.querySelectorAll('.btn-icon .button-label'))if(getComputedStyle(e).display!=='none')extra.push('icon-only text exposed');
   for(const li of document.querySelectorAll('.ranking-list li')){const n=li.querySelector('.name'),score=li.querySelector('.score');if(n&&score&&overlap(n.getBoundingClientRect(),score.getBoundingClientRect()))extra.push('ranking name score overlap');}
   // Physical glass slots, measured from the locked top-three PNG. A text
   // node fitting its own DOM box must still not cross the painted divider.
   const board=document.querySelector('.tournament-preview');if(board&&board.getBoundingClientRect().width){const b=board.getBoundingClientRect(),slots=[[.35,.56],[.56,.78],[.78,.95]];[...board.querySelectorAll('.preview-leaders li')].forEach((li,i)=>{for(const e of li.querySelectorAll('span,b')){const r=document.createRange();r.selectNodeContents(e);const t=r.getBoundingClientRect();if(t.top<b.top+slots[i][0]*b.height+3||t.bottom>b.top+slots[i][1]*b.height-3)extra.push('TOP3 painted divider overlap row '+(i+1));}});}
   return {rows,shortcuts,extra,scroll:document.documentElement.scrollHeight>innerHeight+1||document.documentElement.scrollWidth>innerWidth+1};
  });inventory.push({name,...data});checks.push({name,failures:[...data.rows.filter(r=>!r.fit).map(r=>({text:r.text,selector:r.selector,textRect:r.textRect,safe:r.safeTextRect})),...data.extra.map(text=>({text}))],scroll:data.scroll});
  legacy.push({name,premium:data.shortcuts.every(r=>r.src?.includes('/mushroom-snake-ui-v5/')),shortcuts:data.shortcuts});return data;
 };
 const contrast=[];
 const capture=async name=>{await ready();await page.screenshot({path:dir+phase+'-'+name+'.png',scale:'css'});captures.push(phase+'-'+name+'.png');
  if(!name.endsWith('1366'))return;
  const samples=await page.evaluate(()=>[...document.querySelectorAll('.motto,.shortcut-label,.result-note,.result-share>span,.ranking-summary')].filter(e=>e.getBoundingClientRect().width).map(e=>{const r=document.createRange();r.selectNodeContents(e);const b=r.getBoundingClientRect();return {selector:e.className,text:e.textContent,rect:{x:b.x,y:b.y,w:b.width,h:b.height},color:getComputedStyle(e).color};}));
  // Remove only text paint, retain its localized scrim; measure the actual
  // composite behind its text box instead of guessing background from CSS.
  await page.evaluate(()=>{for(const e of document.querySelectorAll('.motto,.shortcut-label,.result-note,.result-share>span,.ranking-summary')){e.dataset.originalColor=e.style.color;e.dataset.originalShadow=e.style.textShadow;e.style.color='transparent';e.style.textShadow='none';}});
  await page.screenshot({path:dir+phase+'-'+name+'-contrast.png',scale:'css'});
  await page.evaluate(()=>{for(const e of document.querySelectorAll('[data-original-color]')){e.style.color=e.dataset.originalColor;e.style.textShadow=e.dataset.originalShadow;}});
  contrast.push({image:phase+'-'+name+'-contrast.png',samples});
 };
 const show=async name=>{await page.evaluate(async name=>{const c=snakeProduct.controller;if(name==='main'){c.show('main');}else if(name==='rating'){c.show('rating');}else if(name==='pause'){c.run={mode:'training'};c.show('pause');}else if(name.startsWith('confirm')){c.run={mode:'training'};c.show(name);}else await snakeProduct.fixture(name);},name);await ready();};
 const scores=[0,999,9999,99999,999999,1000000,9999999,99999999],ranks=[1,99,999,3000,9999];
 for(const [width,height] of [[1920,1080],[1366,768],[1280,720],[844,390],[720,405]]){
  await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?preview=main-ready');await ready();
  // Full stage without requiring native fullscreen to change test viewport.
  await page.evaluate(()=>document.querySelector('#cabinet').classList.add('pseudo-fullscreen'));
  await measure('Main '+width);if([1366,844].includes(width))await capture('main-'+width);
  for(const sponsor of [true,false]){await page.evaluate(sponsor=>{const c=snakeProduct.controller;c.hub.attempts_remaining=0;c.hub.sponsor_attempt_credits=0;c.hub.sponsor_attempt_available=sponsor;c.emit();},sponsor);await measure('Main '+width+(sponsor?' sponsor':' exhausted'));}
  await page.evaluate(()=>{const c=snakeProduct.controller;c.hub.attempts_remaining=3;c.emit();});
  for(const score of scores)for(const rank of ranks){await page.evaluate(([score,rank])=>{const c=snakeProduct.controller;c.hub.best_score=score;c.hub.my_rank=rank;c.emit();},[score,rank]);await measure('Main '+width+' '+score+' '+rank);}
  if(width===1366)await capture('main-stress');
  await page.evaluate(()=>{const c=snakeProduct.controller;c.hub.leaderboard=Array.from({length:3},(_,i)=>({place:i+1,name:'Хранитель_волшебного_леса_2026',score:99999999,is_me:i===2}));c.emit();});await measure('Main TOP3 long names max scores '+width);
  await page.evaluate(()=>{const c=snakeProduct.controller;const names=['Вы','Лесной гость','Грибная королева','Хранитель волшебного леса','Повелитель_Изумрудного_Леса_2026'];c.hub.leaderboard=Array.from({length:10},(_,i)=>({place:i+1,name:names[i%5],score:99999999,is_me:i===3}));c.show('rating');});
  await measure('Ranking stress '+width);if([1366,844].includes(width))await capture('ranking-'+width);
  await page.locator('.ranking-list').evaluate(e=>e.scrollTop=e.scrollHeight);await measure('Ranking last rows '+width);
  for(const state of ['result-normal','result-training','result-record']){
   await show(state);await measure(state+' '+width);if([1366,844].includes(width))await capture(state+'-'+width);
   for(const score of scores){await page.evaluate(score=>{const c=snakeProduct.controller;c.result.stats.score=score;c.hub.best_score=Math.max(score,c.hub.best_score);if(c.result.accepted)c.result.response.score=score;c.emit();},score);await measure(state+' '+width+' '+score);}
  }
  await page.evaluate(()=>{const c=snakeProduct.controller;c.result.training=false;c.result.accepted=false;c.result.record=false;c.emit();});await measure('Result retry '+width);
  for(const state of ['settings','rules-basics','rules-bonuses','rules-hazards','pause','confirm-restart','confirm-exit','no-attempts','mobile-gate']){
   await show(state);await measure(state+' '+width);if(state==='settings'&&[1366,844].includes(width))await capture(state+'-'+width);
  }
  await show('settings');await page.locator('summary').click();await measure('Settings sliders '+width);await page.locator('[data-tab=game]').click();await measure('Settings game '+width);if([1366,844].includes(width))await capture('settings-game-'+width);
  const settingsFit=await page.evaluate(()=>{const rows=[...document.querySelectorAll('.setting-title')].map(e=>{const i=e.querySelector('img').getBoundingClientRect(),h=e.querySelector('h3').getBoundingClientRect(),p=e.querySelector('p').getBoundingClientRect(),b=e.querySelector('button').getBoundingClientRect();return {ix:i.x,hx:h.x,px:p.x,right:b.right,descriptionVisible:p.width>0&&p.height>0};});return rows.every(r=>r.descriptionVisible&&Math.abs(r.ix-rows[0].ix)<1&&Math.abs(r.hx-rows[0].hx)<1&&Math.abs(r.px-rows[0].px)<1&&Math.abs(r.right-rows[0].right)<1);});
  checks.push({name:'Settings shared grid '+width,failures:settingsFit?[]:[{text:'settings grid'}],scroll:false});
  await page.locator('.setting-title [data-action=fullscreen]').scrollIntoViewIfNeeded();checks.push({name:'Settings last row reachable '+width,failures:await page.locator('.setting-title [data-action=fullscreen]').evaluate(e=>{const b=e.getBoundingClientRect(),p=e.closest('.panel-body').getBoundingClientRect();return b.y>=p.y&&b.bottom<=p.bottom+1;})?[]:[{text:'settings clipped control'}],scroll:false});
 }
 // Button alignment sheet: explicit QA fixture using actual runtime buttons,
 // not a replacement production layout or authored artwork.
 await page.setViewportSize({width:1366,height:768});await show('pause');
 await page.evaluate(()=>{const template=document.querySelector('.btn-play').cloneNode(true),menu=document.querySelector('#menu');menu.innerHTML='';const sheet=document.createElement('div');sheet.style.cssText='display:grid;grid-template-columns:repeat(3,390px);gap:14px;background:#061c1ae8;padding:28px';for(const text of ['ИГРАТЬ','ТРЕНИРОВКА','ОТКРЫТЬ РЕЙТИНГ','НОВАЯ ТРЕНИРОВКА','СЫГРАТЬ СНОВА','ГЛАВНОЕ МЕНЮ','ПРОДОЛЖИТЬ','НАЧАТЬ ЗАНОВО','НАСТРОЙКИ','ПОНЯТНО','ГОТОВО']){const b=template.cloneNode(true);b.style.cssText='width:390px;height:64px';b.querySelector('.button-label').textContent=text;sheet.append(b);}menu.append(sheet);});await measure('Button sheet');await capture('buttons');
 const failures=checks.filter(c=>c.failures.length||c.scroll);
 return {phase,checks:checks.length,failedChecks:failures.length,failures,inventory,captures,legacy,contrast,errors,failed};
}
