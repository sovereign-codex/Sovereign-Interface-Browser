import packageJson from '../../package.json';
import { logError, logInfo } from '../core/autonomy/log';
import { listAppliedUpdates, loadAvailableManifests, markApplied } from './registry';
import { AppliedUpdateRecord, SovereignUpdateManifest } from './types';

const FALLBACK_VERSION = '0.1.0';
const systemVersion: string = typeof packageJson.version === 'string' ? packageJson.version : FALLBACK_VERSION;

export interface UpdateStatus {
  systemVersion: string;
  applied: AppliedUpdateRecord[];
  available: SovereignUpdateManifest[];
}

export interface SimulationResult {
  ok: boolean;
  reasons: string[];
  manifest: SovereignUpdateManifest | null;
}

const findManifest = async (id: string): Promise<SovereignUpdateManifest | null> => {
  const available = await loadAvailableManifests();
  return available.find((m) => m.id === id) ?? null;
};

export const getUpdateStatus = async (): Promise<UpdateStatus> => {
  try {
    const [available, applied] = await Promise.all([loadAvailableManifests(), Promise.resolve(listAppliedUpdates())]);
    logInfo('suc.spm', `[SUC] Status checked: ${applied.length} applied, ${available.length} available.`);
    return { systemVersion, applied, available };
  } catch (error) {
    logError('suc.spm', 'Failed to get update status', { error });
    return { systemVersion, applied: listAppliedUpdates(), available: [] };
  }
};

export const previewUpdate = async (id: string): Promise<SovereignUpdateManifest | null> => findManifest(id);

export const simulateApplyUpdate = async (id: string): Promise<SimulationResult> => {
  const manifest = await findManifest(id);
  const applied = listAppliedUpdates();
  const reasons: string[] = [];

  if (!manifest) {
    return { ok: false, reasons: ['Update not found'], manifest: null };
  }

  const required = manifest.requires ?? [];
  for (const req of required) {
    if (!applied.some((a) => a.id === req)) {
      reasons.push(`Requires ${req} to be applied first.`);
    }
  }

  const incompatible = manifest.incompatibleWith ?? [];
  for (const conflict of incompatible) {
    if (applied.some((a) => a.id === conflict)) {
      reasons.push(`Incompatible with already applied update ${conflict}.`);
    }
  }

  return { ok: reasons.length === 0, reasons, manifest };
};

export const markUpdateApplied = async (id: string, notes?: string): Promise<AppliedUpdateRecord | null> => {
  const manifest = await previewUpdate(id);
  if (!manifest) {
    logError('suc.spm', `Manifest not found for update ${id}`);
    return null;
  }

  const record = markApplied(id, manifest, notes);
  logInfo('suc.spm', `[SUC] Marked update as applied: ${id}.`, { notes });
  return record;
};
