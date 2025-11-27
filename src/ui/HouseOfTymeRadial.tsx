import React, { useMemo } from 'react';
import { RadialEngine } from './radial/RadialEngine';
import { NodeDefinition } from './radial/NodeDefinition';

interface Props {
  sessionId: string;
  status: string;
}

const statusColor: Record<string, string> = {
  ok: '#45a29e',
  blocked: '#ff6b6b',
  error: '#ff6b6b',
  idle: '#c5c6c7'
};

const radialNodes: NodeDefinition[] = [
  {
    id: 'tyme-core',
    label: 'Tyme Core',
    description: 'Sovereign conductor and orchestrator.',
    radius: 0,
    angle: 0,
    status: 'active'
  },
  {
    id: 'avot-council',
    label: 'AVOT Council',
    description: 'Collective agents aligned to Tyme.',
    radius: 84,
    angle: -90
  },
  {
    id: 'sios-archive',
    label: 'SIOS Archive',
    description: 'Manifests and operational memory.',
    radius: 84,
    angle: -18
  },
  {
    id: 'identity',
    label: 'Identity',
    description: 'Sovereign profile and vault.',
    radius: 84,
    angle: 54
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Preferences and radial tuning.',
    radius: 84,
    angle: 126
  }
];

export const HouseOfTymeRadial: React.FC<Props> = ({ sessionId, status }) => {
  const engine = useMemo(() => new RadialEngine(240), []);
  const nodes = useMemo(() => engine.generate(radialNodes), [engine]);
  const color = statusColor[status] ?? '#66fcf1';

  return (
    <div
      style={{
        background: '#0c1220',
        border: '1px solid #1f2833',
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, color: '#c5c6c7' }}>House of Tyme Radial</div>
          <div style={{ fontSize: 12, color: '#e8f1ff' }}>Session {sessionId}</div>
        </div>
        <div
          style={{
            padding: '6px 10px',
            borderRadius: 999,
            border: `1px solid ${color}`,
            color,
            fontSize: 12,
            boxShadow: `0 0 12px ${color}44`
          }}
        >
          {status.toUpperCase()}
        </div>
      </div>

      <div style={{ position: 'relative', width: 240, height: 240, margin: '0 auto' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '1px dashed #1f2833'
          }}
        />
        {nodes.map((node) => {
          const nodeColor = node.id === 'tyme-core' ? color : '#66fcf1';
          return (
            <div
              key={node.id}
              style={{
                position: 'absolute',
                left: node.x - 36,
                top: node.y - 36,
                width: 72,
                height: 72,
                borderRadius: '50%',
                border: `2px solid ${nodeColor}`,
                background: '#0c1220',
                boxShadow: `0 0 12px ${nodeColor}33`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: 6
              }}
            >
              <div style={{ fontSize: 12, color: nodeColor, fontWeight: 700 }}>{node.label}</div>
              <div style={{ fontSize: 10, color: '#c5c6c7' }}>{node.description}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
