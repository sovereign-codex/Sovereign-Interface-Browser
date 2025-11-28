import React from 'react';
import { useSpatial } from './SpatialContext';

type SpatialAnchor = 'center' | 'left' | 'right' | 'top' | 'bottom';

interface SpatialPaneProps {
  id: string;
  title?: string;
  anchor?: SpatialAnchor;
  children: React.ReactNode;
}

export const SpatialPane: React.FC<SpatialPaneProps> = ({ id, title, anchor = 'center', children }) => {
  const spatial = useSpatial();

  if (!spatial.active) {
    return <div style={{ width: '100%' }}>{children}</div>;
  }

  return (
    <div
      data-spatial-pane-id={id}
      data-spatial-anchor={anchor}
      style={{
        border: '1px dashed rgba(255,255,255,0.25)',
        borderRadius: 16,
        padding: 12,
        background: 'rgba(46, 204, 113, 0.06)',
        boxShadow: '0 12px 35px rgba(0,0,0,0.25)',
        backdropFilter: 'blur(6px)',
      }}
    >
      {title && <div style={{ fontWeight: 700, marginBottom: 8, color: '#1dd1a1' }}>{title}</div>}
      <div>{children}</div>
    </div>
  );
};
