import { useSyncExternalStore } from 'react';
import { AppDialog, Button } from './ui';

let open = false;
const listeners = new Set<() => void>();
export function openShortcuts() { open = true; listeners.forEach((l) => l()); }
function setOpen(v: boolean) { open = v; listeners.forEach((l) => l()); }

export const CHART_KEYS: [string, string][] = [
  ['Tab', 'Move into the chart (one tab stop), then on to the next control'],
  ['← →', 'Previous / next data point in the current series'],
  ['↑ ↓', 'Same date in the previous / next series'],
  ['Home / End', 'First / last point of the series'],
  ['Page Up / Page Down', 'Jump 12 points (one year)'],
  ['S', 'Read the current series summary'],
  ['T', 'Switch to the table view'],
  ['Enter', 'Open the detail view for the focused country (where available)'],
  ['Esc', 'Close the tooltip; press again to leave the chart'],
  ['?', 'Open this list of shortcuts'],
];
export const GLOBAL_KEYS: [string, string][] = [
  ['Tab / Shift+Tab', 'Move through controls in reading order'],
  ['Skip link', 'First Tab stop: jump to the main content'],
  ['?', 'Open this list (when not typing in a field)'],
  ['Esc', 'Close a dialog, menu or tooltip; focus returns to the control that opened it'],
];

export function ShortcutsDialog() {
  const isOpen = useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => open, () => false);
  return (
    <AppDialog title="Keyboard shortcuts" isOpen={isOpen} onOpenChange={setOpen} width={640}>
      {(close) => (
        <div className="stack">
          <h3 className="h3">Inside a chart</h3>
          <KeyTable rows={CHART_KEYS} caption="Chart keyboard shortcuts" />
          <p className="small muted">Single-key shortcuts (S, T, ?) only work while focus is inside a chart, so they never clash with screen reader commands (WCAG 2.1.4).</p>
          <h3 className="h3">Everywhere</h3>
          <KeyTable rows={GLOBAL_KEYS} caption="Global keyboard shortcuts" />
          <div className="row row--end"><Button variant="primary" onPress={close}>Close</Button></div>
        </div>
      )}
    </AppDialog>
  );
}

function KeyTable({ rows, caption }: { rows: [string, string][]; caption: string }) {
  return (
    <table className="data-table keys">
      <caption className="sr-only">{caption}</caption>
      <thead><tr><th scope="col">Key</th><th scope="col">Action</th></tr></thead>
      <tbody>{rows.map(([k, d]) => <tr key={k}><th scope="row"><kbd>{k}</kbd></th><td>{d}</td></tr>)}</tbody>
    </table>
  );
}
