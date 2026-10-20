async page=>{
 const rows=[],errors=[],failures=[],runtime=new URL(page.url()).searchParams.get('runtime');let checks=0;
 const check=(ok,name,data)=>{checks++;if(!ok)failures.push({name,data});};
 for(const mobile of [false,true]){
  const context=await page.context().browser().newContext({viewport:mobile?{width:390,height:844}:{width:1366,height:768},isMobile:mobile,hasTouch:mobile});
  const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));
  await context.route('**/rest/v1/**',r=>{errors.push('Unexpected real database call');return r.abort();});
  await p.addInitScript(()=>{
   if(window.top!==window)return;
   window.RYTNI_RELEASE='test-release';window.currentApplication={id:'qa-linked-participant',name:'QA'};window.__calls=[];
   const loaded=import('/arcade/snake-next/product/backend.js').then(m=>window.__mock=m.createMockBackend('leaderboard-empty'));
   window.callSupabaseRpc=async(name,args)=>{
    window.__calls.push({name,args});await loaded;
    if(name==='get_snake_product_hub_v1')return window.__mock.hub();
    if(name==='start_snake_product_attempt_v1')return window.__mock.start({release:args.p_release,requestId:args.p_request_id});
    if(name==='claim_snake_product_sponsor_v1')return window.__mock.claim({release:args.p_release,requestId:args.p_request_id});
    if(name==='finish_snake_product_attempt_v1')return window.__mock.finish({attempt_id:args.p_attempt_id,release:args.p_release,score:args.p_score});
    return {success:false,status:'disabled'};
   };
   window.getClientToken=()=> 'qa-parent-private-token';
  });
  await p.goto('http://127.0.0.1:8789/docs/qa/snake-test-parity/host-fixture.html?qa=1'+(runtime?'&runtime='+encodeURIComponent(runtime):''));
  await p.waitForFunction(()=>window.hostFixtureReady);
  await p.locator('[data-ms-action=game-snake]').click();
  const frame=await p.locator('#msNextStage iframe').elementHandle().then(e=>e.contentFrame());
  await frame.waitForFunction(()=>window.snakeProduct?.controller.screen==='main');
  const initial=await frame.evaluate(()=>({mode:snakeProduct.backend.mode,hub:snakeProduct.controller.hub,release:snakeProduct.release}));
  const expectedRelease=runtime?.match(/\/(snake-next-[a-f0-9]{12})\//)?.[1]||'test-release';
  check(initial.mode==='ranked'&&initial.release===expectedRelease,'Hosted adapter is real transport, not in-frame mocks',initial);
  check(initial.hub.attempts_total===1&&initial.hub.attempts_remaining===1&&initial.hub.sponsor_attempt_limit===2,'Menu quota 1+2',initial.hub);
  check(initial.hub.leaderboard.length===0,'Empty real-contract board has no fabricated players');
  if(mobile){
   await frame.locator('#menu [data-action=play]').click();await frame.waitForFunction(()=>snakeProduct.controller.screen==='mobile-gate');
   check((await p.evaluate(()=>__calls.filter(x=>x.name==='start_snake_product_attempt_v1').length))===0,'Portrait spends zero attempts');
   await frame.locator('[data-action=gate-cancel]').click();await p.setViewportSize({width:844,height:390});
  }
  await frame.locator('#menu [data-action=play]').click();
  await frame.waitForFunction(()=>snakeProduct.controller.screen==='playing');
  await frame.evaluate(()=>snakeProduct.controller.pause());
  const started=await frame.evaluate(()=>({seed:snakeProduct.game.session.state.seed,run:snakeProduct.controller.run}));
  check(started.run.seed===76194,'Authoritative seed reaches product run',started);
  check((await p.evaluate(()=>__calls.filter(x=>x.name==='start_snake_product_attempt_v1').length))===1,'One button action = one authenticated start call');
  // Synthetic local transport result only. No live player data/attempts are touched.
  await frame.evaluate(()=>snakeProduct.controller.finish({...snakeProduct.bridge.stats(),score:950,foods:1}));
  await frame.waitForFunction(()=>snakeProduct.controller.screen==='result');
  const result=await frame.evaluate(()=>({accepted:snakeProduct.controller.result.accepted,hub:snakeProduct.controller.hub}));
  check(result.accepted&&result.hub.best_score===950&&result.hub.my_rank===1,'Finish refreshes actual adapter board/record/rank',result);
  check(result.hub.attempts_remaining===0&&result.hub.sponsor_attempt_available,'Normal exhausted, sponsor available');
  await frame.evaluate(()=>snakeProduct.controller.abandon());
  await frame.locator('#menu [data-action=sponsor]').click();
  await frame.waitForFunction(()=>snakeProduct.controller.hub?.sponsor_attempt_credits===1);
  check((await p.evaluate(()=>__calls.filter(x=>x.name==='claim_snake_product_sponsor_v1').length))===1,'Sponsor single claim through separate Snake RPC');
  check(await frame.locator('a.notice').evaluate(a=>a.rel.includes('noopener')&&a.target==='_blank'),'Sponsor destination safe explicit link');
  // Training must neither spend nor submit even in hosted ranked mode.
  const before=await p.evaluate(()=>__calls.filter(x=>x.name!=='get_snake_product_hub_v1'&&x.name.includes('snake')).length);
  await frame.locator('#menu [data-action=training]').click();await frame.waitForFunction(()=>snakeProduct.controller.screen==='playing');
  await frame.evaluate(()=>snakeProduct.controller.pause());
  await frame.evaluate(()=>snakeProduct.controller.finish(snakeProduct.bridge.stats()));
  check((await p.evaluate(()=>__calls.filter(x=>x.name!=='get_snake_product_hub_v1'&&x.name.includes('snake')).length))===before,'Hosted Training has zero start/finish RPCs');
  check(await frame.evaluate(()=>snakeProduct.controller.result.training),'Training terminal state');
  await frame.evaluate(()=>{snakeProduct.controller.abandon();});await frame.waitForFunction(()=>snakeProduct.controller.screen==='main');
  await frame.evaluate(()=>document.fonts.ready);
  await frame.locator('body').screenshot({path:`docs/qa/arcade-ranked/menu-${mobile?'mobile':'desktop'}.png`,animations:'disabled'});
  rows.push({mobile,initial,result,calls:await p.evaluate(()=>__calls.map(c=>c.name))});
  await context.close();
 }
 return {checks,failures,errors,rows};
}
