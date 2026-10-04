import {CELL,BODY} from '../retro-v5/geometry.mjs';
import {ROW_RUNS} from './turn-atlas-data.js';

export const TURN_ATLAS=Object.freeze({phases:16,width:136,height:136,x:-102,y:-34,socket:32,underlap:2,body:BODY});
export const master=ROW_RUNS.map(rows=>{
 const pixels=new Uint8Array(136*136);
 for(const [y,...spans] of rows)for(let i=0;i<spans.length;i+=2)pixels.fill(1,y*136+spans[i],y*136+spans[i+1]);
 return {pixels};
});

/** Read-only turn descriptor. Never spreads a master across a second bend. */
export function activeTurn(frame,path){
 const i=Math.floor(frame.start),a=frame.route[i],b=frame.route[i+1],c=frame.route[i+2];
 if(!c||!frame.head||frame.alpha===0)return null;
 const fx=a.x-b.x,fy=a.y-b.y,oldX=b.x-c.x,oldY=b.y-c.y;
 if(fx*oldX+fy*oldY!==0)return null;
 const first=path.find(p=>p.kind==='arc');if(!first)return null;
 // Exact head forward: current canonical leg. Basis maps the Right->Up
 // master x to the old forward, y to the new backward (mirror if needed).
 const hx=(frame.head.x+.5)*CELL,hy=(frame.head.y+.5)*CELL;
 const next=path.filter(p=>p.kind==='arc')[1];
 const cut=Math.min(frame.start+(32+.8*CELL)/CELL,first.d1+.15,next?.d0??Infinity);
 return {hx,hy,xx:oldX,xy:oldY,yx:-fx,yy:-fy,cut,alpha:frame.alpha,start:frame.start};
}

export function atlasSample(turn,x,y,current,out={d:0,v:0}){
 const dx=x-turn.hx,dy=y-turn.hy,lx=dx*turn.xx+dy*turn.xy,ly=dx*turn.yx+dy*turn.yy;
 const phase=Math.min(15,Math.max(1,Math.round(turn.alpha*15)));
 const shift=(phase/15-turn.alpha)*CELL;
 const col=Math.floor(lx)+102;
 const socket=ly>=32&&ly<36&&Math.abs(lx)<26;
 if(current&&current.d>turn.cut)return undefined;
 // Clip the ordinary proximal body out. Distal second bends remain V2.
 if(!socket&&(!current||current.d>turn.cut))return undefined;
 const row=Math.floor(ly+(socket?0:shift))+34;
 if(col<0||col>=136||row<0||row>=136)return null;
 const f=master[phase],n=row*136+col;
 if(!f.pixels[n])return null;
 if(current){out.d=current.d;out.v=current.v;}
 else if(socket&&Math.abs(lx)<18){out.d=turn.start+ly/CELL;out.v=-lx;}
 else return null;
 // Reflection reverses the signed normal, but not material identities.
 if(!current&&turn.xx*turn.yy-turn.xy*turn.yx<0)out.v=-out.v;
 return out;
}
