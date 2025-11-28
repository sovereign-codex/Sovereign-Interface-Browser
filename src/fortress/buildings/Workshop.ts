import { logInfo } from '../../core/autonomy/kernel';
import { BuildingActionResult, BuildingState } from '../core/types';
import { recalculateTraitsFromXp } from '../core/Traits';
import { grantXp, getXpSnapshot, XpDomain } from '../core/XpSystem';
import { loadWorldState, updateWorldState } from '../world/WorldState';

const state: BuildingState = {
  id: 'Workshop',
  level: 1,
  status: 'operational',
  metadata: {
    capabilities: ['crafting', 'skill-tree'],
    bindings: ['learning-module'],
    blueprintCount: 0,
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
  logInfo('fortress.building', `[FORTRESS] Action executed: ${state.id}.${action}`, {
    action,
    payload,
  });
};

export const getState = (): BuildingState => cloneState();

export const levelUp = (): BuildingState => {
  state.level += 1;
  state.metadata = { ...state.metadata, lastUpgrade: new Date().toISOString() };
  syncLevel();
  return cloneState();
};

export const getDescription = (): string =>
  'Workshop for capability crafting, learning module binding, and skill-tree placeholders.';

export const runBuildingAction = (action: string, payload?: unknown): BuildingActionResult => {
  loadWorldState();
  if (action === 'simulate-craft') {
    const current = Number(state.metadata?.blueprintCount ?? 0) + 1;
    state.metadata = { ...state.metadata, blueprintCount: current, lastCraftedAt: new Date().toISOString() };
    grantXp(XpDomain.Craft, 5, 'Workshop:simulate-craft', 'Workshop');
    const snapshot = getXpSnapshot();
    recalculateTraitsFromXp(snapshot);
  }
  logAction(action, payload);
  state.lastAction = action;
  updateWorldState({ worldFlags: { workshopActive: true } });
  return { ok: true, detail: `Workshop executed ${action}`, data: { metadata: state.metadata } };
};

export const bindToIAmNode = (): void => {
  loadWorldState();
  updateWorldState({ worldFlags: { workshopBound: true } });
};
