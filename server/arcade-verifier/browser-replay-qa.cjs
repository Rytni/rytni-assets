async page=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/rest/v1/rpc/**',r=>/\/(get_|list_|is_|giveaway_social_rankings|giveaway_social_progression_pending)/.test(r.request().url())?r.continue():r.abort());
 await page.setViewportSize({width:1366,height:900});
 await page.waitForFunction(()=>!!window.RytniArcadeHub);
 await page.evaluate(()=>{applicationToolMode='boost';renderApplicationProfile({id:'audit-preview',user_id:'audit-preview',email_linked:true,name:'QA fixture',steamid:'111111111',region:'Беларусь',games:'QA',level:2,points:0,test_mode:true});showPopup('applicationPopup');RytniProgressionTabs.refresh();});
 await page.locator('[data-progression-tab=arcade]').click();await page.locator('[data-ms-action="game-fly"]').click();
 await page.evaluate(()=>RytniBrowserArcade.qaReady());
 const results=[];
 for(const pattern of ['none','held','taps']){
  if(results.length)await page.evaluate(()=>RytniBrowserArcade.qaShowMenu('main'));
  await page.locator('[data-menu-action="training"]').filter({visible:true}).last().click();
  await page.waitForFunction(()=>RytniBrowserArcade.qaRuntime().running);
  const result=await page.evaluate(async(pattern)=>{
   const {verifyClaim}=await import('/server/arcade-verifier/verifier-core.js');
   if(pattern==='taps'){for(let i=0;i<500&&RytniBrowserArcade.qaRuntime().running;i++)RytniBrowserArcade.qaDrive(12,false,true);}
   else RytniBrowserArcade.qaDrive(36000,pattern==='held');
   const run=RytniBrowserArcade.qaReplay();
   const verified=verifyClaim('fly',run.seed,run.proof,run.claimed);
   return {pattern,score:run.claimed.score,ticks:run.proof.ticks,events:run.proof.events.length,match:verified.score===run.claimed.score};
  },pattern);
  results.push(result);
 }
 if(errors.length)throw Error(JSON.stringify(errors));
 return {pass:true,results,errors,mode:'LOCAL_PREVIEW_NO_RANKED_WRITES'};
}
