import React, { useEffect, useMemo, useState } from 'react';
import worldSeed from './world/worldSeed.json';
import { TownHallBar } from './components/TownHallBar';
import { FortressGrid } from './components/FortressGrid';
import { BuildingPanel } from './components/BuildingPanel';
import { loadIAmProfile, IAmProfile } from './core/IAmNode';
import { getWorldState, loadWorldState, WorldState } from './world/WorldState';
import { getGrid } from './world/WorldGrid';
import { BuildingState } from './core/types';
import { buildingMetadata, getBuildingModule } from './core/Registry';
import { useViewport } from './core/useViewport';

interface FortressViewProps {
  mode?: 'embedded' | 'full';
  initialSelectedBuildingId?: string | null;
  onSelectChange?: (buildingId: string | null) => void;
  onInitialized?: () => void;
}

const buildingActions = [
  { id: 'Workshop', actions: [{ id: 'simulate-craft', label: 'Simulate Craft' }] },
  { id: 'Library', actions: [{ id: 'simulate-study', label: 'Simulate Study' }] },
  { id: 'Observatory', actions: [{ id: 'simulate-scan', label: 'Simulate Scan' }] },
  { id: 'Gardens', actions: [{ id: 'simulate-meditate', label: 'Meditate' }] },
  { id: 'GuardTower', actions: [{ id: 'simulate-scan-boundaries', label: 'Scan Boundaries' }] },
  { id: 'PortalGate', actions: [{ id: 'simulate-open-portal', label: 'Open Portal' }] },
];

export const FortressView: React.FC<FortressViewProps> = ({
  mode = 'full',
  initialSelectedBuildingId = 'TownHall',
  onSelectChange,
  onInitialized,
}) => {
  const { orientation, breakpoint } = useViewport();
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [grid, setGrid] = useState<(string | null)[][]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(initialSelectedBuildingId);
  const [buildingState, setBuildingState] = useState<BuildingState | null>(null);
  const [iAmProfile, setIAmProfile] = useState<IAmProfile>(() => loadIAmProfile());

  const isStacked = orientation === 'portrait' || breakpoint === 'xs' || breakpoint === 'sm';

  const selectedBuildingMeta = useMemo(
    () => buildingMetadata.find((meta) => meta.id === selectedBuildingId) ?? null,
    [selectedBuildingId],
  );

  const selectedActions = useMemo(
    () => buildingActions.find((item) => item.id === selectedBuildingId)?.actions ?? [],
    [selectedBuildingId],
  );

  useEffect(() => {
    loadWorldState();
    setWorldState(getWorldState());
    setGrid(getGrid().map((row) => row.map((cell) => cell?.building ?? null)));
    setIAmProfile(loadIAmProfile());
    onInitialized?.();
  }, [onInitialized]);

  useEffect(() => {
    if (!selectedBuildingId) {
      setBuildingState(null);
      onSelectChange?.(null);
      return;
    }
    const module = getBuildingModule(selectedBuildingId);
    if (module) {
      setBuildingState(module.getState());
    }
    onSelectChange?.(selectedBuildingId);
  }, [selectedBuildingId, onSelectChange]);

  const handleSelect = (buildingId: string): void => {
    setSelectedBuildingId(buildingId);
  };

  const handleAction = (actionId: string): void => {
    if (!selectedBuildingId) return;
    const module = getBuildingModule(selectedBuildingId);
    if (!module) return;
    module.runBuildingAction(actionId);
    setBuildingState(module.getState());
    setWorldState(getWorldState());
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isStacked ? 'column' : 'row',
    gap: 16,
    width: '100%',
    height: '100%',
  };

  const gridWrapperStyle: React.CSSProperties = {
    flex: isStacked ? '0 0 auto' : '1 1 50%',
    padding: 12,
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.02)',
  };

  const panelWrapperStyle: React.CSSProperties = {
    flex: isStacked ? '0 0 auto' : '1 1 50%',
    padding: 12,
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.02)',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <TownHallBar iAmProfile={iAmProfile} onOpenProfile={() => undefined} />
      <div style={containerStyle}>
        <div style={gridWrapperStyle}>
          <div style={{ marginBottom: 8, fontWeight: 700 }}>Fortress Grid</div>
          <FortressGrid
            grid={grid}
            unlockedBuildings={worldState?.unlockedBuildings ?? []}
            selectedBuildingId={selectedBuildingId}
            onSelect={handleSelect}
          />
        </div>
        <div style={panelWrapperStyle}>
          <div style={{ marginBottom: 8, fontWeight: 700 }}>Building Detail</div>
          <BuildingPanel
            buildingId={selectedBuildingId}
            buildingState={buildingState}
            description={selectedBuildingMeta?.description ?? worldSeed.archetypes[selectedBuildingId ?? '']}
            onAction={handleAction}
            actions={selectedActions}
          />
        </div>
      </div>
      {mode === 'full' && worldState && (
        <div style={{ fontSize: 12, color: '#95a5a6', marginTop: 4 }}>
          Seed: {worldSeed.title} · Buildings unlocked: {worldState.unlockedBuildings.length} · Version: {worldState.worldVersion}
        </div>
      )}
    </div>
  );
};
