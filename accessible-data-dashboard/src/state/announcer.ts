/**
 * Global live-region announcer (WCAG 4.1.3). Two persistent, visually hidden
 * regions exist in the DOM from first render (see <LiveRegions/>), so
 * messages are announced reliably. Messages are debounced (500 ms) and the
 * region is cleared first so identical messages are re-announced.
 */
import { useSyncExternalStore } from 'react';

type Politeness = 'polite' | 'assertive';
let messages: Record<Politeness, string> = { polite: '', assertive: '' };
const listeners = new Set<() => void>();
const timers: Partial<Record<Politeness, ReturnType<typeof setTimeout>>> = {};
let history: { at: number; politeness: Politeness; text: string }[] = [];

export function announce(text: string, politeness: Politeness = 'polite', delay = 500) {
  clearTimeout(timers[politeness]);
  messages = { ...messages, [politeness]: '' };
  listeners.forEach((l) => l());
  timers[politeness] = setTimeout(() => {
    messages = { ...messages, [politeness]: text };
    history = [...history.slice(-49), { at: Date.now(), politeness, text }];
    listeners.forEach((l) => l());
  }, delay);
}

export function useAnnouncements() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => messages, () => messages);
}

/** Exposed for tests: last N announcements. */
export function announcementHistory() { return history; }
if (typeof window !== 'undefined') (window as unknown as { __announcements: () => typeof history }).__announcements = announcementHistory;
