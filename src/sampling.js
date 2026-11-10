// All data parsing, selection, and statistical calculations live here.
export function parsePopulation(csv) {
  const [header, ...lines] = csv.trim().split(/\r?\n/);
  if (header !== 'row_id,timestamp,heart_rate_bpm,n_readings,activity_state') throw new Error('Unexpected heart-rate columns.');
  return lines.map(line => {
    const [id, timestamp, bpm, readings, state] = line.split(',');
    // UTC is a plotting convention only: preserve device-local clock spacing,
    // without applying the viewer's timezone or daylight-saving conversion.
    const time = Date.parse(timestamp.replace(' ', 'T') + ':00Z');
    const row = { id: Number(id), timestamp, time, bpm: Number(bpm), readings: Number(readings), state };
    if (!Number.isFinite(time) || !bpm?.trim() || !Number.isFinite(row.bpm)) throw new Error('Invalid heart-rate record.');
    return row;
  });
}
export function mean(rows) {
  if (!rows.length) throw new Error('A mean requires at least one row.');
  return rows.reduce((sum, row) => sum + row.bpm, 0) / rows.length;
}
export function seededRandom(seed) {
  let state = 2166136261;
  for (const char of String(seed)) state = Math.imul(state ^ char.charCodeAt(0), 16777619) >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = Math.imul(state ^ state >>> 15, state | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function checkSize(rows, n) {
  if (!Number.isInteger(n) || n < 1 || n > rows.length) throw new Error('Sample size must be between 1 and N.');
}
export function simpleRandom(rows, n, seed) {
  checkSize(rows, n);
  const random = seededRandom(seed);
  const pool = [...rows];
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n).sort((a, b) => a.id - b.id);
}
export function systematicFromStart(rows, n, start) {
  checkSize(rows, n);
  const interval = rows.length / n;
  const integer = Number.isInteger(interval);
  if (!(start > 0 && start <= interval) || (integer && !Number.isInteger(start))) throw new Error('Invalid systematic start.');
  const selected = Array.from({length:n}, (_, j) => {
    const coordinate = start + j * rows.length / n;
    // Snap numerical noise at integer boundaries; retain the first row for
    // a positive start arbitrarily close to zero, and clamp the final index.
    const rounded = Math.round(coordinate);
    const stable = rounded > 0 && Math.abs(coordinate-rounded) <= 8*Number.EPSILON*Math.max(1,coordinate) ? rounded : coordinate;
    const position = integer ? start + j * interval : Math.min(rows.length, Math.max(1,Math.ceil(stable)));
    return rows[position - 1];
  });
  return { rows: selected, interval, start, design: integer ? 'Integer interval' : 'Fractional interval' };
}
export function systematic(rows, n, seed) {
  checkSize(rows, n);
  const interval = rows.length / n;
  const random = seededRandom(seed);
  const start = Number.isInteger(interval) ? 1 + Math.floor(random() * interval) : (1 - random()) * interval;
  return systematicFromStart(rows, n, start);
}
export function allocateStrata(rows, n, column = 'state') {
  checkSize(rows, n);
  const groups = [...new Set(rows.map(row => row[column]))].sort().map(name => {
    const members = rows.filter(row => row[column] === name);
    const ideal = n * members.length / rows.length;
    return { name, members, size: members.length, weight: members.length / rows.length, ideal, allocation: Math.min(members.length, Math.max(1, Math.floor(ideal))) };
  });
  if (n < groups.length) throw new Error(`Stratified sampling needs at least ${groups.length} rows: one per activity group. Change the sample size to continue.`);
  let total = groups.reduce((sum,g)=>sum+g.allocation,0);
  while (total !== n) {
    const direction = total < n ? 1 : -1;
    const candidates = groups.filter(g => direction > 0 ? g.allocation < g.size : g.allocation > 1);
    candidates.sort((a,b) => {
      const scoreA = direction * (a.ideal-a.allocation);
      const scoreB = direction * (b.ideal-b.allocation);
      return scoreB-scoreA || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    });
    candidates[0].allocation += direction;
    total += direction;
  }
  return groups;
}
export function stratified(rows, n, seed) {
  const groups = allocateStrata(rows, n).map(group => {
    const selected = simpleRandom(group.members, group.allocation, JSON.stringify([String(seed), group.name]));
    return { ...group, selected, sampleMean: mean(selected) };
  });
  return { rows: groups.flatMap(g=>g.selected).sort((a,b)=>a.id-b.id), groups, estimate: groups.reduce((sum,g)=>sum+g.weight*g.sampleMean,0) };
}
export function drawSample(rows, method, n, seed) {
  if (method === 'srs') {
    const selected = simpleRandom(rows,n,seed);
    return { rows:selected, estimate:mean(selected) };
  }
  if (method === 'systematic') {
    const result = systematic(rows,n,seed);
    return { ...result, estimate:mean(result.rows) };
  }
  if (method === 'stratified') return stratified(rows,n,seed);
  throw new Error('Unknown sampling method.');
}
export const METHOD_NAMES = {srs:'Simple random',systematic:'Systematic',stratified:'Stratified'};
export function summarize(estimates, truth) {
  if (!estimates.length || !estimates.every(Number.isFinite) || !Number.isFinite(truth)) throw new Error('Finite estimates and true mean are required.');
  const centre = estimates.reduce((a,b)=>a+b,0)/estimates.length;
  const bias = centre-truth;
  const sd = Math.sqrt(estimates.reduce((s,x)=>s+(x-centre)**2,0)/estimates.length);
  const rmse = Math.sqrt(estimates.reduce((s,x)=>s+(x-truth)**2,0)/estimates.length);
  return {trueMean:truth, meanEstimate:centre, bias, sd, rmse};
}
export function runExperiment(rows, {method,n,seed='20261109',repetitions=100,population='baseline',condition='chronological file order'}) {
  checkSize(rows,n);
  if (!Number.isInteger(repetitions) || repetitions<100 || repetitions>1000) throw new Error('Monte Carlo repetitions must be a whole number from 100 to 1,000.');
  const interval=rows.length/n;
  const exact=method==='systematic' && Number.isInteger(interval);
  const starts=exact ? Array.from({length:interval},(_,i)=>i+1) : undefined;
  const estimates=exact ? starts.map(start=>mean(systematicFromStart(rows,n,start).rows)) : Array.from({length:repetitions},(_,i)=>drawSample(rows,method,n,JSON.stringify([String(seed),method,n,i])).estimate);
  const settings = method==='stratified' ? `activity_state; population weights; allocations ${allocateStrata(rows,n).map(g=>`${g.name}:${g.allocation}`).join(', ')}` : method==='systematic' ? `${Number.isInteger(interval)?'integer':'fractional'} interval k=${interval}; ${condition}` : 'SRS without replacement';
  return {population,condition,method,methodName:METHOD_NAMES[method],settings,n,N:rows.length,seed:exact?'exact':String(seed),count:estimates.length,type:exact?'exact':'Monte Carlo',...(starts?{starts}:{}),...summarize(estimates,mean(rows)),estimates};
}
export function compareExperiments(rows, options={}) {
  const common={seed:options.seed??'20261109',repetitions:options.repetitions??100};
  const methods=['srs','systematic','stratified'].map(method=>runExperiment(rows,{...common,method,n:100}));
  const sizes=[1,10].map(n=>runExperiment(rows,{...common,method:'srs',n}));
  sizes.push(methods[0]); // Reuse exactly the same SRS n=100 result.
  return {seed:String(common.seed),repetitions:common.repetitions,methods,sizes};
}
export function modifyOrder(rows, mode='rank-cycle', period=72) {
  if(mode==='original') return rows.map(r=>({...r}));
  if(mode!=='rank-cycle' || !Number.isInteger(period) || period<2 || period>Math.min(200,rows.length)) throw new Error('Rank-cycle period must be a whole number from 2 to 200 (and no larger than N).');
  const sorted=rows.map(r=>({...r})).sort((a,b)=>a.bpm-b.bpm||a.id-b.id);
  const bands=Array.from({length:period},(_,i)=>sorted.slice(Math.floor(i*rows.length/period),Math.floor((i+1)*rows.length/period)));
  const reordered=[];
  const longest=Math.max(...bands.map(b=>b.length));
  for(let j=0;j<longest;j++) for(const band of bands) if(band[j]) reordered.push(band[j]);
  return reordered;
}
export function challengeExperiments(rows, {n=137,period=72,mode='rank-cycle',seed='20261109',repetitions=100}={}) {
  const modified=modifyOrder(rows,mode,period);
  const condition=mode==='original'?'original chronological order (unmodified copy)':`rank-cycle period=${period}; artificial row order`;
  const results=[];
  for(const method of ['systematic','srs']) {
    results.push(runExperiment(rows,{method,n,seed,repetitions,population:'baseline',condition:'chronological file order'}));
    results.push(runExperiment(modified,{method,n,seed,repetitions,population:'modified',condition}));
  }
  return {n,period,mode,seed:String(seed),repetitions,results,preview:modified.slice(0,Math.min(300,modified.length)).map((r,i)=>({position:i+1,id:r.id,bpm:r.bpm})),baselineTrueMean:mean(rows),modifiedTrueMean:mean(modified)};
}
export const WEEK_START = Date.UTC(2016, 3, 25);
export const WEEK_END = WEEK_START + 7 * 86400000;
export function timelineView(rows, sample, day = 'week') {
  const start = day === 'week' ? WEEK_START : WEEK_START + Number(day) * 86400000;
  const end = day === 'week' ? WEEK_END : start + 86400000;
  const inside = row => row.time >= start && row.time < end;
  const visible = rows.filter(inside);
  const selected = sample.filter(inside);
  // Missing-time intervals include leading and trailing missing minutes.
  const gaps = [];
  let cursor = start;
  for (const row of visible) {
    if (row.time > cursor) gaps.push([cursor, row.time]);
    cursor = row.time + 60000;
  }
  if (cursor < end) gaps.push([cursor, end]);
  return { start, end, visible, selected, gaps };
}
