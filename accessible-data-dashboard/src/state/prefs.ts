/** Personal display preferences (theme, density) — localStorage only, never in links (D-029). */
import { useSyncExternalStore } from 'react';

export type ThemePref = 'system' | 'light' | 'dark' | 'hc';
export type ResolvedTheme = 'light' | 'dark' | 'hc';
export type Density = 'comfortable' | 'compact';
export interface Prefs { theme: ThemePref; density: Density }

const KEY = 'add.prefs.v1';
const listeners = new Set<() => void>();

function read(): Prefs {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return { theme: ['system', 'light', 'dark', 'hc'].includes(p.theme) ? p.theme : 'system', density: p.density === 'compact' ? 'compact' : 'comfortable' };
  } catch { return { theme: 'system', density: 'comfortable' }; }
}

let prefs: Prefs = typeof window === 'undefined' ? { theme: 'system', density: 'comfortable' } : read();

export function resolveTheme(t: ThemePref): ResolvedTheme {
  if (t !== 'system') return t;
  if (window.matchMedia('(prefers-contrast: more)').matches) return 'hc';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function apply() {
  const root = document.documentElement;
  root.dataset.theme = resolveTheme(prefs.theme);
  root.dataset.density = prefs.density;
}

if (typeof window !== 'undefined') {
  apply();
  for (const q of ['(prefers-color-scheme: dark)', '(prefers-contrast: more)']) window.matchMedia(q).addEventListener('change', () => { apply(); listeners.forEach((l) => l()); });
}

export function setPrefs(patch: Partial<Prefs>) {
  prefs = { ...prefs, ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* private mode: still applies for this session */ }
  apply();
  listeners.forEach((l) => l());
}

export function usePrefs(): Prefs & { resolvedTheme: ResolvedTheme } {
  const p = useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => prefs, () => prefs);
  return { ...p, resolvedTheme: typeof window === 'undefined' ? 'light' : resolveTheme(p.theme) };
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const THEME_LABEL: Record<ThemePref, string> = { system: 'System', light: 'Light', dark: 'Dark', hc: 'High contrast' };
export const DENSITY_LABEL: Record<Density, string> = { comfortable: 'Comfortable', compact: 'Compact' };
