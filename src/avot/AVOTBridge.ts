import registry from './registry.json';
import { AVOTInvocation, AVOTRegistryEntry } from './AVOTTypes';
import { CommandIntent, CommandResult, SIOSManifest } from '../kodex/KodexTypes';
import { registerTalosEvent, type TalosEvent } from '../fortress/core/TalosBridge';
import { recalculateTraitsFromXp } from '../fortress/core/Traits';
import { getXpSnapshot, XpDomain } from '../fortress/core/XpSystem';
import { getWorldState } from '../fortress/world/WorldState';

export class AVOTBridge {
  private manifest?: SIOSManifest;
  private registry: AVOTRegistryEntry[] = registry as AVOTRegistryEntry[];

  constructor(manifest?: SIOSManifest) {
    if (manifest) {
      this.setManifest(manifest);
    }
  }

  setManifest(manifest: SIOSManifest): void {
    this.manifest = manifest;
  }

  setRegistry(entries: AVOTRegistryEntry[]): void {
    this.registry = entries;
  }

  getRegistry(): AVOTRegistryEntry[] {
    return this.registry;
  }

  async invoke(intent: CommandIntent, command: string): Promise<CommandResult> {
    const operationId = intent.operationId;
    if (operationId === 'fortress.talos.event') {
      return this.handleTalosEvent(intent);
    }
    if (operationId === 'fortress.xp.status') {
      return this.handleXpStatus(intent);
    }
    if (operationId === 'fortress.traits.status') {
      return this.handleTraitStatus(intent);
    }
    if (operationId === 'fortress.progress') {
      return this.handleFortressProgress(intent);
    }

    const registryEntry = this.registry.find((entry) => entry.id === intent.operationId);
    const handlerName = registryEntry?.handler ?? 'unknown';
    const invocation: AVOTInvocation = {
      command,
      intentOperationId: intent.operationId,
      args: intent.arguments
    };

    switch (handlerName) {
      case 'ping':
        return this.handlePing(invocation, intent);
      case 'echoManifest':
        return this.handleEchoManifest(invocation, intent);
      case 'listOperations':
        return this.handleListOperations(invocation, intent);
      default:
        return {
          status: 'ok',
          message: `No registered handler for ${intent.operationId}; returning noop response.`,
          intent,
          data: invocation
        };
    }
  }

  private async handlePing(invocation: AVOTInvocation, intent: CommandIntent): Promise<CommandResult> {
    return {
      status: 'ok',
      message: 'pong',
      intent,
      data: {
        timestamp: new Date().toISOString(),
        source: 'AVOTBridge',
        command: invocation.command
      }
    };
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return Math.random().toString(36).slice(2, 10);
  }

  private isDomain(value: unknown): value is XpDomain {
    return typeof value === 'string' && Object.values(XpDomain).includes(value as XpDomain);
  }

  private async handleTalosEvent(intent: CommandIntent): Promise<CommandResult> {
    const { domain, label, xp } = intent.arguments ?? {};
    if (!this.isDomain(domain)) {
      return { status: 'error', message: 'Invalid XP domain for Talos event.', intent };
    }

    const xpReward = Number.isFinite(Number(xp)) ? Number(xp) : 0;
    const event: TalosEvent = {
      id: this.generateId(),
      domain,
      label: String(label ?? 'Talos Event'),
      xpReward,
      source: 'manual',
      createdAt: new Date().toISOString(),
    };

    registerTalosEvent(event);
    return {
      status: 'ok',
      message: `Talos event recorded: ${event.label} (+${xpReward} ${domain} XP).`,
      intent,
      data: event,
    };
  }

  private async handleXpStatus(intent: CommandIntent): Promise<CommandResult> {
    const snapshot = getXpSnapshot();
    return {
      status: 'ok',
      message: 'XP snapshot ready.',
      intent,
      data: snapshot,
    };
  }

  private async handleTraitStatus(intent: CommandIntent): Promise<CommandResult> {
    const snapshot = getXpSnapshot();
    const traitSnapshot = recalculateTraitsFromXp(snapshot);
    return {
      status: 'ok',
      message: 'Trait snapshot ready.',
      intent,
      data: traitSnapshot,
    };
  }

  private async handleFortressProgress(intent: CommandIntent): Promise<CommandResult> {
    const snapshot = getXpSnapshot();
    const traitSnapshot = recalculateTraitsFromXp(snapshot);
    const world = getWorldState();

    return {
      status: 'ok',
      message: 'Fortress progress overview.',
      intent,
      data: {
        xp: snapshot,
        traits: traitSnapshot,
        townHall: {
          level: world.buildingLevels.TownHall ?? 1,
          bindToIAmNode: world.bindToIAmNode,
        },
      },
    };
  }

  private async handleEchoManifest(invocation: AVOTInvocation, intent: CommandIntent): Promise<CommandResult> {
    return {
      status: 'ok',
      message: this.manifest ? 'Current manifest snapshot.' : 'No manifest loaded.',
      intent,
      data: this.manifest ?? null,
      auditTrail: [invocation.command]
    };
  }

  private async handleListOperations(invocation: AVOTInvocation, intent: CommandIntent): Promise<CommandResult> {
    const manifestOps = this.manifest?.operations ?? [];
    const combined = [...manifestOps.map((op) => ({ ...op, source: 'manifest' })), ...this.registry.map((op) => ({ ...op, source: 'registry' }))];
    return {
      status: 'ok',
      message: 'Available operations',
      intent,
      data: combined,
      auditTrail: [invocation.command]
    };
  }
}
