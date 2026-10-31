# Phase 1 design spec

**Figma:** [Accessible Data Dashboard](https://www.figma.com/design/rKEwC8areZnXnjiouJh22w) · **Status:** awaiting design approval · **Date:** 2026-10-31

> All numbers in the mock-ups are **illustrative design data**, not ECB or Eurostat values. The prototype will use cached real snapshots plus clearly labelled synthetic edge states. Personas and JTBD references point to **hypotheses** (`research/06`, `research/07`).

| Figma page | What it holds | Screenshot |
|---|---|---|
| 00 Cover | Index, status, data caveat | — |
| 01 Foundations | Placeholder tokens (Light / Dark / High contrast), type scale, space, density | [png](screenshots/01-foundations.png) |
| 02 Information hierarchy | One-page annotated wireframe, reading order, rationale | [png](screenshots/02-information-hierarchy.png) |
| 03 Screens | Overview (light, dark, HC), drill-down, saved views / share / export flows | [light](screenshots/03-overview-light.png) · [dark](screenshots/03-overview-dark.png) · [HC](screenshots/03-overview-high-contrast.png) · [drill-down](screenshots/03-drilldown.png) · [flows](screenshots/03-flows-saved-views-export.png) |
| 04 UI states | 7 states × chart, KPI and table | [png](screenshots/04-ui-states.png) · [detail](screenshots/04-ui-states-partial-detail.png) |
| 05 Chart specs | Encodings, CVD and greyscale simulations, per-chart specs, table alternative, keyboard map, tooltip | [png](screenshots/05-chart-specs.png) · [CVD](screenshots/05-chart-specs-cvd.png) |
| 06 Responsive & zoom | 320 px (= 400%), 640 px (= 200%), rules | [png](screenshots/06-responsive.png) · [320](screenshots/06-responsive-320.png) |
| 07 Accessibility annotations | Landmarks, headings, focus order, live regions, keyboard map, focus style | [png](screenshots/07-annotations.png) |
| 08 Components | Icons, button, badge, KPI card, fields, view toggle, tooltip, skip link, chart components | — |

---

## 1. Information hierarchy

**Reading order = DOM order = visual order.** It runs app bar → page title and actions → filters → **(1) KPIs** → **(2) Trends** → **(3) Details** → footer. CSS is never used to reorder content (1.3.2, 2.4.3).

| Layer | Question it answers | Main persona and JTBD (hypotheses) | Content |
|---|---|---|---|
| 1 KPIs | "What is the state right now?" | Daniel · J4, J5 | Value, direction (icon + words), comparison, source and as-of date |
| 2 Trends | "How did we get here, and is anything diverging?" | Mara · J1, J2 | Four chart widgets, each with a data-status badge, a chart/table toggle, a caption and a source |
| 3 Details | "What are the exact numbers, and where do they come from?" | Ioana · J7, J8, J9 | Sortable table with units in headers and a status column; each row opens the drill-down |

Filters sit above the KPIs because they change everything below them, so focus order follows cause → effect. The result line ("Showing 5 countries · Jan 2024 – Sep 2026 · 4 indicators") restates the scope in text.

## 2. Screens

### 2.1 Overview (1280)
Shown in all three themes; the dark and high-contrast versions are produced by switching variable modes on the same frame. Two widgets per row at ≥ 1200 px.

### 2.2 Drill-down: country vs euro area
- Breadcrumb `Overview / Inflation / Spain` (`aria-current="page"`).
- Three KPIs: country, euro area, and the gap in pp.
- Large line chart with the ECB 2% reference line labelled in text. The shaded gap band is decorative, because the gap values are also in the KPI, the table and the summary.
- A **"Play as sound"** button for the sonification stretch goal (Highcharts sonification).
- An "About this data" `<aside>` as a `<dl>`: series keys, frequency, unit, seasonal adjustment, coverage, release status, revisions policy, and a link to the source.
- A monthly table, newest first, with "Show all 33 months".

### 2.3 Saved views (create, name, apply, rename, delete, share)

| Action | UI | Behaviour and a11y |
|---|---|---|
| Create | "Save view" opens a dialog with a name field, a summary of what gets saved, and a "default view" checkbox | Native `<dialog>` or React Aria Modal. Focus goes to the name field, Esc closes, and focus returns to the trigger |
| Validate | Empty or duplicate name | Icon + text + 2px border; `aria-invalid` plus `aria-describedby`; focus goes to the field |
| Apply | Saved view select in the filter bar, or "Apply" in Manage | Live region: "View 'Monthly inflation check' applied: 5 countries, Jan 2024 – Sep 2026." |
| Rename | Inline edit in Manage | Enter saves, Esc cancels; focus returns to the Rename button |
| Delete | `role="alertdialog"` confirmation | Initial focus on **Keep view**. Afterwards a toast with **Undo**, which stays for ≥ 10 s or until dismissed |
| Share | "Copy link" | The URL encodes all filters and each widget's chart/table choice. Toast: "Link copied…" |
| Empty | Manage with no views | Explanation plus a primary "Save current view" button |
| Storage error | localStorage full or blocked | `role="alert"` toast offering "Copy link" instead |

**URL schema:** `?view=overview&from=2024-01&to=2026-09&geo=EA20,DE,FR,IT,ES&ind=hicp,unemp,lend,debt&t.inflation=table`. Theme and density are personal settings, kept in localStorage only and **not** included in links.

### 2.4 Export
- Radio group **What**: current view, or all data for these indicators.
- Radio group **Format**: CSV with commas, CSV with semicolons (for Excel in EU locales), or JSON.
- Checkbox "Include source, series keys and retrieval date", on by default (J8).
- Checkbox "Include rows marked as synthetic", off by default.
- A preview line showing the filename, size and number of rows.

## 3. UI states (every data component)

Every state uses text + icon (never colour alone), names its cause, and offers a recovery action. Edge states in the prototype come from the seeded synthetic generator and always show the **Synthetic data** badge.

| State | Chart widget | KPI card | Table | Announcement |
|---|---|---|---|---|
| Loading | Skeleton in the final layout with `aria-busy="true"`. The pulse animation is off under reduced motion | Skeleton + "Loading…" | Skeleton rows + "Loading 9 rows…" | polite, only if loading takes > 1 s: "Loading inflation data…" → "Inflation chart loaded, 5 series." |
| Empty, first use | Neutral panel with a primary action ("Choose countries") | "Not set" + "Pick indicator" | "No countries selected" + "Open Countries filter" | none on page load |
| Empty, no results | Names the filter that caused it, with specific fixes ("Show Jan 2025 – Sep 2026", "Remove Malta") | "No data" + "Widen date range" | "No countries match…" + "Clear search" | polite: "No data for Malta between Jan and Mar 2024." |
| Error | Danger panel: what failed, the cause (HTTP 504 timeout), and that nothing outdated is shown. **Retry**, with "Use snapshot from 14 Oct" as the alternative. Includes an error reference | "—" (with aria-label "Value unavailable") + "Couldn't load (timeout)" + Retry | Partial error naming the failed source | **assertive** (`role="alert"`) |
| Partial | Badge "Partial: 4 of 5 series" plus a list of what is missing and why. The missing series keeps its key slot, labelled "no data" | "Based on 19 of 20 countries" | "— n/a", read as "Not available", with a footnote | polite: "…loaded with 4 of 5 series. Italy is missing: not in this snapshot." |
| Stale | Badge "Stale · 45 days old", last-updated date and the date the update was expected, plus a "Check source" link | Stale badge with the period | Status column | polite on load |
| Out of range | The axis keeps its normal range. An off-scale marker at the plot edge shows an arrow and the exact value, with "Show in table" and "Rescale axis" actions | Badge + "Check the source before using this value" | Value marked with ⚠ and "Check value" | polite: "1 value is outside the chart scale: Spain, Aug 2026, 12.4%." |

**Staleness rule:** a monthly series is stale when it is more than 40 days past its expected release, and a quarterly series when it is more than 100 days past. Thresholds are configurable for each series.

## 4. Chart specs

### 4.1 Series encoding (four redundant channels)

| Slot | Light | Dark | HC | Dash | Marker | Area/bar pattern | Default entity |
|---|---|---|---|---|---|---|---|
| 1 | `#1f6fd1` | `#4a8ee6` | `#ffffff` | Solid, 3px | circle | solid | Euro area (reference) |
| 2 | `#9a6a00` | `#bf8a17` | `#ffa24d` | ShortDash 6·4 | square | diagonal 45° | Germany |
| 3 | `#c2387a` | `#dc5f97` | `#00e5ff` | Dot 1·4 (2.5px) | diamond | dots | France |
| 4 | `#3d7d1a` | `#58a13a` | `#ffd400` | DashDot 10·4·2·4 | triangle | diagonal 135° | Italy |
| 5 | `#6250d6` | `#8577e8` | `#b9a8ff` | LongDash 14·5 | triangle-down | crosshatch | Spain |
| 6 | `#c4501f` | `#e0652f` | `#8cff6b` | ShortDot 2·3 | cross | horizontal | 6th series |

**Colour follows the entity, never its rank.** Filtering a series out must not recolour the remaining ones.

**Palette validation**, run with the dataviz skill's validator (Machado 2009 CVD model, OKLab ΔE×100):
- **Adjacent pairs:** worst CVD ΔE is **10.0** in light and **10.1** in dark (target ≥ 8). The worst normal-vision ΔE is **20.3** and **20.5** (floor ≥ 15).
- **First three slots, all pairs:** these also pass, for scatter and heatmap use.
- **Contrast:** every slot is ≥ 3:1 against its surface (1.4.11).
- **Greyscale:** all six slots collapse to roughly the same grey (#666–#747474). This is why dash, marker, pattern and direct label are mandatory.

### 4.2 Per chart

| Chart | Use when | Not colour alone | Direct labels | Table alternative |
|---|---|---|---|---|
| Line (time series) | ≤ 6 series sharing one unit | Colour + dash + marker (every 6th point + the last) + a 3px reference line | End labels "EA 2.1%" placed ≥ 17px apart; at < 480px they become a key list below the plot | Months as rows (newest first), series as columns, unit in the caption |
| Bar (comparison) | One measure across ≤ 12 categories | Single colour; the reference bar gets a hatch + bold label (a dashed outline at narrow widths) | A value on every bar | Country, value, rank; same sort as the chart |
| Stacked area | ≤ 3–4 parts of a total that genuinely sum | Colour + pattern for each band, with 2px surface separators | Label + latest value at the right edge | Months as rows, one column per component, plus a Total column |
| Heatmap | Patterns across country × month | Sequential single-hue ramp in 5 bins, **with the value printed in every cell** (text colour chosen per bin for ≥ 4.5:1). HC mode adds cell borders | Row and column headers, plus a binned legend | The same matrix as a `<table>` |

### 4.3 Text summary generator (deterministic, unit-tested in Phase 3)

`summarize(chartData, options) → { long, short }`. The function is pure: the same input always gives the same output, so snapshot tests are stable.

The **long** form follows Lundgard & Satyanarayan levels 1–3 and is attached via `aria-describedby`. It covers, in order:
1. chart type, measure and unit, number of series, frequency and date range;
2. for each series (or for the reference series, plus the extremes across series): trend direction (rising, falling or flat, using a threshold), min with its date, max with its date, latest value with its date and status (provisional, revised);
3. the most notable change (the largest absolute change over the period, or the largest month-on-month move);
4. the highest and lowest latest values across series;
5. **missing data, always stated**: "No missing values", or which series or periods are missing and why;
6. out-of-range values and stale status, if present.

The **short** form is one sentence for the visible caption: the headline change plus the highest and lowest.

Level 4 (domain interpretation) is intentionally left to people.

### 4.4 Keyboard (each chart region is ONE tab stop)

| Key | Action |
|---|---|
| Tab | Enter the chart, or move on to the next control |
| ← / → | Previous / next point in the series |
| ↑ / ↓ | Same date in the previous / next series |
| Home / End | First / last point |
| Page Up / Page Down | Jump 12 points |
| S | Read the series summary |
| T | Switch to table view |
| Enter | Open the drill-down for the focused country |
| Esc | Close the tooltip; a second Esc leaves the chart |
| ? | Show the shortcut list |

Single-key shortcuts only work while focus is inside the chart (2.1.4). The key map is always reachable from the keyboard button in each widget header.

### 4.5 Tooltip (1.4.13)
The tooltip:
- appears on hover **and** on focus;
- can be hovered without closing;
- persists until the pointer or focus leaves, or Esc is pressed, and Esc does not move focus;
- is mirrored to a polite live region;
- flips side so it never covers the focused point or the direct labels;
- is never the only place a value appears.

## 5. Responsive and zoom

Breakpoints use **container CSS px**, so zoom and small screens behave the same way. 1280 px at 200% zoom = 640 CSS px, and at 400% = 320 CSS px.

| Width | Layout |
|---|---|
| ≥ 1200 | 4 KPIs in a row · 2 widgets per row |
| 720–1199 | KPIs in a 2 × 2 grid · 1 widget per row |
| < 720 | Single column; nothing is sticky (2.4.11) |
| < 480 | Narrow chart variant (key list below the plot, fewer ticks). Filters collapse into a "Filters (n active)" disclosure and the nav into "Menu"; widget actions wrap |

There is no horizontal page scroll at 320 CSS px. The only exception is the data table, which scrolls inside its own `role="region"` with `tabindex="0"` and `aria-labelledby` pointing at the caption. It has a sticky first column and a visible "Scroll for more columns →" hint. Text containers have no fixed heights, so the 1.4.12 text-spacing overrides never clip content.

## 6. Accessibility annotations (page 07)

- **Landmarks:**
  - `header` (banner)
  - `nav` "Primary"
  - `note` (the data notice)
  - `main#main`
  - `section`s labelled Filters, Key indicators, Trends and Details
  - `footer` (contentinfo)
  - On the drill-down, an `aside` for "About this data"
- **Headings:** H1 for the page title, then H2 for Filters, Key indicators, Trends and Details. H3 is used for KPI labels and widget titles. Dialog titles are H2. No heading levels are skipped.
- **Focus order:** 50 stops on the overview, numbered on page 07.
  - Skip link is 1, followed by the nav, display settings, page actions and the filters.
  - Each widget has 6 stops: Chart, Table, Keys, More, the chart region, then Data notes.
  - Last come the table region and the sortable headers.
- **Live regions:** a global polite status region, a polite loading status for each widget, an assertive region for widget errors, a polite tooltip mirror, and toasts. Messages are debounced by 500 ms, there is one message per user action, and nothing is announced on page load except errors.
- **Focus style:** a 3px `focus/ring` outline with a 2px offset (`outline`, so it survives forced-colors). Its contrast is ≥ 3:1 on both the surface and canvas colours in every theme: at least 5.8 : 1 in light, at least 8.4 : 1 in dark and 14.7 : 1 in HC (`node scripts/check-contrast.mjs`).

## 7. Components and design-system candidates

The prototype builds these on **React Aria Components** and flags them as candidates for the design system:

| Component | Base | Notes |
|---|---|---|
| Button, IconButton | RAC `Button` | Size taken from `density/control-height`; icon-only buttons need `aria-label` plus a visible tooltip |
| View toggle (Chart/Table) | RAC `ToggleButtonGroup` | `aria-pressed`; the change is announced |
| Select / multi-select combobox | RAC `Select`, `ComboBox` | Visible label; the value summarises the selection |
| Date range (month) | Two RAC `DateField`s in a `fieldset` + preset buttons | No drag-only interaction |
| Dialog / AlertDialog | RAC `Modal`, `Dialog` | Initial focus rules as in §2.3 |
| Toast | RAC `UNSTABLE_Toast` or custom live region | Persistent while hovered or focused |
| Status badge | static | Icon + text; the border uses the text colour |
| KPI card | static `<article>` | Not focusable |
| Data table | RAC `Table` (sortable) or native `<table>` + buttons in `<th>` | `aria-sort`; scroll region |
| Skip link | native | First focusable element |
| Chart widget | custom shell + Highcharts | Table toggle, summary, keyboard help |

## 8. Known gaps and questions for review

1. **Fonts:** Inter is a placeholder. If the Accessible Design System uses another family, it gets swapped in the tokens.
2. **Heatmap in HC:** the cell borders are specified but not drawn in the Figma component. They will be implemented in code.
3. **Stacked area labels:** "Other lending" and "Consumer credit" sit close together at 548px. Code will use collision avoidance, as for the line labels.
4. **Highcharts licence:** free for non-commercial portfolio use only (D-002). Please confirm this is acceptable.
5. **Real data:** blocked until `data-api.ecb.europa.eu` and `ec.europa.eu` are allowlisted (D-005). The four KPIs and four charts map to these series:
   - HICP annual rate: Eurostat `prc_hicp_manr`
   - Unemployment: `une_rt_m`
   - Government debt: `gov_10q_ggdebt`
   - EUR/USD: ECB `EXR`
   - Household lending: ECB `MIR`
