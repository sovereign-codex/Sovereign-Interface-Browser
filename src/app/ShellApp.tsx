import React, { useEffect, useMemo, useState } from 'react';
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

const shellStyle: React.CSSProperties = {
  fontFamily: 'Inter, system-ui, sans-serif',
  background: '#0b0c10',
  color: '#e8f1ff',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column'
};

const mainLayout: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gap: '16px',
  padding: '16px'
};

const headerStyle: React.CSSProperties = {
  padding: '16px',
  borderBottom: '1px solid #1f2833',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

export const ShellApp: React.FC = () => {
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

  const router = useMemo(() => new CommandRouter(kodex, avot, guardian, sessionManager, eventBus), [avot, eventBus, guardian, kodex, sessionManager]);

  useEffect(() => {
    const unsubscribers = [
      eventBus.on('result', ({ entry }) => setHistory(sessionManager.getHistory())),
      eventBus.on('audit', ({ audit }) => setAuditLog(audit))
    ];

    const init = async (): Promise<void> => {
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

  const handleCommand = async (command: string): Promise<void> => {
    if (!command.trim()) return;
    await router.handleCommand(command);
  };

  const latestResult: CommandResult | undefined = history[0]?.result;

  return (
    <div style={shellStyle}>
      <header style={headerStyle}>
        <div>
          <div style={{ fontWeight: 700, letterSpacing: '0.02em' }}>{config.appName}</div>
          <div style={{ color: '#66fcf1', fontSize: 12 }}>Session {sessionManager.sessionId}</div>
        </div>
        <div style={{ fontSize: 12, color: ready ? '#45a29e' : '#c5c6c7' }}>{ready ? 'Ready' : 'Booting manifest...'}</div>
      </header>

      <main style={mainLayout}>
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Viewport entries={history} latestAudit={auditLog} />
          <Omnibar placeholder={config.omnibar.placeholder} disabled={!ready} onSubmit={handleCommand} />
        </section>
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <TymePanel identity={identity} manifest={manifest} onRefreshIdentity={() => setIdentity(identityVault.getActiveIdentity())} />
          <HouseOfTymeRadial sessionId={sessionManager.sessionId} status={latestResult?.status ?? 'idle'} />
        </section>
      </main>
    </div>
  );
};
