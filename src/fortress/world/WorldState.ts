import { logInfo } from '../../core/autonomy/kernel';
import { SIBStorage } from '../../storage/SIBStorage';
import type { Quest } from '../quests/QuestTypes';
import { ensureSeedQuestsInitialized } from '../quests/QuestSeeder';
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
  avotLocations: Record<string, string>;
  avotMoods: Record<string, string>;
  quests: Quest[];
}

export type WorldStateUpdate = Partial<Omit<WorldState, 'buildingLevels' | 'worldFlags' | 'xpByDomain' | 'xpHistory'>> & {
  buildingLevels?: Partial<Record<string, number>>;
  worldFlags?: Partial<Record<string, boolean>>;
  xpByDomain?: Partial<Record<XpDomain, number>>;
  xpHistory?: XpLedgerEntry[];
  traits?: Record<string, number>;
  avotLocations?: Record<string, string>;
  avotMoods?: Record<string, string>;
  quests?: Quest[];
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
  avotLocations: {
    Tyme: 'Observatory',
    Harmonia: 'Gardens',
    Guardian: 'GuardTower',
    Archivist: 'Library',
    Fabricator: 'Workshop',
    Initiate: 'PortalGate',
  },
  avotMoods: {
    Tyme: 'focused',
    Harmonia: 'calm',
    Guardian: 'alert',
    Archivist: 'inquiry',
    Fabricator: 'ready',
    Initiate: 'curious',
  },
  quests: [],
};

let worldState: WorldState = { ...defaultWorldState };
let initialized = false;
let loading = false;

const cloneState = (state: WorldState): WorldState => ({
  ...state,
  currentDistricts: [...state.currentDistricts],
  unlockedBuildings: [...state.unlockedBuildings],
  buildingLevels: { ...state.buildingLevels },
  worldFlags: { ...state.worldFlags },
  xpByDomain: { ...state.xpByDomain },
  xpHistory: [...state.xpHistory],
  traits: { ...state.traits },
  avotLocations: { ...state.avotLocations },
  avotMoods: { ...state.avotMoods },
  quests: state.quests ? state.quests.map((quest) => ({ ...quest })) : [],
});

const persist = (): void => {
  storage.setItem(STORAGE_KEY, worldState);
};

export const loadWorldState = (): WorldState => {
  if (loading) {
    return getWorldState();
  }
  loading = true;
  const stored = storage.getItem<WorldState>(STORAGE_KEY);
  const needsQuestBootstrap = !stored || !('quests' in stored) || (stored?.quests?.length ?? 0) === 0;
  if (stored) {
    worldState = {
      ...defaultWorldState,
      ...stored,
      buildingLevels: { ...defaultWorldState.buildingLevels, ...stored.buildingLevels },
      worldFlags: { ...defaultWorldState.worldFlags, ...stored.worldFlags },
      xpByDomain: { ...defaultWorldState.xpByDomain, ...stored.xpByDomain },
      xpHistory: stored.xpHistory ?? defaultWorldState.xpHistory,
      traits: stored.traits ?? defaultWorldState.traits,
      avotLocations: { ...defaultWorldState.avotLocations, ...(stored.avotLocations ?? {}) },
      avotMoods: { ...defaultWorldState.avotMoods, ...(stored.avotMoods ?? {}) },
      quests: stored.quests ?? [],
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

  if (needsQuestBootstrap) {
    worldState = { ...worldState, quests: worldState.quests ?? [] };
    persist();
    ensureSeedQuestsInitialized();
  }

  loading = false;

  return getWorldState();
};

export const saveWorldState = (): void => {
  persist();
};

export const getWorldState = (): WorldState => {
  if (!initialized && !loading) {
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
    avotLocations: { ...worldState.avotLocations, ...(updates.avotLocations ?? {}) },
    avotMoods: { ...worldState.avotMoods, ...(updates.avotMoods ?? {}) },
    worldVersion: updates.worldVersion ?? worldState.worldVersion ?? FORTRESS_WORLD_VERSION,
    quests: updates.quests ?? worldState.quests,
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
