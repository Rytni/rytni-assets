async (page,{live=false}={})=>{
 const failures=[],errors=[],baseline=[],rows=[];let checks=0;
 const dir='docs/qa/snake-mobile-v5-3/',tag=live?'live':'host';
 const expected=(await(await page.request.get('http://127.0.0.1:8776/giveaway-test/manifest.json')).json()).current;
 for(const [width,height] of [[390,844],[393,873],[412,915],[1366,768]]){
  const mobile=width<500,c=await page.context().browser().newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1}),p=await c.newPage();
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400){if(r.url().includes('/auth/v1/health')&&r.status()===401)baseline.push('existing host auth health 401');else if(r.url().includes('/snake/')||r.url().includes('/grib/'))errors.push(r.status()+' '+r.url());}});
  p.on('console',m=>{if(m.type()==='error')(m.location().url.includes('/auth/v1/health')?baseline:errors).push(m.text());});
  if(!live)await p.route('**/giveaway-test/**',async route=>{const name=/\/giveaway-test\/([^?]+)/.exec(route.request().url())?.[1];if(!name||name.split('/').includes('..'))return route.abort();const ext=name.split('.').at(-1),type={html:'text/html',json:'application/json',js:'text/javascript',mjs:'text/javascript',css:'text/css',png:'image/png',ogg:'audio/ogg',wav:'audio/wav'}[ext]||'application/octet-stream';await route.fulfill({path:'giveaway-test/'+name,contentType:type,headers:{'Access-Control-Allow-Origin':'*'}});});
  await p.goto('https://rytni.live/testpodari?arcade_preview=1&progression_preview=1&ttq_preview=1&qa=1');await p.waitForSelector('#rytniProgressionHub',{state:'attached'});
  await p.evaluate(()=>{let e=document.querySelector('#rytniProgressionHub');while(e&&e!==document.body){e.hidden=false;if(getComputedStyle(e).display==='none')e.style.display='block';e=e.parentElement;}});await p.locator('[data-progression-tab=arcade]').click();await p.locator('[data-ms-action=game-snake]').click();await p.waitForFunction(()=>RytniArcadeHub.snakeScreen==='main');
  const f=p.frames().find(f=>f.url().includes('/snake/product/index.html'));
  if(!f.url().includes('/'+expected.snake_runtime.id+'/')){failures.push({width,actual:f.url(),expected:expected.snake_runtime.id});await c.close();continue;}
  const settle=async()=>{await f.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('#menu img')].map(e=>e.decode()));});await p.waitForTimeout(300);};
  await settle();
  const m=await f.evaluate(()=>({width:innerWidth,height:innerHeight,layout:document.querySelector('#cabinet').className,scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,menuScroll:document.querySelector('#menu').scrollWidth>document.querySelector('#menu').clientWidth,top3:!!document.querySelector('.tournament-preview')}));rows.push({width,height,m});checks++;if(m.scrollWidth>m.clientWidth||m.menuScroll||mobile&&(!m.layout.includes('mobile-portrait')||m.top3))failures.push({width,m});
  await p.locator('#msNextSnake').screenshot({path:dir+`${tag}-${width}-main.png`,scale:'css'});
  if(mobile){
   for(const action of ['settings','rating','rules']){
    await f.locator(`[data-action=${action}]`).first().tap();await settle();const mm=await f.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,footer:document.querySelector('.mobile-footer').getBoundingClientRect().toJSON(),height:innerHeight}));checks++;if(mm.scroll>mm.width||mm.footer.bottom>mm.height+.5)failures.push({width,action,mm});await p.locator('#msNextSnake').screenshot({path:dir+`${tag}-${width}-${action}.png`,scale:'css'});await f.locator('[data-action=back]').last().tap();await f.waitForFunction(()=>document.querySelector('#product').dataset.screen==='main');
   }
   await f.locator('[data-action=training]').first().click();await f.waitForFunction(()=>document.querySelector('#product').dataset.screen==='mobile-gate');await settle();checks++;if(await f.evaluate(()=>document.querySelector('#product').dataset.screen)!=='mobile-gate')failures.push({width,gate:'not shown'});
   await p.setViewportSize({width:height,height:width});await f.waitForFunction(()=>document.querySelector('#product').dataset.screen==='playing');await p.waitForFunction(()=>!!document.fullscreenElement||document.querySelector('#msNextStage').classList.contains('ms-next-full'));
   const game=p.frames().find(f=>f.url().includes('/product/frame.html'));await game.evaluate(()=>snakeProductGame.stop());await p.screenshot({path:dir+`${tag}-${height}-gameplay.png`,scale:'css'});
   const art=await game.evaluate(()=>[...document.querySelectorAll('#pad button')].map(b=>({text:b.textContent.trim(),fontSize:getComputedStyle(b).fontSize,width:b.getBoundingClientRect().width,height:b.getBoundingClientRect().height})));checks++;if(art.length!==4||art.some(b=>b.text||b.fontSize!=='0px'||b.width<64||b.height<64))failures.push({width,art});rows.push({width,art});
   for(const d of [2,1,0,3,2,1,0,3])await game.locator(`[data-dir="${d}"]`).tap();const input=await game.evaluate(()=>({queued:snakeProductGame.commands.length,status:snakeProductGame.status,pad:document.querySelector('#pad').getBoundingClientRect().toJSON()}));const pause=await f.evaluate(()=>({screen:document.querySelector('#product').dataset.screen,counts:snakePauseDiagnostics.counts}));checks++;if(input.queued!==8||pause.screen!=='playing'||Object.keys(pause.counts).length)failures.push({width,input,pause});rows.push({width,input,pause});
  }
  await c.close();
 }
 return {release:expected.id,runtime:expected.snake_runtime.id,live,checks,failures,errors,baseline,rows};
}
