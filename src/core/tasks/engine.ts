import { logError, logInfo } from '../autonomy/kernel';
import { analyzeTask } from '../intent/engine';
import { handleGuardrailViolation, checkTask } from '../sovereign/guardrails';
import { recordTaskCompletion } from '../memory/stm';
import { dequeueTask, enqueueTask, queuedTaskIds, removeFromQueue } from './queue';
import { startWorker } from './worker';
import { Task, TaskStatus } from './types';

const tasks = new Map<string, Task>();
let currentTaskId: string | null = null;

const generateTaskId = (): string => `task-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const safeUpdateTask = (task: Task, status: TaskStatus, logMessage: string): void => {
  task.status = status;
  task.logs.push(`${new Date().toISOString()}: ${logMessage}`);
};

const processTask = async (): Promise<void> => {
  if (currentTaskId) return;
  const nextTaskId = dequeueTask();
  if (!nextTaskId) return;
  const task = tasks.get(nextTaskId);
  if (!task) return;

  currentTaskId = nextTaskId;
  safeUpdateTask(task, 'running', 'Task started');
  logInfo('tasks.engine', `Running task ${task.id}`, { payload: task.payload });

  try {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (task.status === 'cancelled') {
      safeUpdateTask(task, 'cancelled', 'Task cancelled during execution');
    } else {
      const completedAt = new Date().toISOString();
      task.result = { success: true, data: { echo: task.payload }, completedAt };
      safeUpdateTask(task, 'completed', 'Task completed');
      recordTaskCompletion(task);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown task failure';
    task.result = { success: false, error: message, completedAt: new Date().toISOString() };
    safeUpdateTask(task, 'failed', 'Task failed');
    logError('tasks.engine', message, { taskId: task.id, error });
  } finally {
    currentTaskId = null;
  }
};

startWorker(() => {
  void processTask();
});

export const createTask = (description: string, meta?: unknown): Task => {
  const task: Task = {
    id: generateTaskId(),
    status: 'queued',
    createdAt: new Date().toISOString(),
    payload: { description, meta },
    logs: [`${new Date().toISOString()}: Task created`],
  };

  tasks.set(task.id, task);
  enqueueTask(task.id);
  analyzeTask(task);
  handleGuardrailViolation(checkTask(task));
  logInfo('tasks.engine', `Queued task ${task.id}`, { description, meta });
  return task;
};

export const listTasks = (): Task[] => Array.from(tasks.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export const inspectTask = (taskId: string): Task | undefined => tasks.get(taskId);

export const cancelTask = (taskId: string): boolean => {
  const task = tasks.get(taskId);
  if (!task) return false;

  if (task.status === 'queued') {
    removeFromQueue(taskId);
    safeUpdateTask(task, 'cancelled', 'Task cancelled before execution');
    logInfo('tasks.engine', `Cancelled queued task ${taskId}`);
    return true;
  }

  if (task.status === 'running') {
    safeUpdateTask(task, 'cancelled', 'Task marked as cancelled');
    logInfo('tasks.engine', `Marked running task ${taskId} as cancelled`);
    return true;
  }

  return false;
};

export const taskMetrics = () => {
  const queued = queuedTaskIds();
  const running = currentTaskId ? tasks.get(currentTaskId) ?? null : null;
  const completed = listTasks().find((task) => task.status === 'completed');
  return {
    queuedCount: queued.length,
    running,
    lastCompleted: completed ?? null,
  };
};
