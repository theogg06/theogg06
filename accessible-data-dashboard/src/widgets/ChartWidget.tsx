import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components';
import type { Snapshot, WidgetData } from '../data/types';
import { Badge, Button, IconButton, ViewToggle } from '../components/ui';
import { Icon } from '../components/Icon';
import { setState, useAppState, type ViewMode } from '../state/appState';
import { announce } from '../state/announcer';
import { formatDate } from '../data/format';
import { staleDays } from '../data/derive';
import type { Load } from './useWidgetData';
import type { Summary } from '../lib/summarize';
import { downloadCsv } from '../lib/csv';
import { openShortcuts } from '../components/ShortcutsDialog';

export interface WidgetRenderArgs { data: WidgetData; narrow: boolean; summaryId: string; titleId: string; summary: Summary; title: string; toTable: () => void }

export interface ChartWidgetProps {
  id: string;
  title: string;
  subtitle: string;
  load: Load & { retry: () => void };
  /** Derive the widget's series + issues from the snapshot (filters applied). */
  select: (snapshot: Snapshot) => WidgetData;
  summarize: (d: WidgetData) => Summary;
  renderChart: (a: WidgetRenderArgs) => ReactNode;
  renderTable: (a: WidgetRenderArgs) => ReactNode;
  /** Shown when the widget has nothing to show because nothing is selected yet. */
  emptyFirst?: { when: boolean; title: string; body: string; action: { label: string; onPress: () => void } };
  emptyFixes?: { label: string; onPress: () => void }[];
  narrow: boolean;
  csvName: string;
}

