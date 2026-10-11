async(page,{live=false,before=false}={})=>{
 const dir='docs/qa/snake-premium-ui-v5-2-1/',tag=before?'before-host':live?'live':'host',rows=[],failures=[],errors=[],failed=[],baseline=[];let checks=0;
 const expected=(await(await page.request.get('http://127.0.0.1:8776/giveaway-test/manifest.json')).json()).current;
 for(const viewport of [{width:1920,height:1080},{width:1366,height:768},{width:1280,height:720},{width:844,height:390}]){
  const ctx=await page.context().browser().newContext({viewport,hasTouch:viewport.width===844,isMobile:viewport.width===844}),p=await ctx.newPage();
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')(m.location().url.includes('/auth/v1/health')?baseline:errors).push(m.text());});p.on('response',r=>{if(r.status()>=400)(r.url().includes('/auth/v1/health')?baseline:failed).push([r.status(),r.url()]);});
  if(!live)await p.route('**/giveaway-test/**',async r=>{const name=new RegExp('/giveaway-test/([^?]+)').exec(r.request().url())?.[1];if(!name||name.split('/').includes('..'))return r.abort();const ext=name.split('.').at(-1),type={html:'text/html',json:'application/json',js:'text/javascript',mjs:'text/javascript',css:'text/css',png:'image/png',ogg:'audio/ogg',wav:'audio/wav'}[ext]||'application/octet-stream';await r.fulfill({path:'C:/GitHub/rytni-assets/giveaway-test/'+name,contentType:type,headers:{'Access-Control-Allow-Origin':'*'}});});
  await p.goto('https://rytni.live/testpodari?arcade_preview=1&progression_preview=1&ttq_preview=1');await p.waitForSelector('#rytniProgressionHub',{state:'attached'});
  await p.evaluate(()=>{let e=document.querySelector('#rytniProgressionHub');while(e&&e!==document.body){e.hidden=false;if(getComputedStyle(e).display==='none')e.style.display='block';e=e.parentElement;}});await p.locator('[data-progression-tab=arcade]').click();await p.locator('#msHub').scrollIntoViewIfNeeded();await p.locator('[data-ms-action=game-snake]').click();await p.waitForFunction(()=>RytniArcadeHub.snakeScreen==='main');
  const f=p.frames().find(f=>f.url().includes('/snake/product/index.html'));
  if(!f.url().includes('/'+expected.snake_runtime.id+'/'))failures.push({name:'runtime identity',url:f.url()});
  const settle=async()=>{await f.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('#menu img')].map(e=>e.decode()));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});await f.waitForFunction(()=>[...document.querySelectorAll('.title-scene,.fantasy-panel')].every(e=>Number(getComputedStyle(e).opacity)>=.999));};
  const metric=()=>f.evaluate(()=>{const b=e=>e.getBoundingClientRect().toJSON(),scene=b(document.querySelector('.title-scene')),dock=document.querySelector('.lower-status-dock');return {size:[innerWidth,innerHeight],scene,dock:dock?b(dock):null,children:[...document.querySelectorAll('.attempt-tray,.record-safe,.rank-safe')].map(b),values:[...document.querySelectorAll('[data-record-place]')].map(e=>({box:b(e),owner:b(e.closest('.value-box')),text:e.textContent,font:parseFloat(getComputedStyle(e).fontSize)}))};});
  const gate=m=>{checks++;const inside=b=>b.left>=m.scene.left+8-.1&&b.right<=m.scene.right-8+.1&&b.bottom<=m.scene.bottom-8+.1,overlap=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>.5&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>.5;if(!before&&(!m.dock||!inside(m.dock)||!m.children.every(inside)||!m.children.every((a,i)=>m.children.slice(i+1).every(b=>!overlap(a,b)))||!m.values.every(v=>v.font>=16&&v.box.left>=v.owner.left-.5&&v.box.right<=v.owner.right+.5)))failures.push({viewport,m});};
  for(const full of [false,true]){
   if(full){await f.locator('[data-action=fullscreen]').click();await p.waitForFunction(()=>!!document.fullscreenElement);await f.waitForFunction(()=>Math.abs(document.querySelector('#cabinet').clientWidth-innerWidth)<2);}
   for(const stress of [false,true]){
    await f.evaluate(async stress=>{document.querySelector('.score-value').textContent=stress?'99 999 999':'6 840';document.querySelector('.rank-value').textContent=stress?'№9999':'№7';await document.fonts.ready;const {RecordPlaceValue}=await import(new URL('./record-place-value.js',location.href));RecordPlaceValue.prototype.fit.call({root:document.querySelector('#menu'),stage:document.querySelector('#cabinet')});},stress);await settle();
    const m=await metric();gate(m);rows.push({viewport,full,stress,...m});const path=dir+tag+'-'+viewport.width+'-'+(full?'fullscreen':'embedded')+'-'+(stress?'stress':'normal')+'.png';if(full)await p.screenshot({path,scale:'css'});else await p.locator('#msNextSnake').screenshot({path,scale:'css'});
   }
  }
  // Verify real Settings entry/return within the current host and fullscreen.
  await f.locator('[data-action=settings]').first().click();await settle();await p.screenshot({path:dir+tag+'-'+viewport.width+'-settings.png',scale:'css'});await f.locator('.fantasy-panel>.actions [data-action=back]').click();await f.waitForFunction(()=>document.querySelector('#product').dataset.screen==='main');
  await p.evaluate(()=>document.exitFullscreen());await p.evaluate(()=>RytniArcadeHub.leave());checks++;if(!await p.locator('#msHub').isVisible())failures.push({name:'return to host',viewport});await ctx.close();
 }
 return {checks,failures,errors,failed,baseline,expected:expected.id,rows};
}
