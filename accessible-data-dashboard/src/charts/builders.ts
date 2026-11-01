/**
 * Option builders for the four chart types. Every series carries redundant
 * encodings (colour + dash + marker + direct label; areas/bars: colour +
 * pattern + direct label) — design/SPEC.md §4.
 */
import { Highcharts, baseOptions, cssVar, forcedColors, hatch, patternFill, slotStyle, type ChartOptions } from './highcharts';
import type { Series } from '../data/types';
import { formatNumber, formatPeriod, formatValue, periodToUtc } from '../data/format';

const merge = (a: ChartOptions, b: ChartOptions): ChartOptions => Highcharts.merge(a, b) as ChartOptions;

/** Draw collision-avoided direct labels at the right edge of the plot. */
function endLabels(getItems: (chart: Highcharts.Chart) => { y: number; text: string; slot: number; symbol?: string }[], minGap = 17) {
  return function (this: Highcharts.Chart) {
    const chart = this as Highcharts.Chart & { endLabelGroup?: Highcharts.SVGElement };
    chart.endLabelGroup?.destroy();
    const g = chart.renderer.g('end-labels').attr({ zIndex: 6, 'aria-hidden': 'true' }).add();
    chart.endLabelGroup = g;
    const items = getItems(chart).filter((i) => Number.isFinite(i.y)).sort((a, b) => a.y - b.y);
    for (let i = 1; i < items.length; i++) if (items[i].y - items[i - 1].y < minGap) items[i].y = items[i - 1].y + minGap;
    // Keep labels inside the chart: shift the stack up if it overflows the bottom.
    const overflow = (items.at(-1)?.y ?? 0) + minGap / 2 - chart.chartHeight;
    if (overflow > 0) for (const it of items) it.y -= overflow;
    const x = chart.plotLeft + chart.plotWidth + 10;
    for (const it of items) {
      const st = slotStyle(it.slot);
      if (it.symbol !== 'none') chart.renderer.symbol(it.symbol ?? st.symbol, x - 4, it.y - 4, 8, 8).attr({ fill: st.color, stroke: cssVar('bg/surface'), 'stroke-width': 1 }).add(g);
      chart.renderer.text(it.text, x + 8, it.y + (it.text.includes('<br/>') ? -3 : 5)).css({ color: cssVar('text/primary'), fontSize: '14px', fontWeight: '600' }).add(g);
    }
  };
}

export interface LineInput { series: Series[]; slots: Map<string, number>; unit: string; endLabels: boolean; valueSuffix: string; referenceLine?: { value: number; label: string }; plausible?: [number, number] }

/** Mark values above the visible axis at the plot's top edge with an arrow + exact value (design/SPEC.md §3, D-025). */
function offScaleFlags(chart: Highcharts.Chart, valueSuffix: string) {
  const c = chart as Highcharts.Chart & { offScaleGroup?: Highcharts.SVGElement };
  c.offScaleGroup?.destroy();
  const g = chart.renderer.g('off-scale').attr({ zIndex: 7, 'aria-hidden': 'true' }).add();
  c.offScaleGroup = g;
  const max = chart.yAxis[0].getExtremes().max;
  for (const s of chart.series) for (const pt of s.points) {
    if (pt.y == null || pt.y <= max) continue;
    const x = chart.plotLeft + (pt.plotX ?? 0);
    const y = chart.plotTop + 2;
    chart.renderer.path(['M', x - 7, y + 10, 'L', x, y, 'L', x + 7, y + 10, 'Z'] as unknown as Highcharts.SVGPathArray).attr({ fill: cssVar('status/danger-text') }).add(g);
    const label = `${(s.options as { custom?: { short?: string } }).custom?.short ?? s.name} ${formatPeriod((pt.options as { custom?: { period: string } }).custom?.period ?? '')}: ${formatNumber(pt.y)}${valueSuffix} (off scale)`;
    const t = chart.renderer.label(label, x + 10, y - 2, 'rect', undefined, undefined, false, false, 'off-scale-label').attr({ fill: cssVar('status/danger-bg'), stroke: cssVar('status/danger-text'), 'stroke-width': 1, r: 4, padding: 4 }).css({ color: cssVar('status/danger-text'), fontSize: '13px', fontWeight: '600' }).add(g);
    const bb = t.getBBox(); if (x + 10 + bb.width > chart.plotLeft + chart.plotWidth) t.attr({ x: x - 10 - bb.width });
  }
}

