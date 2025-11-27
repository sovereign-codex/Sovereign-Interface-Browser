const queue: string[] = [];

export const enqueueTask = (taskId: string): void => {
  queue.push(taskId);
};

export const dequeueTask = (): string | undefined => queue.shift();

export const removeFromQueue = (taskId: string): boolean => {
  const index = queue.indexOf(taskId);
  if (index >= 0) {
    queue.splice(index, 1);
    return true;
  }
  return false;
};

export const queuedTaskIds = (): string[] => [...queue];
