import { logInfo } from '../../core/autonomy/kernel';
import { BuildingActionResult, BuildingState } from '../core/types';
import { recalculateTraitsFromXp } from '../core/Traits';
import { grantXp, getXpSnapshot, XpDomain } from '../core/XpSystem';
import { loadWorldState, updateWorldState } from '../world/WorldState';

const state: BuildingState = {
  id: 'PortalGate',
  level: 1,
  status: 'operational',
  metadata: {
    integrations: ['Talos'],
    triggers: ['mission', 'event'],
    portalVisits: 0,
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
  state.metadata = { ...state.metadata, lastPortal: new Date().toISOString() };
  syncLevel();
  return cloneState();
};

export const getDescription = (): string =>
  'Portal Gate for quest launching, Talos integration, and mission/event triggers.';

export const runBuildingAction = (action: string, payload?: unknown): BuildingActionResult => {
  loadWorldState();
  if (action === 'simulate-open-portal') {
    const portalVisits = Number(state.metadata?.portalVisits ?? 0) + 1;
    state.metadata = { ...state.metadata, portalVisits, lastPortal: new Date().toISOString() };
    updateWorldState({ lastPortalVisited: `Portal-${portalVisits}` });
    grantXp(XpDomain.Quest, 5, 'PortalGate:simulate-open-portal', 'PortalGate');
    const snapshot = getXpSnapshot();
    recalculateTraitsFromXp(snapshot);
  }
  logAction(action, payload);
  state.lastAction = action;
  updateWorldState({ worldFlags: { portalGateActive: true } });
  return { ok: true, detail: `PortalGate routed ${action}`, data: { metadata: state.metadata } };
};

export const bindToIAmNode = (): void => {
  loadWorldState();
  updateWorldState({ worldFlags: { portalGateBound: true }, bindToIAmNode: true });
};
