import React, { useEffect, useMemo, useRef, useState } from 'react';
import { getKernelState, LogEntry } from '../core/autonomy/kernel';
import { useSovereignTheme } from '../sib/ui/SovereignTheme';

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

const relativeTime = (iso?: string): string => {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return 'just now';
  if (ms < 1000) return `${ms}ms ago`;
  return `${formatDuration(ms)} ago`;
};

export const AutonomyHud: React.FC = () => {
  const { theme } = useSovereignTheme();
  const [open, setOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [state, setState] = useState(() => getKernelState());
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setState(getKernelState()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && key === 'k') {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!open || paused) return;
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [open, paused, state.log]);

  const logEntries = useMemo<LogEntry[]>(() => state.log.slice(-50), [state.log]);
  const uptime = useMemo(() => formatDuration(Date.now() - state.startedAt.getTime()), [state.startedAt, state.commandCount]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 8,
      }}
    >
      <button
        onClick={() => setOpen((prev) => !prev)}
        style={{
          background: theme.panel,
          color: theme.text,
          border: `1px solid ${theme.accentSoft}`,
          borderRadius: 999,
          padding: '8px 12px',
          fontSize: 12,
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          cursor: 'pointer',
        }}
      >
        {open ? 'Hide Autonomy HUD' : 'Autonomy HUD'}
      </button>

      {open && (
        <div
          style={{
            width: 360,
            maxHeight: 340,
            background: theme.panel,
            color: theme.text,
            border: `1px solid ${theme.accentSoft}`,
            borderRadius: 14,
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${theme.accentSoft}` }}>
            <div style={{ fontSize: 12, color: theme.textSoft }}>Session</div>
            <div style={{ fontWeight: 700, letterSpacing: '0.02em' }}>{state.sessionId}</div>
            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <div style={{ fontSize: 12, color: theme.textSoft }}>Uptime</div>
                <div style={{ fontWeight: 600 }}>{uptime}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: theme.textSoft }}>Commands</div>
                <div style={{ fontWeight: 600 }}>{state.commandCount}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: theme.textSoft }}>Last command</div>
                <div style={{ fontWeight: 600 }}>{state.lastCommand?.id ?? '—'}</div>
                <div style={{ fontSize: 12, color: theme.textSoft }}>{relativeTime(state.lastCommand?.at)}</div>
              </div>
            </div>
          </div>

          <div style={{ padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Recent activity</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <input type="checkbox" checked={paused} onChange={(e) => setPaused(e.target.checked)} /> Pause scrolling
            </label>
          </div>

          <div
            ref={logContainerRef}
            style={{
              maxHeight: 200,
              overflowY: 'auto',
              borderTop: `1px solid ${theme.accentSoft}`,
              borderBottom: `1px solid ${theme.accentSoft}`,
              padding: '8px 14px',
              background: 'rgba(0,0,0,0.15)',
            }}
          >
            {logEntries.length === 0 && <div style={{ color: theme.textSoft, fontSize: 12 }}>No log entries yet.</div>}
            {logEntries.map((entry, idx) => (
              <div key={`${entry.timestamp}-${idx}`} style={{ padding: '4px 0', fontSize: 12 }}>
                <span style={{ color: theme.textSoft }}>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                <span style={{ marginLeft: 8, fontWeight: 600, color: theme.accent }}>{entry.source}</span>
                <span style={{ marginLeft: 8 }}>{entry.message}</span>
              </div>
            ))}
          </div>

          <div style={{ padding: '10px 14px', fontSize: 12, color: theme.textSoft }}>
            Shortcut: Ctrl/Cmd + Shift + K
          </div>
        </div>
      )}
    </div>
  );
};
