async page=>{
 const source=await(await page.request.get('http://127.0.0.1:8776/docs/qa/mushroom-fly-premium-v2-1/hud.js')).text();const modified=source.replace("await p.goto(","await p.route('**/08_T123_BROWSER_ARCADE_2.15.34.html',async r=>r.fulfill({response:await p.request.get('http://127.0.0.1:8776/docs/qa/mushroom-fly-premium-v2-1/baseline-fly.html')}));await p.goto(").replaceAll('/gameplay-hud-','/before-gameplay-hud-').replaceAll('/actual-pause-','/before-actual-pause-');return await eval('('+modified+')')(page);
}
