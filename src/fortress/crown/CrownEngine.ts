import { logInfo } from '../../core/autonomy/kernel';
import { SpatialState } from '../../spatial/SpatialContext';
import { SucStatusSnapshot } from '../../core/autonomy/sucController';
import { TraitSnapshot } from '../core/Traits';
import { TalosEvent } from '../core/TalosBridge';
import { XpSnapshot, XpDomain } from '../core/XpSystem';
import { QuestLogState } from '../quests/QuestTypes';
import { WorldState, updateWorldState } from '../world/WorldState';
import { AvotNpc } from '../avots/AvotRegistry';
import {
  CrownSpireState,
  SpireInsight,
  SpireMetric,
  SpireRecommendation,
  SpireSignalSource,
} from './CrownTypes';

interface SpireScanContext {
  xpSnapshot: XpSnapshot;
  traitSnapshot: TraitSnapshot | null;
  questLog: QuestLogState;
  avotPresence: Record<string, AvotNpc[]>;
  worldState: WorldState;
  talosEvents: TalosEvent[];
  sucStatus: SucStatusSnapshot;
  spatialState: SpatialState;
}

const clamp = (value: number, min = 0, max = 100): number => Math.min(Math.max(value, min), max);

const findTrend = (prev: SpireMetric | undefined, nextValue: number): SpireMetric['trend'] => {
  if (!prev) return undefined;
  const delta = nextValue - prev.value;
  if (Math.abs(delta) < 2) return 'steady';
  return delta > 0 ? 'up' : 'down';
};

const previousState: CrownSpireState = {
  metrics: [],
  insights: [],
  recommendations: [],
};

const scoreFromXp = (xpSnapshot: XpSnapshot, domain: XpDomain, weight = 1): number => {
  const raw = xpSnapshot.totalByDomain[domain] ?? 0;
  return clamp((Math.sqrt(raw) * 10 * weight) / 1.5);
};

const scoreFromTrait = (traitSnapshot: TraitSnapshot | null, traitId: string, multiplier = 18): number => {
  const level = traitSnapshot?.traits.find((trait) => trait.id === traitId)?.level ?? 0;
  return clamp(level * multiplier);
};

const computeMomentum = (xpSnapshot: XpSnapshot, questLog: QuestLogState): number => {
  const recentXp = xpSnapshot.history.slice(-6).reduce((sum, entry) => sum + entry.amount, 0);
  const completed = questLog.quests.filter((quest) => quest.status === 'completed');
  const recentCompleted = completed.slice(-3).length * 12;
  return clamp(recentXp * 0.8 + recentCompleted, 0, 100);
};

const computeExploration = (questLog: QuestLogState, worldState: WorldState): number => {
  const completed = questLog.quests.filter((quest) => quest.status === 'completed');
  const uniqueBuildings = new Set(completed.map((quest) => quest.buildingId)).size;
  const portalBonus = worldState.lastPortalVisited ? 15 : 0;
  const unlockedSpread = clamp((worldState.unlockedBuildings?.length ?? 0) * 6, 0, 40);
  return clamp(uniqueBuildings * 8 + portalBonus + unlockedSpread, 0, 100);
};

const computeStability = (sucStatus: SucStatusSnapshot, talosEvents: TalosEvent[]): number => {
  const base = 85 - sucStatus.pendingCount * 8;
  const recentTalos = talosEvents.slice(-5).length * 2;
  return clamp(base - recentTalos, 0, 100);
};

const computeInsight = (
  condition: boolean,
  summary: string,
  detail: string | undefined,
  priority: SpireInsight['priority'],
  domain: SpireSignalSource,
): SpireInsight | null => {
  if (!condition) return null;
  return {
    id: `${domain}-${summary.slice(0, 6)}-${Date.now()}`,
    summary,
    detail,
    priority,
    domain,
    createdAt: new Date().toISOString(),
  } satisfies SpireInsight;
};

