// Independent xorshift32; all operations have explicit unsigned 32-bit semantics.
export function nextUint(state) {
  let x=state.rng>>>0; x^=x<<13; x^=x>>>17; x^=x<<5;
  state.rng=x>>>0; return state.rng;
}
export function seedWord(seed) {
  if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw RangeError('Seed must be uint32');
  return (seed>>>0)||0x6d2b79f5;
}
export function hashText(text,initial=2166136261) {
  let h=initial>>>0; for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619)>>>0; return h;
}
export function deriveSeed(seed,label) { return seedWord(hashText(label,seedWord(seed))); }
export function randomIndex(state,count) {
  if(!Number.isInteger(count)||count<=0||count>0xffffffff)throw RangeError('Invalid random range');
  const limit=4294967296-(4294967296%count); let value;
  do { value=nextUint(state); } while(value>=limit);
  return value%count;
}
