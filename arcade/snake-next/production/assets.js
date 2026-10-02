/** Decode-gated, single-request ownership; only this isolated entry owns these assets. */
export class Assets {
  constructor(){this.promises=new Map();this.images=new Map();this.timings={};}
  image(key,path){
    if(!this.promises.has(key))this.promises.set(key,(async()=>{
      const image=new Image();image.src=new URL('../assets/'+path,import.meta.url).href;
      await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Asset unavailable: '+path));});
      this.timings[key]={loaded:performance.now()};await image.decode();this.timings[key].decoded=performance.now();
      this.images.set(key,image);return image;
    })());
    return this.promises.get(key);
  }
  async group(entries){await Promise.all(Object.entries(entries).map(([key,path])=>this.image(key,path)));return this;}
  get(key){const image=this.images.get(key);if(!image)throw Error('Undecoded asset: '+key);return image;}
}
export const CHARACTER={head:'character/head-right-v1.webp',skin:'character/skin-v1.webp',moss:'character/moss-mushrooms-v1.webp'};
export const CRITICAL={background:'ui/background-v1.webp',frame:'ui/frame-v1.webp',surface:'ui/surface-v1.webp',logo:'ui/logo-v1.webp',hero:'ui/hero-v1.webp',button:'ui/button-v1.webp',icons:'ui/icons-v1.svg'};
export const GAME={...CHARACTER,ground:'forest/ground-v2.webp',fern:'forest/fern-v1.webp',rock:'forest/rock-v1.webp',stump:'forest/stump-v1.webp',root:'forest/root-v1.webp',bush:'forest/bush-v1.webp',log:'forest/log-v1.webp',seed:'forest/seed-v1.webp'};

/** Alpha bounds belong to OUR generated production PNG, never a reference screenshot. */
export function sprite(image,width){
  const probe=document.createElement('canvas');probe.width=image.naturalWidth;probe.height=image.naturalHeight;
  const ctx=probe.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
  const data=ctx.getImageData(0,0,probe.width,probe.height).data;let x0=probe.width,y0=probe.height,x1=0,y1=0;
  for(let y=0;y<probe.height;y++)for(let x=0;x<probe.width;x++)if(data[(y*probe.width+x)*4+3]>32){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  const out=document.createElement('canvas');out.width=width;out.height=Math.max(1,Math.round(width*(y1-y0+1)/(x1-x0+1)));
  out.getContext('2d').drawImage(image,x0,y0,x1-x0+1,y1-y0+1,0,0,out.width,out.height);return out;
}
export function rotate(image,turns){
  const out=document.createElement('canvas'),odd=turns%2;out.width=odd?image.height:image.width;out.height=odd?image.width:image.height;
  const ctx=out.getContext('2d');ctx.translate(out.width/2,out.height/2);ctx.rotate(turns*Math.PI/2);ctx.drawImage(image,-image.width/2,-image.height/2);return out;
}
export function prepareCharacter(assets){
  if(assets.character)return assets.character;
  const head=sprite(assets.get('head'),48),moss=sprite(assets.get('moss'),20),skin=sprite(assets.get('skin'),48);
  // Rotation/downsampling is bake-once raster preparation, not per-frame art generation.
  return assets.character={heads:[head,rotate(head,1),rotate(head,2),rotate(head,3)],moss,skin};
}
