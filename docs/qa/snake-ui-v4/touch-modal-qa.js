async page=>{
 const context=await page.context().browser().newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true}),p=await context.newPage(),errors=[],checks=[];
 p.on('pageerror',e=>errors.push(e.message));const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
 await p.goto('http://127.0.0.1:8776/arcade/snake-next/product/index.html?qa=1');await p.waitForFunction(()=>window.snakeProduct?.controller.screen==='main');await p.locator('[data-action=fullscreen]').tap();
 await p.waitForFunction(()=>!!document.fullscreenElement);await p.evaluate(()=>{document.documentElement.classList.remove('dev-qa');snakeProduct.fixture('settings');});
 await p.locator('.sound-mix>summary').tap();
 for(const key of ['master','music','sfx']){
  const input=p.locator('[data-setting="'+key+'"]');await input.scrollIntoViewIfNeeded();
  check(await input.evaluate(e=>{const r=e.getBoundingClientRect();return r.height>=44&&r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth;}),'touch slider safe '+key);
  await input.evaluate(e=>{e.value='.35';e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));});
 }
 check(await p.evaluate(()=>['master','music','sfx'].every(k=>snakeProduct.settings[k]===.35)),'all sound channels retained');
 await p.locator('.sound-mix>summary').scrollIntoViewIfNeeded();await p.locator('.sound-mix>summary').tap();await p.screenshot({path:'docs/qa/snake-ui-v4/mobile-settings.png',scale:'css'});
 for(const [state,file]of [['rules-basics','mobile-guide'],['result-training','mobile-result']]){await p.evaluate(state=>snakeProduct.fixture(state),state);await p.screenshot({path:'docs/qa/snake-ui-v4/'+file+'.png',scale:'css'});}
 check(errors.length===0,'no mobile modal page errors');await context.close();return {checks:checks.length,errors};
}
