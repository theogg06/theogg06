# Euro Area Monitor: an accessible data dashboard (B2B / fintech)

A portfolio project showing accessible data visualisation on real **ECB** and **Eurostat** data: KPIs, four chart types, a sortable detail table, a country drill-down, saved views and export. Every chart has redundant encodings, a table alternative, a generated text summary, keyboard navigation, accessible tooltips and forced-colors support. **Target: WCAG 2.2 AA.**

| | |
|---|---|
| **Live prototype** | `https://theogg06.github.io/theogg06/` (after the one-time Pages setup below) |
| **Design** | [Figma file](https://www.figma.com/design/rKEwC8areZnXnjiouJh22w) · [`design/SPEC.md`](design/SPEC.md) · [screenshots](design/screenshots/) |
| **Research** | [`research/`](research/): desk research, interview kit, proto-personas and JTBD (**hypotheses**), usability [testing kit](research/testing/) |
| **Docs** | [Accessibility statement](docs/ACCESSIBILITY-STATEMENT.md) · [Chart accessibility pattern guide](docs/CHART-ACCESSIBILITY-GUIDE.md) · [Case study (skeleton)](docs/CASE-STUDY.md) · [Decisions log](DECISIONS.md) |
| **Status** | Prototype complete; automated tests pass; usability sessions not yet run |
| **Screenshots** | [Light](docs/screenshots/app-overview-light.png) · [Dark](docs/screenshots/app-overview-dark.png) · [High contrast](docs/screenshots/app-overview-high-contrast.png) · [Forced colours](docs/screenshots/app-overview-forced-colors.png) · [320 px](docs/screenshots/app-overview-320.png) · [Drill-down](docs/screenshots/app-drilldown.png) · [Simulated states](docs/screenshots/app-states.png) |

---

## Architecture

```
accessible-data-dashboard/
├─ scripts/
│  ├─ fetch-data.mjs        ECB SDMX + Eurostat JSON-stat → public/data/*.json (runs in CI)
│  ├─ probe-sources.mjs     discovery helper used to verify series codes
│  ├─ build-tokens.mjs      packages/tokens/tokens.json → src/styles/tokens.css (+ .gen.ts)
│  └─ check-contrast.mjs    WCAG contrast check for all token pairs (120)
├─ packages/tokens/         placeholder design tokens: light / dark / high contrast, density
├─ public/data/             cached real snapshots + manifest (source, query, licence, retrievedAt)
├─ src/
│  ├─ data/                 types, typed snapshot loader, derive (filters, issues, staleness),
│  │                        synthetic.ts (seeded edge states), registry (geos, slots, datasets)
│  ├─ state/                URL state, saved views, preferences, live-region announcer, toasts
│  ├─ charts/               Highcharts setup + option builders (line, bar, stacked area, heatmap),
│  │                        ChartRegion (keyboard layer, summaries, tooltips, sonification), KeyList
│  ├─ widgets/              ChartWidget shell (all UI states), KpiCard, DetailTable, table alternatives
│  ├─ components/           React Aria based UI (buttons, toggle, selects, dialogs, toasts, filters)
│  ├─ lib/                  summarize.ts (deterministic summary generator), csv export
│  └─ pages/                Overview, DrillDown
├─ e2e/                     Playwright: axe, keyboard, reflow/zoom
└─ research/, design/, docs/
```

**Stack:** React 19 + TypeScript + Vite. Charts: **Highcharts 13** with the accessibility, pattern-fill, heatmap and sonification modules. UI primitives: **React Aria Components**. Tests: Vitest (unit), Playwright + axe-core (e2e), Lighthouse CI.

**Data flow:** `fetch-data.mjs` runs in GitHub Actions and commits static JSON snapshots. At runtime the app only loads those files from its own origin: no third-party requests, no analytics, no cookies. Simulated states (`?sim.<widget>=<state>`) transform a snapshot into **seeded synthetic data**, which is always labelled "Synthetic data".

**State:** all filters, per-widget chart/table choice and sort order live in the URL, so every view can be shared. Saved views store that query string in `localStorage` under a name. Theme and density are personal settings, stored in `localStorage` only and never put in links.

## Data sources and licences

| Snapshot | Source | Dataset / series | Licence | Retrieved |
|---|---|---|---|---|
| `hicp.json` | Eurostat | `prc_hicp_minr`: HICP all items (COICOP 2018 `TOTAL`), annual rate of change, monthly, EA + 11 countries | CC BY 4.0 | see `public/data/manifest.json` (first fetch 1 Nov 2026) |
| `unemployment.json` | Eurostat | `une_rt_m`: unemployment rate, SA, total, % of labour force, EA21 + 11 countries | CC BY 4.0 | as above |
| `debt.json` | Eurostat | `gov_10q_ggdebt`: general government gross debt, % of GDP, quarterly | CC BY 4.0 | as above |
| `fx.json`, `fx-daily.json` | ECB Data Portal | `EXR`: euro reference rates (monthly average; daily EUR/USD) | ECB: reuse with source acknowledgement | as above |
| `lending.json` | ECB Data Portal | `BSI`: MFI loans to euro area households by purpose (A21 consumer credit, A22 house purchase, A23 other), outstanding € millions | ECB: reuse with source acknowledgement | as above |

Every snapshot stores its exact query `url`, `retrievedAt`, the source's last-update date and its licence. The UI shows them in each widget's "Data notes". Series codes were **verified against the live APIs** with `scripts/probe-sources.mjs` (DECISIONS.md D-041). For example, the ECB ICP HICP series end in Dec 2025 after the COICOP 2018 switch, and the euro area aggregate is EA21 from 2026.

**Synthetic data:** `src/data/synthetic.ts` uses a mulberry32 PRNG with seed `20261031`. It covers missing values, stale data, partial loads, out-of-range values, empty results and errors.

## Licences

- **Code:** your choice (add a `LICENSE` file).
- **Highcharts** is **free for non-commercial use only**. This portfolio prototype qualifies. Any commercial use needs a Highcharts licence ([highcharts.com/license](https://www.highcharts.com/license)). If that matters later, the chart layer is isolated in `src/charts/` so it can be replaced (for example by ECharts plus a custom keyboard layer; see D-002).
- Data: see the table above.

## Run locally

Node 20 or later.

```bash
npm ci
```

```bash
npm run dev
```

`npm run dev` serves on http://localhost:5173. For a production build and preview:

```bash
npm run build
```

```bash
npx vite preview
```

Useful URLs:
- `?page=detail&geo=ES` opens the country drill-down.
- `?sim.inflation=partial&sim.unemployment=error&sim.lending=stale&sim.heatmap=out-of-range` shows simulated states.
- `?t.inflation=table` opens the inflation widget in table view.

The footer also has **Prototype controls**, with a state selector for each widget and the facilitator reset.

## Refresh the data

The dev container used to build this project can't reach the APIs, so fetching runs in CI (`.github/workflows/fetch-data.yml`, D-040). Trigger it from the Actions tab (**Fetch data snapshots → Run workflow**), or run it on any machine with internet access:

```bash
npm run fetch-data
```

## Test

```bash
npm test
```

Unit tests (Vitest): the summary generator, synthetic data, issue detection, slot assignment and URL state.

```bash
npm run contrast
```

WCAG contrast for all 120 token pairs.

```bash
npx tsc -b
```

Typecheck.

```bash
npx playwright test
```

Playwright e2e: axe on every page, state and theme; keyboard flows; reflow and zoom.

```bash
npx lhci autorun
```

Lighthouse: the accessibility score must be 100. Build first (`npm run build`).

CI (`.github/workflows/ci.yml`) runs all of the above on every push that touches this folder, and uploads the Playwright and Lighthouse reports as artifacts.

**Automated tests are not enough.** Run the manual protocol in [`research/testing/09-manual-at-test-protocol.md`](research/testing/09-manual-at-test-protocol.md) with NVDA, JAWS and VoiceOver.

## Deploy

**GitHub Pages (recommended).** The workflow is `.github/workflows/pages.yml`.
1. One time: repository **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Merge to `main`, or run **Deploy prototype to GitHub Pages** from the Actions tab.
3. The URL is `https://theogg06.github.io/theogg06/`. The build uses `base: './'`, so it works under any sub-path.

**Vercel (alternative):** import the repository, set the root directory to `accessible-data-dashboard`, set the build command to `npm run build`, and set the output to `dist`.
