#!/usr/bin/env node
// WCAG 2.x contrast checks for the placeholder token set (light, dark, hc).
// Usage: node scripts/check-contrast.mjs [-v]   — exits 1 if any pair fails.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { color } = JSON.parse(readFileSync(join(root, 'packages/tokens/tokens.json'), 'utf8'));

const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const TEXT = 4.5, UI = 3;
const pairs = [
  ...['bg/canvas', 'bg/surface', 'bg/subtle'].flatMap((bg) => [['text/primary', bg, TEXT], ['text/secondary', bg, TEXT], ['text/link', bg, TEXT]]),
  ['text/on-accent', 'bg/accent', TEXT], ['text/on-accent', 'bg/accent-hover', TEXT],
  ...['bg/surface', 'bg/canvas'].flatMap((bg) => [['border/strong', bg, UI], ['focus/ring', bg, UI], ['chart/axis', bg, UI], ['bg/accent', bg, UI]]),
  ...['success', 'warning', 'danger', 'info', 'synthetic'].flatMap((s) => [[`status/${s}-text`, `status/${s}-bg`, TEXT], [`status/${s}-text`, 'bg/surface', TEXT]]),
  ...[1, 2, 3, 4, 5, 6].map((i) => [`chart/series-${i}`, 'bg/surface', UI]),
  ...[1, 2, 3, 4, 5].map((i) => [`chart/seq-${i}-text`, `chart/seq-${i}`, TEXT]),
];

const verbose = process.argv.includes('-v');
let fails = 0, total = 0;
for (const mode of ['light', 'dark', 'hc']) {
  for (const [fg, bg, min] of pairs) {
    total++;
    const r = contrast(color[fg][mode], color[bg][mode]);
    const ok = r >= min;
    if (!ok) fails++;
    if (verbose || !ok) console.log(`${ok ? 'PASS' : 'FAIL'}  ${mode.padEnd(5)} ${fg} on ${bg}: ${r.toFixed(2)} (min ${min})`);
  }
}
console.log(`${total - fails}/${total} pairs pass`);
process.exit(fails ? 1 : 0);
