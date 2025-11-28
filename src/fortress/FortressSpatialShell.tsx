import React, { useEffect, useMemo, useState } from 'react';
import { SpatialPane } from '../spatial/SpatialPane';
import { useSpatial } from '../spatial/SpatialContext';
import { TownHallBar } from './components/TownHallBar';
import { FortressGrid } from './components/FortressGrid';
import { BuildingPanel } from './components/BuildingPanel';
import { AvotSpatialSummary } from './components/AvotSpatialSummary';
import { IAmProfile, loadIAmProfile } from './core/IAmNode';
import { recalculateTraitsFromXp, TraitSnapshot } from './core/Traits';
import { getXpSnapshot, XpDomain, XpSnapshot } from './core/XpSystem';
import { getWorldState, loadWorldState, WorldState } from './world/WorldState';
import { getGrid } from './world/WorldGrid';
import { BuildingState } from './core/types';
import { buildingMetadata, getBuildingModule } from './core/Registry';
import { AvotNpc, listAvots } from './avots/AvotRegistry';
import { getPresenceSummary, tickPresenceEngine } from './avots/PresenceEngine';
import { FortressShell } from './FortressShell';
import { CrownSpirePanel } from './components/CrownSpirePanel';
import { CrownSpireState } from './crown/CrownTypes';
import { initCrownSpire, requestSpireScan } from './crown/CrownController';
import { executeCommand } from '../core/commands/executor';
import { getKernelState } from '../core/autonomy/kernel';

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

export const FortressSpatialShell: React.FC = () => {
  const spatial = useSpatial();
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [grid, setGrid] = useState<(string | null)[][]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>('TownHall');
  const [buildingState, setBuildingState] = useState<BuildingState | null>(null);
  const [iAmProfile, setIAmProfile] = useState<IAmProfile>(() => loadIAmProfile());
  const [xpSnapshot, setXpSnapshot] = useState<XpSnapshot>(() => getXpSnapshot());
  const [traitSnapshot, setTraitSnapshot] = useState<TraitSnapshot | null>(null);
  const [presenceByBuilding, setPresenceByBuilding] = useState<Record<string, AvotNpc[]>>({});
  const [avots, setAvots] = useState<AvotNpc[]>(() => listAvots());
  const [crownState, setCrownState] = useState<CrownSpireState | null>(null);
  const [isScanning, setIsScanning] = useState(false);

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
    tickPresenceEngine(loadedWorld, 'tick');
    setAvots(listAvots());
    setPresenceByBuilding(getPresenceSummary());
    initCrownSpire({ worldState: loadedWorld });
    requestSpireScan().then(setCrownState).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!selectedBuildingId) {
      setBuildingState(null);
      return;
    }
    const module = getBuildingModule(selectedBuildingId);
    if (module) {
      setBuildingState(module.getState());
    }
  }, [selectedBuildingId]);

  useEffect(() => {
    let timer: number | undefined;
    const schedule = (): void => {
      const delay = 30000 + Math.random() * 15000;
      timer = window.setTimeout(() => {
        tickPresenceEngine(getWorldState(), 'idle');
        setAvots(listAvots());
        setPresenceByBuilding(getPresenceSummary());
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

  useEffect(() => {
    if (spatial.active && !spatial.lastActivatedAt) {
      // ensure activation timestamp propagates when entering via route
      spatial.enterSpatialMode(spatial.mode);
    }
  }, [spatial.active, spatial.enterSpatialMode, spatial.lastActivatedAt, spatial.mode]);

  const handleSpireScan = async (): Promise<void> => {
    setIsScanning(true);
    try {
      const state = await requestSpireScan();
      setCrownState(state);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSpireCommand = (cmd: string): void => {
    executeCommand(cmd, { toggleTheme: () => undefined, getKernelState }).catch(() => undefined);
  };

  const selectedBuildingMeta = useMemo(
    () => buildingMetadata.find((meta) => meta.id === selectedBuildingId) ?? null,
    [selectedBuildingId],
  );

  const selectedActions = useMemo(
    () => buildingActions.find((item) => item.id === selectedBuildingId)?.actions ?? [],
    [selectedBuildingId],
  );

  const avotsPresent = selectedBuildingId ? presenceByBuilding[selectedBuildingId] ?? [] : [];

  if (!spatial.active) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', color: '#95a5a6' }}>
          Spatial mode is not active. Use fortress.spatial to enter simulation.
        </div>
        <FortressShell mode="full" />
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
      <SpatialPane id="crown-spire" anchor="top" title="Crown Spire">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button
            type="button"
            onClick={handleSpireScan}
            disabled={isScanning}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(52,152,219,0.18)',
              color: '#ecf0f1',
              cursor: isScanning ? 'not-allowed' : 'pointer',
            }}
          >
            {isScanning ? 'Scanning…' : 'Refresh Spire Scan'}
          </button>
        </div>
        <CrownSpirePanel
          state={crownState}
          onRunCommand={handleSpireCommand}
          onFocusBuilding={(id) => setSelectedBuildingId(id)}
        />
      </SpatialPane>
      <SpatialPane id="fortress-townhall" anchor="top" title="Town Hall">
        <TownHallBar iAmProfile={iAmProfile} traitSnapshot={traitSnapshot} onOpenProfile={() => undefined} />
      </SpatialPane>
      <SpatialPane id="fortress-grid" anchor="center" title="Fortress Grid">
        <FortressGrid
          grid={grid}
          unlockedBuildings={worldState?.unlockedBuildings ?? []}
          selectedBuildingId={selectedBuildingId}
          onSelect={(buildingId) => setSelectedBuildingId(buildingId)}
          avotsByBuilding={presenceByBuilding}
        />
      </SpatialPane>
      <SpatialPane id="fortress-building" anchor="right" title="Building Detail">
        <BuildingPanel
          buildingId={selectedBuildingId}
          buildingState={buildingState}
          description={selectedBuildingMeta?.description ?? ''}
          onAction={(actionId) => {
            if (!selectedBuildingId) return;
            const module = getBuildingModule(selectedBuildingId);
            if (!module) return;
            module.runBuildingAction(actionId);
            const snapshot = getXpSnapshot();
            setXpSnapshot(snapshot);
            setTraitSnapshot(recalculateTraitsFromXp(snapshot));
            setIAmProfile(loadIAmProfile());
            const state = getWorldState();
            tickPresenceEngine(state, 'xp');
            setWorldState(state);
            setPresenceByBuilding(getPresenceSummary());
            setAvots(listAvots());
            setBuildingState(module.getState());
          }}
          actions={selectedActions}
          xpDomain={selectedBuildingId ? buildingXpDomains[selectedBuildingId] ?? null : null}
          xpSnapshot={xpSnapshot}
          traitSnapshot={traitSnapshot}
          avots={avotsPresent}
          worldState={worldState ?? getWorldState()}
        />
      </SpatialPane>
      <SpatialPane id="fortress-avots" anchor="bottom" title="AVOT Presence">
        <AvotSpatialSummary avots={avots} spatialState={spatial} />
      </SpatialPane>
    </div>
  );
};
