#!/usr/bin/env node
/**
 * Fetch real series from the ECB Data Portal (SDMX REST API) and Eurostat
 * (dissemination API, JSON-stat 2.0) and cache them as static JSON snapshots
 * in public/data/. Each snapshot records its source, query URL, licence and
 * retrieval timestamp. No dependencies: Node >= 20 (global fetch).
 *
 *   node scripts/fetch-data.mjs            fetch everything
 *   node scripts/fetch-data.mjs hicp debt  fetch selected datasets
 *
 * Exit code 1 if any dataset fails; successful datasets are still written.
 * This runs in CI (.github/workflows/fetch-data.yml) because the development
 * container's network policy blocks both hosts (DECISIONS.md D-005).
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'data');
const START_M = '2019-01';
const START_Q = '2019-Q1';

const ECB_BASE = 'https://data-api.ecb.europa.eu/service/data';
const ESTAT_BASE = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data';

const LICENCE = {
  ECB: 'ECB statistics: reuse permitted free of charge with source acknowledgement (https://www.ecb.europa.eu/services/disclaimer/html/index.en.html)',
  Eurostat: 'Eurostat: CC BY 4.0 (https://ec.europa.eu/eurostat/about-us/policies/copyright)',
};

/** ISO 3166 alpha-2 (ECB uses U2 / Eurostat EA20 for the euro area) → our geo id + label. */
const GEO = {
  U2: ['EA', 'Euro area'], EA20: ['EA', 'Euro area'], EA: ['EA', 'Euro area'],
  DE: ['DE', 'Germany'], FR: ['FR', 'France'], IT: ['IT', 'Italy'], ES: ['ES', 'Spain'],
  NL: ['NL', 'Netherlands'], BE: ['BE', 'Belgium'], AT: ['AT', 'Austria'], PT: ['PT', 'Portugal'],
  EL: ['GR', 'Greece'], GR: ['GR', 'Greece'], FI: ['FI', 'Finland'], IE: ['IE', 'Ireland'],
};
const COUNTRIES = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'GR', 'FI', 'IE'];

