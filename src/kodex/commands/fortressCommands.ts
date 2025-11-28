import type { CommandDefinition } from '../CommandParser';
import type { XpDomain } from '../../fortress/core/XpSystem';

const TALOS_EVENT_REGEX = /^talos\.event\s+(craft|knowledge|insight|coherence|integrity|quest)\s+"([^"]+)"\s+(\d+)/i;

const toXpDomain = (value: string): XpDomain => value.toLowerCase() as XpDomain;

const talosEventCommand: CommandDefinition = {
  id: 'talos.event',
  matcher: (input: string) => TALOS_EVENT_REGEX.test(input.trim()),
  parse: (input: string) => {
    const match = input.match(TALOS_EVENT_REGEX);
    if (!match) return null;
    const [, domainRaw, label, xpRaw] = match;
    const xpValue = Number.parseInt(xpRaw, 10);
    const domain = toXpDomain(domainRaw);
    return {
      operationId: 'fortress.talos.event',
      summary: 'Register Talos training event and award XP.',
      confidence: 0.92,
      source: 'rule',
      arguments: { domain, label, xp: xpValue },
    };
  },
};

const xpStatusCommand: CommandDefinition = {
  id: 'xp.status',
  matcher: (input: string) => input.trim().toLowerCase() === 'xp.status',
  parse: () => ({
    operationId: 'fortress.xp.status',
    summary: 'Show current Sovereign XP totals.',
    confidence: 0.85,
    source: 'rule',
  }),
};

const traitsStatusCommand: CommandDefinition = {
  id: 'traits.status',
  matcher: (input: string) => input.trim().toLowerCase() === 'traits.status',
  parse: () => ({
    operationId: 'fortress.traits.status',
    summary: 'Show active trait levels from I-AM node.',
    confidence: 0.85,
    source: 'rule',
  }),
};

const fortressProgressCommand: CommandDefinition = {
  id: 'fortress.progress',
  matcher: (input: string) => input.trim().toLowerCase() === 'fortress.progress',
  parse: () => ({
    operationId: 'fortress.progress',
    summary: 'Display Fortress progress across XP, traits, and TownHall.',
    confidence: 0.83,
    source: 'rule',
  }),
};

export const fortressCommands: CommandDefinition[] = [
  talosEventCommand,
  xpStatusCommand,
  traitsStatusCommand,
  fortressProgressCommand,
];
