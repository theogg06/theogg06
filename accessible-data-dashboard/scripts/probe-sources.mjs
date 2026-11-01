#!/usr/bin/env node
// Discovery helper (CI only): prints which series codes currently carry data,
// so dataset keys in fetch-data.mjs are chosen from evidence, not memory.
import { parseCsv } from './fetch-data.mjs';
const ECB = 'https://data-api.ecb.europa.eu/service/data';
const EST = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data';
async function ecbList(flow, key, params = {}) {
  const url = `${ECB}/${flow}/${key}?${new URLSearchParams({ format: 'csvdata', ...params })}`;
  const r = await fetch(url); if (!r.ok) { console.log(`  ${r.status} ${url}`); return; }
  const rows = parseCsv(await r.text()); const by = new Map();
  for (const x of rows) { const e = by.get(x.KEY) ?? { n: 0, last: '', title: x.TITLE }; e.n++; if (x.TIME_PERIOD > e.last) e.last = x.TIME_PERIOD; by.set(x.KEY, e); }
  for (const [k, e] of by) console.log(`  ${k} | last ${e.last} | n ${e.n} | ${e.title}`);
}
async function estat(code, qs) {
  const url = `${EST}/${code}?format=JSON&lang=EN&${qs}`; const r = await fetch(url);
  if (!r.ok) { console.log(`  ${r.status} ${code}?${qs} ${(await r.text()).slice(0, 200)}`); return; }
  const j = await r.json(); const t = Object.keys(j.dimension.time.category.index); console.log(`  ${code}?${qs} → ok, ${Object.keys(j.value).length} values, time ${t[0]}..${t.at(-1)}, geo ${Object.keys(j.dimension.geo.category.index).join(',')}`);
}
console.log('# ICP overall index, euro area, annual rate — any item code with 2026 data');
await ecbList('ICP', 'M.U2.N..4.ANR', { startPeriod: '2026-01' });
console.log('# BSI households loans by sector code (A20, outstanding)');
await ecbList('BSI', 'M.U2.N.A.A20.A.1.U2..Z01.E', { startPeriod: '2026-06' });
console.log('# Eurostat checks');
for (const g of ['EA21', 'EA20', 'EA']) await estat('une_rt_m', `geo=${g}&s_adj=SA&age=TOTAL&unit=PC_ACT&sex=T&sinceTimePeriod=2026-01`);
for (const g of ['EA21', 'EA20']) await estat('gov_10q_ggdebt', `geo=${g}&unit=PC_GDP&sector=S13&na_item=GD&sinceTimePeriod=2025-Q1`);
await estat('prc_hicp_manr', 'geo=EA&coicop=CP00&unit=RCH_A&sinceTimePeriod=2025-06');
await estat('prc_hicp_minr', 'geo=EA&unit=RCH_A&sinceTimePeriod=2025-06');
