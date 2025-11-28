import { logInfo } from '../../core/autonomy/kernel';
import { updateTraitLevel, getTraits, recalculateTraitsFromXp } from '../core/Traits';
import { grantXp, XpDomain, getXpSnapshot } from '../core/XpSystem';
import { getWorldState, updateWorldState } from '../world/WorldState';
import { Quest } from './QuestTypes';

export const applyRewards = (quest: Quest): void => {
  quest.rewards.xp?.forEach((reward) => {
    const domain = reward.domain as XpDomain;
    grantXp(domain, reward.amount, `Quest:${quest.id}`);
  });

  if (quest.rewards.xp?.length) {
    const snapshot = getXpSnapshot();
    recalculateTraitsFromXp(snapshot);
  }

  if (quest.rewards.traits?.length) {
    const snapshot = getTraits();
    quest.rewards.traits.forEach(({ traitId, levels }) => {
      const current = snapshot.traits.find((trait) => trait.id === traitId)?.level ?? 0;
      updateTraitLevel(traitId, current + levels);
    });
  }

  if (quest.rewards.unlockBuildings?.length) {
    const world = getWorldState();
    const unlocked = new Set(world.unlockedBuildings);
    quest.rewards.unlockBuildings.forEach((id) => unlocked.add(id));
    updateWorldState({ unlockedBuildings: Array.from(unlocked) });
  }

  logInfo('fortress.quest', `[QUEST] ${quest.id} completed; rewards applied.`);
};
