import type { CommandDefinition } from '../CommandParser';
import { CommandIntent } from '../KodexTypes';

const trimPrefix = (input: string, prefix: string): string => input.slice(prefix.length).trim();

const buildDirectiveIntent = (directive: string): CommandIntent => ({
  operationId: 'tyme.directive',
  summary: 'Route directive to the Tyme core.',
  confidence: 0.82,
  source: 'rule',
  arguments: { directive }
});

const buildAvotIntent = (expression: string): CommandIntent => ({
  operationId: expression || 'help.commands',
  summary: 'Invoke AVOT agent or operation.',
  confidence: 0.8,
  source: 'rule',
  arguments: { call: expression }
});

const tymeCommand: CommandDefinition = {
  id: 'tyme',
  matcher: (input: string) => input.toLowerCase().startsWith('tyme:'),
  parse: (input: string) => buildDirectiveIntent(trimPrefix(input, 'tyme:'))
};

const avotCommand: CommandDefinition = {
  id: 'avot',
  matcher: (input: string) => input.toLowerCase().startsWith('avot:'),
  parse: (input: string) => buildAvotIntent(trimPrefix(input, 'avot:'))
};

export const avotCommands: CommandDefinition[] = [tymeCommand, avotCommand];
