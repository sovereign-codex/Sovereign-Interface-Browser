import { logInfo } from '../../core/autonomy/kernel';
import { BuildingActionResult, BuildingState } from '../core/types';
import { loadWorldState, updateWorldState } from '../world/WorldState';

const state: BuildingState = {
  id: 'GuardTower',
  level: 1,
  status: 'operational',
  metadata: {
    scans: ['fragmentation'],
    metrics: ['boundaryIntegrity'],
  },
};

const cloneState = (): BuildingState => ({
  ...state,
  metadata: state.metadata ? { ...state.metadata } : undefined,
});

const syncLevel = (): void => {
  loadWorldState();
  updateWorldState({ buildingLevels: { [state.id]: state.level } });
};

const logAction = (action: string, payload?: unknown): void => {
  logInfo('fortress.building', `[FORTRESS] Building action invoked: ${state.id} → ${action}`, { action, payload });
};

export const getState = (): BuildingState => cloneState();

export const levelUp = (): BuildingState => {
  state.level += 1;
  state.metadata = { ...state.metadata, lastScan: new Date().toISOString() };
  syncLevel();
  return cloneState();
};

export const getDescription = (): string =>
  'Guard Tower for fragmentation scans, shadow work logs, and boundary integrity indices.';

export const runBuildingAction = (action: string, payload?: unknown): BuildingActionResult => {
  logAction(action, payload);
  state.lastAction = action;
  return { ok: true, detail: `GuardTower processed ${action}`, data: payload };
};

export const bindToIAmNode = (): void => {
  loadWorldState();
  updateWorldState({ worldFlags: { guardTowerBound: true } });
};
