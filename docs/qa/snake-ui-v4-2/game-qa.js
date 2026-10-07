async (page,phase='after')=>{
 const browser=page.context().browser(),dir='docs/qa/snake-ui-v4-2/',metrics=[],checks=[],errors=[];
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:844,height:390}:{width:1920,height:1080},hasTouch:mobile,isMobile:mobile}),p=await context.newPage();
  p.on('pageerror',e=>errors.push(e.message));await p.emulateMedia({reducedMotion:'reduce'});
  const entry=phase==='before'?'giveaway-test/releases/snake-next-8d20d4ba2174/snake/product/index.html':'arcade/snake-next/product/index.html';
  await p.goto('http://127.0.0.1:8776/'+entry+'?qa=1');await p.waitForFunction(()=>window.snakeProduct?.controller.screen==='main');
  await p.locator('[data-action=fullscreen]').click();await p.waitForFunction(()=>!!document.fullscreenElement);
  await p.evaluate(()=>document.documentElement.classList.remove('dev-qa'));
  for(const stage of [0,1,2]){
   await p.evaluate(async stage=>{const c=snakeProduct.controller;c.abandon();snakeProduct.bridge.previewStage=stage;await c.start('training');c.pause();document.querySelector('#product-overlay').style.visibility='hidden';},stage);
   const f=p.frames().find(f=>f.url().endsWith('/product/frame.html'));
   await f.evaluate(()=>{snakeProductGame.render();});
   const m=await f.evaluate(()=>{const g=snakeProductGame,l=g.renderer.last;return {size:[innerWidth,innerHeight],stage:g.session.stage.index,world:[g.session.world.width,g.session.world.height],cell:l.cell,body:l.cell*36/68,aperture:l.cabinetAperture,grid:l.playableGrid,cabinet:l.cabinet,frame:l.frame,clip:g.renderer.canvas.style.clipPath,hash:g.session.hash(),mode:g.smooth?'SMOOTH V4':'SNAP',perimeter:l.perimeter};});
   metrics.push({mobile,...m});await p.screenshot({path:dir+phase+'-game-'+(mobile?'mobile':'desktop')+'-'+stage+'.png',scale:'css'});
   if(phase==='after'){
    if(m.perimeter!==false)throw Error('second perimeter still enabled');checks.push('no perimeter '+mobile+'/'+stage);
    if(m.clip&&m.clip!=='none')throw Error('corner crop');checks.push('no stepped clip '+mobile+'/'+stage);
    const hash=await f.evaluate(()=>{const g=snakeProductGame,h=g.session.hash();g.render();return [h,g.session.hash()];});if(hash[0]!==hash[1])throw Error('presentation changed hash');checks.push('canonical hash unchanged '+mobile+'/'+stage);
   }
  }
  await p.evaluate(()=>snakeProduct.controller.dispose());await context.close();
 }
 return {phase,checks:checks.length,errors,metrics};
}
