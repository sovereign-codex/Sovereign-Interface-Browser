import React, { useEffect, useState } from 'react';
import { TownHallBar } from '../components/TownHallBar';
import { FortressGrid } from '../components/FortressGrid';
import { BuildingPanel } from '../components/BuildingPanel';
import { IAmProfile, loadIAmProfile } from '../core/IAmNode';
import { BuildingState } from '../core/types';
import { getBuildingModule } from '../core/Registry';
import { getWorldState, loadWorldState } from '../world/WorldState';
import { getGrid } from '../world/WorldGrid';

const widgetActions = [
  { id: 'Workshop', actions: [{ id: 'simulate-craft', label: 'Simulate Craft' }] },
  { id: 'Library', actions: [{ id: 'simulate-study', label: 'Simulate Study' }] },
  { id: 'Observatory', actions: [{ id: 'simulate-scan', label: 'Simulate Scan' }] },
  { id: 'Gardens', actions: [{ id: 'simulate-meditate', label: 'Meditate' }] },
  { id: 'GuardTower', actions: [{ id: 'simulate-scan-boundaries', label: 'Scan Boundaries' }] },
  { id: 'PortalGate', actions: [{ id: 'simulate-open-portal', label: 'Open Portal' }] },
];

export const FortressWidget: React.FC = () => {
  const [iAmProfile, setIAmProfile] = useState<IAmProfile>(() => loadIAmProfile());
  const [grid, setGrid] = useState<(string | null)[][]>([]);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [buildingState, setBuildingState] = useState<BuildingState | null>(null);

  useEffect(() => {
    loadWorldState();
    const world = getWorldState();
    setUnlocked(world.unlockedBuildings);
    setGrid(getGrid().map((row) => row.map((cell) => cell?.building ?? null)));
    setIAmProfile(loadIAmProfile());
  }, []);

  useEffect(() => {
    if (!selectedBuildingId) return;
    const module = getBuildingModule(selectedBuildingId);
    if (module) {
      setBuildingState(module.getState());
    }
  }, [selectedBuildingId]);

  const openFortress = (buildingId?: string): void => {
    if (typeof window === 'undefined') return;
    if (buildingId) {
      window.sessionStorage.setItem('fortress.initialSelection', buildingId);
    }
    window.history.pushState({}, '', '/fortress');
    window.dispatchEvent(new Event('popstate'));
  };

  const handleAction = (actionId: string): void => {
    if (!selectedBuildingId) return;
    const module = getBuildingModule(selectedBuildingId);
    if (!module) return;
    module.runBuildingAction(actionId);
    setBuildingState(module.getState());
  };

  const selectedActions = widgetActions.find((item) => item.id === selectedBuildingId)?.actions ?? [];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.08)',
        padding: 12,
        background: 'rgba(255,255,255,0.02)',
      }}
    >
      <TownHallBar iAmProfile={iAmProfile} onOpenProfile={() => openFortress('TownHall')} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <FortressGrid
          grid={grid}
          unlockedBuildings={unlocked}
          selectedBuildingId={selectedBuildingId}
          onSelect={(id) => {
            setSelectedBuildingId(id);
            setTimeout(() => openFortress(id), 150);
          }}
        />
        <div style={{ fontSize: 12, color: '#95a5a6', textAlign: 'right' }}>
          <button
            type="button"
            onClick={() => openFortress(selectedBuildingId ?? undefined)}
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(46,204,113,0.08)',
              color: '#ecf0f1',
              cursor: 'pointer',
            }}
          >
            Enter Fortress
          </button>
        </div>
      </div>
      {selectedBuildingId && (
        <BuildingPanel
          buildingId={selectedBuildingId}
          buildingState={buildingState}
          onAction={handleAction}
          actions={selectedActions}
          description={undefined}
        />
      )}
    </div>
  );
};
