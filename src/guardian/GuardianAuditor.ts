import { CommandIntent, GuardianAudit } from '../kodex/KodexTypes';

export interface GuardianAuditEntry {
  command: string;
  timestamp: string;
  audit: GuardianAudit;
  intent?: CommandIntent;
}

export class GuardianAuditor {
  private readonly auditLog: GuardianAuditEntry[] = [];

  record(command: string, audit: GuardianAudit, intent?: CommandIntent): GuardianAudit {
    this.auditLog.unshift({
      command,
      timestamp: new Date().toISOString(),
      audit,
      intent
    });
    return audit;
  }

  getRecent(limit = 10): GuardianAuditEntry[] {
    return this.auditLog.slice(0, limit);
  }
}
