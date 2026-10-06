async page => {
 const source=await (await page.request.get('http://127.0.0.1:8775/docs/qa/snake-ui-v3/site-qa.js')).text();
 return await eval('('+source+')')(page,{live:true});
}
