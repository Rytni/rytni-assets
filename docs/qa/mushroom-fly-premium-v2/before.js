async page => {
 await page.waitForFunction(()=>window.RytniBrowserArcade?.qaReady);
 await page.evaluate(()=>RytniBrowserArcade.qaReady());
 await page.locator('#msFlyWrap').screenshot({path:'docs/qa/mushroom-fly-premium-v2/before.png',scale:'css'});
 return page.evaluate(()=>{const r=e=>{const b=e.getBoundingClientRect();return {width:b.width,height:b.height}};return {product:r(document.querySelector('#msFlyWrap')),stage:r(document.querySelector('.rytni-arcade-stage')),canvas:r(document.querySelector('#rytniArcadeCanvas'))};});
}
