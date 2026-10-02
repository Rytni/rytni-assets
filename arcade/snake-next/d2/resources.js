async function decodeImage(url){
  const source=new Image();source.src=url;await source.decode();
  const sourceWidth=source.naturalWidth,sourceHeight=source.naturalHeight,f=Math.min(1,1024/sourceWidth,1024/sourceHeight);
  const image=await createImageBitmap(source,{resizeWidth:Math.round(sourceWidth*f),resizeHeight:Math.round(sourceHeight*f),resizeQuality:'high'});
  return {image,sourceWidth,sourceHeight};
}
/** Sole raster owner. Scene caches register backing bytes, not duplicate image aliases. */
export class D2Resources {
  constructor({decode=decodeImage}={}){this.decode=decode;this.images=new Map();this.pending=new Map();this.ids=new Map();this.rasters=new Map();this.epoch=0;this.peakDecodeBytes=0;}
  async load(manifest){
    const epoch=this.epoch;
    for(const {id,url} of manifest){
      let pending=this.pending.get(url);
      if(!pending){pending=this.decode(url).then(result=>{
        const image=result.image||result;if(epoch!==this.epoch){image.close?.();throw Error('Resource owner disposed');}
        this.images.set(url,image);this.peakDecodeBytes=Math.max(this.peakDecodeBytes,(result.sourceWidth||image.width)*(result.sourceHeight||image.height)*4);return image;
      }).catch(error=>{this.pending.delete(url);throw Error(`${url}: ${error.message}`);});this.pending.set(url,pending);}
      const image=await pending;if(epoch!==this.epoch)throw Error('Resource owner disposed');this.ids.set(id,image);
    }
    return this;
  }
  get(id){return this.ids.get(id);}
  track(id,width,height,category='backings'){this.rasters.set(id,{bytes:width*height*4,category});}
  release(id){this.rasters.delete(id);}
  inventory(){
    const result={images:0,backings:0,ground:0,variants:0,duplicates:0,totalBytes:0,peakTransientDecodeBytes:this.peakDecodeBytes};
    for(const image of this.images.values())result.images+=image.width*image.height*4;
    for(const {bytes,category} of this.rasters.values())result[category]+=bytes;
    result.totalBytes=result.images+result.backings+result.ground+result.variants;return result;
  }
  dispose(){this.epoch++;for(const image of this.images.values())image.close?.();this.images.clear();this.pending.clear();this.ids.clear();this.rasters.clear();}
}

export const D2_ASSETS=[
  {id:'heads',url:new URL('../../../grib/mushroom-snake-d2-proof/heads.png',import.meta.url).href},
  {id:'objects',url:new URL('../../../grib/mushroom-snake-d2-proof/objects.png',import.meta.url).href},
  {id:'accents',url:new URL('../../../grib/mushroom-snake-d2-proof/accents.png',import.meta.url).href},
  {id:'ground',url:new URL('../../../grib/mushroom-snake-d2-proof/ground.png',import.meta.url).href}
];
export const OBJECT_SLOTS={food:0,positive:1,negative:2,portal:3,rock:4,stump:5,root:6,decor:7};
/** Draw only purpose-built atlas cells, never samples from concept references. */
export function atlasSprite(ctx,image,index,columns,rows,x,y,width,height=width){
  const sw=image.width/columns,sh=image.height/rows;ctx.drawImage(image,(index%columns)*sw,Math.floor(index/columns)*sh,sw,sh,x-width/2,y-height/2,width,height);
}
