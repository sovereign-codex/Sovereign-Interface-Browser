import { TraitSnapshot } from '../core/Traits';
import { XpSnapshot } from '../core/XpSystem';
import { TalosEvent } from '../core/TalosBridge';
import { WorldState } from '../world/WorldState';
import { Quest } from './QuestTypes';

export interface QuestEvaluationContext {
  xpSnapshot: XpSnapshot;
  traitSnapshot: TraitSnapshot;
  worldState: WorldState;
  recentTalosEvents?: TalosEvent[];
}

const evaluateRequirement = (req: Quest['requirements'][number], ctx: QuestEvaluationContext): string | null => {
  switch (req.type) {
    case 'xp-domain-min': {
      const current = ctx.xpSnapshot.totalByDomain[req.domain as keyof typeof ctx.xpSnapshot.totalByDomain] ?? 0;
      if (current >= Number(req.value)) return null;
      return `Requires ${req.value}+ XP in ${req.domain}.`;
    }
    case 'trait-min-level': {
      const trait = ctx.traitSnapshot.traits.find((t) => t.id === req.traitId);
      if (trait && trait.level >= Number(req.value)) return null;
      return `Trait ${req.traitId} at level ${req.value} required.`;
    }
    case 'building-unlocked': {
      if (ctx.worldState.unlockedBuildings.includes(req.buildingId ?? '')) return null;
      return `Unlock building ${req.buildingId} first.`;
    }
    case 'talos-event': {
      const matched = ctx.recentTalosEvents?.some((event) => event.id === req.eventId);
      if (matched) return null;
      return `Awaiting Talos event ${req.eventId}.`;
    }
    default:
      return null;
  }
};

const evaluateQuest = (quest: Quest, ctx: QuestEvaluationContext): string[] => {
  const reasons: string[] = [];
  quest.requirements.forEach((req) => {
    const result = evaluateRequirement(req, ctx);
    if (result) {
      reasons.push(result);
    }
  });
  return reasons;
};

export const canAcceptQuest = (
  quest: Quest,
  ctx: QuestEvaluationContext,
): {
  ok: boolean;
  reasons: string[];
} => {
  if (quest.status !== 'available') {
    return { ok: false, reasons: [`Quest is not available (status=${quest.status}).`] };
  }
  const reasons = evaluateQuest(quest, ctx);
  return { ok: reasons.length === 0, reasons };
};

export const canCompleteQuest = (
  quest: Quest,
  ctx: QuestEvaluationContext,
): {
  ok: boolean;
  reasons: string[];
} => {
  if (quest.status !== 'accepted') {
    return { ok: false, reasons: [`Quest is not active (status=${quest.status}).`] };
  }
  const reasons = evaluateQuest(quest, ctx);
  return { ok: reasons.length === 0, reasons };
};
