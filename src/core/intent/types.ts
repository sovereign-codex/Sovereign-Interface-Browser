export type IntentKind = 'diagnostic' | 'build' | 'research' | 'sync' | 'maintenance' | 'sovereign';

export type IntentConfidence = number;

export interface IntentSignal {
  id: string;
  kind: IntentKind;
  confidence: IntentConfidence;
  source: 'command' | 'task' | 'system';
  text: string;
  createdAt: string;
  meta?: Record<string, unknown>;
}
