import React from 'react';
import { AvotNpc } from '../avots/AvotRegistry';
import { SpatialState } from '../../spatial/SpatialContext';

interface AvotSpatialSummaryProps {
  avots: AvotNpc[];
  spatialState: SpatialState;
}

const anchorHints: Record<string, string> = {
  Observatory: 'top-right',
  Gardens: 'lower-left',
  GuardTower: 'top-left',
  Workshop: 'center-left',
  Library: 'center-right',
  PortalGate: 'bottom-center',
  TownHall: 'center',
};

export const AvotSpatialSummary: React.FC<AvotSpatialSummaryProps> = ({ avots, spatialState }) => {
  if (avots.length === 0) {
    return <div style={{ color: '#95a5a6' }}>No AVOT presence detected.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {avots.map((avot) => {
        const anchor = anchorHints[avot.currentBuilding] ?? 'center';
        const line = `${avot.id} at ${avot.currentBuilding} (anchor: ${anchor})`;
        return (
          <div
            key={`${avot.id}-${avot.currentBuilding}`}
            data-spatial-avot-id={spatialState.active ? avot.id : undefined}
            data-spatial-building-id={spatialState.active ? avot.currentBuilding : undefined}
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#ecf0f1',
              fontSize: 13,
            }}
          >
            {line}
          </div>
        );
      })}
    </div>
  );
};
