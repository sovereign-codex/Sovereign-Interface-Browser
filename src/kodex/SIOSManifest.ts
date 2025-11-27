import { SIOSManifest, SIOSOperation } from './KodexTypes';

const validateOperation = (operation: SIOSOperation): void => {
  if (!operation.id || !operation.name) {
    throw new Error('Invalid manifest operation: id and name are required.');
  }
};

export class SIOSManifestLoader {
  constructor(private readonly fetcher: typeof fetch = fetch) {}

  async loadFromUrl(url: string): Promise<SIOSManifest> {
    const response = await this.fetcher(url);
    if (!response.ok) {
      throw new Error(`Failed to load manifest from ${url}: ${response.status}`);
    }
    const manifest = (await response.json()) as SIOSManifest;
    this.validate(manifest);
    return manifest;
  }

  async loadFromObject(manifest: SIOSManifest): Promise<SIOSManifest> {
    this.validate(manifest);
    return manifest;
  }

  private validate(manifest: SIOSManifest): void {
    if (!manifest.id || !manifest.name || !manifest.version) {
      throw new Error('Manifest is missing required top-level fields (id, name, version).');
    }
    manifest.operations.forEach(validateOperation);
  }
}
