import { useMemo } from 'react';
import { ChartWidget } from '../widgets/ChartWidget';
import { KpiCard, type KpiValue } from '../widgets/KpiCard';
import { useSnapshot, useWidth, type Load } from '../widgets/useWidgetData';
import { TimeSeriesTable, CategoryTable, MatrixTable } from '../widgets/tables';
import { DetailTable } from '../widgets/DetailTable';
import { ChartRegion } from '../charts/ChartRegion';
import { formatValue } from '../data/format';
import { buildBar, buildHeatmap, buildLine, buildStackedArea } from '../charts/builders';
import { FilterBar } from '../components/Filters';
import { PageActions } from '../components/ViewDialogs';
import { setState, useAppState } from '../state/appState';
import { usePrefs } from '../state/prefs';
import { COUNTRIES, DATASETS, MAX_CHART_COUNTRIES, assignSlots } from '../data/registry';
import { clipRange, lastObservation, maxPeriod, previousObservation, selectSeries, toWidgetData, detectIssues } from '../data/derive';
import { formatChange, formatDate, formatNumber, formatPeriod, monthIndexToPeriod, periodToMonthIndex } from '../data/format';
import { summarize } from '../lib/summarize';
import type { Snapshot, WidgetData } from '../data/types';
import { KeyList } from '../charts/KeyList';

const FIRST_PERIOD = '2019-01';

