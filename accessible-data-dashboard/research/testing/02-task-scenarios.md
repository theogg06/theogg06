# Task scenarios (decision-oriented)

Each task asks for a **decision**, not a click path. Read it aloud and paste it into the chat on request (some participants prefer to read with their own AT). Don't name UI elements. `BASE` = the prototype URL, e.g. `https://theogg06.github.io/theogg06/`.

> Values in real-data tasks change whenever the snapshots are refreshed. **Before each round of sessions**, open each task link and write the expected answer in the "Expected (fill in before sessions)" field. Don't reuse expected answers from a different snapshot date.

---

### T1 · Divergence check (JTBD J1 · persona Mara) — always first
**Link:** `BASE`
> "You're preparing this month's inflation note. Decide whether inflation in **Spain** is moving away from the euro area average, and whether you would flag Spain in the note. Tell me what you'd write in one sentence."

- **Success:** states Spain's latest rate vs the euro area, says whether the gap is widening or narrowing, and makes a flag/no-flag decision with a reason.
- **Expected (fill in before sessions):** Spain ___ % vs EA ___ % (period ___); gap trend ___
- **Probe:** "How sure are you? What would make you more sure?"

### T2 · Answer the CFO (J4, J5 · Daniel)
**Link:** `BASE`
> "Your CFO messages you: 'Has euro area inflation gone up or down since last month, and is it above the ECB's target?' Give the answer you'd send back."

- **Success:** gives the correct direction and size of the change, and the relation to 2%, within about 2 minutes.
- **Expected:** ___

### T3 · Fit to report? (J7, J9 · Ioana) — partial data
**Link:** `BASE?sim.inflation=partial`
> "Before a report goes out, decide whether the inflation comparison chart can be used **as is**, or needs a caveat. If it needs one, what would the caveat say?"

- **Success:** notices that some series are missing or end early, names which ones, and proposes a caveat. Notices that this is synthetic test data.
- **Scoring note:** a confident "use as is" decision is a severity-4 finding.

### T4 · Safe to present? (J6 · Daniel) — stale data
**Link:** `BASE?sim.lending=stale`
> "You want to quote the household lending figure in today's briefing. Decide whether that's safe."

- **Success:** notices the stale badge or note, explains roughly how old the data is, and decides to caveat it or check the source.

### T5 · Something looks wrong (J2 · Mara) — out-of-range
**Link:** `BASE?sim.heatmap=out-of-range&sim.inflation=out-of-range`
> "One of the inflation numbers looks odd. Find it and decide whether you'd trust it."

- **Success:** finds the flagged value (badge, note or off-scale marker), states the exact value from the table or the note, and decides not to trust it without checking the source.

### T6 · It's not loading (J10) — error
**Link:** `BASE?sim.unemployment=error`
> "You need the unemployment comparison. Get the information, or decide what to do instead."

- **Success:** understands the cause from the error message and uses Retry. With the simulation still active, Retry fails again; the participant then decides on a workaround (wait, use another source). Notes whether they understood that **no old data is shown**.

### T7 · Trace a number (J8 · Ioana)
**Link:** `BASE`
> "A colleague challenges the euro area unemployment figure on the dashboard. Show where it comes from and when it was retrieved."

- **Success:** finds the source dataset (Eurostat `une_rt_m`), the retrieval date and, optionally, the query or series key in "Data notes".

### T8 · Save and share (J3, J11)
**Link:** `BASE`
> "Set the dashboard to show Germany, France and the Netherlands from January 2024. Save it so you can come back to it next month, and get a link you could send a colleague."

- **Success:** filters set, view saved under a name, link copied. Bonus: can say what the link contains.

### T9 · AT-focused (J9) — chart, not table *(screen reader and keyboard sessions)*
**Link:** `BASE?page=detail&geo=ES`
> "Using the chart itself, find the month in the period shown when Spain's inflation was highest, and how that compares with the euro area in the same month."

- **Success:** navigates the chart points (arrows/Home/End) or uses the S summary, and reports the month and both values. Using the table afterwards to confirm counts as success; record the path taken.
- **Probe:** "How did that compare with how you normally deal with charts?"

---

## Order (rotate T2–T8 after T1)

| Session | Order |
|---|---|
| S1 | T1, T2, T3, T4, T7, T8 |
| S2 | T1, T3, T8, T2, T5, T6 |
| S3 | T1, T4, T7, T9, T3, T6 |
| S4 | T1, T5, T9, T8, T4, T2 |
| S5 | T1, T6, T2, T3, T8, T7 |

Not every task is run in every session (60-minute limit). AT sessions include T9.
