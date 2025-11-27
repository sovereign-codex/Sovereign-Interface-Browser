import { SIBStorage } from '../storage/SIBStorage';
import { IdentitySeed } from './IdentitySeed';

export interface IdentityProfile {
  id: string;
  sovereignId: string;
  handle: string;
  persona: string;
  createdAt: string;
  creationTimestamp: string;
  preferredVoice: string;
  avatar: string;
  settings: Record<string, unknown>;
}

export class IdentityVault {
  private readonly storage: SIBStorage;
  private readonly key = 'identity';
  private readonly seed: IdentitySeed;

  constructor(storage = new SIBStorage(), seed = new IdentitySeed()) {
    this.storage = storage;
    this.seed = seed;
  }

  getActiveIdentity(): IdentityProfile {
    const existing = this.storage.getItem<IdentityProfile>(this.key);
    if (existing) return existing;

    const seededProfile = this.seed.generateSeedProfile();
    this.saveIdentity(seededProfile);
    return seededProfile;
  }

  saveIdentity(profile: IdentityProfile): void {
    this.storage.setItem(this.key, profile);
  }

  clearIdentity(): void {
    this.storage.removeItem(this.key);
  }
}
