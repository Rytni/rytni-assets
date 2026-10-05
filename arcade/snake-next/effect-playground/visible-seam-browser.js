async page=>{
 const before=await page.evaluate(()=>!!window.seamCaptureBefore),report={baseline:before,cases:[],errors:[],network:[]},browser=page.context().browser(),root='docs/qa/visible-seam/';
 const save=async(p,name,value,type='application/json')=>{const d=p.waitForEvent('download');await p.evaluate(({name,value,type})=>{const a=document.createElement('a');a.download=name;a.href=type==='image/png'?value:URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type}));a.click();},{name,value,type});await(await d).saveAs(root+name);};
 for(const [w,h,mobile]of [[1920,1080,false],[1366,768,false],[844,390,true]])for(const dpr of [1,1.5,2]){
  const c=await browser.newContext({viewport:{width:w,height:h},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:dpr}),p=await c.newPage();
  try{
   p.setDefaultTimeout(10000);
   p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)report.network.push(r.status()+' '+r.url());});p.on('requestfailed',r=>report.network.push(r.url()));
   await p.bringToFront();await p.goto('http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html');await p.waitForFunction(()=>window.tuningLab?.game).catch(e=>{throw Error('Lab load '+JSON.stringify({w,h,dpr,errors:report.errors,network:report.network}));});
   await p.locator('[data-stage="0"]').click();await p.waitForFunction(()=>tuningLab.current?.stage.index===0&&tuningLab.game.status==='playing').catch(async e=>{throw Error('Start '+JSON.stringify({w,h,dpr,errors:report.errors,network:report.network,state:await p.evaluate(()=>({stage:tuningLab.current?.stage,status:tuningLab.game.status}))}));});
   await p.evaluate(()=>{const g=tuningLab.game;g.pause();g.status='playing';g.show();document.querySelector('#world-awareness').checked=false;g.render();});
   await p.frameLocator('#training').locator('[data-action="fullscreen"]').first().click();await p.waitForFunction(()=>tuningLab.game.root.ownerDocument.fullscreenElement===tuningLab.game.root&&tuningLab.game.renderer.w===tuningLab.game.root.ownerDocument.defaultView.innerWidth,{},{timeout:8000}).catch(async e=>{throw Error(JSON.stringify({w,h,dpr,errors:report.errors,network:report.network,state:await p.evaluate(()=>({status:tuningLab.game.status,fullscreen:!!tuningLab.game.root.ownerDocument.fullscreenElement,w:tuningLab.game.renderer.w,win:tuningLab.game.root.ownerDocument.defaultView.innerWidth}))}));});
   const r=await p.evaluate(async before=>{
    const g=tuningLab.game,s=g.session,f=g.motion.frame(s),{drawEnvironment}=await import('./gate-one/environment.js'),{drawFrame}=await import(before?'/docs/qa/visible-seam/baseline/frame.js':'./retro-v3/renderer.js'),{compositeSeams}=await import('./effect-playground/visible-seam-qa.js');
    const hash=s.hash();g.render();const canvas=g.renderer.canvas,D=g.renderer.dpr;
    if(before){const {ProgressPresentation}=await import('/docs/qa/visible-seam/baseline/presentation.js');new ProgressPresentation(g.art).render(g.renderer,s,{fullscreen:true,compact:g.renderer.last.mobile,motion:f,status:'playing',touch:false});}
    const l=g.renderer.last;
    const make=()=>{const c=document.createElement('canvas');c.width=canvas.width;c.height=canvas.height;const x=c.getContext('2d');x.setTransform(D,0,0,D,0,0);x.imageSmoothingEnabled=false;return {c,x};},wood=make(),wall=make();
    drawFrame(wood.x,g.art,l.frame.x,l.frame.y,l.frame.w,l.frame.h,l.scale,!!l.wallOffsets);
    wall.x.beginPath();wall.x.rect(l.arena.x,l.arena.y,l.arena.w,l.arena.h);wall.x.clip();drawEnvironment(wall.x,s,tuningLab.camera,l,f,false);
    const c=128*l.scale,railSpans={Left:[l.frame.y+c,l.frame.y+l.frame.h-c],Right:[l.frame.y+c,l.frame.y+l.frame.h-c],Top:[l.frame.x+c,l.frame.x+l.frame.w-c],Bottom:[l.frame.x+c,l.frame.x+l.frame.w-c]};
    const image=c=>c.getContext('2d').getImageData(0,0,c.width,c.height),final=image(canvas),woodData=image(wood.c),wallData=image(wall.c),q=compositeSeams(final,woodData,wallData,l.cabinetAperture,D,40,railSpans);
    const sensitivity=[32,48].map(threshold=>{const z=compositeSeams(final,woodData,wallData,l.cabinetAperture,D,threshold,railSpans);return {threshold,gaps:[z.visualGapLeft,z.visualGapRight,z.visualGapTop,z.visualGapBottom],pass:z.pass};});
    // Lines follow raster-derived edges; not destination box edges.
    const diag=make();diag.x.setTransform(1,0,0,1,0,0);diag.x.drawImage(canvas,0,0);for(const [side,v]of Object.entries(q.edges))for(const pt of v.samples){const vertical=side==='Left'||side==='Right';for(const [key,color]of [['wood','#ff3434'],['wall','#00edff']])if(pt[key]!==null){diag.x.fillStyle=color;diag.x.fillRect(vertical?pt[key]:pt.t,vertical?pt.t:pt[key],1,1);}}
    const zoom=document.createElement('canvas');zoom.width=1280;zoom.height=440;const z=zoom.getContext('2d');z.imageSmoothingEnabled=false;z.fillStyle='#071512';z.fillRect(0,0,zoom.width,zoom.height);z.font='16px monospace';z.fillStyle='#ffffff';
    const mid=l.arena.x+l.arena.w/2;for(const [side,y,dy]of [['Top',l.arena.y,32],['Bottom',l.arena.y+l.arena.h,248]]){z.fillText(side+' seam x4 — RED visible wood / CYAN visible wall',12,dy-10);z.drawImage(diag.c,Math.round((mid-160)*D),Math.round((y-20)*D),320*D,40*D,0,dy,1280,160);}
    if(hash!==s.hash())throw Error('Render mutated hash');
    const failurePixels={};for(const [side,v]of Object.entries(q.edges))if(v.gap>2){const pt=v.samples.find(s=>s.gap===v.gap),vert=side==='Left'||side==='Right';failurePixels[side]=[];for(let n=Math.min(pt.wood,pt.wall)-1;n<=Math.max(pt.wood,pt.wall)+1;n++){const i=((vert?pt.t:n)*final.width+(vert?n:pt.t))*4;failurePixels[side].push({n,final:[...final.data.slice(i,i+4)],wood:[...image(wood.c).data.slice(i,i+4)],wall:[...image(wall.c).data.slice(i,i+4)]});}}
    return {viewport:[l.w,l.h],dpr:D,requestedDpr:devicePixelRatio,aperture:l.cabinetAperture,railSpans,hash,...q,sensitivity,failurePixels,diagnostic:zoom.toDataURL(),source:canvas.toDataURL()};
   },before);
   if(w===1920&&dpr===1)await save(p,before?'before-x4.png':'seam-x4.png',r.diagnostic,'image/png');
   if(!before&&dpr===1&&w!==1366)await p.frameLocator('#training').locator('#game').screenshot({path:root+(mobile?'mobile-clean':'desktop-clean')+'.png',scale:'css'});
   delete r.source;delete r.diagnostic;for(const v of Object.values(r.edges)){v.worst=v.samples.filter(s=>s.gap===v.gap).slice(0,3);delete v.samples;}report.cases.push(r);
  }finally{await c.close();}
 }
 await save(page,before?'before.json':'metrics.json',report);
 if(report.errors.length||report.network.length||!before&&report.cases.some(r=>!r.pass))throw Error('Visible composite seam gate failed: '+JSON.stringify(report));return report;
}
