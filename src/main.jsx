import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import csv from '../data/heart_rate_week.csv?raw';
import { mean, parsePopulation, drawSample, timelineView } from './sampling.js';
import './style.css';
import Experiments from './Experiments.jsx';

const population = parsePopulation(csv);
const trueMean = mean(population);
const days = ['Mon · Apr 25', 'Tue · Apr 26', 'Wed · Apr 27', 'Thu · Apr 28', 'Fri · Apr 29', 'Sat · Apr 30', 'Sun · May 1'];

function Timeline({ view, sampleMean }) {
  const canvas = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const geometry = useRef(null);
  useEffect(() => {
    const element = canvas.current;
    const draw = () => {
      const width = element.clientWidth;
      const height = 360;
      const ratio = window.devicePixelRatio || 1;
      element.width = width * ratio; element.height = height * ratio;
      const ctx = element.getContext('2d');
      ctx.scale(ratio, ratio);
      const left = 48, right = width - 20, top = 18, bottom = height - 42;
      const x = time => left + (time - view.start) / (view.end - view.start) * (right - left);
      const y = bpm => bottom - bpm / 200 * (bottom - top);
      geometry.current = { x, y, left, right, width };
      ctx.font = '11px system-ui';
      for (let bpm = 0; bpm <= 200; bpm += 40) {
        ctx.strokeStyle = '#303830'; ctx.beginPath(); ctx.moveTo(left, y(bpm)); ctx.lineTo(right, y(bpm)); ctx.stroke();
        ctx.fillStyle = '#a9b3a8'; ctx.textAlign = 'right'; ctx.fillText(bpm, left - 10, y(bpm) + 4);
      }
      for (const [start, end] of view.gaps) {
        ctx.fillStyle = '#e9ad691c'; ctx.fillRect(x(start), top, Math.max(1, x(end) - x(start)), bottom - top);
      }
      const ticks = view.end - view.start > 86400000 ? 7 : 6;
      for (let i = 0; i <= ticks; i++) {
        const time = view.start + (view.end - view.start) * i / ticks;
        const date = new Date(time);
        const label = ticks === 7 ? `${date.getUTCMonth() + 1}/${date.getUTCDate()}` : i === ticks ? '24:00' : `${String(date.getUTCHours()).padStart(2, '0')}:00`;
        ctx.fillStyle = '#a9b3a8'; ctx.textAlign = i === 0 ? 'left' : i === ticks ? 'right' : 'center';
        ctx.fillText(label, x(time), bottom + 23);
      }
      ctx.fillStyle = '#8faaa0a6';
      for (const row of view.visible) { ctx.beginPath(); ctx.arc(x(row.time), y(row.bpm), 1.35, 0, Math.PI * 2); ctx.fill(); }
      const reference = (value, color, dash) => {
        ctx.strokeStyle = color; ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(left, y(value)); ctx.lineTo(right, y(value)); ctx.stroke(); ctx.setLineDash([]);
      };
      reference(trueMean, '#d9e6dc', [5, 5]);
      if (sampleMean !== null) reference(sampleMean, '#ebc364', [2, 4]);
      ctx.fillStyle = '#f7c961'; ctx.strokeStyle = '#191d18'; ctx.lineWidth = 1;
      for (const row of view.selected) { ctx.beginPath(); ctx.arc(x(row.time), y(row.bpm), 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    };
    const observer = new ResizeObserver(draw); observer.observe(element); draw();
    return () => observer.disconnect();
  }, [view, sampleMean]);
  function inspect(event) {
    const g = geometry.current;
    if (!g) return;
    const rect = canvas.current.getBoundingClientRect();
    const mx = event.clientX - rect.left, my = event.clientY - rect.top;
    let closest, distance = 100;
    for (const row of view.visible) {
      const d = (g.x(row.time) - mx) ** 2 + (g.y(row.bpm) - my) ** 2;
      if (d < distance) { closest = row; distance = d; }
    }
    setTooltip(closest ? `${closest.timestamp} · ${closest.bpm} bpm · ${closest.state} · Row ${closest.id}` : null);
  }
  return <><canvas ref={canvas} onPointerMove={inspect} onPointerLeave={() => setTooltip(null)} role="img" aria-label={`Heart rate against device-local time. ${view.visible.length} recorded minutes and ${view.selected.length} sampled minutes in view. The table below lists sampled readings.`}/><div className="inspection" aria-live="polite">{tooltip || 'Point to a reading to inspect its timestamp, heart rate, activity, and row number.'}</div></>;
}

function App() {
  const [seed, setSeed] = useState('20261109');
  const [size, setSize] = useState('100');
  const [applied, setApplied] = useState({ seed:'20261109', n:100 });
  const [method, setMethod] = useState('srs');
  const [day, setDay] = useState('week');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const result = useMemo(() => {
    try { return drawSample(population, method, applied.n, applied.seed); }
    catch (failure) { return {rows:[],estimate:null,error:failure.message}; }
  }, [method,applied]);
  const view = timelineView(population, result.rows, day);
  const sampleMean = result.estimate;
  const dirty = seed !== applied.seed || size !== String(applied.n);
  const names = {srs:'Simple random',systematic:'Systematic',stratified:'Stratified'};
  const rules = {
    srs:'Select n distinct rows randomly without replacement from the full file. Every set of n rows is equally likely. Estimate: the sample mean.',
    systematic:'Choose a seeded random start, then select rows at a regular interval in chronological file order. Estimate: the sample mean. A row interval is not necessarily an equal time interval: missing readings create gaps.',
    stratified:'Group by activity_state (sleep, rest, exercise), then select rows randomly without replacement within each group. Estimate: sum of each group’s sample mean multiplied by its population weight—not the pooled sample mean.'
  };
  function applySettings(event) {
    event.preventDefault();
    const n = Number(size);
    if (!Number.isInteger(n) || n < 1 || n > population.length || !seed.trim()) { setError('Enter a whole-number sample size from 1 to 9,864 and a non-empty seed.'); return; }
    const chosenSeed = seed.trim();
    setError(''); setSeed(chosenSeed); setSize(String(n)); setApplied({seed:chosenSeed,n});
    setMessage(`Applied sample size ${n} and seed ${chosenSeed} to ${names[method]}.`);
  }
  return <main>
    <header><a className="brand" href="#">◈ &nbsp; THE SAMPLING GAMES</a><a className="stage" href="#experiments">STAGES 4 & 5 / INVESTIGATE ↓</a></header>
    <section className="intro"><p className="eyebrow">CAPITOL RESEARCH DIVISION · WEARABLE HEART RATE</p><h1>Every minute counts.</h1><p className="subtitle">A training timeline for exploring the population—and the moments selected from it.</p><div className="tags"><span>BASELINE POPULATION</span><span>ONE WEARER</span><span>APR 25 – MAY 1, 2016</span></div></section>
    <section className="stats" aria-label="Population and single sample statistics">
      <article><p>True population mean</p><strong>{trueMean.toFixed(5)} <small>bpm</small></strong><span>All 9,864 recorded minutes · dashed white line</span></article>
      <article className="gold"><p>{method === 'stratified' ? 'Population-weighted stratified estimate' : 'Single sample mean'}</p><strong>{sampleMean === null ? 'Unavailable' : sampleMean.toFixed(5)} <small>{sampleMean !== null && 'bpm'}</small></strong><span>{result.error ? 'Change n to draw a valid stratified sample.' : `${applied.n.toLocaleString('en-US')} selected minutes · dotted gold line`}</span></article>
      <article><p>Population coverage</p><strong>9,864 <small>minutes</small></strong><span>216 minutes missing from the 10,080-minute week</span></article>
    </section>
    <section className="panel method-panel"><p className="eyebrow">CHOOSE A SELECTION RULE · SINGLE SAMPLE</p>
      <div className="method-tabs" role="tablist" aria-label="Sampling method">{Object.entries(names).map(([key,name]) => <button key={key} id={`tab-${key}`} role="tab" aria-selected={method===key} aria-controls="method-content" onClick={()=>{setMethod(key);setMessage(`${name} selected with applied settings.`);}}>{name}</button>)}</div>
      <div role="tabpanel" id="method-content" aria-labelledby={`tab-${method}`}>
      <div className="controls"><div><h2>{names[method]} · n = {applied.n.toLocaleString('en-US')}</h2><p>{rules[method]}</p><p className="applied">Applied: baseline population · {names[method]} · n = {applied.n} · seed = {applied.seed}</p></div>
      <form onSubmit={applySettings} noValidate><div className="settings-fields"><div><label htmlFor="size">Sample size (n)</label><input id="size" type="number" min="1" max={population.length} step="1" value={size} onChange={event=>setSize(event.target.value)} aria-describedby="settings-status" /></div><div><label htmlFor="seed">Sample seed</label><input id="seed" value={seed} maxLength={100} onChange={event=>setSeed(event.target.value)} aria-describedby="settings-status" /></div></div><button className="apply-button" type="submit">Apply settings / Draw sample <span aria-hidden="true">↗</span></button><small id="settings-status">{dirty ? 'Unapplied edits: the current sample still uses the applied settings above.' : 'Settings applied. Same seed + method + settings = same sample.'}</small>{error && <p role="alert" className="error">{error}</p>}<span className="sr-only" role="status">{message}</span></form></div>
      {result.error && <p className="error blocked" role="alert">{result.error} No sample or estimate is shown for this method.</p>}
      {method==='systematic' && !result.error && <div className="rule-details"><strong>{result.design}</strong><p>Interval k = N/n = {population.length}/{applied.n} = {result.interval.toFixed(6)} rows. Random start {result.design === 'Integer interval' ? 'r' : 'u'} = {result.start.toFixed(6)}.</p><p>{result.design === 'Integer interval' ? 'Choose r from 1…k; select rows r, r+k, r+2k, …' : 'Choose u in (0, k]; select rows ceil(u + j × k) for j = 0…n−1.'} Row positions are 1-based in the original file.</p></div>}
      {method==='stratified' && !result.error && <div className="allocation"><p className="note">Proportional allocation with largest-remainder rounding; at least one row per group. Total allocation: {applied.n}. Weights are Nₕ/N. Estimate = Σ weight × group sample mean.</p><div className="allocation-scroll"><table><caption className="sr-only">Activity-state allocations and population-weighted estimate components</caption><thead><tr><th scope="col">Activity group</th><th scope="col">Population Nₕ</th><th scope="col">Weight Nₕ/N</th><th scope="col">Sample nₕ</th><th scope="col">Group sample mean (bpm)</th></tr></thead><tbody>{result.groups.map(g=><tr key={g.name}><td>{g.name}</td><td>{g.size.toLocaleString('en-US')}</td><td>{g.weight.toFixed(6)}</td><td>{g.allocation}</td><td>{g.sampleMean.toFixed(5)}</td></tr>)}</tbody></table></div></div>}
      </div>
    </section>
    <section className="panel chart"><div className="chart-heading"><div><p className="eyebrow">THE TRAINING TIMELINE</p><h2>One week. Every recorded minute.</h2></div><div><label htmlFor="day">Zoom / time window</label><select id="day" value={day} onChange={event => setDay(event.target.value)}><option value="week">Full week</option>{days.map((label, i) => <option key={i} value={String(i)}>{label}</option>)}</select></div></div>
      <div className="legend"><span><i className="dot muted"/>Recorded population</span><span><i className="dot gold-dot"/>Sampled minutes</span><span><i className="gap"/>Missing-time intervals</span></div><p className="axis-label">HEART RATE / BPM</p><Timeline view={view} sampleMean={sampleMean}/><div className="chart-footer"><span>{view.visible.length.toLocaleString('en-US')} population readings · {view.selected.length} sampled readings in view</span><span>DEVICE-LOCAL TIME · 2016</span></div><p className="note">Zoom changes only the view. The population mean and sample estimate always refer to the full recorded population, using the applied method and settings. Rows follow timestamps; neighbouring rows can be more than one minute apart.</p>
    </section>
    <section className="panel table-panel"><div className="chart-heading"><div><p className="eyebrow">SELECTION RECORD · {names[method].toUpperCase()}</p><h2>Sampled minutes in this view</h2></div><span className="badge">{result.error ? 'NO VALID SAMPLE' : `${view.selected.length} OF ${applied.n}`}</span></div><div className="table-scroll"><table><caption className="sr-only">Selected rows, ordered chronologically; filtered by the time window.</caption><thead><tr><th scope="col">Row</th><th scope="col">Timestamp (device local)</th><th scope="col">Heart rate (bpm)</th><th scope="col">Activity state</th></tr></thead><tbody>{view.selected.map(row => <tr key={row.id}><td>{row.id}</td><td>{row.timestamp}</td><td>{row.bpm.toFixed(1)}</td><td>{row.state}</td></tr>)}{!view.selected.length && <tr><td colSpan="4">{result.error ? 'No valid sample. Change the sample size and apply settings.' : `No sampled minutes in this time window. The full-week sample still contains ${applied.n} rows.`}</td></tr>}</tbody></table></div></section>
    <Experiments population={population}/>
    <footer><p><strong>Fictional theme. Real wearable data.</strong> This Hunger Games inspired interface uses one actual wearer's recorded minutes, not fictional tribute readings or a population of people. Activity states are device-derived estimates.</p><p>Source: Furberg R, Brinton J, Keating M, Ortiz A. <a href="https://doi.org/10.5281/zenodo.53894">Crowd-sourced Fitbit datasets</a> (2016), CC BY 4.0. Supplied minute-level extract; values unchanged. Missing minutes and other people are outside this population.</p><p className="eyebrow">MAY THE ODDS BE REPRESENTATIVE.</p></footer>
  </main>;
}
createRoot(document.getElementById('root')).render(<App/>);
