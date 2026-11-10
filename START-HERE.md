# Capitol Training Timeline — Completed investigation

Your app is in this folder. Your original download is preserved. The working `DECISIONS.md` contains the results, findings, and your supplied section 6 wording.

## Run on Windows

1. Open this folder in File Explorer. Right-click its background and choose **Show more options → Open Git Bash here**. Git Bash is included with your installed Git.
2. Run:

   ```bash
   bash run_app.sh
   ```

3. Open **http://127.0.0.1:5173/** in your browser. Leave the terminal open. Stop the app with **Ctrl+C** in that terminal.

The first launch installs the pinned React and Vite dependencies if needed. Node.js 20.19+ or 22.12+ is required; this computer has Node 24.

If Git Bash is unavailable, open PowerShell in this folder and run `npm run dev` instead.

## Check the running app

- Full week shows all 9,864 recorded minutes, with n selected minutes in gold. Default n is 100.
- Switch between Simple random, Systematic, and Stratified tabs. Each draws using the applied sample size and seed and explains its selection rule.
- Edit sample size or seed: an unapplied-edits notice appears. Press **Apply settings / Draw sample** to use the new values.
- Systematic shows its integer or fractional interval and seeded start. These are row intervals, not necessarily equal time intervals.
- Stratified shows activity-state population counts, weights, sample allocations, and group sample means. Its estimate is population-weighted, not the pooled sample mean.
- Set n to 1 or 2 and apply it: simple random and systematic still work. Stratified explains why it needs at least 3 rows, with no stale sample or estimate. Change n and apply it to continue.
- Invalid sizes (empty, fractional, below 1, above 9,864) and empty seeds show an error without replacing the current applied settings.
- Choose a day to inspect readings and shaded missing-time intervals. The selected rows table follows that view.
- Zoom does not change the population mean, sample estimate, applied settings, or full sample.
- Draw again with the same method, sample size and seed to reproduce the same selection. Different seeds can produce the same sample; they do not guarantee a different one.
- Single samples remain separate from repeated-sampling experiments.

## Reproduce the recorded investigation

Scroll to **The Proving Grounds**, or use **Stages 4 & 5 / Investigate** at the top.

1. Set experiment seed to **20261109** and repetitions to **1,000**.
2. In **A · Compare methods**, click **Run experiments A & B**. Results compare the three methods at n = 100.
3. Switch to **B · Compare sample sizes**. SRS n = 1, 10 and 100 are shown; n = 100 is reused exactly from A.
4. In **C · Challenge a method**, keep rank-cycle order, sample size **137**, and period **72**, then click **Run four challenge conditions**. Systematic uses all 72 starts exactly; SRS uses 1,000 repetitions.
5. Change the seed or challenge settings and run again to update results. Until then, labels identify the previous settings. Reset order to **Original chronological order** to remove the artificial reordering.

Recorded values and screenshots are in `evidence/`. Full source and the launch script belong in the submission ZIP; dependencies can be reinstalled.

## Verification commands

`npm test` checks calculations and data invariants. `npm run build` produces the static app in `dist/`.

Data source and licence are displayed in the app and documented in `data/README.md`. The supplied data and your decision log have not been edited by the agent.