export function buildLine({ series, slots, unit, endLabels: withLabels, valueSuffix, referenceLine, plausible }: LineInput): ChartOptions {
  const inRange = series.flatMap((s) => s.observations.map((o) => o.value)).filter((v): v is number => v != null && (!plausible || (v >= plausible[0] && v <= plausible[1])));
  const hasOff = !!plausible && series.some((s) => s.observations.some((o) => o.value != null && o.value > plausible[1]));
  const axisMax = hasOff ? Math.ceil(Math.max(...inRange) * 1.25) : undefined;
  const labelsFn = withLabels ? endLabels((c) => c.series.map((s) => { const last = [...s.points].reverse().find((p) => p.y != null); const y = last && axisMax != null && (last.y ?? 0) > axisMax ? c.plotTop : (last?.plotY ?? NaN) + c.plotTop; return { y, text: `${(s.options as { custom?: { short?: string } }).custom?.short ?? s.name} ${formatNumber(last?.y ?? null)}${valueSuffix}`, slot: slots.get((s.options as { id?: string }).id ?? '') ?? 1 }; })) : null;
  const render = function (this: Highcharts.Chart) { labelsFn?.call(this); if (hasOff) offScaleFlags(this, valueSuffix); };
  const longest = Math.max(...series.map((s) => s.observations.length), 1);
  const markerEvery = longest > 24 ? 6 : longest > 12 ? 3 : 1;
  return merge(baseOptions(), {
    chart: { type: 'line', marginRight: withLabels ? 92 : 12, marginTop: hasOff ? 28 : undefined, events: { render } },
    xAxis: { type: 'datetime', tickLength: 4, labels: { format: '{value:%b %Y}' }, crosshair: { color: cssVar('border/strong'), dashStyle: 'Dash', width: 1 } },
    yAxis: { min: Math.min(0, ...inRange), max: axisMax, labels: { format: `{value}${valueSuffix}` }, plotLines: referenceLine ? [{ value: referenceLine.value, color: cssVar('text/secondary'), dashStyle: 'Dot', width: 1.5, zIndex: 3, label: { text: referenceLine.label, align: 'left', x: 4, y: 14, style: { color: cssVar('text/secondary'), fontSize: '13px' } } }] : [] },
    tooltip: { shared: false, valueDecimals: 1, valueSuffix, xDateFormat: '%B %Y' },
    plotOptions: { series: { connectNulls: false, marker: { enabled: false, radius: 4.5, lineColor: cssVar('bg/surface'), lineWidth: 1 } } },
    accessibility: { point: { valueSuffix, valueDecimals: 1, dateFormat: '%B %Y' }, series: { descriptionFormat: '{seriesDescription}' } } as Highcharts.AccessibilityOptions,
    series: series.map((s) => {
      const st = slotStyle(slots.get(s.id) ?? 1);
      const n = s.observations.length;
      return {
        type: 'line', id: s.id, name: s.label, custom: { short: s.id }, color: st.color, dashStyle: st.dashStyle as Highcharts.DashStyleValue, lineWidth: st.lineWidth,
        marker: { symbol: st.symbol },
        data: s.observations.map((o, i) => ({ x: periodToUtc(o.period), y: o.value, custom: { period: o.period, status: o.status }, marker: { enabled: i % markerEvery === 0 || i === n - 1 } })),
      } as Highcharts.SeriesLineOptions;
    }),
  } as ChartOptions);
  void unit;
}

