import React from 'react';
import { useSovereignTheme } from '../ui/SovereignTheme';

type Props = {
  error?: Error | null;
};

export const RecoveryShell: React.FC<Props> = ({ error }) => {
  const theme = useSovereignTheme();
  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '2rem',
        background: theme.background,
        color: theme.text,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '1.5rem 1.75rem',
          borderRadius: 16,
          background: theme.panel,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          border: `1px solid ${theme.accentSoft}`,
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Sovereign Interface Browser</h1>
        <p style={{ marginTop: '0.75rem', color: theme.textSoft }}>
          The primary interface encountered an issue and switched into recovery
          mode. Your node is still alive; this view simply exposes diagnostics.
        </p>

        {error && (
          <pre
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              borderRadius: 12,
              background: '#05060b',
              color: '#ffb4d0',
              fontSize: '0.75rem',
              overflowX: 'auto',
            }}
          >
            {error.stack || error.message}
          </pre>
        )}

        <div
          style={{
            marginTop: '1.5rem',
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 999,
              border: 'none',
              background: theme.accent,
              color: 'white',
              fontWeight: 500,
            }}
            onClick={() => window.location.reload()}
          >
            Reload SIB
          </button>
          <button
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 999,
              border: `1px solid ${theme.accentSoft}`,
              background: 'transparent',
              color: theme.textSoft,
              fontSize: '0.8rem',
            }}
            onClick={() => console.log('[SIB] Recovery diagnostics requested')}
          >
            View diagnostics in console
          </button>
        </div>
      </div>
    </div>
  );
};
