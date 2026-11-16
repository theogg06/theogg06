import { useMemo } from 'react';
import {
  Button as RACButton, Checkbox, CheckboxGroup, Dialog, DialogTrigger, Label, ListBox, ListBoxItem, Popover, Select, SelectValue,
} from 'react-aria-components';
import { Icon } from './Icon';
import { Button } from './ui';
import { COUNTRIES, INDICATORS, MAX_CHART_COUNTRIES, type IndicatorId } from '../data/registry';
import { DEFAULT_STATE, setState, useAppState } from '../state/appState';
import { announce } from '../state/announcer';
import { formatPeriod, monthIndexToPeriod, periodToMonthIndex } from '../data/format';
import { useSavedViews, touchView } from '../state/savedViews';
import { replaceAll, parseState, serializeState } from '../state/appState';

function SelectField({ label, value, options, onChange, id }: { label: string; value: string; options: { id: string; label: string }[]; onChange: (v: string) => void; id: string }) {
  return (
    <Select className="field" selectedKey={value} onSelectionChange={(k) => k != null && onChange(String(k))} id={id}>
      <Label className="field__label">{label}</Label>
      <RACButton className="field__control">
        <SelectValue />
        <Icon name="chevron-down" />
      </RACButton>
      <Popover className="popover" placement="bottom start">
        <ListBox className="listbox" items={options}>
          {(o) => <ListBoxItem id={o.id} className="listbox__item" textValue={o.label}><Icon name="check" size={16} className="listbox__check" />{o.label}</ListBoxItem>}
        </ListBox>
      </Popover>
    </Select>
  );
}

/** Multi-select as a disclosure popover with a checkbox group (React Aria). */
function CheckboxPicker<T extends string>({ label, summary, options, value, onChange, hint }: { label: string; summary: string; options: { id: T; label: string }[]; value: T[]; onChange: (v: T[]) => void; hint?: string }) {
  const labelId = `${label.replace(/\s+/g, '-').toLowerCase()}-label`;
  return (
    <div className="field">
      <span className="field__label" id={labelId}>{label}</span>
      <DialogTrigger>
        <RACButton className="field__control" aria-labelledby={`${labelId} ${labelId}-value`}>
          <span id={`${labelId}-value`}>{summary}</span>
          <Icon name="chevron-down" />
        </RACButton>
        <Popover className="popover" placement="bottom start">
          <Dialog className="popover__dialog" aria-labelledby={labelId}>
            <CheckboxGroup value={value} onChange={(v) => onChange(v as T[])} aria-labelledby={labelId} className="checkbox-group">
              {hint && <p className="hint">{hint}</p>}
              {options.map((o, i) => (
                <Checkbox key={o.id} value={o.id} className="checkbox" autoFocus={i === 0}>
                  <span className="checkbox__box" aria-hidden="true"><Icon name="check" size={14} /></span>
                  {o.label}
                </Checkbox>
              ))}
            </CheckboxGroup>
          </Dialog>
        </Popover>
      </DialogTrigger>
    </div>
  );
}

