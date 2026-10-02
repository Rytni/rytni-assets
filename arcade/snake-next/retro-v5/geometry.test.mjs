import test from 'node:test';
import assert from 'node:assert/strict';
import {audit,structuralAudit} from './qa.mjs';
import {CELL,BODY,HEAD,pieces,rotate,terminal,straight} from './geometry.mjs';
test('Exact canonical dimensions and conservative bend thickness',()=>{
  const report=structuralAudit();
  assert.equal(CELL,68);assert.equal(BODY,36);assert.equal(HEAD,42);
  assert.equal(report.pass,true,JSON.stringify(report));
  assert.equal(report.taperLength,68);assert.equal(report.terminalTip,2);
});
test('Rotations are exact permutations, never resampled masks',()=>{
  for(const piece of pieces) {
    assert.deepEqual(rotate(piece.mask,4),piece.mask);
    assert.equal(piece.mask.every(v=>v===0||v===1),true);
  }
});
test('Straight constant width, terminal gradual and symmetric',()=>{
  for(let x=0;x<CELL;x++) {
    let width=0;
    for(let y=0;y<CELL;y++) {
      width+=straight[y*CELL+x];
      assert.equal(terminal[y*CELL+x],terminal[(CELL-1-y)*CELL+x]);
    }
    assert.equal(width,36);
  }
});
for(const dpr of [1,1.5,2]) test('All legal connector pairs, DPR '+dpr,()=>{
  const report=audit(dpr);
  assert.equal(report.pass,true,JSON.stringify(report));
  assert.ok(report.pairs>200);assert.equal(report.connectors,32);
});
