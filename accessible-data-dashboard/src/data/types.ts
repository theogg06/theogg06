/** Shared data types. Snapshot files in public/data follow `Snapshot` exactly. */

export type Frequency = 'M' | 'Q' | 'D';

export interface Observation {
  /** "2026-09" (M), "2026-Q2" (Q) or "2026-10-30" (D). */
  period: string;
  value: number | null;
  /** Source observation status, e.g. "E" estimated, "P"/"p" provisional. */
  status?: string;
}

export interface Series {
  /** Our id: geo code (EA, DE, …), currency (USD) or component id. */
  id: string;
  /** Source series key, e.g. "M.U2.N.000000.4.ANR" or "une_rt_m.DE". */
  key: string;
  label: string;
  sourceTitle?: string;
  observations: Observation[];
}

export interface Snapshot {
  id: DatasetId;
  title: string;
  source: 'ECB' | 'Eurostat' | 'Synthetic';
  licence: string;
  url: string;
  retrievedAt: string;
  sourceUpdated: string | null;
  frequency: Frequency;
  unit: string;
  unitLabel: string;
  synthetic: boolean;
  series: Series[];
}

export type DatasetId = 'hicp' | 'unemployment' | 'debt' | 'fx' | 'fx-daily' | 'lending';

/** Data states every widget can be in (design/SPEC.md §3). */
export type WidgetState =
  | 'ready'
  | 'loading'
  | 'empty-first'
  | 'empty-no-results'
  | 'error'
  | 'partial'
  | 'stale'
  | 'out-of-range';

export const SIMULATABLE_STATES: WidgetState[] = ['ready', 'loading', 'empty-first', 'empty-no-results', 'error', 'partial', 'stale', 'out-of-range'];

export interface DataIssue {
  kind: 'missing-series' | 'missing-latest' | 'stale' | 'out-of-range' | 'provisional';
  seriesId?: string;
  message: string;
}

export interface WidgetData {
  snapshot: Snapshot;
  /** Series after filtering (geo + date range), in display order. */
  series: Series[];
  issues: DataIssue[];
  /** Overall state derived from issues, or forced by a simulation. */
  state: WidgetState;
}
