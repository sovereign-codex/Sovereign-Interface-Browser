import guardianPrompt from '../kodex/prompts/guardianPrompt.txt?raw';
import { CommandIntent, GuardianAudit } from '../kodex/KodexTypes';
import { GuardianAuditor } from './GuardianAuditor';
import { GuardianPolicies } from './GuardianPolicies';

export class GuardianLayer {
  private readonly policies = new GuardianPolicies();
  private readonly auditor = new GuardianAuditor();

  constructor(private readonly prompt: string = guardianPrompt) {}

  auditCommand(command: string, intent?: CommandIntent | null): GuardianAudit {
    const evaluation = this.policies.evaluate(command, intent);
    return this.auditor.record(command, evaluation, intent ?? undefined);
  }

  getPrompt(): string {
    return this.prompt;
  }

  getAuditTrail(): ReturnType<GuardianAuditor['getRecent']> {
    return this.auditor.getRecent();
  }
}
