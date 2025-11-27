import { IntentSignal } from '../intent/types';

export type GoalStatus = 'pending' | 'active' | 'completed' | 'failed' | 'cancelled';

export interface Goal {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  status: GoalStatus;
  intent?: IntentSignal;
  tasks: string[];
  resultSummary?: string;
}
