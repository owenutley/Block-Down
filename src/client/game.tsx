import './index.css';

import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Admin } from './admin';

import { GameDifficulty } from './types';
import { Menu } from './screens/Menu';
import { GameContainer } from './screens/GameContainer';
import { CampaignScreen } from './screens/CampaignScreen';
import { PastPuzzlesScreen } from './screens/PastPuzzlesScreen';

export const App = () => {
  const isMenuEntry = typeof window !== 'undefined' && window.location.pathname.includes('menu.html');
  const [currentScreen, setCurrentScreen] = useState<{ type: 'menu' } | { type: 'game'; difficulty: GameDifficulty } | { type: 'campaign' } | { type: 'past-puzzles' } | { type: 'admin' }>(
    isMenuEntry ? { type: 'menu' } : { type: 'game', difficulty: 'daily' }
  );

  const handleSelectDifficulty = (difficulty: GameDifficulty) => {
    setCurrentScreen({ type: 'game', difficulty });
  };

  const handleReturnToMenu = () => {
    setCurrentScreen({ type: 'menu' });
  };

  const handleSelectAdmin = () => {
    setCurrentScreen({ type: 'admin' });
  };

  return (
    <>
      {currentScreen.type === 'menu' ? (
        <Menu 
          onSelectDifficulty={handleSelectDifficulty} 
          onSelectCampaign={() => setCurrentScreen({ type: 'campaign' })} 
          onSelectPastPuzzles={() => setCurrentScreen({ type: 'past-puzzles' })}
          onSelectAdmin={handleSelectAdmin} 
        />
      ) : currentScreen.type === 'admin' ? (
        <div className="relative min-h-screen">
          <button
            onClick={handleReturnToMenu}
            className="absolute top-4 left-4 z-50 px-4 py-2 bg-black/60 border border-white/20 text-white rounded-lg font-bold text-sm transition-all hover:scale-105 active:scale-95"
          >
            ← Back to Menu
          </button>
          <Admin />
        </div>
      ) : currentScreen.type === 'campaign' ? (
        <CampaignScreen onReturnToMenu={handleReturnToMenu} />
      ) : currentScreen.type === 'past-puzzles' ? (
        <PastPuzzlesScreen onReturnToMenu={handleReturnToMenu} />
      ) : (
        <GameContainer difficulty={currentScreen.difficulty} onReturnToMenu={handleReturnToMenu} />
      )}
    </>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
