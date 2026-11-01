import { useState } from 'react';
import { Checkbox, FieldError, Form, Input, Label, Radio, RadioGroup, Text, TextField } from 'react-aria-components';
import { AppDialog, Button } from './ui';
import { Icon } from './Icon';
import { getState, parseState, replaceAll, serializeState, shareUrl, useAppState } from '../state/appState';
import { createView, deleteView, renameView, restoreView, StorageUnavailableError, touchView, useSavedViews, validateName, MAX_NAME, type SavedView } from '../state/savedViews';
import { showToast } from '../state/toasts';
import { announce } from '../state/announcer';
import { COUNTRIES, GEO_LABEL, INDICATORS } from '../data/registry';
import { formatPeriod } from '../data/format';
import { loadSnapshot } from '../data/snapshots';
import { selectSeries, toWidgetData } from '../data/derive';
import { simulateState } from '../data/synthetic';
import { downloadText, toCsv } from '../lib/csv';
import type { DatasetId } from '../data/types';

async function copyLink() {
  const url = shareUrl();
  try {
    await navigator.clipboard.writeText(url);
    showToast({ kind: 'success', message: 'Link copied. Anyone with the link sees the same filters and views.' });
  } catch {
    showToast({ kind: 'error', message: `Couldn't copy automatically. Copy this link: ${url}` });
  }
}

function describe(query: string): string {
  const s = parseState(query);
  const c = s.countries.length ? s.countries.map((g) => GEO_LABEL[g]).join(', ') : 'euro area only';
  return `${formatPeriod(s.from)} – ${s.to ? formatPeriod(s.to) : 'latest'} · Euro area + ${c} · ${s.indicators.length} of ${INDICATORS.length} indicators`;
}

export function PageActions() {
  const [dialog, setDialog] = useState<null | 'save' | 'manage' | 'export'>(null);
  return (
    <div className="page__actions">
      <Button icon="link" onPress={copyLink}>Copy link</Button>
      <Button icon="download" onPress={() => setDialog('export')}>Export</Button>
      <Button icon="bookmark" onPress={() => setDialog('manage')}>Saved views</Button>
      <Button variant="primary" icon="bookmark" onPress={() => setDialog('save')}>Save view</Button>
      <SaveViewDialog isOpen={dialog === 'save'} onClose={() => setDialog(null)} />
      <ManageViewsDialog isOpen={dialog === 'manage'} onClose={() => setDialog(null)} onSaveNew={() => setDialog('save')} />
      <ExportDialog isOpen={dialog === 'export'} onClose={() => setDialog(null)} />
    </div>
  );
}

export function SaveViewDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const s = useAppState();
  const [name, setName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const query = serializeState({ ...s, sim: {} }, { includeSim: false });
  return (
    <AppDialog title="Save this view" isOpen={isOpen} onOpenChange={(o) => { if (!o) { onClose(); setError(null); setName(''); } }}>
      {(close) => (
        <Form className="stack" validationErrors={error ? { name: error } : undefined} onSubmit={(e) => {
          e.preventDefault();
          const err = validateName(name);
          if (err) { setError(err); announce(err, 'assertive', 100); return; }
          try {
            createView(name, query, isDefault);
            showToast({ kind: 'success', message: `View "${name.trim()}" saved.` });
            setName(''); setIsDefault(false); setError(null); close();
          } catch (ex) {
            showToast({ kind: 'error', message: ex instanceof StorageUnavailableError ? "Couldn't save the view: browser storage is full or blocked. Copy the link instead." : "Couldn't save the view.", action: { label: 'Copy link', onAction: copyLink } });
          }
        }}>
          <TextField name="name" value={name} onChange={(v) => { setName(v); if (error) setError(null); }} isInvalid={!!error} maxLength={MAX_NAME} autoFocus className="text-field">
            <Label className="field__label">View name</Label>
            <Text slot="description" className="hint">Shown in the Saved view menu. Up to {MAX_NAME} characters.</Text>
            <Input className="input" />
            <FieldError className="field-error"><Icon name="error" size={16} /> {error}</FieldError>
          </TextField>
          <div className="panel panel--neutral">
            <p className="small strong">What this view saves</p>
            <p className="small">{describe(query)}. Chart or table choice for each widget. Theme and density are not saved in views or links.</p>
          </div>
          <Checkbox isSelected={isDefault} onChange={setIsDefault} className="checkbox"><span className="checkbox__box" aria-hidden="true"><Icon name="check" size={14} /></span>Open this view when I start the dashboard</Checkbox>
          <div className="row row--end"><Button onPress={close}>Cancel</Button><Button variant="primary" type="submit" icon="bookmark">Save view</Button></div>
        </Form>
      )}
    </AppDialog>
  );
}

