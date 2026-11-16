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
async function estatDims(code, qs) {
  const url = `${EST}/${code}?format=JSON&lang=EN&${qs}`; const r = await fetch(url);
  if (!r.ok) { console.log(`  ${r.status} ${code}?${qs} ${(await r.text()).slice(0, 300)}`); return; }
  const j = await r.json();
  console.log(`  ${code}: ids=${j.id.join(',')} sizes=${j.size.join(',')}`);
  for (const d of j.id) { if (d === 'time') continue; const lab = j.dimension[d].category.label; const ks = Object.keys(lab); console.log(`   ${d} (${ks.length}): ${ks.slice(0, 25).map((k) => `${k}=${lab[k]}`).join(' | ')}`); }
}
console.log('# prc_hicp_minr dimensions (EA, latest month)');
await estatDims('prc_hicp_minr', 'geo=EA&lastTimePeriod=1');
console.log('# prc_hicp_minr with EA21 / EA20');
await estatDims('prc_hicp_minr', 'geo=EA21&lastTimePeriod=1&unit=RCH_A');
console.log('# BSI household loans by item');
await ecbList('BSI', 'M.U2.N.A..A.1.U2.2250.Z01.E', { startPeriod: '2026-08' });
