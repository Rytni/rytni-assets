async page=>{
 const browser=page.context().browser(),dir='docs/qa/forest-composition/',scratch='.playwright-cli/';
 const errors=[],warnings=[],failed=[],http=[],measurements=[];
 const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
 const attach=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',e=>{if(e.type()==='warning')warnings.push(e.text());});p.on('requestfailed',r=>failed.push(r.url()));p.on('response',r=>{if(r.status()>=400)http.push({url:r.url(),status:r.status()});});};
 const url='http://127.0.0.1:8773/arcade/snake-next/forest-training.html?qa=1';
 const fixture=async(p,touch)=>p.evaluate(async touch=>{
  const g=forestTraining;g.touch=touch;g.start();g.stop();g.session=new g.preview.constructor({touch});const s=g.session,{createState}=await import('/arcade/snake-next/entry.js');
  const body=[],push=(x,y)=>body.push(x+y*28);for(let y=8;y>=5;y--)push(7,y);for(let x=8;x<=16;x++)push(x,5);for(let y=4;y>=2;y--)push(16,y);for(let x=17;x<=22;x++)push(x,2);
  s.state=createState({seed:56103,rules:s.rules,arena:s.arena,body:body.reverse(),direction:1,food:79});s.score=12400;s.combo=3;s.tick=1500;
  s.effects=[{kind:'focus',ends:1812}];s.pickups=[{kind:'focus',cell:117,ends:2700},{kind:'rush',cell:218,ends:2700}];s.portal.phase='armed';g.status='playing';g.show();g.render();
 },touch);
 const measure=async p=>p.evaluate(()=>({viewport:{w:innerWidth,h:innerHeight},stage:document.querySelector('#game').getBoundingClientRect().toJSON(),hud:document.querySelector('#hud').getBoundingClientRect().toJSON(),layout:forestTraining.renderer.last,body:Array.from(forestTraining.session.state.body).slice(0,forestTraining.session.state.length),targets:[...document.querySelectorAll('#pad button,#hud button')].map(b=>({label:b.ariaLabel,w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height}))}));
 const ctx=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1}),p=await ctx.newPage();attach(p);
 await p.goto(url);await p.waitForFunction(()=>window.forestTraining);await fixture(p,false);
 let m=await measure(p);measurements.push(m);assert(Math.abs(m.stage.height-m.stage.width*9/16)<1,'Embedded aspect changed');
 await p.screenshot({path:scratch+'forest-after-1920.png'});
 await p.screenshot({path:dir+'06-floor-native.png',clip:{x:Math.ceil(m.stage.x+m.layout.arena.x+m.layout.cell*2),y:Math.ceil(m.layout.arena.y+m.layout.cell*5),width:Math.floor(m.layout.cell*4),height:Math.floor(m.layout.cell*4)}});
 await p.locator('#hud').screenshot({path:dir+'07-hud-native.png'});
 const baselineBody=JSON.stringify(m.body),baselineHeight=m.stage.height;
 await p.evaluate(()=>{document.body.style.display='grid';document.body.style.height='1600px';document.body.style.alignItems='stretch';const below=document.createElement('p');below.id='below';below.textContent='Normal page content below game';document.body.append(below);});
 assert(Math.abs((await measure(p)).stage.height-baselineHeight)<1,'Tall grid parent stretched game');
 assert(await p.evaluate(()=>document.querySelector('#below').getBoundingClientRect().top>=document.querySelector('#game').getBoundingClientRect().bottom),'Page content overlaps stage');
 await p.evaluate(()=>{document.body.style.cssText='';document.querySelector('#below').remove();});
 await p.setViewportSize({width:1920,height:1440});assert(Math.abs((await measure(p)).stage.height-baselineHeight)<1,'Tall viewport stretched game');
 await p.setViewportSize({width:1366,height:768});m=await measure(p);measurements.push(m);assert(JSON.stringify(m.body)===baselineBody,'Resize mutated body');
 await p.evaluate(()=>{
  const g=forestTraining,l=g.renderer.last,r=g.root.getBoundingClientRect();
  const mark=(rect,color,label)=>{const d=document.createElement('div');d.className='qa-measure';Object.assign(d.style,{position:'absolute',pointerEvents:'none',left:rect.x+'px',top:rect.y+'px',width:rect.w+'px',height:rect.h+'px',border:'2px solid '+color,color,font:'12px monospace',zIndex:10});d.textContent=label;g.root.append(d);};
  mark({x:0,y:0,w:r.width,h:r.height},'#fff','STAGE '+r.width.toFixed(1)+' × '+r.height.toFixed(1));mark(l.hud,'#ffd667','HUD '+l.hud.w.toFixed(1)+' × '+l.hud.h);mark(l.arena,'#58eac2','ARENA '+l.arena.w.toFixed(1)+' × '+l.arena.h.toFixed(1));
  mark({x:0,y:l.cabinet.h,w:r.width,h:r.height-l.cabinet.h},'#b68dfa','OUTSIDE cabinet '+(r.height-l.cabinet.h).toFixed(1)+' px; unused INSIDE = 0 px');
 });
 await p.screenshot({path:dir+'03-after-1366-measured.png'});await p.evaluate(()=>document.querySelectorAll('.qa-measure').forEach(d=>d.remove()));
 await p.locator('[data-action=fullscreen]').click();await p.waitForFunction(()=>document.fullscreenElement);const full=await measure(p);assert(full.layout.cabinet.x>=-.5&&full.layout.cabinet.y>=-.5,'Fullscreen cabinet clipped');measurements.push({...full,mode:'fullscreen'});
 await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.fullscreenElement);
 // A short real user flow, not a broad replay/performance suite.
 await p.evaluate(()=>forestTraining.main());await p.locator('[data-action=start]').click();await p.waitForFunction(()=>forestTraining.session.state.tick>18);await p.keyboard.press('ArrowDown');await p.keyboard.press('Space');
 assert(await p.evaluate(()=>forestTraining.status==='paused'),'Pause failed');const paused=await p.evaluate(()=>forestTraining.session.hash());await p.waitForTimeout(100);assert(await p.evaluate(()=>forestTraining.session.hash())===paused,'Pause state changed');
 await p.locator('[data-action=resume]').click();await p.waitForFunction(()=>forestTraining.status==='playing');await p.keyboard.press('Space');await ctx.close();
 for(const [w,h,name] of [[844,390,'04-after-mobile-844.png'],[915,412,'05-after-mobile-915.png']]){
  const c=await browser.newContext({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:1}),q=await c.newPage();attach(q);
  await q.goto(url);await q.waitForFunction(()=>window.forestTraining);await fixture(q,true);const mobile=await measure(q);measurements.push(mobile);
  assert(mobile.targets.every(t=>t.w>=44&&t.h>=44),'Mobile target below 44px');assert(mobile.layout.cabinet.h<=h+1,'Mobile cabinet exceeds viewport');
  await q.screenshot({path:dir+name});await q.locator('#pad [data-dir="2"]').tap();assert(await q.evaluate(()=>forestTraining.commands.some(c=>c.direction===2)),'D-pad command missing');
  await q.locator('[data-action=pause]').tap();assert(await q.evaluate(()=>forestTraining.status==='paused'),'Touch pause failed');
  await q.locator('[data-action=resume]').tap();await q.waitForFunction(()=>forestTraining.status==='playing');await q.locator('[data-action=pause]').tap();await c.close();
 }
 // Whole TARGET is displayed only, never cropped or used to author runtime art.
 const gallery=await browser.newContext({viewport:{width:3616,height:1144},deviceScaleFactor:1}),g=await gallery.newPage();attach(g);
 for(const [file,label,own] of [['01-target-before.png','CURRENT BEFORE','/docs/qa/forest-training/composition-before.png'],['02-target-after-1920.png','AFTER 1920×1080','/.playwright-cli/forest-after-1920.png']]){
  await g.goto('http://127.0.0.1:8773/');await g.setContent(`<html><head><link rel="icon" href="data:,"></head><body style="margin:0;background:#071510;color:#eedfb7;font:16px monospace;display:flex;gap:24px"><section><h3>APPROVED TARGET — reference only (whole image)</h3><img src="http://127.0.0.1:8773/docs/qa/retro-v3/target-desktop.png"></section><section><h3>${label} — native 1920×1080 QA fixture</h3><img src="http://127.0.0.1:8773${own}"></section></body></html>`);
  await g.evaluate(()=>Promise.all([...document.images].map(im=>im.decode())));await g.screenshot({path:dir+file});
 }await gallery.close();
 const result={measurements,errors,warnings,failed,http,smoke:'embedded/tall parent/resize/fullscreen/keyboard/pause/resume/touch D-pad PASS'};
 const dlctx=await browser.newContext(),downloadPage=await dlctx.newPage();await downloadPage.goto(url);
 const promise=downloadPage.waitForEvent('download');await downloadPage.evaluate(result=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'}));a.download='measurements.json';a.click();},result);await(await promise).saveAs(dir+'measurements.json');await dlctx.close();
 assert(measurements.every(m=>m.layout.unusedInside<.001),'Gap inside cabinet');
 assert(!errors.length&&!warnings.length&&!failed.length&&!http.length,'Console/network failures');return {viewports:measurements.map(m=>({viewport:m.viewport,stage:m.stage,arena:m.layout.arena,hud:m.hud,cabinet:m.layout.cabinet,deadSpace:m.layout.deadSpace})),errors,warnings,failed,http,smoke:result.smoke};
}
