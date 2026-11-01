/**
 * Deterministic chart summary generator (design/SPEC.md §4.3).
 * Pure function: same input → same output (unit-tested in summarize.test.ts).
 * Long form follows Lundgard & Satyanarayan levels 1–3 (construction,
 * statistics, perceptual trends); level 4 (domain interpretation) is left
 * to people. Missing data is ALWAYS stated.
 */
import type { DataIssue, Frequency, Series } from '../data/types';
import { formatChange, formatNumber, formatPeriod } from '../data/format';

export type ChartKind = 'line' | 'bar' | 'area' | 'heatmap';

export interface SummaryInput {
  kind: ChartKind;
  /** e.g. "HICP annual rate of change, %" */
  measure: string;
  valueSuffix: string;
  /** Unit of change, e.g. "pp" for rates, "%" for levels. */
  changeUnit: string;
  frequency: Frequency;
  series: Series[];
  referenceId?: string;
  issues?: DataIssue[];
  digits?: number;
  /** For area charts: divisor + suffix used for display, e.g. 1e6 → "tn". */
  scale?: number;
}

export interface Summary { long: string; short: string }

interface Pt { period: string; value: number; status?: string }
const pts = (s: Series): Pt[] => s.observations.filter((o): o is Pt => o.value != null);
const FREQ = { M: 'monthly', Q: 'quarterly', D: 'daily' } as const;
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;

export function trendWord(first: number, last: number, range: number): 'rising' | 'falling' | 'broadly flat' {
  const d = last - first;
  const threshold = Math.max(0.1 * range, 1e-9);
  if (Math.abs(d) <= threshold) return 'broadly flat';
  return d > 0 ? 'rising' : 'falling';
}

function extremes(p: Pt[]) {
  let min = p[0], max = p[0];
  for (const x of p) { if (x.value < min.value) min = x; if (x.value > max.value) max = x; }
  return { min, max };
}

function statusNote(s?: string) { return s === 'p' || s === 'P' ? ', provisional' : s === 'E' ? ', estimated' : ''; }

/** Sentences about missing / stale / out-of-range data. Never empty: says "No missing values." when clean. */
export function dataQualitySentences(issues: DataIssue[] = []): string {
  const out: string[] = [];
  const missing = issues.filter((i) => i.kind === 'missing-series' || i.kind === 'missing-latest');
  out.push(missing.length ? `Missing data: ${missing.map((i) => i.message).join('; ')}.` : 'No missing values.');
  const stale = issues.find((i) => i.kind === 'stale'); if (stale) out.push(`Stale: ${stale.message}.`);
  const oor = issues.filter((i) => i.kind === 'out-of-range'); if (oor.length) out.push(`${plural(oor.length, 'value')} outside the expected range: ${oor.map((i) => i.message).join('; ')}.`);
  return out.join(' ');
}

