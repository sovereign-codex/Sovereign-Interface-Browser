export type QuestStatus = 'available' | 'accepted' | 'completed' | 'failed';

export type QuestKind =
  | 'tutorial'
  | 'talos'
  | 'xp-milestone'
  | 'trait-evolution'
  | 'building-upgrade'
  | 'story';

export interface QuestRequirement {
  type: 'xp-domain-min' | 'trait-min-level' | 'building-unlocked' | 'talos-event';
  domain?: string;
  traitId?: string;
  buildingId?: string;
  eventId?: string;
  value: number | string;
}

export interface QuestReward {
  xp?: { domain: string; amount: number }[];
  traits?: { traitId: string; levels: number }[];
  unlockBuildings?: string[];
  notes?: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  kind: QuestKind;
  status: QuestStatus;
  buildingId?: string;
  offeredBy?: string;
  requirements: QuestRequirement[];
  rewards: QuestReward;
  createdAt: string;
  updatedAt: string;
}

export interface QuestLogState {
  quests: Quest[];
}
