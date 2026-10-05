// GEOMETRY QA ONLY: alpha bounds. This cannot detect opaque dark art padding.
// Visual acceptance is the FINAL COMPOSITE gate in visible-seam-qa.js.
export function apertureEdgeGaps(image,aperture,pixelScale=1){
 const {width,height,data}=image,s=pixelScale,a=aperture;
 const x0=Math.max(0,Math.floor(a.x*s)),x1=Math.min(width-1,Math.ceil((a.x+a.w)*s)-1),y0=Math.max(0,Math.floor(a.y*s)),y1=Math.min(height-1,Math.ceil((a.y+a.h)*s)-1);
 const ink=(x,y)=>data[(y*width+x)*4+3]>0;
 let left=x1+1,right=x0-1,top=y1+1,bottom=y0-1,gapLeft=0,gapRight=0,gapTop=0,gapBottom=0;
 const rows=[],columns=[];
 for(let y=y0;y<=y1;y++){
  let l=x0,r=x1;while(l<=x1&&!ink(l,y))l++;while(r>=x0&&!ink(r,y))r--;
  // Exclude only partially clipped outer raster rows, not environmental corners.
  if((y+.5)/s>=a.y&&(y+.5)/s<a.y+a.h){const gl=l>x1?a.w:Math.max(0,l/s-a.x),gr=r<x0?a.w:Math.max(0,a.x+a.w-(r+1)/s);gapLeft=Math.max(gapLeft,gl);gapRight=Math.max(gapRight,gr);rows.push({at:(y+.5)/s,left:gl,right:gr});}
  if(l<=r){left=Math.min(left,l);right=Math.max(right,r);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 }
 for(let x=x0;x<=x1;x++){
  let t=y0,b=y1;while(t<=y1&&!ink(x,t))t++;while(b>=y0&&!ink(x,b))b--;
  if((x+.5)/s>=a.x&&(x+.5)/s<a.x+a.w){const gt=t>y1?a.h:Math.max(0,t/s-a.y),gb=b<y0?a.h:Math.max(0,a.y+a.h-(b+1)/s);gapTop=Math.max(gapTop,gt);gapBottom=Math.max(gapBottom,gb);columns.push({at:(x+.5)/s,top:gt,bottom:gb});}
 }
 // Blank perpendicular padding is measured by its own edge, not incorrectly
 // reported as a full-width/full-height gap on the other two edges.
 if(right>=left){gapLeft=gapRight=gapTop=gapBottom=0;for(const r of rows)if(r.at>=top/s&&r.at<(bottom+1)/s){gapLeft=Math.max(gapLeft,r.left);gapRight=Math.max(gapRight,r.right);}for(const c of columns)if(c.at>=left/s&&c.at<(right+1)/s){gapTop=Math.max(gapTop,c.top);gapBottom=Math.max(gapBottom,c.bottom);}}
 const bounds=right>=left?{x:Math.max(a.x,left/s),y:Math.max(a.y,top/s),right:Math.min(a.x+a.w,(right+1)/s),bottom:Math.min(a.y+a.h,(bottom+1)/s)}:null;
 if(bounds){bounds.w=bounds.right-bounds.x;bounds.h=bounds.bottom-bounds.y;}
 return {aperture:{...a},inkBounds:bounds,gapLeft,gapRight,gapTop,gapBottom,pass:Math.max(gapLeft,gapRight,gapTop,gapBottom)<=2,
  worstRows:rows.filter(r=>r.left===gapLeft||r.right===gapRight).slice(0,2),worstColumns:columns.filter(c=>c.top===gapTop||c.bottom===gapBottom).slice(0,2)};
}
