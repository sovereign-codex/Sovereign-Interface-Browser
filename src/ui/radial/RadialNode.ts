import { NodeDefinition, RadialStatus } from './NodeDefinition';

export interface RadialNode extends NodeDefinition {
  x: number;
  y: number;
  status: RadialStatus;
}
