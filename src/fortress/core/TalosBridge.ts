import { logInfo } from '../../core/autonomy/kernel';
import { recalculateTraitsFromXp } from './Traits';
import { grantXp, getXpSnapshot, type XpDomain } from './XpSystem';

export interface TalosEvent {
  id: string;
  label: string;
  domain: XpDomain;
  xpReward: number;
  source: 'manual' | 'scheduled' | 'external';
  createdAt: string;
}

const talosEvents: TalosEvent[] = [];
const MAX_TALOS_EVENTS = 50;

export const registerTalosEvent = (event: TalosEvent): void => {
  talosEvents.push(event);
  if (talosEvents.length > MAX_TALOS_EVENTS) {
    talosEvents.splice(0, talosEvents.length - MAX_TALOS_EVENTS);
  }

  grantXp(event.domain, event.xpReward, `Talos:${event.label}`);
  const snapshot = getXpSnapshot();
  recalculateTraitsFromXp(snapshot);
  logInfo('fortress.talos', `[TALOS] Event: ${event.label}, domain=${event.domain}, xp=${event.xpReward}.`);
};

export const getRecentTalosEvents = (limit = MAX_TALOS_EVENTS): TalosEvent[] => {
  return talosEvents.slice(Math.max(0, talosEvents.length - limit));
};