export function summarize(input: SummaryInput): Summary {
  const d = input.digits ?? 1;
  const f = (v: number) => `${formatNumber(v / (input.scale ?? 1), d)}${input.valueSuffix}`;
  const withData = input.series.filter((s) => pts(s).length > 0);
  const quality = dataQualitySentences(input.issues);
  if (!withData.length) return { long: `${cap(input.kind)} chart, ${input.measure}. No data for the current selection. ${quality}`, short: 'No data for the current selection.' };

  const allPeriods = withData.flatMap((s) => pts(s).map((p) => p.period)).sort();
  const from = allPeriods[0], to = allPeriods[allPeriods.length - 1];

  if (input.kind === 'bar') {
    const items = withData.map((s) => ({ s, p: pts(s).at(-1)! })).sort((a, b) => b.p.value - a.p.value || a.s.label.localeCompare(b.s.label));
    const ref = items.findIndex((i) => i.s.id === input.referenceId);
    const hi = items[0], lo = items[items.length - 1];
    const refTxt = ref >= 0 ? ` ${items[ref].s.label}: ${f(items[ref].p.value)}, ${ordinal(ref + 1)} of ${items.length}.` : '';
    return {
      long: `Bar chart, ${input.measure}, ${plural(items.length, 'category')}, ${formatPeriod(to)}, sorted highest first. Highest: ${hi.s.label} ${f(hi.p.value)}. Lowest: ${lo.s.label} ${f(lo.p.value)}.${refTxt} ${quality}`,
      short: `${hi.s.label} highest (${f(hi.p.value)}), ${lo.s.label} lowest (${f(lo.p.value)})${ref >= 0 ? `; ${items[ref].s.label} ${f(items[ref].p.value)}` : ''}.`,
    };
  }

  if (input.kind === 'heatmap') {
    const cells = withData.flatMap((s) => pts(s).map((p) => ({ s, p })));
    const hi = cells.reduce((a, b) => (b.p.value > a.p.value ? b : a));
    const lo = cells.reduce((a, b) => (b.p.value < a.p.value ? b : a));
    const avg = (s: Series) => { const v = pts(s).map((p) => p.value); return v.reduce((x, y) => x + y, 0) / v.length; };
    const ranked = [...withData].sort((a, b) => avg(b) - avg(a) || a.label.localeCompare(b.label));
    const periods = new Set(allPeriods).size;
    const missingCells = input.series.length * periods - cells.length;
    return {
      long: `Heatmap, ${input.measure}, ${input.series.length} rows by ${periods} ${FREQ[input.frequency].replace('ly', '')}s, ${formatPeriod(from)} to ${formatPeriod(to)}. Highest cell: ${hi.s.label} ${f(hi.p.value)} (${formatPeriod(hi.p.period)}). Lowest cell: ${lo.s.label} ${f(lo.p.value)} (${formatPeriod(lo.p.period)}). Highest average: ${ranked[0].label} (${f(avg(ranked[0]))}). Lowest average: ${ranked[ranked.length - 1].label} (${f(avg(ranked[ranked.length - 1]))}).${missingCells > 0 ? ` ${plural(missingCells, 'cell')} without data.` : ''} ${quality}`,
      short: `Highest on average: ${ranked[0].label} (${f(avg(ranked[0]))}); lowest: ${ranked[ranked.length - 1].label} (${f(avg(ranked[ranked.length - 1]))}).`,
    };
  }

  if (input.kind === 'area') {
    const periods = [...new Set(allPeriods)];
    const total = periods.map((p) => ({ period: p, value: withData.reduce((acc, s) => acc + (s.observations.find((o) => o.period === p)?.value ?? 0), 0) }));
    const range = Math.max(...total.map((t) => t.value)) - Math.min(...total.map((t) => t.value));
    const first = total[0], last = total[total.length - 1];
    const latest = withData.map((s) => ({ s, v: s.observations.find((o) => o.period === last.period)?.value ?? null }));
    const biggest = latest.filter((x) => x.v != null).sort((a, b) => (b.v ?? 0) - (a.v ?? 0))[0];
    const share = biggest && last.value ? Math.round(((biggest.v ?? 0) / last.value) * 100) : null;
    return {
      long: `Stacked area chart, ${input.measure}, ${plural(withData.length, 'component')}, ${FREQ[input.frequency]}, ${formatPeriod(from)} to ${formatPeriod(to)}. Total: ${trendWord(first.value, last.value, range)}, from ${f(first.value)} to ${f(last.value)}. Largest component in ${formatPeriod(last.period)}: ${biggest?.s.label} (${share}% of the total). ${latest.map((x) => `${x.s.label} ${x.v == null ? 'no data' : f(x.v)}`).join('; ')}. ${quality}`,
      short: `Total ${verb(trendWord(first.value, last.value, range))} to ${f(last.value)}; ${biggest?.s.label} is the largest share (${share}%).`,
    };
  }

  // line
  const ref = withData.find((s) => s.id === input.referenceId) ?? withData[0];
  const rp = pts(ref);
  const { min, max } = extremes(rp);
  const firstR = rp[0], lastR = rp[rp.length - 1];
  const trend = trendWord(firstR.value, lastR.value, max.value - min.value);
  const latest = withData.map((s) => ({ s, p: pts(s).at(-1)! })).sort((a, b) => b.p.value - a.p.value || a.s.label.localeCompare(b.s.label));
  const changes = withData.map((s) => { const p = pts(s); return { s, c: p[p.length - 1].value - p[0].value }; }).sort((a, b) => Math.abs(b.c) - Math.abs(a.c) || a.s.label.localeCompare(b.s.label));
  const others = withData.length > 1 ? ` Highest latest: ${latest[0].s.label} ${f(latest[0].p.value)}. Lowest latest: ${latest[latest.length - 1].s.label} ${f(latest[latest.length - 1].p.value)}.` : '';
  const big = changes[0];
  return {
    long: `Line chart, ${input.measure}, ${plural(withData.length, 'series')}, ${FREQ[input.frequency]}, ${formatPeriod(from)} to ${formatPeriod(to)}. ${ref.label}: ${trend}, from ${f(firstR.value)} (${formatPeriod(firstR.period)}) to ${f(lastR.value)} (${formatPeriod(lastR.period)}${statusNote(lastR.status)}); low ${f(min.value)} (${formatPeriod(min.period)}); high ${f(max.value)} (${formatPeriod(max.period)}).${others} Largest change over the period: ${big.s.label}, ${formatChange(big.c, d)} ${input.changeUnit}. ${quality}`,
    short: `${ref.label} ${trend === 'broadly flat' ? 'was broadly flat' : verb(trend)} from ${f(firstR.value)} to ${f(lastR.value)}${withData.length > 1 ? `; ${latest[0].s.label} highest (${f(latest[0].p.value)}), ${latest[latest.length - 1].s.label} lowest (${f(latest[latest.length - 1].p.value)})` : ''}.`,
  };
}

function verb(t: string) { return t === 'rising' ? 'rose' : t === 'falling' ? 'fell' : 'stayed broadly flat'; }
function cap(s: string) { return s[0].toUpperCase() + s.slice(1); }
function ordinal(n: number) { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
