async page=>{
 const source=await(await page.request.get('http://127.0.0.1:8776/docs/qa/snake-presentation-v5-3-2/host.js')).text();
 return await (new Function('return ('+source+')')())(page,{live:true});
}
