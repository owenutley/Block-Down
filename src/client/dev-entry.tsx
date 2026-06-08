import React from 'react';
import { createRoot } from 'react-dom/client';
import { DevPanel } from './dev';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <DevPanel />
  </React.StrictMode>
);
