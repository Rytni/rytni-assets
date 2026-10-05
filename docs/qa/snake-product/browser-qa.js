// Targeted product flows: playwright-cli -s=productqa run-code --filename=this-file
async page=>{
 const browser=page.context().browser(),errors=[],badNetwork=[],external=[],checks=[];
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),p=await context.newPage();
 const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)badNetwork.push([r.status(),r.url()]);});p.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8775')&&!r.url().startsWith('data:'))external.push(r.url());});};watch(p);
 const base='http://127.0.0.1:8775/arcade/snake-next/product/index.html';
 const open=async(query='')=>{await p.goto(base+'?qa=1'+query);await p.waitForFunction(()=>window.snakeProduct&&!window.snakeProduct.controller.pending);};
 const verify=(yes,msg)=>{if(!yes)throw Error(msg);checks.push(msg);};
 const state=()=>p.evaluate(()=>{const q=snakeProduct,c=q.controller;return {screen:c.screen,status:q.game.status,mode:c.run?.mode,seed:c.run?.seed,actualSeed:q.game.session?.seed,starts:q.backend.calls.filter(x=>x.method==='start').length,finishes:q.backend.calls.filter(x=>x.method==='finish').length,claims:q.backend.calls.filter(x=>x.method==='claim').length,hub:c.hub,accepted:c.result?.accepted,tick:q.game.session?.tick,hash:q.game.session?.hash()};});
 const action=a=>p.evaluate(a=>snakeProduct.dispatch(a),a);
 await open();verify((await state()).screen==='main','fresh product starts at Main');
 verify(await p.locator('.leaderboard li').count()===10,'top ten');verify(await p.locator('.is-leader .leader-badge').count()===1,'leader badge');verify(await p.locator('.is-me').count()===1,'own row');
 await p.screenshot({path:'docs/qa/snake-product/main-desktop.png'});
 await action('rules');await action('back');verify((await state()).screen==='main','Main Rules Main');
 await p.evaluate(()=>Promise.all([snakeProduct.dispatch('play'),snakeProduct.dispatch('play')]));
 let s=await state();verify(s.starts===1&&s.mode==='ranked','double click one ranked start');
 verify(await p.evaluate(()=>snakeProduct.game.session.state.seed===snakeProduct.controller.run.seed),'server seed canonical');
 await action('pause');const paused=await state();await p.waitForTimeout(300);verify((await state()).tick===paused.tick,'pause frozen');
 await action('settings');await p.evaluate(()=>snakeProduct.game.resume());verify((await state()).screen==='settings','iframe keyboard cannot bypass settings');await action('back');verify((await state()).screen==='pause','settings returns Pause');
 await action('restart');await action('cancel');await action('exit');await action('cancel');verify((await state()).screen==='pause','confirmation cancels keep run');
 await action('restart');await action('confirm');verify((await state()).starts===1,'ranked restart same attempt');await action('pause');
 // Read canonical snapshot, never substitute presentation score.
 await p.evaluate(()=>snakeProduct.controller.finish(snakeProduct.stats()));s=await state();verify(s.accepted&&s.finishes===1,'canonical aggregate accepted');await p.evaluate(()=>snakeProduct.controller.finish(snakeProduct.stats()));verify((await state()).finishes===1,'duplicate finish blocked');await action('resume');verify((await state()).screen==='result','Result is terminal');
 await action('main');await action('training');await action('pause');await action('restart');await action('confirm');await action('pause');verify((await state()).starts===1,'training replay spends no ranked attempt');await p.evaluate(()=>snakeProduct.controller.finish(snakeProduct.stats()));verify((await state()).finishes===1,'training no finish RPC');
 await open('&mock=sponsor-available');await p.evaluate(()=>Promise.all([snakeProduct.dispatch('sponsor'),snakeProduct.dispatch('sponsor')]));s=await state();verify(s.claims===1&&s.hub.sponsor_attempt_credits===1&&s.hub.attempts_remaining===0,'sponsor one claim before separate Play');verify(await p.locator('a[target="_blank"][rel="noopener noreferrer"]').count()===1,'sponsor safe link');
 await action('play');verify((await state()).hub.sponsor_attempt_credits===0,'sponsor credit consumed by Play');await action('pause');
 const previews=['main-ready','main-one-attempt','main-sponsor','no-attempts','pause-ranked','pause-training','rules-basics','rules-bonuses','rules-hazards','settings','result-normal','result-record','result-training','network-error','mobile-gate','leaderboard-empty'];
 for(const name of previews){await open('&preview='+name);verify(await p.locator('#menu button').count()>0,'preview '+name);if(name==='result-record')await p.screenshot({path:'docs/qa/snake-product/result-record-desktop.png'});}
 for(const mock of ['not-authenticated','arcade-paused','network-error']){await open('&mock='+mock);verify((await state()).screen==='error',mock+' clear state');await action('training');verify((await state()).mode==='training'&&(await state()).starts===0,'offline training '+mock);await action('pause');}
 await open('&preview=settings');await p.locator('#volume-master').fill('0.35');await p.reload();await p.waitForFunction(()=>window.snakeProduct);verify(await p.evaluate(()=>snakeProduct.settings.master===.35),'audio persisted');
 await p.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide')));verify(await p.evaluate(()=>snakeProduct.game.status==='disposed'&&!snakeProduct.game.raf&&!snakeProduct.game.cancelTimer),'pagehide disposes clock audio');
 await context.close();
 const mobileContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});const m=await mobileContext.newPage();watch(m);
 await m.goto(base+'?qa=1');await m.waitForFunction(()=>window.snakeProduct);await m.locator('[data-action="play"]').click();
 verify(await m.evaluate(()=>snakeProduct.controller.screen==='mobile-gate'&&snakeProduct.backend.calls.filter(c=>c.method==='start').length===0),'portrait no attempt spent');
 await m.locator('[data-action="gate-cancel"]').click();verify(await m.evaluate(()=>snakeProduct.controller.screen==='main'),'portrait cancel');
 await m.setViewportSize({width:844,height:390});await m.locator('[data-action="play"]').click();await m.locator('[data-action="gate-confirm"]').click();await m.waitForFunction(()=>snakeProduct.controller.screen==='playing');
 verify(await m.evaluate(()=>snakeProduct.backend.calls.filter(c=>c.method==='start').length===1&&snakeProduct.game.touch),'landscape fullscreen before start');
 await m.frameLocator('#game-frame').locator('[data-dir="0"]').dispatchEvent('pointerdown',{pointerId:1,pointerType:'touch',bubbles:true});
 verify(await m.evaluate(()=>snakeProduct.game.commands.some(c=>c.direction===0)||snakeProduct.game.session.state.turnCount>0||snakeProduct.game.session.state.direction===0),'Dpad accepts command');
 await m.evaluate(()=>snakeProduct.controller.pause());await m.screenshot({path:'docs/qa/snake-product/pause-mobile.png'});
 await m.evaluate(()=>snakeProduct.controller.resume());await m.setViewportSize({width:390,height:844});await m.waitForFunction(()=>snakeProduct.controller.screen!=='playing');verify(await m.evaluate(()=>snakeProduct.game.status==='paused'),'rotate out safely pauses');
 const t=await m.evaluate(()=>snakeProduct.game.session.tick);await m.waitForTimeout(350);verify(await m.evaluate(t=>snakeProduct.game.session.tick===t,t),'rotation no clock debt');
 await m.setViewportSize({width:844,height:390});await m.evaluate(()=>snakeProduct.controller.pause());
 // Explicit DEV review stage fixture, no normal progression tuning.
 await m.evaluate(()=>{snakeProduct.controller.abandon();snakeProduct.bridge.previewStage=2;});await m.evaluate(()=>snakeProduct.controller.start('training'));if(await m.evaluate(()=>snakeProduct.controller.screen==='mobile-gate'))await m.locator('[data-action="gate-confirm"]').click();await m.waitForFunction(()=>snakeProduct.controller.screen==='playing');
 await m.evaluate(()=>{snakeProduct.activate('harvest');snakeProduct.activate('guard');snakeProduct.activate('weak');});await m.waitForTimeout(350);await m.screenshot({path:'docs/qa/snake-product/live-mobile50.png'});await m.evaluate(()=>snakeProduct.controller.pause());verify(await m.evaluate(()=>snakeProduct.game.session.world.width===50),'actual mobile50 product fixture');
 await mobileContext.close();
 verify(errors.length===0,'zero console/page errors');verify(badNetwork.length===0,'zero failed asset requests');verify(external.length===0,'no external/production requests');
 return {checks,errors,badNetwork,external};
}
