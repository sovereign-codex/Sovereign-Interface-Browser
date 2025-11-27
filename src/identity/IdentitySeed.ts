import seedProfile from './IdentityProfile.json';
import { IdentityProfile } from './IdentityVault';

const generateSovereignId = (): string => crypto.randomUUID?.() ?? `sib-${Date.now()}`;

export class IdentitySeed {
  generateSeedProfile(): IdentityProfile {
    const sovereignId = seedProfile.sovereignId ?? generateSovereignId();
    const created = seedProfile.creationTimestamp ?? new Date().toISOString();

    return {
      id: sovereignId,
      sovereignId,
      handle: seedProfile.handle ?? `tyme-${sovereignId.slice(0, 6)}`,
      persona: seedProfile.persona ?? 'sovereign-operator',
      createdAt: created,
      creationTimestamp: created,
      preferredVoice: seedProfile.preferredVoice ?? 'orchestral',
      avatar: seedProfile.avatar ?? 'constellation',
      settings: seedProfile.settings ?? {}
    };
  }
}
