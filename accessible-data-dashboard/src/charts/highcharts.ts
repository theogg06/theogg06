/**
 * Highcharts setup. Licence: Highcharts is free for non-commercial use only
 * (portfolio project) — see DECISIONS.md D-002 and README.
 * ESM builds share one Highcharts instance across modules.
 */
import Highcharts from 'highcharts/esm/highcharts.js';
import 'highcharts/esm/modules/accessibility.js';
import 'highcharts/esm/modules/pattern-fill.js';
import 'highcharts/esm/modules/heatmap.js';
import { chartTokens } from '../styles/tokens.gen';
import { prefersReducedMotion } from '../state/prefs';

export { Highcharts };
export type ChartOptions = Highcharts.Options;

// Sixth marker symbol: a cross (slot 6). Drawn as a closed outline so it can be filled.
type SymbolFn = (x: number, y: number, w: number, h: number) => (string | number)[];
const symbols = (Highcharts as unknown as { SVGRenderer: { prototype: { symbols: Record<string, SymbolFn> } } }).SVGRenderer.prototype.symbols;
symbols.cross = (x, y, w, h) => {
  const t = w / 3;
  return ['M', x + t, y, 'L', x + 2 * t, y, 'L', x + 2 * t, y + t, 'L', x + w, y + t, 'L', x + w, y + 2 * t, 'L', x + 2 * t, y + 2 * t, 'L', x + 2 * t, y + h, 'L', x + t, y + h, 'L', x + t, y + 2 * t, 'L', x, y + 2 * t, 'L', x, y + t, 'L', x + t, y + t, 'Z'];
};

/** Read the current theme's tokens from CSS custom properties. */
export function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--color-${name.replace(/\//g, '-')}`).trim();
}

export interface SlotStyle { color: string; dashStyle: string; symbol: string; pattern: string; lineWidth: number }

const DASH: Record<string, string> = { Solid: 'Solid', ShortDash: 'ShortDash', Dot: 'Dot', DashDot: 'DashDot', LongDash: 'LongDash', ShortDot: 'ShortDot' };

/** Encoding for categorical slot 1–6 (design/SPEC.md §4.1). */
export function slotStyle(slot: number): SlotStyle {
  const i = Math.min(Math.max(slot, 1), 6) - 1;
  return {
    color: cssVar(`chart/series-${i + 1}`),
    dashStyle: DASH[chartTokens.dash[i]] ?? 'Solid',
    symbol: chartTokens.marker[i],
    pattern: chartTokens.pattern[i],
    lineWidth: i === 0 ? 3 : i === 2 ? 2.5 : 2,
  };
}

/** SVG path (8×8 tile) for each pattern name; lines drawn in the surface colour over the series colour. */
const PATTERN_PATH: Record<string, string> = {
  'diagonal-45': 'M 0 8 L 8 0 M -2 2 L 2 -2 M 6 10 L 10 6',
  'diagonal-135': 'M 0 0 L 8 8 M -2 6 L 2 10 M 6 -2 L 10 2',
  crosshatch: 'M 0 8 L 8 0 M 0 0 L 8 8',
  horizontal: 'M 0 4 L 8 4',
  dots: 'M 3 4 a 1 1 0 1 0 2 0 a 1 1 0 1 0 -2 0',
};

/** A pattern fill: `pattern` lines in the surface colour over `color`. */
export function hatch(color: string, pattern: string): Highcharts.ColorType {
  if (pattern === 'solid') return color;
  const surface = cssVar('bg/surface');
  return {
    pattern: {
      path: { d: PATTERN_PATH[pattern], stroke: surface, strokeWidth: pattern === 'dots' ? 2.4 : 1.6, fill: pattern === 'dots' ? surface : 'none' },
      width: 8, height: 8, backgroundColor: color,
    },
  } as unknown as Highcharts.ColorType;
}

export function patternFill(slot: number): Highcharts.ColorType {
  const s = slotStyle(slot);
  return hatch(s.color, s.pattern);
}

/** Shared base options: tokens, typography, accessibility, motion. */
export function baseOptions(): Highcharts.Options {
  const text = cssVar('text/primary');
  const text2 = cssVar('text/secondary');
  const grid = cssVar('chart/grid');
  const axis = cssVar('chart/axis');
  const surface = cssVar('bg/surface');
  const animate = !prefersReducedMotion();
  const font = getComputedStyle(document.documentElement).getPropertyValue('--font-family') || 'system-ui, sans-serif';
  return {
    chart: { backgroundColor: 'transparent', style: { fontFamily: font, color: text }, animation: animate, spacing: [8, 4, 8, 4] },
    title: { text: undefined },
    credits: { enabled: false },
    exporting: { enabled: false },
    legend: { enabled: false, itemStyle: { color: text, fontWeight: '400', fontSize: '14px' } },
    plotOptions: {
      series: { animation: animate, states: { inactive: { opacity: 1 } } },
    },
    xAxis: { lineColor: axis, tickColor: axis, gridLineColor: grid, labels: { style: { color: text2, fontSize: '13px' } } },
    yAxis: { lineColor: axis, gridLineColor: grid, title: { text: undefined }, labels: { style: { color: text2, fontSize: '13px' } } },
    tooltip: {
      backgroundColor: surface, borderColor: cssVar('border/strong'), borderRadius: 4, shadow: false,
      style: { color: text, fontSize: '14px' },
      // 1.4.13: the tooltip can be hovered without disappearing.
      stickOnContact: true,
    },
    accessibility: {
      enabled: true,
      landmarkVerbosity: 'disabled',
      keyboardNavigation: {
        enabled: true,
        focusBorder: { enabled: true, hideBrowserFocusOutline: true, style: { color: cssVar('focus/ring'), lineWidth: 3, borderRadius: 4 } },
      },
      highContrastMode: 'auto',
    } as Highcharts.AccessibilityOptions,
  };
}
