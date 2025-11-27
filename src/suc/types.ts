export type UpdateScope = 'kernel' | 'ui' | 'avot' | 'flow' | 'storage' | 'docs' | 'infra';

export interface SovereignUpdateManifest {
  id: string;
  version: string;
  title: string;
  description?: string;
  createdAt: string;
  author?: string;
  scope: UpdateScope[];
  affects?: string[];
  requires?: string[];
  incompatibleWith?: string[];
  safetyLevel: 'safe' | 'review' | 'experimental';
  migrationNotes?: string[];
}

export interface AppliedUpdateRecord {
  id: string;
  appliedAt: string;
  version: string;
  notes?: string;
}
