export function occupied(state,cell) { return cell>=0&&!!(state.occupancy[cell>>>5]&(1<<(cell&31))); }
export function mark(state,cell,value) {
  const word=cell>>>5,mask=1<<(cell&31);if(value)state.occupancy[word]|=mask;else state.occupancy[word]&=~mask;
}
export function bodyCell(state,index) { return state.body[(state.headIndex+index)%state.body.length]; }
export function bodyCells(state) { return Array.from({length:state.length},(_,i)=>bodyCell(state,i)); }
export function moveBody(state,cell,grow) {
  if(!grow)mark(state,bodyCell(state,state.length-1),false);
  state.headIndex=(state.headIndex+state.body.length-1)%state.body.length;
  state.body[state.headIndex]=cell;mark(state,cell,true);
  if(grow)state.length++;
}