export interface BarItem { id: string; label: string; value: number | null; highlight?: boolean }

export function buildBar({ items, unit, valueSuffix }: { items: BarItem[]; unit: string; valueSuffix: string }): ChartOptions {
  const st = slotStyle(1);
  return merge(baseOptions(), {
    chart: { type: 'bar', marginRight: 56 },
    xAxis: { categories: items.map((i) => i.label), labels: { style: { color: cssVar('text/primary'), fontSize: '14px' }, formatter: function (this: unknown): string { const ctx = this as { pos: number; value: string | number }; const it: BarItem | undefined = items[ctx.pos]; return it?.highlight ? `<b>${ctx.value}</b>` : String(ctx.value); } }, lineColor: cssVar('chart/axis') },
    yAxis: { min: 0, labels: { format: `{value}${valueSuffix}` }, gridLineColor: cssVar('chart/grid') },
    tooltip: { valueDecimals: 1, valueSuffix },
    plotOptions: { bar: { borderRadius: 4, borderWidth: 0, pointPadding: 0.08, groupPadding: 0.06, dataLabels: { enabled: true, format: `{y:.1f}${valueSuffix}`, style: { color: cssVar('text/primary'), fontSize: '14px', fontWeight: '400', textOutline: 'none' } } } },
    accessibility: { point: { valueSuffix, valueDecimals: 1 } } as Highcharts.AccessibilityOptions,
    series: [{
      type: 'bar', id: 'value', name: unit === '%' ? 'Rate' : 'Value', color: st.color,
      data: items.map((i) => ({ y: i.value, name: i.label, color: i.highlight ? hatch(st.color, 'diagonal-45') : st.color, dataLabels: i.highlight ? { style: { fontWeight: '700' } } : undefined, custom: { id: i.id, highlight: i.highlight } })),
    } as Highcharts.SeriesBarOptions],
  } as ChartOptions);
}

export interface AreaInput { series: Series[]; slots: number[]; valueSuffix: string; scale: number; scaleLabel: string; endLabels: boolean }

export function buildStackedArea({ series, slots, valueSuffix, scale, scaleLabel, endLabels: withLabels }: AreaInput): ChartOptions {
  return merge(baseOptions(), {
    chart: { type: 'area', marginRight: withLabels ? 140 : 12, events: withLabels ? { render: endLabels((c) => c.series.map((s, i) => { const pts = s.points.filter((p) => p.y != null); const last = pts.at(-1) as (Highcharts.Point & { stackY?: number }) | undefined; const yAxis = c.yAxis[0]; const top = last?.stackY ?? 0; const bottom = top - (last?.y ?? 0); const mid = (yAxis.toPixels(top, false) + yAxis.toPixels(bottom, false)) / 2; return { y: mid, text: `${s.name}<br/>${formatNumber(last?.y ?? null, scale === 1 ? 1 : 2)}${valueSuffix}`, slot: slots[i], symbol: 'square' }; }), 36) } : undefined },
    xAxis: { type: 'datetime', labels: { format: '{value:%b %Y}' } },
    yAxis: { min: 0, labels: { format: `{value}${valueSuffix}` }, title: { text: scaleLabel, style: { color: cssVar('text/secondary') } } },
    tooltip: { shared: true, valueDecimals: scale === 1 ? 1 : 2, valueSuffix, xDateFormat: '%B %Y' },
    plotOptions: { area: { stacking: 'normal', lineWidth: 2, lineColor: cssVar('bg/surface'), marker: { enabled: false }, fillOpacity: 1 } },
    accessibility: { point: { valueSuffix, valueDecimals: 2, dateFormat: '%B %Y' } } as Highcharts.AccessibilityOptions,
    series: series.map((s, i) => ({
      type: 'area', id: s.id, name: s.label, color: slotStyle(slots[i]).color, fillColor: patternFill(slots[i]),
      data: s.observations.map((o) => ({ x: periodToUtc(o.period), y: o.value == null ? null : o.value / scale, custom: { period: o.period } })),
    }) as Highcharts.SeriesAreaOptions),
  } as ChartOptions);
}

