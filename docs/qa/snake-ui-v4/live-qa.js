async page=>{const src=await(await page.request.get('http://127.0.0.1:8776/docs/qa/snake-ui-v4/site-qa.js')).text();return await eval('('+src+')')(page,{live:true});}
