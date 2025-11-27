import type { CommandDefinition, CommandParseContext } from '../CommandParser';
import { CommandIntent } from '../KodexTypes';

const toUrl = (input: string): string => input.replace(/^open:/i, '').trim();

const buildOpenIntent = (input: string): CommandIntent => ({
  operationId: 'browser.open',
  summary: 'Open an external resource in a new context.',
  confidence: 0.9,
  source: 'rule',
  arguments: {
    url: toUrl(input)
  }
});

const buildHelpIntent = (): CommandIntent => ({
  operationId: 'help.commands',
  summary: 'Enumerate available commands and AVOT handlers.',
  confidence: 1,
  source: 'rule'
});

const hasHelpKeyword = (input: string): boolean => {
  const normalized = input.trim().toLowerCase();
  return normalized === 'help' || normalized === '/help' || normalized === '?';
};

const openCommand: CommandDefinition = {
  id: 'open',
  matcher: (input: string) => input.toLowerCase().startsWith('open:'),
  parse: (input: string) => buildOpenIntent(input)
};

const helpCommand: CommandDefinition = {
  id: 'help',
  matcher: (input: string) => hasHelpKeyword(input),
  parse: () => buildHelpIntent()
};

const discoverabilityCommand: CommandDefinition = {
  id: 'discoverability',
  matcher: (input: string, _context: CommandParseContext) => input.trim() === '?',
  parse: () => buildHelpIntent()
};

export const defaultCommands: CommandDefinition[] = [openCommand, helpCommand, discoverabilityCommand];
