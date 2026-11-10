import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {summarize,runExperiment,modifyOrder,challengeExperiments,compareExperiments,parsePopulation,mean,systematicFromStart} from './src/sampling.js';
const rows=parsePopulation(readFileSync(new URL('./data/heart_rate_week.csv',import.meta.url),'utf8'));
test('bias, population-divisor SD and RMSE match hand calculations',()=>{
  const r=summarize([1,2,3],3);assert.equal(r.bias,-1);assert.ok(Math.abs(r.sd-Math.sqrt(2/3))<1e-12);assert.ok(Math.abs(r.rmse-Math.sqrt(5/3))<1e-12);
  assert.ok(Math.abs(r.rmse**2-r.bias**2-r.sd**2)<1e-12);
  assert.throws(()=>summarize([],1));assert.throws(()=>summarize([NaN],1));
});
test('exact systematic enumeration visits every possible start once, without seeds',()=>{
  const toy=Array.from({length:12},(_,i)=>({id:i+1,bpm:i+1,state:i%2?'a':'b'}));
  const r=runExperiment(toy,{method:'systematic',n:4,repetitions:100,seed:'x'});
  assert.equal(r.type,'exact');assert.equal(r.seed,'exact');assert.deepEqual(r.starts,[1,2,3]);assert.deepEqual(r.estimates,[5.5,6.5,7.5]);assert.equal(r.bias,0);
  assert.deepEqual(r,runExperiment(toy,{method:'systematic',n:4,repetitions:1000,seed:'different'}));
  for(const n of [1,2,3,4,6,12]) {const k=12/n;const all=new Set();for(let start=1;start<=k;start++)systematicFromStart(toy,n,start).rows.forEach(r=>all.add(r.id));assert.equal(all.size,12);}
});
test('Monte Carlo repetitions are reproducible, with correct counts and metric identity',()=>{
  const toy=Array.from({length:20},(_,i)=>({id:i+1,bpm:i+1,state:i<10?'a':'b'}));
  for(const method of ['srs','systematic','stratified']) {
    const options={method,n:3,seed:'fixed',repetitions:100};const r=runExperiment(toy,options);
    assert.equal(r.type,'Monte Carlo');assert.equal(r.estimates.length,100);assert.deepEqual(r,runExperiment(toy,options));assert.ok(Math.abs(r.rmse**2-r.bias**2-r.sd**2)<1e-10);
  }
  assert.throws(()=>runExperiment(toy,{method:'srs',n:3,repetitions:99}));
  assert.throws(()=>runExperiment(toy,{method:'srs',n:3,repetitions:1001}));
  assert.equal(runExperiment(toy,{method:'srs',n:2,repetitions:1000}).count,1000);
});
test('rank cycling preserves values, membership, source data and mean for non-divisor periods too',()=>{
  const original=JSON.stringify(rows);
  for(const period of [2,7,72,199]) {
    const modified=modifyOrder(rows,'rank-cycle',period);assert.equal(modified.length,rows.length);assert.equal(new Set(modified.map(r=>r.id)).size,rows.length);
    assert.deepEqual([...modified].sort((a,b)=>a.id-b.id),rows);assert.ok(Math.abs(mean(modified)-mean(rows))<1e-10);
  }
  assert.equal(JSON.stringify(rows),original);assert.deepEqual(modifyOrder(rows,'original'),rows);
  assert.throws(()=>modifyOrder(rows,'rank-cycle',0));assert.throws(()=>modifyOrder(rows,'rank-cycle',72.5));
});
test('challenge has four equal-n conditions evaluated against their own truths and recalculates interval design',()=>{
  const toy=Array.from({length:24},(_,i)=>({id:i+1,bpm:i+20,state:'rest'}));
  for(const n of [4,5]) {
    const options={n,period:6,seed:'x',repetitions:100};const r=challengeExperiments(toy,options);
    assert.equal(r.results.length,4);assert.ok(r.results.every(x=>x.n===n));
    assert.equal(new Set(r.results.map(x=>`${x.population}:${x.method}`)).size,4);
    for(const x of r.results){assert.equal(x.trueMean,31.5);assert.equal(x.type,x.method==='systematic'&&n===4?'exact':'Monte Carlo');}
    assert.deepEqual(r,challengeExperiments(toy,options));
  }
  const changed=toy.slice(1);assert.equal(runExperiment(changed,{method:'systematic',n:4}).type,'Monte Carlo');
  assert.equal(runExperiment(changed,{method:'srs',n:4}).trueMean,mean(changed));
});
test('comparison reuses SRS n=100 between experiments A and B',()=>{
  const toy=Array.from({length:120},(_,i)=>({id:i+1,bpm:i+1,state:i<60?'rest':'sleep'}));
  const r=compareExperiments(toy,{repetitions:100});assert.strictEqual(r.methods[0],r.sizes[2]);assert.deepEqual(r.sizes.map(x=>x.n),[1,10,100]);assert.ok(r.methods.every(x=>x.n===100));
});
