import React from 'react';
import { createRoot } from 'react-dom/client';
import { Admin } from './admin';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <Admin />
  </React.StrictMode>
);
