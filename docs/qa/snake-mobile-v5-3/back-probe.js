async page=>{
 for(const c of page.context().browser().contexts())for(const p of c.pages())if(p.url().includes('testpodari')&&p.url().includes('&qa=1')){
  const f=p.frames().find(f=>f.url().includes('/product/index.html'));if(!f)continue;
  await f.evaluate(()=>{window.backEvents=[];for(const event of ['pointerdown','pointerup','click'])document.addEventListener(event,e=>backEvents.push({type:e.type,target:e.target.closest('[data-action]')?.dataset.action,screen:document.querySelector('#product').dataset.screen}),true);});
  await f.locator('[data-action=back]').last().click();await p.waitForTimeout(400);
  return await f.evaluate(()=>({screen:document.querySelector('#product').dataset.screen,events:backEvents,buttons:[...document.querySelectorAll('[data-action]')].map(e=>e.dataset.action)}));
 }return 'none';
}
