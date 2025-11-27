import React from 'react';
import ReactDOM from 'react-dom/client';
import { ShellApp } from './app/ShellApp';

const root = document.getElementById('root');

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ShellApp />
    </React.StrictMode>
  );
}
