import { logError, logInfo } from '../core/autonomy/log';
import { AppliedUpdateRecord, SovereignUpdateManifest } from './types';

const appliedUpdates: AppliedUpdateRecord[] = [];

const manifestPaths = ['/suc/example-manifest.json'];

export const loadAvailableManifests = async (): Promise<SovereignUpdateManifest[]> => {
  const manifests: SovereignUpdateManifest[] = [];

  for (const path of manifestPaths) {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to fetch manifest at ${path}`);
      }
      const manifest = (await response.json()) as SovereignUpdateManifest;
      manifests.push(manifest);
    } catch (error) {
      logError('suc.registry', 'Failed to load manifest', { path, error });
    }
  }

  logInfo('suc.registry', `[SUC] Loaded ${manifests.length} available update(s).`);
  return manifests;
};

export const listAppliedUpdates = (): AppliedUpdateRecord[] => [...appliedUpdates];

export const markApplied = (
  updateId: string,
  manifest?: SovereignUpdateManifest,
  notes?: string,
): AppliedUpdateRecord => {
  const record: AppliedUpdateRecord = {
    id: updateId,
    appliedAt: new Date().toISOString(),
    version: manifest?.version ?? 'unknown',
    notes,
  };
  appliedUpdates.push(record);
  logInfo('suc.registry', `[SUC] Marked update as applied: ${updateId}.`, { notes });
  return record;
};
