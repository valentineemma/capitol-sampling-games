# Decisions and evidence notes

Completed results and findings for the wearable heart-rate investigation. Section 6 contains the wording supplied by the student.

| Stage | What I record here |
|---|---|
| 1 | Section 1 |
| 2–5 | Section 2: my design choice, written before I switch my agent to build |
| 4 | Section 3: method and sample-size rows; section 4: findings (a) and (b) |
| 5 | Section 5: hypothesis first; then section 3: challenge rows; section 5: finding (c) |
| All | Section 6: AI use |

## 1. Population and target

- Scenario and file: Wearable heart rate — data/heart_rate_week.csv
- One row means: One recorded minute from one wearer.
- Number of rows (N): 9,864
- Row order, and what it means in this file: The rows in this file follow timestamp order. They are written from earliest to latest. Two neighboring rows aren’t always exactly one minute apart. Minutes without readings are absent from this file.
- Target column and units: heart_rate_bpm, measured in beats per minute (bpm)
- My finite population is (and what it is not): My finite population is 9,864 recorded minutes from one wearer during April 25-May 1, 2016. It excludes missing minutes and other people. 
- True mean I calculated (and how): I calculated 66.41105 bpm using =AVERAGE(C2:C9865)

## 2. Design choices

For each stage: the option I chose, why, and what it is meant to help a user learn.

- Stage 2, visualization (include one visual feature meant to reveal a sampling problem): I chose Capitol training timeline with gold highlights for sampled minutes and a zoom control. This will help users notice both the full population of recorded minutes and the gaps when readings are missing. Gold highlights will identify the sampled minutes.
- Stage 3, sampling interactions and stratification column: I chose method tabs because I prefer one timeline when switching between sampling methods. For stratified sampling, I chose activity_state because I want to explore how each activity group is represented in the sample. 
- Stage 4, presentation of the method comparison and sample-size experiments: Matched histograms on shared x and y axes, with a labelled true mean and bias/SD/RMSE below each panel. Separate experiment tabs keep the fixed-n method comparison distinct from the SRS sample-size comparison. An overlay was considered, but separated panels avoid hiding distributions. Evidence uses seed 20261109 and 1,000 repetitions; the interface defaults to 100.
- Stage 5, challenge controls and my alternative method or correction: An explicit order selector, rank-cycle period, sample size and seed controls, plus four matched result panels and a preview of modified row positions. This makes the condition reproducible and keeps baseline and modified results separate. A single opaque preset was rejected because users could not inspect or change the condition. Challenge systematic sampling against SRS, default n = 137 and period = 72.

## 3. Results table

All true means, biases, SDs and RMSEs are in beats per minute. Values are rounded to five decimal places; full precision and all estimates are in the evidence exports. SD divides by the number of estimates.

| Experiment | Population or condition | Method | Settings | Seed (or exact) | n | Repetitions or starts | Type | True mean | Bias | SD | RMSE |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Methods at n = 100 | baseline: chronological file order | Simple random | SRS without replacement | 20261109 | 100 | 1000 | Monte Carlo | 66.41105 | -0.04969 | 1.80392 | 1.80460 |
| Methods at n = 100 | baseline: chronological file order | Systematic | fractional interval k=98.64; chronological file order | 20261109 | 100 | 1000 | Monte Carlo | 66.41105 | 0.03332 | 1.52774 | 1.52810 |
| Methods at n = 100 | baseline: chronological file order | Stratified | activity_state; population weights; allocations exercise:10, rest:60, sleep:30 | 20261109 | 100 | 1000 | Monte Carlo | 66.41105 | 0.04374 | 1.06943 | 1.07032 |
| Sample size | baseline: chronological file order | Simple random | SRS without replacement | 20261109 | 1 | 1000 | Monte Carlo | 66.41105 | -0.02925 | 18.32146 | 18.32148 |
| Sample size | baseline: chronological file order | Simple random | SRS without replacement | 20261109 | 10 | 1000 | Monte Carlo | 66.41105 | -0.22628 | 5.69062 | 5.69512 |
| Challenge | baseline: chronological file order | Systematic | integer interval k=72; chronological file order | exact | 137 | 72 | exact | 66.41105 | 0.00000 | 1.05733 | 1.05733 |
| Challenge | modified: rank-cycle period=72; artificial row order | Systematic | integer interval k=72; rank-cycle period=72; artificial row order | exact | 137 | 72 | exact | 66.41105 | 0.00000 | 18.77925 | 18.77925 |
| Challenge | baseline: chronological file order | Simple random | SRS without replacement | 20261109 | 137 | 1000 | Monte Carlo | 66.41105 | 0.08068 | 1.59430 | 1.59634 |
| Challenge | modified: rank-cycle period=72; artificial row order | Simple random | SRS without replacement | 20261109 | 137 | 1000 | Monte Carlo | 66.41105 | -0.02221 | 1.63940 | 1.63955 |

The baseline SRS n = 100 result is reused without alteration in the sample-size experiment. Challenge baselines use n = 137 and are separate results; they are not reused from the n = 100 comparison. Exact systematic results enumerate all 72 equally likely starts and use no random seed. Their biases are numerical roundoff (absolute value below 5 × 10⁻¹³ bpm), shown as zero here.

Supporting files: evidence/methods.json, evidence/sample-sizes.json, evidence/challenge.json, evidence/results.csv and the three labelled comparison screenshots. evidence/seed-sensitivity.json records the additional-seed checks.

