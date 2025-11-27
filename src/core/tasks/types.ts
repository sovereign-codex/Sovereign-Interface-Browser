export type TaskStatus = 'queued' | 'running' | 'completed' | 'cancelled' | 'failed';

export interface TaskPayload {
  description: string;
  meta?: unknown;
}

export interface TaskResult {
  success: boolean;
  data?: unknown;
  error?: string;
  completedAt: string;
}

export interface Task {
  id: string;
  status: TaskStatus;
  createdAt: string;
  payload: TaskPayload;
  logs: string[];
  result?: TaskResult;
}
