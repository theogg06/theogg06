import { useEffect, useState } from 'react';
import { Label, ListBox, ListBoxItem, Popover, Select, SelectValue, Button as RACButton, Disclosure, DisclosurePanel, Heading } from 'react-aria-components';
import { Overview } from './pages/Overview';
import { DrillDown } from './pages/DrillDown';
import { Button, LiveRegions, SkipLink, ToastRegion } from './components/ui';
import { Icon } from './components/Icon';
import { ShortcutsDialog, openShortcuts } from './components/ShortcutsDialog';
import { DEFAULT_STATE, replaceAll, setState, useAppState } from './state/appState';
import { DENSITY_LABEL, THEME_LABEL, setPrefs, usePrefs, type Density, type ThemePref } from './state/prefs';
import { announce } from './state/announcer';
import { clearAllViews, defaultView } from './state/savedViews';
import { clearSnapshotCache } from './data/snapshots';
import { SIMULATABLE_STATES, type WidgetState } from './data/types';
import { parseState } from './state/appState';

const WIDGETS: [string, string][] = [['inflation', 'Inflation chart'], ['unemployment', 'Unemployment chart'], ['lending', 'Lending chart'], ['heatmap', 'Heatmap'], ['table', 'Detail table'], ['kpi-hicp', 'KPI: inflation'], ['kpi-unemployment', 'KPI: unemployment'], ['kpi-fx', 'KPI: EUR/USD'], ['kpi-debt', 'KPI: debt'], ['detail', 'Drill-down chart']];
const STATE_LABEL: Record<WidgetState, string> = { ready: 'Real data (no simulation)', loading: 'Loading', 'empty-first': 'Empty: first use', 'empty-no-results': 'Empty: no results', error: 'Error', partial: 'Partial data', stale: 'Stale data', 'out-of-range': 'Out-of-range value' };

function PrefSelect<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Record<T, string>; onChange: (v: T) => void }) {
  return (
    <Select className="field field--inline field--compact" selectedKey={value} onSelectionChange={(k) => k && onChange(k as T)}>
      <Label className="field__label">{label}</Label>
      <RACButton className="field__control"><SelectValue /><Icon name="chevron-down" /></RACButton>
      <Popover className="popover" placement="bottom end"><ListBox className="listbox" items={Object.entries(options).map(([id, l]) => ({ id, l: l as string }))}>{(o) => <ListBoxItem id={o.id} className="listbox__item" textValue={o.l}><Icon name="check" size={16} className="listbox__check" />{o.l}</ListBoxItem>}</ListBox></Popover>
    </Select>
  );
}

function AppBar() {
  const s = useAppState();
  const prefs = usePrefs();
  const [menu, setMenu] = useState(false);
  return (
    <header className="appbar">
      <div className="appbar__brand">
        <span className="appbar__logo" aria-hidden="true"><Icon name="chart" /></span>
        <span><span className="appbar__name">Euro Area Monitor</span><span className="appbar__tag">Prototype</span></span>
      </div>
      <button type="button" className="btn btn--secondary appbar__menu-btn" aria-expanded={menu} aria-controls="appbar-menu" onClick={() => setMenu((m) => !m)}><Icon name="menu" /><span>Menu</span></button>
      <div id="appbar-menu" className={`appbar__menu ${menu ? 'is-open' : ''}`}>
        <nav aria-label="Primary" className="appbar__nav">
          <a href="./" aria-current={s.page === 'overview' ? 'page' : undefined} onClick={(e) => { e.preventDefault(); setState({ page: 'overview' }, { push: true }); setMenu(false); }}>Overview</a>
          <a href={`?page=detail&geo=${s.detailGeo}`} aria-current={s.page === 'detail' ? 'page' : undefined} onClick={(e) => { e.preventDefault(); setState({ page: 'detail' }, { push: true }); setMenu(false); }}>Country detail</a>
        </nav>
        <div className="appbar__prefs" role="group" aria-label="Display settings">
          <PrefSelect<ThemePref> label="Theme" value={prefs.theme} options={THEME_LABEL} onChange={(t) => { setPrefs({ theme: t }); announce(`Theme: ${THEME_LABEL[t]}.`); }} />
          <PrefSelect<Density> label="Density" value={prefs.density} options={DENSITY_LABEL} onChange={(d) => { setPrefs({ density: d }); announce(`Density: ${DENSITY_LABEL[d]}.`); }} />
          <Button variant="ghost" icon="keyboard" onPress={openShortcuts}>Shortcuts</Button>
        </div>
      </div>
    </header>
  );
}

