import React from 'react';
import ReactDOM from 'react-dom/client';
import { ShellApp } from './app/ShellApp';
import { startVoiceNode } from './sib/core/voiceNode';
import { SovereignThemeProvider } from './sib/ui/SovereignTheme';

const root = document.getElementById('root');

if (root) {
  startVoiceNode();
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <SovereignThemeProvider>
        <ShellApp />
      </SovereignThemeProvider>
    </React.StrictMode>
  );
}
