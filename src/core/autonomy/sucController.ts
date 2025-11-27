import { logError, logInfo } from './kernel';
import { getUpdateStatus } from '../../suc/spm';
import { AppliedUpdateRecord, SovereignUpdateManifest } from '../../suc/types';

export interface SucStatusSnapshot {
  systemVersion: string;
  lastUpdateCheckAt?: string;
  appliedCount: number;
  pendingCount: number;
  applied: AppliedUpdateRecord[];
  available: SovereignUpdateManifest[];
}

const snapshot: SucStatusSnapshot = {
  systemVersion: '0.1.0',
  appliedCount: 0,
  pendingCount: 0,
  applied: [],
  available: [],
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
