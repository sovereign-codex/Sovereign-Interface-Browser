import { logInfo } from '../../core/autonomy/kernel';
import { getWorldState, loadWorldState, updateWorldState } from '../world/WorldState';

export enum XpDomain {
  Craft = 'craft',
  Knowledge = 'knowledge',
  Insight = 'insight',
  Coherence = 'coherence',
  Integrity = 'integrity',
  Quest = 'quest',
}

export interface XpLedgerEntry {
  id: string;
  domain: XpDomain;
  amount: number;
  source: string;
  buildingId?: string;
  createdAt: string;
}

export interface XpSnapshot {
  totalByDomain: Record<XpDomain, number>;
  history: XpLedgerEntry[];
}

const XP_HISTORY_LIMIT = 200;

const defaultTotals: Record<XpDomain, number> = {
  [XpDomain.Craft]: 0,
  [XpDomain.Knowledge]: 0,
  [XpDomain.Insight]: 0,
  [XpDomain.Coherence]: 0,
  [XpDomain.Integrity]: 0,
  [XpDomain.Quest]: 0,
};

let totals: Record<XpDomain, number> = { ...defaultTotals };
let history: XpLedgerEntry[] = [];

const ensureInitialized = (): void => {
  loadWorldState();
  const world = getWorldState();
  totals = { ...defaultTotals, ...world.xpByDomain };
  history = [...(world.xpHistory ?? [])];
};

const persist = (): void => {
  updateWorldState({ xpByDomain: totals, xpHistory: history });
};

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
};

export const grantXp = (domain: XpDomain, amount: number, source: string, buildingId?: string): void => {
  ensureInitialized();
  const entry: XpLedgerEntry = {
    id: generateId(),
    domain,
    amount,
    source,
    buildingId,
    createdAt: new Date().toISOString(),
  };

  totals[domain] = (totals[domain] ?? 0) + amount;
  history.push(entry);
  if (history.length > XP_HISTORY_LIMIT) {
    history = history.slice(history.length - XP_HISTORY_LIMIT);
  }

  persist();
  logInfo('fortress.xp', `[XP] +${amount} to ${domain} via ${source} (building=${buildingId ?? 'n/a'})`);
};

export const getXpSnapshot = (limitHistory = XP_HISTORY_LIMIT): XpSnapshot => {
  ensureInitialized();
  return {
    totalByDomain: { ...totals },
    history: history.slice(Math.max(0, history.length - limitHistory)),
  };
};

export const resetXp = (): void => {
  totals = { ...defaultTotals };
  history = [];
  persist();
};
