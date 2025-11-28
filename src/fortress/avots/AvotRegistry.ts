import { logInfo } from '../../core/autonomy/kernel';
import { getWorldState, loadWorldState, updateWorldState } from '../world/WorldState';

export interface AvotNpc {
  id: string;
  role: string;
  avatar: string;
  homeBuilding: string;
  currentBuilding: string;
  mood: string;
  traitsFocus?: string[];
}

const defaultAvots: AvotNpc[] = [
  {
    id: 'Tyme',
    role: 'Sage',
    avatar: '🧭',
    homeBuilding: 'Observatory',
    currentBuilding: 'Observatory',
    mood: 'focused',
    traitsFocus: ['vision', 'insight'],
  },
  {
    id: 'Harmonia',
    role: 'Healer',
    avatar: '🌿',
    homeBuilding: 'Gardens',
    currentBuilding: 'Gardens',
    mood: 'calm',
    traitsFocus: ['presence'],
  },
  {
    id: 'Guardian',
    role: 'Protector',
    avatar: '🛡️',
    homeBuilding: 'GuardTower',
    currentBuilding: 'GuardTower',
    mood: 'alert',
    traitsFocus: ['boundaries'],
  },
  {
    id: 'Archivist',
    role: 'Scholar',
    avatar: '📜',
    homeBuilding: 'Library',
    currentBuilding: 'Library',
    mood: 'inquiry',
    traitsFocus: ['scholarship'],
  },
  {
    id: 'Fabricator',
    role: 'Builder',
    avatar: '⚒️',
    homeBuilding: 'Workshop',
    currentBuilding: 'Workshop',
    mood: 'ready',
    traitsFocus: ['craftsmanship'],
  },
  {
    id: 'Initiate',
    role: 'Guide',
    avatar: '✨',
    homeBuilding: 'PortalGate',
    currentBuilding: 'PortalGate',
    mood: 'curious',
    traitsFocus: ['adventurer'],
  },
];

let avots: AvotNpc[] = defaultAvots.map((avot) => ({ ...avot, traitsFocus: avot.traitsFocus ? [...avot.traitsFocus] : undefined }));
let initialized = false;

const persist = (): void => {
  const locationMap = Object.fromEntries(avots.map((avot) => [avot.id, avot.currentBuilding]));
  const moodMap = Object.fromEntries(avots.map((avot) => [avot.id, avot.mood]));
  updateWorldState({ avotLocations: locationMap, avotMoods: moodMap });
};

const ensureLoaded = (): void => {
  if (initialized) return;
  loadWorldState();
  const world = getWorldState();
  avots = defaultAvots.map((avot) => ({
    ...avot,
    currentBuilding: world.avotLocations?.[avot.id] ?? avot.homeBuilding,
    mood: world.avotMoods?.[avot.id] ?? avot.mood,
    traitsFocus: avot.traitsFocus ? [...avot.traitsFocus] : undefined,
  }));
  initialized = true;
};

const cloneAvot = (avot: AvotNpc): AvotNpc => ({
  ...avot,
  traitsFocus: avot.traitsFocus ? [...avot.traitsFocus] : undefined,
});

export const listAvots = (): AvotNpc[] => {
  ensureLoaded();
  return avots.map(cloneAvot);
};

export const getAvot = (id: string): AvotNpc => {
  ensureLoaded();
  const match = avots.find((avot) => avot.id === id);
  if (!match) {
    throw new Error(`AVOT not found: ${id}`);
  }
  return cloneAvot(match);
};

export const setAvotLocation = (id: string, buildingId: string): void => {
  ensureLoaded();
  avots = avots.map((avot) => (avot.id === id ? { ...avot, currentBuilding: buildingId } : avot));
  persist();
  logInfo('fortress.avot', `[AVOT] ${id} moved to ${buildingId}`);
};

export const setAvotMood = (id: string, mood: string): void => {
  ensureLoaded();
  avots = avots.map((avot) => (avot.id === id ? { ...avot, mood } : avot));
  persist();
  logInfo('fortress.avot', `[AVOT] ${id}: mood=${mood}`);
};

export const resetAvots = (): AvotNpc[] => {
  avots = defaultAvots.map((avot) => ({ ...avot, traitsFocus: avot.traitsFocus ? [...avot.traitsFocus] : undefined }));
  initialized = false;
  persist();
  return listAvots();
};
