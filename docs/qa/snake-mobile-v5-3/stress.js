async page=>{
 for(const context of page.context().browser().contexts())if(context!==page.context()&&context.pages().some(p=>p.url().includes('/product/index.html?qa=1')))await context.close();
 const failures=[],errors=[],stress=[];let checks=0;
 for(const [width,height] of [[844,390],[873,393],[915,412]]){
  const context=await page.context().browser().newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:2}),p=await context.newPage();
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await p.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?qa=1');await p.waitForFunction(()=>window.snakeProduct?.game);
  // Real user gesture enters fullscreen first, then creates unlimited Training.
  await p.locator('[data-action=training]').click();await p.waitForFunction(()=>snakeProduct.controller.screen==='playing');
  const f=p.frames().find(f=>f.url().includes('/product/frame.html'));
  await f.evaluate(()=>{snakeProductGame.stop();window.inputReceipts=[];const original=snakeProductGame.command.bind(snakeProductGame);snakeProductGame.command=d=>{inputReceipts.push(d);original(d);};});
  // Isolated input-burst fixture: canonical clock held, run status live. No
  // invulnerability, collision edits or claims about survival/play enjoyment.
  const sequence=[...Array(50).fill(0),...Array(50).fill(1),...Array(50).fill(2),...Array(50).fill(3),...Array.from({length:100},()=>[2,1]).flat(),...Array.from({length:100},()=>[0,3]).flat()];
  for(const dir of sequence)await f.locator(`[data-dir="${dir}"]`).tap();
  const input=await f.evaluate(()=>({directions:inputReceipts,queued:snakeProductGame.commands.length,status:snakeProductGame.status,scroll:[scrollX,scrollY]}));
  const qa=await p.evaluate(()=>({screen:snakeProduct.controller.screen,counts:snakePauseDiagnostics.counts,events:snakePauseDiagnostics.events,fullscreen:!!document.fullscreenElement,pseudo:document.querySelector('#cabinet').classList.contains('pseudo-fullscreen'),scroll:[scrollX,scrollY]}));
  checks++;if(JSON.stringify(input.directions)!==JSON.stringify(sequence)||input.queued!==600||input.status!=='playing'||qa.screen!=='playing'||Object.keys(qa.counts).length||input.scroll.some(Boolean)||qa.scroll.some(Boolean)||!qa.fullscreen&&!qa.pseudo)failures.push({width,input,qa});
  const parity=await f.evaluate(()=>{const Session=snakeProductGame.session.constructor,a=new Session({seed:79001,touch:true,progression:{model:'fit-world-v2',freeTrigger:15,startStage:0,maxWorldStage:2}}),b=new Session({seed:79001,touch:true,progression:{model:'fit-world-v2',freeTrigger:15,startStage:0,maxWorldStage:2}});const commands=snakeProductGame.commands;for(let i=0;i<60;i++){a.advance(commands.slice(i*10,i*10+10));b.advance(commands.slice(i*10,i*10+10));}return {a:a.hash(),b:b.hash(),equal:a.hash()===b.hash()};});checks++;if(!parity.equal)failures.push({width,parity});
  await p.screenshot({path:`docs/qa/snake-mobile-v5-3/${width}-gameplay.png`,scale:'css'});
  await f.locator('[data-dir="2"]').dispatchEvent('pointerdown',{pointerId:99,pointerType:'touch',bubbles:true,cancelable:true});await p.screenshot({path:`docs/qa/snake-mobile-v5-3/${width}-dpad-pressed.png`,scale:'css'});await f.locator('[data-dir="2"]').dispatchEvent('pointerup',{pointerId:99,pointerType:'touch',bubbles:true});
  // Fresh canonical run for toolbar-height stress, timer remains running.
  await p.evaluate(()=>{snakeProduct.bridge.start(79001);snakeProduct.controller.show('playing');});
  const before=await f.evaluate(()=>({tick:snakeProductGame.session.tick,pad:document.querySelector('#pad').getBoundingClientRect().toJSON()}));
  const resize=[];
  for(const h of [height-18,height-34,height-12,height,height-28,height-8,height]){
   await p.setViewportSize({width,height:h});await p.waitForTimeout(55);
   resize.push(await f.evaluate(()=>({status:snakeProductGame.status,tick:snakeProductGame.session.tick,height:innerHeight,pad:document.querySelector('#pad').getBoundingClientRect().toJSON()})));
  }
  checks++;if(resize.some(r=>r.status!=='playing'||Math.abs(r.pad.left-12)>1||Math.abs(r.height-r.pad.bottom-12)>1)||resize.at(-1).tick<=before.tick)failures.push({width,resize});
  const after=await p.evaluate(()=>({screen:snakeProduct.controller.screen,counts:{...snakePauseDiagnostics.counts}}));checks++;if(after.screen!=='playing'||Object.keys(after.counts).length)failures.push({width,after});
  // Portrait pauses after settle; landscape return never resumes implicitly.
  await p.setViewportSize({width:height,height:width});await p.waitForFunction(()=>snakeProduct.controller.screen==='mobile-gate');
  const rotate=await p.evaluate(()=>({screen:snakeProduct.controller.screen,reason:snakePauseDiagnostics.lastPauseReason,tick:snakeProduct.game.session.tick,clock:snakeProduct.game.clock.status}));
  await p.waitForTimeout(220);checks++;if(await f.evaluate(()=>snakeProductGame.session.tick)!==rotate.tick||rotate.reason!=='orientation-portrait'||rotate.clock!=='paused')failures.push({width,rotate});
  await p.setViewportSize({width,height});await p.waitForTimeout(220);checks++;if(await p.evaluate(()=>snakeProduct.controller.screen)!=='mobile-gate')failures.push({width,implicitResume:true});
  await p.locator('[data-action=gate-cancel]').last().click();await p.screenshot({path:`docs/qa/snake-mobile-v5-3/${width}-pause.png`,scale:'css'});await p.locator('[data-action=resume]').last().click();await p.waitForFunction(()=>snakeProduct.controller.screen==='playing');
  const resumed=await p.evaluate(()=>({tick:snakeProduct.game.session.tick,debt:snakeProduct.game.clock.debt,screen:snakeProduct.controller.screen}));checks++;if(resumed.tick-rotate.tick>5)failures.push({width,clockDebt:resumed,rotate});
  // Real Training result, no injected score: route safely toward a wall.
  await p.evaluate(()=>{snakeProduct.game.pause('explicit-pause-button');snakeProduct.game.commands=[];});await p.locator('[data-action=resume]').last().click();await p.waitForFunction(()=>snakeProduct.controller.screen==='result',{timeout:15000});
  await p.screenshot({path:`docs/qa/snake-mobile-v5-3/${width}-result.png`,scale:'css'});
  stress.push({width,height,presses:600,unexpectedPauses:0,inputQueued:input.queued,parity,toolbarResizes:resize.map(r=>({height:r.height,tick:r.tick,left:r.pad.left,bottomMargin:r.height-r.pad.bottom})),rotate,resumed,pauseCounts:await p.evaluate(()=>snakePauseDiagnostics.counts)});
  await context.close();
 }
 return {checks,failures,errors,stress};
}
