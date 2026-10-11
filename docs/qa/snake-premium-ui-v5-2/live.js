async page=>{const source=await(await page.request.get('http://127.0.0.1:8776/docs/qa/snake-premium-ui-v5-2/host.js')).text();return await eval('('+source+')')(page,{live:true});}
