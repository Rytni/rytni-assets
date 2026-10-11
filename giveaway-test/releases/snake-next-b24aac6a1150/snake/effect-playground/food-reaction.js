// Post-raster presentation only: one final ribbon image, no connector/geometry
// replacement, no simulation or material changes. Cold only during collection.
const surfaces=new WeakMap();
export function capSquash(age){return age>=0&&age<18?1-.035*Math.sin(age/18*Math.PI):1;}
export function drawWithFoodReaction(ctx,s,frame,cell,field,view,draw){
 const fx=s.feedback.findLast(f=>f.kind==='seed'&&!f.spore),age=fx?s.tick+frame.alpha-fx.tick:99,factor=capSquash(age);
 if(factor===1){draw(ctx);return;}
 let scratch=surfaces.get(ctx);if(!scratch){scratch=document.createElement('canvas');surfaces.set(ctx,scratch);}
 const proxy=new Proxy(ctx,{get(target,key){
  if(key!=='drawImage'){const value=target[key];return typeof value==='function'?value.bind(target):value;}
  return (im,...args)=>{
   if(args.length!==4||!im.getContext){target.drawImage(im,...args);return;}
   const [x,y,w,h]=args,hx=(field.x+(frame.head.x-view.x+.5)*cell-x)*im.width/w,hy=(field.y+(frame.head.y-view.y+.5)*cell-y)*im.height/h;
   scratch.width=im.width;scratch.height=im.height;const out=scratch.getContext('2d',{willReadFrequently:true});out.drawImage(im,0,0);
   const left=Math.max(0,Math.floor(hx-40)),top=Math.max(0,Math.floor(hy-40)),cw=Math.min(80,im.width-left),ch=Math.min(80,im.height-top);
   if(cw<=0||ch<=0){target.drawImage(im,...args);return;}
   const original=out.getImageData(left,top,cw,ch),result=out.createImageData(cw,ch),{dx,dy}=frame.head;
   result.data.set(original.data);
   for(let py=0;py<ch;py++)for(let px=0;px<cw;px++){
    const rx=left+px+.5-hx,ry=top+py+.5-hy,along=rx*dx+ry*dy,normal=-rx*dy+ry*dx;
    if(along<-24||along>25||Math.abs(normal)>20)continue;
    const weight=Math.min(1,Math.max(0,(along+24)/24)),scale=1-(1-factor)*weight,n=normal/scale;
    const sx=Math.floor(hx+dx*along-dy*n-left),sy=Math.floor(hy+dy*along+dx*n-top),to=(py*cw+px)*4;
    if(sx>=0&&sy>=0&&sx<cw&&sy<ch)result.data.set(original.data.subarray((sy*cw+sx)*4,(sy*cw+sx)*4+4),to);
   }
   out.putImageData(result,left,top);target.drawImage(scratch,...args);
  };
 },set(target,key,value){target[key]=value;return true;}});
 draw(proxy);
}
