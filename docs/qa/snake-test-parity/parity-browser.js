async page => {
  await page.route('**/*',route=>route.continue());
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('http://127.0.0.1:8775/arcade/snake-next/product/index.html');
  await page.waitForSelector('[data-action="training"]');
  const results=[];
  for (const [label,width,height,embedded,fullscreen] of [['desktop1366',1366,768],['desktop1920',1920,1080],['desktop2560',2560,1440],['zoom125',1093,614],['embedded436',436,245,true],['landscape844',844,390],['portrait390',390,844],['fullscreen1366',1366,768,false,true],['fullscreen844',844,390,false,true]]) {
    await page.setViewportSize({width,height});
    await page.evaluate(({embedded,width,height,fullscreen})=>{
      const cabinet=document.querySelector('#cabinet');
      cabinet.className='cabinet'+(fullscreen?' pseudo-fullscreen':'');
      cabinet.style.cssText=embedded?`width:${width}px;height:${height}px;margin:0`:'';
    },{embedded,width,height,fullscreen});
    for(const screen of ['main','pause','confirm-restart','confirm-exit','no-attempts','error','settings','rules','result','mobile-gate']) {
      const metrics=await page.evaluate(async screen=>{
        const {view}=await import('/arcade/snake-next/product/ui.js');
        const c={screen,hub:{success:true,available:true,attempts_remaining:3,sponsor_attempt_available:true,best_score:12480,my_rank:4,leaderboard:Array.from({length:10},(_,i)=>({place:i+1,name:'Игрок '+(i+1),score:12500-i*750,is_me:i===3}))},run:{mode:'training'},result:{accepted:true,record:true,response:{score:12480},stats:{score:12480,foods:24,length:32,max_combo:5,world:[40,16]}},hostSwitch:true};
        document.querySelector('#product').dataset.screen=screen;
        document.querySelector('#menu').innerHTML=view(c,{muted:false,music:.5,sfx:.5,master:.5,quality:'full'});
        await Promise.all([...document.querySelectorAll('#menu img')].map(i=>i.decode().catch(()=>{})));
        const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
        const stage=rect(document.querySelector('#cabinet')),panel=document.querySelector('.fantasy-panel'),body=document.querySelector('.panel-body');
        const buttons=[...document.querySelectorAll('#menu button')].filter(e=>e.getClientRects().length).map(e=>({action:e.dataset.action||e.dataset.tab,close:e.classList.contains('panel-close'),...rect(e)}));
        return {screen,stage,panel:panel?rect(panel):null,size:panel?.dataset.size,bodyScroll:body?getComputedStyle(body).overflowY:null,panelScroll:panel?getComputedStyle(panel).overflowY:null,panelOverflow:panel?panel.scrollWidth>panel.clientWidth:false,pageOverflow:document.documentElement.scrollWidth>innerWidth,buttons};
      },screen);
      const fail=message=>{throw new Error(`${label}/${screen}: ${message}; ${JSON.stringify(metrics)}`)};
      if(metrics.pageOverflow)fail('document horizontal overflow');
      if(metrics.panelOverflow)fail('panel horizontal overflow');
      if(screen==='main'&&label.startsWith('desktop')&&Math.abs(metrics.stage.width/metrics.stage.height-16/9)>.01)fail('menu stage must be 16:9');
      if(screen!=='main') {
        const max={pause:560,'confirm-restart':560,'confirm-exit':560,'no-attempts':560,error:560,settings:680,rules:860,result:760,'mobile-gate':560}[screen];
        if(metrics.panel.width>max+.5)fail(`panel exceeds semantic maximum ${max}`);
        if(metrics.panelScroll!=='hidden'||metrics.bodyScroll!=='auto')fail('only panel body may scroll');
        const close=metrics.buttons.find(b=>b.close);
        if(!close||close.width<47.9||close.height<47.9)fail('close target must be 48x48');
      }
      for(const b of metrics.buttons) {
        if(b.width<43.9||b.height<43.9)fail(`small target ${b.action}`);
        const fixedAction=screen==='main'||(b.action&&!['mute','quality','fullscreen'].includes(b.action));
        if(fixedAction&&(b.x<metrics.stage.x-.5||b.y<metrics.stage.y-.5||b.right>metrics.stage.right+.5||b.bottom>metrics.stage.bottom+.5))fail(`unreachable action ${b.action}`);
      }
      results.push({viewport:label,screen,width:metrics.panel?.width??metrics.stage.width,height:metrics.panel?.height??metrics.stage.height,minTarget:Math.min(...metrics.buttons.map(b=>b.height)),overflow:false});
      if(['desktop1366','landscape844','embedded436','portrait390','fullscreen844'].includes(label)&&['main','pause','settings','rules','result','mobile-gate'].includes(screen))await page.locator('#cabinet').screenshot({path:`docs/qa/snake-test-parity/snake-${label}-${screen}.png`});
    }
  }
  await page.evaluate(results=>window.snakeParityResults=results,results);
  return {passed:results.length,minimumTarget:Math.min(...results.map(r=>r.minTarget)),samples:results.filter(r=>['desktop1366','embedded436','fullscreen844','portrait390'].includes(r.viewport)&&['main','pause','settings','rules','result'].includes(r.screen))};
}
