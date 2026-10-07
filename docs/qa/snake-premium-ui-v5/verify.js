async page => {
 const ctx=await page.context().browser().newContext(),p=await ctx.newPage(),errors=[],failed=[],remote=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)failed.push([r.status(),r.url()]);});p.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:8776/')&&!r.url().startsWith('data:'))remote.push(r.url());});
 try{
  await p.goto('http://127.0.0.1:8776/docs/qa/snake-premium-ui-v5/review.html');
  const review=await p.evaluate(async()=>{document.querySelectorAll('details').forEach(e=>e.open=true);await Promise.all([...document.images].map(e=>e.decode()));return {images:document.images.length,native:!document.body.classList.contains('fit')};});
  if(!review.native)throw Error('Review must start at native 1x');
  await p.locator('#scale').click();if(!await p.locator('body').evaluate(e=>e.classList.contains('fit')))throw Error('Fit switch failed');await p.locator('#scale').click();
  const frames=[];
  for(const [name,width,height]of [['main-premium-desktop',1920,1080],['main-premium-1366',1366,768],['result-premium-desktop',1920,1080],['result-premium-1366',1366,768],['result-premium-mobile',844,390],['ranking-premium',1920,1080]]){
   await p.setViewportSize({width,height});await p.goto('http://127.0.0.1:8776/docs/qa/snake-premium-ui-v5/scene.html?name='+name);
   const m=await p.evaluate(async()=>{const e=document.querySelector('#art');await e.decode();return {source:[e.naturalWidth,e.naturalHeight],viewport:[innerWidth,innerHeight],scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],frames:document.querySelectorAll('iframe,canvas').length};});
   if(m.source[0]!==width||m.source[1]!==height||m.scroll[0]!==width||m.scroll[1]!==height||m.frames)throw Error('Incomplete/nonstatic single viewport: '+name);
   frames.push({name,...m});
  }
  if(errors.length||failed.length||remote.length)throw Error(JSON.stringify({errors,failed,remote}));return {review,frames,errors,failed,remote,productTested:false};
 }finally{await ctx.close();}
}
