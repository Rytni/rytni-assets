import {createD2Fixture} from '../d2/fixtures.js';
import {createArena} from '../world/arena.js';
/** Reuse validated tracks, rotate/recenter short DEV fixtures without altering simulation. */
export function createRetroFixture(options={}){
 const heading=options.direction??1,f=createD2Fixture({...options,direction:1});if((options.length??8)>60||options.shape==='parallel')return f;
 const shortTracks={'90':[[0,0],[-1,0],[-2,0],[-3,0],[-3,1],[-3,2],[-3,3],[-3,4]],U:[[0,0],[-1,0],[-2,0],[-3,0],[-3,1],[-2,1],[-1,1],[0,1]],S:[[0,0],[-1,0],[-2,0],[-2,1],[-2,2],[-3,2],[-4,2],[-4,3]]};
 const source=options.length===8&&shortTracks[options.shape]?shortTracks[options.shape].map(([x,y])=>(y+30)*96+x+38):f.route;
 const route=source.map(cell=>{let x=cell%96-38,y=Math.floor(cell/96)-30;for(let i=0;i<(heading+3)%4;i++){const old=x;x=-y;y=old;}return {x:x+38,y:y+30};});
 const body=route.slice(0,options.length??8),minX=Math.min(...body.map(c=>c.x)),minY=Math.min(...body.map(c=>c.y)),maxX=Math.max(...body.map(c=>c.x)),maxY=Math.max(...body.map(c=>c.y));
 const dx=minX<3?3-minX:maxX>92?92-maxX:0,dy=minY<3?3-minY:maxY>60?60-maxY:0;f.route=route.map(c=>(c.y+dy)*96+c.x+dx);
 const cells=f.route.slice(0,options.length??8),topology=f.arena.exportTopology();topology.blockedCells=topology.blockedCells.filter(c=>!cells.includes(c));
 f.arena=createArena({...topology,initialBody:cells,initialDirection:heading,runwayCells:0});const ahead=cells[0]+[-288,3,288,-3][heading];f.stateOptions={direction:heading,...(!f.arena.blocked(ahead)&&!cells.includes(ahead)?{food:ahead}:{})};if(options.benchmark)f.stateOptions.food=291;return f;
}
