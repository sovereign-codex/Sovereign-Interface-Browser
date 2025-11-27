import { AVOTBridge } from '../avot/AVOTBridge';
import { GuardianLayer } from '../guardian/GuardianLayer';
import { KodexCore } from '../kodex/KodexCore';
import { CommandParser } from '../kodex/CommandParser';
import { CommandResult, GuardianAudit } from '../kodex/KodexTypes';
import { EventBus } from './EventBus';
import { SessionEntry, SessionManager } from './SessionManager';

export interface AppEvents {
  command: { input: string };
  result: { entry: SessionEntry };
  audit: { command: string; audit: GuardianAudit };
}

export class CommandRouter {
  constructor(
    private readonly kodex: KodexCore,
    private readonly avot: AVOTBridge,
    private readonly guardian: GuardianLayer,
    private readonly sessions: SessionManager,
    private readonly bus: EventBus<AppEvents>,
    private readonly parser = new CommandParser()
  ) {}

  async handleCommand(raw: string): Promise<SessionEntry> {
    this.bus.emit('command', { input: raw });
    const parsedIntent = this.parser.parse(raw, { manifest: this.kodex.getManifest() });
    const intent = parsedIntent ?? (await this.kodex.resolveIntent(raw));
    const audit = this.guardian.auditCommand(raw, intent);
    this.bus.emit('audit', { command: raw, audit });

    if (audit.decision === 'block') {
      const blocked: CommandResult = {
        status: 'blocked',
        message: audit.reason,
        auditTrail: [audit.reason]
      };
      const blockedEntry = this.sessions.record(raw, blocked);
      this.bus.emit('result', { entry: blockedEntry });
      return blockedEntry;
    }
    const result = await this.avot.invoke(intent, raw);
    if (audit.decision === 'flag') {
      result.auditTrail = [...(result.auditTrail ?? []), audit.reason];
    }

    const entry = this.sessions.record(raw, result);
    this.bus.emit('result', { entry });
    return entry;
  }
}
