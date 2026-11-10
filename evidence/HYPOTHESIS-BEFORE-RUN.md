# Challenge hypothesis — recorded before implementation and experiment runs

Recorded: 2026-11-10, 4:22 p.m. America/New_York (21:22 UTC).

Method: systematic sampling with a random start.

Condition: reorder an in-memory copy into a repeating rank cycle. Sort readings by heart rate, split them into 72 contiguous rank groups, and interleave one reading from each group at a time. Keep all 9,864 original rows and values. The modified row order is artificial, not chronological.

Test: n = 137, so N/n = 72. Enumerate all 72 systematic starts on each population; compare with seeded simple random sampling of 137 distinct rows on each population. Default interface repetitions: 100; recorded evidence: 1,000. Evidence seed: 20261109; sensitivity seeds: 20261110 and 20261111.

Prediction: the rank cycle will align with the 72-row systematic interval. Different starts will select different heart-rate rank bands, increasing SD of estimates and RMSE relative to chronological baseline and simple random sampling. Exact systematic bias should remain effectively zero because the correct random-start design is unbiased. Reordering will not change the population mean.

Alternative: simple random sampling, because selection does not use fixed row intervals. Its theoretical distribution is unchanged by reordering; finite Monte Carlo results can differ between orders for a given seed.

Contradiction: the modified systematic SD and RMSE do not increase relative to baseline, or they remain comparable to simple random sampling under this condition. A nonzero exact systematic bias beyond numerical rounding would indicate an implementation problem, not support for this hypothesis.

Design selection: matched histograms on shared axes with labelled true means and a metrics table, rather than overlaid distributions that can obscure each other. For the challenge, explicit order mode, rank-cycle period, sample-size and seed controls with a baseline/modified preview and four separately labelled result panels; no hidden data edits or pooled conditions.

This original prediction will remain unchanged. Later interpretation belongs in DECISIONS.md. Tool use is recorded in that file's AI-use section.
