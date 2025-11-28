import { logError, logInfo } from './kernel';
import { getUpdateStatus } from '../../suc/spm';
import { AppliedUpdateRecord, SovereignUpdateManifest } from '../../suc/types';
import { FORTRESS_VERSION_LABEL, FORTRESS_WORLD_VERSION } from '../../fortress/world/WorldState';

export interface SucStatusSnapshot {
  systemVersion: string;
  lastUpdateCheckAt?: string;
  appliedCount: number;
  pendingCount: number;
  applied: AppliedUpdateRecord[];
  available: SovereignUpdateManifest[];
  fortressWorldVersion: string;
  fortressVersionLabel: string;
}

const snapshot: SucStatusSnapshot = {
  systemVersion: '0.1.0',
  appliedCount: 0,
  pendingCount: 0,
  applied: [],
  available: [],
  fortressWorldVersion: FORTRESS_WORLD_VERSION,
  fortressVersionLabel: FORTRESS_VERSION_LABEL,
};

export const refreshStatus = async (): Promise<void> => {
  try {
    const status = await getUpdateStatus();
    snapshot.systemVersion = status.systemVersion;
    snapshot.applied = status.applied;
    snapshot.available = status.available;
    snapshot.appliedCount = status.applied.length;
    snapshot.pendingCount = status.available.length;
    snapshot.lastUpdateCheckAt = new Date().toISOString();
    snapshot.fortressWorldVersion = FORTRESS_WORLD_VERSION;
    snapshot.fortressVersionLabel = FORTRESS_VERSION_LABEL;
    logInfo('suc.controller', `[SUC] Status refreshed: ${snapshot.appliedCount} applied, ${snapshot.pendingCount} available.`);
  } catch (error) {
    logError('suc.controller', '[SUC] Failed to refresh update status', { error });
  }
};

export const getStatusSnapshot = (): SucStatusSnapshot => ({
  ...snapshot,
  applied: [...snapshot.applied],
  available: [...snapshot.available],
});
