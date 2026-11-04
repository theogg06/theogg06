import type { WidgetData } from '../data/types';

const esc = (v: string | number | null | undefined, sep: string) => {
  const s = v == null ? '' : String(v);
  return s.includes(sep) || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
};

export interface CsvOptions { separator?: ',' | ';'; includeMetadata?: boolean; includeSynthetic?: boolean }

/** Long-format CSV (one row per observation) with optional provenance header. */
export function toCsv(datas: WidgetData[], { separator = ',', includeMetadata = true, includeSynthetic = false }: CsvOptions = {}): string {
  const lines: string[] = [];
  const sep = separator;
  if (includeMetadata) {
    lines.push(`# Exported from Euro Area Monitor (prototype) on ${new Date().toISOString()}`);
    for (const d of datas) lines.push(`# ${d.snapshot.id}: ${d.snapshot.synthetic ? 'SYNTHETIC DATA (not real)' : `${d.snapshot.source}, ${d.snapshot.title}`}; retrieved ${d.snapshot.retrievedAt}; unit: ${d.snapshot.unitLabel}; licence: ${d.snapshot.licence}${d.snapshot.url ? `; query: ${d.snapshot.url}` : ''}`);
  }
  lines.push(['dataset', 'series_id', 'series_label', 'series_key', 'period', 'value', 'status', 'synthetic'].join(sep));
  for (const d of datas) {
    if (d.snapshot.synthetic && !includeSynthetic) continue;
    for (const s of d.series) for (const o of s.observations) lines.push([d.snapshot.id, s.id, s.label, s.key, o.period, o.value, o.status ?? '', d.snapshot.synthetic].map((v) => esc(v as string, sep)).join(sep));
  }
  return lines.join('\n') + '\n';
}

export function downloadText(filename: string, text: string, type = 'text/csv') {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function downloadCsv(name: string, d: WidgetData) {
  downloadText(`${name}_${new Date().toISOString().slice(0, 10)}.csv`, toCsv([d], { includeSynthetic: true }));
}