export interface HeatInput { series: Series[]; periods: string[]; valueSuffix: string; bins: number[] }

export function buildHeatmap({ series, periods, valueSuffix, bins }: HeatInput): ChartOptions {
  const binOf = (v: number) => { let b = 1; for (const t of bins) if (v >= t) b++; return Math.min(b, 5); };
  const labels = ['< ' + bins[0], `${bins[0]}–${bins[1]}`, `${bins[1]}–${bins[2]}`, `${bins[2]}–${bins[3]}`, '≥ ' + bins[3]];
  const hc = document.documentElement.dataset.theme === 'hc' || forcedColors();
  const data: Highcharts.PointOptionsObject[] = [];
  series.forEach((s, y) => periods.forEach((p, x) => {
    const o = s.observations.find((ob) => ob.period === p);
    const v = o?.value ?? null;
    data.push(v == null
      ? { x, y, value: null, custom: { period: p, missing: true } }
      : { x, y, value: v, color: cssVar(`chart/seq-${binOf(v)}`), dataLabels: { style: { color: cssVar(`chart/seq-${binOf(v)}-text`) } }, custom: { period: p } });
  }));
  return merge(baseOptions(), {
    chart: { type: 'heatmap', marginTop: 4 },
    xAxis: { categories: periods.map((p) => formatPeriod(p).slice(0, 3)), min: -0.5, max: periods.length - 0.5, startOnTick: false, endOnTick: false, tickPositions: periods.map((_, i) => i), opposite: true, lineWidth: 0, labels: { style: { color: cssVar('text/secondary') } } },
    yAxis: { categories: series.map((s) => s.label), reversed: true, title: undefined, gridLineWidth: 0, labels: { style: { color: cssVar('text/primary'), fontSize: '14px' } } },
    colorAxis: { dataClasses: [1, 2, 3, 4, 5].map((b, i) => ({ from: i === 0 ? -100 : bins[i - 1], to: i === 4 ? 100 : bins[i], color: cssVar(`chart/seq-${b}`), name: labels[i] + (i === 4 ? valueSuffix : '') })) },
    legend: { enabled: true, align: 'left', verticalAlign: 'bottom', symbolRadius: 2, itemStyle: { color: cssVar('text/primary'), fontWeight: '400' }, title: { text: 'Annual rate, %', style: { color: cssVar('text/secondary'), fontWeight: '400' } } },
    tooltip: { formatter: function (this: unknown): string { const ctx = this as { point?: unknown }; const p = (ctx.point ?? ctx) as Highcharts.Point & { value: number | null; custom: { period: string } }; return `<b>${series[p.y ?? 0]?.label}</b> · ${formatPeriod(p.custom.period)}<br/>${p.value == null ? 'No data' : formatValue(p.value, '%')}`; } },
    plotOptions: { heatmap: { borderWidth: hc ? 1 : 2, borderColor: forcedColors() ? 'CanvasText' : hc ? cssVar('border/subtle') : cssVar('bg/surface'), nullColor: cssVar('bg/subtle'), dataLabels: { enabled: true, format: '{point.value:.1f}', nullFormat: '—', style: { fontSize: '13px', fontWeight: '400', textOutline: 'none' } } } },
    accessibility: { point: { valueSuffix, valueDecimals: 1, descriptionFormatter: (p: Highcharts.Point) => { const q = p as Highcharts.Point & { value: number | null; custom: { period: string } }; return `${series[q.y ?? 0]?.label}, ${formatPeriod(q.custom.period, true)}: ${q.value == null ? 'no data' : formatValue(q.value, '%')}.`; } } } as Highcharts.AccessibilityOptions,
    series: [{ type: 'heatmap', name: 'Annual rate of change', data }],
  } as ChartOptions);
}
