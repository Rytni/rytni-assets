import {createRules,Direction} from '../simulation/rules.js';
import {createArena} from '../world/arena.js';

function direction(a,b){const d=b-a;return d===1?Direction.RIGHT:d===-1?Direction.LEFT:d===96?Direction.DOWN:Direction.UP;}
function longCycle(){const p=[];for(let y=12;y<52;y++)for(let i=0;i<80;i++)p.push(y*96+(y%2===0?8+i:87-i));for(let y=51;y>=12;y--)p.push(y*96+7);return p;}
function pathFor(shape,length){
  if(length>60||shape==='parallel')return longCycle();
  const path=[];let x=38,y=30;path.push(y*96+x);
  for(let i=1;i<length+20;i++){
    if(shape==='straight'){x--;}
    else if(shape==='90'){if(i<8)x--;else y++;}
    else if(shape==='U'){if(i<10)x--;else if(i<11)y++;else x++;}
    else {if(i<10)x--;else if(i<13)y++;else if(i<25)x++;else if(i<28)y++;else x--;}
    path.push(y*96+x);
  }
  return path;
}
export function createD2Fixture({shape='S',length=8,direction:heading=Direction.RIGHT,speed=4,benchmark=false,foodDirection}={}){
  if(![8,30,100,250,500,1200].includes(length))throw RangeError('Unsupported D2 length');
  if(!['straight','90','U','S','parallel','stress'].includes(shape))throw RangeError('Unsupported D2 track');
  if(!Number.isFinite(speed)||speed<2||speed>20)throw RangeError('Speed must be 2..20 cells/s');
  const rules=createRules({ticksPerCell:Math.round(60/speed),obstacleBlocks:0}),route=pathFor(shape,length);
  // Short proof fixtures rotate around arena center; long validated cycles retain their topology.
  if(length<=60&&shape!=='parallel')for(let i=0;i<route.length;i++){let x=route[i]%96-48,y=Math.floor(route[i]/96)-32;for(let r=0;r<(heading+3)%4;r++){const old=x;x=-y;y=old;}route[i]=(y+32)*96+x+48;}
  if(length>60||shape==='parallel'){const at=route.indexOf(30*96+40);route.push(...route.splice(0,at));}
  const body=route.slice(0,length),blocked=[];
  for(let x=0;x<96;x++){blocked.push(x,63*96+x);}for(let y=1;y<63;y++)blocked.push(y*96,y*96+95);
  const obstacles=[{x:21,y:21,kind:'rock'},{x:43,y:22,kind:'stump'},{x:27,y:38,kind:'root'},{x:49,y:39,kind:'rock'},{x:55,y:28,kind:'stump'}];
  const used=new Set(route);for(const prop of obstacles){const cell=prop.y*96+prop.x;if(!used.has(cell))blocked.push(cell);}
  const facing=direction(body[1],body[0]);
  const arena=createArena({width:96,height:64,blockedCells:blocked,initialBody:body,initialDirection:facing,minFreeCells:1201});
  const head=body[0],ahead=head+(facing===1?3:facing===3?-3:facing===2?288:-288);
  const visuals={obstacles:obstacles.filter(p=>arena.blocked(p.y*96+p.x)),objects:[{kind:'positive',x:40.5,y:24.5},{kind:'positive',x:32.5,y:36.5},{kind:'negative',x:52.5,y:36.5},{kind:'portal',x:54.5,y:22.5}]};
  const stateOptions={direction:facing};if(!body.includes(ahead)&&!arena.blocked(ahead))stateOptions.food=ahead;
  if(benchmark)stateOptions.food=3*96+3;
  if(foodDirection!==undefined){if(![0,1,2,3].includes(foodDirection))throw RangeError('Invalid food direction');stateOptions.food=head+[ -96,1,96,-1 ][foodDirection];}
  return {seed:73,rules,arena,stateOptions,visuals,route,commands:tick=>[]};
}
