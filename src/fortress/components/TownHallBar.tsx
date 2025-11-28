import React from 'react';
import { IAmProfile } from '../core/IAmNode';
import { TraitSnapshot } from '../core/Traits';

interface TownHallBarProps {
  iAmProfile: IAmProfile;
  traitSnapshot?: TraitSnapshot | null;
  onOpenProfile: () => void;
}

const shorten = (value: string, length = 12): string => {
  if (value.length <= length) return value;
  return `${value.slice(0, length)}…`;
};

const renderTraitSummary = (snapshot?: TraitSnapshot | null): string => {
  const traits = snapshot?.traits ?? [];
  if (!traits.length) return 'Traits initializing...';
  const sorted = [...traits].sort((a, b) => b.level - a.level || a.label.localeCompare(b.label));
  const visible = sorted.filter((trait) => trait.level > 0).slice(0, 3);
  const fallback = sorted.slice(0, 2);
  const selected = visible.length > 0 ? visible : fallback;
  return selected.map((trait) => `${trait.label} ${trait.level}`).join(' • ');
};

export const TownHallBar: React.FC<TownHallBarProps> = ({ iAmProfile, traitSnapshot, onOpenProfile }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 12,
        background: 'linear-gradient(90deg, rgba(52,73,94,0.6), rgba(46,204,113,0.08))',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: '0.01em' }}>{iAmProfile.title}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12, color: '#dfe6e9' }}>
          <span>Essence: {shorten(iAmProfile.essenceSignature)}</span>
          <span>Mission: {shorten(iAmProfile.missionTrajectory, 18)}</span>
          <span>
            Coherence: <strong>{iAmProfile.coherenceIndex}</strong>
          </span>
          <span>Traits: {renderTraitSummary(traitSnapshot)}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpenProfile}
        style={{
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(255,255,255,0.05)',
          color: '#ecf0f1',
          cursor: 'pointer',
        }}
      >
        Open I-AM Profile
      </button>
    </div>
  );
};
