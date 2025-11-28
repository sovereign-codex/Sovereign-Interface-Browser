import { logInfo } from '../../core/autonomy/kernel';
import { TraitSnapshot, recalculateTraitsFromXp } from '../core/Traits';
import { getRecentTalosEvents, TalosEvent } from '../core/TalosBridge';
import { XpSnapshot, getXpSnapshot } from '../core/XpSystem';
import { getWorldState, loadWorldState, WorldState } from '../world/WorldState';
import { acceptQuest, completeQuest, failQuest, getQuestById, getQuestLog, listQuests } from './QuestLog';
import { canAcceptQuest, canCompleteQuest, QuestEvaluationContext } from './QuestEvaluator';
import { ensureSeedQuestsInitialized } from './QuestSeeder';
import { Quest } from './QuestTypes';

export interface QuestEngineContext {
  xpSnapshot?: XpSnapshot;
  traitSnapshot?: TraitSnapshot | null;
  worldState?: WorldState;
  recentTalosEvents?: TalosEvent[];
}

const buildContext = (ctx?: QuestEngineContext): QuestEvaluationContext => {
  const xpSnapshot = ctx?.xpSnapshot ?? getXpSnapshot();
  const traitSnapshot = ctx?.traitSnapshot ?? recalculateTraitsFromXp(xpSnapshot);
  return {
    xpSnapshot,
    traitSnapshot,
    worldState: ctx?.worldState ?? getWorldState(),
    recentTalosEvents: ctx?.recentTalosEvents ?? getRecentTalosEvents(),
  };
};

export const initQuestEngine = (ctx?: QuestEngineContext): void => {
  loadWorldState();
  ensureSeedQuestsInitialized();
  const state = ctx?.worldState ?? getWorldState();
  getQuestLog(state);
};

export const offerQuestsForBuilding = (buildingId: string, ctx?: QuestEngineContext): Quest[] => {
  const context = buildContext(ctx);
  const quests = listQuests().filter((quest) => quest.buildingId === buildingId);
  return quests.filter((quest) => quest.status === 'available' || quest.status === 'accepted').filter((quest) => {
    return quest.status === 'accepted' || canAcceptQuest(quest, context).ok;
  });
};

export const acceptQuestById = (
  id: string,
  ctx?: QuestEngineContext,
): {
  ok: boolean;
  message: string;
} => {
  const quest = getQuestById(id);
  if (!quest) return { ok: false, message: `Quest not found: ${id}` };

  const context = buildContext(ctx);
  const eligibility = canAcceptQuest(quest, context);
  if (!eligibility.ok) {
    return { ok: false, message: eligibility.reasons.join(' ') || 'Requirements not met.' };
  }

  acceptQuest(id);
  return { ok: true, message: `${quest.title} accepted.` };
};

export const completeQuestById = (
  id: string,
  ctx?: QuestEngineContext,
): {
  ok: boolean;
  message: string;
} => {
  const quest = getQuestById(id);
  if (!quest) return { ok: false, message: `Quest not found: ${id}` };

  const context = buildContext(ctx);
  const eligibility = canCompleteQuest(quest, context);
  if (!eligibility.ok) {
    return { ok: false, message: eligibility.reasons.join(' ') || 'Requirements not met.' };
  }

  completeQuest(id);
  logInfo('fortress.quest', `[QUEST] ${id} completed; rewards pending application.`);
  return { ok: true, message: `${quest.title} completed.` };
};

export const failQuestById = (id: string, reason?: string): void => {
  const quest = getQuestById(id);
  if (!quest) {
    logInfo('fortress.quest', `[QUEST] ${id} not found; cannot mark failed.`);
    return;
  }
  failQuest(id);
  if (reason) {
    logInfo('fortress.quest', `[QUEST] ${id} failed: ${reason}`);
  } else {
    logInfo('fortress.quest', `[QUEST] ${id} failed.`);
  }
};

export const getActiveQuests = (): Quest[] => listQuests({ status: 'accepted' });

export const getCompletedQuests = (): Quest[] => listQuests({ status: 'completed' });

export const getAvotQuestHint = (avotId: string, buildingId: string): string | null => {
  const quests = listQuests().filter((quest) => quest.buildingId === buildingId);
  const active = quests.find((quest) => quest.status === 'accepted');
  if (active) return `There’s a mission underway: ${active.title}.`;
  const available = quests.find((quest) => quest.status === 'available');
  if (available) return `There’s a path open to you here: ${available.title}.`;
  return null;
};
