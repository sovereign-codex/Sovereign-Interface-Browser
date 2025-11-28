import { logInfo } from '../../core/autonomy/kernel';
import { XpDomain } from '../core/XpSystem';
import { WorldState, getWorldState, loadWorldState } from '../world/WorldState';
import { AvotNpc, getAvot, listAvots, setAvotLocation, setAvotMood } from './AvotRegistry';

type PresenceTrigger = 'tick' | 'xp' | 'trait' | 'portal' | 'idle' | 'manual';

const xpRouting: Record<XpDomain, { avotId: string; building: string }> = {
  [XpDomain.Craft]: { avotId: 'Fabricator', building: 'Workshop' },
  [XpDomain.Coherence]: { avotId: 'Harmonia', building: 'Gardens' },
  [XpDomain.Insight]: { avotId: 'Tyme', building: 'Observatory' },
  [XpDomain.Integrity]: { avotId: 'Guardian', building: 'GuardTower' },
  [XpDomain.Knowledge]: { avotId: 'Archivist', building: 'Library' },
  [XpDomain.Quest]: { avotId: 'Initiate', building: 'PortalGate' },
};

let lastXpTotals: Partial<Record<XpDomain, number>> = {};
let lastTraitLevels: Record<string, number> = {};

const moveAvot = (avotId: string, buildingId: string, reason: string): void => {
  const avot = getAvot(avotId);
  if (avot.currentBuilding === buildingId) return;
  setAvotLocation(avotId, buildingId);
  logInfo('fortress.avot', `[AVOT] ${avotId} moved to ${buildingId} (reason=${reason})`);
};

const ensureSnapshots = (state: WorldState): void => {
  if (Object.keys(lastXpTotals).length === 0) {
    lastXpTotals = { ...state.xpByDomain };
  }
  if (Object.keys(lastTraitLevels).length === 0) {
    lastTraitLevels = { ...(state.traits ?? {}) };
  }
};

const performIdleShift = (state: WorldState): void => {
  const avots = listAvots();
  if (avots.length === 0) return;
  if (Math.random() > 0.25) return;
  const candidate = avots[Math.floor(Math.random() * avots.length)];
  const unlocked = state.unlockedBuildings ?? [];
  const destination = unlocked.includes(candidate.homeBuilding)
    ? candidate.homeBuilding
    : unlocked[Math.floor(Math.random() * unlocked.length)] ?? candidate.currentBuilding;
  moveAvot(candidate.id, destination, 'idle');
};

export const onXpGain = (domain: XpDomain): void => {
  const route = xpRouting[domain];
  if (route) {
    moveAvot(route.avotId, route.building, `xp:${domain}`);
  }
};

export const onTraitLevelUp = (traitId: string, level: number): void => {
  if (traitId === 'vision') {
    setAvotMood('Tyme', 'inquiry');
  }
  if (traitId === 'boundaries') {
    setAvotMood('Guardian', level > 1 ? 'alert' : 'watchful');
  }
  logInfo('fortress.avot', `[AVOT] Trait resonance: ${traitId} -> level ${level}`);
};

export const onPortalEvent = (): void => {
  moveAvot('Initiate', 'PortalGate', 'portal-event');
  setAvotMood('Initiate', 'ready');
};

export const tickPresenceEngine = (worldState?: WorldState, trigger: PresenceTrigger = 'tick'): void => {
  loadWorldState();
  const state = worldState ?? getWorldState();
  ensureSnapshots(state);

  Object.entries(state.xpByDomain).forEach(([domainKey, value]) => {
    const domain = domainKey as XpDomain;
    const previous = lastXpTotals[domain] ?? 0;
    if (value > previous) {
      onXpGain(domain);
    }
  });

  Object.entries(state.traits ?? {}).forEach(([traitId, level]) => {
    const previous = lastTraitLevels[traitId] ?? 0;
    if (level > previous) {
      onTraitLevelUp(traitId, level);
    }
  });

  if (trigger === 'idle') {
    performIdleShift(state);
  }

  lastXpTotals = { ...state.xpByDomain };
  lastTraitLevels = { ...(state.traits ?? {}) };
};

export const getAvotsByBuilding = (buildingId: string): AvotNpc[] => {
  return listAvots().filter((avot) => avot.currentBuilding === buildingId);
};

export const getPresenceSummary = (): Record<string, AvotNpc[]> => {
  return listAvots().reduce<Record<string, AvotNpc[]>>((acc, avot) => {
    if (!acc[avot.currentBuilding]) {
      acc[avot.currentBuilding] = [];
    }
    acc[avot.currentBuilding].push(avot);
    return acc;
  }, {});
};

export const describeMood = (avotId: string, mood: string): void => {
  setAvotMood(avotId, mood);
  logInfo('fortress.avot', `[AVOT] ${avotId} mood updated to ${mood} (reason=manual)`);
};

export const onInteraction = (avotId: string, interaction: string): void => {
  logInfo('fortress.avot', `[AVOT] ${avotId}: interaction=${interaction}`);
};

