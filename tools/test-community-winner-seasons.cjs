// playwright-cli run-code --filename=tools/test-community-winner-seasons.cjs
// Targeted UI fixture on the published MAIN layout; no production writes.
async page=>{
 const assert=(v,m)=>{if(!v)throw Error(m);},errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/rest/v1/rpc/**',r=>/\/(get_|list_|is_|giveaway_social_rankings|giveaway_social_progression_pending)/.test(r.request().url())?r.continue():r.abort());
 await page.goto('https://rytni.live/rytni-gift');await page.waitForFunction(()=>typeof callSupabaseRpc==='function');
 const live=await page.evaluate(()=>callSupabaseRpc('giveaway_social_rankings_v2',{p_channel:'main'},12000,false,'anonymous',true));assert(live.status==='READY','Real MAIN snapshot required');
 const fixture=structuredClone(live),board=Array.from({length:5},(_,i)=>({handle:['qa_current','qa_past','qa_both','qa_legacy','qa_none'][i],active_days:10,comment_days:10,comment_weeks:3,commented_posts:6,comments:30-i,liked_posts:1,score:100-i,winner_selected:i!==4}));
 for(const k of ['comments','progression','activity'])fixture.snapshot.periods[0].scopes.all[k]=board;
 const flags={qa_current:{current_season:true,past_seasons:false},qa_past:{current_season:false,past_seasons:true},qa_both:{current_season:true,past_seasons:true},qa_legacy:{current_season:false,past_seasons:false},qa_none:{current_season:false,past_seasons:false}};
 fixture.winner_badges=flags;
 let response=fixture;
 await page.route('**/rest/v1/rpc/giveaway_social_rankings_v2',r=>r.fulfill({json:response}));
 await page.route('**/rest/v1/rpc/giveaway_social_progression_pending_v2',r=>r.fulfill({json:{status:'READY',season_id:fixture.snapshot.season_id,generated_at:fixture.snapshot.generated_at,participants:[{handle:'qa_waiting',winner_selected:true}],winner_badges:{qa_waiting:{current_season:false,past_seasons:true}}}}));
 const open=async()=>{await page.reload();await page.locator('[data-open-community-ranking]').click();await page.waitForFunction(()=>document.querySelector('[data-podium] [data-handle="qa_current"]'));};
 await open();const root=page.locator('#community-rating');
 for(const kind of ['comments','activity','progression']){
  await root.locator('[data-kind='+kind+']').click();
  for(const [name,counts] of Object.entries({qa_current:[1,0],qa_past:[0,1],qa_both:[1,1],qa_legacy:[0,0],qa_none:[0,0]})){
   const card=root.locator('[data-handle='+name+']');assert(await card.locator('.cr-winner-badge-current').count()===counts[0],kind+' current badge '+name);assert(await card.locator('.cr-winner-badge-past').count()===counts[1],kind+' past badge '+name);
  }
  assert(await root.locator('[data-handle=qa_past]').evaluate(e=>e.classList.contains('cr-past-winner')&&!e.classList.contains('cr-winner')),'Past border distinct');
 }
 await page.waitForFunction(()=>document.querySelector('[data-handle=qa_waiting] .cr-winner-badge-past'));
 assert((await root.locator('.cr-winner-legend').innerText()).includes('Победитель прошлых сезонов'),'Explicit legend');
 assert(await root.locator('[data-handle=qa_past] .cr-winner-badge-past').getAttribute('title')==='Победитель прошлых сезонов RYTNI Подари','Past tooltip');
 const widths=[];
 for(const width of [1366,768,390,320]){
  await page.setViewportSize({width,height:900});
  assert(await root.evaluate(e=>e.scrollWidth<=e.clientWidth+1),'No dialog overflow '+width);
  assert(await root.locator('.cr-body').evaluate(e=>e.scrollWidth<=e.clientWidth+1),'No body overflow '+width);
  await root.locator('[data-kind=comments]').click();
  widths.push(width);
 }
 // Legacy any-season flags must never silently become current-season wins.
 response=structuredClone(fixture);delete response.winner_badges;await open();
 assert(await root.locator('[data-handle] .cr-winner-badge').count()===0,'Missing scope metadata fails closed');
 response=structuredClone(fixture);response.winner_badges.qa_current.email='private@example.invalid';await page.reload();await page.locator('[data-open-community-ranking]').click();await page.waitForFunction(()=>document.querySelector('[data-empty] strong')?.textContent==='Рейтинг временно недоступен');
 assert(await root.locator('[data-handle] .cr-winner-badge').count()===0,'Private scope field rejected');
 assert(errors.length===0,JSON.stringify(errors));
 return {pass:true,categories:3,currentPastBothAndNone:true,pending:true,legacyFlagNotAssumedCurrent:true,privateMetadataRejected:true,widths,errors};
}
