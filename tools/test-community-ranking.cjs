// Invoke through playwright-cli run-code --filename=tools/test-community-ranking.cjs.
async page => {
  const assert=(condition,message)=>{if(!condition)throw Error(message);};
  const root=page.locator('#community-rating');
  await root.scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('[data-podium] article'));
  const live=await page.evaluate(async()=>callSupabaseRpc('giveaway_social_rankings_v1',{p_channel:'test'},12000,false,'anonymous',true));
  assert(live.status==='READY','No live snapshot');
  let combinations=0;
  for(const days of [7,14,30])for(const scope of ['all','gaming','tech'])for(const kind of ['comments','likes','activity']){
    await root.locator(`[data-days="${days}"]`).click();
    await root.locator(`[data-scope="${scope}"]`).click();
    await root.locator(`[data-kind="${kind}"]`).click();
    const expected=live.snapshot.periods.find(p=>p.days===days).scopes[scope][kind];
    const actual=await root.locator('.cr-person').evaluateAll(es=>es.map(e=>e.textContent.slice(1)));
    assert(JSON.stringify(actual)===JSON.stringify(expected.slice(0,10).map(r=>r.handle)),'Wrong members/order');
    const field={comments:'comments',likes:'liked_posts',activity:'score'}[kind];
    const values=await root.locator('.cr-value').allTextContents();
    assert(values.every((v,i)=>Number(v.replace(/\s/g,''))===expected[i][field]),'Wrong metric');
    assert(expected.every(r=>!['rytni.tv','rytni.blic'].includes(r.handle)),'Organizer ranked');
    combinations++;
  }
  await root.locator('[data-days="30"]').click();await root.locator('[data-scope="all"]').click();await root.locator('[data-kind="activity"]').click();
  await root.locator('[data-more]').click();assert(await root.locator('.cr-person').count()===50,'Top50 expansion');
  const board=live.snapshot.periods[2].scopes.all.activity;
  await root.locator('input').fill('@'+board[40].handle);await root.locator('[data-find]').evaluate(form=>form.requestSubmit());
  assert((await root.locator('[data-found]').textContent()).includes('41'),'Participant lookup');
  await root.locator('input').fill('never_a_real_member_4242');await root.locator('[data-find]').evaluate(form=>form.requestSubmit());
  assert((await root.locator('[data-found]').textContent()).includes('не найден'),'Honest lookup absence');
  await root.locator('[data-kind="comments"]').click();await root.locator('[data-kind="activity"]').click();
  await root.locator('[data-kind="activity"]').focus();await page.keyboard.press('Home');
  assert(await root.locator('[data-kind="comments"]').getAttribute('aria-selected')==='true','Keyboard tabs');
  await root.locator('[data-kind="activity"]').click();
  const sizes=[];
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:1400});
    await root.evaluate(e=>window.scrollTo(0,e.getBoundingClientRect().top+scrollY-140));
    const bounds=await root.evaluate(e=>({width:e.clientWidth,scroll:e.scrollWidth,document:document.documentElement.scrollWidth,viewport:innerWidth}));
    assert(bounds.scroll<=bounds.width+1&&bounds.document<=bounds.viewport+1,'Horizontal overflow '+width);
    await root.screenshot({path:`docs/qa/community-ranking-${width}.png`});sizes.push(width);
  }
  // No invented data in empty/error/stale states; use local browser routes only.
  const endpoint='**/rest/v1/rpc/giveaway_social_rankings_v1';
  await page.route(endpoint,route=>route.fulfill({json:{status:'NOT_PUBLISHED'}}));
  await page.reload();await page.waitForFunction(()=>document.querySelector('[data-empty] strong')?.textContent==='Рейтинг готовится');
  assert(await page.locator('.cr-person').count()===0,'Empty state leaked old rows');
  await page.unroute(endpoint);
  await page.route(endpoint,route=>route.fulfill({status:503,json:{message:'Test unavailable'}}));
  await page.reload();await page.waitForFunction(()=>document.querySelector('[data-empty] strong')?.textContent==='Рейтинг временно недоступен');
  assert(await page.locator('.cr-person').count()===0,'Error fabricated rows');
  await page.unroute(endpoint);await page.reload();await page.waitForFunction(()=>document.querySelector('[data-podium] article'));
  const result={pass:true,liveCombinations:combinations,viewports:sizes,top50:true,search:true,keyboard:true,empty:true,error:true};
  return result;
}
