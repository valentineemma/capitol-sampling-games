import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mean, parsePopulation, simpleRandom, timelineView, systematic, systematicFromStart, allocateStrata, stratified, drawSample } from './src/sampling.js';
const rows = parsePopulation(readFileSync(new URL('./data/heart_rate_week.csv', import.meta.url), 'utf8'));
test('supplied data parses with chronological timestamps, missing-time gaps, and finite targets', () => {
  assert.equal(rows.length, 9864);
  assert.equal(new Set(rows.map(r => r.id)).size, rows.length);
  assert.ok(rows.every(r => Number.isFinite(r.bpm)));
  assert.ok(rows.slice(1).every((r, i) => r.time > rows[i].time));
  const view = timelineView(rows, [], 'week');
  assert.equal(view.gaps.reduce((sum, [a,b]) => sum + (b-a)/60000, 0), 216);
  // The dictionary's 135-minute gap is timestamp spacing: 134 absent minutes
  // between the two observed minutes at its endpoints.
  assert.equal(Math.max(...view.gaps.map(([a,b]) => (b-a)/60000)), 134);
  assert.equal(Math.max(...rows.slice(1).map((r,i)=>(r.time-rows[i].time)/60000)),135);
  assert.equal(rows[0].time, Date.UTC(2016,3,25));
});
test('simple random sample has n distinct original rows and reproduces with same seed', () => {
  for (const n of [1,10,100,rows.length]) {
    const sample = simpleRandom(rows,n,'20261109');
    assert.equal(sample.length,n);
    assert.equal(new Set(sample.map(r=>r.id)).size,n);
    assert.ok(sample.every(r=>rows.includes(r)));
    assert.deepEqual(sample,simpleRandom(rows,n,'20261109'));
  }
  assert.throws(()=>simpleRandom(rows,0,'x'));
  assert.throws(()=>simpleRandom(rows,rows.length+1,'x'));
});
test('means agree with known answers and checked population value', () => {
  assert.equal(mean([{bpm:2},{bpm:4},{bpm:9}]),5);
  assert.ok(Math.abs(mean(rows)-66.41105028386075)<1e-10);
  assert.throws(()=>mean([]));
});
test('day zoom partitions the population and sample without changing global means or selection', () => {
  const sample = simpleRandom(rows,100,'20261109');
  const before = JSON.stringify(sample);
  const popMean = mean(rows), sampleMean = mean(sample);
  const views = Array.from({length:7},(_,i)=>timelineView(rows,sample,String(i)));
  assert.equal(views.reduce((n,v)=>n+v.visible.length,0),rows.length);
  assert.equal(views.reduce((n,v)=>n+v.selected.length,0),100);
  for (const view of views) assert.ok(view.visible.every(r=>r.time>=view.start && r.time<view.end));
  assert.equal(JSON.stringify(sample),before);
  assert.equal(mean(rows),popMean); assert.equal(mean(sample),sampleMean);
});
test('systematic selection follows integer and fractional starts including endpoints',()=>{
  const toy=Array.from({length:12},(_,i)=>({id:i+1,bpm:i}));
  assert.deepEqual(systematicFromStart(toy,4,2).rows.map(r=>r.id),[2,5,8,11]);
  assert.deepEqual(systematicFromStart(toy,5,2.4).rows.map(r=>r.id),[3,5,8,10,12]);
  assert.deepEqual(systematicFromStart(toy,5,Number.MIN_VALUE).rows.map(r=>r.id),[1,3,5,8,10]);
  assert.throws(()=>systematicFromStart(toy,4,1.5));
  assert.throws(()=>systematicFromStart(toy,4,0));
  for(const n of [1,2,10,100,rows.length-1,rows.length]) {
    const result=systematic(rows,n,'fixed');
    assert.equal(result.rows.length,n); assert.equal(new Set(result.rows).size,n);
    assert.ok(result.rows.every(r=>rows.includes(r)));
    assert.deepEqual(result,systematic(rows,n,'fixed'));
    assert.deepEqual(result.rows.map(r=>r.id),Array.from({length:n},(_,j)=>Math.min(rows.length,Math.ceil(result.start+j*rows.length/n))));
  }
});
test('systematic fractional selection never crosses bounds over all sizes on small populations',()=>{
  for(let N=1;N<=45;N++) {
    const toy=Array.from({length:N},(_,i)=>({id:i+1,bpm:i}));
    for(let n=1;n<=N;n++) for(const seed of ['a','b','c']) {
      const result=systematic(toy,n,seed);
      assert.equal(new Set(result.rows).size,n);
      assert.ok(result.rows.every(Boolean));
    }
  }
});
test('stratified allocation respects totals, minimums, capacity and deterministic alphabetical ties',()=>{
  for (const n of [3,4,10,100,rows.length-1,rows.length]) {
    const groups=allocateStrata(rows,n);
    assert.equal(groups.reduce((s,g)=>s+g.allocation,0),n);
    assert.ok(groups.every(g=>Number.isInteger(g.allocation)&&g.allocation>=1&&g.allocation<=g.size));
    assert.ok(Math.abs(groups.reduce((s,g)=>s+g.weight,0)-1)<1e-12);
  }
  assert.throws(()=>stratified(rows,1,'x'),/at least 3/);
  assert.throws(()=>stratified(rows,2,'x'),/at least 3/);
  const equal=['a','b','c'].flatMap((state,j)=>Array.from({length:4},(_,i)=>({id:j*4+i+1,bpm:10,state})));
  assert.deepEqual(allocateStrata(equal,4).map(g=>g.allocation),[2,1,1]);
  const unequal=[...Array.from({length:20},(_,i)=>({id:i+1,state:'a',bpm:10})),{id:21,state:'b',bpm:20},{id:22,state:'c',bpm:30}];
  assert.deepEqual(allocateStrata(unequal,3).map(g=>g.allocation),[1,1,1]);
  for(let n=3;n<=equal.length;n++) assert.equal(allocateStrata(equal,n).reduce((s,g)=>s+g.allocation,0),n);
});
test('stratified weighted estimate uses population weights, not pooled sample mean',()=>{
  const toy=[{id:1,state:'a',bpm:10},{id:2,state:'a',bpm:10},{id:3,state:'a',bpm:10},{id:4,state:'b',bpm:30}];
  const result=stratified(toy,2,'fixed');
  assert.equal(result.estimate,15); assert.equal(mean(result.rows),20);
  for(const n of [3,10,100,rows.length]) {
    const selected=stratified(rows,n,'fixed');
    assert.equal(selected.rows.length,n);assert.equal(new Set(selected.rows).size,n);
    assert.deepEqual(selected,stratified(rows,n,'fixed'));
    for(const g of selected.groups) assert.ok(g.selected.every(r=>r.state===g.name));
  }
});
test('shared draw interface and zoom retain the selected method estimate and rows',()=>{
  for(const method of ['srs','systematic','stratified']) {
    const result=drawSample(rows,method,100,'20261109');
    const before=JSON.stringify(result);
    for(let day=0;day<7;day++) timelineView(rows,result.rows,String(day));
    assert.equal(JSON.stringify(result),before);
    if(method!=='stratified') assert.equal(result.estimate,mean(result.rows));
  }
  assert.throws(()=>drawSample(rows,'invalid',100,'x'));
});