export function FilterBar({ firstPeriod, lastPeriod }: { firstPeriod: string; lastPeriod: string }) {
  const s = useAppState();
  const saved = useSavedViews();
  const months = useMemo(() => {
    const out: { id: string; label: string }[] = [];
    for (let i = periodToMonthIndex(lastPeriod); i >= periodToMonthIndex(firstPeriod); i--) { const p = monthIndexToPeriod(i); out.push({ id: p, label: formatPeriod(p) }); }
    return out;
  }, [firstPeriod, lastPeriod]);
  const to = s.to ?? lastPeriod;

  const apply = (patch: Parameters<typeof setState>[0], msg: string) => { setState(patch); announce(msg); };
  const countrySummary = s.countries.length === 0 ? 'Euro area only' : `Euro area + ${s.countries.length}`;
  const indSummary = s.indicators.length === INDICATORS.length ? `All (${INDICATORS.length})` : s.indicators.length === 0 ? 'None' : s.indicators.map((i) => INDICATORS.find((x) => x.id === i)?.label).join(', ');
  const preset = (years: number | 'max') => {
    const from = years === 'max' ? firstPeriod : monthIndexToPeriod(periodToMonthIndex(lastPeriod) - years * 12 + 1);
    apply({ from: from < firstPeriod ? firstPeriod : from, to: null }, `Date range set to ${formatPeriod(from < firstPeriod ? firstPeriod : from)} – ${formatPeriod(lastPeriod)}.`);
  };
  const currentQuery = serializeState({ ...s, sim: {} }, { includeSim: false });
  const matching = saved.find((v) => v.query === currentQuery);
  const savedOptions = [...(matching ? [] : [{ id: '__current', label: 'Current filters (unsaved)' }]), ...saved.map((v) => ({ id: v.id, label: v.name }))];

  return (
    <section className="card filters" aria-labelledby="filters-h">
      <div className="filters__head">
        <h2 id="filters-h" className="h3"><Icon name="filter" /> Filters</h2>
        <p className="muted" data-testid="filter-summary">Showing {countrySummary.toLowerCase()} · {formatPeriod(s.from)} – {formatPeriod(to)} · {s.indicators.length} of {INDICATORS.length} indicators</p>
      </div>
      <div className="filters__row">
        <SelectField id="saved-view" label="Saved view" value={matching?.id ?? '__current'} options={savedOptions} onChange={(id) => {
          const v = saved.find((x) => x.id === id); if (!v) return;
          replaceAll({ ...parseState(v.query), sim: s.sim }, { push: true }); touchView(v.id);
          announce(`View "${v.name}" applied.`);
        }} />
        <fieldset className="date-range">
          <legend className="field__label">Date range</legend>
          <div className="date-range__fields">
            <SelectField id="from" label="From" value={s.from} options={months.filter((m) => m.id <= to)} onChange={(v) => apply({ from: v }, `Date range starts ${formatPeriod(v)}.`)} />
            <SelectField id="to" label="To" value={to} options={months.filter((m) => m.id >= s.from).map((m, i) => (i === 0 ? { ...m, label: `${m.label} (latest)` } : m))} onChange={(v) => apply({ to: v === lastPeriod ? null : v }, `Date range ends ${formatPeriod(v)}.`)} />
          </div>
          <div className="date-range__presets" role="group" aria-label="Date range presets">
            {([1, 3, 5, 'max'] as const).map((y) => <Button key={y} variant="ghost" className="btn--small" onPress={() => preset(y)}>{y === 'max' ? 'Max' : `${y}Y`}</Button>)}
          </div>
        </fieldset>
        <CheckboxPicker label="Countries" summary={countrySummary} options={COUNTRIES} value={s.countries} hint={`Euro area is always shown as the reference. Charts show up to ${MAX_CHART_COUNTRIES} countries; the table shows all.`}
          onChange={(v) => apply({ countries: COUNTRIES.map((c) => c.id).filter((id) => v.includes(id)) }, `Countries: ${v.length ? v.map((id) => COUNTRIES.find((c) => c.id === id)?.label).join(', ') : 'euro area only'}.`)} />
        <CheckboxPicker<IndicatorId> label="Indicators" summary={indSummary} options={INDICATORS.map((i) => ({ id: i.id, label: i.label }))} value={s.indicators}
          onChange={(v) => apply({ indicators: INDICATORS.map((i) => i.id).filter((id) => v.includes(id)) }, `${v.length} of ${INDICATORS.length} indicators shown.`)} />
        <Button variant="ghost" icon="reset" onPress={() => apply({ from: DEFAULT_STATE.from, to: null, countries: DEFAULT_STATE.countries, indicators: DEFAULT_STATE.indicators }, 'Filters reset to defaults.')}>Reset filters</Button>
      </div>
    </section>
  );
}
