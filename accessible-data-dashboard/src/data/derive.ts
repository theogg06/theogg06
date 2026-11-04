import type { DataIssue, Observation, Series, Snapshot, WidgetData, WidgetState } from './types';
import { DATASETS, GEO_LABEL } from './registry';
import { formatPeriod, formatValue, periodEnd, periodToMonthIndex } from './format';

const DAY = 86_400_000;
const PERIOD_DAYS = { M: 31, Q: 92, D: 1 } as const;

export function lastObservation(s: Series): Observation | undefined {
  for (let i = s.observations.length - 1; i >= 0; i--) if (s.observations[i].value != null) return s.observations[i];
  return undefined;
}

export function previousObservation(s: Series, period: string): Observation | undefined {
  const idx = s.observations.findIndex((o) => o.period === period);
  for (let i = idx - 1; i >= 0; i--) if (s.observations[i].value != null) return s.observations[i];
  return undefined;
}

/** Same period one year earlier (12 months / 4 quarters back). */
export function yearAgo(s: Series, period: string): Observation | undefined {
  const target = /Q/.test(period) ? `${Number(period.slice(0, 4)) - 1}${period.slice(4)}` : `${Number(period.slice(0, 4)) - 1}${period.slice(4)}`;
  return s.observations.find((o) => o.period === target && o.value != null);
}

/** Keep only periods within [from, to] (inclusive; month granularity). */
export function clipRange(s: Series, from?: string, to?: string): Series {
  const a = from ? periodToMonthIndex(from) : -Infinity;
  const b = to ? periodToMonthIndex(to) : Infinity;
  return { ...s, observations: s.observations.filter((o) => { const m = periodToMonthIndex(o.period); return m >= a && m <= b; }) };
}

export function maxPeriod(series: Series[]): string | undefined {
  return series.map((s) => lastObservation(s)?.period).filter((p): p is string => !!p).sort().at(-1);
}

export interface SelectOptions { geos?: string[]; from?: string; to?: string; includeEA?: boolean }

/** Select series (EA first, then geos in the given order) and clip to the date range. */
export function selectSeries(snapshot: Snapshot, { geos, from, to, includeEA = true }: SelectOptions): Series[] {
  const wanted = geos ? [...(includeEA ? ['EA'] : []), ...geos.filter((g) => g !== 'EA')] : snapshot.series.map((s) => s.id);
  return wanted.map((id) => {
    const s = snapshot.series.find((x) => x.id === id);
    const base: Series = s ?? { id, key: '', label: GEO_LABEL[id] ?? id, observations: [] };
    return clipRange(base, from, to);
  });
}

/** Detect data-quality issues shown as badges and stated in summaries. */
export function detectIssues(snapshot: Snapshot, series: Series[]): DataIssue[] {
  const meta = DATASETS[snapshot.id];
  const issues: DataIssue[] = [];
  const latest = maxPeriod(series);

  for (const s of series) {
    const last = lastObservation(s);
    if (!last) { issues.push({ kind: 'missing-series', seriesId: s.id, message: `${s.label}: no observations in this snapshot for the selected period` }); continue; }
    if (latest && last.period !== latest) issues.push({ kind: 'missing-latest', seriesId: s.id, message: `${s.label}: no data after ${formatPeriod(last.period)}` });
    const [lo, hi] = meta.plausible;
    for (const o of s.observations) {
      if (o.value != null && (o.value < lo || o.value > hi)) issues.push({ kind: 'out-of-range', seriesId: s.id, message: `${s.label}, ${formatPeriod(o.period)}: ${formatValue(o.value, snapshot.unit)} is outside the expected range` });
    }
    if (last.status && /^[pPE]$/.test(last.status)) issues.push({ kind: 'provisional', seriesId: s.id, message: `${s.label}, ${formatPeriod(last.period)} is ${last.status === 'E' ? 'estimated' : 'provisional'}` });
  }

  if (latest) {
    const age = (Date.parse(snapshot.retrievedAt) - periodEnd(latest, snapshot.frequency).getTime()) / DAY;
    const limit = meta.publicationLagDays + PERIOD_DAYS[snapshot.frequency] + 10;
    if (age > limit) issues.push({ kind: 'stale', message: `Latest data is for ${formatPeriod(latest)}; a newer release was expected about ${Math.round(age - limit + 10)} days before this snapshot was taken` });
  }
  return issues;
}

export function stateFromIssues(issues: DataIssue[], seriesCount: number): WidgetState {
  if (seriesCount === 0) return 'empty-no-results';
  if (issues.some((i) => i.kind === 'out-of-range')) return 'out-of-range';
  if (issues.some((i) => i.kind === 'missing-series' || i.kind === 'missing-latest')) return 'partial';
  if (issues.some((i) => i.kind === 'stale')) return 'stale';
  return 'ready';
}

export function toWidgetData(snapshot: Snapshot, series: Series[]): WidgetData {
  const issues = detectIssues(snapshot, series);
  const hasData = series.some((s) => s.observations.some((o) => o.value != null));
  return { snapshot, series, issues, state: hasData ? stateFromIssues(issues, series.length) : 'empty-no-results' };
}

/** Age in whole days between period end and retrieval (for "Stale · N days"). */
export function staleDays(snapshot: Snapshot, series: Series[]): number | null {
  const latest = maxPeriod(series);
  if (!latest) return null;
  return Math.round((Date.parse(snapshot.retrievedAt) - periodEnd(latest, snapshot.frequency).getTime()) / DAY);
}
