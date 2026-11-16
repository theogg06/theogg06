/**
 * App state lives in the URL query string so every view is shareable (JTBD J3)
 * and reproducible in usability sessions. Theme/density are NOT here (D-029).
 */
import { useSyncExternalStore } from 'react';
import { COUNTRIES, INDICATORS, type IndicatorId } from '../data/registry';
import { SIMULATABLE_STATES, type WidgetState } from '../data/types';

export type Page = 'overview' | 'detail';
export type ViewMode = 'chart' | 'table';
export interface SortState { column: string; dir: 'ascending' | 'descending' }

export interface AppState {
  page: Page;
  /** Country shown in the drill-down. */
  detailGeo: string;
  /** Inclusive month range, "YYYY-MM". `to` null = latest available. */
  from: string;
  to: string | null;
  countries: string[];
  indicators: IndicatorId[];
  /** Per-widget Chart/Table choice. */
  views: Record<string, ViewMode>;
  /** Per-widget simulated state (prototype controls / tests). */
  sim: Record<string, WidgetState>;
  sort: SortState;
}

export const DEFAULT_STATE: AppState = {
  page: 'overview',
  detailGeo: 'ES',
  from: '2023-01',
  to: null,
  countries: ['DE', 'FR', 'IT', 'ES'],
  indicators: INDICATORS.map((i) => i.id),
  views: {},
  sim: {},
  sort: { column: 'hicp', dir: 'descending' },
};

const COUNTRY_IDS = new Set(COUNTRIES.map((c) => c.id));
const IND_IDS = new Set<string>(INDICATORS.map((i) => i.id));
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

export function parseState(search: string): AppState {
  const q = new URLSearchParams(search);
  const s: AppState = structuredClone(DEFAULT_STATE);
  if (q.get('page') === 'detail') s.page = 'detail';
  const geo = q.get('geo'); if (geo && (COUNTRY_IDS.has(geo) || geo === 'EA')) s.detailGeo = geo;
  const from = q.get('from'); if (from && MONTH.test(from)) s.from = from;
  const to = q.get('to'); if (to && MONTH.test(to)) s.to = to;
  if (s.to && s.to < s.from) [s.from, s.to] = [s.to, s.from];
  if (q.has('c')) s.countries = (q.get('c') ?? '').split(',').filter((c) => COUNTRY_IDS.has(c));
  if (q.has('ind')) s.indicators = (q.get('ind') ?? '').split(',').filter((i): i is IndicatorId => IND_IDS.has(i));
  for (const [k, v] of q) {
    if (k.startsWith('t.') && (v === 'table' || v === 'chart')) s.views[k.slice(2)] = v;
    if (k.startsWith('sim.') && (SIMULATABLE_STATES as string[]).includes(v)) s.sim[k.slice(4)] = v as WidgetState;
  }
  const sort = q.get('sort'); if (sort) { const [column, dir] = sort.split(':'); if (column) s.sort = { column, dir: dir === 'asc' ? 'ascending' : 'descending' }; }
  return s;
}

/** Serialise only what differs from defaults (short, readable links). */
export function serializeState(s: AppState, { includeSim = true } = {}): string {
  const q = new URLSearchParams();
  if (s.page !== 'overview') q.set('page', s.page);
  if (s.page === 'detail') q.set('geo', s.detailGeo);
  if (s.from !== DEFAULT_STATE.from) q.set('from', s.from);
  if (s.to) q.set('to', s.to);
  if (s.countries.join() !== DEFAULT_STATE.countries.join()) q.set('c', s.countries.join(','));
  if (s.indicators.join() !== DEFAULT_STATE.indicators.join()) q.set('ind', s.indicators.join(','));
  for (const [w, v] of Object.entries(s.views)) if (v === 'table') q.set(`t.${w}`, v);
  if (includeSim) for (const [w, v] of Object.entries(s.sim)) if (v !== 'ready') q.set(`sim.${w}`, v);
  if (s.sort.column !== DEFAULT_STATE.sort.column || s.sort.dir !== DEFAULT_STATE.sort.dir) q.set('sort', `${s.sort.column}:${s.sort.dir === 'ascending' ? 'asc' : 'desc'}`);
  const str = q.toString();
  return str ? `?${str}` : '';
}

// ---- tiny external store bound to window.location ------------------------
type Listener = () => void;
const listeners = new Set<Listener>();
let current: AppState = typeof window === 'undefined' ? DEFAULT_STATE : parseState(window.location.search);

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => { current = parseState(window.location.search); listeners.forEach((l) => l()); });
}

let navigated = false;
/** True once the user has navigated inside the app (used to move focus to the new page's h1, not on first load). */
export function hasNavigated() { return navigated; }
export function getState() { return current; }

export function setState(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>), { push = false } = {}) {
  const p = typeof patch === 'function' ? patch(current) : patch;
  current = { ...current, ...p };
  const url = `${window.location.pathname}${serializeState(current)}${window.location.hash}`;
  window.history[push ? 'pushState' : 'replaceState'](null, '', url);
  if (push) navigated = true;
  listeners.forEach((l) => l());
}

export function replaceAll(next: AppState, { push = true } = {}) { setState(next, { push }); }

export function useAppState(): AppState {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => current, () => DEFAULT_STATE);
}

/** Absolute shareable link for the current state (without simulations). */
export function shareUrl(s: AppState = current): string {
  return `${window.location.origin}${window.location.pathname}${serializeState(s, { includeSim: false })}`;
}
