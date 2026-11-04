# Jobs to be done (hypotheses)

> ⚠️ **Hypothesis, to be validated by interviews.** These jobs come from desk research and the proto-personas. None of them has been observed yet. Each one names the decision it supports, so the interviews (critical-incident section) and the usability tasks (`testing/`) can confirm, revise or reject it.

Format: **When** [situation], **I want to** [motivation], **so I can** [expected outcome].

| ID | Persona | Job statement | Decision supported | Dashboard implication | Validated? |
|---|---|---|---|---|---|
| J1 | Mara | **When** the monthly HICP flash estimate is released, **I want to** see which countries moved away from the euro area average, **so I can** decide which ones to flag in my note. | Which countries to flag as diverging | Country-vs-EA comparison (bar + line), divergence sorted in the table | ☐ |
| J2 | Mara | **When** a series jumps unexpectedly, **I want to** check whether it's a data issue (gap, revision, break) before I interpret it, **so I can** avoid reporting noise as a signal. | Signal vs noise | Missing/out-of-range markers, partial-data badge, out-of-range state | ☐ |
| J3 | Mara | **When** I've found something worth sharing, **I want to** send a link that opens exactly the view I'm seeing, **so I can** have colleagues discuss the same numbers. | What to share and with whom | Saved views encoded in the URL, a "copy link" action | ☐ |
| J4 | Daniel | **When** I'm preparing the quarterly forecast, **I want to** see the latest inflation and FX numbers with their direction and comparison in one glance, **so I can** decide whether to change our cost assumptions. | Adjust forecast assumptions or not | KPI cards: value, change, direction icon plus text, period | ☐ |
| J5 | Daniel | **When** I open the dashboard between meetings on my phone or under magnification, **I want to** read the key numbers without zooming around or hovering, **so I can** answer the CFO's question on the spot. | Answer now vs get back later | Reflow at 320 px, KPI-first order, no hover-only info | ☐ |
| J6 | Daniel | **When** a number on the dashboard changes after I've presented it, **I want to** know it was provisional or revised, **so I can** decide whether to correct the record. | Whether to issue a correction | Provisional/stale badges, retrieval date, data-status text | ☐ |
| J7 | Ioana | **When** I'm checking figures before a report goes out, **I want to** know immediately which series or countries are missing or stale, **so I can** decide whether the data is fit to report or needs a caveat. | Fit to report vs caveat or escalate | Partial-data state naming the missing series; stale state with age | ☐ |
| J8 | Ioana | **When** someone challenges a figure, **I want to** trace it to its source series and retrieval date, **so I can** defend it or escalate the issue. | Defend vs escalate | Source, series key and retrieval date in every widget footer and in the export | ☐ |
| J9 | Ioana | **When** I use a screen reader to review a chart, **I want to** get a trustworthy summary first and then the exact values, **so I can** reach the same conclusion as a sighted colleague in a comparable time. | Same as J7 / J8 | Generated summary (honest about gaps), table toggle, keyboard data-point navigation | ☐ |
| J10 | All | **When** a widget fails to load, **I want to** understand why and what I can do, **so I can** decide whether to retry, use another source or wait. | Retry / workaround / wait | Error state with cause, retry action, status announced | ☐ |
| J11 | All | **When** I return to the dashboard each month, **I want to** reopen my usual filters in one step, **so I can** spend my time on the decision, not on setup. | (Efficiency for all of the above) | Saved views: create, name, apply, rename, delete | ☐ |

## Job → feature traceability

| Feature (Phase 1–3) | Jobs |
|---|---|
| KPI cards with direction icon and text | J4, J5 |
| Line time series (country vs EA) | J1, J2 |
| Bar comparison | J1 |
| Stacked area (composition, e.g. lending by purpose) | J4 |
| Scatter / heatmap (e.g. unemployment vs inflation) | J1, J2 |
| Detail table (sortable) | J1, J8, J9 |
| Table alternative per chart | J9 |
| Generated text summary | J9, J7 |
| Partial / stale / error / out-of-range states | J2, J6, J7, J10 |
| Source and retrieval date per widget | J6, J8 |
| Saved views and URL state | J3, J11 |
| Export (CSV with metadata) | J3, J8 |

## Post-interview revision log

| ID | Change | Evidence (affinity ids, # participants) | Date |
|---|---|---|---|
| | | | |
