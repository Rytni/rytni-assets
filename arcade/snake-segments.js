/* Sprite topology uses the cardinal simulation path, never the camera or DPR. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MushroomSnakeSegments=api;})(typeof globalThis==='object'?globalThis:this,()=>{
 'use strict';
 const names=['up','right','down','left'];
 const direction=(dx,dy)=>Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0);
 function at(engine,index){
  const capacity=engine.bx.length,j=(engine.head-index+capacity)%capacity;
  return {x:engine.bx[j],y:engine.by[j]};
 }
 function placement(engine,index){
  const x=engine.rx[index],y=engine.ry[index];
  if(index!==engine.length-1)return {x,y};
  const dx=engine.rx[index-1]-x,dy=engine.ry[index-1]-y;
  return Math.abs(dx)+Math.abs(dy)<=1.1?{x:x+dx*.72,y:y+dy*.72}:{x,y};
 }
 function select(engine,index,bodyOnly=false){
  const current=at(engine,index);
  if(index===0)return {name:'head-'+names[engine.direction],kind:'head',direction:engine.direction,cell:engine.direction};
  const before=at(engine,index-1),headLink=Math.abs(before.x-current.x)+Math.abs(before.y-current.y)===1;
  const after=at(engine,index+1),tailLink=Math.abs(after.x-current.x)+Math.abs(after.y-current.y)===1;
  // Portal discontinuities are independent local runs, never long elbows.
  const towardHead=headLink?direction(before.x-current.x,before.y-current.y):tailLink?(direction(after.x-current.x,after.y-current.y)+2)%4:engine.direction;
  if(index===engine.length-1&&!bodyOnly){const facing=(towardHead+2)%4;return {name:'tail-'+names[facing],kind:'tail',direction:facing,cell:12+facing};}
  const towardTail=direction(after.x-current.x,after.y-current.y);
  if(!headLink||!tailLink||(towardHead+2)%4===towardTail){
   const vertical=towardHead%2===0;
   // Coordinate-stable variations: advancing the head cannot flicker the back.
   const mixed=(Math.imul(current.x,0x45d9f3b)^Math.imul(current.y,0x119de1f3))>>>0;
   const variant=(mixed>>>11)&1;
   return {name:'body-'+(vertical?'vertical':'horizontal')+'-'+variant,kind:'body',direction:towardHead,cell:4+(vertical?1:0)+variant*2};
  }
  const key=[towardHead,towardTail].sort().join(''),corner={'01':0,'12':1,'23':2,'03':3}[key];
  if(corner===undefined)throw new Error('Snake path must contain distinct cardinal neighbours');
  return {name:'corner-'+['up-right','right-down','down-left','left-up'][corner],kind:'corner',direction:towardHead,cell:8+corner};
 }
 function snapshot(engine,alpha=engine.phase){
  engine.interpolate(alpha);
  const cap=engine.bx.length,frame=engine.renderSnapshot||(engine.renderSnapshot={x:new Float32Array(cap),y:new Float32Array(cap),links:new Uint8Array(cap),parts:[]});
  frame.alpha=Math.max(0,Math.min(1,alpha));frame.length=engine.length;
  for(let i=0;i<frame.length;i++){
   const j=(engine.head-i+cap)%cap,previous=(j+1)%cap;
   frame.links[i]=i>0&&Math.abs(engine.bx[j]-engine.bx[previous])+Math.abs(engine.by[j]-engine.by[previous])===1?1:0;
   const point=placement(engine,i);frame.x[i]=point.x;frame.y[i]=point.y;
   frame.parts[i]=select(engine,i);
  }
  return frame;
 }
 return {select,at,direction,placement,snapshot};
});
