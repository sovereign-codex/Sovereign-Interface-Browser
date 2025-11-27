import { getKernelState, logInfo } from './kernel';
import { getRecentIntents } from '../intent/engine';
import { getShortTermMemory } from '../memory/stm';
import { getViolations } from '../memory/violations';
import { listTasks } from '../tasks/engine';

export type ReflectionHealth = 'ok' | 'warning' | 'error';

export interface Reflection {
  id: string;
  createdAt: string;
  health: ReflectionHealth;
  notes: string[];
  suggestedActions: string[];
}

const MAX_REFLECTIONS = 20;
const REFLECTION_INTERVAL_MS = 5 * 60 * 1000;

const reflections: Reflection[] = [];
let reflectionInterval: ReturnType<typeof setInterval> | null = null;

const determineHealth = (notes: string[], violationCount: number, hasErrors: boolean): ReflectionHealth => {
  if (hasErrors || violationCount > 2) return 'error';
  if (violationCount > 0) return 'warning';
  if (notes.some((note) => /warning/i.test(note))) return 'warning';
  return 'ok';
};

const summarizeLogs = (): string => {
  const logs = getKernelState().log.slice(-10);
  const errorLogs = logs.filter((entry) => entry.level === 'error');
  if (errorLogs.length > 0) {
    return `Recent errors: ${errorLogs.map((e) => e.source).slice(0, 3).join(', ')}`;
  }
  const warnLogs = logs.filter((entry) => entry.level === 'warn');
  if (warnLogs.length > 0) {
    return `Warnings observed: ${warnLogs.length}`;
  }
  return 'Kernel logs stable';
};

export const runReflectionTick = (): Reflection => {
  const intents = getRecentIntents(5);
  const stm = getShortTermMemory();
  const tasks = listTasks().slice(0, 5);
  const violations = getViolations();

  const notes: string[] = [summarizeLogs()];
  if (stm.lastKernelError) {
    notes.push(`Last error: ${stm.lastKernelError.message}`);
  }
  if (tasks.length === 0) {
    notes.push('No tasks in queue.');
  } else {
    const activeTask = tasks.find((task) => task.status === 'running');
    if (activeTask) {
      notes.push(`Active task: ${activeTask.payload.description}`);
    }
  }
  if (intents.length > 0) {
    notes.push(`Recent intent: ${intents[0].kind} (${intents[0].text.slice(0, 60)})`);
  }
  if (violations.length > 0) {
    notes.push(`Guardrail violations: ${violations.length}`);
  }

  const suggestedActions: string[] = [];
  if (violations.length > 0) suggestedActions.push('Review guardrail violations');
  if (!tasks.some((task) => task.status === 'running')) {
    suggestedActions.push('Consider scheduling a health check task');
  }
  if (!stm.lastKernelError && violations.length === 0) {
    suggestedActions.push('Maintain steady state and monitor intents');
  }

  const health = determineHealth(notes, violations.length, Boolean(stm.lastKernelError));

  const reflection: Reflection = {
    id: `reflection-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    health,
    notes,
    suggestedActions,
  };

  reflections.unshift(reflection);
  if (reflections.length > MAX_REFLECTIONS) {
    reflections.splice(MAX_REFLECTIONS, reflections.length - MAX_REFLECTIONS);
  }

  logInfo('autonomy.reflection', `Reflection created (${health})`, { reflection });
  return reflection;
};

export const getRecentReflections = (limit = 5): Reflection[] => reflections.slice(0, limit);

const ensureReflectionInterval = (): void => {
  if (reflectionInterval) return;
  reflectionInterval = setInterval(() => {
    runReflectionTick();
  }, REFLECTION_INTERVAL_MS);
};

ensureReflectionInterval();
