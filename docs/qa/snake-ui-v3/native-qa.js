async page => {
 const dir='docs/qa/snake-ui-v3/',checks=[],captures=[],errors=[];page.on('pageerror',e=>errors.push(e.message));await page.emulateMedia({reducedMotion:'reduce'});
 const check=(ok,name)=>{if(!ok)throw Error(name);checks.push(name);};
 async function inspect(label){
  await page.waitForFunction(()=>[...document.querySelectorAll('#menu img')].filter(e=>e.getBoundingClientRect().width).every(e=>e.complete&&e.naturalWidth>0));
  const metrics=await page.evaluate(()=>{
   const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};};
   const ornaments=[...document.querySelectorAll('.skin-corner,.skin-crest,.button-cap')].filter(e=>e.getBoundingClientRect().width).map(e=>({kind:e.className,...rect(e),nw:e.naturalWidth,nh:e.naturalHeight,ratioError:Math.abs((e.getBoundingClientRect().width/e.naturalWidth)/(e.getBoundingClientRect().height/e.naturalHeight)-1)}));
   const buttons=[...document.querySelectorAll('#menu button')].filter(e=>e.getBoundingClientRect().width).map(e=>{const r=rect(e),l=e.querySelector('.button-label');return {action:e.dataset.action,close:e.classList.contains('panel-close'),...r,font:parseFloat(getComputedStyle(e).fontSize),label:l?rect(l):null,overflow:l?l.scrollWidth>l.clientWidth+1:false};});
   return {screen:document.querySelector('#product').dataset.screen,viewport:[innerWidth,innerHeight],ornaments,buttons,overflow:document.documentElement.scrollWidth>innerWidth+1,panel:document.querySelector('.fantasy-panel')?rect(document.querySelector('.fantasy-panel')):null};
  });
  check(!metrics.overflow,label+': no horizontal overflow');
  for(const a of metrics.ornaments)check(a.nw>0&&a.ratioError<.012,label+': native aspect '+a.kind);
  for(const b of metrics.buttons){check(b.w>=44&&b.h>=44,label+': touch '+b.action);if(b.close)check(Math.abs(b.w-48)<.1&&Math.abs(b.h-48)<.1,label+': Close exactly 48x48');check(!b.overflow,label+': glyph safe '+b.action);check(b.y>=-1&&b.y+b.h<=metrics.viewport[1]+1,label+': controls in viewport '+b.action);if(b.label)check(b.label.x>=b.x+15&&b.label.x+b.label.w<=b.x+b.w-15||b.w===48,label+': label in art '+b.action);}
  await page.screenshot({path:dir+label+'.png',scale:'css'});captures.push({label,...metrics});
 }
 async function open(w,h){await page.setViewportSize({width:w,height:h});await page.goto('http://127.0.0.1:8775/arcade/snake-next/product/index.html?qa=1');await page.waitForFunction(()=>window.snakeProduct?.controller.screen==='main');await page.evaluate(()=>document.documentElement.classList.remove('dev-qa'));}
 await open(1920,1080);await page.locator('[data-action=fullscreen]').click();await page.waitForFunction(()=>!!document.fullscreenElement);await inspect('main-fullscreen');
 for(const [name,state]of [['pause','pause-training'],['restart','confirm-restart'],['settings','settings'],['guide','rules-basics'],['result','result-training'],['record','result-record'],['leaderboard','rating']]){
  await page.evaluate(async state=>{const p=snakeProduct;p.controller.abandon();if(state==='confirm-restart'){await p.fixture('pause-training');await p.controller.action('restart');}else if(state==='rating')p.controller.show('rating');else await p.fixture(state);},state);
  await inspect(name);
 }
 await page.evaluate(async()=>{snakeProduct.controller.abandon();await snakeProduct.controller.start('training');snakeProduct.controller.pause();document.querySelector('#product-overlay').style.visibility='hidden';});
 const gf=page.frames().find(f=>f.url().includes('/product/frame.html'));
 const shell=await gf.evaluate(()=>{const g=snakeProductGame,l=g.renderer.last,r=document.querySelector('.product-lower-rail'),h=g.root.getBoundingClientRect().height;return {viewport:[g.renderer.w,h],cabinet:l.cabinet,rail:r.hidden?null:r.getBoundingClientRect().toJSON(),cell:l.cell,free:r.querySelector('[data-rail-free]').textContent};});
 check(shell.rail&&shell.rail.height>32,'fullscreen surplus is authored rail');check(shell.cabinet.h+shell.rail.height>=shell.viewport[1]*.95,'intentional shell >=95%');await page.screenshot({path:dir+'gameplay-fullscreen.png'});captures.push({label:'gameplay-fullscreen',shell});
 await page.evaluate(()=>document.exitFullscreen());await open(720,405);await inspect('main-embedded');
 await open(436,245);await inspect('main-compact');await page.evaluate(()=>snakeProduct.fixture('pause-training'));await inspect('pause-compact');
 await open(844,390);await page.locator('[data-action=fullscreen]').click();await page.waitForFunction(()=>!!document.fullscreenElement);await inspect('mobile-main');await page.evaluate(()=>snakeProduct.fixture('pause-training'));await inspect('mobile-pause');
 check(errors.length===0,'no page errors');await page.evaluate(()=>snakeProduct.controller.dispose());return {checks:checks.length,captures,errors};
}
