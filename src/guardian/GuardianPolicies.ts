import { CommandIntent, GuardianAudit } from '../kodex/KodexTypes';

const destructiveSignatures = [/rm -rf/iu, /shutdown/iu, /drop\s+table/iu, /format\s+drive/iu];
const systemWriteKeywords = ['delete', 'remove', 'overwrite', 'reset', 'purge'];

export class GuardianPolicies {
  evaluate(command: string, intent?: CommandIntent | null): GuardianAudit {
    if (this.isDestructive(command)) {
      return { decision: 'block', reason: 'Destructive command detected by Guardian policies.' };
    }

    if (!intent || !intent.operationId) {
      return { decision: 'flag', reason: 'Intent validation required before execution.' };
    }

    if (this.requiresConfirmation(command, intent)) {
      return { decision: 'flag', reason: 'Potential system write detected. Confirmation required.' };
    }

    return { decision: 'allow', reason: 'Guardian policies satisfied.' };
  }

  private isDestructive(command: string): boolean {
    return destructiveSignatures.some((pattern) => pattern.test(command));
  }

  private requiresConfirmation(command: string, intent: CommandIntent): boolean {
    const normalized = `${intent.operationId} ${command}`.toLowerCase();
    return systemWriteKeywords.some((keyword) => normalized.includes(keyword));
  }
}
