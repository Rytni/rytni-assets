async (page,options={})=>{
 // Retain real host/Training/Fly flows, update only V5 output paths.
 let source=await(await page.request.get('http://127.0.0.1:8776/docs/qa/snake-ui-v4-1/site-qa.js')).text();
 if(options.viewport)source=source.replace('mobile?{width:844,height:390}:{width:1920,height:1080}','mobile?{width:844,height:390}:'+JSON.stringify(options.viewport));
 if(options.tag)source=source.replace("mode=options.live?'live':'candidate'","mode=options.live?'live-"+options.tag+"':'candidate-"+options.tag+"'");
 source=source.replaceAll('docs/qa/snake-ui-v4-1/','docs/qa/snake-premium-ui-v5-implementation/').replaceAll('snake_ui_v4_1=1','snake_premium_v5=1');
 const run=eval('('+source+')'),result=await run(page,options);return result;
}
