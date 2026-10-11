async page=>{
 const c=await page.context().browser().newContext({viewport:{width:1366,height:768}}),p=await c.newPage();
 await p.goto('https://rytni.live/testpodari?arcade_preview=1&progression_preview=1&ttq_preview=1');await p.waitForSelector('#rytniProgressionHub',{state:'attached'});
 await p.evaluate(()=>{let e=document.querySelector('#rytniProgressionHub');while(e&&e!==document.body){e.hidden=false;if(getComputedStyle(e).display==='none')e.style.display='block';e=e.parentElement;}});await p.locator('[data-progression-tab=arcade]').click();await p.locator('#msHub img').first().waitFor();await p.evaluate(async()=>{await Promise.all([...document.querySelectorAll('#msHub img')].map(i=>i.decode()));});
 await p.locator('#msHub').screenshot({path:'docs/qa/arcade-premium-v2/01-current.png',scale:'css'});
 await p.route('**/arcade-concept.png',r=>r.fulfill({path:'grib/arcade-v2/arcade-backdrop-desktop.png',contentType:'image/png'}));
 await p.addStyleTag({content:'#msHub{background:#080b1a url("https://rytni.live/arcade-concept.png") center/cover!important;padding:34px!important;border-color:#716347!important}.ms-next-card{background:#111524e8!important;display:flex!important;flex-direction:column!important}.ms-next-copy{flex:1;display:flex;flex-direction:column}.ms-next-copy p{flex:1}.ms-next-copy button{align-self:start;margin-top:auto}'});await p.waitForTimeout(1000);
 await p.locator('#msHub').screenshot({path:'docs/qa/arcade-premium-v2/04-cards-on-concept.png',scale:'css'});await c.close();return {checks:2,failures:[],errors:[]};
}
