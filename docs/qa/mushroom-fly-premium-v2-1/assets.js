async page=>{
 const c=await page.context().browser().newContext(),p=await c.newPage();await p.goto('http://127.0.0.1:8776/docs/qa/mushroom-fly-premium-v2/review.html');
 const result=await p.evaluate(async()=>{
  const paths=['sky-desktop-v2.png','sky-mobile-v2.png','celebration-v2.png','sky-journal-v2.png','play-amber-v2.png','play-amber-trimmed-v2.png'].map(n=>'grib/mushroom-fly-premium-v2/'+n).concat(['celebration-portrait-v2-1.png','sponsor-token-v2-1.png','sponsor-token-128-v2-1.png','secondary-source-v2-1.png','secondary-trimmed-v2-1.png'].map(n=>'grib/mushroom-fly-premium-v2-1/'+n));
  const rows=[],derivatives=[];for(const file of paths){const start=performance.now(),resp=await fetch('/'+file,{cache:'no-store'}),blob=await resp.blob(),loaded=performance.now(),url=URL.createObjectURL(blob),img=new Image();img.src=url;const decodeStart=performance.now();await img.decode();const decoded=performance.now();
   const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;let transparent=0;for(let i=3;i<data.length;i+=4)if(data[i]!==255)transparent++;
   const row={file,bytes:blob.size,width:img.naturalWidth,height:img.naturalHeight,decodedRGBABytes:img.naturalWidth*img.naturalHeight*4,loadMs:loaded-start,decodeMs:decoded-decodeStart,nonOpaquePixels:transparent};
   if(/(?:sky-desktop-v2|sky-mobile-v2|celebration-v2|celebration-portrait-v2-1)\.png$/.test(file)&&transparent===0){const webp=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.94));if(webp.type!=='image/webp')throw Error('WebP encoder unavailable');const webpURL=await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(webp);});const newFile=file.split('/').at(-1).replace(/-v2\.png$/,'-v2-1.webp').replace(/\.png$/,'.webp');derivatives.push({file:'grib/mushroom-fly-premium-v2-1/'+newFile,data:webpURL.split(',')[1]});row.webPBytes=webp.size;row.compressionRatio=webp.size/blob.size;}
   rows.push(row);URL.revokeObjectURL(url);canvas.width=canvas.height=0;
  }return {environment:'Edge desktop, one bounded local cold/no-store load + decode pass; not a frame benchmark',rows,derivatives};
 });await c.close();return result;
}
