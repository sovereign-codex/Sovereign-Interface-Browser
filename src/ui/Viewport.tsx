import React from 'react';
import { SessionEntry } from '../core/SessionManager';
import { GuardianAudit } from '../kodex/KodexTypes';

interface Props {
  entries: SessionEntry[];
  latestAudit: GuardianAudit | null;
}

const badgeColor: Record<string, string> = {
  ok: '#45a29e',
  error: '#ff6b6b',
  blocked: '#ff6b6b',
  idle: '#c5c6c7'
};

export const Viewport: React.FC<Props> = ({ entries, latestAudit }) => {
  return (
    <div
      style={{
        background: '#0c1220',
        border: '1px solid #1f2833',
        borderRadius: 12,
        padding: 16,
        minHeight: 280,
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Viewport</h3>
        {latestAudit ? (
          <span style={{ fontSize: 12, color: latestAudit.decision === 'block' ? '#ff6b6b' : '#66fcf1' }}>
            Guardian: {latestAudit.decision} — {latestAudit.reason}
          </span>
        ) : null}
      </div>
      {entries.length === 0 && <div style={{ color: '#c5c6c7' }}>No commands yet. Try "ping" or "/manifest.echo".</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {entries.map((entry) => (
          <div key={entry.id} style={{ padding: 12, background: '#0f1626', borderRadius: 8, border: '1px solid #1f2833' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: badgeColor[entry.result.status] ?? '#c5c6c7',
                  color: '#0b0c10',
                  fontSize: 12,
                  fontWeight: 700
                }}
              >
                {entry.result.status.toUpperCase()}
              </span>
              <span style={{ color: '#66fcf1', fontFamily: 'mono', fontSize: 13 }}>{entry.command}</span>
            </div>
            <div style={{ marginTop: 6, color: '#e8f1ff' }}>{entry.result.message}</div>
            {entry.result.auditTrail && entry.result.auditTrail.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 12, color: '#c5c6c7' }}>
                Audit: {entry.result.auditTrail.join(' • ')}
              </div>
            )}
            {entry.result.data && (
              <pre
                style={{
                  marginTop: 8,
                  background: '#0c1220',
                  padding: 10,
                  borderRadius: 6,
                  overflow: 'auto',
                  fontSize: 12
                }}
              >
                {JSON.stringify(entry.result.data, null, 2)}
              </pre>
            )}
            <div style={{ fontSize: 11, color: '#c5c6c7', marginTop: 4 }}>{new Date(entry.createdAt).toLocaleTimeString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
