import { KernelState } from '../autonomy/kernel';
import { SpatialState } from '../../spatial/SpatialContext';

export type CommandId = string;

export interface CommandArgs {
  rawArgs: string;
  args: string[];
}

export interface CommandContext {
  toggleTheme: () => void;
  getKernelState: () => KernelState;
  spatial?: {
    enterSpatialMode: (modeOverride?: SpatialState['mode']) => SpatialState;
    exitSpatialMode: () => SpatialState;
    toggleSpatialMode: () => SpatialState;
    getSpatialState: () => SpatialState;
  };
}

export interface CommandHandlerResult {
  status: 'ok' | 'error';
  message?: string;
  payload?: unknown;
  followups?: string[];
}

export interface CommandDefinition {
  id: CommandId;
  description?: string;
  handler: (args: CommandArgs, ctx: CommandContext) => Promise<CommandHandlerResult> | CommandHandlerResult;
}
