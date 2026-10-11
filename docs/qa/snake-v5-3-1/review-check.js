async page=>{
 const errors=[];await page.goto('http://127.0.0.1:8776/docs/qa/snake-v5-3-1/review.html');
 await page.evaluate(async()=>{await Promise.all([...document.images].map(i=>i.decode()));});
 const images=await page.evaluate(()=>[...document.images].map(i=>({src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0})));
 if(images.some(i=>!i.loaded))errors.push('Unloaded review image');
 return {checks:images.length,failures:[],errors,images};
}