export function ChartWidget(p: ChartWidgetProps) {
  const app = useAppState();
  const view: ViewMode = app.views[p.id] ?? 'chart';
  const sim = app.sim[p.id];
  const titleId = useId();
  const summaryId = useId();
  const started = useRef(Date.now());
  const data = p.load.status === 'ready' ? p.select(p.load.snapshot) : null;
  const effectiveState = p.load.status === 'loading' ? 'loading' : p.load.status === 'error' ? 'error' : (sim === 'empty-first' || p.emptyFirst?.when) ? 'empty-first' : data!.state;
  const synthetic = (p.load.status === 'ready' && p.load.snapshot.synthetic) || (p.load.status === 'error' && p.load.synthetic);
  const summary = data && effectiveState !== 'empty-first' && effectiveState !== 'empty-no-results' ? p.summarize(data) : null;

  // Announce completion of slow loads and errors (4.1.3); nothing on fast initial loads.
  useEffect(() => {
    if (p.load.status === 'loading') { started.current = Date.now(); const t = setTimeout(() => announce(`Loading ${p.title} data…`), 1000); return () => clearTimeout(t); }
    if (p.load.status === 'error') announce(`${p.title} failed to load. ${p.load.error.cause_}`, 'assertive');
    else if (Date.now() - started.current > 1000) announce(`${p.title} loaded.`);
    return undefined;
  }, [p.load.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const setView = (v: ViewMode) => {
    setState((s) => ({ views: { ...s.views, [p.id]: v } }));
    announce(`${v === 'table' ? 'Table' : 'Chart'} view shown for ${p.title}.`);
  };
  const args = data && summary ? { data, narrow: p.narrow, summaryId, titleId, summary, title: p.title, toTable: () => setView('table') } : null;
  const days = data ? staleDays(data.snapshot, data.series) : null;
  const issues = data?.issues ?? [];

  return (
    <section className={`card widget ${p.narrow ? 'widget--narrow' : ''}`} aria-labelledby={titleId} aria-busy={p.load.status === 'loading'} data-widget={p.id} data-state={effectiveState}>
      <div className="widget__head">
        <h3 id={titleId} className="h3 widget__title">{p.title}</h3>
        <div className="widget__actions">
          <ViewToggle value={view} onChange={setView} label={`View for ${p.title}`} />
          <IconButton icon="keyboard" label={`Keyboard shortcuts for ${p.title}`} onPress={() => openShortcuts()} />
          <MenuTrigger>
            <IconButton icon="more" label={`More actions for ${p.title}`} />
            <Popover className="popover" placement="bottom end">
              <Menu className="menu" onAction={(k) => { if (k === 'csv' && data) downloadCsv(p.csvName, data); }}>
                <MenuItem id="csv" className="menu__item" isDisabled={!data}><Icon name="download" size={18} /> Download data (CSV)</MenuItem>
              </Menu>
            </Popover>
          </MenuTrigger>
        </div>
      </div>
      <p className="muted widget__sub">{p.subtitle}</p>

      <div className="widget__status">
        {synthetic && <Badge type="synthetic">Synthetic data</Badge>}
        {effectiveState === 'error' && <Badge type="error">Failed to load</Badge>}
        {data && effectiveState !== 'empty-first' && effectiveState !== 'empty-no-results' && <>
          {!issues.length && <Badge type="live">Up to date</Badge>}
          {issues.some((i) => i.kind === 'missing-series' || i.kind === 'missing-latest') && <Badge type="partial">{`Partial: ${data.series.filter((s) => !issues.some((i) => i.seriesId === s.id && (i.kind === 'missing-series' || i.kind === 'missing-latest'))).length} of ${data.series.length} series complete`}</Badge>}
          {issues.some((i) => i.kind === 'stale') && <Badge type="stale">{`Stale${days != null ? ` · ${days} days old` : ''}`}</Badge>}
          {issues.some((i) => i.kind === 'provisional') && <Badge type="provisional">Latest values provisional</Badge>}
          {issues.some((i) => i.kind === 'out-of-range') && <Badge type="out-of-range">{`${issues.filter((i) => i.kind === 'out-of-range').length} value(s) out of range`}</Badge>}
          <span className="muted small">Retrieved {formatDate(data.snapshot.retrievedAt)}</span>
        </>}
      </div>

      {effectiveState === 'loading' && (
        <div className="widget__body skeleton" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton__line" />)}
          <p className="muted">Loading {p.title.toLowerCase()} data…</p>
        </div>
      )}

      {effectiveState === 'error' && p.load.status === 'error' && (
        <div className="panel panel--danger">
          <p className="panel__title"><Icon name="error" /> {p.load.error.message}</p>
          <p>Cause: {p.load.error.cause_} No chart is shown, so you are not looking at outdated numbers by mistake.</p>
          <div className="row"><Button variant="primary" icon="refresh" onPress={p.load.retry}>Retry</Button></div>
        </div>
      )}

      {effectiveState === 'empty-first' && (
        <div className="panel panel--neutral center">
          <Icon name="chart" size={32} />
          <p className="h3">{p.emptyFirst?.title ?? 'Nothing selected yet'}</p>
          <p className="muted">{p.emptyFirst?.body ?? 'Choose what to compare using the filters above.'}</p>
          {p.emptyFirst && <Button variant="primary" icon="plus" onPress={p.emptyFirst.action.onPress}>{p.emptyFirst.action.label}</Button>}
        </div>
      )}

      {effectiveState === 'empty-no-results' && (
        <div className="panel panel--neutral center">
          <Icon name="search" size={32} />
          <p className="h3">No data for the current filters</p>
          <p className="muted">Nothing in this snapshot matches the selected countries and date range.</p>
          <div className="row">{(p.emptyFixes ?? []).map((f) => <Button key={f.label} variant="secondary" onPress={f.onPress}>{f.label}</Button>)}</div>
        </div>
      )}

      {args && effectiveState !== 'empty-first' && effectiveState !== 'empty-no-results' && (
        <>
          {issues.filter((i) => i.kind !== 'provisional').length > 0 && (
            <ul className={`panel ${issues.some((i) => i.kind === 'out-of-range') ? 'panel--danger' : 'panel--warning'} issue-list`} aria-label={`Data notes for ${p.title}`}>
              {issues.filter((i) => i.kind !== 'provisional').slice(0, 4).map((i, k) => <li key={k}><Icon name={i.kind === 'stale' ? 'clock' : i.kind === 'out-of-range' ? 'out-of-range' : 'partial'} size={18} /> {i.message}.</li>)}
              {issues.filter((i) => i.kind !== 'provisional').length > 4 && <li>…and {issues.filter((i) => i.kind !== 'provisional').length - 4} more (see table).</li>}
            </ul>
          )}
          {view === 'table' && <p id={summaryId} className="sr-only">{args.summary.long}</p>}
          <div className="widget__body">{view === 'chart' ? p.renderChart(args) : p.renderTable(args)}</div>
          <p className="widget__caption">{args.summary.short}</p>
        </>
      )}

      {data && (
        <footer className="widget__foot">
          <p className="small muted">Source: {data.snapshot.synthetic ? 'synthetic data generated in the browser (seeded)' : `${data.snapshot.source}, ${data.snapshot.title}`} · Retrieved {formatDate(data.snapshot.retrievedAt)}</p>
          <details className="data-notes">
            <summary>Data notes</summary>
            <dl>
              <dt>Dataset</dt><dd>{data.snapshot.title}</dd>
              <dt>Unit</dt><dd>{data.snapshot.unitLabel}</dd>
              <dt>Series keys</dt><dd>{data.series.map((s) => s.key || `${s.id} (not in snapshot)`).join(', ')}</dd>
              {data.snapshot.url && <><dt>Query</dt><dd className="break">{data.snapshot.url}</dd></>}
              <dt>Licence</dt><dd>{data.snapshot.licence}</dd>
              {data.snapshot.sourceUpdated && <><dt>Source last updated</dt><dd>{formatDate(data.snapshot.sourceUpdated)}</dd></>}
            </dl>
          </details>
        </footer>
      )}
    </section>
  );
}
