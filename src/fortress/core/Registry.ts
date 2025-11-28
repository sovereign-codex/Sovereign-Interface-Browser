import { logInfo } from '../../core/autonomy/kernel';
import { loadIAmProfile, updateIAmProfile } from './IAmNode';
import { BuildingActionResult, BuildingMetadata, BuildingModule, BuildingState } from './types';
import * as Workshop from '../buildings/Workshop';
import * as Library from '../buildings/Library';
import * as Observatory from '../buildings/Observatory';
import * as Gardens from '../buildings/Gardens';
import * as GuardTower from '../buildings/GuardTower';
import * as PortalGate from '../buildings/PortalGate';
import { getWorldState, loadWorldState, updateWorldState } from '../world/WorldState';

const townHallModule: BuildingModule = {
  getState: (): BuildingState => {
    const world = getWorldState();
    const profile = loadIAmProfile();
    return {
      id: 'TownHall',
      level: world.buildingLevels.TownHall ?? 1,
      status: 'identity-core',
      metadata: { profile },
      boundToIAmNode: world.bindToIAmNode,
    };
  },
  levelUp: (): BuildingState => {
    const current = getWorldState();
    const nextLevel = (current.buildingLevels.TownHall ?? 1) + 1;
    updateWorldState({ buildingLevels: { TownHall: nextLevel } });
    updateIAmProfile({ coherenceIndex: loadIAmProfile().coherenceIndex + 1 });
    return townHallModule.getState();
  },
  getDescription: (): string => 'I-AM Town Hall core identity node.',
  runBuildingAction: (action: string): BuildingActionResult => {
    logInfo('fortress.building', `[FORTRESS] Building action invoked: TownHall → ${action}`, { action });
    loadWorldState();
    return { ok: true, detail: `TownHall processed ${action}` };
  },
  bindToIAmNode: (): void => {
    loadWorldState();
    updateWorldState({ bindToIAmNode: true });
  },
};

export const buildingMetadata: BuildingMetadata[] = [
  {
    id: 'TownHall',
    title: 'I-AM Town Hall',
    description: 'Core identity node binding to Sovereign identity.',
    archetype: 'core',
    path: 'src/fortress/core/IAmNode.ts',
  },
  {
    id: 'Workshop',
    title: 'Workshop',
    description: 'Capability crafting and skill-tree placeholder.',
    archetype: 'craft',
    path: 'src/fortress/buildings/Workshop.ts',
  },
  {
    id: 'Library',
    title: 'Library',
    description: 'Scroll storage with memory APIs.',
    archetype: 'memory',
    path: 'src/fortress/buildings/Library.ts',
  },
  {
    id: 'Observatory',
    title: 'Observatory',
    description: 'Insight metrics and intuition hooks.',
    archetype: 'insight',
    path: 'src/fortress/buildings/Observatory.ts',
  },
  {
    id: 'Gardens',
    title: 'Gardens',
    description: 'Coherence rituals and grounding.',
    archetype: 'wellness',
    path: 'src/fortress/buildings/Gardens.ts',
  },
  {
    id: 'GuardTower',
    title: 'Guard Tower',
    description: 'Fragmentation scans and boundary integrity.',
    archetype: 'security',
    path: 'src/fortress/buildings/GuardTower.ts',
  },
  {
    id: 'PortalGate',
    title: 'Portal Gate',
    description: 'Quest launcher and Talos integration.',
    archetype: 'gateway',
    path: 'src/fortress/buildings/PortalGate.ts',
  },
];

const buildingModules: Record<string, BuildingModule> = {
  TownHall: townHallModule,
  Workshop,
  Library,
  Observatory,
  Gardens,
  GuardTower,
  PortalGate,
};

export const listBuildings = (): BuildingMetadata[] => [...buildingMetadata];

export const getBuildingModule = (id: string): BuildingModule | null => buildingModules[id] ?? null;

loadWorldState();
