import { SIBStorage } from '../storage/SIBStorage';

export interface IdentityProfile {
  id: string;
  handle: string;
  persona: string;
  createdAt: string;
}

export class IdentityVault {
  private readonly storage: SIBStorage;
  private readonly key = 'identity';

  constructor(storage = new SIBStorage()) {
    this.storage = storage;
  }

  getActiveIdentity(): IdentityProfile {
    const existing = this.storage.getItem<IdentityProfile>(this.key);
    if (existing) return existing;

    const seed = crypto.randomUUID?.() ?? `sib-${Date.now()}`;
    const profile: IdentityProfile = {
      id: seed,
      handle: `tyme-${seed.slice(0, 6)}`,
      persona: 'sovereign-operator',
      createdAt: new Date().toISOString()
    };
    this.saveIdentity(profile);
    return profile;
  }

  saveIdentity(profile: IdentityProfile): void {
    this.storage.setItem(this.key, profile);
  }

  clearIdentity(): void {
    this.storage.removeItem(this.key);
  }
}
