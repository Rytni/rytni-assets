export function direction(a,b,width){const d=a-b;return d===1?1:d===-1?3:d===width?2:0;}
export function tileKey(cells,index,length,width){
 if(index===0)return `head${direction(cells[0],cells[1],width)}`;
 if(index===length-1)return `tail${direction(cells[index],cells[index-1],width)}`;
 const a=direction(cells[index-1],cells[index],width),b=direction(cells[index+1],cells[index],width);
 if((a+2)%4===b)return a%2?'horizontal':'vertical';return `corner${(1<<a)|(1<<b)}`;
}
/** Dedicated native tiles authored from geometry; no reference image pixels or organic ribbon. */
export function buildTiles(){
 const out=new Map(),keys=['horizontal','vertical','corner3','corner6','corner12','corner9',...Array.from({length:4},(_,i)=>`head${i}`),...Array.from({length:4},(_,i)=>`tail${i}`)];
 for(const key of keys){const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d');ctx.scale(64,64);ctx.translate(.5,.5);const gradient=ctx.createLinearGradient(-.45,-.45,.45,.45);gradient.addColorStop(0,'#9cce86');gradient.addColorStop(.35,'#61ae68');gradient.addColorStop(1,'#378064');ctx.fillStyle=gradient;
  if(key==='horizontal'){ctx.fillRect(-.52,-.35,1.04,.70);ctx.fillStyle='#c9db98';ctx.fillRect(-.52,-.34,1.04,.045);ctx.fillStyle='#225447';ctx.fillRect(-.52,.30,1.04,.05);}
  else if(key==='vertical'){ctx.fillRect(-.35,-.52,.70,1.04);ctx.fillStyle='#c9db98';ctx.fillRect(-.34,-.52,.045,1.04);ctx.fillStyle='#225447';ctx.fillRect(.30,-.52,.05,1.04);}
  else if(key.startsWith('corner')){const mask=Number(key.slice(6));ctx.fillRect(-.35,-.35,.7,.7);for(let d=0;d<4;d++)if(mask&(1<<d)){if(d===0)ctx.fillRect(-.35,-.52,.7,.52);if(d===1)ctx.fillRect(0,-.35,.52,.7);if(d===2)ctx.fillRect(-.35,0,.7,.52);if(d===3)ctx.fillRect(-.52,-.35,.52,.7);}ctx.strokeStyle='#d3df9f';ctx.lineWidth=.035;ctx.beginPath();if(!(mask&1)){ctx.moveTo(-.3,-.32);ctx.lineTo(.3,-.32);}if(!(mask&8)){ctx.moveTo(-.32,-.3);ctx.lineTo(-.32,.3);}ctx.stroke();}
  else {const d=Number(key.at(-1));ctx.rotate((d-1)*Math.PI/2);if(key.startsWith('head')){ctx.beginPath();ctx.roundRect(-.52,-.38,.97,.76,.12);ctx.fill();ctx.fillStyle='#e6ecc1';for(const y of [-.19,.19]){ctx.fillRect(.02,y-.07,.15,.14);ctx.fillStyle='#142d2b';ctx.fillRect(.10,y-.035,.07,.07);ctx.fillStyle='#e6ecc1';}ctx.strokeStyle='#274a36';ctx.lineWidth=.035;ctx.beginPath();ctx.moveTo(.30,-.10);ctx.lineTo(.35,-.10);ctx.moveTo(.30,.10);ctx.lineTo(.35,.10);ctx.stroke();}
   else {ctx.beginPath();ctx.moveTo(-.52,-.35);ctx.lineTo(-.10,-.35);ctx.lineTo(.18,-.22);ctx.lineTo(.36,-.08);ctx.lineTo(.36,.08);ctx.lineTo(.18,.22);ctx.lineTo(-.10,.35);ctx.lineTo(-.52,.35);ctx.closePath();ctx.fill();ctx.strokeStyle='#cfdf9e';ctx.lineWidth=.035;ctx.beginPath();ctx.moveTo(-.5,-.31);ctx.lineTo(-.11,-.31);ctx.lineTo(.30,-.09);ctx.stroke();}}
  out.set(key,c);
 }return out;
}
