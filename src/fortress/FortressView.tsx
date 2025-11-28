import React, { useEffect, useMemo, useState } from 'react';
import worldSeed from './world/worldSeed.json';
import { TownHallBar } from './components/TownHallBar';
import { FortressGrid } from './components/FortressGrid';
import { BuildingPanel } from './components/BuildingPanel';
import { loadIAmProfile, IAmProfile } from './core/IAmNode';
import { recalculateTraitsFromXp, TraitSnapshot } from './core/Traits';
import { getXpSnapshot, XpDomain, type XpSnapshot } from './core/XpSystem';
import { getWorldState, loadWorldState, WorldState } from './world/WorldState';
import { getGrid } from './world/WorldGrid';
import { BuildingState } from './core/types';
import { buildingMetadata, getBuildingModule } from './core/Registry';
import { useViewport } from './core/useViewport';
import { AvotNpc, listAvots } from './avots/AvotRegistry';
import { getAvotsByBuilding, getPresenceSummary, tickPresenceEngine } from './avots/PresenceEngine';

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

const buildingXpDomains: Partial<Record<string, XpDomain>> = {
  Workshop: XpDomain.Craft,
  Library: XpDomain.Knowledge,
  Observatory: XpDomain.Insight,
  Gardens: XpDomain.Coherence,
  GuardTower: XpDomain.Integrity,
  PortalGate: XpDomain.Quest,
};

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
  const [xpSnapshot, setXpSnapshot] = useState<XpSnapshot>(() => getXpSnapshot());
  const [traitSnapshot, setTraitSnapshot] = useState<TraitSnapshot | null>(null);
  const [avots, setAvots] = useState<AvotNpc[]>(() => listAvots());
  const [presenceByBuilding, setPresenceByBuilding] = useState<Record<string, AvotNpc[]>>({});

  const isStacked = orientation === 'portrait' || breakpoint === 'xs' || breakpoint === 'sm';

  const selectedBuildingMeta = useMemo(
    () => buildingMetadata.find((meta) => meta.id === selectedBuildingId) ?? null,
    [selectedBuildingId],
  );

  const selectedActions = useMemo(
    () => buildingActions.find((item) => item.id === selectedBuildingId)?.actions ?? [],
    [selectedBuildingId],
  );

  const refreshPresence = (stateOverride?: WorldState, trigger: 'tick' | 'idle' | 'portal' | 'manual' | 'xp' = 'tick'): void => {
    const state = stateOverride ?? getWorldState();
    tickPresenceEngine(state, trigger);
    setAvots(listAvots());
    setPresenceByBuilding(getPresenceSummary());
    setWorldState(state);
  };

  useEffect(() => {
    loadWorldState();
    const loadedWorld = getWorldState();
    setWorldState(loadedWorld);
    setGrid(getGrid().map((row) => row.map((cell) => cell?.building ?? null)));
    const profile = loadIAmProfile();
    setIAmProfile(profile);
    const initialXp = getXpSnapshot();
    setXpSnapshot(initialXp);
    setTraitSnapshot(recalculateTraitsFromXp(initialXp));
    refreshPresence(loadedWorld);
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

  useEffect(() => {
    let timer: number | undefined;
    const schedule = (): void => {
      const delay = 30000 + Math.random() * 15000;
      timer = window.setTimeout(() => {
        refreshPresence(getWorldState(), 'idle');
        schedule();
      }, delay);
    };
    schedule();
    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, []);

  const handleSelect = (buildingId: string): void => {
    setSelectedBuildingId(buildingId);
  };

  const handleAction = (actionId: string): void => {
    if (!selectedBuildingId) return;
    const module = getBuildingModule(selectedBuildingId);
    if (!module) return;
    module.runBuildingAction(actionId);
    setBuildingState(module.getState());
    const snapshot = getXpSnapshot();
    setXpSnapshot(snapshot);
    const traits = recalculateTraitsFromXp(snapshot);
    setTraitSnapshot(traits);
    setIAmProfile(loadIAmProfile());
    const updatedWorld = getWorldState();
    refreshPresence(updatedWorld, 'xp');
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

  const resolvedWorldState = worldState ?? getWorldState();
  const avotsPresent = selectedBuildingId ? presenceByBuilding[selectedBuildingId] ?? [] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <TownHallBar iAmProfile={iAmProfile} traitSnapshot={traitSnapshot} onOpenProfile={() => undefined} />
      <div style={containerStyle}>
        <div style={gridWrapperStyle}>
          <div style={{ marginBottom: 8, fontWeight: 700 }}>Fortress Grid</div>
          <FortressGrid
            grid={grid}
            unlockedBuildings={worldState?.unlockedBuildings ?? []}
            selectedBuildingId={selectedBuildingId}
            onSelect={handleSelect}
            avotsByBuilding={presenceByBuilding}
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
            xpDomain={selectedBuildingId ? buildingXpDomains[selectedBuildingId] ?? null : null}
            xpSnapshot={xpSnapshot}
            traitSnapshot={traitSnapshot}
            avots={avotsPresent}
            worldState={resolvedWorldState}
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
