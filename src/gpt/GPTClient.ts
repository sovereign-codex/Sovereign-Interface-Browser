import { CommandIntent, SIOSOperation } from '../kodex/KodexTypes';

export interface GPTRequest {
  prompt: string;
  inputs?: Record<string, unknown>;
}

export class GPTClient {
  constructor(private readonly endpoint = import.meta.env.VITE_GPT_ENDPOINT) {}

  async complete(request: GPTRequest): Promise<string> {
    // Offline-friendly deterministic mock. Swap with a real transport as needed.
    const context = JSON.stringify(request.inputs ?? {});
    return `Mock GPT response to: ${request.prompt}${context === '{}' ? '' : ` | inputs: ${context}`}`;
  }

  async suggestIntent(command: string, operations: SIOSOperation[]): Promise<CommandIntent> {
    const normalized = command.toLowerCase();
    const ranked = operations
      .map((op) => ({
        op,
        score: this.scoreOperation(normalized, op)
      }))
      .sort((a, b) => b.score - a.score);

    const best = ranked[0]?.op ?? operations[0];
    return {
      operationId: best.id,
      summary: `Suggested operation ${best.name}`,
      confidence: Math.min(1, ranked[0]?.score ?? 0.4),
      source: 'gpt'
    };
  }

  private scoreOperation(command: string, operation: SIOSOperation): number {
    const tokens = operation.name.toLowerCase().split(/\s+/);
    const hits = tokens.filter((t) => command.includes(t)).length;
    return hits > 0 ? 0.6 + hits * 0.1 : 0.4;
  }
}
