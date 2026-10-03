async page=>{
 const browser=page.context().browser(),base='http://127.0.0.1:8773',url=base+'/arcade/snake-next/forest-training.html?qa=1',dir='docs/qa/forest-final-v3/';
 const baseline=await page.evaluate(async base=>(await fetch(base+'/docs/qa/forest-final-v3/baseline.json')).json(),base);
 const errors=[],warnings=[],failed=[],http=[],measurements=[],stacks=[];
 const assert=(ok,message)=>{if(!ok)throw Error(message);};
 const attach=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',e=>{if(e.type()==='warning'||e.type()==='error')warnings.push(e.text());});p.on('requestfailed',r=>failed.push(r.url()));p.on('response',r=>{if(r.status()>=400)http.push({url:r.url(),status:r.status()});});};
 const measure=async p=>{
  await p.waitForFunction(()=>{const g=forestTraining,r=g.root.getBoundingClientRect();return Math.abs(g.renderer.w-r.width)<1&&Math.abs(g.renderer.h-r.height)<1;});
  return p.evaluate(()=>({viewport:[innerWidth,innerHeight],layout:forestTraining.renderer.last,boxes:[...document.querySelectorAll('#game,#hud,#hud .stat,#effects,#hud button,#pad,#pad button')].map(n=>({id:n.id||n.dataset.action||n.dataset.dir||n.className,box:n.getBoundingClientRect().toJSON()}))}));
 };
 const fixture=(p,touch)=>p.evaluate(async touch=>{
  const g=forestTraining;g.touch=touch;g.start();g.stop();g.session=new g.preview.constructor({touch});const s=g.session,{createState}=await import('/arcade/snake-next/entry.js');
  const body=[],push=(x,y)=>body.push(x+y*28);for(let y=8;y>=5;y--)push(7,y);for(let x=8;x<=16;x++)push(x,5);for(let y=4;y>=2;y--)push(16,y);for(let x=17;x<=22;x++)push(x,2);
  s.state=createState({seed:56103,rules:s.rules,arena:s.arena,body:body.reverse(),direction:1,food:79});s.score=12400;s.combo=3;s.tick=1500;s.effects=[];s.pickups=[{kind:'focus',cell:117,ends:2700},{kind:'rush',cell:218,ends:2700}];s.portal.phase='armed';g.status='playing';g.show();g.render();
 },touch);
 const geometry=(m,b)=>{assert(JSON.stringify(m.layout)===JSON.stringify(b.layout),'Canonical cabinet/stage layout changed '+m.viewport);for(let i=0;i<m.boxes.length;i++)for(const key of ['x','y','width','height'])assert(Math.abs(m.boxes[i].box[key]-b.boxes[i].box[key])<.02,`${m.viewport} ${m.boxes[i].id} ${key}: ${m.boxes[i].box[key]} vs ${b.boxes[i].box[key]}`);};
 const effects=async(p,kinds)=>{
  await p.evaluate(kinds=>{const g=forestTraining;g.session.effects=kinds.map((kind,i)=>({kind,ends:1500+[600,720,420][i]}));g.render();},kinds);
  const checked=await p.evaluate(()=>{
   const panel=document.querySelector('#effects'),rail=panel.getBoundingClientRect(),slots=[...panel.children];
   const fits=slots.every(n=>{const r=n.getBoundingClientRect();return r.left>=rail.left&&r.right<=rail.right&&r.top>=rail.top&&r.bottom<=rail.bottom&&n.scrollHeight<=n.clientHeight;});
   const texts=[...panel.querySelectorAll('span,b')].filter(n=>getComputedStyle(n).display!=='none').map(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n),size=Math.max(1,Math.floor(parseFloat(s.fontSize)/7));return {text:n.textContent,width:r.width,inkWidth:(n.textContent.length*6-1)*size};});
   return {viewport:[innerWidth,innerHeight],count:panel.querySelectorAll('.effect').length,slots:slots.length,fits,texts,timers:[...panel.querySelectorAll('b')].map(n=>n.textContent),progress:[...panel.querySelectorAll('progress')].map(n=>n.value)};
  });
  stacks.push(checked);assert(checked.count===kinds.length&&checked.slots===3,'Wrong effect slots');assert(checked.fits,'Slots overflow '+JSON.stringify(checked));assert(checked.texts.every(t=>t.inkWidth<=t.width+1),'Bitmap text overflow '+JSON.stringify(checked));return checked;
 };
 for(const [width,height,touch] of [[1920,1080,false],[1366,768,false],[844,390,true]]){
  const ctx=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:touch,isMobile:touch}),p=await ctx.newPage();attach(p);await p.goto(url);await p.waitForFunction(()=>window.forestTraining);await fixture(p,touch);
  const original=baseline.find(b=>b.viewport[0]===width);let m=await measure(p);geometry(m,original);measurements.push(m);
  for(const kinds of [[],['focus'],['focus','harvest'],['focus','harvest','rush']]){await effects(p,kinds);geometry(await measure(p),original);}
  if(width===1920){
   await p.screenshot({path:dir+'03-desktop-stack-2-plus-1.png'});await effects(p,['focus']);await p.screenshot({path:dir+'02-desktop-1920.png'});
   const l=m.layout,r=m.boxes[0].box;await p.screenshot({path:'.playwright-cli/final-v3-floor.png',clip:{x:Math.ceil(r.x+l.arena.x+l.cell*2),y:Math.ceil(l.arena.y+l.cell*5),width:Math.floor(l.cell*4),height:Math.floor(l.cell*4)}});
  }
  if(touch){
   await p.screenshot({path:dir+'04-mobile-844.png'});
   const button=p.locator('#pad [data-dir="2"]'),box=await button.boundingBox();await p.mouse.move(box.x+22,box.y+22);await p.mouse.down();
   assert(await button.evaluate(n=>n.classList.contains('pressed')),'Real pointer press not applied');assert(await p.evaluate(()=>forestTraining.commands.some(c=>c.direction===2)),'D-pad did not submit canonical command');
   await p.screenshot({path:dir+'05-mobile-dpad-pressed.png'});await p.mouse.up();assert(await button.evaluate(n=>!n.classList.contains('pressed')),'Pressed state stuck');geometry(await measure(p),original);
  }
  // Same effect identity: verify the existing countdown/progress state still updates.
  await effects(p,['focus','harvest','rush']);await p.evaluate(()=>{forestTraining.session.tick+=60;forestTraining.render();});
  const countdown=await p.evaluate(()=>({values:[...document.querySelectorAll('#effects progress')].map(n=>n.value),timers:[...document.querySelectorAll('#effects b')].map(n=>n.textContent)}));
  assert(countdown.values.every(v=>v>0&&v<1)&&countdown.timers[0]===(touch?'9С':'9.0'),'Effect countdown/progress regression');
  // Short, affected lifecycle regression only; no soak or performance suite.
  await p.locator('[data-action=pause]').click();assert(await p.evaluate(()=>forestTraining.status==='paused'),'Pause regression');await p.locator('[data-action=resume]').click();await p.waitForFunction(()=>forestTraining.status==='playing');await p.locator('[data-action=pause]').click();
  await ctx.close();
 }
 const compare=await browser.newContext({viewport:{width:580,height:330},deviceScaleFactor:1}),c=await compare.newPage();attach(c);await c.goto(base+'/');
 await c.setContent(`<html><head><link rel="icon" href="data:,"></head><body style="margin:0;padding:12px;background:#041b15;color:#e2cf96;font:14px monospace;display:flex;gap:24px"><section><p>V2 · native runtime scale</p><img src="${base}/docs/qa/forest-cabinet-v2/04-floor-native.png"></section><section><p>V3 · native runtime scale</p><img src="${base}/.playwright-cli/final-v3-floor.png"></section></body></html>`);await c.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));await c.screenshot({path:dir+'01-floor-v2-v3-native.png'});await compare.close();
 const result={baselineCommit:'31efcd46d01a1aba10dff47e718304d08595fd2e',lockedGeometryUnchanged:true,measurements,stacks,errors,warnings,failed,http};
 const pending=page.waitForEvent('download');await page.evaluate(r=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)],{type:'application/json'}));a.download='measurements.json';a.click();},result);await(await pending).saveAs(dir+'measurements.json');
 assert(!errors.length&&!warnings.length&&!failed.length&&!http.length,'Console/network failures');return {lockedGeometryUnchanged:true,stacks:stacks.map(s=>({viewport:s.viewport,count:s.count,fits:s.fits,timers:s.timers})),errors,warnings,failed,http};
}
