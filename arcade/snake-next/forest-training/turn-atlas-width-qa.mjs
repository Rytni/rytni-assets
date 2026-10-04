import {master,TURN_ATLAS} from './turn-atlas.js';
import {pathToFileURL} from 'node:url';

// Independent contour check, not a horizontal projection of a 90-degree
// incoming arm. Squared Euclidean distance to background is computed on
// the body-only alpha master, BEFORE any opaque head can hide a bulge.
// Pixel-center diameter has a one-pixel raster uncertainty; it is reported
// separately from normal cross-section widths, never substituted for them.
export function contourWidths(){
 const W=TURN_ATLAS.width,H=TURN_ATLAS.height,results=[];
 for(let phase=0;phase<master.length;phase++){
  const alpha=master[phase].pixels,horizontal=new Float64Array(W*H),distance=new Float64Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   let best=Infinity;
   for(let k=0;k<W;k++)if(!alpha[y*W+k])best=Math.min(best,(x-k)**2);
   horizontal[y*W+x]=best;
  }
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   let best=Infinity;
   for(let k=0;k<H;k++)best=Math.min(best,horizontal[k*W+x]+(y-k)**2);
   distance[y*W+x]=best;
  }
  let maximum=0,at=null;
  // Inspect proximal master, excluding its cropped outer boundary.
  for(let y=18;y<H-18;y++)for(let x=18;x<W-18;x++){
   if(!alpha[y*W+x])continue;
   const diameter=2*Math.sqrt(distance[y*W+x])-1;
   if(diameter>maximum){maximum=diameter;at={x:x+TURN_ATLAS.x,y:y+TURN_ATLAS.y};}
  }
  results.push({phase,maximumInscribedDiameter:maximum,at});
 }
 return {pass:results.every(r=>r.maximumInscribedDiameter<=37),results};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(contourWidths()));
