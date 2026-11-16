import { useCallback, useEffect, useState } from 'react';
import type { DatasetId, Snapshot, WidgetState } from '../data/types';
import { DataLoadError, clearSnapshotCache, loadSnapshot } from '../data/snapshots';
import { simulateState } from '../data/synthetic';

export type Load =
  | { status: 'loading' }
  | { status: 'error'; error: DataLoadError; synthetic: boolean }
  | { status: 'ready'; snapshot: Snapshot; simulated: WidgetState | null };

/**
 * Load a snapshot, optionally transformed by a simulated state
 * (prototype controls / `?sim.<widget>=<state>`). Simulated loading never
 * resolves; simulated error throws a synthetic, labelled error.
 */
export function useSnapshot(dataset: DatasetId, sim: WidgetState | undefined): Load & { retry: () => void } {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoad({ status: 'loading' });
    if (sim === 'loading') return () => { alive = false; };
    if (sim === 'error') {
      const t = setTimeout(() => alive && setLoad({ status: 'error', error: new DataLoadError(`Couldn't load ${dataset} data`, 'The data service did not respond within 10 seconds (simulated HTTP 504).', 504), synthetic: true }), 300);
      return () => { alive = false; clearTimeout(t); };
    }
    loadSnapshot(dataset)
      .then((snap) => alive && setLoad({ status: 'ready', snapshot: sim && sim !== 'ready' ? simulateState(snap, sim) : snap, simulated: sim && sim !== 'ready' ? sim : null }))
      .catch((e: unknown) => alive && setLoad({ status: 'error', error: e instanceof DataLoadError ? e : new DataLoadError(`Couldn't load ${dataset} data`, String(e)), synthetic: false }));
    return () => { alive = false; };
  }, [dataset, sim, attempt]);
  const retry = useCallback(() => { clearSnapshotCache(); setAttempt((a) => a + 1); }, []);
  return { ...load, retry };
}

/** Observe an element's width (container-driven breakpoints, D-028). */
export function useWidth<T extends HTMLElement>(): [(el: T | null) => void, number] {
  const [el, setEl] = useState<T | null>(null);
  const [w, setW] = useState(1200);
  useEffect(() => {
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return [setEl, w];
}
