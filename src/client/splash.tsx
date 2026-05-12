import './index.css';

import { navigateTo } from '@devvit/web/client';
import { context, requestExpandedMode } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

export const Splash = () => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-4 bg-white dark:bg-gray-900 px-4 py-6">
      <h1 className="text-center text-4xl font-black text-gray-900 dark:text-white mb-4">
        Block Down
      </h1>

      <div className="w-full max-w-xs">
        <div className="grid grid-cols-4 gap-2 mb-6">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"
            />
          ))}
        </div>
      </div>

      <button
        className="flex h-12 w-auto cursor-pointer items-center justify-center rounded-full bg-[#d93900] px-8 text-lg font-semibold text-white transition-colors hover:bg-[#c23300] dark:bg-orange-600 dark:hover:bg-orange-700"
        onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
      >
        Tap to Play
      </button>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
