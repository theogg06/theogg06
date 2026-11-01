import { Badge, Button } from '../components/ui';
import { Icon } from '../components/Icon';
import type { Load } from './useWidgetData';

export interface KpiValue {
  value: string;
  /** Change vs comparison period, e.g. +0.3. null = unknown. */
  change: number | null;
  /** Text after the direction word, e.g. "0.1 pp vs Aug 2026". */
  changeText: string;
  context: string;
  footer: string;
  badges: { type: 'partial' | 'stale' | 'provisional' | 'out-of-range' | 'synthetic'; label: string }[];
}

/** KPI card: value + direction as icon AND words (never colour alone), source + as-of date always visible. */
export function KpiCard({ id, label, load, compute }: { id: string; label: string; load: Load & { retry: () => void }; compute: () => KpiValue | null }) {
  const v = load.status === 'ready' ? compute() : null;
  const dir = v?.change == null ? null : Math.abs(v.change) < 0.05 ? 'flat' : v.change > 0 ? 'up' : 'down';
  return (
    <li className="card kpi" data-kpi={id} aria-busy={load.status === 'loading'}>
      <h3 id={`kpi-${id}`} className="kpi__label">{label}</h3>
      {load.status === 'loading' && <div className="skeleton" aria-hidden="true"><div className="skeleton__line skeleton__line--big" /><div className="skeleton__line" /></div>}
      {load.status === 'loading' && <p className="muted small">Loading…</p>}
      {load.status === 'error' && (
        <>
          <p className="kpi__value"><span aria-hidden="true">—</span><span className="sr-only">Value unavailable</span></p>
          <p className="kpi__error"><Icon name="error" size={18} /> Couldn't load. {load.error.cause_}</p>
          <Button variant="ghost" icon="refresh" onPress={load.retry}>Retry</Button>
        </>
      )}
      {load.status === 'ready' && !v && <><p className="kpi__value">No data</p><p className="muted small">Nothing in the selected period.</p></>}
      {v && (
        <>
          <p className="kpi__value">{v.value}</p>
          <p className="kpi__delta">
            {dir && <Icon name={dir === 'up' ? 'trend-up' : dir === 'down' ? 'trend-down' : 'trend-flat'} size={18} />}
            <span>{dir === 'up' ? 'Up ' : dir === 'down' ? 'Down ' : dir === 'flat' ? 'Unchanged ' : ''}{v.changeText}</span>
          </p>
          <p className="muted small">{v.context}</p>
          {v.badges.length > 0 && <div className="kpi__badges">{v.badges.map((b) => <Badge key={b.label} type={b.type}>{b.label}</Badge>)}</div>}
          <p className="muted small kpi__foot">{v.footer}</p>
        </>
      )}
    </li>
  );
}
