import {CELL,BODY,HEAD,pieces,edge,OPPOSITE,scaleNearest,fixtures,routePieces,corner,terminal} from './geometry.mjs';
export function audit(dpr,scale=mask=>scaleNearest(mask,dpr)) {
  const size=CELL*dpr, expected=BODY*dpr;
  const scaled=new Map(pieces.map(p=>[p.name,scale(p.mask)]));
  let connectors=0,pairs=0,gaps=0,mismatches=0,overlapPixels=0,disconnectedPairs=0,maxCornerCoverage=0;
  const failures=[];
  for(let r=0;r<4;r++) {
    const raster=scaled.get('corner-'+r);
    const [cx,cy]=[[0,0],[size,0],[size,size],[0,size]][r];
    let min=Infinity,max=0;
    for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(raster[y*size+x]) {
      const radius=Math.hypot(x+.5-cx,y+.5-cy)/dpr;
      min=Math.min(min,radius);max=Math.max(max,radius);
    }
    maxCornerCoverage=Math.max(maxCornerCoverage,max-min+Math.SQRT2/dpr);
  }
  for(const p of pieces) for(const d of p.ports) {
    const e=edge(scaled.get(p.name),size,d); connectors++;
    const expectedEdge=Array.from({length:size},(_,i)=>+(i>=16*dpr && i<52*dpr));
    const wrong=e.reduce((n,v,i)=>n+(v!==expectedEdge[i]),0);
    if(wrong || e.reduce((a,b)=>a+b,0)!==expected) {
      mismatches++;failures.push({piece:p.name,port:d,wrong});
    }
  }
  for(const a of pieces) for(const d of a.ports) for(const b of pieces) {
    if(!b.ports.includes(OPPOSITE(d))) continue;
    pairs++;
    const ae=edge(scaled.get(a.name),size,d),be=edge(scaled.get(b.name),size,OPPOSITE(d));
    for(let i=16*dpr;i<52*dpr;i++) if(!ae[i] || !be[i]) gaps++;
    // Composite actual disjoint tile footprints and test four-connected union.
    const width=d%2?size*2:size, height=d%2?size:size*2;
    const union=new Uint8Array(width*height),counts=new Uint8Array(union.length);
    const origins=d===0?[[0,size],[0,0]]:d===1?[[0,0],[size,0]]:d===2?[[0,0],[0,size]]:[[size,0],[0,0]];
    for(const [j,p] of [a,b].entries()) {
      const raster=scaled.get(p.name),[ox,oy]=origins[j];
      for(let y=0;y<size;y++) for(let x=0;x<size;x++) if(raster[y*size+x]) {
        const at=(y+oy)*width+x+ox;counts[at]++;union[at]=1;
      }
    }
    overlapPixels+=counts.reduce((n,v)=>n+(v>1),0);
    const total=union.reduce((n,v)=>n+v,0),start=union.indexOf(1);
    const stack=[start];union[start]=2;let reached=0;
    while(stack.length) {
      const at=stack.pop(),x=at%width,y=Math.floor(at/width);reached++;
      for(const [nx,ny] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]) {
        if(nx<0||ny<0||nx>=width||ny>=height) continue;
        const next=ny*width+nx;
        if(union[next]===1) {union[next]=2;stack.push(next);}
      }
    }
    if(reached!==total) {disconnectedPairs++;failures.push({a:a.name,b:b.name,d,reached,total});}
  }
  const excessiveCornerWidth=maxCornerCoverage>BODY+2;
  if(excessiveCornerWidth)failures.push({maxCornerCoverage,tolerance:2});
  return {dpr,deviceCell:size,deviceConnector:expected,connectors,pairs,gaps,connectorMismatch:mismatches,overlapPixels,disconnectedPairs,maxCornerCoverageCssPx:maxCornerCoverage,widthToleranceCssPx:2,excessiveCornerWidth,pass:gaps===0&&mismatches===0&&overlapPixels===0&&disconnectedPairs===0&&!excessiveCornerWidth,failures};
}
export function structuralAudit() {
  let min=Infinity,max=0;
  for(let y=0;y<CELL;y++) for(let x=0;x<CELL;x++) if(corner[y*CELL+x]) {
    const r=Math.hypot(x+.5,y+.5);min=Math.min(min,r);max=Math.max(max,r);
  }
  const cornerCoverage=max-min+Math.SQRT2; // Conservative pixel-square radial span.
  const widths=Array.from({length:CELL},(_,x)=>terminal.reduce((n,v,i)=>n+(i%CELL===x?v:0),0));
  const badTaper=widths.some((w,i)=>i && w>widths[i-1]);
  const headPiece=pieces.find(p=>p.name==='head-0');
  const headWidth=Math.max(...Array.from({length:CELL},(_,x)=>headPiece.mask.reduce((n,v,i)=>n+(i%CELL===x?v:0),0)));
  let routeOverlap=0,routeTurns=0;
  for(const fixture of fixtures) {
    const placement=routePieces(fixture.route),occupied=new Set();
    for(const {point:[cx,cy],piece} of placement) {
      if(!piece) throw Error('Unresolved route piece');
      if(fixture.id==='mixed-route'&&piece.kind==='corner')routeTurns++;
      for(let y=0;y<CELL;y++)for(let x=0;x<CELL;x++)if(piece.mask[y*CELL+x]) {
        const key=[cx*CELL+x,cy*CELL+y].join(',');
        if(occupied.has(key))routeOverlap++;occupied.add(key);
      }
    }
  }
  return {cell:CELL,body:BODY,bodyCellRatio:BODY/CELL,head:headWidth,headBodyRatio:headWidth/BODY,taperLength:CELL,taperCells:1,tipPixels:12,cornerRadialCoverage:cornerCoverage,cornerTolerance:2,terminalEntrance:widths[0],terminalTip:widths.at(-1),monotonicTaper:!badTaper,routeOverlapPixels:routeOverlap,mixedRouteTurns:routeTurns,pass:headWidth===HEAD&&cornerCoverage<=BODY+2&&!badTaper&&widths[0]===BODY&&routeOverlap===0&&routeTurns>=8};
}
