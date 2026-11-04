# Case study: Euro Area Monitor, an accessible data dashboard

> **Skeleton.** Sections marked 🟨 need real research findings or test results. Don't fill them with assumptions. Everything else is drawn from the project's decisions log and specs and can be edited.

## 1. Overview
- **Role:** [your role] · **Timeline:** [dates] · **Tools:** Figma, React + TypeScript, Highcharts, React Aria, Playwright, axe-core, Lighthouse
- **One-line summary:** A B2B/fintech dashboard on real ECB and Eurostat data, designed so that analysts, finance managers and compliance officers, including screen reader and magnifier users, can reach the same decisions with the same confidence.
- **Hero image:** `docs/screenshots/app-overview-light.png` (live prototype on real data, 1 Nov 2026). Themes: `app-overview-dark.png`, `app-overview-high-contrast.png`, `app-overview-forced-colors.png`; reflow: `app-overview-320.png`; states: `app-states.png`

## 2. Problem
- Dashboards in finance often hide data-quality problems and lock exact values inside charts.
- Desk research: screen reader users extracted information from online charts 61.48% less accurately and took 210.96% longer than other users (Sharif et al., ASSETS 2021). See `research/01-desk-research.md` for all sources.
- 🟨 **What participants told us** (from interviews, quotes with participant IDs).

## 3. Research
- **Method:** decision-focused critical-incident interviews (`research/02-interview-guide.md`), n = 🟨, of whom 🟨 used assistive technology.
- **Proto-personas → validated personas:** 🟨 for each persona row, what was confirmed, revised or rejected (`research/06`).
- **Jobs to be done:** 🟨 which hypotheses held (`research/07`), with the evidence.
- 🟨 Affinity map photo or table; top 3–5 insights with participant counts.

## 4. Design decisions (with rationale)
Use DECISIONS.md. Suggested highlights:
1. **Information hierarchy:** KPIs → trends → details, with DOM order = visual order (`design/SPEC.md` §1).
2. **Colour as the weakest channel:** an enumerated, CVD-validated palette plus dash, marker, pattern and direct labels (D-021, D-022). Show the greyscale and CVD simulation board (`design/screenshots/05-chart-specs-cvd.png`).
3. **Trust signals as content:** partial, stale, out-of-range, provisional and synthetic states as text + icon badges, with summaries that always state missing data (D-024 – D-026).
4. **Keyboard model for charts:** one tab stop, arrows plus custom keys (D-027, D-051).
5. **Forced colours:** why the library default failed and how system colours fixed it (D-050). Include the before/after screenshots below.
6. **Shareable state:** views in the URL; personal display settings kept out of links (D-029, D-043).

## 5. Before → after
| Topic | Before | After | Evidence |
|---|---|---|---|
| Forced-colors heatmap | Values invisible (white block) with Highcharts' auto high-contrast theme | Values and grid visible in system colours | After: `docs/screenshots/app-overview-forced-colors.png`. Before: reproduce by setting `highContrastMode: 'auto'` in `src/charts/highcharts.ts` |
| Narrow screens | End labels truncated, heatmap clipped | Key list below the chart; heatmap as a table under 520 px | `design/screenshots/06-responsive-320.png` + live prototype |
| Undo after deleting a view | Undo toast behind an inert modal | Manager closes; Undo reachable and persistent | `e2e/keyboard.spec.ts` |
| HICP data | ECB ICP series stopped at Dec 2025 | Eurostat `prc_hicp_minr` (COICOP 2018), verified by probe | D-041 |
| 🟨 Usability findings | 🟨 | 🟨 | 🟨 observation sheets |

## 6. Accessibility testing
- **Automated** (reproducible with `npm test`, `npx playwright test` and `npx lhci autorun`): axe 0 violations across every page, state and theme; keyboard, reflow, zoom, text-spacing and target-size tests pass; Lighthouse accessibility 100; 120/120 contrast pairs.
- 🟨 **Manual AT testing:** results table from `research/testing/09-manual-at-test-protocol.md` (NVDA, JAWS, VoiceOver).
- 🟨 **Usability sessions:** task success, SEQ and SUS (indicative, n = 5), plus top findings and what changed (`research/testing/08`).

## 7. Outcome
- 🟨 What changed after testing; remaining issues and their priority.
- Prototype: [live URL] · Repo: [link] · Figma: [link]

## 8. Lessons learned
- 🟨 Your reflections. Prompts:
  - What did the AT participants find that the automated tests missed?
  - Which hypothesis was most wrong?
  - What would you do differently in a production design system?
- Engineering notes to keep:
  - Verify source codes against live APIs, not memory (D-041).
  - Test forced colours early: library defaults can hide data.
  - Treat the table view as a first-class product feature, not a fallback.

## 9. Credits and data
ECB Data Portal (reuse with acknowledgement), Eurostat (CC BY 4.0). Highcharts is used under its non-commercial licence.