const generateRecommendations = (
  metrics: SpireMetric[],
  insights: SpireInsight[],
  worldState: WorldState,
): SpireRecommendation[] => {
  const recs: SpireRecommendation[] = [];
  const coherence = metrics.find((m) => m.id === 'coherence')?.value ?? 0;
  const stability = metrics.find((m) => m.id === 'stability')?.value ?? 0;
  const exploration = metrics.find((m) => m.id === 'exploration')?.value ?? 0;
  const momentum = metrics.find((m) => m.id === 'momentum')?.value ?? 0;

  if (coherence < 60) {
    recs.push({
      id: `rec-coherence-${Date.now()}`,
      label: 'Ground in the Gardens',
      description: 'Visit the Gardens to stabilize breath and coherence.',
      suggestedBuildingId: 'Gardens',
      suggestedCommands: ['fortress.open'],
      priority: 'high',
      createdAt: new Date().toISOString(),
    });
  }

  if (momentum > 65 && stability < 55) {
    recs.push({
      id: `rec-stability-${Date.now()}`,
      label: 'Anchor Stability',
      description: 'Review Sovereign Update Chain and run a steadying scan.',
      suggestedCommands: ['update.status', 'spire.scan'],
      priority: 'medium',
      createdAt: new Date().toISOString(),
    });
  }

  if (exploration < 50) {
    recs.push({
      id: `rec-explore-${Date.now()}`,
      label: 'Open a Portal',
      description: 'Route through the Portal Gate or pick a fresh quest to expand pathways.',
      suggestedBuildingId: 'PortalGate',
      suggestedCommands: ['quest.list', 'fortress.open'],
      priority: 'medium',
      createdAt: new Date().toISOString(),
    });
  }

  if (insights.length > 0) {
    recs.push({
      id: `rec-reflect-${Date.now()}`,
      label: 'Reflect with Talos',
      description: 'Share the highlighted insights with Talos or an AVOT for alignment.',
      suggestedCommands: ['reflect.now'],
      priority: 'low',
      createdAt: new Date().toISOString(),
    });
  }

  if (recs.length === 0 && worldState.unlockedBuildings?.includes('Observatory')) {
    recs.push({
      id: `rec-observe-${Date.now()}`,
      label: 'Run an Observatory pass',
      description: 'Check the Observatory for signals and log a brief scan.',
      suggestedBuildingId: 'Observatory',
      suggestedCommands: ['fortress.open'],
      priority: 'low',
      createdAt: new Date().toISOString(),
    });
  }

  return recs.slice(0, 5);
};

export const runSpireScan = (context: SpireScanContext): CrownSpireState => {
  const coherenceScore = clamp(
    scoreFromXp(context.xpSnapshot, XpDomain.Coherence, 1.1) * 0.65 + scoreFromTrait(context.traitSnapshot, 'presence') * 0.35,
  );
  const momentumScore = computeMomentum(context.xpSnapshot, context.questLog);
  const integrityScore = clamp(
    scoreFromXp(context.xpSnapshot, XpDomain.Integrity, 1.05) * 0.7 + scoreFromTrait(context.traitSnapshot, 'boundaries') * 0.3,
  );
  const explorationScore = computeExploration(context.questLog, context.worldState);
  const stabilityScore = computeStability(context.sucStatus, context.talosEvents);

  const metrics: SpireMetric[] = [
    { id: 'coherence', label: 'Coherence', value: coherenceScore },
    { id: 'momentum', label: 'Momentum', value: momentumScore },
    { id: 'integrity', label: 'Integrity', value: integrityScore },
    { id: 'exploration', label: 'Exploration', value: explorationScore },
    { id: 'stability', label: 'Stability', value: stabilityScore },
  ].map((metric) => ({ ...metric, trend: findTrend(previousState.metrics.find((m) => m.id === metric.id), metric.value) }));

  const insights: SpireInsight[] = [
    computeInsight(
      coherenceScore < 50 && momentumScore > 60,
      "You're moving fast; ground and breathe.",
      'Coherence trails the current momentum; center in the Gardens.',
      'high',
      'xp',
    ),
    computeInsight(
      explorationScore > 70 && stabilityScore < 55,
      "You're pioneering; anchor your foundations.",
      'Exploration outpaces stability; check SUC and guardrails.',
      'medium',
      'world',
    ),
    computeInsight(
      integrityScore < 55,
      'Boundaries need reinforcement.',
      'Integrity metrics dipped; visit Guard Tower rituals.',
      'medium',
      'traits',
    ),
    computeInsight(
      momentumScore > 75 && stabilityScore > 70,
      'Great momentum with solid footing.',
      'Keep threading quests; the field is stable.',
      'low',
      'quests',
    ),
  ].filter((item): item is SpireInsight => Boolean(item));

  const recommendations = generateRecommendations(metrics, insights, context.worldState);

  const now = new Date().toISOString();
  const nextState: CrownSpireState = {
    lastScanAt: now,
    metrics,
    insights,
    recommendations,
  };

  previousState.metrics = metrics;
  previousState.insights = insights;
  previousState.recommendations = recommendations;
  previousState.lastScanAt = now;

  const metricMap = metrics.reduce<Record<string, number>>((acc, metric) => {
    acc[metric.id] = metric.value;
    return acc;
  }, {});

  updateWorldState({ crownSpireLastScanAt: now, crownSpireLastMetrics: metricMap });
  logInfo('fortress.crown', `[CROWN] Spire scan completed (metrics=${metrics.length}, insights=${insights.length}, recommendations=${recommendations.length}).`);

  return { ...nextState };
};

export const getSpireState = (): CrownSpireState => ({
  lastScanAt: previousState.lastScanAt,
  metrics: previousState.metrics.map((metric) => ({ ...metric })),
  insights: previousState.insights.map((insight) => ({ ...insight })),
  recommendations: previousState.recommendations.map((rec) => ({ ...rec })),
});