// ---------------------------------------------------------------- helpers
async function get(url, accept) {
  const res = await fetch(url, { headers: { Accept: accept, 'User-Agent': 'accessible-data-dashboard (portfolio; github.com/theogg06)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}\n${(await res.text()).slice(0, 400)}`);
  return res;
}

/** Minimal RFC 4180 CSV parser (handles quotes, escaped quotes, CRLF). */
export function parseCsv(text) {
  const rows = []; let row = []; let field = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = ''; if (row.length > 1 || row[0] !== '') rows.push(row); row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

const num = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));

/** ECB SDMX → series grouped by KEY. */
async function ecb(flow, key, params, { seriesId, label }) {
  const qs = new URLSearchParams({ format: 'csvdata', ...params });
  const url = `${ECB_BASE}/${flow}/${key}?${qs}`;
  const rows = parseCsv(await (await get(url, 'text/csv')).text());
  if (!rows.length) throw new Error(`ECB ${flow}/${key}: no rows`);
  const byKey = new Map();
  for (const r of rows) {
    if (!byKey.has(r.KEY)) byKey.set(r.KEY, { key: r.KEY, row: r, observations: [] });
    byKey.get(r.KEY).observations.push({ period: r.TIME_PERIOD, value: num(r.OBS_VALUE), ...(r.OBS_STATUS && r.OBS_STATUS !== 'A' ? { status: r.OBS_STATUS } : {}) });
  }
  const series = [...byKey.values()].map(({ key: k, row, observations }) => ({
    id: seriesId(row),
    key: `${flow}.${k}`,
    label: label(row),
    sourceTitle: row.TITLE || row.TITLE_COMPL || '',
    observations: observations.sort((a, b) => a.period.localeCompare(b.period)),
  }));
  return { url, series };
}

/** Eurostat JSON-stat 2.0 → series per geo. `filters` excludes geo and time. */
async function eurostat(code, filters, geos, sinceTimePeriod) {
  const qs = new URLSearchParams({ format: 'JSON', lang: 'EN', sinceTimePeriod });
  for (const [k, v] of Object.entries(filters)) qs.append(k, v);
  for (const g of geos) qs.append('geo', g);
  const url = `${ESTAT_BASE}/${code}?${qs}`;
  const js = await (await get(url, 'application/json')).json();
  const { id, size, dimension, value, status = {}, updated, label } = js;
  const geoPos = id.indexOf('geo'); const timePos = id.indexOf('time');
  if (geoPos < 0 || timePos < 0) throw new Error(`${code}: unexpected dimensions ${id}`);
  for (const [i, d] of id.entries()) if (d !== 'geo' && d !== 'time' && size[i] !== 1) throw new Error(`${code}: dimension ${d} has ${size[i]} values; tighten filters`);
  const strides = size.map((_, i) => size.slice(i + 1).reduce((a, b) => a * b, 1));
  const geoIdx = dimension.geo.category.index; const timeIdx = dimension.time.category.index;
  const series = Object.entries(geoIdx).map(([g, gi]) => {
    const observations = Object.entries(timeIdx).sort((a, b) => a[1] - b[1]).map(([t, ti]) => {
      const flat = gi * strides[geoPos] + ti * strides[timePos];
      const v = value[flat] ?? value[String(flat)];
      const s = status[flat] ?? status[String(flat)];
      return { period: t, value: v == null ? null : Number(v), ...(s ? { status: s } : {}) };
    });
    const [geoId, geoLabel] = GEO[g] ?? [g, dimension.geo.category.label[g]];
    return { id: geoId, key: `${code}.${g}`, label: geoLabel, sourceTitle: label, observations };
  });
  return { url, series, sourceUpdated: updated };
}

async function eurostatWithEaFallback(code, filters, sinceTimePeriod) {
  try { return await eurostat(code, filters, ['EA20', ...COUNTRIES.map((c) => (c === 'GR' ? 'EL' : c))], sinceTimePeriod); }
  catch (e) {
    console.warn(`  EA20 failed for ${code}, retrying with EA: ${e.message.split('\n')[0]}`);
    return eurostat(code, filters, ['EA', ...COUNTRIES.map((c) => (c === 'GR' ? 'EL' : c))], sinceTimePeriod);
  }
}

const geoFromEcb = (row) => (GEO[row.REF_AREA] ?? [row.REF_AREA])[0];
const labelFromEcb = (row) => (GEO[row.REF_AREA] ?? [row.REF_AREA, row.REF_AREA])[1];

// ---------------------------------------------------------------- datasets
const DATASETS = {
  hicp: async () => {
    const r = await ecb('ICP', `M.U2+${COUNTRIES.join('+')}.N.000000.4.ANR`, { startPeriod: START_M }, { seriesId: geoFromEcb, label: labelFromEcb });
    return { source: 'ECB', dataset: 'ICP — HICP, overall index, annual rate of change', frequency: 'M', unit: '%', unitLabel: 'Annual rate of change, %', ...r };
  },
  unemployment: async () => {
    const r = await eurostatWithEaFallback('une_rt_m', { s_adj: 'SA', age: 'TOTAL', unit: 'PC_ACT', sex: 'T' }, START_M);
    return { source: 'Eurostat', dataset: 'une_rt_m — Unemployment by sex and age, monthly data', frequency: 'M', unit: '%', unitLabel: '% of labour force, seasonally adjusted', ...r };
  },
  debt: async () => {
    const r = await eurostatWithEaFallback('gov_10q_ggdebt', { unit: 'PC_GDP', sector: 'S13', na_item: 'GD' }, START_Q);
    return { source: 'Eurostat', dataset: 'gov_10q_ggdebt — Quarterly government debt', frequency: 'Q', unit: '% of GDP', unitLabel: 'General government gross debt, % of GDP', ...r };
  },
  fx: async () => {
    const r = await ecb('EXR', 'M.USD+GBP+CHF+JPY.EUR.SP00.A', { startPeriod: START_M }, { seriesId: (row) => row.CURRENCY, label: (row) => `EUR/${row.CURRENCY}` });
    return { source: 'ECB', dataset: 'EXR — Euro foreign exchange reference rates, monthly average', frequency: 'M', unit: 'units per EUR', unitLabel: 'Units of currency per euro, monthly average', ...r };
  },
  'fx-daily': async () => {
    const r = await ecb('EXR', 'D.USD.EUR.SP00.A', { lastNObservations: '60' }, { seriesId: () => 'USD', label: () => 'EUR/USD' });
    return { source: 'ECB', dataset: 'EXR — Euro foreign exchange reference rate, daily', frequency: 'D', unit: 'USD per EUR', unitLabel: 'US dollars per euro', ...r };
  },
  lending: async () => {
    // Loans to euro area households by purpose, outstanding amounts (EUR millions).
    // 2250 households total; 2251 consumer credit; 2252 house purchase; 2253 other lending.
    const PURPOSE = { 2250: ['total', 'Total loans to households'], 2251: ['consumer', 'Consumer credit'], 2252: ['house', 'House purchase'], 2253: ['other', 'Other lending'] };
    // ADJUSTMENT and BS_REP_SECTOR are wildcarded; keep one series per purpose,
    // preferring non-adjusted (N) data reported by MFIs excl. ESCB (A, then U).
    const r = await ecb('BSI', 'M.U2...A20.A.1.U2.2250+2251+2252+2253.Z01.E', { startPeriod: START_M },
      { seriesId: (row) => PURPOSE[row.BS_COUNT_SECTOR]?.[0] ?? row.BS_COUNT_SECTOR, label: (row) => PURPOSE[row.BS_COUNT_SECTOR]?.[1] ?? row.TITLE });
    const rank = (k) => (k.includes('.N.') ? 0 : 2) + (/\.A\.A20\./.test(k) ? 0 : 1);
    const best = new Map();
    for (const s of r.series) if (!best.has(s.id) || rank(s.key) < rank(best.get(s.id).key)) best.set(s.id, s);
    r.series = [...best.values()];
    return { source: 'ECB', dataset: 'BSI — MFI loans to euro area households by purpose, outstanding amounts', frequency: 'M', unit: 'EUR millions', unitLabel: 'Outstanding amounts, € millions', ...r };
  },
};

// ---------------------------------------------------------------- main
const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(DATASETS);
await mkdir(OUT, { recursive: true });
const manifestPath = join(OUT, 'manifest.json');
let manifest = { generatedAt: null, datasets: {} };
try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')); } catch { /* first run */ }

let failed = 0;
for (const id of wanted) {
  const fn = DATASETS[id];
  if (!fn) { console.error(`Unknown dataset ${id}`); failed++; continue; }
  process.stdout.write(`• ${id} … `);
  try {
    const d = await fn();
    const nonEmpty = d.series.filter((s) => s.observations.some((o) => o.value != null));
    if (!nonEmpty.length) throw new Error('all series empty');
    const snapshot = {
      id, title: d.dataset, source: d.source, licence: LICENCE[d.source], url: d.url,
      retrievedAt: new Date().toISOString(), sourceUpdated: d.sourceUpdated ?? null,
      frequency: d.frequency, unit: d.unit, unitLabel: d.unitLabel, synthetic: false,
      series: d.series,
    };
    await writeFile(join(OUT, `${id}.json`), JSON.stringify(snapshot) + '\n');
    manifest.datasets[id] = { file: `${id}.json`, source: d.source, retrievedAt: snapshot.retrievedAt, series: d.series.map((s) => s.id), lastPeriod: d.series.map((s) => s.observations.at(-1)?.period).sort().at(-1) };
    console.log(`ok (${d.series.length} series, last ${manifest.datasets[id].lastPeriod})`);
  } catch (e) {
    failed++; console.log('FAILED'); console.error(`  ${e.message}`);
  }
}
manifest.generatedAt = new Date().toISOString();
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
process.exit(failed ? 1 : 0);
