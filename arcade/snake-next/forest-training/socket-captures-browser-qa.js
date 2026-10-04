async page=>{
 const result=[],errors=[],failed=[],browser=page.context().browser();
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:844,height:390}:{width:1920,height:1080},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?2:1}),p=await context.newPage();
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('requestfailed',r=>failed.push(r.url()));p.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url());});
  await p.goto('http://127.0.0.1:8773/arcade/snake-next/game-feel-lab.html?socketProof=1');await p.waitForFunction(()=>window.tuningLab?.game);
  await p.evaluate(()=>{
   const g=tuningLab.game,tick=g.tick.bind(g);window.socketLive={recoveries:0};
   g.tick=()=>{const s=g.session;if(s?.state.movePhase>=s.cadence()-1){const c=s.state.body[s.state.headIndex],x=c%28,y=Math.floor(c/28);if(x===20&&s.state.direction===1)g.command(0);else if(y===4&&s.state.direction===0)g.command(3);else if(x===7&&s.state.direction===3)g.command(2);else if(y===8&&s.state.direction===2)g.command(1);}tick();};
   const pause=g.pause.bind(g);g.pause=()=>{if(g.clock?.status==='recovery')socketLive.recoveries++;pause();};
  });
  await p.locator('[data-preset=B]').click();await p.waitForFunction(()=>tuningLab.current.moves>=9&&tuningLab.game.status==='playing',{},{timeout:15000});
  const paused=await p.evaluate(()=>{const g=tuningLab.game;g.pause();return {frame:JSON.stringify(g.motion.frame(g.session)),hash:g.session.hash(),alpha:g.motion.alpha};});
  await p.waitForTimeout(120);
  const exact=await p.evaluate(s=>{const g=tuningLab.game,same=s.frame===JSON.stringify(g.motion.frame(g.session))&&s.hash===g.session.hash();g.resume();return same&&g.motion.alpha>=s.alpha;},paused);
  await p.waitForFunction(()=>tuningLab.current.moves>=13&&tuningLab.game.status==='playing',{},{timeout:15000});
  await p.locator('#training').screenshot({path:'docs/qa/smooth-v2-1/'+(mobile?'mobile':'desktop')+'.png',scale:'css'});
  await p.locator('#motion-toggle').click();const snap=await p.evaluate(()=>!tuningLab.game.smooth);await p.locator('#motion-toggle').click();
  result.push(await p.evaluate(({exact,mobile,snap})=>({mobile,exactPauseResume:exact,snapToggle:snap,status:tuningLab.game.status,moves:tuningLab.current.moves,foods:tuningLab.current.foods,...socketLive}),{exact,mobile,snap}));
  await context.close();
 }
 const data={result,errors,failed},wait=page.waitForEvent('download');await page.evaluate(data=>{const a=document.createElement('a');a.download='captures.json';a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.click();},data);await(await wait).saveAs('docs/qa/smooth-v2-1/captures.json');return data;
}
