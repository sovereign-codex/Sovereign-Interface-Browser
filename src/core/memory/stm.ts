import { Task } from '../tasks/types';

type CommandStatus = 'ok' | 'error' | 'pending';

export interface CommandMemory {
  command: string;
  at: string;
  status: CommandStatus;
}

export interface TaskMemory {
  id: string;
  description: string;
  completedAt: string;
  status: Task['status'];
  result?: Task['result'];
}

export interface ShortTermMemorySnapshot {
  commands: CommandMemory[];
  completedTasks: TaskMemory[];
  lastKernelError?: {
    message: string;
    at: string;
    data?: unknown;
  };
}

const STM_LIMITS = {
  commands: 20,
  completedTasks: 10,
};

const state: ShortTermMemorySnapshot = {
  commands: [],
  completedTasks: [],
};

const trimList = <T>(list: T[], limit: number): void => {
  if (list.length > limit) {
    list.splice(limit, list.length - limit);
  }
};

export const recordCommandMemory = (command: string, status: CommandStatus): void => {
  state.commands.unshift({ command, status, at: new Date().toISOString() });
  trimList(state.commands, STM_LIMITS.commands);
};

export const recordTaskCompletion = (task: Task): void => {
  if (task.status !== 'completed') return;
  state.completedTasks.unshift({
    id: task.id,
    description: task.payload.description,
    status: task.status,
    completedAt: task.result?.completedAt ?? new Date().toISOString(),
    result: task.result,
  });
  trimList(state.completedTasks, STM_LIMITS.completedTasks);
};

export const recordKernelError = (message: string, data?: unknown): void => {
  state.lastKernelError = { message, data, at: new Date().toISOString() };
};

export const getShortTermMemory = (): ShortTermMemorySnapshot => ({
  commands: [...state.commands],
  completedTasks: [...state.completedTasks],
  lastKernelError: state.lastKernelError ? { ...state.lastKernelError } : undefined,
});
