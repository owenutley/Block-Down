import { useState, useEffect, useMemo, useCallback } from 'react';
import { trpc } from '../trpc';
import { GameBoard } from '../components/GameBoard';
import { convertPuzzleToLevelConfig } from '../utils/puzzle';
import { setMusicTheme } from '../utils/bgm';
import { ThemeId, ThemeConfig, Theme, getThemeBgClass, GameCharacter } from '../../shared/themes';
import { TrailId } from '../../shared/trails';
import { Puzzle } from '../../shared/types';
import { LightWhispIcon } from '../components/LightWhispIcon';
import { SplashLoader } from '../components/SplashLoader';
import { StoryDialogueModal } from '../components/StoryDialogueModal';
import {
  StoryProgress,
  STORY_CHAPTERS,
  StoryDialogue,
  getChamberDoorCoordinates,
} from '../../shared/story';

export type StoryScreenProps = {
  onReturnToMenu: () => void;
  refreshCurrency?: (() => void) | undefined;
  activeTheme?: ThemeId;
  activeThemeStyle?: Theme | undefined;
  themeConfig?: ThemeConfig | undefined;
  activeTrail?: TrailId;
  purchasedThemes?: ThemeId[] | undefined;
  themes?: Theme[] | undefined;
  onEquipTheme?: ((themeId: ThemeId) => Promise<unknown> | undefined) | undefined;
  activeCharacter?: string;
  purchasedCharacters?: string[];
  onEquipCharacter?: ((characterId: string) => Promise<unknown> | undefined) | undefined;
  characters?: GameCharacter[];
  purchasedTrails?: TrailId[];
  onEquipTrail?: ((trailId: TrailId) => Promise<unknown> | undefined) | undefined;
  streak?: number;
  currency?: number;
  onGameStateChange?: ((isGameActive: boolean) => void) | undefined;
};

