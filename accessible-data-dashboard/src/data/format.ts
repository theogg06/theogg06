import type { Frequency } from './types';

const LOCALE = 'en-GB';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** "2026-09" → "Sep 2026"; "2026-Q2" → "Q2 2026"; "2026-10-30" → "30 Oct 2026". */
export function formatPeriod(period: string, long = false): string {
  const q = /^(\d{4})-Q([1-4])$/.exec(period);
  if (q) return `Q${q[2]} ${q[1]}`;
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(period);
  if (d) return `${Number(d[3])} ${(long ? MONTHS_LONG : MONTHS)[Number(d[2]) - 1]} ${d[1]}`;
  const m = /^(\d{4})-(\d{2})$/.exec(period);
  if (m) return `${(long ? MONTHS_LONG : MONTHS)[Number(m[2]) - 1]} ${m[1]}`;
  return period;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function formatNumber(v: number | null | undefined, digits = 1): string {
  if (v == null || Number.isNaN(v)) return '—';
  return new Intl.NumberFormat(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v);
}

/** Signed change with a real minus sign, e.g. "+0.3", "−0.2", "0.0". */
export function formatChange(v: number | null | undefined, digits = 1): string {
  if (v == null || Number.isNaN(v)) return '—';
  const r = Number(v.toFixed(digits));
  if (r === 0) return formatNumber(0, digits);
  return (r > 0 ? '+' : '−') + formatNumber(Math.abs(r), digits);
}

export function formatValue(v: number | null | undefined, unit: string, digits = 1): string {
  if (v == null) return '—';
  if (unit === '%' || unit === '% of GDP') return `${formatNumber(v, digits)}%`;
  if (unit === 'EUR millions') return `€${formatNumber(v / 1e6, 2)}tn`;
  return formatNumber(v, digits === 1 ? 4 : digits);
}

/** Period → month index (months since year 0) for M; quarter end month for Q. */
export function periodToMonthIndex(period: string): number {
  const q = /^(\d{4})-Q([1-4])$/.exec(period);
  if (q) return Number(q[1]) * 12 + Number(q[2]) * 3 - 1;
  const m = /^(\d{4})-(\d{2})/.exec(period);
  if (m) return Number(m[1]) * 12 + Number(m[2]) - 1;
  return NaN;
}

export function monthIndexToPeriod(i: number): string {
  return `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}`;
}

/** Approximate period end as a UTC Date (used for staleness). */
export function periodEnd(period: string, freq: Frequency): Date {
  if (freq === 'D') return new Date(period + 'T23:59:59Z');
  const mi = periodToMonthIndex(period);
  return new Date(Date.UTC(Math.floor(mi / 12), (mi % 12) + 1, 0, 23, 59, 59));
}

/** UTC ms for chart x-axes (first day of the period). */
export function periodToUtc(period: string): number {
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) return Date.parse(period + 'T00:00:00Z');
  const mi = periodToMonthIndex(period);
  const q = /Q/.test(period);
  return Date.UTC(Math.floor(mi / 12), (mi % 12) - (q ? 2 : 0), 1);
}
