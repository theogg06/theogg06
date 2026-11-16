/** Saved views: named URL query strings in localStorage (design/SPEC.md §2.3). */
import { useSyncExternalStore } from 'react';

export interface SavedView { id: string; name: string; query: string; createdAt: string; lastUsedAt: string; isDefault: boolean }

const KEY = 'add.savedViews.v1';
const listeners = new Set<() => void>();
export class StorageUnavailableError extends Error {}

function read(): SavedView[] {
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}
let views: SavedView[] = typeof window === 'undefined' ? [] : read();

function write(next: SavedView[]) {
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { throw new StorageUnavailableError('Browser storage is full or blocked.'); }
  views = next;
  listeners.forEach((l) => l());
}

export const MAX_NAME = 60;

export function validateName(name: string, excludeId?: string): string | null {
  const n = name.trim();
  if (!n) return 'Enter a name for this view.';
  if (n.length > MAX_NAME) return `Use ${MAX_NAME} characters or fewer.`;
  if (views.some((v) => v.id !== excludeId && v.name.toLowerCase() === n.toLowerCase())) return `A view called "${n}" already exists. Choose another name.`;
  return null;
}

export function createView(name: string, query: string, isDefault = false): SavedView {
  const now = new Date().toISOString();
  const v: SavedView = { id: `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name: name.trim(), query, createdAt: now, lastUsedAt: now, isDefault };
  write([...(isDefault ? views.map((x) => ({ ...x, isDefault: false })) : views), v]);
  return v;
}
export function renameView(id: string, name: string) { write(views.map((v) => (v.id === id ? { ...v, name: name.trim() } : v))); }
export function deleteView(id: string): SavedView | undefined { const v = views.find((x) => x.id === id); write(views.filter((x) => x.id !== id)); return v; }
export function restoreView(v: SavedView) { write([...views, v]); }
export function touchView(id: string) { try { write(views.map((v) => (v.id === id ? { ...v, lastUsedAt: new Date().toISOString() } : v))); } catch { /* non-critical */ } }
export function defaultView() { return views.find((v) => v.isDefault); }
export function clearAllViews() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } views = []; listeners.forEach((l) => l()); }

export function useSavedViews(): SavedView[] {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => views, () => views);
}
