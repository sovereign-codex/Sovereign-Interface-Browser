import { NodeDefinition, RadialStatus } from './NodeDefinition';
import { RadialLayout, PolarPoint } from './RadialLayout';
import { RadialNode } from './RadialNode';

export class RadialEngine {
  constructor(private readonly size = 240) {}

  generate(nodes: NodeDefinition[]): RadialNode[] {
    const center: PolarPoint = { x: this.size / 2, y: this.size / 2 };
    return nodes.map((node) => {
      const { x, y } = RadialLayout.polarToCartesian(center, node.radius, node.angle);
      return {
        ...node,
        x,
        y,
        status: node.status ?? 'idle'
      } satisfies RadialNode;
    });
  }
}
