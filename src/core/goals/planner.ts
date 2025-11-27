import { logInfo, logWarn } from '../autonomy/kernel';
import { IntentSignal } from '../intent/types';
import { handleGuardrailViolation, checkGoal } from '../sovereign/guardrails';
import { createTask, inspectTask } from '../tasks/engine';
import { Goal, GoalStatus } from './types';

const goals = new Map<string, Goal>();

const generateGoalId = (): string => `goal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const updateGoalTimestamp = (goal: Goal): Goal => {
  goal.updatedAt = new Date().toISOString();
  return goal;
};

export const createGoal = (title: string, description?: string, options?: { intent?: IntentSignal }): Goal => {
  const now = new Date().toISOString();
  const goal: Goal = {
    id: generateGoalId(),
    title,
    description,
    createdAt: now,
    updatedAt: now,
    status: 'pending',
    intent: options?.intent,
    tasks: [],
  };

  goals.set(goal.id, goal);
  handleGuardrailViolation(checkGoal(goal));
  logInfo('goals.planner', `Goal created (${goal.id})`, { goal });

  const templateText = `${title} ${description ?? ''}`.toLowerCase();
  const templates: { match: RegExp; description: string }[] = [
    { match: /(analy[sz]e|review).*(log|activity)/, description: 'Analyze recent autonomy logs for anomalies' },
    { match: /(snapshot|capture).*(state|status)/, description: 'Capture current kernel and task state snapshot' },
    { match: /(stabilize|steady|idle)/, description: 'Ensure system reaches a stable idle state' },
  ];

  const matchedTemplate = templates.find((template) => template.match.test(templateText));
  if (matchedTemplate) {
    const task = createTask(matchedTemplate.description, { goalId: goal.id });
    goal.tasks.push(task.id);
    goal.status = 'active';
    updateGoalTimestamp(goal);
    logInfo('goals.planner', `Auto-task created for goal ${goal.id}`, { taskId: task.id });
  }

  return goal;
};

export const attachTask = (goalId: string, taskId: string): Goal | null => {
  const goal = goals.get(goalId);
  if (!goal) return null;
  if (!goal.tasks.includes(taskId)) {
    goal.tasks.push(taskId);
    goal.status = goal.status === 'pending' ? 'active' : goal.status;
    updateGoalTimestamp(goal);
    logInfo('goals.planner', `Task ${taskId} attached to goal ${goalId}`);
  }
  return goal;
};

export const completeGoal = (goalId: string, resultSummary?: string): Goal | null => {
  const goal = goals.get(goalId);
  if (!goal) return null;
  goal.status = 'completed';
  goal.resultSummary = resultSummary;
  updateGoalTimestamp(goal);
  logInfo('goals.planner', `Goal ${goalId} completed`, { resultSummary });
  return goal;
};

export const failGoal = (goalId: string, reason: string): Goal | null => {
  const goal = goals.get(goalId);
  if (!goal) return null;
  goal.status = 'failed';
  goal.resultSummary = reason;
  updateGoalTimestamp(goal);
  logWarn('goals.planner', `Goal ${goalId} failed`, { reason });
  return goal;
};

export const listGoals = (filter?: { status?: GoalStatus }): Goal[] => {
  let goalList = Array.from(goals.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (filter?.status) {
    goalList = goalList.filter((goal) => goal.status === filter.status);
  }
  return goalList;
};

export const getGoal = (goalId: string): Goal | null => goals.get(goalId) ?? null;

export const syncGoalTasks = (goalId: string): void => {
  const goal = goals.get(goalId);
  if (!goal) return;
  const resolvedTasks = goal.tasks.map((id) => inspectTask(id)).filter(Boolean);
  const hasActiveTask = resolvedTasks.some((task) => task?.status === 'running' || task?.status === 'queued');
  if (!hasActiveTask && goal.status === 'active') {
    goal.status = 'pending';
  }
  updateGoalTimestamp(goal);
};
