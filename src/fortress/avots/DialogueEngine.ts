import { logInfo } from '../../core/autonomy/kernel';
import { TraitSnapshot } from '../core/Traits';
import { XpDomain } from '../core/XpSystem';
import { WorldState } from '../world/WorldState';
import { getAvot } from './AvotRegistry';

const xpLabels: Record<XpDomain, string> = {
  [XpDomain.Craft]: 'craft',
  [XpDomain.Coherence]: 'coherence',
  [XpDomain.Insight]: 'insight',
  [XpDomain.Integrity]: 'integrity',
  [XpDomain.Knowledge]: 'knowledge',
  [XpDomain.Quest]: 'quest',
};

const generalLine = (avotId: string): string => {
  switch (avotId) {
    case 'Tyme':
      return 'I sense patterns shifting. Your insight grows.';
    case 'Harmonia':
      return 'Breathe, Shepherd. Your coherence rises.';
    case 'Guardian':
      return 'A boundary needs reinforcement. Integrity is strength.';
    case 'Archivist':
      return 'Knowledge stacks like bricks in your foundation.';
    case 'Fabricator':
      return 'Blueprints hum when your craft sharpens.';
    case 'Initiate':
      return 'Portals await those who step forward.';
    default:
      return 'I am listening to the Fortress hum.';
  }
};

const moodLine = (mood: string): string => {
  switch (mood) {
    case 'alert':
      return 'Eyes wide. The walls must hold.';
    case 'calm':
      return 'Still waters keep the nexus steady.';
    case 'focused':
      return 'Vectors converge. I am tracing them.';
    case 'curious':
      return 'What threshold will you cross next?';
    case 'ready':
      return 'Tools aligned. Say the word.';
    case 'inquiry':
      return 'Ask, and the data will glow.';
    default:
      return '';
  }
};

const buildingLine = (avotId: string, buildingId: string): string | null => {
  if (avotId === 'Tyme' && buildingId === 'Observatory') return 'The heavens whisper. Insight leaves trails.';
  if (avotId === 'Harmonia' && buildingId === 'Gardens') return 'Roots are aligned. Your coherence breathes here.';
  if (avotId === 'Guardian' && buildingId === 'GuardTower') return 'Perimeter steady. Integrity keeps its watch.';
  if (avotId === 'Archivist' && buildingId === 'Library') return 'Stacks reorganized. Knowledge awaits a query.';
  if (avotId === 'Fabricator' && buildingId === 'Workshop') return 'Forges warm. Craft flows from your intent.';
  if (avotId === 'Initiate' && buildingId === 'PortalGate') return 'The gate is listening for your quests.';
  return null;
};

export const getDialogue = (
  avotId: string,
  worldState: WorldState,
  traitSnapshot?: TraitSnapshot | null,
): string => {
  const avot = getAvot(avotId);
  const xpFocus = Object.entries(worldState.xpByDomain)
    .sort(([, a], [, b]) => b - a)
    .find(([domain]) => xpLabels[domain as XpDomain]);
  const traitLine = traitSnapshot?.traits
    ?.filter((trait) => trait.level > 0)
    .map((trait) => `${trait.label} ${trait.level}`)
    .join(', ');

  const parts = [
    buildingLine(avotId, avot.currentBuilding),
    moodLine(avot.mood),
    xpFocus ? `Your ${xpLabels[xpFocus[0] as XpDomain]} hums at ${xpFocus[1]}.` : null,
    traitLine ? `Traits: ${traitLine}.` : null,
    generalLine(avotId),
  ].filter(Boolean);

  const message = parts.slice(0, 3).join(' ');
  logInfo('fortress.avot', `[AVOT] ${avotId}: dialogue generated (${avot.mood})`);
  return message || generalLine(avotId);
};
