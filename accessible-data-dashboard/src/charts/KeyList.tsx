import { slotStyle, patternFill } from './highcharts';
import { formatNumber } from '../data/format';

/**
 * Key list shown BELOW the chart at narrow widths (< 520px), replacing end
 * labels. Each entry repeats the series' dash sample + marker (or pattern
 * swatch) so identity never depends on colour alone. Sorted by latest value.
 */
export function KeyList({ items, suffix, digits = 1 }: { items: { id: string; label: string; slot: number; value: number | null; pattern?: boolean }[]; suffix: string; digits?: number }) {
  const sorted = [...items].sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));
  return (
    <ul className="key-list" aria-label="Series key, latest values">
      {sorted.map((it) => {
        const st = slotStyle(it.slot);
        const dash = { Solid: '', ShortDash: '6 4', Dot: '1 4', DashDot: '10 4 2 4', LongDash: '14 5', ShortDot: '2 3' }[st.dashStyle] ?? '';
        const fill = patternFill(it.slot);
        return (
          <li key={it.id}>
            <svg width="32" height="14" aria-hidden="true" focusable="false" className="key-list__swatch">
              {it.pattern ? (
                <>
                  <defs>{typeof fill !== 'string' && <pattern id={`kp-${it.id}`} width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill={st.color} /><path d={(fill as unknown as { pattern: { path: { d: string } } }).pattern.path.d} stroke="var(--color-bg-surface)" strokeWidth="1.6" fill="none" /></pattern>}</defs>
                  <rect x="1" y="1" width="30" height="12" rx="2" fill={typeof fill === 'string' ? fill : `url(#kp-${it.id})`} stroke="var(--color-border-strong)" />
                </>
              ) : (
                <>
                  <line x1="2" y1="7" x2="30" y2="7" stroke={st.color} strokeWidth={st.lineWidth} strokeDasharray={dash} strokeLinecap="round" />
                  <Marker symbol={st.symbol} color={st.color} />
                </>
              )}
            </svg>
            <span>{it.label} {it.value == null || Number.isNaN(it.value) ? <em>no data</em> : `${formatNumber(it.value, digits)}${suffix}`}</span>
          </li>
        );
      })}
    </ul>
  );
}

function Marker({ symbol, color }: { symbol: string; color: string }) {
  const c = { cx: 16, cy: 7 };
  const p = { fill: color, stroke: 'var(--color-bg-surface)', strokeWidth: 1 };
  switch (symbol) {
    case 'square': return <rect x={c.cx - 4} y={c.cy - 4} width="8" height="8" {...p} />;
    case 'diamond': return <path d={`M${c.cx} ${c.cy - 5}L${c.cx + 5} ${c.cy}L${c.cx} ${c.cy + 5}L${c.cx - 5} ${c.cy}Z`} {...p} />;
    case 'triangle': return <path d={`M${c.cx} ${c.cy - 5}L${c.cx + 5} ${c.cy + 4}L${c.cx - 5} ${c.cy + 4}Z`} {...p} />;
    case 'triangle-down': return <path d={`M${c.cx - 5} ${c.cy - 4}L${c.cx + 5} ${c.cy - 4}L${c.cx} ${c.cy + 5}Z`} {...p} />;
    case 'cross': return <path d={`M${c.cx - 1.5} ${c.cy - 5}h3v3.5h3.5v3h-3.5v3.5h-3v-3.5h-3.5v-3h3.5z`} {...p} />;
    default: return <circle cx={c.cx} cy={c.cy} r="4.5" {...p} />;
  }
}
void formatNumber;