export const StoryScreen = ({
  onReturnToMenu,
  refreshCurrency,
  activeTheme = 'neon',
  activeThemeStyle,
  themeConfig,
  activeTrail = 'none',
  purchasedThemes,
  themes,
  onEquipTheme,
  activeCharacter = 'neon',
  purchasedCharacters = ['neon'],
  onEquipCharacter,
  characters = [],
  purchasedTrails,
  onEquipTrail,
  streak = 0,
  currency = 0,
  onGameStateChange,
}: StoryScreenProps) => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<StoryProgress | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number>(1);
  const [activeChamber, setActiveChamber] = useState<{ chapter: number; chamber: number } | null>(null);
  const [activePuzzle, setActivePuzzle] = useState<Puzzle | null>(null);
  const [activeDialogue, setActiveDialogue] = useState<StoryDialogue | null>(null);
  const [loadingChamber, setLoadingChamber] = useState(false);
  const [unlockedRewardModal, setUnlockedRewardModal] = useState<{ id: string; name: string; type: string } | null>(null);

  useEffect(() => {
    onGameStateChange?.(activeChamber !== null);
  }, [activeChamber, onGameStateChange]);

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      const data = await trpc.story.getProgress.query();
      setProgress(data);
      setSelectedChapter(data.currentChapter || 1);
    } catch (err) {
      console.error('Failed to load story progress:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProgress();
  }, [fetchProgress]);

  const currentChapterConfig = useMemo(() => {
    return STORY_CHAPTERS.find((c) => c.chapterNumber === selectedChapter) || STORY_CHAPTERS[0]!;
  }, [selectedChapter]);

  useEffect(() => {
    if (activeChamber) {
      const chapterMeta = STORY_CHAPTERS.find((c) => c.chapterNumber === activeChamber.chapter);
      if (chapterMeta) {
        setMusicTheme(chapterMeta.themeId);
      }
    } else if (activeTheme) {
      setMusicTheme(activeTheme);
    }
  }, [activeChamber, activeTheme]);

  const loadChamber = useCallback(async (chapter: number, chamber: number) => {
    try {
      setLoadingChamber(true);
      const res = await trpc.story.getChamber.query({ chapter, chamber });
      setActivePuzzle(res.puzzle);
      setActiveChamber({ chapter, chamber });
      if (res.dialogue) {
        setActiveDialogue(res.dialogue);
      }
    } catch (err) {
      console.error('Failed to load story chamber:', err);
    } finally {
      setLoadingChamber(false);
    }
  }, []);

  const handleChamberComplete = async () => {
    if (!activeChamber || !activePuzzle) return;

    try {
      const res = await trpc.story.completeChamber.mutate({
        chapter: activeChamber.chapter,
        chamber: activeChamber.chamber,
        stars: 3,
      });

      setProgress(res.progress);
      refreshCurrency?.();

      if (res.newReward) {
        setUnlockedRewardModal(res.newReward);
      }

      // If next chamber exists, load it directly for seamless progression!
      if (activeChamber.chamber < 10) {
        await loadChamber(activeChamber.chapter, activeChamber.chamber + 1);
      } else if (activeChamber.chapter < 4) {
        await loadChamber(activeChamber.chapter + 1, 1);
      } else {
        // Final chapter complete!
        setActiveChamber(null);
        setActivePuzzle(null);
      }
    } catch (err) {
      console.error('Failed to record chamber completion:', err);
    }
  };

  const levelConfig = useMemo(() => {
    if (!activePuzzle) return null;
    const config = convertPuzzleToLevelConfig(activePuzzle);
    // Explicitly enforce bottom doorway spawn
    const { bottomSpawnPos } = getChamberDoorCoordinates(activePuzzle.width);
    return {
      ...config,
      startPos: bottomSpawnPos,
    };
  }, [activePuzzle]);

  const bgClass = activeThemeStyle?.bgGradient || getThemeBgClass(activeTheme);

  // In-Game Chamber View
  if (activeChamber && levelConfig && activePuzzle) {
    return (
      <>
        <GameBoard
          levelConfig={levelConfig}
          isStoryMode={true}
          storyChapter={activeChamber.chapter}
          storyChamber={activeChamber.chamber}
          title={`Chapter ${activeChamber.chapter} · Chamber ${activeChamber.chamber}`}
          onReturnToMenu={() => {
            setActiveChamber(null);
            setActivePuzzle(null);
            void fetchProgress();
          }}
          onChamberComplete={handleChamberComplete}
          puzzleId={activePuzzle.id}
          refreshCurrency={refreshCurrency}
          activeTheme={currentChapterConfig.themeId}
          themeConfig={themeConfig}
          activeThemeStyle={activeThemeStyle}
          activeTrail={activeTrail}
          purchasedThemes={purchasedThemes}
          themes={themes}
          onEquipTheme={onEquipTheme}
          activeCharacter={activeCharacter}
          purchasedCharacters={purchasedCharacters}
          onEquipCharacter={onEquipCharacter}
          characters={characters}
          purchasedTrails={purchasedTrails}
          onEquipTrail={onEquipTrail}
          streak={streak}
          currency={currency}
          isCampaign={true}
        />

        {activeDialogue && (
          <StoryDialogueModal
            dialogue={activeDialogue}
            onClose={() => setActiveDialogue(null)}
          />
        )}
      </>
    );
  }

  // Chamber Loading Screen
  if (loadingChamber) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${bgClass} px-4 select-none`}>
        <SplashLoader
          statusMessages={[
            'SYNCHRONIZING CONDUIT TOPOLOGY...',
            'UNSEALING CHAMBER GATEWAY...',
            'POWERING ELEMENTAL MATRICES...',
            'TRANSMITTING NARRATIVE LOGS...',
          ]}
        />
      </div>
    );
  }

  // Main Story Mode Hub & Chapter Map
  return (
    <div className={`flex flex-col h-screen ${bgClass} text-white select-none p-2 sm:p-4 overflow-hidden`}>
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 max-w-5xl mx-auto w-full mb-3 shrink-0">
        <button
          onClick={onReturnToMenu}
          className="rounded-xl px-3 py-1.5 text-xs font-bold bg-zinc-900/80 border border-white/10 hover:border-cyan-400/50 text-white backdrop-blur-md shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <svg className="w-4 h-4 text-zinc-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Main Menu</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-black/60 border border-cyan-500/35 px-3 py-1 rounded-xl backdrop-blur-md shadow-[0_0_12px_rgba(6,182,212,0.15)]">
            <LightWhispIcon className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="text-cyan-300 font-mono font-bold text-xs sm:text-sm">
              {currency.toLocaleString()} Whisps
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full min-h-0 bg-black/50 border border-white/10 rounded-3xl p-3 sm:p-6 backdrop-blur-xl shadow-2xl overflow-y-auto no-scrollbar">
        {loading || !progress ? (
          <div className="flex-1 flex items-center justify-center">
            <SplashLoader statusMessages={['READING LATTICE ARCHIVES...', 'INITIALIZING STORY PROGRESS...']} />
          </div>
        ) : (
          <div className="flex flex-col gap-4 flex-1">
            {/* Story Banner Hero */}
            <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 bg-gradient-to-r from-cyan-950/80 via-slate-900/90 to-purple-950/80 p-4 sm:p-6 shadow-[0_0_25px_rgba(6,182,212,0.2)] text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-black uppercase tracking-widest text-cyan-400 bg-cyan-950/90 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                    EPISODIC CAMPAIGN
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    Chapter {progress.currentChapter} · Chamber {progress.currentChamber}/10
                  </span>
                </div>
                <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                  The Resonance Chronicles
                </h1>
                <p className="text-xs sm:text-sm text-zinc-300 max-w-xl mt-1 leading-relaxed">
                  Solve chambers, unseal top gateways, and step through to restore the fractured Lattice.
                </p>
              </div>

              {/* Big Continue Expedition Button */}
              <button
                onClick={() => loadChamber(progress.currentChapter, progress.currentChamber)}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-black text-sm tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2.5 shrink-0 self-stretch md:self-auto justify-center"
              >
                <span>CONTINUE EXPEDITION</span>
                <svg className="w-5 h-5 shrink-0 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>

            {/* Chapter Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
              {STORY_CHAPTERS.map((ch) => {
                const isSelected = selectedChapter === ch.chapterNumber;
                const isUnlocked = ch.chapterNumber <= progress.currentChapter;

                return (
                  <button
                    key={ch.chapterNumber}
                    onClick={() => isUnlocked && setSelectedChapter(ch.chapterNumber)}
                    disabled={!isUnlocked}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-0.5 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                      isSelected
                        ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                        : 'bg-zinc-900/60 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] font-mono font-bold uppercase text-cyan-400">
                        Ch. {ch.chapterNumber}
                      </span>
                      {!isUnlocked && (
                        <svg className="w-3 h-3 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xs font-bold truncate text-white">{ch.title}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Chapter Details & Chambers Grid */}
            <div className="flex flex-col gap-3 flex-1 text-left">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">{currentChapterConfig.title}</h3>
                  <p className="text-xs text-zinc-400">{currentChapterConfig.description}</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-mono font-bold text-cyan-300">
                    {progress.completedChambers.filter((k) => k.startsWith(`ch${selectedChapter}_`)).length} / 10 Conduits
                  </span>
                </div>
              </div>

              {/* Chambers Grid (10 Chambers per chapter) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 flex-1">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((chamberNum) => {
                  const chamberKey = `ch${selectedChapter}_${chamberNum}`;
                  const isCompleted = progress.completedChambers.includes(chamberKey);
                  const isCurrent =
                    progress.currentChapter === selectedChapter && progress.currentChamber === chamberNum;
                  const isAccessible =
                    selectedChapter < progress.currentChapter ||
                    (selectedChapter === progress.currentChapter && chamberNum <= progress.currentChamber);
                  const stars = progress.chamberStars[chamberKey] || 0;

                  return (
                    <button
                      key={chamberNum}
                      onClick={() => isAccessible && loadChamber(selectedChapter, chamberNum)}
                      disabled={!isAccessible}
                      className={`p-3.5 rounded-2xl border transition-all text-left flex flex-col justify-between min-h-[90px] relative overflow-hidden group cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                        isCurrent
                          ? 'bg-cyan-950/70 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:scale-102'
                          : isCompleted
                          ? 'bg-zinc-900/80 border-emerald-500/40 hover:border-emerald-400'
                          : 'bg-zinc-950/60 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-mono font-bold text-zinc-300">
                          Chamber {chamberNum}
                        </span>
                        {isCompleted ? (
                          <div className="flex items-center gap-0.5 text-amber-400 text-xs">
                            {'★'.repeat(stars || 3)}
                          </div>
                        ) : !isAccessible ? (
                          <svg className="w-3.5 h-3.5 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        ) : null}
                      </div>

                      <div className="mt-2">
                        {isCurrent ? (
                          <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-500/40 animate-pulse">
                            ACTIVE
                          </span>
                        ) : isCompleted ? (
                          <span className="text-[10px] font-mono font-bold text-emerald-400">
                            RESONATED
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-zinc-500">LOCKED</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Chapter Milestone Reward Preview Banner */}
              <div className="w-full bg-slate-900/60 border border-cyan-500/30 rounded-2xl p-3 sm:p-4 mt-2 backdrop-blur-md flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] font-mono font-black uppercase text-cyan-400 tracking-wider">
                    CHAPTER {selectedChapter} MILESTONE REWARD
                  </span>
                  <h4 className="text-sm sm:text-base font-black text-white mt-0.5">
                    {currentChapterConfig.chapterReward.name}
                  </h4>
                  <p className="text-xs text-zinc-400">{currentChapterConfig.chapterReward.description}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Unlocked Reward Modal */}
      {unlockedRewardModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-md bg-zinc-950 border-2 border-amber-400/80 rounded-3xl p-6 text-center shadow-[0_0_50px_rgba(251,191,36,0.4)] flex flex-col items-center gap-3">
            <span className="text-xs font-mono font-bold tracking-widest text-amber-300 uppercase">
              CHAPTER MILESTONE REACHED
            </span>
            <h3 className="text-2xl font-black text-white">{unlockedRewardModal.name}</h3>
            <p className="text-xs text-zinc-300">
              Congratulations! This item has been unlocked and added to your wardrobe and shop collection.
            </p>
            <button
              onClick={() => setUnlockedRewardModal(null)}
              className="mt-3 px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-sm tracking-wide shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              CLAIM REWARD
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
