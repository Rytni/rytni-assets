// Explicit isolated DEV commands. Never installed in a public/production entry.
import {KINDS} from './art.js';
import {bodyCells} from '../simulation/body.js';
export const ART_FIXTURES=Object.freeze({
 'desktop-30':{label:'Desktop · 30×12',stage:0,w:1920,h:1080},
 'desktop-50':{label:'Desktop · 50×20',stage:2,w:1920,h:1080},
 'mobile-30':{label:'Mobile · 30×12',stage:0,w:844,h:390},
 'mobile-40':{label:'Mobile · 40×16',stage:1,w:844,h:390},
 'mobile-50':{label:'Mobile · 50×20',stage:2,w:844,h:390}
});
export function placeAllPickups(s){
 if(!s?.world)return false;
 const occupied=new Set([...bodyCells(s.state),s.state.food,...s.portals,...s.world.obstacles.map(o=>o.cell),...s.world.hazards.map(o=>o.cell)]);
 const y=3,stride=s.arena.width;
 s.pickups=KINDS.map((kind,i)=>{
  const x=2+Math.round(i*(s.world.width-5)/8);let cell=y*stride+x;
  while(cell%stride<s.world.width-1&&(occupied.has(cell)||s.arena.blocked(cell)))cell++;
  if(cell%stride>=s.world.width-1)throw Error('DEV art fixture has no legal slot');
  occupied.add(cell);return {kind,cell,ends:s.tick+3600};
 });
 return true;
}
export function installArtFixtures(playground,{getGame,start}){
 let selected=new URLSearchParams(location.search).get('art-fixture');if(!ART_FIXTURES[selected])selected=null;
 const row=document.createElement('div');row.className='toolbar';row.id='production-art-fixtures';
 const choose=id=>{selected=id;const f=ART_FIXTURES[id];document.querySelector('#run-model').value='progressive';document.querySelector('#progress-stage').value=f.stage;start();};
 for(const [id,f]of Object.entries(ART_FIXTURES)){const b=document.createElement('button');b.dataset.artFixture=id;b.textContent=f.label;b.onpointerdown=e=>e.preventDefault();b.onclick=()=>choose(id);row.append(b);}
 const show=document.createElement('button');show.id='show-all-pickups';show.textContent='SHOW ALL 9 PICKUPS';show.onclick=()=>{const g=getGame();if(placeAllPickups(g?.session))g.render();};row.append(show);
 const reset=document.createElement('button');reset.textContent='NORMAL RUN';reset.id='leave-art-fixture';reset.onclick=()=>{selected=null;const g=getGame();if(g)g.artFixtureForest=false;document.querySelector('#progress-stage').value='0';start();};row.append(reset);
 const note=document.createElement('p');note.textContent='Art fixtures use canonical world previews; all nine legal pickups are staged and initially paused. Space resumes play. Forest appearance is a read-only presentation override for comparison. NORMAL RUN restores natural spawning.';
 playground.append(row,note);
 if(selected){document.querySelector('#progress-stage').value=ART_FIXTURES[selected].stage;}
 return {get selected(){return selected?ART_FIXTURES[selected]:null;},bind(g){
  const original=g.start.bind(g),hardwareTouch=g.touch;
  g.start=()=>{g.artFixtureForest=!!selected;g.touch=selected?selected.startsWith('mobile'):hardwareTouch;original();if(selected&&g.session?.world){placeAllPickups(g.session);g.pause();g.render();document.querySelector('#effect-playground-status').textContent=ART_FIXTURES[selected].label+' · all nine approved PNG pickups · paused';}};
 }};
}
