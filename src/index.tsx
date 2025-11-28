import React from 'react';
import ReactDOM from 'react-dom/client';
import { ShellApp } from './app/ShellApp';
import { startVoiceNode } from './sib/core/voiceNode';
import { SovereignThemeProvider } from './sib/ui/SovereignTheme';
import { SpatialProvider } from './spatial/SpatialContext';

const root = document.getElementById('root');

if (root) {
  startVoiceNode();
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <SpatialProvider>
        <SovereignThemeProvider>
          <ShellApp />
        </SovereignThemeProvider>
      </SpatialProvider>
    </React.StrictMode>
  );
}
