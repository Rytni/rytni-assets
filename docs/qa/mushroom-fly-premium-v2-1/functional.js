async page=>{
 const results=[];for(const phase of ['contracts','regression']){const resp=await page.request.get('http://127.0.0.1:8776/docs/qa/mushroom-fly-premium-v2/'+phase+'.js');const source=(await resp.text()).replaceAll('docs/qa/mushroom-fly-premium-v2/','docs/qa/mushroom-fly-premium-v2-1/').replaceAll('2.15.33-e56b72a011df','2.15.33-3e5257288eb3');results.push({phase,...await eval('('+source+')')(page)});}return {checks:results.reduce((s,r)=>s+r.checks,0),failures:results.flatMap(r=>r.failures),errors:results.flatMap(r=>r.errors),results};
}
