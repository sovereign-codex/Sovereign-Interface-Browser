export type SpireSignalSource =
  | 'xp'
  | 'traits'
  | 'quests'
  | 'avots'
  | 'world'
  | 'talos'
  | 'suc'
  | 'spatial';

export interface SpireMetric {
  id: string;
  label: string;
  value: number;
  trend?: 'up' | 'down' | 'steady';
  notes?: string;
}

export interface SpireInsight {
  id: string;
  summary: string;
  detail?: string;
  priority: 'low' | 'medium' | 'high';
  domain: SpireSignalSource;
  createdAt: string;
}

export interface SpireRecommendation {
  id: string;
  label: string;
  description?: string;
  suggestedCommands?: string[];
  suggestedBuildingId?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface CrownSpireState {
  lastScanAt?: string;
  metrics: SpireMetric[];
  insights: SpireInsight[];
  recommendations: SpireRecommendation[];
}
