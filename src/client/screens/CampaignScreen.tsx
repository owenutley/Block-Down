import { useState, useEffect } from 'react';
import { trpc } from '../trpc';
import { GameBoard } from '../components/GameBoard';
import { convertPuzzleToLevelConfig } from '../utils/puzzle';

export const CampaignScreen = ({ onReturnToMenu }: { onReturnToMenu: () => void }) => {
  const [loading, setLoading] = useState(true);
  const [campaignData, setCampaignData] = useState<{ puzzles: any[], completedIds: string[] } | null>(null);
  const [activePuzzleIndex, setActivePuzzleIndex] = useState<number | null>(null);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const data = await trpc.campaign.get.query();
      setCampaignData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaign();
  }, []);

  const handleWin = async () => {
    if (activePuzzleIndex === null || !campaignData) return;
    const puzzle = campaignData.puzzles[activePuzzleIndex];
    if (puzzle && !campaignData.completedIds.includes(puzzle.id)) {
      try {
        await trpc.campaign.markCompleted.mutate(puzzle.id);
        // Refresh silently to update locks
        const data = await trpc.campaign.get.query();
        setCampaignData(data);
      } catch (e) {
        console.error('Failed to mark completed', e);
      }
    }
  };

  const handleNextLevel = () => {
    if (activePuzzleIndex === null || !campaignData) return;
    if (activePuzzleIndex + 1 < campaignData.puzzles.length) {
      setActivePuzzleIndex(activePuzzleIndex + 1);
    }
  };

  if (loading || !campaignData) {
    return <div className="flex min-h-screen items-center justify-center bg-mesh-gradient"><div className="text-white text-2xl font-bold animate-pulse">Loading Campaign...</div></div>;
  }

  if (activePuzzleIndex !== null) {
    const puzzle = campaignData.puzzles[activePuzzleIndex];
    const levelConfig = convertPuzzleToLevelConfig(puzzle);
    const hasNextLevel = activePuzzleIndex + 1 < campaignData.puzzles.length;

    return (
      <GameBoard
        levelConfig={levelConfig}
        difficulty={undefined}
        onReturnToMenu={() => setActivePuzzleIndex(null)}
        onWin={handleWin}
        hasNextLevel={hasNextLevel}
        onNextLevel={handleNextLevel}
      />
    );
  }

  return (
    <div className="min-h-screen bg-mesh-gradient text-white p-6 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-12 pt-8">
          <h1 className="text-5xl font-black neon-text-title tracking-tight">Campaign</h1>
          <button onClick={onReturnToMenu} className="px-6 py-3 bg-black/60 border border-purple-500 neon-purple text-purple-300 rounded-xl font-bold transition hover:scale-105">
            Back to Menu
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {campaignData.puzzles.map((puzzle, idx) => {
            const isFirst = idx === 0;
            const prevPuzzle = campaignData.puzzles[idx - 1];
            const isUnlocked = isFirst || (prevPuzzle && campaignData.completedIds.includes(prevPuzzle.id));
            const isCompleted = campaignData.completedIds.includes(puzzle.id);

            return (
              <button
                key={puzzle.id}
                disabled={!isUnlocked}
                onClick={() => setActivePuzzleIndex(idx)}
                className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center p-4 border-2 transition-all ${
                  isUnlocked 
                    ? isCompleted 
                      ? 'bg-green-900/40 border-green-500 neon-green hover:scale-105' 
                      : 'bg-blue-900/40 border-blue-400 neon-blue hover:scale-105'
                    : 'bg-gray-900/60 border-gray-700 opacity-60 cursor-not-allowed'
                }`}
              >
                <span className="text-3xl font-black mb-2 opacity-80">{idx + 1}</span>
                {isCompleted && <span className="absolute top-2 right-2 text-green-400 text-lg">✓</span>}
                {!isUnlocked && <span className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl text-4xl">🔒</span>}
              </button>
            );
          })}
        </div>
        
        {campaignData.puzzles.length === 0 && (
          <div className="text-center text-gray-400 py-12 text-xl">
            No campaign levels available yet. Add Easy/Medium/Hard puzzles in Admin!
          </div>
        )}
      </div>
    </div>
  );
};
