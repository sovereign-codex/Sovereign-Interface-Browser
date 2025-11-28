import React, { useEffect, useMemo, useState } from 'react';
import { logDebug, logInfo } from '../core/autonomy/kernel';
import { FortressView } from './FortressView';
import { useViewport } from './core/useViewport';
import { loadWorldState } from './world/WorldState';
import { loadIAmProfile } from './core/IAmNode';

interface FortressShellProps {
  mode?: 'embedded' | 'full';
}

const getStoredSelection = (): string | null => {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem('fortress.initialSelection');
};

export const FortressShell: React.FC<FortressShellProps> = ({ mode = 'full' }) => {
  const { orientation, breakpoint } = useViewport();
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(() => getStoredSelection());

  useEffect(() => {
    loadWorldState();
    loadIAmProfile();
    logInfo('fortress.view', '[FORTRESS] Fortress view initialized.');
  }, []);

  useEffect(() => {
    if (selectedBuildingId) {
      logDebug('fortress.view', `[FORTRESS] Building selected: ${selectedBuildingId}`);
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('fortress.initialSelection', selectedBuildingId);
      }
    }
  }, [selectedBuildingId]);

  const containerStyle: React.CSSProperties = useMemo(
    () => ({
      padding: mode === 'embedded' ? 12 : 20,
      borderRadius: mode === 'embedded' ? 12 : 0,
      background: mode === 'embedded' ? 'rgba(255,255,255,0.03)' : 'transparent',
      border: mode === 'embedded' ? '1px solid rgba(255,255,255,0.08)' : 'none',
      minHeight: mode === 'full' ? 'calc(100vh - 48px)' : 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      transition: 'all 0.2s ease',
    }),
    [mode],
  );

  const layoutHint = `${orientation} · ${breakpoint}`;

  return (
    <div style={containerStyle}>
      {mode === 'full' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#95a5a6' }}>
          <div style={{ fontWeight: 700 }}>Fortress OS Interface</div>
          <div style={{ fontSize: 12 }}>Layout: {layoutHint}</div>
        </div>
      )}
      <FortressView
        mode={mode}
        initialSelectedBuildingId={selectedBuildingId ?? undefined}
        onSelectChange={setSelectedBuildingId}
      />
    </div>
  );
};