/** Facilitator controls for usability sessions: simulate per-widget states, reset everything. */
function PrototypeControls() {
  const s = useAppState();
  return (
    <Disclosure className="proto">
      <Heading level={2} className="proto__h"><RACButton slot="trigger" className="proto__trigger"><Icon name="synthetic" /> Prototype controls (for test sessions)</RACButton></Heading>
      <DisclosurePanel className="proto__panel">
        <p className="small muted">Simulated states replace real values with seeded synthetic data and are always labelled "Synthetic data". They are stored in the URL (sim.*), so a facilitator can prepare a link per task.</p>
        <div className="proto__grid">
          {WIDGETS.map(([id, label]) => (
            <PrefSelect<WidgetState> key={id} label={label} value={s.sim[id] ?? 'ready'} options={Object.fromEntries(SIMULATABLE_STATES.map((k) => [k, STATE_LABEL[k]])) as Record<WidgetState, string>}
              onChange={(v) => { setState((st) => ({ sim: { ...st.sim, [id]: v } })); announce(`${label}: ${STATE_LABEL[v]}.`); }} />
          ))}
        </div>
        <div className="row">
          <Button icon="reset" onPress={() => { setState({ sim: {} }); announce('All simulations cleared.'); }}>Clear simulations</Button>
          <Button variant="danger" icon="reset" onPress={() => {
            clearAllViews();
            try { localStorage.removeItem('add.prefs.v1'); } catch { /* ignore */ }
            setPrefs({ theme: 'system', density: 'comfortable' });
            clearSnapshotCache();
            replaceAll(DEFAULT_STATE, { push: false });
            announce('Prototype reset: saved views, display settings and filters cleared.');
          }}>Reset prototype (facilitator)</Button>
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}

export function App() {
  const s = useAppState();
  useEffect(() => {
    // Open the user's default saved view on a fresh visit (no query string).
    if (!window.location.search) { const v = defaultView(); if (v) replaceAll(parseState(v.query), { push: false }); }
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === '?' && !/INPUT|TEXTAREA|SELECT/.test(t.tagName) && !t.isContentEditable && !t.closest('[data-chart-keys]')) { e.preventDefault(); openShortcuts(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => { if (s.page === 'overview') document.title = 'Euro area overview — Euro Area Monitor (accessible dashboard prototype)'; }, [s.page]);

  return (
    <>
      <SkipLink />
      <AppBar />
      <p className="notice" role="note"><Icon name="info" size={18} /> Real data snapshots from the ECB Data Portal and Eurostat. States that public data cannot show (errors, gaps, out-of-range values) use synthetic data and are labelled "Synthetic data".</p>
      <main id="main" tabIndex={-1}>
        {s.page === 'detail' ? <DrillDown /> : <Overview />}
      </main>
      <footer className="footer">
        <div>
          <h2 className="small strong">Data sources & licences</h2>
          <p className="small muted">ECB Data Portal (SDMX API): reuse permitted with source acknowledgement. Eurostat: CC BY 4.0. Snapshots are fetched at build time; see each widget's data notes for the query and retrieval date. Synthetic data: seed 20261031.</p>
        </div>
        <div>
          <h2 className="small strong">Accessibility</h2>
          <ul className="small link-list">
            <li><a href="https://github.com/theogg06/theogg06/blob/claude/exciting-ptolemy-j2k6bk/accessible-data-dashboard/docs/ACCESSIBILITY-STATEMENT.md">Accessibility statement</a></li>
            <li><button type="button" className="linklike" onClick={openShortcuts}>Keyboard shortcuts</button></li>
            <li><a href="https://github.com/theogg06/theogg06/issues/new?title=Accessibility%20problem">Report an accessibility problem</a></li>
          </ul>
        </div>
        <div>
          <h2 className="small strong">Prototype</h2>
          <p className="small muted">Portfolio project, not financial advice. No analytics, no tracking, no cookies. Highcharts used under its non-commercial licence.</p>
        </div>
        <PrototypeControls />
      </footer>
      <ToastRegion />
      <ShortcutsDialog />
      <LiveRegions />
    </>
  );
}
