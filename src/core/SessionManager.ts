import { CommandResult } from '../kodex/KodexTypes';

export interface SessionEntry {
  id: string;
  command: string;
  result: CommandResult;
  createdAt: string;
}

export class SessionManager {
  readonly sessionId: string;
  private history: SessionEntry[] = [];

  constructor() {
    this.sessionId = crypto.randomUUID?.() ?? `session-${Date.now()}`;
  }

  record(command: string, result: CommandResult): SessionEntry {
    const entry: SessionEntry = {
      id: crypto.randomUUID?.() ?? `${Date.now()}`,
      command,
      result,
      createdAt: new Date().toISOString()
    };
    this.history.unshift(entry);
    return entry;
  }

  getHistory(): SessionEntry[] {
    return [...this.history];
  }

  clear(): void {
    this.history = [];
  }
}
