async page=>{
 await page.bringToFront();await page.goto('http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html?art-fixture=desktop-30');await page.waitForFunction(()=>tuningLab?.current?.pickups.length===9&&tuningLab.game.status==='paused');
 const hardware=await page.evaluate(()=>tuningLab.game.touch);const results=[];
 for(const [id,w,h]of [['mobile-30',30,12],['desktop-50',50,20],['mobile-40',40,16],['mobile-50',50,20],['desktop-30',30,12]]){
  await page.locator('[data-art-fixture="'+id+'"]').click();await page.waitForFunction(([w,h,id])=>{const g=tuningLab.game;return g.status==='paused'&&g.session.world.width===w&&g.session.world.height===h&&g.session.pickups.length===9&&g.compact===id.startsWith('mobile');},[w,h,id]);
  results.push(await page.evaluate(()=>({world:[tuningLab.current.world.width,tuningLab.current.world.height],touch:tuningLab.game.touch,compact:tuningLab.game.compact,frameWidth:document.querySelector('#training').clientWidth})));if(results.at(-1).touch!==id.startsWith('mobile'))throw Error('Touch fixture mode failed');
 }
 await page.locator('#leave-art-fixture').click();await page.waitForFunction(()=>tuningLab.game.status==='playing'&&!tuningLab.game.artFixtureForest);const restored=await page.evaluate(()=>tuningLab.game.touch);if(restored!==hardware)throw Error('Hardware mode not restored');await page.evaluate(()=>tuningLab.game.pause());return {results,hardwareRestored:true};
}
