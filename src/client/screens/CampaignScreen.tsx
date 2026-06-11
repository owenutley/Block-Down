import { useState, useEffect } from 'react';
import { trpc } from '../trpc';
import { GameBoard } from '../components/GameBoard';
import { convertPuzzleToLevelConfig } from '../utils/puzzle';
import { ThemeId, ThemeConfig, Theme, getThemeBgClass } from '../../shared/themes';
import { TrailId } from '../../shared/trails';
import { Puzzle } from '../../shared/types';

export const CampaignScreen = ({
  onReturnToMenu,
  refreshCurrency,
  activeTheme = 'neon',
  activeThemeStyle,
  themeConfig,
  activeTrail = 'none',
  purchasedThemes,
  themes,
  onEquipTheme,
}: {
  onReturnToMenu: () => void;
  refreshCurrency?: (() => void) | undefined;
  activeTheme?: ThemeId;
  activeThemeStyle?: Theme | undefined;
  themeConfig?: ThemeConfig | undefined;
  activeTrail?: TrailId;
  purchasedThemes?: ThemeId[] | undefined;
  themes?: Theme[] | undefined;
  onEquipTheme?: ((themeId: ThemeId) => Promise<unknown> | undefined) | undefined;
}) => {
  const [loading, setLoading] = useState(true);
  const [campaignData, setCampaignData] = useState<Awaited<ReturnType<typeof trpc.campaign.get.query>> | null>(null);
  const [activePuzzleIndex, setActivePuzzleIndex] = useState<number | null>(null);
  const [activePuzzle, setActivePuzzle] = useState<Puzzle | null>(null);
  const [loadingLevel, setLoadingLevel] = useState(false);

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
    void fetchCampaign();
  }, []);

  useEffect(() => {
    if (activePuzzleIndex === null || !campaignData) {
      setActivePuzzle(null);
      return;
    }
    const puzzleMeta = campaignData.puzzles[activePuzzleIndex];
    if (!puzzleMeta) return;

    let active = true;
    const loadLevel = async () => {
      try {
        setLoadingLevel(true);
        const data = await trpc.puzzle.getById.query(puzzleMeta.id);
        if (active && data) {
          setActivePuzzle(data);
        }
      } catch (e) {
        console.error('Failed to load level details:', e);
      } finally {
        if (active) {
          setLoadingLevel(false);
        }
      }
    };

    void loadLevel();
    return () => {
      active = false;
    };
  }, [activePuzzleIndex, campaignData]);

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
  const bgClass = getThemeBgClass(activeTheme, activeThemeStyle);

  if (loading || !campaignData) {
    return <div className={`flex min-h-screen items-center justify-center ${bgClass}`}><div className="text-white text-2xl font-bold animate-pulse">Loading Campaign...</div></div>;
  }

  if (activePuzzleIndex !== null) {
    const puzzleMeta = campaignData.puzzles[activePuzzleIndex];
    if (puzzleMeta) {
      if (loadingLevel || !activePuzzle) {
        return (
          <div className={`flex min-h-screen items-center justify-center ${bgClass}`}>
            <div className="text-white text-2xl font-bold animate-pulse">Loading Level...</div>
          </div>
        );
      }

      const levelConfig = convertPuzzleToLevelConfig(activePuzzle);
      const hasNextLevel = activePuzzleIndex + 1 < campaignData.puzzles.length;

      return (
        <GameBoard
          levelConfig={levelConfig}
          onReturnToMenu={() => {
            setActivePuzzleIndex(null);
            setActivePuzzle(null);
          }}
          onWin={handleWin}
          hasNextLevel={hasNextLevel}
          onNextLevel={handleNextLevel}
          puzzleId={activePuzzle.id}
          refreshCurrency={refreshCurrency}
          activeTheme={activeTheme}
          activeThemeStyle={activeThemeStyle}
          themeConfig={themeConfig}
          activeTrail={activeTrail}
          purchasedThemes={purchasedThemes}
          themes={themes}
          onEquipTheme={onEquipTheme}
        />
      );
    }
  }

  return (
    <>
      {/* Menu Button - Top Left */}
      <div className="fixed top-4 left-4 sm:left-6 z-50">
        <button
          onClick={onReturnToMenu}
          className="flex items-center justify-center bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)] hover:border-cyan-400/50 hover:scale-105 active:scale-95 transition-all text-white font-extrabold text-[11px] tracking-wide cursor-pointer select-none"
        >
          Menu
        </button>
      </div>

      <div className={`min-h-screen ${bgClass} text-white p-6 pb-20 transition-colors duration-500`}>
        <div className="max-w-4xl mx-auto relative pt-12">
          {/* Centered Title */}
          <div className="flex justify-center items-center mb-12">
            <h1 className="text-5xl font-black neon-text-title tracking-tight text-center">
              Campaign
            </h1>
          </div>

        <div className="grid grid-cols-5 gap-4">
          {campaignData.puzzles.map((puzzle, idx) => {
            const isFirst = idx === 0;
            const prevPuzzle = campaignData.puzzles[idx - 1];
            const isUnlocked = isFirst || (prevPuzzle && campaignData.completedIds.includes(prevPuzzle.id));
            const isCompleted = campaignData.completedIds.includes(puzzle.id);
            
            let btnClass = "";
            if (isCompleted) {
              btnClass = "border-2 border-red-500/80 bg-red-500/10 text-red-500 neon-red shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:scale-105 active:scale-95 duration-200 animate-pulse-glow";
            } else if (isUnlocked) {
              btnClass = "border border-zinc-700 bg-zinc-950/80 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 hover:scale-105 active:scale-95 duration-200";
            } else {
              btnClass = "border border-zinc-800 bg-zinc-950/30 text-zinc-700 cursor-not-allowed select-none opacity-50";
            }

            return (
              <button
                key={puzzle.id}
                disabled={!isUnlocked}
                onClick={() => setActivePuzzleIndex(idx)}
                className={`relative aspect-square rounded-2xl flex items-center justify-center font-black text-3xl transition-all ${btnClass}`}
              >
                <span>{idx + 1}</span>
                {!isUnlocked && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl text-xl backdrop-blur-[1px]">
                    🔒
                  </span>
                )}
              </button>
            );
          })}
        </div>
        
        {campaignData.puzzles.length === 0 && (
          <div className="text-center text-gray-400 py-12 text-xl">
            No campaign levels available yet. Add Easy/Medium/Hard puzzles in the Mod Panel!
          </div>
        )}
      </div>
    </div>
    </>
  );
};
