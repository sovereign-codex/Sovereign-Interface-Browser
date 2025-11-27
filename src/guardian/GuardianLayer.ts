import guardianPrompt from '../kodex/prompts/guardianPrompt.txt?raw';
import { GuardianAudit } from '../kodex/KodexTypes';

export class GuardianLayer {
  constructor(private readonly prompt: string = guardianPrompt) {}

  auditCommand(command: string): GuardianAudit {
    const normalized = command.toLowerCase();
    if (normalized.includes('rm -rf') || normalized.includes('shutdown')) {
      return { decision: 'block', reason: 'Command appears destructive and is not permitted.' };
    }
    if (normalized.includes('secret') || normalized.includes('token')) {
      return { decision: 'flag', reason: 'Possible sensitive data request. Proceed with caution.' };
    }
    return { decision: 'allow', reason: 'No policy concerns detected.' };
  }

  getPrompt(): string {
    return this.prompt;
  }
}
