import syncConfig from '../config/sync-config.json';

export interface SyncTarget {
  id: string;
  name: string;
  manifestUrl: string;
  type: string;
}

export interface SyncSnapshot {
  target: SyncTarget;
  payload: unknown;
  fetchedAt: string;
}

export class SyncEngine {
  private readonly cache = new Map<string, SyncSnapshot>();
  private readonly targets: SyncTarget[] = syncConfig.targets as SyncTarget[];

  constructor(private readonly fetcher: typeof fetch = fetch) {}

  async fetchTarget(target: SyncTarget): Promise<SyncSnapshot> {
    const response = await this.fetcher(target.manifestUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch manifest for ${target.id}: ${response.status}`);
    }
    const payload = await response.json();
    const snapshot: SyncSnapshot = {
      target,
      payload,
      fetchedAt: new Date().toISOString()
    };
    this.cache.set(target.id, snapshot);
    return snapshot;
  }

  async syncNow(): Promise<SyncSnapshot[]> {
    const snapshots: SyncSnapshot[] = [];
    for (const target of this.targets) {
      try {
        const snapshot = await this.fetchTarget(target);
        snapshots.push(snapshot);
      } catch (error) {
        console.warn(`SyncEngine failed for ${target.id}`, error);
      }
    }
    return snapshots;
  }

  syncOnInterval(intervalMs: number, onUpdate?: (snapshots: SyncSnapshot[]) => void): ReturnType<typeof setInterval> {
    return setInterval(async () => {
      const snapshots = await this.syncNow();
      onUpdate?.(snapshots);
    }, intervalMs);
  }

  getCachedSnapshot(id: string): SyncSnapshot | undefined {
    return this.cache.get(id);
  }

  getCache(): SyncSnapshot[] {
    return Array.from(this.cache.values());
  }
}
