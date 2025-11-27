import { getKernelState, logInfo } from '../autonomy/kernel';
import { CommandDefinition, CommandHandlerResult } from './types';

const registry = new Map<string, CommandDefinition>();

export const registerCommand = (def: CommandDefinition): void => {
  registry.set(def.id, def);
};

export const getCommand = (id: string): CommandDefinition | undefined => registry.get(id);

export const listCommands = (): CommandDefinition[] => Array.from(registry.values());

const helpCommand: CommandDefinition = {
  id: 'help',
  description: 'List available commands',
  handler: () => {
    const commands = listCommands().map((c) => ({ id: c.id, description: c.description ?? '' }));
    return {
      status: 'ok',
      message: 'Available commands',
      payload: commands,
    } satisfies CommandHandlerResult;
  },
};

const pingCommand: CommandDefinition = {
  id: 'ping',
  description: 'Return kernel status and uptime',
  handler: () => {
    const state = getKernelState();
    const uptimeMs = Date.now() - state.startedAt.getTime();
    return {
      status: 'ok',
      message: 'pong',
      payload: {
        uptimeMs,
        sessionId: state.sessionId,
        commandCount: state.commandCount,
      },
      followups: ['state.snapshot', 'log.tail'],
    } satisfies CommandHandlerResult;
  },
};

const snapshotCommand: CommandDefinition = {
  id: 'state.snapshot',
  description: 'Dump current autonomy kernel state',
  handler: () => ({
    status: 'ok',
    message: 'Kernel snapshot',
    payload: getKernelState(),
  }),
};

const toggleThemeCommand: CommandDefinition = {
  id: 'ui.theme.toggle',
  description: 'Toggle the Sovereign UI theme',
  handler: (_, ctx) => {
    ctx.toggleTheme();
    const state = getKernelState();
    logInfo('ui.theme', 'Theme toggled');
    return {
      status: 'ok',
      message: 'Theme toggled',
      payload: { commandCount: state.commandCount },
    };
  },
};

const logTailCommand: CommandDefinition = {
  id: 'log.tail',
  description: 'Return the latest log entries',
  handler: (args) => {
    const count = args.args[0] ? Number.parseInt(args.args[0], 10) : 20;
    const safeCount = Number.isFinite(count) && count > 0 ? Math.min(count, 100) : 20;
    const state = getKernelState();
    const start = Math.max(0, state.log.length - safeCount);
    const entries = state.log.slice(start);
    return {
      status: 'ok',
      message: `Showing last ${entries.length} log entries`,
      payload: entries,
    };
  },
};

[helpCommand, pingCommand, snapshotCommand, toggleThemeCommand, logTailCommand].forEach(registerCommand);
