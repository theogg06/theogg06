# Desk research summary

**Status:** Secondary research only. Nothing here comes from our own interviews. Each claim is tied to a public source listed at the end. The "Implications" are hypotheses for the interviews to confirm or reject, not conclusions.

**Prepared:** 2026-10-31 · **Scope:** How analysts, finance managers and compliance officers use dashboards for decisions, and what makes charts usable for people with disabilities.

---

## 1. What a "dashboard" actually is in practice

- Sarikaya et al. analysed 83 dashboards and found the word covers very different artefacts. They proposed a design space with 15 visual and functional aspects and grouped dashboards into clusters by purpose, including strategic decision-making, operational decision-making, static organisational reporting and communication. They also noted that dashboards are now used for communication and learning as well as monitoring. Check the exact cluster names against the paper before quoting them. [S1]
- **Implication (hypothesis):** One dashboard can't serve all three roles in the same way. The analyst needs an *exploratory* view (drilling down, comparing). The finance manager needs a *strategic* one (a decision at a glance). The compliance officer needs a mix of *operational* and *audit* use (is this number correct, and can I prove where it came from?). The information hierarchy (KPIs → trends → details) is meant to cover all three in one reading order.

## 2. How analysts work

- Kandel et al. interviewed 35 analysts from 25 organisations, including finance. They described three analyst archetypes (*hackers*, *scripters*, *application users*). The reported pain points included finding and acquiring data, wrangling and profiling it, and getting work into production. Data quality problems and missing data were recurring themes. [S2]
- Bartram, Correll and Tory found that people who work with data as part of their job, without being professional analysts, often prefer **tables**. They reorganise, annotate and add to them while making sense of data, and the authors argue tables deserve recognition as a visualisation in their own right. [S3]
- **Implication (hypothesis):** The detail table is a primary tool, not a fallback, so it needs sorting, readable units, and a way to export or copy. Every chart's "table alternative" should be good enough for sighted analysts to choose it too.

## 3. Data trust, completeness and timeliness in financial services

- The Basel Committee's **BCBS 239** (January 2013) sets 14 principles for risk data aggregation and risk reporting. They are grouped into governance and infrastructure, risk data aggregation capabilities (including accuracy, completeness and timeliness) and risk reporting practices (including accuracy, clarity and usefulness). Later progress reports said implementation was still incomplete at many banks. [S4]
- The ECB's **Guide on effective risk data aggregation and risk reporting** (final version, May 2024) sets out what ECB Banking Supervision expects in this area. It covers governance, data architecture, data quality and the timeliness of internal risk reporting, and supervisors expect it to be read together with BCBS 239. [S5]
- **Implication (hypothesis):** For compliance and risk users, "Is this complete, current and traceable?" is part of the content, not a side detail. The UI should therefore always show source, retrieval/as-of date, completeness (which series are missing) and staleness, as text and not by colour alone.

## 4. Screen reader users and online charts

- Sharif et al. (ASSETS 2021) ran a qualitative study with 9 screen reader users and a quantitative study with 36 screen reader users and 36 non-screen-reader users. Screen reader users extracted information **61.48% less accurately** and spent **210.96% more time** on online charts. Many charts could not be detected by screen readers at all. Participants suggested tabular and textual representations as improvements. [S6]
- Lundgard and Satyanarayan propose a **four-level model** of what chart descriptions convey: (1) how the chart is built, (2) statistical concepts and relations, (3) perceptual and cognitive phenomena such as trends, and (4) domain-specific insight. In a study with 30 blind and 90 sighted readers, the two groups ranked the usefulness of these levels significantly differently. [S7]
- Zong et al. (EuroVis 2022), co-designed with a blind researcher, describe three dimensions for screen reader chart experiences: **structure**, **navigation** and **description**. They evaluated their prototypes with 13 blind and low-vision readers. [S8]
- **Implication (hypothesis):** Alt text alone isn't enough. Each chart needs:
  - a generated summary covering levels 1–3, leaving domain insight (level 4) to the human, so the summary doesn't make an interpretation the data can't support;
  - a real table;
  - keyboard navigation through data points, from overview to series to point;
  - adjustable verbosity, to be tested in sessions.

## 5. Auditing chart accessibility beyond WCAG

- **Chartability** (Elavsky, Bennett and Moritz, EuroVis 2022) is a set of testable heuristics for visualisation accessibility. It draws on WCAG, research and community guidance, and covers visual, motor, vestibular, neurological and cognitive access. It is meant to complement WCAG, not replace it. [S9]
- **WCAG 2.2** (W3C Recommendation, October 2023) is the conformance baseline. It adds criteria that matter for dashboards, among them 2.4.11 Focus Not Obscured (Minimum) and 2.5.8 Target Size (Minimum). [S10]
- **Implication:** Use WCAG 2.2 AA as the pass/fail bar, and run a Chartability audit on top of it in Phase 3.

## 6. Colour and colour-vision deficiency

- Okabe and Ito's *Color Universal Design* guide recommends choosing colour schemes that people with all common types of colour vision can tell apart. It also recommends not relying on colour alone, for example by adding shapes, line styles and direct labels. Their 8-colour palette is widely used in scientific figures. [S11]
- **Implication:** Start from a CVD-safe categorical palette, but add marker shape, dash pattern, pattern fill and direct labels for every series, so the chart still works in greyscale and in forced-colours mode (WCAG 1.4.1).

## 7. Cognitive accessibility