## 4. Findings

### (a) Method comparison at n = 100

For this finite population of 9,864 recorded minutes, stratifying by activity_state gave the smallest RMSE in the recorded run: 1.07032 bpm, versus 1.52810 for systematic sampling and 1.80460 for simple random sampling. Its SD was also smallest (1.06943 versus 1.52774 and 1.80392 bpm). Biases were −0.04969, +0.03332 and +0.04374 bpm for SRS, systematic and stratified respectively; these are Monte Carlo estimates, not proof of design bias. The correct designs are unbiased, and variability accounts for most of these errors. The same RMSE ranking held across seeds 20261109, 20261110 and 20261111 at 1,000 repetitions. Stratified RMSE ranged from 1.02333 to 1.07032 bpm, systematic from 1.52810 to 1.58030, and SRS from 1.80460 to 1.90559.

For estimating this file's mean, I would choose proportionally allocated, population-weighted stratified sampling at n = 100 when the activity labels are available. This is a conditional choice based on this dataset, not a guarantee for other wearers, weeks or populations. Activity states are device-derived rather than clinically verified, and this investigation does not establish a clinical accuracy threshold.

### (b) Sample-size finding

Keeping the baseline population and SRS fixed, SD fell from 18.32146 bpm at n = 1 to 5.69062 at n = 10 and 1.80392 at n = 100. RMSE similarly fell from 18.32148 to 5.69512 to 1.80460 bpm. The larger samples produced narrower distributions of means, rather than guaranteeing that every individual draw was closer. This decreasing-spread pattern held for all three seeds. The n = 100 result is exactly the same result used in experiment A, not a new run with different settings. Increasing n reduces sampling variability here; it cannot recover the 216 unrecorded minutes, correct device measurement error, turn one wearer into a representative population of people, or remove a problematic interaction between row order and a selection rule. The tiny n = 1 bias in this run does not make it reliable: its wide spread dominates its estimation error.

## 5. Challenge

### Hypothesis recorded before the experiment

- Date written: November 10, 2026, 4:22 p.m. America/New_York (21:22 UTC). The unchanged full hypothesis is in evidence/HYPOTHESIS-BEFORE-RUN.md and was committed before investigation runs.
- Method challenged: Systematic sampling with a random start.
- Population change: Reorder a copy of all 9,864 readings into a repeating 72-row heart-rate rank cycle. Sort by bpm, split into 72 contiguous rank groups, and interleave one reading from each group at a time. No values or membership change; this is an artificial order, not chronological time.
- Selection-rule interaction: At n = 137, the interval N/n = 72 matches the cycle. A systematic start selects the same phase of each cycle, so different starts can select different heart-rate rank bands.
- Expected repeated-sampling evidence: Modified systematic SD and RMSE will increase relative to chronological baseline and SRS; exact bias remains effectively zero. The true mean will not change under reordering.
- Alternative: SRS at the same n, because its selection does not use fixed row intervals. Its theoretical sampling distribution is unchanged by reordering, although seeded finite Monte Carlo outputs can differ.
- Contradictory evidence: Modified systematic SD/RMSE do not increase, or remain comparable with SRS. Substantial nonzero exact bias would point to an implementation error rather than confirm the prediction.

### Test settings

n = 137 throughout; cycle period = 72; systematic uses exact enumeration of all 72 starts on each condition; SRS uses 1,000 repetitions on each condition with seed 20261109. Additional checks use 20261110 and 20261111. Each population's mean is recalculated from its own rows. Both means round to 66.41105 bpm; their approximately 2 × 10⁻¹³ difference in raw arithmetic is summation roundoff, not a population change. The modified sequence and original row IDs can be inspected in the app; resetting the condition restores original order. The original CSV stays unchanged.

### (c) Challenge interpretation

The evidence supported the predicted increase in variability. Exact systematic SD and RMSE rose from 1.05733 bpm in the chronological baseline to 18.77925 in the rank-cycle population—about 17.8 times larger—while exact bias remained effectively zero. SRS was far less affected: baseline SD/RMSE were 1.59430/1.59634 bpm and modified SD/RMSE were 1.63940/1.63955 bpm. Across the other seeds, SRS RMSE remained between 1.53825 and 1.63427 for those additional runs; the exact systematic results were unchanged because they enumerate starts rather than simulate them.

This separates lack of bias from reliability: the modified systematic estimates average to the correct mean over all starts but vary widely from one start to another. Matching the cycle to the interval explains the result; unequal sample sizes, altered values and wrong population means do not, because those were controlled or checked. The small SRS differences between orders are consistent with Monte Carlo variability; reordering cannot change its theoretical distribution. The challenge is deliberately constructed and does not demonstrate that actual wearable records have a 72-row cycle. It also shows why a baseline ranking is conditional: systematic sampling was more precise than SRS at n = 137 in chronological order, but much less precise under the constructed order. No revision to the original hypothesis was needed.

## 6. AI use

- Tools used: ChatGPT
- What I asked my agent to do, and what I checked myself: I asked ChatGPT to guide me step by step. I had it check my results as I went and if I didn't know what to do, it prompted me questions so I could figure it out. I asked it to be my tutor throughout the assignment.
- Automated checks my agent reported: My agent reported that all 15 tests passed and the production build passed.
