import React, { useEffect, useState } from 'react';
import { CrownSpireState } from '../crown/CrownTypes';
import { initCrownSpire, requestSpireScan } from '../crown/CrownController';

const MiniBar: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#95a5a6' }}>
        <span>{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <div style={{ height: 6, borderRadius: 6, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #ff9ff3, #6c5ce7)',
          }}
        />
      </div>
    </div>
  );
};

export const CrownSpireWidget: React.FC = () => {
  const [state, setState] = useState<CrownSpireState | null>(null);

  useEffect(() => {
    initCrownSpire();
    requestSpireScan().then(setState).catch(() => undefined);
  }, []);

  const openCrownSpire = (): void => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('sib:navigate', { detail: { path: '/fortress', openCrownSpire: true } }));
  };

  const coherence = state?.metrics.find((m) => m.id === 'coherence')?.value ?? 0;
  const momentum = state?.metrics.find((m) => m.id === 'momentum')?.value ?? 0;
  const recCount = state?.recommendations.length ?? 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: 12,
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.02)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700 }}>Crown Spire</div>
        <div style={{ fontSize: 11, color: '#95a5a6' }}>{state?.lastScanAt ? 'Synced' : 'Pending'}</div>
      </div>
      <MiniBar label="Coherence" value={coherence} />
      <MiniBar label="Momentum" value={momentum} />
      <div style={{ fontSize: 12, color: '#bdc3c7' }}>Recommendations: {recCount}</div>
      <button
        type="button"
        onClick={openCrownSpire}
        style={{
          padding: '8px 10px',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(52,152,219,0.14)',
          color: '#ecf0f1',
          cursor: 'pointer',
        }}
      >
        Open Crown Spire
      </button>
    </div>
  );
};
