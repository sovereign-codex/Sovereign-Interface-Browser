import { logInfo } from '../../core/autonomy/kernel';
import { BuildingActionResult, BuildingState } from '../core/types';
import { loadWorldState, updateWorldState } from '../world/WorldState';

const state: BuildingState = {
  id: 'Gardens',
  level: 1,
  status: 'operational',
  metadata: {
    rituals: ['coherence', 'grounding'],
    supports: ['breathwork'],
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
  state.metadata = { ...state.metadata, lastRitual: new Date().toISOString() };
  syncLevel();
  return cloneState();
};

export const getDescription = (): string =>
  'Gardens for coherence rituals, breathworks, and energy grounding nodes.';

export const runBuildingAction = (action: string, payload?: unknown): BuildingActionResult => {
  logAction(action, payload);
  state.lastAction = action;
  return { ok: true, detail: `Gardens hosted ${action}`, data: payload };
};

export const bindToIAmNode = (): void => {
  loadWorldState();
  updateWorldState({ worldFlags: { gardensBound: true } });
};
