import React from 'react';
import { IdentityProfile } from '../identity/IdentityVault';
import { SIOSManifest } from '../kodex/KodexTypes';

interface Props {
  identity: IdentityProfile;
  manifest: SIOSManifest | null;
  onRefreshIdentity: () => void;
}

export const TymePanel: React.FC<Props> = ({ identity, manifest, onRefreshIdentity }) => {
  return (
    <div style={{ background: '#0c1220', border: '1px solid #1f2833', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Tyme Panel</h3>
        <button
          onClick={onRefreshIdentity}
          style={{ background: 'transparent', color: '#66fcf1', border: '1px solid #1f2833', borderRadius: 6, padding: '4px 10px' }}
        >
          Refresh identity
        </button>
      </div>
      <div style={{ marginTop: 12, fontSize: 14, color: '#e8f1ff' }}>
        <div><strong>Handle:</strong> {identity.handle}</div>
        <div><strong>Persona:</strong> {identity.persona}</div>
        <div><strong>Identity ID:</strong> {identity.id}</div>
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 13, color: '#c5c6c7' }}>Manifest</div>
        {manifest ? (
          <div style={{ fontSize: 13 }}>
            <div><strong>{manifest.name}</strong> v{manifest.version}</div>
            <div style={{ color: '#c5c6c7' }}>{manifest.description}</div>
            <div style={{ marginTop: 6 }}>Ops: {manifest.operations.length}</div>
          </div>
        ) : (
          <div style={{ color: '#c5c6c7' }}>Loading manifest…</div>
        )}
      </div>
    </div>
  );
};
