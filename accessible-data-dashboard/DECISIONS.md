# Decisions log

A short rationale for every non-obvious choice. Newest at the bottom of each phase. Format: **Decision**, then *why*, then alternatives considered.

## Setup

**D-001 · The project lives in `accessible-data-dashboard/` inside `theogg06/theogg06`.**
*Why:* This session can only push to this repository, and the root README is the GitHub profile page, so a subfolder keeps the profile intact. *Alternative:* a dedicated repository. The folder can be moved later with `git filter-repo --subdirectory-filter` without losing history.

**D-002 · Charting library: Highcharts (with the accessibility, pattern-fill and sonification modules).**
*Why:* It has the most complete built-in screen reader and keyboard support available: point-by-point keyboard navigation, screen reader region descriptions, an accessible data table, pattern fills, dash styles, marker symbols, and sonification for the stretch goal. Building the equivalent on ECharts would take significant custom work and be less battle-tested. *Licence:* Highcharts is free for non-commercial use only, which covers a personal portfolio. Commercial use requires a paid licence. This is documented in the README. *Alternative:* ECharts (Apache-2.0) with a custom keyboard layer, chosen by user decision on 2026-10-31.

**D-003 · Design tokens: create a minimal placeholder set (light, dark, high-contrast).**
*Why:* No `packages/tokens` exists in this repository, and the user chose to create placeholders. Tokens are written in a format that can be swapped for the Accessible Design System's tokens later. They're mirrored as Figma variables and marked **placeholder**.

**D-004 · Figma file is created in the user's drafts on their only available plan.**
*Why:* User decision on 2026-10-31. The file can be moved to a personal team later.

**D-005 · Real data is fetched by a build-time script and cached as committed JSON snapshots.**
*Why:* The brief calls for build-time fetching. Snapshots make the prototype deterministic for testing and usable offline. *Blocker at setup:* the container's network policy denies `data-api.ecb.europa.eu` and `ec.europa.eu`. The user will allowlist them. Until then, no "real" snapshot is fabricated.

## Phase 0: Research

**D-010 · Personas spread accessibility needs across all three roles. There's no separate "accessibility persona".**
*Why:* A separate disabled persona tends to become a checklist item that's easy to ignore. Making disability one attribute of an expert professional (low vision in the finance manager, a screen reader and braille in the compliance officer, situational high zoom in the analyst) keeps those needs in every design decision. It also avoids defining someone by their impairment.

**D-011 · Interview guide is decision-centred (critical incident technique), with no prototype shown.**
*Why:* Showing a prototype in discovery anchors people on its UI. Asking about a real decision from last week gets real behaviour, workarounds and trust checks instead of opinions about charts.

**D-012 · Affinity map has a CSV form as well as a whiteboard form.**
*Why:* Whiteboard tools are hard to use with a screen reader. A CSV can be sorted and filtered with any AT, so synthesis can include AT-using collaborators. On the whiteboard, sticky types are coded by text prefix as well as colour (1.4.1).

**D-013 · Consent uses GDPR Art. 6(1)(a) consent, plus Art. 9(2)(a) explicit consent for any disability or AT information.**
*Why:* Information about assistive technology use can reveal health data, which is a special category. The form asks about tools, never conditions, and gets explicit consent for recording it. The data minimisation choices: 30-day recording deletion, contact details kept separately.

**D-014 · Desk research cites only sources that were checked during this session. Figures are quoted only where they appear in the source's abstract.**
*Why:* The rule against fabrication. Anything not checked against full text is flagged for re-checking before it goes into the case study.

## Phase 1: Design

