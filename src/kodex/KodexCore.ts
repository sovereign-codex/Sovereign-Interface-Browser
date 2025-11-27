import baseSystemPrompt from './prompts/baseSystemPrompt.txt?raw';
import guardianPrompt from './prompts/guardianPrompt.txt?raw';
import { SIOSManifestLoader } from './SIOSManifest';
import { CommandIntent, PromptBundle, SIOSManifest } from './KodexTypes';
import { GPTClient } from '../gpt/GPTClient';
import config from '../config/default-config.json';

export class KodexCore {
  private manifest: SIOSManifest | null = null;
  private readonly loader: SIOSManifestLoader;
  private readonly gpt: GPTClient;
  private readonly prompts: PromptBundle;

  constructor(loader = new SIOSManifestLoader(), gpt = new GPTClient(), promptBundle?: PromptBundle) {
    this.loader = loader;
    this.gpt = gpt;
    this.prompts =
      promptBundle ?? ({ baseSystemPrompt, guardianPrompt } as PromptBundle);
  }

  async initialize(manifestUrl = config.defaultManifestUrl): Promise<void> {
    this.manifest = await this.loader.loadFromUrl(manifestUrl);
  }

  setManifest(manifest: SIOSManifest): void {
    this.manifest = manifest;
  }

  getManifest(): SIOSManifest | null {
    return this.manifest;
  }

  getPrompts(): PromptBundle {
    return this.prompts;
  }

  async resolveIntent(command: string): Promise<CommandIntent> {
    if (!this.manifest) {
      throw new Error('KodexCore has not been initialized with a manifest.');
    }

    const trimmed = command.trim();
    if (trimmed.startsWith('/')) {
      const opId = trimmed.slice(1);
      const match = this.manifest.operations.find((op) => op.id === opId);
      if (match) {
        return {
          operationId: match.id,
          summary: match.description,
          confidence: 0.9,
          source: 'rule'
        };
      }
    }

    if (trimmed.toLowerCase().includes('ping')) {
      return {
        operationId: 'diag.ping',
        summary: 'Diagnostics ping',
        confidence: 0.7,
        source: 'rule'
      };
    }

    return this.gpt.suggestIntent(command, this.manifest.operations);
  }
}
