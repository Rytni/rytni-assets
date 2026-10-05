async page=>{
 const browser=page.context().browser(),base='http://127.0.0.1:8775/arcade/snake-next/',reports=[],errors=[],network=[];
 const inspect=()=>{
  const lab=window.tuningLab,g=lab.game,s=g.session,badge=document.querySelector('#dev-build'),rect=badge.getBoundingClientRect();
  return {implementation:lab.implementation,build:lab.build,status:g.status,starts:g.starts,tick:s?.tick,world:s?.world&&[s.world.width,s.world.height],session:s?.constructor.name,mode:g.vfxReviewMode??null,warnings:s?.director?.warnings.length??0,overlay:g.root.querySelector('#overlay').hidden,badge:badge.textContent,badgeVisible:rect.top>=0&&rect.bottom<=innerHeight,sourceState:document.querySelector('#training').dataset.sourceState};
 };
 const valid=r=>{
  if(r.session!=='TunnelSession'||r.status!=='playing'||r.world.join(',')!=='30,12'||!r.overlay||!r.badgeVisible||r.sourceState!=='ready')throw Error('Fresh launch mismatch '+JSON.stringify(r));
  for(const [k,v]of Object.entries({model:'PROGRESSIVE',preset:'B',camera:'FIT WORLD V2',motion:'SMOOTH V4',vfx:'VFX B.2',currentFactory:true,sourcesMatch:true}))if(r.implementation[k]!==v)throw Error(k+' mismatch');
 };
 for(const [id,mobile]of [['desktop',false],['mobile',true]]){
  const context=await browser.newContext({viewport:{width:mobile?844:1920,height:mobile?390:1080},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:mobile?2:1}),p=await context.newPage();
  try{
   p.on('pageerror',e=>errors.push(id+': '+e.message));p.on('console',m=>{if(m.type()==='error')errors.push(id+': '+m.text());});p.on('response',r=>{if(r.status()>=400)network.push(r.status()+' '+r.url());});p.on('requestfailed',r=>network.push(r.url()));
   await p.bringToFront();await p.goto(base+'game-feel-lab.html');
   await p.waitForFunction(()=>window.tuningLab?.game?.status==='playing'&&document.querySelector('#training').dataset.sourceState==='ready');
   const fresh=await p.evaluate(inspect);valid(fresh);if(fresh.starts!==1)throw Error('Duplicate initial launch');
   if(mobile&&!await p.evaluate(()=>{const r=document.querySelector('#training').getBoundingClientRect();return r.top>=document.querySelector('#dev-build').getBoundingClientRect().bottom-1&&r.bottom<=innerHeight+1;}))throw Error('Mobile game clipped by Lab chrome');
   await p.screenshot({path:'docs/qa/dev-launch/zero-click-'+id+'.png',scale:'css'});
   // Direct review clicks each start a NEW canonical session. They must work
   // after explicit menu, static mode, and old art-fixture selections too.
   const reviews=[];
   for(const mode of ['rush','roots','mist']){
    await p.reload();await p.waitForFunction(()=>window.tuningLab?.game?.status==='playing');
    const before=await p.evaluate(()=>tuningLab.game.starts);
    await p.locator('[data-vfx-review="'+mode+'"]').click();
    await p.waitForFunction(({before,mode})=>tuningLab.game.starts>before&&tuningLab.game.vfxReviewMode===mode,{before,mode});
    const r=await p.evaluate(inspect);valid(r);if(r.mode!==mode||r.starts!==2||r.tick>20||mode==='roots'&&r.warnings!==2)throw Error('Review state mismatch '+JSON.stringify(r));reviews.push(r);
   }
   if(!mobile){
    await p.evaluate(()=>tuningLab.game.action('main'));await p.waitForFunction(()=>tuningLab.game.status==='main');
    const explicitMenu=await p.evaluate(()=>tuningLab.game.session===null&&!tuningLab.game.root.querySelector('#overlay').hidden);if(!explicitMenu)throw Error('Explicit menu broken');
    await p.locator('[data-vfx-review="rush"]').click();await p.waitForFunction(()=>tuningLab.game.status==='playing'&&tuningLab.game.vfxReviewMode==='rush');valid(await p.evaluate(inspect));
    await p.locator('#run-model').selectOption('static');await p.waitForFunction(()=>!!tuningLab.game.session&&!tuningLab.game.session.world);
    await p.locator('#motion-toggle').click();await p.locator('[data-vfx-review="mist"]').click();await p.waitForFunction(()=>tuningLab.game.vfxReviewMode==='mist'&&!!tuningLab.game.session.world);valid(await p.evaluate(inspect));
    await p.locator('[data-art-fixture="desktop-50"]').click();await p.waitForFunction(()=>tuningLab.game.status==='paused'&&tuningLab.current.world.width===50);
    await p.locator('[data-vfx-review="roots"]').click();await p.waitForFunction(()=>tuningLab.game.vfxReviewMode==='roots'&&tuningLab.game.status==='playing');valid(await p.evaluate(inspect));
    await p.evaluate(()=>tuningLab.game.action('main'));await p.reload();await p.waitForFunction(()=>window.tuningLab?.game?.status==='playing');valid(await p.evaluate(inspect));
   }
   reports.push({id,zeroClicks:true,fresh,reviews});
  }finally{await context.close();}
 }
 // Cached older module has no DEV export; namespace check must show a red
 // warning while refusing both automatic and button-triggered launch.
 for(const file of ['effect-playground/visuals.js','effect-playground/vfx-presentation.js','progressive-run/director.js']){
  const context=await browser.newContext({viewport:{width:1920,height:1080}}),p=await context.newPage();
  try{
   p.on('pageerror',e=>errors.push('stale: '+e.message));
   await context.route('**/'+file,async route=>{const r=await route.fetch(),body=(await r.text()).replace("export const DEV_VFX_REVISION='vfx-b2-c426cfb';",'');await route.fulfill({response:r,body});});
   await p.goto(base+'game-feel-lab.html');await p.waitForFunction(()=>document.querySelector('#dev-build').dataset.status==='stale'&&window.tuningLab?.game);
   await p.locator('[data-vfx-review="rush"]').click();await p.waitForTimeout(100);
   const r=await p.evaluate(()=>({badge:document.querySelector('#dev-build strong').textContent,status:document.querySelector('#dev-build').dataset.status,starts:tuningLab.game.starts,session:!!tuningLab.game.session,frameVisible:getComputedStyle(document.querySelector('#training')).visibility,stamps:tuningLab.build.modules}));
   if(r.badge!=='STALE DEV MODULES — HARD RELOAD'||r.starts!==0||r.session||r.frameVisible!=='hidden')throw Error('Stale guard failed '+JSON.stringify(r));reports.push({staleFile:file,...r});
   if(file.endsWith('director.js'))await p.screenshot({path:'docs/qa/dev-launch/stale-warning.png',scale:'css'});
  }finally{await context.close();}
 }
 // Older dependencies can fail linking before namespace stamps are checked.
 {
  const context=await browser.newContext(),p=await context.newPage();
  try{
   p.on('pageerror',e=>errors.push('linking: '+e.message));
   await context.route('**/progressive-run/director.js',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('export const ROOT_LIFECYCLE','const ROOT_LIFECYCLE')});});
   await p.goto(base+'game-feel-lab.html');await p.waitForFunction(()=>document.querySelector('#dev-build').dataset.status==='stale');
   const r=await p.evaluate(()=>({badge:document.querySelector('#dev-build strong').textContent,detail:document.querySelector('#dev-build small').textContent,hidden:getComputedStyle(document.querySelector('#training')).visibility==='hidden'}));
   if(!r.hidden||!r.detail.includes('ROOT_LIFECYCLE'))throw Error('Linking failure not surfaced');reports.push({linkingFailure:r});
  }finally{await context.close();}
 }
 // Standalone Training still starts at its own menu.
 const context=await browser.newContext(),p=await context.newPage();try{await p.goto(base+'forest-training.html?qa=1');await p.waitForFunction(()=>window.forestTraining);const r=await p.evaluate(()=>({status:forestTraining.status,session:!!forestTraining.session}));if(r.status!=='main'||r.session)throw Error('Standalone changed');reports.push({standalone:r});}finally{await context.close();}
 const data={reports,errors,network},download=page.waitForEvent('download');await page.evaluate(data=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='browser.json';a.click();},data);await(await download).saveAs('docs/qa/dev-launch/browser.json');
 if(errors.length||network.length)throw Error(JSON.stringify({errors,network}));return {cases:reports.length,errors,network,fresh:reports.filter(r=>r.fresh).map(r=>({id:r.id,build:r.fresh.build,status:r.fresh.status,world:r.fresh.world}))};
}
