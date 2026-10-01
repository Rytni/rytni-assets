// Against local canonical-source fixture only. Anonymous preview, writes blocked.
async page=>{
  const report={errors:[],warnings:[],assets:[],cases:[]},out='.playwright-cli/phase2a';
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='warning'&&/aria-hidden|focus/i.test(m.text()))report.warnings.push(m.text());});
  page.on('requestfailed',r=>{if(/mushroom-fly/.test(r.url()))report.assets.push(r.url());});
  page.on('response',r=>{if(r.status()>=400&&/mushroom-fly/.test(r.url()))report.assets.push(r.url()+':'+r.status());});
  await page.route('**/rest/v1/rpc/**',r=>/\/(get_|list_|is_)/.test(r.request().url())?r.continue():r.abort());
  await page.goto('http://127.0.0.1:8771/.playwright-cli/phase2a/host.html?arcade_preview=1&progression_preview=1&arcade_diag=1');
  await page.setViewportSize({width:1366,height:768});
  await page.waitForFunction(()=>!!window.RytniArcadeHub);
  await page.evaluate(()=>{applicationToolMode='boost';renderApplicationProfile({id:'qa',user_id:'qa',email_linked:true,name:'QA',participant_number:7,steamid:'111111111',region:'Беларусь',level:11,points:7575,can_boost:true,test_mode:true});});
  const a=n=>page.locator(`[data-ms-action="${n}"]`).filter({visible:true}).last();
  const fly=n=>page.locator(`[data-menu-action="${n}"]`).filter({visible:true}).last();
  for(const state of ['main','playing','paused']){
    await page.evaluate(()=>{document.getElementById('mushroomSoundBtn')?.focus();showPopup('applicationPopup');RytniProgressionTabs.refresh();});
    await page.locator('[data-progression-tab=arcade]').click();await a('game-fly').click();await page.evaluate(()=>RytniBrowserArcade.qaReady());
    if(state==='main')await fly('fullscreen').click();
    else {await fly('training').click();await page.waitForFunction(()=>RytniBrowserArcade.qaRuntime().running);await page.locator('#arcadeFullscreen').click();if(state==='paused')await page.locator('#arcadePause').click();}
    await page.waitForFunction(()=>!!document.fullscreenElement);
    const before=await page.evaluate(()=>RytniBrowserArcade.qaRuntime());
    await page.keyboard.press('Escape');await page.waitForTimeout(100);
    const first=await page.evaluate(()=>({full:!!document.fullscreenElement,popup:applicationPopup.getAttribute('aria-hidden'),selected:RytniArcadeHub.selected,runtime:RytniBrowserArcade.qaRuntime()}));
    if(first.full||first.popup!=='false'||first.selected!=='fly'||first.runtime.running!==before.running||first.runtime.paused!==before.paused)throw Error('Fullscreen Escape changed game state: '+state);
    await page.locator('#msFlyWrap .rytni-arcade-stage').scrollIntoViewIfNeeded();
    await page.screenshot({path:`${out}/fly-${state}-after-first-escape.png`});
    const focusAtHide=await page.evaluate(()=>{const old=applicationPopup.setAttribute.bind(applicationPopup);window.__focusAtHide=null;applicationPopup.setAttribute=(k,v)=>{if(k==='aria-hidden'&&v==='true')__focusAtHide={inside:applicationPopup.contains(document.activeElement),id:document.activeElement.id};return old(k,v);};return true;});
    await page.keyboard.press('Escape');await page.waitForTimeout(150);
    const second=await page.evaluate(()=>({popup:applicationPopup.getAttribute('aria-hidden'),selected:RytniArcadeHub.selected,focus:__focusAtHide}));
    if(second.popup!=='true'||second.selected!==null||second.focus?.inside)throw Error('Popup focus/second Escape failed: '+state);
    report.cases.push({state,before,first,second});
  }
  // Closing all popup layers has the same pre-hide focus guarantee.
  await page.evaluate(()=>{showPopup('applicationPopup');});await page.waitForTimeout(40);
  await page.evaluate(()=>{document.querySelector('#applicationPopup button')?.focus();closePopups();});
  report.closeAll=await page.evaluate(()=>({inside:applicationPopup.contains(document.activeElement),hidden:applicationPopup.getAttribute('aria-hidden')}));
  if(report.closeAll.inside||report.warnings.length||report.errors.length||report.assets.length)throw Error(JSON.stringify(report));
  await page.evaluate(report=>window.__PHASE2A_HOST__=report,report);return report;
}
