import type { DatasetId, Snapshot } from './types';

export class DataLoadError extends Error {
  constructor(message: string, readonly cause_: string, readonly status?: number) { super(message); }
}

const cache = new Map<DatasetId, Promise<Snapshot>>();

function assertSnapshot(x: unknown, id: DatasetId): asserts x is Snapshot {
  const s = x as Snapshot;
  if (!s || typeof s !== 'object' || s.id !== id || !Array.isArray(s.series) || typeof s.retrievedAt !== 'string')
    throw new DataLoadError(`Snapshot "${id}" has an unexpected format`, 'The cached file is malformed.');
  for (const ser of s.series) if (!Array.isArray(ser.observations)) throw new DataLoadError(`Snapshot "${id}" series ${ser.id} has no observations`, 'The cached file is malformed.');
}

/** Typed loader for the cached ECB/Eurostat snapshots in public/data. */
export function loadSnapshot(id: DatasetId): Promise<Snapshot> {
  let p = cache.get(id);
  if (!p) {
    p = (async () => {
      let res: Response;
      try {
        res = await fetch(`${import.meta.env.BASE_URL}data/${id}.json`);
      } catch {
        throw new DataLoadError(`Couldn't reach the data file for ${id}`, 'The network request failed.');
      }
      if (!res.ok) throw new DataLoadError(`Couldn't load ${id} data`, `The server answered HTTP ${res.status}.`, res.status);
      const json: unknown = await res.json();
      assertSnapshot(json, id);
      return json;
    })();
    p.catch(() => cache.delete(id)); // allow Retry
    cache.set(id, p);
  }
  return p;
}

export function clearSnapshotCache() { cache.clear(); }
