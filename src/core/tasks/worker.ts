import { logDebug } from '../autonomy/kernel';

let interval: ReturnType<typeof setInterval> | null = null;

export const startWorker = (tick: () => void): void => {
  if (interval) return;
  interval = setInterval(() => {
    tick();
  }, 400);
  logDebug('tasks.worker', 'Task worker started');
};

export const stopWorker = (): void => {
  if (!interval) return;
  clearInterval(interval);
  interval = null;
  logDebug('tasks.worker', 'Task worker stopped');
};
