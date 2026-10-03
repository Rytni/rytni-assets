async page=>{
 const browser=page.context().browser(),base='http://127.0.0.1:8773',url=base+'/arcade/snake-next/forest-training.html?qa=1',dir='docs/qa/forest-pickup-food/';
 const baseline=await page.evaluate(async base=>(await fetch(base+'/docs/qa/forest-final-v3/baseline.json')).json(),base);
 const errors=[],warnings=[],failed=[],http=[],measurements=[],drawChecks=[];
 const assert=(ok,m)=>{if(!ok)throw Error(m);};
 const attach=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',e=>{if(['warning','error'].includes(e.type()))warnings.push(e.text());});p.on('requestfailed',r=>failed.push(r.url()));p.on('response',r=>{if(r.status()>=400)http.push({url:r.url(),status:r.status()});});};
 const measure=async p=>{
  await p.waitForFunction(()=>{const g=forestTraining,r=g.root.getBoundingClientRect();return Math.abs(g.renderer.w-r.width)<1&&Math.abs(g.renderer.h-r.height)<1;});
  return p.evaluate(async()=>{
   const g=forestTraining,{objectImage,objectRect,OBJECTS}=await import('/arcade/snake-next/forest-training/objects.js');
   return {viewport:[innerWidth,innerHeight],layout:g.renderer.last,boxes:[...document.querySelectorAll('#game,#hud,#hud .stat,#effects,#hud button,#pad,#pad button')].map(n=>({id:n.id||n.dataset.action||n.dataset.dir||n.className,box:n.getBoundingClientRect().toJSON()})),objects:Object.keys(OBJECTS).map(key=>{const im=objectImage(g.art,key),r=objectRect(im,key,0,0,g.renderer.last.cell);return {key,intrinsic:[im.width,im.height],rendered:[r.w,r.h],aspect:im.width/im.height,renderedAspect:r.w/r.h,visualScale:r.visualScale,uniformScale:r.scale,anchor:OBJECTS[key].anchor,offset:OBJECTS[key].offset};})};
  });
 };
 const fixture=(p,touch)=>p.evaluate(async touch=>{
  const g=forestTraining;g.touch=touch;g.start();g.stop();g.session=new g.preview.constructor({touch});const s=g.session,{createState}=await import('/arcade/snake-next/entry.js');
  const body=[],push=(x,y)=>body.push(x+y*28);for(let y=8;y>=5;y--)push(7,y);for(let x=8;x<=16;x++)push(x,5);for(let y=4;y>=2;y--)push(16,y);for(let x=17;x<=22;x++)push(x,2);
  s.state=createState({seed:56103,rules:s.rules,arena:s.arena,body:body.reverse(),direction:1,food:79});s.score=12400;s.combo=3;s.tick=1500;s.effects=[];s.pickups=[{kind:'focus',cell:117,ends:2700},{kind:'harvest',cell:244,ends:2700},{kind:'rush',cell:218,ends:2700}];s.portal.phase='armed';g.status='playing';g.show();g.render();
 },touch);
 const geometry=(m,b)=>{assert(JSON.stringify(m.layout)===JSON.stringify(b.layout),'Locked layout changed');for(let i=0;i<m.boxes.length;i++)for(const k of ['x','y','width','height'])assert(m.boxes[i].box[k]===b.boxes[i].box[k],'Locked bounding box changed '+m.boxes[i].id+' '+k);};
 const actualDraws=async p=>{
  const r=await p.evaluate(()=>{
   const g=forestTraining,ctx=g.renderer.canvas.getContext('2d'),draw=ctx.drawImage,calls=[],before=g.session.hash();
   ctx.drawImage=function(im,...args){const key=im.src?.split('/').pop()?.replace('.png','');if(['food-red','food-gold','positive','negative','stone','portal'].includes(key)){const w=args.at(-2),h=args.at(-1);calls.push({key,intrinsic:[im.width,im.height],rendered:[w,h],scaleX:w/im.width,scaleY:h/im.height});}return draw.call(this,im,...args);};
   try{g.render();}finally{ctx.drawImage=draw;}return {viewport:[innerWidth,innerHeight],calls,stateUnchanged:before===g.session.hash()};
  });
  assert(r.stateUnchanged&&r.calls.length>0,'Rendering mutated simulation');assert(r.calls.every(c=>Math.abs(c.scaleX-c.scaleY)<1e-12),'Non-uniform actual draw');drawChecks.push(r);
 };
 let desktopCell,mobileCell;
 const ctx=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1}),p=await ctx.newPage();attach(p);await p.goto(url);await p.waitForFunction(()=>window.forestTraining);await fixture(p,false);
 let m=await measure(p);desktopCell=m.layout.cell;geometry(m,baseline[0]);measurements.push(m);await actualDraws(p);
 await p.screenshot({path:dir+'05-desktop-1920.png'});
 const food=await p.evaluate(()=>{const g=forestTraining,l=g.renderer.last,c=g.session.state.food,stage=g.root.getBoundingClientRect();return {x:stage.x+l.field.x+(c%28+.5)*l.cell,y:stage.y+l.field.y+(Math.floor(c/28)+.5)*l.cell};});
 await p.screenshot({path:dir+'02-mushroom-in-arena.png',clip:{x:Math.floor(food.x-desktopCell*1.5),y:Math.floor(food.y-desktopCell*1.5),width:Math.ceil(desktopCell*3),height:Math.ceil(desktopCell*3)}});
 await p.evaluate(()=>{forestTraining.session.effects=[{kind:'harvest',ends:2220}];forestTraining.render();});geometry(await measure(p),baseline[0]);await actualDraws(p);await p.screenshot({path:dir+'03-golden-harvest.png'});
 await p.evaluate(()=>forestTraining.main());await p.locator('[data-action=start]').click();await p.waitForFunction(()=>forestTraining.session.foods===1);await p.locator('[data-action=pause]').click();
 const pickup=await p.evaluate(()=>{const s=forestTraining.session;return {foodCount:s.foods,length:s.state.length,foodCell:s.state.food,score:s.score,paused:forestTraining.status==='paused',audio:forestTraining.audio.summary()};});
 assert(pickup.foodCount===1&&pickup.length===9&&pickup.foodCell>=0&&pickup.score>=100&&pickup.paused,'Actual atomic mushroom pickup regression');await p.locator('[data-action=resume]').click();await p.waitForFunction(()=>forestTraining.status==='playing');await p.locator('[data-action=pause]').click();
 await p.setViewportSize({width:1366,height:768});await fixture(p,false);m=await measure(p);geometry(m,baseline[1]);measurements.push(m);await actualDraws(p);
 const mobile=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true,deviceScaleFactor:1}),q=await mobile.newPage();attach(q);await q.goto(url);await q.waitForFunction(()=>window.forestTraining);await fixture(q,true);m=await measure(q);mobileCell=m.layout.cell;geometry(m,baseline[2]);measurements.push(m);await actualDraws(q);await q.screenshot({path:dir+'06-mobile-844.png'});
 assert(await q.evaluate(()=>[...document.querySelectorAll('#hud button,#pad button')].every(n=>{const r=n.getBoundingClientRect();return r.width>=44&&r.height>=44;})),'Touch targets changed');await q.locator('#pad [data-dir="2"]').tap();assert(await q.evaluate(()=>forestTraining.commands.some(c=>c.direction===2)),'D-pad input regression');await mobile.close();
 // Native-scale display samples call the same production drawObject function.
 await p.setViewportSize({width:720,height:260});await p.evaluate(async({desktopCell,mobileCell})=>{
  const g=forestTraining,{drawObject}=await import('/arcade/snake-next/forest-training/objects.js');
  const host=document.createElement('div');host.id='native-review';host.style.cssText='position:fixed;inset:0;z-index:20;background:#061b16;color:#dfd3ac;font:14px monospace;padding:12px';document.body.append(host);
  const make=(w,h)=>{const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.style.cssText=`width:${w}px;height:${h}px;display:block`;host.append(canvas);return canvas.getContext('2d');};
  host.textContent='Normal red mushroom — actual desktop / mobile runtime size';let c=make(680,180);c.imageSmoothingEnabled=false;
  for(const [x,cell,label] of [[140,desktopCell,'desktop cell '+desktopCell.toFixed(2)],[450,mobileCell,'mobile cell '+mobileCell.toFixed(2)]]){for(let y=20;y<124;y+=8)for(let xx=x-52;xx<x+52;xx+=8){c.fillStyle=((xx-x+52)/8+(y-20)/8)%2?'#263d34':'#334c40';c.fillRect(xx,y,8,8);}drawObject(c,g.art,'food-red',x,72,cell);c.font='13px monospace';c.fillStyle='#eee1bb';c.fillText(label,x-88,150);}
 },{desktopCell,mobileCell});await p.screenshot({path:dir+'01-red-mushroom-native.png',clip:{x:0,y:0,width:720,height:218}});
 await p.evaluate(async({desktopCell,mobileCell})=>{
  const g=forestTraining,{drawObject}=await import('/arcade/snake-next/forest-training/objects.js'),host=document.querySelector('#native-review');host.textContent='Category silhouettes — actual runtime scale; no enlargement';const canvas=document.createElement('canvas');canvas.width=680;canvas.height=210;canvas.style.cssText='width:680px;height:210px';host.append(canvas);const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
  const keys=['food-red','positive','negative','stone','portal'];for(const [y,cell,label] of [[58,desktopCell,'desktop'],[164,mobileCell,'mobile']]){c.font='13px monospace';c.fillStyle='#c9b984';c.fillText(label,2,y);for(let i=0;i<keys.length;i++){const x=128+i*115;drawObject(c,g.art,keys[i],x,y,cell);c.fillStyle='#eee1bb';c.fillText(keys[i].replace('food-red','food'),x-28,y+46);}}
 },{desktopCell,mobileCell});await p.screenshot({path:dir+'04-category-lineup-native.png',clip:{x:0,y:0,width:720,height:260}});await ctx.close();
 const result={baselineCommit:'764e180b62737783ffdbe3a4118e6daf5b362779',rootCause:'Square destination fitting: positive 88x54 became 1:1; seed 44x64 became 1:1. Source alpha bounds are tight; no transparent-padding issue.',lockedGeometryUnchanged:true,measurements,drawChecks,pickup,errors,warnings,failed,http};
 const pending=page.waitForEvent('download');await page.evaluate(r=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(r,null,2)],{type:'application/json'}));a.download='measurements.json';a.click();},result);await(await pending).saveAs(dir+'measurements.json');assert(!errors.length&&!warnings.length&&!failed.length&&!http.length,'Console/network errors');return {geometry:'unchanged',uniformDraws:drawChecks.every(d=>d.calls.every(c=>Math.abs(c.scaleX-c.scaleY)<1e-12)),pickup,objects:measurements.map(m=>({viewport:m.viewport,cell:m.layout.cell,objects:m.objects})),errors,warnings,failed,http};
}
