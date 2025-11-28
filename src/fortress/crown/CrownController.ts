import { logInfo } from '../../core/autonomy/kernel';
import { getStatusSnapshot } from '../../core/autonomy/sucController';
import { recalculateTraitsFromXp } from '../core/Traits';
import { getRecentTalosEvents } from '../core/TalosBridge';
import { getXpSnapshot } from '../core/XpSystem';
import { getQuestLog } from '../quests/QuestLog';
import { getWorldState, loadWorldState } from '../world/WorldState';
import { getPresenceSummary } from '../avots/PresenceEngine';
import { getSpatialState } from '../../spatial/SpatialContext';
import { runSpireScan, getSpireState } from './CrownEngine';
import { CrownSpireState } from './CrownTypes';

let initialized = false;

const collectContext = () => {
  const xpSnapshot = getXpSnapshot();
  const traitSnapshot = recalculateTraitsFromXp(xpSnapshot);
  const questLog = getQuestLog();
  const avotPresence = getPresenceSummary();
  const worldState = getWorldState();
  const talosEvents = getRecentTalosEvents();
  const sucStatus = getStatusSnapshot();
  const spatialState = getSpatialState();

  return { xpSnapshot, traitSnapshot, questLog, avotPresence, worldState, talosEvents, sucStatus, spatialState };
};

export const initCrownSpire = (context?: Partial<ReturnType<typeof collectContext>>): void => {
  if (initialized) return;
  loadWorldState();
  initialized = true;
  if (context) {
    runSpireScan({ ...collectContext(), ...context });
  }
};

export const requestSpireScan = async (): Promise<CrownSpireState> => {
  loadWorldState();
  const context = collectContext();
  logInfo('fortress.crown', '[CROWN] Spire scan requested.');
  return runSpireScan(context);
};

export const getCurrentSpireState = (): CrownSpireState => getSpireState();
