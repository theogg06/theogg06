import { describe, expect, it } from 'vitest';
import { dataQualitySentences, seriesSentence, summarize, trendWord } from './summarize';
import type { Series } from '../data/types';

const ser = (id: string, label: string, values: (number | null)[], start = '2025-01', status?: string): Series => {
  const [y, m] = start.split('-').map(Number);
  return {
    id, key: `K.${id}`, label,
    observations: values.map((v, i) => {
      const mi = y * 12 + (m - 1) + i;
      return { period: `${Math.floor(mi / 12)}-${String((mi % 12) + 1).padStart(2, '0')}`, value: v, ...(i === values.length - 1 && status ? { status } : {}) };
    }),
  };
};

const EA = ser('EA', 'Euro area', [2.5, 2.4, 2.2, 2.0, 2.1, 1.9], '2025-01', 'p');
const DE = ser('DE', 'Germany', [2.8, 2.6, 2.5, 2.4, 2.3, 2.2]);
const ES = ser('ES', 'Spain', [2.9, 3.0, 3.2, 3.1, 3.3, 3.4]);

describe('trendWord', () => {
  it('classifies rising, falling and flat with a 10%-of-range threshold', () => {
    expect(trendWord(1, 2, 1)).toBe('rising');
    expect(trendWord(2, 1, 1)).toBe('falling');
    expect(trendWord(2, 2.05, 1)).toBe('broadly flat');
  });
});

describe('summarize — line', () => {
  const s = summarize({ kind: 'line', measure: 'HICP annual rate of change in percent', valueSuffix: '%', changeUnit: 'percentage points', frequency: 'M', series: [EA, DE, ES], referenceId: 'EA' });

  it('is deterministic', () => {
    const again = summarize({ kind: 'line', measure: 'HICP annual rate of change in percent', valueSuffix: '%', changeUnit: 'percentage points', frequency: 'M', series: [EA, DE, ES], referenceId: 'EA' });
    expect(again).toEqual(s);
  });
  it('states chart type, measure, series count, frequency and range', () => {
    expect(s.long).toContain('Line chart, HICP annual rate of change in percent, 3 series, monthly, Jan 2025 to Jun 2025.');
  });
  it('describes the reference series trend, first, last, min, max and provisional status', () => {
    expect(s.long).toContain('Euro area: falling, from 2.5% (Jan 2025) to 1.9% (Jun 2025, provisional); low 1.9% (Jun 2025); high 2.5% (Jan 2025).');
  });
  it('names highest and lowest latest values and the largest change', () => {
    expect(s.long).toContain('Highest latest: Spain 3.4%. Lowest latest: Euro area 1.9%.');
    expect(s.long).toContain('Largest change over the period: Euro area, −0.6 percentage points.');
  });
  it('always states missing data, even when there is none', () => {
    expect(s.long).toContain('No missing values.');
  });
  it('produces a one-sentence visible caption', () => {
    expect(s.short).toBe('Euro area fell from 2.5% to 1.9%; Spain highest (3.4%), Euro area lowest (1.9%).');
  });
});

describe('summarize — data quality is never hidden', () => {
  it('reports missing series, stale data and out-of-range values', () => {
    const IT = ser('IT', 'Italy', [null, null, null, null, null, null]);
    const s = summarize({
      kind: 'line', measure: 'm', valueSuffix: '%', changeUnit: 'pp', frequency: 'M', series: [EA, IT], referenceId: 'EA',
      issues: [
        { kind: 'missing-series', seriesId: 'IT', message: 'Italy: no observations in this snapshot for the selected period' },
        { kind: 'stale', message: 'Latest data is for Jun 2025' },
        { kind: 'out-of-range', seriesId: 'EA', message: 'Euro area, May 2025: 21.0% is outside the expected range' },
      ],
    });
    expect(s.long).toContain('Missing data: Italy: no observations in this snapshot for the selected period.');
    expect(s.long).toContain('Stale: Latest data is for Jun 2025.');
    expect(s.long).toContain('1 value outside the expected range');
    expect(s.long).toContain('1 series');
  });
  it('dataQualitySentences defaults to "No missing values."', () => {
    expect(dataQualitySentences([])).toBe('No missing values.');
  });
  it('handles an empty selection without throwing', () => {
    const s = summarize({ kind: 'bar', measure: 'x', valueSuffix: '%', changeUnit: 'pp', frequency: 'M', series: [] });
    expect(s.short).toBe('No data for the current selection.');
  });
});

describe('summarize — bar, area, heatmap', () => {
  it('bar: ranks categories and places the reference', () => {
    const s = summarize({ kind: 'bar', measure: 'unemployment rate in percent', valueSuffix: '%', changeUnit: 'pp', frequency: 'M', series: [EA, DE, ES], referenceId: 'EA' });
    expect(s.long).toContain('Bar chart, unemployment rate in percent, 3 categories, Jun 2025, sorted highest first. Highest: Spain 3.4%. Lowest: Euro area 1.9%. Euro area: 1.9%, 3rd of 3.');
    expect(s.short).toBe('Spain highest (3.4%), Euro area lowest (1.9%); Euro area 1.9%.');
  });
  it('area: total trend and largest share', () => {
    const a = ser('house', 'House purchase', [5, 5.1, 5.2]);
    const b = ser('consumer', 'Consumer credit', [1, 1, 1]);
    const s = summarize({ kind: 'area', measure: 'loans', valueSuffix: ' tn', changeUnit: 'tn', frequency: 'M', series: [a, b], digits: 2 });
    expect(s.long).toContain('Total: rising, from 6.00 tn to 6.20 tn. Largest component in Mar 2025: House purchase (84% of the total).');
    expect(s.short).toBe('Total rose to 6.20 tn; House purchase is the largest share (84%).');
  });
  it('heatmap: extremes, averages and missing cells', () => {
    const DEm = ser('DE', 'Germany', [2.8, null, 2.5, 2.4, 2.3, 2.2]);
    const s = summarize({ kind: 'heatmap', measure: 'HICP', valueSuffix: '%', changeUnit: 'pp', frequency: 'M', series: [EA, DEm, ES] });
    expect(s.long).toContain('Highest cell: Spain 3.4% (Jun 2025). Lowest cell: Euro area 1.9% (Jun 2025).');
    expect(s.long).toContain('1 cell without data.');
    // Spain average 18.9 / 6 = 3.15 → 3.2 at one decimal
    expect(s.short).toBe('Highest on average: Spain (3.2%); lowest: Euro area (2.2%).');
  });
});

describe('seriesSentence (S key)', () => {
  it('summarises one series including missing count', () => {
    const x = ser('FR', 'France', [1.0, null, 1.4, 1.2]);
    expect(seriesSentence(x, '%')).toBe('France: rising, from 1.0% (Jan 2025) to 1.2% (Apr 2025); low 1.0% (Jan 2025); high 1.4% (Mar 2025); 3 values, 1 missing.');
  });
  it('handles an empty series', () => {
    expect(seriesSentence(ser('IT', 'Italy', [null, null]), '%')).toBe('Italy: no data in the selected period.');
  });
});
