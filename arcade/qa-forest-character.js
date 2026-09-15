async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8825/?arcade_preview=1');
 await page.setViewportSize({width:1366,height:768});
 await page.locator('[data-ms-action="game-snake"]').click();
 await page.locator('[data-ms-action="start"]').click();
 await page.waitForFunction(()=>RytniMushroomSnake.state==='play');
 await page.evaluate(()=>{const s=RytniMushroomSnake;s.stop();s.engine.reset(127);s.engine.phase=1;s.paint();});
 await page.screenshot({path:'C:/Users/rytni/.codex/visualizations/snake-reset/character-straight.png'});
 for(const turn of [0,1,2,3])for(const alpha of [.5,1]){
  await page.evaluate(({alpha,turn})=>{
   const s=RytniMushroomSnake,e=s.engine;e.reset(127);
   const path=[[2,0],[1,0],[0,0],[0,1],[0,2],[-1,2],[-2,2],[-3,2],[-4,2]];
   for(let i=0;i<path.length;i++){
    let [x,y]=path[i];for(let r=0;r<turn;r++)[x,y]=[-y,x];
    const j=(e.head-i+e.bx.length)%e.bx.length;e.bx[j]=x;e.by[j]=y;
   }
   e.direction=(1+turn)%4;e.x=e.bx[e.head];e.y=e.by[e.head];e.phase=alpha;s.paint();
  },{alpha,turn});
  await page.screenshot({path:`C:/Users/rytni/.codex/visualizations/snake-reset/character-turn-${turn}-${alpha}.png`});
 }
 if(errors.length)throw Error(JSON.stringify(errors));
 return {directions:4,alphaFrames:[.5,1],errors};
}
