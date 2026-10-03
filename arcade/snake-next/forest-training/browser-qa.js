async page=>{
 const browser=page.context().browser(),context=await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:1}),p=await context.newPage();
 const errors=[],warnings=[],failed=[],http=[],requests=[];
 const collect=t=>{t.on('pageerror',e=>errors.push(e.message));t.on('console',e=>{if(e.type()==='warning')warnings.push(e.text());});t.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()}));t.on('request',r=>requests.push(r.url()));t.on('response',r=>{if(r.status()>=400)http.push({url:r.url(),status:r.status()});});};collect(p);
 const assert=(value,message)=>{if(!value)throw Error(message);},url='http://127.0.0.1:8773/arcade/snake-next/forest-training.html?qa=1',dir='docs/qa/forest-training/';
 await p.goto(url);await p.waitForFunction(()=>window.forestTraining);const result={};
 result.cold=await p.evaluate(()=>forestTraining.summary());await p.locator('[data-action=help]').click();await p.locator('[data-action=back]').click();
 await p.locator('[data-action=settings]').click();await p.locator('[data-volume=music]').fill('0.4');await p.locator('[data-action=back]').click();
 await p.locator('[data-action=start]').click();await p.waitForFunction(()=>forestTraining.session.foods===1);
 await p.screenshot({path:dir+'desktop-normal.png'});await p.keyboard.press('Space');
 const paused=await p.evaluate(()=>forestTraining.session.hash());await p.waitForTimeout(250);assert(await p.evaluate(()=>forestTraining.session.hash())===paused,'Pause changed hash');
 await p.locator('[data-action=settings]').click();await p.locator('[data-action=back]').click();
 const pickup=async kind=>{
   await p.evaluate(async kind=>{const g=forestTraining,s=g.session,{neighbour}=await import('/arcade/snake-next/simulation/rules.js');
     const next=neighbour(s.state.body[s.state.headIndex],s.state.direction,s.arena.width,s.arena.height);s.pickups=[{kind,cell:next,ends:s.tick+1200}];},kind);
   await p.locator('[data-action=resume]').click();await p.waitForFunction(kind=>forestTraining.log.some(e=>e.effect===kind),kind);await p.keyboard.press('Space');
 };
 await pickup('focus');await p.evaluate(()=>{forestTraining.status='playing';forestTraining.show();forestTraining.render();});await p.screenshot({path:dir+'positive.png'});await p.evaluate(()=>{forestTraining.status='paused';forestTraining.show();});
 await pickup('harvest');await pickup('rush');
 const ends=await p.evaluate(()=>forestTraining.session.effects.find(e=>e.kind==='focus').ends);
 await p.evaluate(()=>{forestTraining.log=[];});await pickup('focus');assert(await p.evaluate(()=>forestTraining.session.effects.find(e=>e.kind==='focus').ends)>ends,'Duplicate did not refresh');
 result.stack=await p.evaluate(()=>forestTraining.session.summary());assert(result.stack.effects.length===3,'2+1 stack missing');
 await p.evaluate(()=>{forestTraining.status='playing';forestTraining.show();forestTraining.render();});await p.screenshot({path:dir+'stack-2-1.png'});await p.locator('#hud').screenshot({path:dir+'hud.png'});await p.evaluate(()=>{forestTraining.status='paused';forestTraining.show();});
 // Expiration uses real fixed ticks, on a roomy canonical body route; no wall-clock shortcuts in production.
 result.expiration=await p.evaluate(()=>{const s=forestTraining.session;s.tick=Math.max(...s.effects.map(e=>e.ends))+1;s.advance();return s.effects.length;});assert(result.expiration===0,'Effect expiration failed');
 result.portal=[];
 for(let i=0;i<30;i++){
   await p.evaluate(async i=>{const g=forestTraining;g.stop();const s=g.session,{createState}=await import('/arcade/snake-next/entry.js');
     const entry=s.portals[i%2],direction=i%2?3:1,head=entry+(direction===1?-1:1),body=Array.from({length:8},(_,n)=>head+(direction===1?-n:n));
     s.state=createState({seed:56103,rules:s.rules,arena:s.arena,body,direction});s.status='playing';s.tick+=600;s.effects=[];s.pickups=[];s.portal.phase='armed';s.portal.elapsed=0;s.repairFood();g.status='paused';g.show();},i);
   await p.locator('[data-action=resume]').click();await p.waitForFunction(()=>forestTraining.session.portal.phase==='entering');
   if(i===0)await p.screenshot({path:dir+'portal-entry.png'});
   await p.waitForFunction(()=>forestTraining.session.portal.phase==='exit-grace');
   if(i===0)await p.screenshot({path:dir+'portal-exit.png'});
   await p.keyboard.press('Space');result.portal.push(await p.evaluate(()=>({...forestTraining.session.portal})));
 }
 assert(result.portal.at(-1).transfers===30,'Portal count not 30');assert(result.portal.at(-1).rejected===0,'Legal exit rejected');
 result.portalPause=[];for(const phase of ['inactive','armed','entering','teleport','exit-grace','cooldown']){
   result.portalPause.push(await p.evaluate(phase=>{const g=forestTraining;g.session.portal.phase=phase;g.status='playing';g.pause();const summary=g.summary();g.start();g.pause();return {phase,paused:{raf:summary.raf,timers:summary.timers,audio:summary.audio.sources},restarted:g.session.portal.phase};},phase));
 }
 await p.evaluate(()=>{forestTraining.start();});await p.waitForFunction(()=>forestTraining.status==='dying');await p.screenshot({path:dir+'death-impact.png'});
 await p.waitForFunction(()=>forestTraining.status==='result');await p.screenshot({path:dir+'result.png'});result.death=await p.evaluate(()=>forestTraining.summary());
 await p.locator('[data-action=restart]').click();assert(await p.evaluate(()=>forestTraining.starts>1&&forestTraining.session.effects.length===0),'Restart dirty');await p.keyboard.press('Space');
 const body=await p.evaluate(()=>Array.from(forestTraining.session.state.body));await p.setViewportSize({width:1920,height:1080});
 assert(await p.evaluate(body=>JSON.stringify(Array.from(forestTraining.session.state.body))===JSON.stringify(body),body),'Resize changed body');
 await p.locator('[data-action=fullscreen]').click();assert(await p.evaluate(()=>!!document.fullscreenElement),'Fullscreen entry failed');await p.keyboard.press('Escape');
 await p.waitForFunction(()=>!document.fullscreenElement);result.fullscreen='PASS';
 await p.evaluate(()=>{forestTraining.status='playing';forestTraining.show();forestTraining.render();});await p.screenshot({path:dir+'desktop-1920.png'});
 await p.evaluate(()=>forestTraining.main());result.cleanup=await p.evaluate(()=>forestTraining.summary());
 const before=requests.length;await p.locator('[data-action=start]').click();await p.keyboard.press('Space');await p.locator('[data-action=main]').click();
 result.repeatRequests=requests.slice(before).filter(u=>u.includes('/grib/')||u.includes('/audio/'));
 assert(result.cleanup.raf===0&&result.cleanup.timers===0&&result.cleanup.audio.sources===0&&result.cleanup.activeSessions===0,'Main retained runtime');
 assert(result.repeatRequests.length===0,'Repeat entry loaded assets again');
 result.mobile=[];
 for(const viewport of [{width:844,height:390},{width:915,height:412}]){
   const c=await browser.newContext({viewport,deviceScaleFactor:2,isMobile:true,hasTouch:true}),m=await c.newPage();collect(m);
   await m.goto(url);await m.waitForFunction(()=>window.forestTraining);await m.locator('[data-action=start]').click();await m.waitForFunction(()=>forestTraining.session.foods===1);
   await m.screenshot({path:dir+'mobile-'+viewport.width+'.png'});
   const up=m.locator('[data-dir="0"]'),box=await up.boundingBox();await m.mouse.move(box.x+box.width/2,box.y+box.height/2);await m.mouse.down();
   await m.waitForFunction(()=>forestTraining.session.state.direction===0);if(viewport.width===844)await m.screenshot({path:dir+'dpad-pressed.png'});await m.mouse.up();
   const right=await m.locator('[data-dir="1"]').boundingBox();await m.touchscreen.tap(right.x+22,right.y+22);await m.waitForFunction(()=>forestTraining.session.state.direction===1);
   await m.locator('[data-action=pause]').click();const h=await m.evaluate(()=>forestTraining.session.hash());await m.waitForTimeout(100);assert(await m.evaluate(()=>forestTraining.session.hash())===h,'Mobile pause changed state');await m.locator('[data-action=resume]').click();
   await m.locator('[data-action=pause]').click();await m.setViewportSize({width:390,height:844});assert(await m.locator('#heading').textContent()==='Разверните экран','Portrait prompt missing');
   await m.setViewportSize(viewport);await m.locator('[data-action=resume]').click();await m.locator('[data-action=pause]').click();await m.locator('[data-action=main]').click();
   result.mobile.push({viewport,hitArea:box,cleanup:await m.evaluate(()=>forestTraining.summary())});await c.close();
 }
 result.errors=errors;result.warnings=warnings;result.failed=failed;result.http=http;
 const downloadPromise=p.waitForEvent('download');await p.evaluate(data=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='flow-results.json';a.click();},result);
 await (await downloadPromise).saveAs(dir+'flow-results.json');await context.close();
 assert(!errors.length&&!warnings.length&&!failed.length&&!http.length,'Browser error/network acceptance failed; see flow-results.json');return result;
}
