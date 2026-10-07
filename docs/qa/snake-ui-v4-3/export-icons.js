async page=>{
 await page.goto('http://127.0.0.1:8776/docs/qa/snake-ui-v4-3/icon-authoring.html');
 const keys=await page.evaluate(()=>iconKeys);
 await page.evaluate(()=>{document.body.classList.add('export');document.documentElement.style.background='transparent';});
 for(const key of keys)await page.locator('.glyph[data-key="'+key+'"]').first().screenshot({path:'grib/mushroom-snake-ui-v4-3/icons/'+key+'.png',omitBackground:true,scale:'css'});
 await page.evaluate(()=>{document.body.classList.remove('export');document.documentElement.style.background='';});
 await page.screenshot({path:'docs/qa/snake-ui-v4-3/icons-v2-review.png',fullPage:true,scale:'css'});return {icons:keys.length,keys};
}