export function Overview() {
  const s = useAppState();
  const prefs = usePrefs();
  const [mainRef, mainW] = useWidth<HTMLDivElement>();
  const narrow = mainW < 520;
  const renderKey = `${prefs.resolvedTheme}-${prefs.density}-${prefs.forced}`;

  const hicp = useSnapshot('hicp', s.sim.inflation);
  const hicpHeat = useSnapshot('hicp', s.sim.heatmap);
  const unemp = useSnapshot('unemployment', s.sim.unemployment);
  const lending = useSnapshot('lending', s.sim.lending);
  const debt = useSnapshot('debt', s.sim['kpi-debt']);
  const fx = useSnapshot('fx-daily', s.sim['kpi-fx']);
  const kHicp = useSnapshot('hicp', s.sim['kpi-hicp']);
  const kUnemp = useSnapshot('unemployment', s.sim['kpi-unemployment']);
  const tHicp = useSnapshot('hicp', s.sim.table);
  const tUnemp = useSnapshot('unemployment', s.sim.table);
  const tDebt = useSnapshot('debt', s.sim.table);

  const lastPeriod = hicp.status === 'ready' && !hicp.snapshot.synthetic ? maxPeriod(hicp.snapshot.series) ?? '2026-09' : unemp.status === 'ready' ? maxPeriod(unemp.snapshot.series) ?? '2026-09' : '2026-09';
  const to = s.to ?? lastPeriod;
  const chartCountries = s.countries.slice(0, MAX_CHART_COUNTRIES);
  const slots = useMemo(() => assignSlots(chartCountries), [chartCountries.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const show = (id: string) => s.indicators.includes(id as never);
  const retrieved = hicp.status === 'ready' ? hicp.snapshot.retrievedAt : null;
  const emptyFixes = [
    { label: 'Show all dates', onPress: () => setState({ from: FIRST_PERIOD, to: null }) },
    { label: 'Reset countries', onPress: () => setState({ countries: ['DE', 'FR', 'IT', 'ES'] }) },
  ];

  return (
    <div ref={mainRef} className="page">
      <div className="page__head">
        <div>
          <h1 className="display">Euro area overview</h1>
          <p className="muted">Latest observation: {formatPeriod(lastPeriod)}{retrieved ? ` · Snapshot retrieved ${formatDate(retrieved)}` : ''}</p>
        </div>
        <PageActions />
      </div>

      <FilterBar firstPeriod={FIRST_PERIOD} lastPeriod={lastPeriod} />

      <section aria-labelledby="kpi-h" className="section">
        <h2 id="kpi-h" className="h2">Key indicators</h2>
        <ul className="kpi-grid">
          {show('hicp') && <KpiCard id="hicp" label="Euro area inflation (HICP)" load={kHicp} compute={() => kpiRate(kHicp, 'EA', 'ECB medium-term target: 2.0%', 'vs')} />}
          {show('unemployment') && <KpiCard id="unemployment" label="Unemployment rate, euro area" load={kUnemp} compute={() => {
            const v = kpiRate(kUnemp, 'EA', '', 'vs'); if (!v || kUnemp.status !== 'ready') return v;
            const latest = COUNTRIES.map((c) => ({ c, o: lastObservation(kUnemp.snapshot.series.find((x) => x.id === c.id) ?? { id: '', key: '', label: '', observations: [] }) })).filter((x) => x.o?.value != null).sort((a, b) => (a.o!.value! - b.o!.value!));
            return { ...v, context: latest.length ? `Lowest: ${latest[0].c.label} ${formatNumber(latest[0].o!.value)}% · Highest: ${latest.at(-1)!.c.label} ${formatNumber(latest.at(-1)!.o!.value)}%` : '' };
          }} />}
          <KpiCard id="fx" label="EUR/USD reference rate" load={fx} compute={() => kpiFx(fx)} />
          {show('debt') && <KpiCard id="debt" label="Government debt, euro area" load={debt} compute={() => kpiRate(debt, 'EA', 'General government gross debt, % of GDP', 'vs')} />}
        </ul>
      </section>

      <section aria-labelledby="trends-h" className="section">
        <h2 id="trends-h" className="h2">Trends</h2>
        <div className={`widget-grid ${mainW < 1100 ? 'widget-grid--single' : ''}`}>
          {show('hicp') && <ChartWidget id="inflation" narrow={narrow} csvName="inflation" title="Inflation: euro area vs selected countries" subtitle="HICP all items, annual rate of change, % · monthly"
            load={hicp} emptyFixes={emptyFixes}
            select={(snap) => toWidgetData(snap, selectSeries(snap, { geos: chartCountries, from: s.from, to }))}
            summarize={(d) => summarize({ kind: 'line', measure: 'HICP annual rate of change in percent', valueSuffix: '%', changeUnit: 'percentage points', frequency: 'M', series: d.series, referenceId: 'EA', issues: d.issues })}
            renderChart={({ data, narrow: n, summary, title, toTable }) => (
              <div>
                <ChartRegion title={title} description={summary.long} series={data.series} valueSuffix="%" onTable={toTable} renderKey={renderKey} height={n ? 260 : 320}
                  options={buildLine({ series: data.series, slots, unit: '%', valueSuffix: '%', endLabels: !n, plausible: DATASETS.hicp.plausible })}
                  describePoint={pointText('%')} onEnter={drill} />
                {n && <KeyList items={data.series.map((x) => ({ id: x.id, label: x.label, slot: slots.get(x.id) ?? 1, value: lastObservation(x)?.value ?? null }))} suffix="%" />}
                {s.countries.length > MAX_CHART_COUNTRIES && <p className="small muted">Chart shows the first {MAX_CHART_COUNTRIES} selected countries; the table shows all.</p>}
              </div>
            )}
            renderTable={({ data }) => <TimeSeriesTable id="inflation-table" caption="Inflation (HICP annual rate of change, %) by month, newest first." series={data.series} />}
          />}
          {show('unemployment') && <ChartWidget id="unemployment" narrow={narrow} csvName="unemployment" title="Unemployment by country" subtitle="% of labour force, seasonally adjusted · latest month"
            load={unemp} emptyFixes={emptyFixes}
            select={(snap) => { const ser = selectSeries(snap, { geos: s.countries.length ? s.countries : COUNTRIES.map((c) => c.id), to }); return toWidgetData(snap, ser); }}
            summarize={(d) => summarize({ kind: 'bar', measure: 'unemployment rate in percent', valueSuffix: '%', changeUnit: 'pp', frequency: 'M', series: d.series.filter((x) => lastObservation(x)), referenceId: 'EA', issues: d.issues })}
            renderChart={({ data, narrow: n, summary, title, toTable }) => {
              const items = data.series.map((x) => ({ id: x.id, label: x.label, value: lastObservation(x)?.value ?? null, highlight: x.id === 'EA' })).filter((i) => i.value != null).sort((a, b) => (b.value! - a.value!));
              const ordered = items.map((i) => data.series.find((x) => x.id === i.id)!);
              return <ChartRegion title={title} description={summary.long} series={[{ id: 'bar', key: '', label: 'Unemployment rate by country', observations: ordered.map((x) => ({ period: x.label, value: lastObservation(x)?.value ?? null })) }]} valueSuffix="%" onTable={toTable} renderKey={renderKey}
                height={Math.max(220, items.length * (n ? 40 : 34) + 40)} options={buildBar({ items, unit: '%', valueSuffix: '%' })}
                describePoint={(pt) => `${pt.name}: ${formatValue(pt.y ?? null, '%')}`} onEnter={(pt) => { const id = (pt.options as { custom?: { id?: string } }).custom?.id; if (!id || id === 'EA') return false; setState({ page: 'detail', detailGeo: id }, { push: true }); return true; }} />;
            }}
            renderTable={({ data }) => { const rows = data.series.map((x) => ({ label: x.label, value: lastObservation(x)?.value ?? null, strong: x.id === 'EA' })).sort((a, b) => (b.value ?? -1) - (a.value ?? -1)); return <CategoryTable id="unemp-table" caption={`Unemployment rate (%), ${formatPeriod(maxPeriod(data.series) ?? to)}, highest first.`} rows={rows} valueHeader="Unemployment (%)" />; }}
          />}
          {show('lending') && <ChartWidget id="lending" narrow={narrow} csvName="household-lending" title="Loans to households by purpose" subtitle="Euro area, outstanding amounts, € trillion · monthly"
            load={lending} emptyFixes={emptyFixes}
            select={(snap) => toWidgetData(snap, ['house', 'consumer', 'other'].map((id) => clipRange(snap.series.find((x) => x.id === id) ?? { id, key: '', label: id, observations: [] }, s.from, to)))}
            summarize={(d) => summarize({ kind: 'area', measure: 'loans to euro area households by purpose, € trillion outstanding', valueSuffix: ' tn', changeUnit: 'tn', frequency: 'M', series: d.series, issues: d.issues, scale: 1e6, digits: 2 })}
            renderChart={({ data, narrow: n, summary, title, toTable }) => (
              <div>
                <ChartRegion title={title} description={summary.long} series={data.series.map((x) => ({ ...x, observations: x.observations.map((o) => ({ ...o, value: o.value == null ? null : o.value / 1e6 })) }))} valueSuffix=" tn" onTable={toTable} renderKey={renderKey} height={n ? 260 : 320}
                  options={buildStackedArea({ series: data.series, slots: [1, 2, 3], valueSuffix: ' tn', scale: 1e6, scaleLabel: '€ trillion', endLabels: !n })}
                  describePoint={pointText(' tn', 2)} />
                {n && <KeyList items={data.series.map((x, i) => ({ id: x.id, label: x.label, slot: i + 1, value: (lastObservation(x)?.value ?? NaN) / 1e6, pattern: true }))} suffix=" tn" digits={2} />}
              </div>
            )}
            renderTable={({ data }) => <TimeSeriesTable id="lending-table" caption="Loans to euro area households by purpose, € trillion outstanding, newest first." series={data.series} scale={1e6} digits={3} />}
          />}
          {show('hicp') && <ChartWidget id="heatmap" narrow={narrow} csvName="inflation-heatmap" title="Inflation heatmap, last 12 months" subtitle="HICP annual rate, % · value shown in each cell"
            load={hicpHeat} emptyFixes={emptyFixes}
            select={(snap) => { const toI = periodToMonthIndex(to); return toWidgetData(snap, selectSeries(snap, { geos: s.countries, from: monthIndexToPeriod(toI - 11), to })); }}
            summarize={(d) => summarize({ kind: 'heatmap', measure: 'HICP annual rate of change in percent', valueSuffix: '%', changeUnit: 'pp', frequency: 'M', series: d.series, issues: d.issues })}
            renderChart={({ data, narrow: n, summary, title, toTable }) => {
              const toI = periodToMonthIndex(maxPeriod(data.series) ?? to);
              const periods = Array.from({ length: 12 }, (_, i) => monthIndexToPeriod(toI - 11 + i));
              return n
                ? <MatrixTable id="heat-narrow" caption="Narrow screens show the heatmap as a table. HICP annual rate, %." series={data.series} periods={periods} />
                : <ChartRegion title={title} description={summary.long} series={data.series} valueSuffix="%" onTable={toTable} renderKey={renderKey} height={Math.max(200, data.series.length * 34 + 90)}
                    options={buildHeatmap({ series: data.series, periods, valueSuffix: '%', bins: [1, 2, 3, 4] })}
                    describePoint={(pt) => { const q = pt as typeof pt & { value: number | null; custom: { period: string } }; return `${data.series[q.y ?? 0]?.label}, ${formatPeriod(q.custom.period)}: ${q.value == null ? 'no data' : formatValue(q.value, '%')}`; }}
                    onEnter={(pt) => { const id = data.series[pt.y ?? -1]?.id; if (!id || id === 'EA') return false; setState({ page: 'detail', detailGeo: id }, { push: true }); return true; }} />;
            }}
            renderTable={({ data }) => { const toI = periodToMonthIndex(maxPeriod(data.series) ?? to); return <MatrixTable id="heat-table" caption="HICP annual rate of change (%), countries by month." series={data.series} periods={Array.from({ length: 12 }, (_, i) => monthIndexToPeriod(toI - 11 + i))} />; }}
          />}
        </div>
      </section>

      <section aria-labelledby="details-h" className="section">
        <div className="section__head"><h2 id="details-h" className="h2">Details</h2><p className="muted small">Select a column header to sort. Select a country to open its detail view.</p></div>
        <DetailTable hicp={tHicp} unemp={tUnemp} debt={tDebt} countries={s.countries} to={to} />
      </section>
    </div>
  );
}

const drill = (pt: { series: { options: { id?: string } } }) => { const id = pt.series.options.id; if (!id || id === 'EA') return false; setState({ page: 'detail', detailGeo: id }, { push: true }); return true; };
const pointText = (suffix: string, digits = 1) => (pt: { series: { name: string }; y?: number | null; options: unknown }) => `${pt.series.name}, ${formatPeriod(((pt.options as { custom?: { period?: string } }).custom?.period) ?? '')}: ${pt.y == null ? 'no data' : formatNumber(pt.y, digits) + suffix}`;

/** Rate KPIs: latest value, change vs previous period in pp. */
function kpiRate(load: Load, geo: string, context: string, _vs: string): KpiValue | null {
  void _vs;
  if (load.status !== 'ready') return null;
  const snap = load.snapshot;
  const ser = snap.series.find((x) => x.id === geo);
  if (!ser) return null;
  const last = lastObservation(ser);
  if (!last) return null;
  const prev = previousObservation(ser, last.period);
  const change = prev?.value != null && last.value != null ? last.value - prev.value : null;
  return {
    value: `${formatNumber(last.value)}%`,
    change,
    changeText: change == null ? 'no comparison available' : `${Math.abs(change) < 0.05 ? '' : formatChange(change).replace(/^[+−]/, '') + ' pp '}vs ${formatPeriod(prev!.period)}`,
    context,
    footer: `${snap.synthetic ? 'Synthetic data' : snap.source} · ${formatPeriod(last.period)} · retrieved ${formatDate(snap.retrievedAt)}`,
    badges: kpiBadges(snap, [ser], last.status),
  };
}

function kpiFx(load: Load): KpiValue | null {
  if (load.status !== 'ready') return null;
  const snap = load.snapshot;
  const ser = snap.series[0];
  const obs = ser?.observations.filter((o) => o.value != null) ?? [];
  const last = obs.at(-1); const monthAgo = obs.at(-22) ?? obs[0];
  if (!last || last.value == null) return null;
  const change = monthAgo?.value ? ((last.value - monthAgo.value) / monthAgo.value) * 100 : null;
  return {
    value: formatNumber(last.value, 4),
    change,
    changeText: change == null ? 'no comparison available' : `${Math.abs(change) < 0.05 ? '' : formatChange(change).replace(/^[+−]/, '') + '% '}vs ${formatPeriod(monthAgo!.period)}`,
    context: `US dollars per euro, ECB reference rate of ${formatPeriod(last.period)}`,
    footer: `${snap.synthetic ? 'Synthetic data' : 'ECB'} · EXR · retrieved ${formatDate(snap.retrievedAt)}`,
    badges: kpiBadges(snap, [ser], last.status),
  };
}

function kpiBadges(snap: Snapshot, series: WidgetData['series'], status?: string): KpiValue['badges'] {
  const issues = detectIssues(snap, series);
  const b: KpiValue['badges'] = [];
  if (snap.synthetic) b.push({ type: 'synthetic', label: 'Synthetic data' });
  if (issues.some((i) => i.kind === 'stale')) b.push({ type: 'stale', label: 'Stale' });
  if (issues.some((i) => i.kind === 'out-of-range')) b.push({ type: 'out-of-range', label: 'Outside expected range' });
  if (status && /^[pPE]$/.test(status)) b.push({ type: 'provisional', label: status === 'E' ? 'Estimated' : 'Provisional' });
  return b;
}
export { DATASETS };
