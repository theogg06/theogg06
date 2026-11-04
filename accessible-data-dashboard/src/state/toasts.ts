/** Toast queue. Toasts with an action persist until dismissed (2.2.1); others auto-hide after 8 s unless hovered/focused. */
import { useSyncExternalStore } from 'react';
import { announce } from './announcer';

export interface Toast { id: number; kind: 'success' | 'error' | 'info'; message: string; action?: { label: string; onAction: () => void } }
let toasts: Toast[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function showToast(t: Omit<Toast, 'id'>) {
  const toast = { ...t, id: ++seq };
  toasts = [...toasts.slice(-3), toast];
  emit();
  announce(t.message + (t.action ? ` ${t.action.label} is available.` : ''), t.kind === 'error' ? 'assertive' : 'polite', 100);
  return toast.id;
}
export function dismissToast(id: number) { toasts = toasts.filter((t) => t.id !== id); emit(); }
export function useToasts() { return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => toasts, () => toasts); }
