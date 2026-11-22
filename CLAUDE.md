# CLAUDE.md

This repo is the GitHub profile (`README.md` at the root, keep it unchanged) plus one project: **`accessible-data-dashboard/`**, an accessible B2B/fintech dashboard ("Euro Area Monitor") on real ECB and Eurostat data. The target is WCAG 2.2 AA. Work happens in that folder unless told otherwise.

## Commands (run in `accessible-data-dashboard/`)
- `npm ci` then `npm run dev` (Vite, :5173). For a production build: `npm run build`, then `npx vite preview` (:4173).
- Fast checks: `npx tsc -b` · `npm test` (Vitest, 28 tests) · `npm run contrast` (120 token pairs).
- Slow checks: `npx playwright test` (56 e2e tests; run `npx vite build` first) · `npx lhci autorun` (accessibility must score 100). In the cloud container, set `CHROME_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` for Lighthouse.
- `npm run tokens` regenerates `src/styles/tokens.css` and `tokens.gen.ts` from `packages/tokens/tokens.json`. Both outputs are gitignored, so run it after cloning.

## Where things are
- `src/data/`: snapshot loader, `derive.ts` (filters, data issues, staleness), `synthetic.ts` (seeded edge states), `registry.ts` (countries, colour slots, datasets).
- `src/charts/`: `builders.ts` (line, bar, stacked area, heatmap), `ChartRegion.tsx` (keyboard layer, summaries, tooltips, sonification), `highcharts.ts` (setup, theme, forced colours).
- `src/widgets/ChartWidget.tsx`: every UI state (loading, empty, error, partial, stale, out-of-range). `src/lib/summarize.ts`: deterministic chart summaries, with tests next to it.
- `src/state/`: app state in the URL, saved views, preferences, the live-region announcer.
- `public/data/`: real snapshots, written **only** by `.github/workflows/fetch-data.yml` (the ECB and Eurostat APIs are blocked from the cloud container).
- Docs: `DECISIONS.md` (rationale log, D-0xx; add an entry for every non-obvious choice), `design/SPEC.md`, `docs/`, `research/`.

## Rules
- Never invent research findings, quotes, participants or test results. Personas and jobs-to-be-done are labelled hypotheses, and the result fields in `research/testing/` stay empty until the user supplies real data.
- Synthetic data must always carry the "Synthetic data" badge. Never present it as real.
- Every series needs colour + dash + marker + direct label (areas and bars use patterns). Every chart needs a table alternative, a summary, and keyboard and tooltip support. Status is always icon + text.
- Use tokens, never raw colours. Charts read tokens through `cssVar()`, which maps them to system colours under forced colours.
- Verify ECB and Eurostat series codes against the live APIs (`scripts/probe-sources.mjs` via CI), not from memory. HICP comes from Eurostat `prc_hicp_minr`; the euro area code is EA21.
- Highcharts 13: import from `highcharts/esm/...`. Charts are only re-created when their options signature changes (`HighchartsView`).
- Keep axe at zero violations, and fix bugs instead of disabling rules or tests.

## Status (Nov 2026)
Phases 0–5 are done and merged (PR #4); the code is MIT-licensed. Still open for the user: enable GitHub Pages and re-run the deploy, add a contact email to `docs/ACCESSIBILITY-STATEMENT.md`, then manual screen-reader testing, interviews and usability sessions. Synthesise their notes into `research/` and fill in `docs/CASE-STUDY.md`.
Figma: design file `rKEwC8areZnXnjiouJh22w`, presentation `rFBpQ6azPblpSyJNqZWsnr` (Slides).
