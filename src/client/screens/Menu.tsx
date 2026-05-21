import { useState, useEffect } from 'react';
import { trpc } from '../trpc';
import { GameDifficulty } from '../types';

export const Menu = ({ onSelectDifficulty, onSelectCampaign, onSelectPastPuzzles, onSelectAdmin }: { onSelectDifficulty: (difficulty: GameDifficulty) => void; onSelectCampaign?: () => void; onSelectPastPuzzles?: () => void; onSelectAdmin?: () => void }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const result = await trpc.admin.checkAuth.query();
        setIsAdmin(result.isAdmin);
      } catch (error) {
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 bg-mesh-gradient px-4">
      <h1 className="text-center text-6xl font-black neon-text-title tracking-tight">
        Block Down
      </h1>

      <div className="flex w-full max-w-sm flex-col gap-4">
        {[
          { id: 'tutorial', label: 'Tutorial', color: 'border-blue-500 neon-blue text-blue-300' },
          { id: 'daily', label: 'Daily Puzzle', color: 'border-purple-500 neon-purple text-purple-300' },
          { id: 'campaign', label: 'Campaign Mode', color: 'border-cyan-500 neon-cyan text-cyan-300' },
          { id: 'past-puzzles', label: 'Past Puzzles', color: 'border-pink-500 neon-pink text-pink-300' },
        ].map(btn => (
          <button
            key={btn.id}
            onClick={() => {
              if (btn.id === 'campaign') onSelectCampaign?.();
              else if (btn.id === 'past-puzzles') onSelectPastPuzzles?.();
              else onSelectDifficulty(btn.id as GameDifficulty);
            }}
            className={`rounded-2xl bg-black/60 border ${btn.color} px-6 py-4 text-xl font-bold transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Admin Button - Top Right */}
      {!checkingAdmin && isAdmin && (
        <div className="absolute top-6 right-6">
          <button
            onClick={() => onSelectAdmin?.()}
            className="px-4 py-2 bg-black/60 border border-orange-500 neon-orange text-orange-300 rounded-lg font-bold text-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            title="Admin Panel"
          >
            <span>🔑</span>
            <span>Admin</span>
          </button>
        </div>
      )}

    </div>
  );
};
