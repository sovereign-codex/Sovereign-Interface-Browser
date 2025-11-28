import { logInfo } from '../../core/autonomy/kernel';
import { getQuestLog, addOrUpdateQuest } from './QuestLog';
import { getSeedQuests } from './QuestSeeds';

let seeded = false;

export const ensureSeedQuestsInitialized = (): void => {
  const existingLog = getQuestLog();
  const seeds = getSeedQuests();
  const missingSeeds = seeds.filter((seed) => !existingLog.quests.some((quest) => quest.id === seed.id));

  if (missingSeeds.length === 0) {
    seeded = true;
    return;
  }

  missingSeeds.forEach((quest) => addOrUpdateQuest(quest));
  logInfo('fortress.quest', `[QUEST] Seed quests initialized (count=${missingSeeds.length}).`);
  seeded = true;
};

export const hasSeededQuests = (): boolean => seeded;
