# Chart accessibility pattern guide

How the Euro Area Monitor makes charts accessible, how to choose a chart type, and how each technique maps to WCAG 2.2. Code references are relative to `src/`.

## 1. Choosing a chart

| Question the user is answering | Use | Avoid |
|---|---|---|
| How has a value changed over time, for up to 6 entities sharing one unit? | **Line** (`charts/builders.ts` `buildLine`) | More than 6 lines (use small multiples or the heatmap); dual y-axes |
| How do categories rank at one point in time? | **Horizontal bar**, sorted (`buildBar`) | Pie charts; unsorted bars when the order means nothing |
| How does a total split into parts over time (2–4 parts that genuinely sum)? | **Stacked area** (`buildStackedArea`) | Stacking things that don't sum; more than 4 bands |
| Where are the patterns across two categories (country × month)? | **Heatmap with values printed** (`buildHeatmap`) | Heatmaps without values; rainbow or diverging ramps without a real midpoint |
| What is the single current value? | **KPI card** (`widgets/KpiCard.tsx`) | A chart for a single number |
| What are the exact values? | **Table** (always available) | Hiding exact values in tooltips only |

At containers narrower than 520 px: line and area charts move their labels to a key list below the plot, and the heatmap becomes a table.

## 2. The patterns

### 2.1 Not colour alone: four redundant channels
Every series has colour + line dash + marker shape + direct label. Areas and bars use colour + pattern fill + direct label (`charts/highcharts.ts` `slotStyle`, `patternFill`; tokens in `packages/tokens/tokens.json` → `chart`).

| Slot | Dash | Marker | Pattern |
|---|---|---|---|
| 1 (euro area reference, 3px) | Solid | circle | solid |
| 2 | ShortDash | square | diagonal 45° |
| 3 | Dot | diamond | dots |
| 4 | DashDot | triangle | diagonal 135° |
| 5 | LongDash | triangle-down | crosshatch |
| 6 | ShortDot | cross | horizontal |

- **Palette:** 6 slots, each ≥ 3:1 against the surface in light, dark and high contrast. The order was chosen by enumeration so adjacent pairs stay ≥ 10 ΔE (OKLab ×100) under protanopia and deuteranopia (D-021). In greyscale all six collapse to roughly the same grey, which is why the other channels exist.
- **Colour follows the entity, not its rank:** `data/registry.ts` `assignSlots` (D-042).
- **Direct labels:** end-of-line labels are collision-avoided (≥ 17 px apart, two lines for areas), drawn in text colour with a marker beside them.
- **Status badges:** icon + text + a border in the text colour (`components/ui.tsx` `Badge`).
- **Forced colours:** tokens map to `CanvasText`/`Canvas`/`GrayText`/`Highlight`, and `forced-color-adjust: none` is set on the chart container (D-050).

**WCAG:** 1.4.1 Use of Color, 1.4.11 Non-text Contrast, 1.4.3 Contrast (labels).

### 2.2 Table alternative
- A Chart ⇄ Table toggle in every widget (`components/ui.tsx` `ViewToggle`: a React Aria radio group with one tab stop). The choice is stored in the URL (`t.<widget>=table`).
- Real `<table>`s with a `<caption>` that includes units, `<th scope="col">` and `<th scope="row">`, gaps read as "Not available", provisional values marked with `<abbr>` (`widgets/tables.tsx`).
- Tables sit inside `role="region" tabindex="0" aria-labelledby=<caption>`, so they can scroll horizontally on their own at 320 px. The first column is sticky.
- Toggling announces "Table view shown for …" (polite). The **T** key inside a chart switches view and puts focus on the Table toggle.

**WCAG:** 1.1.1, 1.3.1 Info and Relationships, 1.4.10 Reflow, 2.1.1, 4.1.3.

### 2.3 Generated text summaries
- `lib/summarize.ts` `summarize()` is pure and deterministic, covered by `lib/summarize.test.ts`. It returns `long` and `short`.
- **Long** (Lundgard & Satyanarayan levels 1–3): chart type, measure and unit, number of series, frequency and range; the reference series' trend, first and last values, min and max with dates and provisional status; highest and lowest latest values; largest change; **always** a data-quality sentence (missing, stale, out-of-range, or "No missing values."). It's passed to Highcharts as `accessibility.description`, so screen readers hear it on entering the chart.
- **Short:** one visible sentence under each chart (e.g. "Euro area fell from 8.6% to 3.8%; Spain highest (5.0%), Germany lowest (3.3%).").
- **Per series:** `seriesSentence()` behind the **S** key.
- Level 4 (domain interpretation) is deliberately left to people.

