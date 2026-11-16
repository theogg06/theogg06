import { useState } from 'react';
import type { Series } from '../data/types';
import { formatNumber, formatPeriod } from '../data/format';
import { Button } from '../components/ui';

/**
 * Table alternative for time-series charts: periods as row headers
 * (newest first), series as columns, unit in the caption. Lives in a
 * labelled, focusable scroll region so it can scroll horizontally on its own.
 */
export function TimeSeriesTable({ id, caption, series, digits = 1, scale = 1, initialRows = 12 }: { id: string; caption: string; series: Series[]; digits?: number; scale?: number; initialRows?: number }) {
  const periods = [...new Set(series.flatMap((s) => s.observations.map((o) => o.period)))].sort().reverse();
  const [all, setAll] = useState(false);
  const rows = all ? periods : periods.slice(0, initialRows);
  const capId = `${id}-caption`;
  return (
    <div className="table-block">
      <div className="table-scroll" role="region" aria-labelledby={capId} tabIndex={0}>
        <table className="data-table">
          <caption id={capId}>{caption}{rows.length < periods.length ? ` Showing the latest ${rows.length} of ${periods.length} periods.` : ''}</caption>
          <thead>
            <tr><th scope="col">Period</th>{series.map((s) => <th key={s.id} scope="col" className="num">{s.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p}>
                <th scope="row">{formatPeriod(p)}</th>
                {series.map((s) => {
                  const o = s.observations.find((x) => x.period === p);
                  const v = o?.value;
                  return <td key={s.id} className="num">{v == null ? <span><span aria-hidden="true">—</span><span className="sr-only">Not available</span></span> : <>{formatNumber(v / scale, digits)}{o?.status && /^[pPE]$/.test(o.status) ? <abbr title={o.status === 'E' ? 'estimated' : 'provisional'} className="obs-flag"> {o.status.toLowerCase()}</abbr> : null}</>}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {periods.length > initialRows && <Button variant="ghost" className="btn--small" onPress={() => setAll((a) => !a)}>{all ? `Show latest ${initialRows} only` : `Show all ${periods.length} periods`}</Button>}
    </div>
  );
}

export function CategoryTable({ id, caption, rows, valueHeader, digits = 1 }: { id: string; caption: string; rows: { label: string; value: number | null; strong?: boolean }[]; valueHeader: string; digits?: number }) {
  const capId = `${id}-caption`;
  return (
    <div className="table-scroll" role="region" aria-labelledby={capId} tabIndex={0}>
      <table className="data-table">
        <caption id={capId}>{caption}</caption>
        <thead><tr><th scope="col">Rank</th><th scope="col">Country</th><th scope="col" className="num">{valueHeader}</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.label}><td>{i + 1}</td><th scope="row" className={r.strong ? 'strong' : ''}>{r.label}</th><td className="num">{r.value == null ? '—' : formatNumber(r.value, digits)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MatrixTable({ id, caption, series, periods }: { id: string; caption: string; series: Series[]; periods: string[] }) {
  const capId = `${id}-caption`;
  return (
    <div className="table-scroll" role="region" aria-labelledby={capId} tabIndex={0}>
      <table className="data-table data-table--matrix">
        <caption id={capId}>{caption}</caption>
        <thead><tr><th scope="col">Country</th>{periods.map((p) => <th key={p} scope="col" className="num">{formatPeriod(p)}</th>)}</tr></thead>
        <tbody>
          {series.map((s) => (
            <tr key={s.id}><th scope="row">{s.label}</th>{periods.map((p) => { const v = s.observations.find((o) => o.period === p)?.value; return <td key={p} className="num">{v == null ? <><span aria-hidden="true">—</span><span className="sr-only">Not available</span></> : formatNumber(v)}</td>; })}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
