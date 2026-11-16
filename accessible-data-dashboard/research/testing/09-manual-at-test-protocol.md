# Manual assistive-technology test protocol

Automated checks (axe, Lighthouse, Playwright keyboard tests) catch only part of the WCAG issues. This protocol is for **you** to run by hand with real screen readers. **Results are intentionally empty.** Don't fill them in from expectations.

## Configurations

| ID | Screen reader | Browser | OS | Notes |
|---|---|---|---|---|
| A | NVDA (current) | Firefox | Windows | Primary |
| B | NVDA (current) | Chrome | Windows | |
| C | JAWS (current, if a licence is available; the 40-minute demo mode works) | Chrome or Edge | Windows | |
| D | VoiceOver | Safari | macOS | |
| E | VoiceOver | Safari | iOS (phone) | Reflow + touch |
| F | Narrator (optional) | Edge | Windows | |
| G | Windows contrast theme (forced colours), no SR | Edge | Windows | Visual check |
| H | Browser zoom 200% and 400% + ZoomText / OS magnifier (if available) | Chrome | Windows/macOS | |

Record AT and browser **versions** each time. Use default AT verbosity settings unless a test says otherwise.

## Test cases

| ID | Area | Steps | Expected |
|---|---|---|---|
| M01 | Page structure | Load the overview. List headings (NVDA H / Insert+F7; VO rotor) | One H1 "Euro area overview"; H2s Filters, Key indicators, Trends, Details; widget titles are H3; no skipped levels |
| M02 | Landmarks | List landmarks | banner, navigation "Primary", main, regions per section, contentinfo; note and notifications regions present |
| M03 | Skip link | Tab once from the address bar, then Enter | "Skip to main content" visible on focus; focus moves to main |
| M04 | KPI cards | Read the KPI list in browse mode | Each card: label, value, direction **as a word** ("Up 0.6 pp vs Aug 2026"), context, source + date |
| M05 | Chart entry | Tab to the inflation chart | Chart title and generated description read on entry; instructions for keys available |
| M06 | Chart points | Arrow keys left/right, up/down, Home/End | Each point read as "Month Year, value%. Series"; Up/Down change series at the same date; Home/End jump to the ends |
| M07 | Series summary | Press S inside the chart (in NVDA, focus mode may be needed) | Series summary sentence announced once, including missing count |
| M08 | Leave chart | Esc twice | First Esc closes the tooltip ("Tooltip closed."); second moves focus to the Chart/Table toggle |
| M09 | Table alternative | Switch to Table (T inside the chart, or the toggle) | "Table view shown for …" announced; table has a caption, column headers, row headers; units in the caption |
| M10 | Table navigation | Table navigation keys (NVDA Ctrl+Alt+arrows; VO Ctrl+Opt+arrows) | Headers announced when moving between cells; "Not available" read for gaps |
| M11 | Sort | Sort the detail table by Unemployment | Sort state announced; `aria-sort` reflected ("sorted descending") |
| M12 | Filters | Open Countries, toggle a country, close | Checkbox states read; focus returns to the trigger; announcement "Countries: …" |
| M13 | Date range | Change From with the select; use a preset | New range announced; listbox options read with selection state |
| M14 | Loading/error | Open `?sim.inflation=loading`, then `?sim.unemployment=error` | Loading not announced repeatedly; error announced once (assertive) with the cause; Retry reachable |
| M15 | Partial/stale/out-of-range | `?sim.inflation=partial`, `?sim.lending=stale`, `?sim.heatmap=out-of-range` | Badges read with the widget; the notes list names what is missing / how old / which value |
| M16 | Synthetic label | Any simulated state | "Synthetic data" is read before the chart content |
| M17 | Save view dialog | Open, submit empty, enter a name, save | Focus moves into the dialog; error read; success toast announced; focus returns to "Save view" |
| M18 | Delete + Undo | Saved views → Delete → confirm → Undo | alertdialog role read; focus on "Keep view"; Undo reachable after the dialog closes |
| M19 | Shortcuts | Press ? outside a text field | Dialog opens with key tables; Esc closes it |
| M20 | Drill-down | Enter on a country point, or a country link in the table | Page title changes; focus on the H1; breadcrumb with current page |
| M21 | Sonification | Drill-down → "Play as sound" | Mapping announced before playback; button stops playback |
| M22 | Theme | Switch Theme to High contrast; repeat M05–M09 visually | All chart encodings visible; focus ring visible |
| M23 | Forced colours | Config G: overview + drill-down | Patterns, dashes, markers and heatmap values visible; focus visible |
| M24 | Reflow | Config E/H at 320 CSS px / 400% | No horizontal scroll except inside tables; key list replaces end labels; heatmap becomes a table |

## Results (fill in)

| Test | Config (AT + browser + versions) | Expected | Actual | Pass / Fail | Severity (1–4) | Notes / WCAG SC |
|---|---|---|---|---|---|---|
| M01 | | see above | | | | |
| M02 | | | | | | |
| M03 | | | | | | |
| M04 | | | | | | |
| M05 | | | | | | |
| M06 | | | | | | |
| M07 | | | | | | |
| M08 | | | | | | |
| M09 | | | | | | |
| M10 | | | | | | |
| M11 | | | | | | |
| M12 | | | | | | |
| M13 | | | | | | |
| M14 | | | | | | |
| M15 | | | | | | |
| M16 | | | | | | |
| M17 | | | | | | |
| M18 | | | | | | |
| M19 | | | | | | |
| M20 | | | | | | |
| M21 | | | | | | |
| M22 | | | | | | |
| M23 | | | | | | |
| M24 | | | | | | |

**Known risks to check carefully** (from development, not tested with AT yet):
- In NVDA browse mode, single-letter keys (S, T) are captured by NVDA's quick navigation. NVDA normally switches to focus mode automatically on the chart's focusable points; confirm that.
- Highcharts announces "End of interactive chart" after the chart. Check that the reading order isn't confusing.
- VoiceOver on iOS: confirm that chart points can be swiped through and that the table toggle is easy to find.
