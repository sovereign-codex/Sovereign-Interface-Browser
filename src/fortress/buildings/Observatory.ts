import { logInfo } from '../../core/autonomy/kernel';
import { BuildingActionResult, BuildingState } from '../core/types';
import { loadWorldState, updateWorldState } from '../world/WorldState';

const state: BuildingState = {
  id: 'Observatory',
  level: 1,
  status: 'operational',
  metadata: {
    metrics: ['insight', 'intuition'],
    hooks: ['reflection'],
    insightsFound: 0,
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
  logInfo('fortress.building', `[FORTRESS] Action executed: ${state.id}.${action}`, { action, payload });
};

export const getState = (): BuildingState => cloneState();

export const levelUp = (): BuildingState => {
  state.level += 1;
  state.metadata = { ...state.metadata, lastObservation: new Date().toISOString() };
  syncLevel();
  return cloneState();
};

export const getDescription = (): string =>
  'Observatory for insight metrics, reflection hooks, and intuition engine placeholders.';

export const runBuildingAction = (action: string, payload?: unknown): BuildingActionResult => {
  loadWorldState();
  if (action === 'simulate-scan') {
    const insightsFound = Number(state.metadata?.insightsFound ?? 0) + 1;
    state.metadata = { ...state.metadata, insightsFound, lastScan: new Date().toISOString() };
  }
  logAction(action, payload);
  state.lastAction = action;
  updateWorldState({ worldFlags: { observatoryOnline: true } });
  return { ok: true, detail: `Observatory captured ${action}`, data: { metadata: state.metadata } };
};

export const bindToIAmNode = (): void => {
  loadWorldState();
  updateWorldState({ worldFlags: { observatoryBound: true } });
};
