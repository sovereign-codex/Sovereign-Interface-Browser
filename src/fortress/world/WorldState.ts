import { logInfo } from '../../core/autonomy/kernel';
import { SIBStorage } from '../../storage/SIBStorage';
import type { XpDomain, XpLedgerEntry } from '../core/XpSystem';

export const FORTRESS_WORLD_VERSION = '0.1.0';
export const FORTRESS_WORLD_PHASE = 'Phase 1';
export const FORTRESS_VERSION_LABEL = `v${FORTRESS_WORLD_VERSION} (${FORTRESS_WORLD_PHASE})`;

export interface WorldState {
  currentDistricts: string[];
  unlockedBuildings: string[];
  buildingLevels: Record<string, number>;
  worldFlags: Record<string, boolean>;
  lastPortalVisited: string | null;
  worldVersion: string;
  bindToIAmNode: boolean;
  xpByDomain: Record<XpDomain, number>;
  xpHistory: XpLedgerEntry[];
  traits: Record<string, number>;
}

export type WorldStateUpdate = Partial<Omit<WorldState, 'buildingLevels' | 'worldFlags' | 'xpByDomain' | 'xpHistory'>> & {
  buildingLevels?: Partial<Record<string, number>>;
  worldFlags?: Partial<Record<string, boolean>>;
  xpByDomain?: Partial<Record<XpDomain, number>>;
  xpHistory?: XpLedgerEntry[];
  traits?: Record<string, number>;
};

const storage = new SIBStorage('fortress_v1');
const STORAGE_KEY = 'fortress.world.state';

const defaultWorldState: WorldState = {
  currentDistricts: ['North Nexus', 'Central Nexus', 'South Nexus'],
  unlockedBuildings: ['TownHall', 'Workshop', 'Library', 'Observatory', 'Gardens', 'GuardTower', 'PortalGate'],
  buildingLevels: {
    TownHall: 1,
    Workshop: 1,
    Library: 1,
    Observatory: 1,
    Gardens: 1,
    GuardTower: 1,
    PortalGate: 1,
  },
  worldFlags: {
    initialized: true,
    phase: true,
  },
  lastPortalVisited: null,
  worldVersion: FORTRESS_WORLD_VERSION,
  bindToIAmNode: true,
  xpByDomain: {
    craft: 0,
    knowledge: 0,
    insight: 0,
    coherence: 0,
    integrity: 0,
    quest: 0,
  },
  xpHistory: [],
  traits: {},
};

let worldState: WorldState = { ...defaultWorldState };
let initialized = false;

const cloneState = (state: WorldState): WorldState => ({
  ...state,
  currentDistricts: [...state.currentDistricts],
  unlockedBuildings: [...state.unlockedBuildings],
  buildingLevels: { ...state.buildingLevels },
  worldFlags: { ...state.worldFlags },
  xpByDomain: { ...state.xpByDomain },
  xpHistory: [...state.xpHistory],
  traits: { ...state.traits },
});

const persist = (): void => {
  storage.setItem(STORAGE_KEY, worldState);
};

export const loadWorldState = (): WorldState => {
  const stored = storage.getItem<WorldState>(STORAGE_KEY);
  if (stored) {
    worldState = {
      ...defaultWorldState,
      ...stored,
      buildingLevels: { ...defaultWorldState.buildingLevels, ...stored.buildingLevels },
      worldFlags: { ...defaultWorldState.worldFlags, ...stored.worldFlags },
      xpByDomain: { ...defaultWorldState.xpByDomain, ...stored.xpByDomain },
      xpHistory: stored.xpHistory ?? defaultWorldState.xpHistory,
      traits: stored.traits ?? defaultWorldState.traits,
    };
  } else {
    worldState = { ...defaultWorldState };
    persist();
  }

  if (!initialized) {
    initialized = true;
    logInfo(
      'fortress.world',
      `[FORTRESS] World Engine initialized. Structures loaded: ${worldState.unlockedBuildings.length}.`,
      {
        worldVersion: worldState.worldVersion,
        bindToIAmNode: worldState.bindToIAmNode,
      },
    );
  }

  return getWorldState();
};

export const saveWorldState = (): void => {
  persist();
};

export const getWorldState = (): WorldState => {
  if (!initialized) {
    loadWorldState();
  }
  return cloneState(worldState);
};

export const updateWorldState = (updates: WorldStateUpdate): WorldState => {
  if (!initialized) {
    loadWorldState();
  }
  worldState = {
    ...worldState,
    ...updates,
    buildingLevels: { ...worldState.buildingLevels, ...(updates.buildingLevels ?? {}) },
    worldFlags: { ...worldState.worldFlags, ...(updates.worldFlags ?? {}) },
    xpByDomain: { ...worldState.xpByDomain, ...(updates.xpByDomain ?? {}) },
    xpHistory: updates.xpHistory ?? worldState.xpHistory,
    traits: updates.traits ?? worldState.traits,
    worldVersion: updates.worldVersion ?? worldState.worldVersion ?? FORTRESS_WORLD_VERSION,
  };
  persist();
  return getWorldState();
};

export const resetWorldState = (): WorldState => {
  initialized = true;
  worldState = { ...defaultWorldState };
  persist();
  return getWorldState();
};
