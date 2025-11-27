import { logError, logInfo, recordCommandExecution } from '../autonomy/kernel';
import { recordCommandMemory } from '../memory/stm';
import { getCommand } from './registry';
import { CommandArgs, CommandContext, CommandHandlerResult } from './types';

const parseInput = (input: string): { commandId: string; args: CommandArgs } => {
  const trimmed = input.trim();
  const [commandId, ...rest] = trimmed.split(/\s+/);
  const rawArgs = rest.join(' ').trim();
  return { commandId, args: { rawArgs, args: rest } };
};

export const executeCommand = async (
  input: string,
  ctx: CommandContext,
): Promise<CommandHandlerResult> => {
  const start = performance.now();
  const { commandId, args } = parseInput(input);
  if (!commandId) {
    return { status: 'error', message: 'No command provided' };
  }

  const def = getCommand(commandId);
  let result: CommandHandlerResult;

  if (!def) {
    result = {
      status: 'error',
      message: `Unknown command: ${commandId}`,
      followups: ['help'],
    };
  } else {
    try {
      result = await def.handler(args, ctx);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Command failed';
      logError(`command.${commandId}`, message, { error: err });
      result = { status: 'error', message };
    }
  }

  const durationMs = performance.now() - start;
  recordCommandExecution(commandId, result.status, durationMs);
  const summary = `${commandId} -> ${result.status}`;
  if (result.status === 'error') {
    logError('kernel', summary, { durationMs });
  } else {
    logInfo('kernel', summary, { durationMs });
  }

  recordCommandMemory(commandId, result.status);

  return result;
};
