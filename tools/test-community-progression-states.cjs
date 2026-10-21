// Targeted browser fixtures; all routes are removed before returning to live data.
async page=>{
  const assert=(ok,message)=>{if(!ok)throw Error(message);};
  const main='**/rest/v1/rpc/giveaway_social_rankings_v2';
  const pending='**/rest/v1/rpc/giveaway_social_progression_pending_v2';
  const live=await page.evaluate(()=>callSupabaseRpc('giveaway_social_rankings_v2',{p_channel:'test'},12000,false,'anonymous',true));
  const waiting=await page.evaluate(()=>callSupabaseRpc('giveaway_social_progression_pending_v2',{p_channel:'test'},12000,false,'anonymous',true));
  assert(waiting.participants.length>0,'Requires real waiting members');
  const chosen=waiting.participants[0],root=page.locator('#community-rating');
  const open=async()=>{await page.reload();await page.locator('[data-open-community-ranking]').click();await root.locator('[data-kind="progression"]').click();await page.waitForFunction(()=>document.querySelector('[data-podium] article'));};
  try{
    const bad=structuredClone(waiting);bad.participants[0].points=123;
    await page.route(pending,r=>r.fulfill({json:bad}));const invalidResponse=page.waitForResponse(r=>r.url().endsWith('/giveaway_social_progression_pending_v2'));await open();
    await invalidResponse;
    await page.waitForTimeout(100);
    assert(await root.locator('.cr-pending-card').count()===0,'Private-field waiting response rejected');
    assert(await root.locator('[data-podium] article').count()>0,'Confirmed ranking survives waiting validation failure');
    await page.unroute(pending);

    const promoted=structuredClone(live),board=promoted.snapshot.periods[0].scopes.all.progression;
    board.push({...board[0],...chosen});
    const after={...waiting,participants:waiting.participants.slice(1)};
    await page.route(main,r=>r.fulfill({json:promoted}));await page.route(pending,r=>r.fulfill({json:after}));await open();
    await page.waitForFunction(h=>!!document.querySelector('[data-list] [data-handle="'+h+'"]'),chosen.handle);
    await page.waitForFunction(n=>document.querySelectorAll('.cr-pending-card').length===n,after.participants.length);
    assert(await root.locator('[data-list] [data-handle="'+chosen.handle+'"]').count()===1,'Confirmed member obtains a real place');
    assert(await root.locator('.cr-pending-card[data-handle="'+chosen.handle+'"]').count()===0,'Confirmed member loses disqualification');
    await page.unroute(main);await page.unroute(pending);

    await page.route(pending,r=>r.fulfill({status:503,json:{message:'Fixture unavailable'}}));const failedResponse=page.waitForResponse(r=>r.url().endsWith('/giveaway_social_progression_pending_v2'));await open();
    await failedResponse;
    await page.waitForTimeout(100);
    assert(await root.locator('[data-podium] article').count()===live.snapshot.periods[0].scopes.all.progression.slice(0,3).length,'Waiting failure preserves confirmed ranking');
    assert(await root.locator('.cr-pending-card').count()===0,'No fabricated waiting fallback');
  }finally{await page.unroute(main);await page.unroute(pending);await open();}
  await page.waitForFunction(n=>document.querySelectorAll('.cr-pending-card').length===n,waiting.participants.length);
  assert(await root.locator('.cr-pending-card[data-handle="'+chosen.handle+'"]').count()===1,'Real state restored after fixtures');
  return {pass:true,promotionRemovesMark:true,privateWaitingFieldRejected:true,waitingFailureIsolated:true,liveStateRestored:true};
}