**WCAG:** 1.1.1 Non-text Content, 1.3.1.

### 2.4 Keyboard navigation (`charts/ChartRegion.tsx`)
| Key | Action |
|---|---|
| Tab | Enter the chart (one tab stop), then move on |
| ← → | Previous / next point (Highcharts) |
| ↑ ↓ | Same date in the previous / next series (custom, D-051) |
| Home / End | First / last point |
| Page Up / Page Down | ±12 points |
| S | Announce the series summary |
| T | Switch to the table, focus on the Table toggle |
| Enter | Open the drill-down for the focused country |
| Esc | Close the tooltip; press again to leave the chart (focus goes to the view toggle) |
| ? | Shortcut list |

Single-key shortcuts only act while focus is inside the chart (2.1.4). The key map is always visible through the keyboard button in each widget and the global **Shortcuts** button. The focus ring is a 3 px `focus/ring` with ≥ 3:1 contrast (`accessibility.keyboardNavigation.focusBorder`).

**WCAG:** 2.1.1 Keyboard, 2.1.4 Character Key Shortcuts, 2.4.3 Focus Order, 2.4.7 Focus Visible.

### 2.5 Tooltips
- Shown on hover **and** on keyboard focus (Highcharts).
- Hoverable: `stickOnContact: true`.
- Persistent until the pointer or focus leaves.
- Dismissible with Esc, with or without focus in the chart.
- Mirrored to the polite live region on pointer hover only (keyboard focus already reads the point label; D-052).
- Never the only place a value lives.

**WCAG:** 1.4.13 Content on Hover or Focus, 4.1.3.

### 2.6 Data-quality states
| State | Detection | UI |
|---|---|---|
| Partial | `data/derive.ts` `detectIssues`: series missing, or ending before the others | Badge "Partial: n of m series complete" + list of what is missing; key slot kept with "no data"; "—"/"Not available" in tables |
| Stale | Latest period older than publication lag + period + 10 days, at retrieval time | Badge "Stale · N days old" + explanation |
| Out of range | Value outside the dataset's plausible range | Badge + note with the exact value; line charts keep their axis and flag the point at the edge with an arrow and value (D-025) |
| Provisional | Source status `p`/`P`/`E` on the latest observation | Badge + "p" marker in tables |
| Synthetic | Simulated state | "Synthetic data" badge before the content |
| Loading / error / empty | Load state | Skeleton + `aria-busy`; error with cause and Retry (assertive); empty states with a specific recovery action |

**WCAG:** 1.4.1, 3.3.1 Error Identification (errors), 4.1.3 Status Messages.

### 2.7 Reflow and zoom
Breakpoints use container CSS px, so zoom behaves like a narrow screen (D-028). Tested at 320, 640 and 1280 px, at 200% text zoom and with text-spacing overrides (`e2e/reflow.spec.ts`).

**WCAG:** 1.4.4, 1.4.10, 1.4.12.

### 2.8 Sonification (stretch goal)
On the drill-down chart, "Play as sound" uses the Highcharts sonification module. The mapping (higher pitch = higher value) is announced before playback, and the same button stops it (D-055). It supplements the summary and the table; it doesn't replace them.

## 3. WCAG mapping summary

| SC | How |
|---|---|
| 1.1.1 Non-text Content | Generated long summary + table for every chart; decorative icons `aria-hidden` |
| 1.3.1 Info and Relationships | Semantic tables, headings, landmarks, fieldsets/legends, `aria-sort` |
| 1.4.1 Use of Color | Dash, marker, pattern, labels; status icons + text; heatmap values printed |
| 1.4.3 Contrast (Minimum) | Token pairs ≥ 4.5:1 for text (checked by script) |
| 1.4.4 Resize Text / 1.4.10 Reflow | rem-based type, container breakpoints, narrow chart variants |
| 1.4.11 Non-text Contrast | Series ≥ 3:1; borders, focus ring ≥ 3:1 |
| 1.4.12 Text Spacing | No fixed text heights; tested |
| 1.4.13 Content on Hover or Focus | Tooltip on focus, hoverable, persistent, Esc |
| 2.1.1 Keyboard / 2.1.4 Character Key Shortcuts | Full keyboard map; single keys scoped to the chart |
| 2.4.3 Focus Order / 2.4.7 Focus Visible / 2.4.11 Focus Not Obscured | DOM = visual order; 3px ring; nothing sticky under 720 px |
| 2.5.8 Target Size (Minimum) | Controls 44 px (32 px compact); table links ≥ 24 px |
| 4.1.3 Status Messages | Debounced polite/assertive live regions for filters, toggles, loads, errors, saves |
