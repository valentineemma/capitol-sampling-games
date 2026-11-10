Live website: https://capitol-sampling-games-valentineemma.burblingmica4.chatgpt.site

# The Sampling Games — Capitol Training Timeline

The live website is publicly accessible on other devices, with no local server or sign-in required. The project also runs locally at http://127.0.0.1:5173/ after launching it.

Source repository: https://github.com/valentineemma/capitol-sampling-games (private).

**Central question:** Which sampling method would you trust for this population, at what sample size, and with what limits?

## Scenario and data

- Wearable heart rate; `data/heart_rate_week.csv`.
- Finite population: 9,864 recorded minutes from one wearer, April 25–May 1, 2016. Target `heart_rate_bpm`, beats per minute. True mean: 66.41105028386075 bpm.
- Source: Furberg R, Brinton J, Keating M, Ortiz A. *Crowd-sourced Fitbit datasets 03.12.2016–05.12.2016*. Zenodo (2016), https://doi.org/10.5281/zenodo.53894, CC BY 4.0. Supplied minute-level extract; values unchanged. Activity states are derived from device logs.
- The 216 absent minutes and other people are outside this population. The Hunger Games presentation is fictional; the wearable data is real. The challenge reorders a copy in memory without changing the CSV.

## Run locally

Use Node.js 20.19+ or 22.12+ (this computer has Node 24), npm and Bash/Git Bash.

```bash
bash run_app.sh
```

Run from this project folder. Dependencies install automatically if `node_modules` is absent. Open http://127.0.0.1:5173/ and stop with **Ctrl+C**. If port 5173 is occupied, stop the earlier app before launching again.

On Windows, right-click the folder background → **Show more options → Open Git Bash here**. PowerShell alternative: `npm install` once, then `npm run dev`. You can also double-click `START-APP.cmd`.

## App features

1. **Population and single samples:** full chronological timeline, missing-time gaps, gold selected readings, day zoom, true mean beside sample mean or weighted stratified estimate, and a sample table.
2. **Sampling tabs:** SRS without replacement; random-start systematic selection with integer or fractional intervals; activity-state stratification with bounded proportional allocation and population weights. Same applied n/seed across tabs. Stratified sampling explains its limit below n = 3.
3. **Experiment A:** three methods at n = 100 on baseline data.
4. **Experiment B:** SRS at n = 1, 10 and 100; n = 100 is shared with A.
5. **Challenge:** baseline and modified systematic/SRS results at equal n, with order, rank-cycle period, sample-size and seed controls. Reset restores chronological order. Each condition uses its own recalculated true mean.
6. **Repeated evidence:** shared-axis histograms, bias, SD and RMSE in bpm, complete labels and JSON export. Default Monte Carlo count 100; selectable 1,000. Whole-number systematic intervals enumerate all starts exactly, without a seed.

## Recorded settings

| Investigation | Settings |
|---|---|
| Methods and sizes | Seed 20261109, 1,000 Monte Carlo repetitions; baseline N = 9,864; stratification activity_state, allocations exercise 10 / rest 60 / sleep 30 at n = 100; systematic fractional interval k = 98.64 |
| Challenge | n = 137, rank-cycle period 72; same rows/values, artificial order; systematic exact enumeration of 72 starts per order; SRS seed 20261109, 1,000 repetitions per order |
| Seed sensitivity | 20261110 and 20261111, 1,000 Monte Carlo repetitions; exact conditions unchanged |

The app starts with no repeated experiments run. To reproduce screenshots, choose 1,000 repetitions and seed 20261109, run A & B, then run the challenge at n = 137 and period = 72.

## Submission files

- `DECISIONS.md`: population, design choices, nine result rows, three findings, dated hypothesis and interpretation, and the section 6 wording supplied by the student.
- `evidence/method-comparison.jpg`, `evidence/sample-size-comparison.jpg`, `evidence/challenge-comparison.jpg`: labelled app screenshots.
- `evidence/methods.json`, `evidence/sample-sizes.json`, `evidence/challenge.json`: full estimates and settings.
- `evidence/results.csv`: concise results; `evidence/seed-sensitivity.json`: three-seed checks.
- `evidence/HYPOTHESIS-BEFORE-RUN.md`: unchanged dated hypothesis, committed before investigation runs.
- `src/sampling.js`: shared parser, samplers, estimators, summaries and in-memory challenge transform.
- `run_app.sh`, `START-APP.cmd`, pinned `package.json` and `package-lock.json`: launch and dependencies.

## Validation and reproducibility

```bash
npm test
npm run build
node scripts/record-evidence.mjs
```

Tests cover known-answer calculations, distinct selections/sample sizes, reproducibility, interval boundaries, allocations, weighted means, exact enumeration, Monte Carlo counts, RMSE² = bias² + SD², source immutability, recalculated true means, equal challenge sizes and SRS result reuse. The evidence command regenerates numeric exports without editing the decision log.

The static app builds into `dist/`; all calculations happen in the browser. No backend or API key is needed. Relative asset paths support subfolder hosting. The repository is private: a grader needs access or the submitted ZIP.
