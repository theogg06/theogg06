import type { DatasetId } from './types';

export interface Geo { id: string; label: string; /** preferred categorical slot (2–6); EA is always slot 1 */ slot: number }

/** Euro area reference + the countries available in every snapshot. */
export const EA: Geo = { id: 'EA', label: 'Euro area', slot: 1 };
export const COUNTRIES: Geo[] = [
  { id: 'DE', label: 'Germany', slot: 2 },
  { id: 'FR', label: 'France', slot: 3 },
  { id: 'IT', label: 'Italy', slot: 4 },
  { id: 'ES', label: 'Spain', slot: 5 },
  { id: 'NL', label: 'Netherlands', slot: 6 },
  { id: 'BE', label: 'Belgium', slot: 2 },
  { id: 'AT', label: 'Austria', slot: 3 },
  { id: 'PT', label: 'Portugal', slot: 4 },
  { id: 'GR', label: 'Greece', slot: 5 },
  { id: 'FI', label: 'Finland', slot: 6 },
  { id: 'IE', label: 'Ireland', slot: 2 },
];
export const GEO_LABEL: Record<string, string> = Object.fromEntries([EA, ...COUNTRIES].map((g) => [g.id, g.label]));

/** Max countries drawn in a multi-series chart (EA + 5 = the 6 encoding slots). */
export const MAX_CHART_COUNTRIES = 5;

/**
 * Stable slot assignment (DECISIONS.md D-040): each country keeps its
 * preferred slot when free; collisions take the next free slot in canonical
 * order. Removing a country never changes the slots of the others that
 * keep their preferred slot, so "colour follows the entity, not its rank".
 */
export function assignSlots(geoIds: string[]): Map<string, number> {
  const out = new Map<string, number>([['EA', 1]]);
  const used = new Set([1]);
  const ordered = COUNTRIES.filter((c) => geoIds.includes(c.id));
  const pending: string[] = [];
  for (const c of ordered) {
    if (!used.has(c.slot)) { out.set(c.id, c.slot); used.add(c.slot); } else pending.push(c.id);
  }
  for (const id of pending) {
    const free = [2, 3, 4, 5, 6].find((s) => !used.has(s));
    if (free == null) break; // more than 5 countries: caller limits the chart
    out.set(id, free); used.add(free);
  }
  return out;
}

export interface DatasetMeta {
  id: DatasetId;
  short: string;
  /** Days after period end when the next observation is normally published. */
  publicationLagDays: number;
  /** Plausible value range; values outside are flagged "out of range". */
  plausible: [number, number];
  sourceName: string;
}

export const DATASETS: Record<DatasetId, DatasetMeta> = {
  hicp: { id: 'hicp', short: 'Inflation (HICP)', publicationLagDays: 20, plausible: [-5, 25], sourceName: 'ECB Data Portal, ICP' },
  unemployment: { id: 'unemployment', short: 'Unemployment', publicationLagDays: 35, plausible: [0, 35], sourceName: 'Eurostat, une_rt_m' },
  debt: { id: 'debt', short: 'Government debt', publicationLagDays: 130, plausible: [0, 300], sourceName: 'Eurostat, gov_10q_ggdebt' },
  fx: { id: 'fx', short: 'Exchange rates', publicationLagDays: 5, plausible: [0.01, 1000], sourceName: 'ECB Data Portal, EXR' },
  'fx-daily': { id: 'fx-daily', short: 'EUR/USD daily', publicationLagDays: 4, plausible: [0.3, 3], sourceName: 'ECB Data Portal, EXR' },
  lending: { id: 'lending', short: 'Household lending', publicationLagDays: 35, plausible: [0, 2e7], sourceName: 'ECB Data Portal, BSI' },
};

/** Indicator filter ids → datasets/widgets they control. */
export const INDICATORS = [
  { id: 'hicp', label: 'Inflation' },
  { id: 'unemployment', label: 'Unemployment' },
  { id: 'lending', label: 'Household lending' },
  { id: 'debt', label: 'Government debt' },
] as const;
export type IndicatorId = (typeof INDICATORS)[number]['id'];
