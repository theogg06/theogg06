# Proto-personas

> ⚠️ **Hypothesis, to be validated by interviews.**
> These personas are built from desk research (`01-desk-research.md`) and the project brief. **No real people were interviewed to create them.** The names are invented, and nothing here is a finding, a quote or a statistic. Each claim carries a validation question. After the interviews, every row gets marked ✅ confirmed, ✏️ revised or ❌ rejected, with evidence IDs from the affinity map.

**Design principle:** Accessibility needs are spread across all three personas instead of being given to a separate "disabled user" persona. Disability is one attribute of an expert professional, not their identity or their main storyline. Situational and temporary limitations (a small laptop on a train, a migraine, presenting on a washed-out projector) apply to everyone.

---

## P-A · Mara, macro-financial analyst

| | |
|---|---|
| **Role** | Economic analyst in a bank's research or treasury team. Produces a monthly note on euro area inflation and lending conditions. |
| **Goals** | Spot turning points early. Explain *why* a series moved. Give colleagues a defensible number with its context. |
| **Decisions she makes or supports** | Whether a movement is noise or signal. Which countries to flag as diverging from the euro area. What goes into the monthly note and with what caveats. |
| **Data trust concerns** | Revisions (is this the first release or a revised one?), series breaks, mixing seasonally adjusted and unadjusted series by accident, and silent gaps when one country reports late. |
| **Tools** | Excel, Python or R notebooks, the ECB Data Portal and Eurostat directly, and a BI dashboard from IT that she trusts less than her own scripts. *(Matches the "scripter" archetype in Kandel et al. [S2]; still a hypothesis.)* |
| **Accessibility considerations** | Uses keyboard shortcuts heavily for speed. Often works at 150–200% browser zoom on a laptop at the end of long days. Relies on tables to check exact values [S3]. Needs: tables that can be copied cleanly, keyboard-reachable everything, layouts that reflow at high zoom. |
| **What would make her abandon the dashboard** | She can't see which vintage or retrieval date she's looking at, or she can't get the exact numbers out. |

**Validation questions:** Do analysts actually use dashboards for exploring, or only for checking what their scripts produce? How do they handle revisions? Is high zoom common or my assumption?

---

## P-B · Daniel, finance manager

| | |
|---|---|
| **Role** | Head of financial planning in a mid-size corporate or fintech. Reports to the CFO. Uses macro indicators (inflation, rates, FX) as inputs to budgets and pricing. |
| **Goals** | Decide quickly and confidently. Explain the decision to non-specialists. Avoid surprises in front of the board. |
| **Decisions he makes** | Whether to adjust the cost-inflation assumption in the forecast. Whether FX moves justify hedging or repricing. Whether to escalate something to the CFO this month or wait. |
| **Data trust concerns** | "Is this the latest?" He needs a plain-language status (current, provisional, stale). He worries about presenting a number that's later corrected. |
| **Tools** | PowerPoint, Excel, emailed PDFs, and a dashboard link from his analysts. Often on a phone between meetings. |
| **Accessibility considerations** | **Has low vision (an assumption: a progressive condition, managed with the OS magnifier and larger text).** He's an expert at his job and has adapted his workflow. He uses the magnifier at 200–300% on a laptop and the OS text-size setting on his phone. Low-contrast greys, information conveyed by colour alone, tooltips that disappear when the mouse moves, and content that shifts under the magnifier all cost him time. Needs: strong contrast, reflow at 320 CSS px, persistent tooltips (1.4.13), status in text, KPI cards readable at a glance with no hover needed. |
| **What would make him abandon the dashboard** | He has to hover or hunt to find the one number he needs, or the share link opens something different from what he saw. |

**Validation questions:** Do finance managers open dashboards themselves, or only receive screenshots? How do they share them, by link or as a copied image? What does "at a glance" mean for them: one number, or a number plus its comparison?

---

## P-C · Ioana, compliance and regulatory reporting officer

| | |
|---|---|
| **Role** | Senior officer in a bank's regulatory reporting or second-line risk function. Checks figures before they go into internal risk reports or supervisory submissions. |
| **Goals** | Make sure every reported figure is complete, current and traceable to a source. Document exceptions. Never sign off on something she can't evidence. |
| **Decisions she makes** | Whether a dataset is fit to report or needs a caveat. Whether to escalate a data-quality issue. Whether a threshold breach is real or caused by missing data. |
| **Data trust concerns** | Completeness (which series or countries are missing?), timeliness (when was this retrieved?), lineage (which source, which series key?), and an audit trail of what she saw and when. *(Reflects BCBS 239 and ECB RDARR expectations [S4, S5].)* |
| **Tools** | Regulatory reporting software, Excel, document management, and dashboards as a first-pass check. Exports evidence to attach to files. |
| **Accessibility considerations** | **Is blind and uses a screen reader (assumed: JAWS at work, NVDA at home) with a braille display for checking exact figures.** She's a highly proficient AT user who navigates by headings, landmarks and table commands. Charts are currently a dead end for her unless they have a real table: images with vague alt text, or SVGs that read as "graphic". This matches the problems documented by Sharif et al. [S6]. Needs: semantic tables with captions, headers and units; a text summary she can trust (and that is *honest about missing data*); keyboard navigation through data points; status changes (loading done, filter applied, error) announced without moving her focus; a source and as-of date reachable in one keystroke. |
| **What would make her abandon the dashboard** | A summary that says "inflation rose" while three countries' data are silently missing, or a focus trap in a dialog. |

**Validation questions:** Are compliance staff who use screen readers checking figures in dashboards at all today, or always exporting to Excel? Is a braille display used for numbers? Which matters more: exploring data points, or a reliable summary plus table? *(Zong et al. [S8] suggest both; we need to check.)*

---

## Cross-persona assumption matrix

| Assumption | Mara | Daniel | Ioana | How we'll test it |
|---|---|---|---|---|
| Source and as-of date need to be visible on every widget | Medium | Low | **High** | Interview Q13–14, usability task 3 |
| Exact values matter more than shapes | **High** | Low | **High** | Interview Q8 |
| Uses a phone for dashboards | Low | **High** | Low | Interview Q6, Q16 |
| Shares via link rather than screenshot | Medium | ? | Low | Interview Q16 |
| Uses AT or zoom daily | Zoom (situational) | Magnifier | Screen reader + braille | Screener Q6 |

## Changes after interviews

*(Fill in after synthesis.)*

| Persona | Field | Original hypothesis | Evidence (affinity ids) | Status | Revised text |
|---|---|---|---|---|---|
| | | | | ✅ / ✏️ / ❌ | |
