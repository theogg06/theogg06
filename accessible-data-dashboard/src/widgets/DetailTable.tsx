import { Badge, Button } from '../components/ui';
import { Icon } from '../components/Icon';
import type { Load } from './useWidgetData';
import { EA, COUNTRIES, GEO_LABEL } from '../data/registry';
import { clipRange, detectIssues, lastObservation, previousObservation } from '../data/derive';
import { formatChange, formatNumber, formatPeriod } from '../data/format';
import { setState, useAppState } from '../state/appState';
import { announce } from '../state/announcer';
import type { Series, Snapshot } from '../data/types';

type Col = { id: string; label: string; numeric: boolean };
const COLS: Col[] = [
  { id: 'country', label: 'Country', numeric: false },
  { id: 'hicp', label: 'Inflation (%)', numeric: true },
  { id: 'hicpChange', label: 'Change vs prior month (pp)', numeric: true },
  { id: 'unemp', label: 'Unemployment (%)', numeric: true },
  { id: 'debt', label: 'Gov. debt (% of GDP)', numeric: true },
];

interface Row { id: string; label: string; hicp: number | null; hicpChange: number | null; unemp: number | null; debt: number | null; status: { type: 'live' | 'stale' | 'partial' | 'provisional' | 'synthetic'; label: string } }

const at = (snap: Snapshot | null, geo: string, to: string) => {
  const s = snap?.series.find((x) => x.id === geo);
  return s ? clipRange(s, undefined, to) : undefined;
};

/** Sortable detail table (aria-sort on <th>, sort buttons inside headers). */
export function DetailTable({ hicp, unemp, debt, countries, to }: { hicp: Load & { retry: () => void }; unemp: Load & { retry: () => void }; debt: Load & { retry: () => void }; countries: string[]; to: string }) {
  const { sort } = useAppState();
  const loads = [hicp, unemp, debt];
  const caption = 'Country comparison, latest available period';
  if (loads.some((l) => l.status === 'loading')) {
    return <div className="card table-card" aria-busy="true"><p className="table-card__cap">{caption}</p><div className="skeleton" aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <div key={i} className="skeleton__line" />)}</div><p className="muted small">Loading rows…</p></div>;
  }
  const failed = loads.filter((l) => l.status === 'error');
  const snap = (l: Load) => (l.status === 'ready' ? l.snapshot : null);
  const [H, U, D] = [snap(hicp), snap(unemp), snap(debt)];
  const geos = [EA.id, ...(countries.length ? countries : COUNTRIES.map((c) => c.id))];
  const synthetic = [H, U, D].some((x) => x?.synthetic);

  const rows: Row[] = geos.map((g) => {
    const h = at(H, g, to), u = at(U, g, to), d = at(D, g, to);
    const hl = h && lastObservation(h); const hp = h && hl ? previousObservation(h, hl.period) : undefined;
    const ser = [h, u, d].filter(Boolean) as Series[];
    const issues = [H && h ? detectIssues(H, [h]) : [], U && u ? detectIssues(U, [u]) : [], D && d ? detectIssues(D, [d]) : []].flat();
    const missing = [h, u, d].some((x) => !x || !lastObservation(x));
    const status: Row['status'] = synthetic ? { type: 'synthetic', label: 'Synthetic' }
      : missing ? { type: 'partial', label: 'Some values missing' }
        : issues.some((i) => i.kind === 'stale') ? { type: 'stale', label: 'Stale' }
          : issues.some((i) => i.kind === 'provisional') ? { type: 'provisional', label: 'Provisional' }
            : { type: 'live', label: 'Up to date' };
    void ser;
    return { id: g, label: GEO_LABEL[g] ?? g, hicp: hl?.value ?? null, hicpChange: hl?.value != null && hp?.value != null ? hl.value - hp.value : null, unemp: u ? lastObservation(u)?.value ?? null : null, debt: d ? lastObservation(d)?.value ?? null : null, status };
  });
  const dir = sort.dir === 'ascending' ? 1 : -1;
  rows.sort((a, b) => {
    if (sort.column === 'country') return a.label.localeCompare(b.label) * dir;
    const k = sort.column as keyof Row;
    const av = a[k] as number | null, bv = b[k] as number | null;
    if (av == null && bv == null) return 0; if (av == null) return 1; if (bv == null) return -1;
    return (av - bv) * dir;
  });
  const periods = [H, U, D].map((x) => x && x.series.find((s) => s.id === 'EA')).map((s) => (s ? lastObservation(clipRange(s, undefined, to))?.period : undefined));

  const sortBy = (col: Col) => {
    const next = sort.column === col.id ? (sort.dir === 'ascending' ? 'descending' : 'ascending') : col.numeric ? 'descending' : 'ascending';
    setState({ sort: { column: col.id, dir: next } });
    announce(`Table sorted by ${col.label}, ${next}.`);
  };

  return (
    <div className="card table-card">
      {failed.length > 0 && <div className="panel panel--danger"><p className="panel__title"><Icon name="error" /> Some columns couldn't be loaded</p><p>{failed.map((f) => f.status === 'error' ? f.error.message : '').join('; ')}. Other columns are shown.</p><Button icon="refresh" onPress={() => failed.forEach((f) => f.retry())}>Retry</Button></div>}
      <div className="table-scroll" role="region" aria-labelledby="detail-cap" tabIndex={0}>
        <table className="data-table data-table--detail">
          <caption id="detail-cap">
            <span className="table-card__cap">{caption}</span>
            <span className="muted small"> Inflation: {periods[0] ? formatPeriod(periods[0]) : 'n/a'} · Unemployment: {periods[1] ? formatPeriod(periods[1]) : 'n/a'} · Debt: {periods[2] ? formatPeriod(periods[2]) : 'n/a'}{synthetic ? ' · includes synthetic data' : ''}</span>
          </caption>
          <thead>
            <tr>
              {COLS.map((c) => (
                <th key={c.id} scope="col" aria-sort={sort.column === c.id ? sort.dir : undefined} className={c.numeric ? 'num' : ''}>
                  <button type="button" className="sort-btn" onClick={() => sortBy(c)}>
                    {c.label}
                    <Icon name={sort.column === c.id ? (sort.dir === 'ascending' ? 'arrow-up' : 'arrow-down') : 'arrow-updown'} size={16} />
                  </button>
                </th>
              ))}
              <th scope="col">Data status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <th scope="row" className={r.id === 'EA' ? 'strong' : ''}>
                  {r.id === 'EA' ? r.label : <a href={`?page=detail&geo=${r.id}`} onClick={(e) => { e.preventDefault(); setState({ page: 'detail', detailGeo: r.id }, { push: true }); }}>{r.label}</a>}
                </th>
                <Num v={r.hicp} />
                <td className="num">{r.hicpChange == null ? <NA /> : <span className="change"><Icon name={Math.abs(r.hicpChange) < 0.05 ? 'trend-flat' : r.hicpChange > 0 ? 'trend-up' : 'trend-down'} size={16} />{formatChange(r.hicpChange)}</span>}</td>
                <Num v={r.unemp} />
                <Num v={r.debt} />
                <td><Badge type={r.status.type}>{r.status.label}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const NA = () => <><span aria-hidden="true">—</span><span className="sr-only">Not available</span></>;
const Num = ({ v }: { v: number | null }) => <td className="num">{v == null ? <NA /> : formatNumber(v)}</td>;
