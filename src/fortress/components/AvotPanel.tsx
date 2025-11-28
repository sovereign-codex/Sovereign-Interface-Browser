import React, { useMemo } from 'react';
import { logInfo } from '../../core/autonomy/kernel';
import { TraitSnapshot } from '../core/Traits';
import { WorldState } from '../world/WorldState';
import { AvotNpc } from '../avots/AvotRegistry';
import { getDialogue } from '../avots/DialogueEngine';
import { onInteraction } from '../avots/PresenceEngine';

interface AvotPanelProps {
  avot: AvotNpc;
  worldState: WorldState;
  traitSnapshot?: TraitSnapshot | null;
}

export const AvotPanel: React.FC<AvotPanelProps> = ({ avot, worldState, traitSnapshot }) => {
  const message = useMemo(() => getDialogue(avot.id, worldState, traitSnapshot), [avot.id, traitSnapshot, worldState]);

  const handleInteract = (action: string): void => {
    logInfo('fortress.avot', `[AVOT] ${avot.id}: interaction=${action}`);
    onInteraction(avot.id, action);
  };

  return (
    <div
      style={{
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: 12,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        background: 'rgba(255,255,255,0.02)',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: 'rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
        }}
      >
        {avot.avatar}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div>
            <div style={{ fontWeight: 700 }}>{avot.id}</div>
            <div style={{ fontSize: 12, color: '#95a5a6' }}>
              {avot.role} · Mood: {avot.mood}
            </div>
          </div>
          <div style={{ fontSize: 12, color: '#7f8c8d' }}>{avot.currentBuilding}</div>
        </div>
        <div style={{ marginTop: 6, fontSize: 13, color: '#dfe6e9' }}>{message}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          <button
            type="button"
            onClick={() => handleInteract('guidance')}
            style={{
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(41, 128, 185, 0.15)',
              color: '#ecf0f1',
              padding: '8px 10px',
              cursor: 'pointer',
            }}
          >
            Ask for guidance
          </button>
          <button
            type="button"
            onClick={() => handleInteract('mission')}
            style={{
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(46, 204, 113, 0.15)',
              color: '#ecf0f1',
              padding: '8px 10px',
              cursor: 'pointer',
            }}
          >
            Request mission
          </button>
          <button
            type="button"
            onClick={() => handleInteract('why-here')}
            style={{
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(241, 196, 15, 0.15)',
              color: '#ecf0f1',
              padding: '8px 10px',
              cursor: 'pointer',
            }}
          >
            Why are you here?
          </button>
        </div>
      </div>
    </div>
  );
};
