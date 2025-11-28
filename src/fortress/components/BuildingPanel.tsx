import React from 'react';
import { AvotNpc } from '../avots/AvotRegistry';
import { BuildingState } from '../core/types';
import { TraitSnapshot } from '../core/Traits';
import { XpDomain, XpSnapshot } from '../core/XpSystem';
import { WorldState } from '../world/WorldState';
import { AvotPanel } from './AvotPanel';

interface BuildingPanelProps {
  buildingId: string | null;
  buildingState: BuildingState | null;
  description?: string | null;
  onAction: (actionId: string) => void;
  actions?: { id: string; label: string; detail?: string }[];
  xpDomain?: XpDomain | null;
  xpSnapshot?: XpSnapshot | null;
  traitSnapshot?: TraitSnapshot | null;
  avots?: AvotNpc[];
  worldState?: WorldState | null;
}

export const BuildingPanel: React.FC<BuildingPanelProps> = ({
  buildingId,
  buildingState,
  description,
  onAction,
  actions = [],
  xpDomain,
  xpSnapshot,
  traitSnapshot,
  avots = [],
  worldState,
}) => {
  if (!buildingId) {
    return (
      <div
        style={{
          padding: 16,
          borderRadius: 12,
          border: '1px dashed rgba(255,255,255,0.15)',
          textAlign: 'center',
          color: '#bdc3c7',
        }}
      >
        Select a building to inspect it.
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(255,255,255,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{buildingId}</div>
          {description && <div style={{ fontSize: 12, color: '#dfe6e9' }}>{description}</div>}
        </div>
        {buildingState && (
          <div style={{ fontSize: 12, color: '#95a5a6' }}>Level {buildingState.level}</div>
        )}
      </div>

      {buildingState && (
        <div style={{ fontSize: 13, lineHeight: 1.5 }}>
          <div>Status: {buildingState.status}</div>
          {xpDomain && xpSnapshot && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Progress</div>
              <div style={{ fontSize: 12, color: '#ecf0f1' }}>
                This building earns XP in: <strong>{xpDomain}</strong>
              </div>
              <div style={{ fontSize: 12, color: '#dfe6e9' }}>
                {(() => {
                  const current = xpSnapshot.totalByDomain[xpDomain] ?? 0;
                  const matchedTrait = traitSnapshot?.traits.find((trait) => trait.xpDomain === xpDomain);
                  const nextThreshold = matchedTrait?.thresholds.find((value) => value > current) ?? null;
                  const label = matchedTrait?.label ?? xpDomain;
                  return nextThreshold
                    ? `${label} XP: ${current} (next threshold: ${nextThreshold})`
                    : `${label} XP: ${current}`;
                })()}
              </div>
            </div>
          )}
          {buildingState.metadata && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Stats</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 8 }}>
                {Object.entries(buildingState.metadata).map(([key, value]) => (
                  <div key={key} style={{ fontSize: 12, color: '#dfe6e9' }}>
                    <strong>{key}</strong>: {String(value)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {avots.length > 0 && worldState && (
        <div
          style={{
            marginTop: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ fontWeight: 700 }}>AVOT Presence</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {avots.map((avot) => (
              <AvotPanel key={avot.id} avot={avot} worldState={worldState} traitSnapshot={traitSnapshot} />
            ))}
          </div>
        </div>
      )}

      {actions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => onAction(action.id)}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(46,204,113,0.1)',
                color: '#ecf0f1',
                cursor: 'pointer',
                minWidth: 120,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13 }}>{action.label}</div>
              {action.detail && <div style={{ fontSize: 11, opacity: 0.85 }}>{action.detail}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