- The W3C note *Making Content Usable for People with Cognitive and Learning Disabilities* (COGA, 2021) gives objectives and design patterns beyond WCAG conformance. Examples: help users understand what things are and how to use them, help users avoid and correct mistakes, help users focus, and make content clear and predictable. It also recommends involving users with cognitive disabilities in research. [S12]
- **Implication (hypothesis):**
  - Use plain-language captions ("Inflation rose for the third month in a row").
  - Keep component placement consistent.
  - Make saved views easy to recover, and ask for confirmation before destructive actions such as deleting a view.
  - Avoid time-limited interactions and motion that can't be turned off.

## 8. Regulatory context for accessibility in EU financial services

- The **European Accessibility Act**, Directive (EU) 2019/882, covers consumer banking services, among other things. Its requirements have applied since **28 June 2025**, with transitional provisions in Article 32. In practice, EN 301 549 is the harmonised technical reference, and its web requirements track WCAG. [S13]
- **Caveat:** A B2B analytical dashboard used internally is not necessarily in the EAA's scope, because the EAA targets consumer-facing services. We cite it as market context: banks are building accessibility capability, and the staff who use internal tools include disabled people. That isn't a legal claim that this prototype falls under the EAA. Check the current Official Journal text and EN 301 549 version before relying on specific dates or clauses.

---

## Open questions the interviews must answer

1. What decision did they actually make last week, and which number settled it? (Probe for real decisions, not opinions about dashboards.)
2. When data was missing, late or looked wrong, what did they *do* (wait, estimate, escalate, caveat it)? How did they find out?
3. How do they hand findings to someone else (a screenshot, an export, a link, a written note), and what gets lost on the way?
4. For assistive technology users: which workarounds do they currently use for charts (asking a colleague, exporting to Excel, the screen reader's table mode)? How much time do those workarounds cost?
5. Which of these do they actually need visible all the time, and which on demand: source, as-of date, completeness?

## Sources

| ID | Source | Type |
|---|---|---|
| S1 | Sarikaya, A., Correll, M., Bartram, L., Tory, M., Fisher, D. (2019). *What Do We Talk About When We Talk About Dashboards?* IEEE TVCG 25(1). <https://www.tableau.com/research/publications/what-do-we-talk-about-when-we-talk-about-dashboards> | Peer-reviewed study |
| S2 | Kandel, S., Paepcke, A., Hellerstein, J. M., Heer, J. (2012). *Enterprise Data Analysis and Visualization: An Interview Study.* IEEE TVCG 18(12) / VAST 2012. <https://idl.uw.edu/papers/enterprise-analysis-interviews> | Peer-reviewed interview study |
| S3 | Bartram, L., Correll, M., Tory, M. (2021). *Untidy Data: The Unreasonable Effectiveness of Tables.* IEEE VIS 2021. <https://content.ieeevis.org/year/2021/paper_v-full-1224.html> | Peer-reviewed study |
| S4 | Basel Committee on Banking Supervision (2013). *Principles for effective risk data aggregation and risk reporting* (BCBS 239). <https://www.bis.org/publ/bcbs239.pdf>; progress report (2020) <https://www.bis.org/bcbs/publ/d501.pdf> | Regulatory standard |
| S5 | European Central Bank, Banking Supervision (2024). *Guide on effective risk data aggregation and risk reporting.* <https://www.bankingsupervision.europa.eu/> (search "RDARR guide") | Supervisory guide |
| S6 | Sharif, A., Chintalapati, S. S., Wobbrock, J. O., Reinecke, K. (2021). *Understanding Screen-Reader Users' Experiences with Online Data Visualizations.* ASSETS '21. DOI 10.1145/3441852.3471202. <https://faculty.washington.edu/wobbrock/pubs/assets-21.01.pdf> | Peer-reviewed study |
| S7 | Lundgard, A., Satyanarayan, A. (2022). *Accessible Visualization via Natural Language Descriptions: A Four-Level Model of Semantic Content.* IEEE TVCG 28(1). <https://vis.mit.edu/pubs/vis-text-model/> | Peer-reviewed study |
| S8 | Zong, J., Lee, C., Lundgard, A., Jang, J., Hajas, D., Satyanarayan, A. (2022). *Rich Screen Reader Experiences for Accessible Data Visualization.* Computer Graphics Forum 41(3). DOI 10.1111/cgf.14519. <https://vis.mit.edu/pubs/rich-screen-reader-vis-experiences/> | Peer-reviewed study |
| S9 | Elavsky, F., Bennett, C., Moritz, D. (2022). *How accessible is my visualization? Evaluating visualization accessibility with Chartability.* Computer Graphics Forum 41(3). DOI 10.1111/cgf.14522. <https://dig.cmu.edu/publications/2022-chartability.html> | Peer-reviewed heuristics |
| S10 | W3C (2023). *Web Content Accessibility Guidelines (WCAG) 2.2.* <https://www.w3.org/TR/WCAG22/> | Standard |
| S11 | Okabe, M., Ito, K. *Color Universal Design (CUD): How to make figures and presentations that are friendly to colorblind people.* <https://jfly.uni-koeln.de/color/> | Practitioner guide |
| S12 | W3C COGA Task Force (2021). *Making Content Usable for People with Cognitive and Learning Disabilities.* W3C Group Note. <https://www.w3.org/TR/coga-usable/> | W3C guidance |
| S13 | Directive (EU) 2019/882 (European Accessibility Act). <https://eur-lex.europa.eu/eli/dir/2019/882/oj> · ETSI EN 301 549 <https://www.etsi.org/human-factors-accessibility/en-301-549-v3-the-harmonized-european-standard-for-ict-accessibility> | Legislation / standard |

> **Verification note:** The figures quoted from S6 and the study sizes quoted from S1, S2, S7 and S8 were checked against the papers' abstracts and publisher pages on 2026-10-31. Re-check against the full text before quoting them in the case study.
