async page=>{const source=await(await page.request.get('http://127.0.0.1:8776/docs/qa/snake-premium-ui-v5-2-1/host-capture.js')).text();return eval('('+source+')')(page);}
