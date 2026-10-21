// playwright-cli run-code --filename=tools/test-community-ranking.cjs
async page => {
  const assert=(condition,message)=>{if(!condition)throw Error(message);};
  const endpoint='**/rest/v1/rpc/giveaway_social_rankings_v2';
  await page.unroute(endpoint);
  const overlay=page.locator('#communityRankingPopup'),root=page.locator('#community-rating');
  const open=async()=>{
    if(await overlay.getAttribute('aria-hidden')!=='false')await page.locator('[data-open-community-ranking]').click();
    await page.waitForFunction(()=>document.querySelector('[data-podium] article'));
    await page.waitForFunction(()=>document.activeElement===document.querySelector('#communityRankingPopup .cr-close'));
  };
  if(await overlay.getAttribute('aria-hidden')==='false')await page.keyboard.press('Escape');
  assert(!await root.isVisible(),'Ranking must not occupy the page');
  assert(await page.locator('#communityRankingMount').evaluate(e=>!e.closest('main')),'Dialog mount is outside main');
  await open();
  assert(await overlay.getAttribute('role')==='dialog'&&await overlay.getAttribute('aria-modal')==='true','Accessible modal');
  assert(await page.locator('body').evaluate(e=>e.classList.contains('popup-open')),'Page scroll lock');
  assert(await root.locator('[data-scope],[data-days]').count()===0,'No channel or period controls');
  assert((await root.locator('.cr-context').innerText()).includes('30 дней'),'Fixed 30 days');
  const live=await page.evaluate(async()=>callSupabaseRpc('giveaway_social_rankings_v2',{p_channel:'test'},12000,false,'anonymous',true));
  assert(live.status==='READY','No live snapshot');
  const period=live.snapshot.periods.find(p=>p.days===30);
  assert(!JSON.stringify(live.snapshot).includes('points'),'Private progression amounts/timestamps never enter public JSON');
  assert(await root.locator('[data-kind="likes"]').count()===0,'Separate likes ranking removed');
  for(const kind of ['comments','progression','activity']){
    await root.locator(`[data-kind="${kind}"]`).click();
    const expected=period.scopes.all[kind];
    const actual=await root.locator('.cr-person').evaluateAll(es=>es.map(e=>e.textContent.slice(1)));
    assert(JSON.stringify(actual)===JSON.stringify(expected.slice(0,10).map(r=>r.handle)),'Wrong combined 30-day members/order');
    const field={comments:'comments',activity:'score'}[kind];
    const values=await root.locator('.cr-value').allTextContents();
    assert(values.every((v,i)=>kind==='progression'?v==='#'+(i+1):Number(v.replace(/\s/g,''))===expected[i][field]),'Wrong metric/hidden progression');
    const winners=expected.slice(0,10).filter(r=>r.winner_selected).map(r=>r.handle);
    const marked=await root.locator('[data-handle].cr-winner').evaluateAll(es=>es.map(e=>e.dataset.handle));
    assert(JSON.stringify(marked)===JSON.stringify(winners),'Winner highlights reflect selected winners only');
    assert(await root.locator('.cr-winner-badge').count()===winners.length,'Branded winner badges');
    assert(await root.locator('[data-selection-note]').isVisible()===(kind==='progression'),'Progression eligibility explained');
    if(kind==='progression'){
      await root.locator('[data-selection-note] summary').click();
      assert((await root.locator('[data-selection-note] p').innerText()).includes('8 дней'),'Readable selection conditions');
      await root.locator('[data-selection-note] summary').click();
    }
  }
  await root.locator('[data-kind="activity"]').click();
  await root.locator('[data-more]').click();assert(await root.locator('.cr-person').count()===50,'Top50');
  const board=period.scopes.all.activity;
  await root.locator('input').fill('@'+board[40].handle);await root.locator('[data-find]').evaluate(e=>e.requestSubmit());
  assert((await root.locator('[data-found]').innerText()).includes('41'),'Exact lookup');
  await root.locator('input').fill('@'+board[0].handle);await root.locator('[data-find]').evaluate(e=>e.requestSubmit());
  assert(await root.locator('[data-podium] .cr-found').count()===1,'Podium lookup highlight');
  await root.locator('[data-kind="activity"]').focus();await page.keyboard.press('Home');
  assert(await root.locator('[data-kind="comments"]').getAttribute('aria-selected')==='true','Keyboard tabs');
  await root.locator('.cr-method summary').click();
  const links=await root.locator('.cr-method a').evaluateAll(es=>es.map(e=>e.href));
  assert(links.includes('https://www.tiktok.com/@rytni.tv')&&links.includes('https://www.tiktok.com/@rytni.blic'),'Both channel links');
  assert((await root.locator('.cr-method').innerText()).includes('сразу с двух каналов'),'Both-channel collection explained');
  await root.locator('.cr-method summary').click();
  await page.keyboard.press('Escape');await page.waitForTimeout(40);
  assert(!await root.isVisible(),'Escape closes');
  assert(await page.locator('[data-open-community-ranking]').evaluate(e=>e===document.activeElement),'Focus restored');
  assert(!await page.locator('body').evaluate(e=>e.classList.contains('popup-open')),'Page scroll restored');
  await open();await root.locator('[data-close-popup]').focus();await page.keyboard.press('Shift+Tab');
  assert(await root.evaluate(e=>e.contains(document.activeElement)),'Focus trap backwards');
  await page.keyboard.press('Tab');assert(await root.locator('[data-close-popup]').evaluate(e=>e===document.activeElement),'Focus trap forwards');
  const sizes=[];
  for(const [width,height] of [[320,740],[390,844],[844,390],[1366,900]]){
    await page.setViewportSize({width,height});
    await root.locator('[data-kind="activity"]').click();
    await root.locator('.cr-body').evaluate(e=>e.scrollTop=0);
    await page.waitForFunction(()=>[...document.querySelectorAll('#community-rating img')].every(e=>e.complete&&e.naturalWidth>0));
    const bounds=await root.evaluate(e=>{const body=e.querySelector('.cr-body'),r=e.getBoundingClientRect(),close=e.querySelector('.cr-close').getBoundingClientRect();return {w:e.clientWidth,scroll:e.scrollWidth,bw:body.clientWidth,bs:body.scrollWidth,top:r.top,bottom:r.bottom,closeBottom:close.bottom,viewport:innerHeight,font:parseFloat(getComputedStyle(e.querySelector('#communityRankingLead')).fontSize),background:getComputedStyle(e).backgroundImage};});
    assert(bounds.scroll<=bounds.w+1&&bounds.bs<=bounds.bw+1,'Horizontal overflow '+width);
    assert(bounds.top>=0&&bounds.bottom<=height+1&&bounds.closeBottom<=height,'Visible dialog and close '+width);
    assert(bounds.font>=16&&bounds.background.includes('rytni-player-room-space-v1.webp'),'Readable site visual system');
    await overlay.screenshot({path:`docs/qa/community-ranking-popup-${width}.png`});sizes.push(width);
    await root.locator('.cr-body').evaluate(e=>e.scrollTop=e.scrollHeight);
    assert(await root.locator('.cr-method summary').isVisible(),'Scrollable content');
    await root.locator('[data-close-popup]').click();assert(!await root.isVisible(),'Close button works when scrolled');
    await open();
  }
  await page.setViewportSize({width:1366,height:900});
  await page.mouse.click(2,2);assert(!await root.isVisible(),'Backdrop closes');
  // Shared popup system must still work for the existing personal account.
  await page.locator('[data-open-application-tool][data-tool-mode="card"]').first().click();
  await page.waitForFunction(()=>document.getElementById('applicationPopup').getAttribute('aria-hidden')==='false');
  await page.keyboard.press('Escape');assert(!await root.isVisible(),'Existing personal account remains independent');
  async function reloadAndOpen(){await page.reload();await page.locator('[data-open-community-ranking]').click();}
  try{
    await page.route(endpoint,r=>r.fulfill({json:{status:'NOT_PUBLISHED'}}));
    await reloadAndOpen();await page.waitForFunction(()=>document.querySelector('[data-empty] strong')?.textContent==='Рейтинг готовится');
    assert(await root.locator('.cr-person').count()===0,'Empty state');
  }finally{await page.unroute(endpoint);}
  try{
    await page.route(endpoint,r=>r.fulfill({status:503,json:{message:'Fixture unavailable'}}));
    await reloadAndOpen();await page.waitForFunction(()=>document.querySelector('[data-empty] strong')?.textContent==='Рейтинг временно недоступен');
    assert(await root.locator('.cr-person').count()===0,'Error state');
  }finally{await page.unroute(endpoint);}
  await reloadAndOpen();await page.waitForFunction(()=>document.querySelector('[data-podium] article'));
  return {pass:true,combined30DayCategories:3,noFilters:true,viewports:sizes,modal:true,focus:true,keyboard:true,top50:true,search:true,channelLinks:true,empty:true,error:true,existingPersonalAccount:true,winnerBadges:true,privateProgression:true,noLikesTab:true};
}
