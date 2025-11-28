import { logInfo } from '../../core/autonomy/kernel';
import { BuildingActionResult, BuildingState } from '../core/types';
import { loadWorldState, updateWorldState } from '../world/WorldState';

const state: BuildingState = {
  id: 'Library',
  level: 1,
  status: 'operational',
  metadata: {
    scrollStorage: true,
    indices: ['memory', 'docs'],
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
  state.metadata = { ...state.metadata, lastIndexRefresh: new Date().toISOString() };
  syncLevel();
  return cloneState();
};

export const getDescription = (): string => 'Library for scroll storage, memory APIs, and document indexing placeholders.';

export const runBuildingAction = (action: string, payload?: unknown): BuildingActionResult => {
  logAction(action, payload);
  state.lastAction = action;
  return { ok: true, detail: `Library performed ${action}`, data: payload };
};

export const bindToIAmNode = (): void => {
  loadWorldState();
  updateWorldState({ worldFlags: { libraryBound: true } });
};
