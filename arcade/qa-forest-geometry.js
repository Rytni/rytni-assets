async page => {
 await page.goto('http://127.0.0.1:8825/?arcade_preview=1&snake_geometry=1');
 await page.locator('[data-ms-action="game-snake"]').click();
 await page.locator('[data-ms-action="start"]').click();
 await page.waitForFunction(()=>RytniMushroomSnake.state==='play');
 await page.evaluate(()=>{const s=RytniMushroomSnake;s.stop();s.engine.reset(127);s.paint();});
 const results=[];
 for(const [w,h,full] of [[1366,768,false],[1920,1080,true]]){
  await page.setViewportSize({width:w,height:h});
  if(full)await page.locator('[data-ms-action="fullscreen"]:visible').click();
  await page.waitForTimeout(250);
  await page.screenshot({path:`C:/Users/rytni/.codex/visualizations/snake-reset/geometry-${w}.png`});
  results.push(await page.evaluate(()=>({viewport:[innerWidth,innerHeight],view:RytniMushroomSnake.view,headPx:RytniMushroomSnake.view.scale*MushroomSnakeForest.SCALE.head})));
 }
 const context=await page.context().browser().newContext({viewport:{width:915,height:412},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const mobile=await context.newPage();
 await mobile.goto('http://127.0.0.1:8825/?arcade_preview=1&snake_geometry=1');
 await mobile.locator('[data-ms-action="game-snake"]').click();await mobile.locator('[data-ms-action="start"]').click();await mobile.locator('[data-ms-action="enter"]').click();
 await mobile.waitForFunction(()=>RytniMushroomSnake.state==='play');
 await mobile.evaluate(()=>{const s=RytniMushroomSnake;s.stop();s.engine.reset(127);s.paint();});
 await mobile.screenshot({path:'C:/Users/rytni/.codex/visualizations/snake-reset/geometry-mobile.png'});
 results.push(await mobile.evaluate(()=>({viewport:[innerWidth,innerHeight],view:RytniMushroomSnake.view,headPx:RytniMushroomSnake.view.scale*MushroomSnakeForest.SCALE.head})));
 await context.close();return results;
}
