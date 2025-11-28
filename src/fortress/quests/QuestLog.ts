import { logInfo } from '../../core/autonomy/kernel';
import { getWorldState, loadWorldState, updateWorldState, WorldState } from '../world/WorldState';
import { Quest, QuestKind, QuestLogState, QuestStatus } from './QuestTypes';

let questLog: QuestLogState = { quests: [] };
let initialized = false;

const ensureLoaded = (state?: WorldState): void => {
  if (initialized) return;
  const world = state ?? loadWorldState();
  questLog = { quests: [...(world.quests ?? [])] };
  initialized = true;
};

const persist = (): void => {
  updateWorldState({ quests: questLog.quests });
};

const updateStatus = (id: string, status: QuestStatus): void => {
  questLog.quests = questLog.quests.map((quest) => {
    if (quest.id !== id) return quest;
    const now = new Date().toISOString();
    const prev = quest.status;
    if (prev !== status) {
      logInfo('fortress.quest', `[QUEST] ${id} status changed from ${prev} to ${status}.`);
    }
    return { ...quest, status, updatedAt: now };
  });
  persist();
};

export const getQuestLog = (state?: WorldState): QuestLogState => {
  ensureLoaded(state);
  return { quests: questLog.quests.map((quest) => ({ ...quest })) };
};

export const listQuests = (filter?: { status?: QuestStatus; kind?: QuestKind }): Quest[] => {
  ensureLoaded();
  return questLog.quests.filter((quest) => {
    if (filter?.status && quest.status !== filter.status) return false;
    if (filter?.kind && quest.kind !== filter.kind) return false;
    return true;
  });
};

export const getQuestById = (id: string): Quest | undefined => {
  ensureLoaded();
  return questLog.quests.find((quest) => quest.id === id);
};

export const addOrUpdateQuest = (q: Quest): void => {
  ensureLoaded();
  const existing = questLog.quests.find((quest) => quest.id === q.id);
  const now = new Date().toISOString();
  if (existing) {
    questLog.quests = questLog.quests.map((quest) =>
      quest.id === q.id
        ? {
            ...existing,
            ...q,
            createdAt: existing.createdAt ?? q.createdAt ?? now,
            updatedAt: now,
          }
        : quest,
    );
  } else {
    const quest: Quest = {
      ...q,
      createdAt: q.createdAt ?? now,
      updatedAt: q.updatedAt ?? now,
    };
    questLog.quests.push(quest);
    logInfo('fortress.quest', `[QUEST] Seed quest registered: ${quest.id}.`);
  }
  persist();
};

export const acceptQuest = (id: string): void => {
  ensureLoaded();
  updateStatus(id, 'accepted');
};

export const completeQuest = (id: string): void => {
  ensureLoaded();
  updateStatus(id, 'completed');
};

export const failQuest = (id: string): void => {
  ensureLoaded();
  updateStatus(id, 'failed');
};
