import { logInfo } from '../../core/autonomy/kernel';
import { getWorldState, loadWorldState, updateWorldState } from '../world/WorldState';
import { getIAmProfile, updateIAmProfile } from './IAmNode';
import { XpDomain, type XpSnapshot } from './XpSystem';

export interface Trait {
  id: string;
  label: string;
  description?: string;
  level: number;
  xpDomain: XpDomain;
  thresholds: number[];
}

export interface TraitSnapshot {
  traits: Trait[];
}

const baseTraits: Trait[] = [
  {
    id: 'craftsmanship',
    label: 'Craftsmanship',
    level: 0,
    xpDomain: XpDomain.Craft,
    thresholds: [50, 150, 300, 600, 1000],
  },
  {
    id: 'scholarship',
    label: 'Scholarship',
    level: 0,
    xpDomain: XpDomain.Knowledge,
    thresholds: [50, 150, 300, 600, 1000],
  },
  {
    id: 'vision',
    label: 'Vision',
    level: 0,
    xpDomain: XpDomain.Insight,
    thresholds: [50, 150, 300, 600, 1000],
  },
  {
    id: 'presence',
    label: 'Presence',
    level: 0,
    xpDomain: XpDomain.Coherence,
    thresholds: [50, 150, 300, 600, 1000],
  },
  {
    id: 'boundaries',
    label: 'Boundaries',
    level: 0,
    xpDomain: XpDomain.Integrity,
    thresholds: [50, 150, 300, 600, 1000],
  },
  {
    id: 'adventurer',
    label: 'Adventurer',
    level: 0,
    xpDomain: XpDomain.Quest,
    thresholds: [50, 150, 300, 600, 1000],
  },
];

let traitState: Trait[] = baseTraits.map((trait) => ({ ...trait, thresholds: [...trait.thresholds] }));

const ensureTraitsLoaded = (): void => {
  loadWorldState();
  const world = getWorldState();
  const levels = world.traits ?? {};
  traitState = traitState.map((trait) => ({
    ...trait,
    level: levels[trait.id] ?? trait.level ?? 0,
    thresholds: [...trait.thresholds],
  }));
};

const persistTraitLevels = (): void => {
  const levelMap = Object.fromEntries(traitState.map((trait) => [trait.id, trait.level]));
  updateWorldState({ traits: levelMap });
  const profile = getIAmProfile();
  updateIAmProfile({ traits: { ...profile.traits, ...levelMap } });
};

export const getTraits = (): TraitSnapshot => {
  ensureTraitsLoaded();
  return { traits: traitState.map((trait) => ({ ...trait, thresholds: [...trait.thresholds] })) };
};

export const updateTraitLevel = (traitId: string, level: number): void => {
  ensureTraitsLoaded();
  traitState = traitState.map((trait) => (trait.id === traitId ? { ...trait, level } : trait));
  persistTraitLevels();
};

const calculateLevel = (xpAmount: number, thresholds: number[]): number => {
  return thresholds.filter((threshold) => xpAmount >= threshold).length;
};

export const recalculateTraitsFromXp = (xp: XpSnapshot): TraitSnapshot => {
  ensureTraitsLoaded();
  let changed = false;

  traitState = traitState.map((trait) => {
    const xpAmount = xp.totalByDomain[trait.xpDomain] ?? 0;
    const nextLevel = calculateLevel(xpAmount, trait.thresholds);
    if (nextLevel > trait.level) {
      changed = true;
      logInfo('fortress.traits', `[TRAIT] ${trait.id} leveled up to ${nextLevel}.`);
      return { ...trait, level: nextLevel };
    }
    return { ...trait };
  });

  if (changed) {
    persistTraitLevels();
  }

  return getTraits();
};
