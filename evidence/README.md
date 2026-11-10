# Investigation evidence

Primary seed: 20261109. Recorded Monte Carlo count: 1,000 per condition. Units: bpm. Exact systematic challenge results enumerate all 72 starts without a seed.

| File | Purpose |
|---|---|
| method-comparison.jpg | Three baseline methods at n = 100 |
| sample-size-comparison.jpg | Baseline SRS at n = 1, 10 and 100; n = 100 reused |
| challenge-comparison.jpg | Four equal-n baseline/modified results, each separately labelled |
| methods.json | Full estimate arrays, settings and metrics: methods |
| sample-sizes.json | Full estimate arrays, settings and metrics: sample sizes |
| challenge.json | Four estimate arrays, exact starts, settings and order preview |
| results.csv | Nine summary rows |
| seed-sensitivity.json | Seeds 20261109, 20261110 and 20261111 |
| HYPOTHESIS-BEFORE-RUN.md | Dated prediction committed before experiments |

Challenge: n = 137, rank-cycle period = 72, N/n = 72. All 9,864 rows and values are retained. Tiny nonzero exact biases in raw exports are summation roundoff. Screenshots are from the running app. Exports use the shared app calculations and were checked against displayed metrics. Regenerate numbers with `node scripts/record-evidence.mjs`.
