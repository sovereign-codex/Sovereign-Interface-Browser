import React from 'react';

interface Props {
  sessionId: string;
  status: string;
}

const statusColor: Record<string, string> = {
  ok: '#45a29e',
  blocked: '#ff6b6b',
  error: '#ff6b6b',
  idle: '#c5c6c7'
};

export const HouseOfTymeRadial: React.FC<Props> = ({ sessionId, status }) => {
  const color = statusColor[status] ?? '#66fcf1';
  return (
    <div
      style={{
        background: '#0c1220',
        border: '1px solid #1f2833',
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 16
      }}
    >
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: '50%',
          border: `6px solid ${color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 18px ${color}44`
        }}
      >
        <div style={{ fontWeight: 700, color }}>{status.toUpperCase()}</div>
      </div>
      <div>
        <div style={{ fontSize: 14, color: '#c5c6c7' }}>House of Tyme Radial</div>
        <div style={{ fontSize: 12, color: '#e8f1ff' }}>Session {sessionId}</div>
        <div style={{ fontSize: 12, color: '#c5c6c7' }}>Reflects the last command status.</div>
      </div>
    </div>
  );
};
