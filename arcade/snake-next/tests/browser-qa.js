// Explicit ?qa=1 DEV-only hook. No release/Hub imports this module.
import {loopFixture,directionBetween} from './fixtures.js';
import {createTrainingRules} from '../simulation/difficulty.js';
import {bodyCell,occupied} from '../simulation/body.js';
import {neighbour} from '../simulation/rules.js';
import {BodySnapshots} from '../presentation/path.js';
import {summarize} from './benchmark.js';
import {step} from '../simulation/step.js';
import {createState} from '../simulation/state.js';
import {stateHash} from '../simulation/hash.js';
import {createArena} from '../world/arena.js';
import {createRules} from '../simulation/rules.js';

export function geometrySnapshots(name='horizontal',length=8,grow=false){
  const width=96,cells=[];let x=45,y=30;
  const directions={horizontal:[[-1,0]],vertical:[[0,1]],turn:[[0,1],[-1,0]],u:[[0,1],[-1,0],[0,-1]],s:[[-1,0],[0,1],[-1,0],[0,-1]]};
  let turns=directions[name.replace(/-(left|right|up|down)$/,'')]||directions.horizontal;
  const suffix=name.split('-').at(-1),rotation={right:0,down:1,left:2,up:3}[suffix]??0;
  const transform=(a,b)=>{for(let i=0;i<rotation;i++){const temp=a;a=-b;b=temp;}return [a,b];};
  for(let i=0;i<length+1;i++){
    cells.push(y*width+x);const leg=Math.min(turns.length-1,Math.floor(i/3)),[dx,dy]=transform(...turns[leg]);x+=dx;y+=dy;
  }
  const current=cells.slice(0,length),previous=grow?cells.slice(1,length):cells.slice(1,length+1);
  const snapshots=new BodySnapshots(6144);
  snapshots.reset({body:Uint32Array.from(previous),headIndex:0,length:previous.length});
  snapshots.capture({body:Uint32Array.from(current),headIndex:0,length:current.length});
  return snapshots;
}

export function installQA(app){
  app.qa={
    collision(kind){const rules=createRules({width:8,height:8,initialLength:2,runwayCells:1,minFreeCells:1,obstacleBlocks:0,ticksPerCell:1});const arena=createArena({width:8,height:8,initialBody:kind==='self'?[27,26,18,19,20,28,36]:[27,26],blockedCells:kind==='self'?[]:[28]});app.start({rules,arena,stateOptions:{food:54}});},
    startLoop(length=8){
      const f=loopFixture(length,15);app.start({rules:f.rules,arena:f.arena,stateOptions:{food:97}});
      app.auto=state=>{
        if(state.movePhase!==state.cadence-1)return;
        const at=f.path.indexOf(bodyCell(state,0)),dir=directionBetween(f.path[at],f.path[(at+1)%f.path.length],f.rules.width);return dir===state.direction?undefined:dir;
      };return app.summary();
    },
    startAutoplay(){
      app.start({rules:createTrainingRules(),seed:7});
      const seen=new Uint8Array(app.arena.cells),queue=new Uint32Array(app.arena.cells),first=new Uint8Array(app.arena.cells);
      app.auto=(state,arena)=>{
        if(state.movePhase!==state.cadence-1)return;
        const head=bodyCell(state,0),tail=bodyCell(state,state.length-1);seen.fill(0);queue[0]=head;seen[head]=1;let end=1;
        for(let at=0;at<end;at++){
          const cell=queue[at];if(cell===state.food)return first[cell]===state.direction?undefined:first[cell];
          for(let d=0;d<4;d++){
            if(at===0&&d===(state.direction+2)%4)continue;
            const n=neighbour(cell,d,arena.width,arena.height);
            if(n<0||seen[n]||arena.blocked(n)||(occupied(state,n)&&!(n===tail&&!state.growth)))continue;
            seen[n]=1;queue[end++]=n;first[n]=at===0?d:first[cell];
          }
        }
        throw Error('QA planner found no food route');
      };return app.summary();
    },
    fixture(name,alpha,length=8,grow=false){
      this.startLoop(length);app.pause();app.show('geometry');app.observer.disconnect();app.observer=null;
      const snapshots=length>8?app.snapshots:geometrySnapshots(name,length,grow);
      app.renderer.camera.fixed=length>8;app.renderer.shadowQA=true;
      app.renderer.draw({snapshots,arena:app.arena,food:-1,alpha,resetCamera:true});
      return {head:{...app.renderer.body.head},tail:{...app.renderer.body.tail},count:app.renderer.body.count};
    },
    async benchmark(length=8,traceEat=false){
      this.startLoop(length);app.pause();app.show('geometry');app.observer.disconnect();app.observer=null;app.renderer.camera.fixed=false;
      const f=loopFixture(length,1),snapshots=new BodySnapshots(f.arena.cells);snapshots.reset(f.state);
      const sim=[],render=[],whole=[];
      for(let i=0;i<1200;i++){
        await new Promise(resolve=>setTimeout(resolve,0));
        const commands=f.commands(f.state.tick+1),start=performance.now();step(f.state,f.arena,f.rules,commands);const endSim=performance.now();snapshots.capture(f.state);
        app.renderer.draw({snapshots,arena:f.arena,food:f.state.food,alpha:.75,dt:1/60});const endRender=performance.now();
        if(i>=200){sim.push(endSim-start);render.push(endRender-endSim);whole.push(endRender-start);}
      }
      // Actual eat work remains included separately, not hidden by an empty loop.
      const eatBase=createState({...f.options,food:f.path[1]}),eat=[],eatWhole=[],eatSnapshots=new BodySnapshots(f.arena.cells),outliers=[];
      for(let i=0;i<100;i++){
        await new Promise(resolve=>setTimeout(resolve,0));const s=structuredClone(eatBase);eatSnapshots.reset(s);
        if(traceEat)performance.mark(`p2b-eat-start-${i}`);
        const start=performance.now();step(s,f.arena,f.rules,f.commands(1));eat.push(performance.now()-start);eatSnapshots.capture(s);
        app.renderer.draw({snapshots:eatSnapshots,arena:f.arena,food:s.food,alpha:.75,dt:1/60});const cost=performance.now()-start;eatWhole.push(cost);
        if(traceEat)performance.mark(`p2b-eat-end-${i}`);if(cost>16.7)outliers.push({sample:i,cost});
      }
      return {length,simulation:summarize(sim),renderer:summarize(render),whole:summarize(whole),consumption:summarize(eat),consumptionWhole:summarize(eatWhole),outliers,hash:stateHash(f.state),renderedSegments:snapshots.length};
    }
  };
}
