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
  state.metadata = { ...state.metadata, lastObservation: new Date().toISOString() };
  syncLevel();
  return cloneState();
};

export const getDescription = (): string =>
  'Observatory for insight metrics, reflection hooks, and intuition engine placeholders.';

export const runBuildingAction = (action: string, payload?: unknown): BuildingActionResult => {
  logAction(action, payload);
  state.lastAction = action;
  return { ok: true, detail: `Observatory captured ${action}`, data: payload };
};

export const bindToIAmNode = (): void => {
  loadWorldState();
  updateWorldState({ worldFlags: { observatoryBound: true } });
};
