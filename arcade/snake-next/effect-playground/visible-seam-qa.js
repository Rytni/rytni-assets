// Authoritative visual gate: actual composite RGB plus render provenance.
// Alpha alone includes near-black source padding. 40 separates that padding
// (and wall outer backing, max channel 37) from the first material band (74).
export const INK_CHANNEL_MIN=40;
export function visibleInk(data,i,threshold=INK_CHANNEL_MIN){return data[i+3]>=128&&Math.max(data[i],data[i+1],data[i+2])>=threshold;}
export function compositeSeams(composite,wood,wall,aperture,scale=1,threshold=INK_CHANNEL_MIN,railSpans=null){
 const {width,height,data}=composite,edges={},a=aperture;
 const pix=(x,y)=>(y*width+x)*4;
 // Full straight rail spans, including joint hardware. Corner ornaments have
 // curved/nonrectangular contours and are reviewed in the clean composite.
 // Every raster column/row in each span is checked, not one lucky sample.
 for(const side of ['Left','Right','Top','Bottom']){
  const vertical=side==='Left'||side==='Right',low=side==='Left'||side==='Top',axis=vertical?a.x:a.y,size=vertical?a.w:a.h;
  const edge=(axis+(low?0:size))*scale,spanStart=(vertical?a.y:a.x)*scale,spanSize=(vertical?a.h:a.w)*scale;
  const samples=[];
  const span=railSpans?.[side]||[spanStart/scale,(spanStart+spanSize)/scale];
  for(let t=Math.ceil(span[0]*scale);t<Math.floor(span[1]*scale);t++){
   let wi=null,ei=null;
   for(let n=Math.max(0,Math.floor(edge-24*scale));n<=Math.min((vertical?width:height)-1,Math.ceil(edge+24*scale));n++){
    const i=pix(vertical?n:t,vertical?t:n);
    // Wood is the final layer. Require visible material in both provenance
    // and final RGB; exact RGB equality is invalid for fractional rectangles
    // composited over the floor rather than transparent black.
    const w=visibleInk(wood.data,i,threshold)&&visibleInk(data,i,threshold);
    if(w&&(wi===null||(low?n>wi:n<wi)))wi=n;
   }
   // Ornaments can overhang the border. Find the adjacent wall inward of the
   // innermost visible wood, not wall visible through an ornament's cutout.
   ei=null;if(wi!==null)for(let n=wi+(low?1:-1);n>=Math.max(0,Math.floor(edge-24*scale))&&n<=Math.min((vertical?width:height)-1,Math.ceil(edge+24*scale));n+=low?1:-1){const i=pix(vertical?n:t,vertical?t:n);if(visibleInk(wall.data,i,threshold)&&wood.data[i+3]<128&&visibleInk(data,i,threshold)){ei=n;break;}}
   samples.push({t,wood:wi,wall:ei,gap:wi===null||ei===null?null:(low?ei-wi-1:wi-ei-1)/scale});
  }
  const valid=samples.filter(s=>s.gap!==null),gaps=valid.map(s=>s.gap);
  edges[side]={gap:valid.length===samples.length?Math.max(...gaps):null,minGap:gaps.length?Math.min(...gaps):null,samples};
 }
 const gaps=Object.fromEntries(Object.entries(edges).map(([k,v])=>['visualGap'+k,v.gap]));
 return {...gaps,pass:Object.values(gaps).every(v=>v!==null&&v>=0&&v<=2),edges};
}
