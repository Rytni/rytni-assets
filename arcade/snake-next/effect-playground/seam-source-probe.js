async page=>{
 await page.goto('http://127.0.0.1:8775/arcade/snake-next/game-feel-lab.html');await page.waitForFunction(()=>window.tuningLab?.game);
 return await page.evaluate(()=>{
  const out={};for(const key of ['frame-top','frame-bottom','frame-left','frame-right']){
   const im=tuningLab.game.art.images.get(key),c=document.createElement('canvas');c.width=im.width;c.height=im.height;const q=c.getContext('2d');q.drawImage(im,0,0);const d=q.getImageData(0,0,c.width,c.height).data;
   const horizontal=key==='frame-top'||key==='frame-bottom',rows=[];
   for(let n=0;n<(horizontal?c.height:c.width);n++){const colors=new Map();let opaque=0;for(let k=20;k<(horizontal?c.width:c.height)-20;k++){const x=horizontal?k:n,y=horizontal?n:k,i=(y*c.width+x)*4;const rgb=[...d.slice(i,i+4)].join(',');colors.set(rgb,(colors.get(rgb)||0)+1);if(d[i+3])opaque++;}rows.push({n,opaque,colors:[...colors].sort((a,b)=>b[1]-a[1]).slice(0,6)});}
   out[key]={src:im.src,width:im.width,height:im.height,rows};
  }return out;
 });
}