export function ManageViewsDialog({ isOpen, onClose, onSaveNew }: { isOpen: boolean; onClose: () => void; onSaveNew: () => void }) {
  const views = useSavedViews();
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<SavedView | null>(null);
  const current = serializeState({ ...getState(), sim: {} }, { includeSim: false });

  const apply = (v: SavedView, close: () => void) => {
    replaceAll({ ...parseState(v.query), sim: getState().sim }, { push: true }); touchView(v.id);
    announce(`View "${v.name}" applied: ${describe(v.query)}.`); close();
  };
  const copy = async (v: SavedView) => {
    const url = `${location.origin}${location.pathname}${v.query}`;
    try { await navigator.clipboard.writeText(url); showToast({ kind: 'success', message: `Link to "${v.name}" copied.` }); } catch { showToast({ kind: 'error', message: `Couldn't copy automatically. Link: ${url}` }); }
  };

  return (
    <>
      <AppDialog title="Saved views" width={640} isOpen={isOpen && !confirm} onOpenChange={(o) => { if (!o && !confirm) onClose(); }}>
        {(close) => views.length === 0 ? (
          <div className="stack center">
            <Icon name="bookmark" size={32} />
            <p className="h3">No saved views yet</p>
            <p className="muted">Save your filters to reopen them in one step next month, or share them as a link.</p>
            <Button variant="primary" icon="plus" onPress={() => { close(); onSaveNew(); }}>Save current view</Button>
          </div>
        ) : (
          <div className="stack">
            <p className="muted small">Saved in this browser. Links work anywhere because the filters are stored in the link.</p>
            <ul className="view-list">
              {views.map((v) => (
                <li key={v.id} className="view-list__item">
                  {renaming === v.id ? (
                    <Form className="stack" onSubmit={(e) => { e.preventDefault(); const err = validateName(draft, v.id); if (err) { setRenameError(err); return; } renameView(v.id, draft); announce(`Renamed to "${draft.trim()}".`); setRenaming(null); }}>
                      <TextField value={draft} onChange={(x) => { setDraft(x); setRenameError(null); }} isInvalid={!!renameError} autoFocus className="text-field" onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setRenaming(null); } }}>
                        <Label className="field__label">New name for "{v.name}"</Label>
                        <Input className="input" />
                        <FieldError className="field-error"><Icon name="error" size={16} /> {renameError}</FieldError>
                      </TextField>
                      <div className="row"><Button variant="primary" type="submit">Save name</Button><Button onPress={() => setRenaming(null)}>Cancel</Button></div>
                    </Form>
                  ) : (
                    <>
                      <p className="view-list__name"><strong>{v.name}</strong>{v.query === current && <span className="badge badge--provisional"><span>Current view</span></span>}{v.isDefault && <span className="badge badge--live"><span>Default</span></span>}</p>
                      <p className="small muted">{describe(v.query)} · last used {new Date(v.lastUsedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                      <div className="row">
                        <Button onPress={() => apply(v, close)}>Apply</Button>
                        <Button variant="ghost" icon="edit" onPress={() => { setRenaming(v.id); setDraft(v.name); setRenameError(null); }} aria-label={`Rename ${v.name}`}>Rename</Button>
                        <Button variant="ghost" icon="link" onPress={() => copy(v)} aria-label={`Copy link to ${v.name}`}>Copy link</Button>
                        <Button variant="ghost" icon="trash" onPress={() => setConfirm(v)} aria-label={`Delete ${v.name}`}>Delete</Button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </AppDialog>
      <AppDialog role="alertdialog" title={confirm ? `Delete "${confirm.name}"?` : ''} isOpen={!!confirm} onOpenChange={(o) => { if (!o) setConfirm(null); }}>
        {(close) => (
          <div className="stack">
            <p>This removes the view from this browser. Links you already shared keep working, because the filters are stored in the link.</p>
            <div className="row row--end">
              <Button autoFocus onPress={close}>Keep view</Button>
              <Button variant="danger" icon="trash" onPress={() => {
                const v = confirm!; deleteView(v.id); close(); setConfirm(null);
                showToast({ kind: 'success', message: `View "${v.name}" deleted.`, action: { label: 'Undo', onAction: () => { restoreView(v); announce(`View "${v.name}" restored.`); } } });
              }}>Delete view</Button>
            </div>
          </div>
        )}
      </AppDialog>
    </>
  );
}

const EXPORT_SETS: { id: DatasetId; ind: string }[] = [{ id: 'hicp', ind: 'hicp' }, { id: 'unemployment', ind: 'unemployment' }, { id: 'lending', ind: 'lending' }, { id: 'debt', ind: 'debt' }];

export function ExportDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const s = useAppState();
  const [scope, setScope] = useState('view');
  const [format, setFormat] = useState('csv-comma');
  const [meta, setMeta] = useState(true);
  const [synth, setSynth] = useState(false);
  const [busy, setBusy] = useState(false);
  const file = `euro-area-overview_${new Date().toISOString().slice(0, 10)}.${format === 'json' ? 'json' : 'csv'}`;
  return (
    <AppDialog title="Export data" width={560} isOpen={isOpen} onOpenChange={(o) => !o && onClose()}>
      {(close) => (
        <div className="stack">
          <RadioGroup value={scope} onChange={setScope} className="radio-group">
            <Label className="field__label">What to export</Label>
            <Radio value="view" className="radio"><span className="radio__dot" aria-hidden="true" />Current view: euro area + {s.countries.length} countries, {formatPeriod(s.from)} – {s.to ? formatPeriod(s.to) : 'latest'}</Radio>
            <Radio value="all" className="radio"><span className="radio__dot" aria-hidden="true" />All available data for the selected indicators</Radio>
          </RadioGroup>
          <RadioGroup value={format} onChange={setFormat} className="radio-group">
            <Label className="field__label">Format</Label>
            <Radio value="csv-comma" className="radio"><span className="radio__dot" aria-hidden="true" />CSV, comma-separated</Radio>
            <Radio value="csv-semicolon" className="radio"><span className="radio__dot" aria-hidden="true" />CSV, semicolon-separated (Excel in most EU locales)</Radio>
            <Radio value="json" className="radio"><span className="radio__dot" aria-hidden="true" />JSON</Radio>
          </RadioGroup>
          <Checkbox isSelected={meta} onChange={setMeta} className="checkbox"><span className="checkbox__box" aria-hidden="true"><Icon name="check" size={14} /></span>Include source, series keys and retrieval date</Checkbox>
          <Checkbox isSelected={synth} onChange={setSynth} className="checkbox"><span className="checkbox__box" aria-hidden="true"><Icon name="check" size={14} /></span>Include rows marked as synthetic</Checkbox>
          <p className="panel panel--neutral small"><Icon name="info" size={18} /> File: {file}</p>
          <div className="row row--end">
            <Button onPress={close}>Cancel</Button>
            <Button variant="primary" icon="download" isDisabled={busy} onPress={async () => {
              setBusy(true);
              try {
                const sets = EXPORT_SETS.filter((x) => s.indicators.includes(x.ind as never));
                const datas = await Promise.all(sets.map(async (x) => {
                  let snap = await loadSnapshot(x.id);
                  const sim = s.sim[x.id === 'hicp' ? 'inflation' : x.id];
                  if (sim && sim !== 'ready' && sim !== 'loading' && sim !== 'error') snap = simulateState(snap, sim);
                  const geos = x.id === 'lending' ? undefined : (s.countries.length ? s.countries : COUNTRIES.map((c) => c.id));
                  return toWidgetData(snap, scope === 'all' ? selectSeries(snap, { geos }) : selectSeries(snap, { geos, from: s.from, to: s.to ?? undefined }));
                }));
                const text = format === 'json'
                  ? JSON.stringify(datas.filter((d) => synth || !d.snapshot.synthetic).map((d) => ({ dataset: d.snapshot.id, ...(meta ? { source: d.snapshot.source, title: d.snapshot.title, retrievedAt: d.snapshot.retrievedAt, licence: d.snapshot.licence, url: d.snapshot.url, synthetic: d.snapshot.synthetic } : {}), unit: d.snapshot.unitLabel, series: d.series })), null, 2)
                  : toCsv(datas, { separator: format === 'csv-semicolon' ? ';' : ',', includeMetadata: meta, includeSynthetic: synth });
                downloadText(file, text, format === 'json' ? 'application/json' : 'text/csv');
                showToast({ kind: 'success', message: `Exported ${file}.` });
                close();
              } catch {
                showToast({ kind: 'error', message: "Export failed: the data couldn't be loaded. Try again." });
              } finally { setBusy(false); }
            }}>{format === 'json' ? 'Export JSON' : 'Export CSV'}</Button>
          </div>
        </div>
      )}
    </AppDialog>
  );
}
