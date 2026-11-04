import { useEffect, useRef } from 'react';
import { ChartWidget } from '../widgets/ChartWidget';
import { KpiCard } from '../widgets/KpiCard';
import { useSnapshot, useWidth } from '../widgets/useWidgetData';
import { TimeSeriesTable } from '../widgets/tables';
import { ChartRegion } from '../charts/ChartRegion';
import { DATASETS } from '../data/registry';
import { buildLine } from '../charts/builders';
import { KeyList } from '../charts/KeyList';
import { PageActions } from '../components/ViewDialogs';
import { Select, Label, Button as RACButton, SelectValue, Popover, ListBox, ListBoxItem } from 'react-aria-components';
import { Icon } from '../components/Icon';
import { hasNavigated, setState, useAppState } from '../state/appState';
import { usePrefs } from '../state/prefs';
import { COUNTRIES, GEO_LABEL, assignSlots } from '../data/registry';
import { lastObservation, maxPeriod, previousObservation, selectSeries, toWidgetData } from '../data/derive';
import { formatChange, formatDate, formatNumber, formatPeriod } from '../data/format';
import { summarize } from '../lib/summarize';
import { announce } from '../state/announcer';

export function DrillDown() {
  const s = useAppState();
  const prefs = usePrefs();
  const geo = s.detailGeo === 'EA' ? 'ES' : s.detailGeo;
  const name = GEO_LABEL[geo] ?? geo;
  const hicp = useSnapshot('hicp', s.sim.detail);
  const [ref, w] = useWidth<HTMLDivElement>();
  const narrow = w < 520;
  const h1 = useRef<HTMLHeadingElement>(null);
  const slots = assignSlots([geo]);
  useEffect(() => { document.title = `${name}: inflation vs euro area — Euro Area Monitor`; if (hasNavigated()) h1.current?.focus(); }, [name]);

  const snap = hicp.status === 'ready' ? hicp.snapshot : null;
  const to = s.to ?? (snap ? maxPeriod(snap.series) : undefined);
  const series = snap ? selectSeries(snap, { geos: [geo], from: s.from, to }) : [];
  const [ea, cty] = [series.find((x) => x.id === 'EA'), series.find((x) => x.id === geo)];
  const gapSeries = ea && cty ? { id: 'GAP', key: '', label: `Gap: ${name} minus euro area`, observations: cty.observations.map((o) => { const e = ea.observations.find((x) => x.period === o.period)?.value; return { period: o.period, value: o.value != null && e != null ? Math.round((o.value - e) * 10) / 10 : null }; }) } : null;

  const kpi = (ser: typeof cty, label: string, unit: 'pct' | 'pp', context: string) => () => {
    if (!ser || !snap) return null;
    const last = lastObservation(ser); if (!last) return null;
    const prev = previousObservation(ser, last.period);
    const ch = prev?.value != null && last.value != null ? last.value - prev.value : null;
    void label;
    return { value: unit === 'pp' ? `${formatChange(last.value)} pp` : `${formatNumber(last.value)}%`, change: ch, changeText: ch == null ? 'no comparison available' : `${Math.abs(ch) < 0.05 ? '' : formatChange(ch).replace(/^[+−]/, '') + ' pp '}vs ${formatPeriod(prev!.period)}`, context, footer: `${snap.synthetic ? 'Synthetic data' : snap.source} · ${formatPeriod(last.period)}`, badges: snap.synthetic ? [{ type: 'synthetic' as const, label: 'Synthetic data' }] : [] };
  };
  const above = gapSeries ? gapSeries.observations.filter((o) => (o.value ?? 0) > 0).length : 0;
  const total = gapSeries ? gapSeries.observations.filter((o) => o.value != null).length : 0;

  return (
    <div ref={ref} className="page">
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <ol>
          <li><a href="./" onClick={(e) => { e.preventDefault(); setState({ page: 'overview' }, { push: true }); }}>Overview</a></li>
          <li><span>Inflation</span></li>
          <li><span aria-current="page">{name}</span></li>
        </ol>
      </nav>
      <div className="page__head">
        <div>
          <h1 className="display" ref={h1} tabIndex={-1}>{name}: inflation compared with the euro area</h1>
          <p className="muted">HICP annual rate of change, % · {formatPeriod(s.from)} – {to ? formatPeriod(to) : 'latest'} · monthly</p>
        </div>
        <PageActions />
      </div>
      <Select className="field field--inline" selectedKey={geo} onSelectionChange={(k) => { if (k) { setState({ detailGeo: String(k) }, { push: true }); announce(`Showing ${GEO_LABEL[String(k)]}.`); } }}>
        <Label className="field__label">Country</Label>
        <RACButton className="field__control"><SelectValue /><Icon name="chevron-down" /></RACButton>
        <Popover className="popover"><ListBox className="listbox" items={COUNTRIES}>{(c) => <ListBoxItem id={c.id} className="listbox__item">{c.label}</ListBoxItem>}</ListBox></Popover>
      </Select>

      <section aria-labelledby="latest-h" className="section">
      <h2 id="latest-h" className="h2">Latest values</h2>
      <ul className="kpi-grid kpi-grid--3">
        <KpiCard id="d-country" label={`${name}, latest`} load={hicp} compute={kpi(cty, name, 'pct', `Above the euro area in ${above} of ${total} months shown`)} />
        <KpiCard id="d-ea" label="Euro area, latest" load={hicp} compute={kpi(ea, 'EA', 'pct', 'ECB medium-term target: 2.0%')} />
        <KpiCard id="d-gap" label={`Gap: ${name} minus euro area`} load={hicp} compute={kpi(gapSeries ?? undefined, 'gap', 'pp', 'Positive = higher inflation than the euro area')} />
      </ul>
      </section>

      <div className="detail-grid">
        <ChartWidget id="detail" narrow={narrow} csvName={`inflation-${geo}`} title={`Monthly inflation, ${name} vs euro area`} subtitle="HICP all items, annual rate of change, %"
          load={hicp}
          select={(sn) => toWidgetData(sn, selectSeries(sn, { geos: [geo], from: s.from, to }))}
          summarize={(d) => summarize({ kind: 'line', measure: 'HICP annual rate of change in percent', valueSuffix: '%', changeUnit: 'percentage points', frequency: 'M', series: d.series, referenceId: 'EA', issues: d.issues })}
          renderChart={({ data, narrow: n, summary, title, toTable }) => (
            <div>
              <ChartRegion sonify title={title} description={summary.long} series={data.series} valueSuffix="%" onTable={toTable} renderKey={`${prefs.resolvedTheme}-${prefs.density}-${prefs.forced}-${geo}`} height={n ? 260 : 360}
                options={buildLine({ series: data.series, slots, unit: '%', valueSuffix: '%', endLabels: !n, referenceLine: { value: 2, label: 'ECB target 2.0%' }, plausible: DATASETS.hicp.plausible })}
                describePoint={(pt) => `${pt.series.name}, ${formatPeriod(((pt.options as { custom?: { period?: string } }).custom?.period) ?? '')}: ${pt.y == null ? 'no data' : formatNumber(pt.y) + '%'}`} />
              {n && <KeyList items={data.series.map((x) => ({ id: x.id, label: x.label, slot: slots.get(x.id) ?? 1, value: lastObservation(x)?.value ?? null }))} suffix="%" />}
            </div>
          )}
          renderTable={({ data }) => <TimeSeriesTable id="detail-table" caption={`Inflation (HICP annual rate, %): ${name} and euro area by month, newest first, with the gap in percentage points.`} series={gapSeries ? [...data.series, gapSeries] : data.series} />}
        />
        <aside className="card about" aria-labelledby="about-h">
          <h2 id="about-h" className="h3">About this data</h2>
          {snap ? (
            <dl>
              <dt>Dataset</dt><dd>{snap.title}</dd>
              <dt>Series keys</dt><dd className="break">{series.map((x) => x.key).join(', ')}</dd>
              <dt>Frequency</dt><dd>Monthly</dd>
              <dt>Unit</dt><dd>{snap.unitLabel}: change versus the same month a year earlier</dd>
              <dt>Coverage</dt><dd>{cty ? `${cty.observations.filter((o) => o.value != null).length} of ${cty.observations.length} months have values` : 'n/a'}</dd>
              <dt>Retrieved</dt><dd>{formatDate(snap.retrievedAt)}{snap.synthetic ? ' (synthetic data)' : ''}</dd>
              <dt>Revisions</dt><dd>The latest month is often a flash estimate and can be revised. Provisional values are marked "p" in the table.</dd>
              <dt>Licence</dt><dd>{snap.licence}</dd>
            </dl>
          ) : <p className="muted">Loading…</p>}
          {snap?.url && <p><a href={snap.url} target="_blank" rel="noreferrer">Open the source query<span className="sr-only"> (opens in a new tab)</span> ↗</a></p>}
        </aside>
      </div>
    </div>
  );
}
