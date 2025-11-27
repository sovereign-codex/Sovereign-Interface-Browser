import { logInfo } from '../autonomy/kernel';
import { checkIntent, handleGuardrailViolation } from '../sovereign/guardrails';
import { Task } from '../tasks/types';
import { IntentConfidence, IntentKind, IntentSignal } from './types';

const MAX_INTENTS = 100;

const intents: IntentSignal[] = [];

interface AnalyzableCommand {
  id: string;
  text: string;
}

const generateIntentId = (): string => `intent-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const scoreIntentConfidence = (text: string): IntentConfidence => {
  const trimmed = text.trim();
  if (trimmed.length > 160) return 0.62;
  if (trimmed.length > 80) return 0.55;
  return 0.48;
};

const detectIntentKind = (text: string): IntentKind => {
  const lowered = text.toLowerCase();
  if (/(diagnostic|status|health|check)/.test(lowered)) return 'diagnostic';
  if (/(build|compile|bundle)/.test(lowered)) return 'build';
  if (/(research|investigate|explore|analy[sz]e)/.test(lowered)) return 'research';
  if (/(sync|align|reconcile)/.test(lowered)) return 'sync';
  if (/(maintain|cleanup|upgrade|patch)/.test(lowered)) return 'maintenance';
  if (/(sovereign|guardrail|safety|policy)/.test(lowered)) return 'sovereign';
  return 'research';
};

const recordIntent = (intent: IntentSignal): IntentSignal => {
  intents.unshift(intent);
  if (intents.length > MAX_INTENTS) {
    intents.splice(MAX_INTENTS, intents.length - MAX_INTENTS);
  }
  logInfo('intent.engine', `Intent recorded (${intent.kind})`, { intent });
  handleGuardrailViolation(checkIntent(intent));
  return intent;
};

export const analyzeCommand = (command: AnalyzableCommand): IntentSignal => {
  const intent: IntentSignal = {
    id: generateIntentId(),
    source: 'command',
    createdAt: new Date().toISOString(),
    kind: detectIntentKind(`${command.id} ${command.text}`),
    confidence: scoreIntentConfidence(command.text),
    text: command.text,
    meta: { commandId: command.id },
  };
  return recordIntent(intent);
};

export const analyzeTask = (task: Task): IntentSignal => {
  const intent: IntentSignal = {
    id: generateIntentId(),
    source: 'task',
    createdAt: new Date().toISOString(),
    kind: detectIntentKind(task.payload.description),
    confidence: scoreIntentConfidence(task.payload.description),
    text: task.payload.description,
    meta: { taskId: task.id },
  };
  return recordIntent(intent);
};

export const getRecentIntents = (limit = 20): IntentSignal[] => intents.slice(0, limit);
