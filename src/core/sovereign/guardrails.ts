import { logWarn } from '../autonomy/kernel';
import { IntentSignal } from '../intent/types';
import { Goal } from '../goals/types';
import { Task } from '../tasks/types';
import { recordViolation } from '../memory/violations';

export interface GuardrailViolation {
  id: string;
  createdAt: string;
  severity: 'low' | 'medium' | 'high';
  rule: string;
  context: string;
}

const destructiveKeywords = ['delete repository', 'wipe', 'destroy', 'format', 'rm -rf', 'drop database', 'erase'];

const buildViolation = (severity: GuardrailViolation['severity'], rule: string, context: string): GuardrailViolation => ({
  id: `violation-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
  createdAt: new Date().toISOString(),
  severity,
  rule,
  context,
});

export const checkIntent = (intent: IntentSignal): GuardrailViolation | null => {
  const lowered = intent.text.toLowerCase();
  if (destructiveKeywords.some((keyword) => lowered.includes(keyword))) {
    return buildViolation('high', 'destructive-intent', intent.text);
  }
  return null;
};

export const checkGoal = (goal: Goal): GuardrailViolation | null => {
  const contextText = `${goal.title} ${goal.description ?? ''}`.toLowerCase();
  if (destructiveKeywords.some((keyword) => contextText.includes(keyword))) {
    return buildViolation('high', 'destructive-goal', goal.title);
  }
  const affectsSovereign = /(sovereign|system|kernel|infrastructure)/.test(contextText);
  if (affectsSovereign && !goal.description) {
    return buildViolation('medium', 'missing-description', goal.title);
  }
  return null;
};

export const checkTask = (task: Task): GuardrailViolation | null => {
  if (task.payload.description.length > 320) {
    return buildViolation('medium', 'task-too-large', task.payload.description.slice(0, 120));
  }
  const lowered = task.payload.description.toLowerCase();
  if (destructiveKeywords.some((keyword) => lowered.includes(keyword))) {
    return buildViolation('high', 'destructive-task', task.payload.description);
  }
  return null;
};

export const handleGuardrailViolation = (violation: GuardrailViolation | null): void => {
  if (!violation) return;
  recordViolation(violation);
  logWarn('sovereign.guardrails', `${violation.rule} (${violation.severity})`, { violation });
};
