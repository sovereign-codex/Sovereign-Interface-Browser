export interface SIOSOperation {
  id: string;
  name: string;
  description: string;
  inputs: Array<{ name: string; type: string; required?: boolean }> | [];
}

export interface SIOSManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  operations: SIOSOperation[];
}

export interface CommandIntent {
  operationId: string;
  summary: string;
  confidence: number;
  source: 'rule' | 'gpt';
  arguments?: Record<string, unknown>;
}

export interface CommandResult {
  status: 'ok' | 'error' | 'blocked';
  message: string;
  intent?: CommandIntent;
  data?: unknown;
  auditTrail?: string[];
}

export interface GuardianAudit {
  decision: 'allow' | 'flag' | 'block';
  reason: string;
}

export interface PromptBundle {
  baseSystemPrompt: string;
  guardianPrompt: string;
}
