import React, { useCallback, useEffect, useMemo, useState } from 'react';
import config from '../config/default-config.json';
import { AVOTBridge } from '../avot/AVOTBridge';
import { AppEvents, CommandRouter } from '../core/CommandRouter';
import { EventBus } from '../core/EventBus';
import { SessionEntry, SessionManager } from '../core/SessionManager';
import { GPTClient } from '../gpt/GPTClient';
import { GuardianLayer } from '../guardian/GuardianLayer';
import { IdentityProfile, IdentityVault } from '../identity/IdentityVault';
import { KodexCore } from '../kodex/KodexCore';
import { KodexLink } from '../kodex/KodexLink';
import { CommandResult, GuardianAudit, SIOSManifest } from '../kodex/KodexTypes';
import { Omnibar } from '../ui/Omnibar';
import { TymePanel } from '../ui/TymePanel';
import { Viewport } from '../ui/Viewport';
import { HouseOfTymeRadial } from '../ui/HouseOfTymeRadial';
import { useSovereignTheme } from '../sib/ui/SovereignTheme';
import { AutonomyHud } from '../ui/AutonomyHud';
import { CommandContext } from '../core/commands/types';
import { getKernelState } from '../core/autonomy/kernel';
import { refreshStatus as refreshSucStatus } from '../core/autonomy/sucController';
import { FortressShell } from '../fortress/FortressShell';
import { useSpatial } from '../spatial/SpatialContext';
import { FortressSpatialShell } from '../fortress/FortressSpatialShell';

export const ShellApp: React.FC = () => {
  const { theme, toggleTheme } = useSovereignTheme();
  const spatial = useSpatial();
  const eventBus = useMemo(() => new EventBus<AppEvents>(), []);
  const sessionManager = useMemo(() => new SessionManager(), []);
  const guardian = useMemo(() => new GuardianLayer(), []);
  const gptClient = useMemo(() => new GPTClient(), []);
  const kodex = useMemo(() => new KodexCore(undefined, gptClient), [gptClient]);
  const kodexLink = useMemo(() => new KodexLink(), []);
  const avot = useMemo(() => new AVOTBridge(), []);
  const identityVault = useMemo(() => new IdentityVault(), []);

  const [history, setHistory] = useState<SessionEntry[]>([]);
  const [auditLog, setAuditLog] = useState<GuardianAudit | null>(null);
  const [manifest, setManifest] = useState<SIOSManifest | null>(null);
  const [identity, setIdentity] = useState<IdentityProfile>(() => identityVault.getActiveIdentity());
  const [ready, setReady] = useState(false);
  const [currentPath, setCurrentPath] = useState<string>(() => (typeof window !== 'undefined' ? window.location.pathname : '/'));

  const commandContext = useMemo<CommandContext>(
    () => ({
      toggleTheme,
      getKernelState,
      spatial: {
        enterSpatialMode: spatial.enterSpatialMode,
        exitSpatialMode: spatial.exitSpatialMode,
        toggleSpatialMode: spatial.toggleSpatialMode,
        getSpatialState: () => spatial,
      },
    }),
    [spatial, toggleTheme],
  );

  const router = useMemo(() => new CommandRouter(kodex, avot, guardian, sessionManager, eventBus), [avot, eventBus, guardian, kodex, sessionManager]);

  useEffect(() => {
    const unsubscribers = [
      eventBus.on('result', ({ entry }) => setHistory(sessionManager.getHistory())),
      eventBus.on('audit', ({ audit }) => setAuditLog(audit)),
    ];

    const init = async (): Promise<void> => {
      refreshSucStatus().catch(() => undefined);
      const source = (import.meta.env.VITE_KODEX_SOURCE as string | undefined) ?? 'local';
      const loadedManifest = await kodexLink.fetchManifest(source);
      kodexLink.attach(loadedManifest, avot, kodex);
      const registry = await kodexLink.fetchAVOTRegistry(source);
      avot.setRegistry(registry);
      setManifest(loadedManifest);
      setReady(true);
    };

    init();
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [avot, eventBus, kodex, kodexLink, sessionManager]);

  const navigate = useCallback(
    (path: string): void => {
      if (typeof window === 'undefined') return;
      window.history.pushState({}, '', path);
      setCurrentPath(path);
    },
    [],
  );

  useEffect(() => {
    const handlePopState = (): void => {
      setCurrentPath(typeof window !== 'undefined' ? window.location.pathname : '/');
    };
    const handleNavigate = ((event: Event): void => {
      const detail = (event as CustomEvent<{ path?: string }>).detail;
      if (detail?.path) {
        navigate(detail.path);
      }
    }) as EventListener;

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('sib:navigate', handleNavigate as EventListener);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('sib:navigate', handleNavigate as EventListener);
    };
  }, [navigate]);

  useEffect(() => {
    if (currentPath === '/fortress/spatial') {
      spatial.enterSpatialMode(spatial.supported ? spatial.mode : 'simulated');
    }
  }, [currentPath, spatial.enterSpatialMode, spatial.mode, spatial.supported]);

  const latestResult: CommandResult | undefined = history[0]?.result;
  const shellStyle: React.CSSProperties = useMemo(
    () => ({
      fontFamily: 'Inter, system-ui, sans-serif',
      background: theme.background,
      color: theme.text,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }),
    [theme.background, theme.text],
  );

  const mainLayout: React.CSSProperties = useMemo(
    () => ({
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: '16px',
      padding: '16px',
    }),
    [],
  );

  const headerStyle: React.CSSProperties = useMemo(
    () => ({
      padding: '16px',
      borderBottom: `1px solid ${theme.accentSoft}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }),
    [theme.accentSoft],
  );

  return (
    <div style={shellStyle}>
      <header style={headerStyle}>
        <div>
          <div style={{ fontWeight: 700, letterSpacing: '0.02em' }}>{config.appName}</div>
          <div style={{ color: theme.accent, fontSize: 12 }}>Session {sessionManager.sessionId}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => navigate('/fortress')}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(46,204,113,0.1)',
              color: '#ecf0f1',
              cursor: 'pointer',
            }}
          >
            Enter Fortress
          </button>
          <button
            type="button"
            onClick={() => {
              spatial.enterSpatialMode(spatial.supported ? 'xr-hinted' : 'simulated');
              navigate('/fortress/spatial');
            }}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(41, 128, 185, 0.15)',
              color: '#ecf0f1',
              cursor: 'pointer',
            }}
          >
            Spatial Mode
          </button>
          <div style={{ fontSize: 12, color: ready ? '#45a29e' : '#c5c6c7' }}>
            {ready ? 'Ready' : 'Booting manifest...'}
          </div>
        </div>
      </header>

      {currentPath === '/fortress' && (
        <div style={{ padding: 16 }}>
          <FortressShell mode="full" />
        </div>
      )}

      {currentPath === '/fortress/spatial' && (
        <div style={{ padding: 16 }}>
          <FortressSpatialShell />
        </div>
      )}

      {currentPath !== '/fortress' && currentPath !== '/fortress/spatial' && (
        <main style={mainLayout}>
          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Viewport entries={history} latestAudit={auditLog} />
            <Omnibar placeholder={config.omnibar.placeholder} disabled={!ready} context={commandContext} />
          </section>
          <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <TymePanel
              identity={identity}
              manifest={manifest}
              onRefreshIdentity={() => setIdentity(identityVault.getActiveIdentity())}
            />
            <HouseOfTymeRadial sessionId={sessionManager.sessionId} status={latestResult?.status ?? 'idle'} />
          </section>
        </main>
      )}
      <AutonomyHud />
    </div>
  );
};
