import './index.css';

import { StrictMode, useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';

type GameDifficulty = 'tutorial' | 'daily' | 'easy' | 'medium' | 'hard';

const GRID_SIZE = 11;
const CENTER = Math.floor(GRID_SIZE / 2);

const Menu = ({ onSelectDifficulty }: { onSelectDifficulty: (difficulty: GameDifficulty) => void }) => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 bg-white dark:bg-gray-900 px-4">
      <h1 className="text-center text-5xl font-black text-gray-900 dark:text-white">
        Block Down
      </h1>

      <div className="flex w-full max-w-sm flex-col gap-4">
        <button
          onClick={() => onSelectDifficulty('tutorial')}
          className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-lg font-bold text-white transition-all hover:from-blue-600 hover:to-blue-700 active:scale-95"
        >
          📚 Tutorial
        </button>
        <button
          onClick={() => onSelectDifficulty('daily')}
          className="rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 text-lg font-bold text-white transition-all hover:from-purple-600 hover:to-purple-700 active:scale-95"
        >
          🎯 Daily Puzzle
        </button>
        <button
          onClick={() => onSelectDifficulty('easy')}
          className="rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 text-lg font-bold text-white transition-all hover:from-green-600 hover:to-green-700 active:scale-95"
        >
          🟢 Easy Puzzle
        </button>
        <button
          onClick={() => onSelectDifficulty('medium')}
          className="rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-4 text-lg font-bold text-white transition-all hover:from-yellow-600 hover:to-yellow-700 active:scale-95"
        >
          🟡 Medium Puzzle
        </button>
        <button
          onClick={() => onSelectDifficulty('hard')}
          className="rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 text-lg font-bold text-white transition-all hover:from-red-600 hover:to-red-700 active:scale-95"
        >
          🔴 Hard Puzzle
        </button>
      </div>
    </div>
  );
};

const GameBoard = ({ difficulty, onReturnToMenu, onReset }: { difficulty: GameDifficulty; onReturnToMenu: () => void; onReset: () => void }) => {
  const [playerPos, setPlayerPos] = useState({ x: CENTER, y: CENTER });
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const difficultyLabels: Record<GameDifficulty, string> = {
    tutorial: '📚 Tutorial',
    daily: '🎯 Daily Puzzle',
    easy: '🟢 Easy Puzzles',
    medium: '🟡 Medium Puzzle',
    hard: '🔴 Hard Puzzles',
  };

  const movePlayer = (dx: number, dy: number) => {
    setPlayerPos((prev) => ({
      x: Math.max(0, Math.min(GRID_SIZE - 1, prev.x + dx)),
      y: Math.max(0, Math.min(GRID_SIZE - 1, prev.y + dy)),
    }));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          movePlayer(0, -1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          movePlayer(0, 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          movePlayer(-1, 0);
          break;
        case 'ArrowRight':
          e.preventDefault();
          movePlayer(1, 0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;

    const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    const dx = touchEnd.x - touchStartPos.current.x;
    const dy = touchEnd.y - touchStartPos.current.y;
    const threshold = 30;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > threshold) {
        movePlayer(dx > 0 ? 1 : -1, 0);
      }
    } else {
      if (Math.abs(dy) > threshold) {
        movePlayer(0, dy > 0 ? 1 : -1);
      }
    }

    touchStartPos.current = null;
  };

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-900 px-2 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{difficultyLabels[difficulty]}</h1>
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={onReset}
            className="rounded-lg bg-blue-500 px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold text-white transition-all hover:bg-blue-600 active:scale-95"
          >
            Reset
          </button>
          <button
            onClick={onReturnToMenu}
            className="rounded-lg bg-gray-500 px-3 sm:px-4 py-2 text-sm sm:text-base font-semibold text-white transition-all hover:bg-gray-600 active:scale-95"
          >
            Menu
          </button>
        </div>
      </div>

      <div
        className="flex-1 flex items-center justify-center w-full overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="border-4 border-gray-900 dark:border-white bg-gray-100 dark:bg-gray-800 p-1 sm:p-2"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, 
            gap: '1px',
            maxWidth: '100vw',
            maxHeight: '100vh',
            width: 'fit-content',
            aspectRatio: '1'
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);
            const isPlayer = x === playerPos.x && y === playerPos.y;

            return (
              <div
                key={i}
                className={`aspect-square w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-sm border border-gray-300 dark:border-gray-600 flex items-center justify-center text-lg sm:text-2xl ${
                  isPlayer
                    ? 'bg-blue-500 text-white font-bold'
                    : 'bg-white dark:bg-gray-700'
                }`}
              >
                {isPlayer && '🟦'}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const App = () => {
  const [currentScreen, setCurrentScreen] = useState<{ type: 'menu' } | { type: 'game'; difficulty: GameDifficulty }>({ type: 'menu' });

  const handleSelectDifficulty = (difficulty: GameDifficulty) => {
    setCurrentScreen({ type: 'game', difficulty });
  };

  const handleReturnToMenu = () => {
    setCurrentScreen({ type: 'menu' });
  };

  const handleReset = () => {
    if (currentScreen.type === 'game') {
      setCurrentScreen({ type: 'game', difficulty: currentScreen.difficulty });
    }
  };

  return (
    <>
      {currentScreen.type === 'menu' ? (
        <Menu onSelectDifficulty={handleSelectDifficulty} />
      ) : (
        <GameBoard difficulty={currentScreen.difficulty} onReturnToMenu={handleReturnToMenu} onReset={handleReset} />
      )}
    </>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
