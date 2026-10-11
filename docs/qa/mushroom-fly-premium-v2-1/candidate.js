async page=>{
 const source=await(await page.request.get('http://127.0.0.1:8776/docs/qa/mushroom-fly-premium-v2/candidate.js')).text();const d=await eval('('+source.replaceAll('docs/qa/mushroom-fly-premium-v2/','docs/qa/mushroom-fly-premium-v2-1/')+')')(page);return d;
}
