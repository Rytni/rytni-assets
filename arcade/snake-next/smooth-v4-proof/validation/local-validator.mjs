import {samplePrimitive,radiusAt,fieldAt,CELL,CAP,BODY,TAPER} from '../ribbon.js';
// CELL/8 = 8.5 native px. Cardinal history knots are 68 px apart; a local
// neighbourhood is far smaller than a different branch, but covers raster
// projection error and continuous transitions across a primitive boundary.
export const LOCAL_THRESHOLD=1/8;
export const HEAD_TRANSITION=(CAP+BODY/2)/CELL; // 42px, geometric cap+halfwidth envelope
export function pose(p,t){
 const d=p.d0+(p.d1-p.d0)*t;
 if(p.kind==='line'){const dx=p.b.x-p.a.x,dy=p.b.y-p.a.y,l=Math.hypot(dx,dy);return {d,x:p.a.x+dx*t,y:p.a.y+dy*t,dx:dx/l,dy:dy/l};}
 const a=p.angle+p.delta*t;return {d,x:p.cx+p.r*Math.cos(a),y:p.cy+p.r*Math.sin(a),dx:-Math.sin(a)*Math.sign(p.delta),dy:Math.cos(a)*Math.sign(p.delta)};
}
export function sampleFor(sweep,section){
 for(const p of sweep.parts){if(section.d<p.d0-1e-8||section.d>p.d1+1e-8)continue;const s=pose(p,(section.d-p.d0)/(p.d1-p.d0));if(Math.hypot(s.x-section.x,s.y-section.y)<.01)return {...s,primitive:sweep.parts.indexOf(p)};}
 throw Error('Sample not on centerline');
}
export function regionAt(sweep,d){const s=(d-sweep.frame.start)*CELL;return s<0?'CAP':s<HEAD_TRANSITION*CELL?'HEAD_TRANSITION':(sweep.limit-d)*CELL<TAPER?'TAPER':'BODY';}
export function candidates(sweep,x,y,radius=radiusAt){
 const a=[];sweep.parts.forEach((p,index)=>{const q=samplePrimitive(p,x,y);if(q&&Math.abs(q.v)<radius(sweep,q.d))a.push({...q,index,radius:radius(sweep,q.d)});});return a;
}
export function measureSection(sweep,sample,options={}){
 const radius=options.radius??radiusAt,contains=options.contains??((x,y)=>candidates(sweep,x,y,radius).length>0),pixels=[];
 // Reproduce the original two scan directions, using actual raster centers.
 for(const sign of [1,-1])for(let v=.5;v<60;v++){
  const offset=sign*v,x=Math.floor(sample.x-sample.dy*offset)+.5,y=Math.floor(sample.y+sample.dx*offset)+.5;
  if(!contains(x,y))break;
  const all=candidates(sweep,x,y,radius),local=all.filter(q=>Math.abs(q.d-sample.d)<LOCAL_THRESHOLD);
  const owner=fieldAt(sweep,x,y),nearest=all.slice().sort((a,b)=>Math.abs(a.v)-Math.abs(b.v))[0];
  const type=local.length?'A':all.some(q=>q.d<sweep.frame.start||(sweep.limit-q.d)*CELL<TAPER)?'C':'B';
  pixels.push({x,y,offset,type,localD:local[0]?.d??null,chosenD:owner?.d??null,nearestD:nearest?.d??null,chosenPrimitive:owner?all.find(q=>Math.abs(q.d-owner.d)<1e-7&&Math.abs(q.v-owner.v)<1e-7)?.index:null});
 }
 const local=pixels.filter(p=>p.type==='A'),counts={A:local.length,B:pixels.filter(p=>p.type==='B').length,C:pixels.filter(p=>p.type==='C').length};
 // Check local continuity independently; never bridge a missing pixel with
 // foreign branch coverage. Boundaries are associated with the SAME d band.
 const expected=[];for(let v=-40.5;v<41;v++){
  const x=Math.floor(sample.x-sample.dy*v)+.5,y=Math.floor(sample.y+sample.dx*v)+.5;
  if(candidates(sweep,x,y,radius).some(q=>Math.abs(q.d-sample.d)<LOCAL_THRESHOLD))expected.push({x,y,v,present:!!contains(x,y)});
 }
 const missing=expected.filter(p=>!p.present).length;
 return {sample,region:regionAt(sweep,sample.d),expectedDiameter:2*radius(sweep,sample.d),localThickness:expected.filter(p=>p.present).length,globalSpan:pixels.length,counts,missing,pixels};
}
export function parallelClearance(sweep){
 const pairs=[];
 // Independent, nonadjacent straight branches. Adjacent lines of the same
 // route and the continuous rounded turnaround are NOT separate branches.
 const lines=sweep.parts.map((p,index)=>({p,index})).filter(({p})=>p.kind==='line');
 for(let i=0;i<lines.length;i++)for(let j=i+1;j<lines.length;j++){
  const a=lines[i],b=lines[j];if(Math.abs(a.index-b.index)<3)continue;
  const A=pose(a.p,.5),B=pose(b.p,.5);if(Math.abs(A.dx*B.dy-A.dy*B.dx)>1e-8)continue;
  const vertical=Math.abs(A.dy)>.9;
  const interval=p=>vertical?[Math.min(p.a.y,p.b.y),Math.max(p.a.y,p.b.y)]:[Math.min(p.a.x,p.b.x),Math.max(p.a.x,p.b.x)];
  const [a0,a1]=interval(a.p),[b0,b1]=interval(b.p),lo=Math.max(a0,b0),hi=Math.min(a1,b1);if(hi-lo<1)continue;
  const separation=vertical?Math.abs(A.x-B.x):Math.abs(A.y-B.y);
  if(separation<1e-6)continue;
  let min=Infinity;
  for(const t of [.05,.25,.5,.75,.95]){
   const u=lo+(hi-lo)*t;
   const da=samplePrimitive(a.p,vertical?A.x:u,vertical?u:A.y).d,db=samplePrimitive(b.p,vertical?B.x:u,vertical?u:B.y).d;
   min=Math.min(min,separation-radiusAt(sweep,da)-radiusAt(sweep,db));
  }
  pairs.push({primitives:[a.index,b.index],centerlineSeparation:separation,minimumSurfaceClearance:min,overlap:min<0});
 }
 return pairs;
}
