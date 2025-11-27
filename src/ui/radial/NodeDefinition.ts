export type RadialStatus = 'idle' | 'active' | 'blocked' | 'ok' | 'error';

export interface NodeDefinition {
  id: string;
  label: string;
  description: string;
  radius: number;
  angle: number;
  status?: RadialStatus;
}
