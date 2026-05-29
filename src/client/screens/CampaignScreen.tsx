import { useState, useEffect } from 'react';
import { trpc } from '../trpc';
import { GameBoard } from '../components/GameBoard';
import { convertPuzzleToLevelConfig } from '../utils/puzzle';

export const CampaignScreen = ({ onReturnToMenu, refreshCurrency }: { onReturnToMenu: () => void; refreshCurrency?: (() => void) | undefined }) => {
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
        refreshCurrency?.();
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
        onReturnToMenu={() => setActivePuzzleIndex(null)}
        onWin={handleWin}
        hasNextLevel={hasNextLevel}
        onNextLevel={handleNextLevel}
        puzzleId={puzzle.id}
        refreshCurrency={refreshCurrency}
      />
    );
  }

  return (
    <div className="min-h-screen bg-mesh-gradient text-white p-6 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-6 sm:gap-0 mb-12 pt-8">
          <h1 className="text-5xl font-black neon-text-title tracking-tight text-center sm:text-left">Campaign</h1>
          <button onClick={onReturnToMenu} className="px-6 py-3 theme-btn rounded-xl font-bold">
            Back to Menu
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {campaignData.puzzles.map((puzzle, idx) => {
            const isFirst = idx === 0;
            const prevPuzzle = campaignData.puzzles[idx - 1];
            const isUnlocked = isFirst || (prevPuzzle && campaignData.completedIds.includes(prevPuzzle.id));
            const isCompleted = campaignData.completedIds.includes(puzzle.id);
            
            // Find stats for this puzzle
            const pStats = (campaignData as any).stats?.find((s: any) => s.puzzleId === puzzle.id);
            const winRate = pStats && pStats.totalAttempts > 0 
              ? Math.round((pStats.totalCompletions / pStats.totalAttempts) * 100) 
              : null;
            const record = pStats && pStats.bestScore > 0 ? pStats.bestScore : null;

            return (
              <button
                key={puzzle.id}
                disabled={!isUnlocked}
                onClick={() => setActivePuzzleIndex(idx)}
                className="relative aspect-square rounded-2xl flex flex-col items-center justify-center p-3 theme-btn transition-all group"
              >
                <span className="text-3xl font-black mb-1 opacity-90">{idx + 1}</span>
                <span className="text-[10px] text-white/60 font-semibold truncate max-w-full mb-1" title={puzzle.name}>{puzzle.name}</span>
                {isUnlocked && pStats && pStats.totalAttempts > 0 && (
                  <div className="text-[9px] text-white/50 flex flex-col items-center font-mono leading-tight">
                    {record && <span>Record: {record}m</span>}
                    {winRate !== null && <span>Clear: {winRate}%</span>}
                  </div>
                )}
                {isCompleted && <span className="absolute top-2 right-2 text-white text-lg font-bold">✓</span>}
                {!isUnlocked && <span className="absolute inset-0 flex items-center justify-center bg-black/45 rounded-2xl text-4xl backdrop-blur-[1px]">🔒</span>}
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
