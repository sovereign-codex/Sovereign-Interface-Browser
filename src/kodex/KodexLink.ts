import { AVOTRegistryEntry } from '../avot/AVOTTypes';
import fallbackRegistry from '../avot/registry.json';
import { AVOTBridge } from '../avot/AVOTBridge';
import { SIOSManifestLoader } from './SIOSManifest';
import { CommandIntent, SIOSManifest } from './KodexTypes';
import { KodexCore } from './KodexCore';

const DEFAULT_KODEX_SOURCE = (import.meta.env.VITE_KODEX_SOURCE as string | undefined) ?? 'local';

export class KodexLink {
  private manifest: SIOSManifest | null = null;
  private registry: AVOTRegistryEntry[] = fallbackRegistry as AVOTRegistryEntry[];
  private readonly loader: SIOSManifestLoader;

  constructor(private readonly fetcher: typeof fetch = fetch) {
    this.loader = new SIOSManifestLoader(fetcher);
  }

  async fetchManifest(source = DEFAULT_KODEX_SOURCE): Promise<SIOSManifest> {
    const manifestUrl = this.composeUrl(source, '/sios-manifest.json');
    const manifest = await this.loader.loadFromUrl(manifestUrl);
    this.manifest = manifest;
    return manifest;
  }

  async fetchAVOTRegistry(source = DEFAULT_KODEX_SOURCE): Promise<AVOTRegistryEntry[]> {
    const registryUrl = this.composeUrl(source, '/avot-registry.json');
    try {
      const response = await this.fetcher(registryUrl);
      if (response.ok) {
        const entries = (await response.json()) as AVOTRegistryEntry[];
        this.registry = entries;
        return entries;
      }
    } catch (error) {
      console.warn('Falling back to bundled AVOT registry.', error);
    }
    return this.registry;
  }

  async resolveIntent(command: string, core: KodexCore): Promise<CommandIntent> {
    if (!core.getManifest()) {
      if (!this.manifest) {
        await this.fetchManifest();
      }
      if (this.manifest) {
        core.setManifest(this.manifest);
      }
    }
    return core.resolveIntent(command);
  }

  attach(manifest: SIOSManifest, avotBridge: AVOTBridge, core: KodexCore): void {
    this.manifest = manifest;
    avotBridge.setManifest(manifest);
    core.setManifest(manifest);
  }

  private composeUrl(source: string, path: string): string {
    if (!source || source === 'local') {
      return path;
    }
    const normalized = source.endsWith('/') ? source.slice(0, -1) : source;
    return `${normalized}${path}`;
  }
}
