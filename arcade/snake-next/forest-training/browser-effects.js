async page=>{
 const c=await page.context().browser().newContext({viewport:{width:1366,height:768}}),p=await c.newPage();
 await p.goto('http://127.0.0.1:8773/arcade/snake-next/forest-training.html?qa=1');await p.waitForFunction(()=>window.forestTraining);
 const results=[];
 for(let cycle=0;cycle<3;cycle++){
   await p.evaluate(()=>forestTraining.start());await p.waitForFunction(()=>forestTraining.session.foods===1);await p.keyboard.press('Space');
   for(const kind of ['focus','harvest','rush']){
     await p.evaluate(async kind=>{const s=forestTraining.session,{neighbour}=await import('/arcade/snake-next/simulation/rules.js');s.pickups=[{kind,cell:neighbour(s.state.body[s.state.headIndex],s.state.direction,s.arena.width,s.arena.height),ends:s.tick+1200}];},kind);
     await p.locator('[data-action=resume]').click();await p.waitForFunction(kind=>forestTraining.session.effects.some(e=>e.kind===kind),kind);await p.keyboard.press('Space');
   }
   const frozen=await p.evaluate(()=>forestTraining.session.hash());await p.waitForTimeout(200);if(await p.evaluate(()=>forestTraining.session.hash())!==frozen)throw Error('Active effects moved on pause');
   await p.locator('[data-action=resume]').click();const start=Date.now();
   while(Date.now()-start<12500){
     const state=await p.evaluate(()=>{const s=forestTraining.session,c=s.state.body[s.state.headIndex];return {x:c%s.arena.width,y:Math.floor(c/s.arena.width),dir:s.state.direction,status:forestTraining.status};});
     if(state.status!=='playing')throw Error('Effect loop stopped: '+JSON.stringify(state));
     let next=-1;if(state.x===23&&state.dir===1)next=2;else if(state.y===10&&state.dir===2)next=3;else if(state.x===8&&state.dir===3)next=0;else if(state.y===5&&state.dir===0)next=1;
     if(next>=0)await p.keyboard.press(['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'][next]);await p.waitForTimeout(30);
   }
   results.push(await p.evaluate(()=>({effects:forestTraining.session.effects.length,tick:forestTraining.session.tick,log:forestTraining.log.filter(e=>e.effect)})));
   if(results.at(-1).effects!==0)throw Error('Wall-time active expiration failed');await p.keyboard.press('Space');
 }
 await p.locator('[data-action=resume]').click();await p.locator('[data-action=fullscreen]').click();await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.fullscreenElement);
 const fullscreenActive=await p.evaluate(()=>forestTraining.status);await p.evaluate(()=>forestTraining.main());
 const audio=await p.evaluate(()=>{const result=[];for(const [name,b]of forestTraining.audio.buffers){let peak=0;for(let channel=0;channel<b.numberOfChannels;channel++)for(const sample of b.getChannelData(channel))peak=Math.max(peak,Math.abs(sample));result.push({name,duration:b.duration,peak,bytes:b.length*b.numberOfChannels*4,loopEdge:name==='forest-theme'?Math.abs(b.getChannelData(0)[0]-b.getChannelData(0).at(-1)):null});}return result;});
 await p.setViewportSize({width:844,height:390});
 await p.evaluate(()=>{forestTraining.touch=true;forestTraining.start();for(const kind of ['focus','harvest','rush'])forestTraining.session.collect(kind,0);forestTraining.render();});
 await p.screenshot({path:'docs/qa/forest-training/mobile-stack.png'});const bars=await p.locator('progress').evaluateAll(nodes=>nodes.map(p=>({width:p.getBoundingClientRect().width,parent:p.parentElement.getBoundingClientRect().width,value:p.value})));
 await p.evaluate(()=>forestTraining.main());
 const result={cycles:results,fullscreenActive,audio,bars,cleanup:await p.evaluate(()=>forestTraining.summary())};
 const downloadPromise=p.waitForEvent('download');await p.evaluate(data=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='effect-results.json';a.click();},result);
 await (await downloadPromise).saveAs('docs/qa/forest-training/effect-results.json');await c.close();return result;
}
