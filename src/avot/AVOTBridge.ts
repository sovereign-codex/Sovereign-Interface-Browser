import registry from './registry.json';
import { AVOTInvocation, AVOTRegistryEntry } from './AVOTTypes';
import { CommandIntent, CommandResult, SIOSManifest } from '../kodex/KodexTypes';

export class AVOTBridge {
  private manifest?: SIOSManifest;
  private readonly registry: AVOTRegistryEntry[] = registry as AVOTRegistryEntry[];

  constructor(manifest?: SIOSManifest) {
    if (manifest) {
      this.setManifest(manifest);
    }
  }

  setManifest(manifest: SIOSManifest): void {
    this.manifest = manifest;
  }

  getRegistry(): AVOTRegistryEntry[] {
    return this.registry;
  }

  async invoke(intent: CommandIntent, command: string): Promise<CommandResult> {
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