**D-020 · Figma file:** [Accessible Data Dashboard](https://www.figma.com/design/rKEwC8areZnXnjiouJh22w). It has 9 pages; the spec mirrors them in `design/SPEC.md`.
*Why:* Figma is where the design is reviewed, and the spec in the repo is what the code is built against. Screenshots are in `design/screenshots/`, because Figma asset URLs are blocked by the container proxy.

**D-021 · Categorical palette: a custom 6-slot set whose order was picked by enumeration, not a stock palette.**
*Why:* WCAG 1.4.11 needs every series to reach ≥ 3:1 against the surface, which rules out several Okabe–Ito and dataviz-default slots in light mode. Candidate hues were darkened to ≥ 4.6:1, and every ordering of 6 from a pool of 8 was checked with the dataviz skill's validator, in light and dark. 48 orderings passed adjacent CVD ΔE ≥ 8 with all-pairs separation for the first 3 slots, and blue → ochre → magenta → green → violet → orange was chosen. Worst adjacent CVD ΔE is 10.0 / 10.1.

**D-022 · Colour is treated as the weakest identity channel.**
*Why:* In greyscale all six slots collapse to roughly the same grey, and under protanopia slots 2, 4 and 6 converge. So every series also gets a dash pattern, marker shape, direct label and, for areas and bars, a pattern fill. The Figma file shows the line chart re-rendered under each simulation as evidence.

**D-023 · The euro area reference series is visually heaviest (3px solid, circle marker, slot 1), and each country keeps a fixed slot.**
*Why:* JTBD J1 is about divergence from the euro area, so the reference must be easy to find. Fixed slots mean that filtering countries never recolours the ones that remain.

**D-024 · Heatmap prints the value in every cell.**
*Why:* Sequential ramps are hard to read precisely and fail 1.4.1 on their own. Printing the value makes colour supplementary. Text colour is chosen per bin for ≥ 4.5:1 (tokens `chart/seq-n-text`).

**D-025 · Out-of-range values are flagged at the plot edge without rescaling the axis by default.**
*Why:* Rescaling for one spike would flatten every other series. The value is shown exactly in a marker label, the table and the summary, and the user can rescale if they choose.

**D-026 · Errors never fall back silently to old data.**
*Why:* JTBD J6 and J7 are about trust. Showing an older snapshot is offered as an explicit choice ("Use snapshot from 14 Oct 2026") and is labelled when used.

**D-027 · Chart region = one tab stop with roving focus inside.**
*Why:* A chart can hold 165 points, and tabbing through them would be unusable. Arrow, Home and End keys match the WAI-ARIA grid and listbox mental model. Single-key shortcuts (S, T, ?) only work while focus is inside the chart, which satisfies 2.1.4.

**D-028 · Breakpoints use container CSS px, so zoom and small screens share layouts.**
*Why:* 1280 px at 200% zoom is 640 CSS px, and at 400% it is 320 CSS px. Designing 320 and 640 therefore covers both 1.4.10 reflow and 1.4.4 resize. The data table is the only element allowed to scroll horizontally, inside a labelled, focusable region.

**D-029 · Theme and density are not part of shared URLs.**
*Why:* They are personal accessibility settings. A link sent by a high-contrast user should not force high contrast on the recipient, and the reverse also holds.

**D-030 · Delete confirmation gives initial focus to the safe action ("Keep view"), and Undo stays until dismissed or for ≥ 10 s.**
*Why:* This guards against accidental activation by keyboard or switch users, and against timing limits (2.2.1).

**D-031 · Hatching in Figma uses boolean-intersected outlines rather than masks.**
*Why:* Figma's Plugin API can't set pattern paints, and masked hatch instances leaked outside their shapes when rendered. Intersected geometry renders reliably. In code, the Highcharts pattern-fill module does this natively.

**D-032 · Placeholder font is Inter.**
*Why:* It has tabular figures, distinguishable glyphs and wide availability. It will be swapped if the Accessible Design System specifies another family.

## Phase 2: Prototype

**D-040 · Real data comes from a GitHub Actions workflow, not from the dev container.**
*Why:* The container's proxy blocks both APIs (D-005). `.github/workflows/fetch-data.yml` runs `scripts/fetch-data.mjs` on GitHub's runners and commits the snapshots to `public/data/`. It can be triggered manually or by changing the fetch script.

**D-041 · Series codes were chosen from evidence, using `scripts/probe-sources.mjs`, not from memory.** The probe showed:
- The ECB ICP HICP series stop at Dec 2025, after the 2026 move to COICOP 2018. HICP therefore comes from Eurostat `prc_hicp_minr` (`coicop18=TOTAL`, `unit=RCH_A`).
- The euro area aggregate is now **EA21**, after Bulgaria joined in 2026. The fetcher tries EA21, then EA20, then EA.
- Household lending by purpose is ECB BSI `BS_ITEM` A21, A22 and A23 for sector 2250, not sector sub-codes.

**D-042 · Stable colour slots per country.** Each country has a preferred slot. If a slot is already taken, the country gets the next free one in canonical order (`assignSlots`). Removing a country never changes the colour of a country that kept its preferred slot. Charts show EA + up to 5 countries (the 6 encoding slots), and the table shows all of them.

**D-043 · All app state lives in the URL query string; personal preferences live in localStorage.** Saved views store the same query string under a name. `sim.*` parameters (simulated states) are left out of shared links and saved views.

**D-044 · Simulated states transform the real snapshot and mark it synthetic.** Values are regenerated from a seeded PRNG (mulberry32, seed 20261031), so synthetic numbers are never mistaken for real ones, and the data keeps its real shape. Simulated issues target series that are visible with the default filters.

**D-045 · Charts are re-created only when their content changes.** The option object is compared by a JSON signature, with function bodies compared by their source. Re-creating charts on every render restarted the animations, which first showed up as half-drawn charts in screenshots.

**D-046 · Narrow containers (< 520px) switch chart variants.** Line and area charts move their end labels into a key list below the chart, with dash and marker samples. The heatmap becomes a table, because 12 columns at 256px can't hold readable values.

**D-047 · React Aria Components are the base for the interactive components.** Used for buttons, toggles, selects, checkbox and radio groups, dialogs, menus and tooltips; each is a candidate for the design system. The detail table is a native `<table>` with `<button>` elements in the `<th>` cells and `aria-sort`, which gives full control over the semantics.

**D-048 · Staleness is computed against the snapshot's retrieval date, not "now".** This keeps the result deterministic for tests and honest about what the snapshot knew. The threshold is the publication lag plus one period plus 10 days.
