async page=>{
 const c=await page.context().browser().newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:8776/arcade/snake-next/forest-training.html?qa=1');await p.waitForFunction(()=>window.forestTraining);
 await p.evaluate(()=>forestTraining.start());const before=await p.evaluate(()=>({mode:forestTraining.mode,status:forestTraining.status}));
 await p.evaluate(()=>forestTraining.stop());await p.locator('[data-dir="2"]').tap();const queued=await p.evaluate(()=>forestTraining.commands.length);
 await p.evaluate(()=>window.dispatchEvent(new Event('blur')));const after=await p.evaluate(()=>forestTraining.status);await c.close();return {checks:2,failures:before.mode!=='standalone'||before.status!=='playing'||queued!==1||after!=='paused'?[{before,queued,after}]:[],errors,before,queued,after};
}
