import { describe, expect, it } from 'vitest';
import { generateSeries, mulberry32, simulateState } from './synthetic';
import { detectIssues, stateFromIssues, toWidgetData } from './derive';
import { assignSlots } from './registry';
import { formatChange, formatPeriod, formatValue } from './format';
import { parseState, serializeState, DEFAULT_STATE } from '../state/appState';
import type { Snapshot } from './types';

const snap = (over: Partial<Snapshot> = {}): Snapshot => ({
  id: 'hicp', title: 't', source: 'Eurostat', licence: 'CC BY 4.0', url: 'u', retrievedAt: '2026-11-01T00:00:00Z', sourceUpdated: null,
  frequency: 'M', unit: '%', unitLabel: '%', synthetic: false,
  series: [
    { id: 'EA', key: 'EA', label: 'Euro area', observations: [{ period: '2026-08', value: 2.0 }, { period: '2026-09', value: 2.1 }] },
    { id: 'DE', key: 'DE', label: 'Germany', observations: [{ period: '2026-08', value: 2.2 }, { period: '2026-09', value: 2.3 }] },
    { id: 'ES', key: 'ES', label: 'Spain', observations: [{ period: '2026-08', value: 2.7 }, { period: '2026-09', value: 2.8 }] },
  ],
  ...over,
});

describe('synthetic generator', () => {
  it('is deterministic for a given seed', () => {
    const a = mulberry32(42), b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    const s1 = generateSeries({ id: 'X', label: 'X', level: 2, start: 3, volatility: 0.3 }, '2025-01', '2025-12');
    const s2 = generateSeries({ id: 'X', label: 'X', level: 2, start: 3, volatility: 0.3 }, '2025-01', '2025-12');
    expect(s1).toEqual(s2);
    expect(s1.observations).toHaveLength(12);
  });
  it('always marks simulated data as synthetic and never reuses real values', () => {
    const real = snap();
    const sim = simulateState(real, 'ready');
    expect(sim.synthetic).toBe(true);
    expect(sim.source).toBe('Synthetic');
    expect(sim.series[0].key.startsWith('SYNTH.')).toBe(true);
  });
  it('partial drops a visible series and truncates another', () => {
    const s = simulateState(snap({ series: [...snap().series, { id: 'IT', key: 'IT', label: 'Italy', observations: [{ period: '2026-08', value: 1 }, { period: '2026-09', value: 1 }] }] }), 'partial');
    const d = toWidgetData(s, s.series);
    expect(d.state).toBe('partial');
    expect(d.issues.some((i) => i.kind === 'missing-series' && i.seriesId === 'IT')).toBe(true);
  });
  it('out-of-range injects a value detected by detectIssues', () => {
    const s = simulateState(snap(), 'out-of-range');
    expect(detectIssues(s, s.series).some((i) => i.kind === 'out-of-range')).toBe(true);
  });
  it('stale removes the latest periods so the data lags its retrieval date', () => {
    const long = snap({ series: snap().series.map((x) => ({ ...x, observations: Array.from({ length: 12 }, (_, i) => ({ period: `2025-${String(i + 1).padStart(2, '0')}`, value: 2 })) })), retrievedAt: '2026-01-10T00:00:00Z' });
    const s = simulateState(long, 'stale');
    expect(toWidgetData(s, s.series).state).toBe('stale');
  });
});

describe('detectIssues / stateFromIssues', () => {
  it('fresh complete data is ready', () => {
    const s = snap();
    expect(toWidgetData(s, s.series).state).toBe('ready');
  });
  it('flags stale data relative to the snapshot retrieval date', () => {
    const s = snap({ retrievedAt: '2027-03-01T00:00:00Z' });
    expect(detectIssues(s, s.series).some((i) => i.kind === 'stale')).toBe(true);
  });
  it('flags a series that ends before the others', () => {
    const s = snap();
    s.series[1].observations[1].value = null;
    const issues = detectIssues(s, s.series);
    expect(issues.find((i) => i.kind === 'missing-latest')?.message).toBe('Germany: no data after Aug 2026');
    expect(stateFromIssues(issues, 3)).toBe('partial');
  });
});

describe('assignSlots (colour follows the entity)', () => {
  it('keeps preferred slots and is stable when a country is removed', () => {
    const a = assignSlots(['DE', 'FR', 'IT', 'ES']);
    const b = assignSlots(['DE', 'IT', 'ES']);
    expect(a.get('EA')).toBe(1);
    for (const id of ['DE', 'IT', 'ES']) expect(b.get(id)).toBe(a.get(id));
  });
  it('resolves collisions to a free slot', () => {
    const s = assignSlots(['DE', 'BE']);
    expect(new Set([s.get('DE'), s.get('BE')]).size).toBe(2);
  });
});

describe('format', () => {
  it('formats periods, changes and values', () => {
    expect(formatPeriod('2026-09')).toBe('Sep 2026');
    expect(formatPeriod('2026-Q2')).toBe('Q2 2026');
    expect(formatChange(-0.2)).toBe('−0.2');
    expect(formatChange(0.04)).toBe('0.0');
    expect(formatValue(2.345, '%')).toBe('2.3%');
  });
});

describe('URL state', () => {
  it('round-trips filters and per-widget views, and rejects invalid input', () => {
    const s = parseState('?from=2024-01&to=2026-06&c=DE,ES,XX&ind=hicp,debt&t.inflation=table&sort=country:asc&sim.heatmap=error');
    expect(s.countries).toEqual(['DE', 'ES']);
    expect(s.views.inflation).toBe('table');
    expect(s.sim.heatmap).toBe('error');
    const q = serializeState(s, { includeSim: false });
    expect(q).not.toContain('sim.');
    expect(parseState(q)).toEqual({ ...s, sim: {} });
  });
  it('defaults serialise to an empty query', () => {
    expect(serializeState(DEFAULT_STATE)).toBe('');
  });
});
