import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {parsePopulation,compareExperiments,challengeExperiments} from '../src/sampling.js';
const rows=parsePopulation(readFileSync(new URL('../data/heart_rate_week.csv',import.meta.url),'utf8'));
const folder=new URL('../evidence/',import.meta.url);mkdirSync(folder,{recursive:true});
const save=(name,data)=>writeFileSync(new URL(name,folder),JSON.stringify(data,null,2)+'\n');
const sensitivity=[];
for(const seed of ['20261109','20261110','20261111']) {
  const options={seed,repetitions:1000};
  const comparison=compareExperiments(rows,options);
  const challenge=challengeExperiments(rows,{...options,n:137,period:72,mode:'rank-cycle'});
  if(seed==='20261109') {save('methods.json',comparison.methods);save('sample-sizes.json',comparison.sizes);save('challenge.json',challenge);}
  const compact=r=>{const {estimates,starts,...summary}=r;return summary;};
  sensitivity.push({seed,methods:comparison.methods.map(compact),sizes:comparison.sizes.map(compact),challenge:challenge.results.map(compact)});
}
save('seed-sensitivity.json',sensitivity);
const primary=sensitivity[0];
const results=[...primary.methods.map(r=>({experiment:'Methods at n=100',...r})),...primary.sizes.slice(0,2).map(r=>({experiment:'Sample size',...r})),...primary.challenge.map(r=>({experiment:'Challenge',...r}))];
const keys=['experiment','population','condition','methodName','settings','seed','n','N','count','type','trueMean','meanEstimate','bias','sd','rmse'];
const quote=x=>`"${String(x).replaceAll('"','""')}"`;
writeFileSync(new URL('results.csv',folder),keys.map(quote).join(',')+'\n'+results.map(r=>keys.map(k=>quote(r[k])).join(',')).join('\n')+'\n');
console.log(JSON.stringify(sensitivity,null,2));
