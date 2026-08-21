import { useState, useEffect, useRef, type TouchEvent } from 'react';
import { LevelConfig, GameDifficulty, Position, BlockData } from '../types';
import { playSlideSound, playThudSound, playMatchSound, playWinMelody, getMuted, setMuted } from '../utils/audio';
import { calculateParPushes, calculateStars } from '../utils/puzzle';
import { showToast } from '@devvit/web/client';
import { trpc } from '../trpc';
import { ThemeId, ThemeConfig, getBaseThemeId, Theme, THEMES, GameCharacter } from '../../shared/themes';
import { ThemeBoardRenderer, THEME_STYLES } from './ThemeBoardRenderer';
import { TrailId } from '../../shared/trails';
import { TutorialModal } from './TutorialModal';
import { ScoreCardModal } from './ScoreCardModal';
import { PuzzleShape } from './PuzzleShape';

export const GameBoard = ({
  levelConfig,
  difficulty,
  onReturnToMenu,
  onWin,
  hasNextLevel,
  onNextLevel,
  hasPrevLevel,
  onPrevLevel,
  puzzleNumber,
  title,
  puzzleId,
  refreshCurrency,
  activeTheme = 'neon',
  themeConfig,
  activeThemeStyle,
  activeTrail = 'none',
  purchasedThemes = ['neon'],
  themes = THEMES,
  onEquipTheme,
  activeCharacter = 'neon',
  purchasedCharacters = ['neon'],
  onEquipCharacter,
  characters = [],
}: {
  levelConfig: LevelConfig;
  difficulty?: GameDifficulty;
  onReturnToMenu: () => void;
  onWin?: (() => void) | undefined;
  hasNextLevel?: boolean | undefined;
  onNextLevel?: (() => void) | undefined;
  hasPrevLevel?: boolean | undefined;
  onPrevLevel?: (() => void) | undefined;
  puzzleNumber?: number | undefined;
  title?: string | undefined;
  puzzleId?: string | undefined;
  refreshCurrency?: (() => void) | undefined;
  activeTheme?: ThemeId;
  themeConfig?: ThemeConfig | undefined;
  activeThemeStyle?: Theme | undefined;
  activeTrail?: TrailId;
  purchasedThemes?: ThemeId[] | undefined;
  themes?: Theme[] | undefined;
  onEquipTheme?: ((themeId: ThemeId) => Promise<unknown> | undefined) | undefined;
  activeCharacter?: string;
  purchasedCharacters?: string[];
  onEquipCharacter?: ((characterId: string) => Promise<unknown> | undefined) | undefined;
  characters?: GameCharacter[];
}) => {
  const [playerPos, setPlayerPos] = useState<Position>(levelConfig.startPos);
  const [blockPositions, setBlockPositions] = useState<BlockData[]>(levelConfig.blocks);
  
  const getDisplayTitle = () => {
    if (title) return title;
    if (difficulty === 'daily') {
      return `Daily Puzzle ${puzzleNumber ? '#' + puzzleNumber : ''}`;
    }
    if (difficulty === 'easy') {
      return `Easy Puzzle ${puzzleNumber ? '#' + puzzleNumber : ''}`;
    }
    if (difficulty === 'medium') {
      return `Medium Puzzle ${puzzleNumber ? '#' + puzzleNumber : ''}`;
    }
    if (difficulty === 'hard') {
      return `Hard Puzzle ${puzzleNumber ? '#' + puzzleNumber : ''}`;
    }
    if (difficulty === 'tutorial') {
      return `Tutorial ${puzzleNumber ? '#' + puzzleNumber : ''}`;
    }
    return `Level ${puzzleNumber || ''}`;
  };

  const par = calculateParPushes(levelConfig);
  const [history, setHistory] = useState<{ playerPos: Position; blockPositions: BlockData[]; pushCount: number }[]>([]);
  const [pushCount, setPushCount] = useState(0);
  const [lastAction, setLastAction] = useState<'push' | 'undo' | 'reset' | 'load' | 'move'>('load');
  const [solveTime, setSolveTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [muted, setMutedState] = useState(getMuted());
  const [stats, setStats] = useState<{ totalAttempts: number; totalCompletions: number; averageScore: number; bestScore: number; bestTime?: number; bestMoves?: number } | null>(null);
  const [rewardedAmount, setRewardedAmount] = useState<number | null>(null);
  const [alreadyCompleted, setAlreadyCompleted] = useState<boolean>(false);
  const [stars, setStars] = useState<number>(3);
  const [username, setUsername] = useState<string | undefined>(undefined);
  const [streakInfo, setStreakInfo] = useState<{
    currentStreak: number;
    maxStreak: number;
    streakBonus?: number | undefined;
    milestoneText?: string | undefined;
  } | null>(null);

  const [shakeLevel, setShakeLevel] = useState<'none' | 'sm' | 'md'>('none');
  const [showTutorial, setShowTutorial] = useState(false);
  const [showScoreCard, setShowScoreCard] = useState(false);

  useEffect(() => {
    trpc.currency.get.query()
      .then(res => {
        if (res.username) setUsername(res.username);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (puzzleId) {
      setAlreadyCompleted(false);
      trpc.campaign.get.query()
        .then((res) => {
          if (res.completedIds && res.completedIds.includes(puzzleId)) {
            setAlreadyCompleted(true);
          }
        })
        .catch((err: unknown) => console.error('Failed to load completed status:', err));
    }
  }, [puzzleId]);

  const [isModerator, setIsModerator] = useState(false);
  const [autoplayIndex, setAutoplayIndex] = useState<number | null>(null);

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardEntries, setLeaderboardEntries] = useState<{ username: string; score: number; solveTime: number; moveCount: number }[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Live Timer Interval
  useEffect(() => {
    if (isPuzzleSolved || isWon) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPuzzleSolved, isWon]);

  const handleOpenLeaderboard = async () => {
    setShowLeaderboard(true);
    if (!puzzleId) return;
    try {
      setLoadingLeaderboard(true);
      const entries = await trpc.puzzle.getLeaderboard.query(puzzleId);
      setLeaderboardEntries(entries);
    } catch (e) {
      console.error('Failed to fetch leaderboard:', e);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    trpc.dev.checkAuth.query()
      .then((res) => setIsModerator(res.isDev))
      .catch((err: unknown) => console.error('Failed to check developer status:', err));
  }, []);

  useEffect(() => {
    setPlayerPos(levelConfig.startPos);
    setBlockPositions(levelConfig.blocks);
    setHistory([]);
    setPushCount(0);
    setSolveTime(null);
    setElapsedSeconds(0);
    startTimeRef.current = Date.now();
    setIsPuzzleSolved(false);
    setIsWon(false);
    setRewardedAmount(null);
    setAutoplayIndex(null);
    setShakeLevel('none');
    setLastAction('load');
  }, [levelConfig]);

  const toggleMuted = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    setMutedState(newMuted);
  };

  useEffect(() => {
    if (puzzleId) {
      trpc.puzzle.getStats.query(puzzleId)
        .then(setStats)
        .catch(err => console.error('Failed to load stats:', err));
    }
  }, [puzzleId, isWon]);

  // Record unique attempt on mount
  useEffect(() => {
    if (puzzleId) {
      trpc.puzzle.recordAttempt.mutate({ puzzleId })
        .catch(err => console.error('Failed to record attempt:', err));
    }
  }, [puzzleId]);

  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const prevPlayerPos = useRef<Position>(levelConfig.startPos);
  const prevBlockPositions = useRef<BlockData[]>(levelConfig.blocks);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const focusGame = () => {
      window.focus();
      if (containerRef.current) {
        containerRef.current.focus();
      }
    };

    focusGame();
    const timer = setTimeout(focusGame, 100);
    const animFrame = requestAnimationFrame(focusGame);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animFrame);
    };
  }, []);

  useEffect(() => {
    prevPlayerPos.current = playerPos;
    prevBlockPositions.current = blockPositions;
  }, [playerPos, blockPositions]);

  // Check win condition whenever blocks change
  useEffect(() => {
    if (levelConfig.destinations.length === 0) return;

    const allBlocksInPlace = levelConfig.destinations.every((destination) => {
      return blockPositions.some(
        (block) =>
          block.pos.x === destination.pos.x &&
          block.pos.y === destination.pos.y &&
          block.type === destination.type
      );
    });

    if (allBlocksInPlace) {
      if (!isPuzzleSolved) {
        setIsPuzzleSolved(true);
        playWinMelody();
        setShakeLevel('md');
        setTimeout(() => setShakeLevel('none'), 220);

        const timeElapsed = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
        setSolveTime(timeElapsed);

        const calculatedStars = calculateStars(pushCount, par);
        setStars(calculatedStars);

        if (puzzleId) {
          trpc.puzzle.recordCompletion.mutate({
            puzzleId,
            score: pushCount,
            solveTime: timeElapsed,
            moveCount: history.length,
            stars: calculatedStars,
          })
          .then((res) => {
            if (res.rewardedAmount !== undefined) {
              setRewardedAmount(res.rewardedAmount);
            }
            if (res.streak) {
              setStreakInfo(res.streak);
            }
            if (res.username) {
              setUsername(res.username);
            }
            refreshCurrency?.();
            setAlreadyCompleted(true);
          })
          .catch(err => console.error('Failed to record completion:', err));
        }
      }
      const timer = setTimeout(() => {
        setIsWon(true);
        onWin?.();
      }, 2400);

      return () => clearTimeout(timer);
    } else {
      setIsPuzzleSolved(false);
      setIsWon(false);
    }
  }, [blockPositions, levelConfig, history.length, pushCount, isPuzzleSolved, onWin, par, puzzleId, refreshCurrency]);

  const positionKey = (pos: Position) => `${pos.x},${pos.y}`;
  const wallSet = new Set(levelConfig.walls.map(positionKey));
  const blockMap = new Map(blockPositions.map((block, idx) => [positionKey(block.pos), idx]));
  const destinationMap = new Map(levelConfig.destinations.map((dest) => [positionKey(dest.pos), dest]));

  const canOccupy = (pos: Position, includeBlocks: boolean = true) => {
    if (pos.x < 0 || pos.x >= levelConfig.gridSize || pos.y < 0 || pos.y >= levelConfig.gridSize) {
      return false;
    }
    if (wallSet.has(positionKey(pos))) {
      return false;
    }
    if (includeBlocks && blockMap.has(positionKey(pos))) {
      return false;
    }
    return true;
  };

  const pushBlock = (blockPos: Position, direction: Position): Position => {
    let currentPos = { ...blockPos };
    let nextPos = { x: currentPos.x + direction.x, y: currentPos.y + direction.y };

    while (canOccupy(nextPos, false) && !wallSet.has(positionKey(nextPos))) {
      const blockAtNext = blockMap.has(positionKey(nextPos));
      if (blockAtNext) {
        break;
      }
      currentPos = nextPos;
      nextPos = { x: currentPos.x + direction.x, y: currentPos.y + direction.y };
    }

    return currentPos;
  };

  const movePlayer = (direction: Position) => {
    if (isPuzzleSolved || isWon) return;

    const newPos = { x: playerPos.x + direction.x, y: playerPos.y + direction.y };

    if (!canOccupy(newPos, false)) {
      playThudSound();
      setShakeLevel('sm');
      setTimeout(() => setShakeLevel('none'), 120);
      return;
    }

    let newBlockPositions = blockPositions;
    let didBlockMatch = false;
    let isPush = false;

    const blockIdx = blockMap.get(positionKey(newPos));
    if (blockIdx !== undefined) {
      const block = blockPositions[blockIdx];
      if (!block) return;
      const oldBlockPos = block.pos;
      const blockNewPos = pushBlock(oldBlockPos, direction);

      // Only allow movement if the block actually moved
      if (blockNewPos.x === oldBlockPos.x && blockNewPos.y === oldBlockPos.y) {
        playThudSound();
        setShakeLevel('sm');
        setTimeout(() => setShakeLevel('none'), 120);
        return;
      }

      const destAtNew = destinationMap.get(positionKey(blockNewPos));
      if (destAtNew && destAtNew.type === block.type) {
        didBlockMatch = true;
      }

      newBlockPositions = [...blockPositions];
      newBlockPositions[blockIdx] = { ...block, pos: blockNewPos };
      isPush = true;

      // Small collision impact on block slide
      setShakeLevel('sm');
      setTimeout(() => setShakeLevel('none'), 120);
    }

    if (didBlockMatch) {
      const currentMatched = levelConfig.destinations.filter(destination =>
        newBlockPositions.some(block =>
          block.pos.x === destination.pos.x &&
          block.pos.y === destination.pos.y &&
          block.type === destination.type
        )
      ).length;
      playMatchSound(currentMatched - 1);
    } else {
      playSlideSound();
    }

    setHistory(prev => [...prev, { playerPos, blockPositions, pushCount }]);
    setBlockPositions(newBlockPositions);
    setPlayerPos(newPos);
    if (isPush) {
      setPushCount(prev => prev + 1);
    }
    setLastAction(isPush ? 'push' : 'move');
  };

  const movePlayerRef = useRef(movePlayer);
  useEffect(() => {
    movePlayerRef.current = movePlayer;
  });

  // Autoplay handler logic
  useEffect(() => {
    if (autoplayIndex === null) return;

    if (isPuzzleSolved || isWon || !levelConfig.moves || autoplayIndex >= levelConfig.moves.length) {
      setAutoplayIndex(null);
      return;
    }

    const move = levelConfig.moves[autoplayIndex];
    if (!move) {
      setAutoplayIndex(null);
      return;
    }

    let direction: Position | null = null;
    switch (move.toLowerCase()) {
      case 'up': direction = { x: 0, y: -1 }; break;
      case 'down': direction = { x: 0, y: 1 }; break;
      case 'left': direction = { x: -1, y: 0 }; break;
      case 'right': direction = { x: 1, y: 0 }; break;
    }

    if (direction) {
      movePlayerRef.current(direction);
    }

    const timer = setTimeout(() => {
      setAutoplayIndex((prev) => (prev !== null ? prev + 1 : null));
    }, 500);

    return () => clearTimeout(timer);
  }, [autoplayIndex, levelConfig.moves, isPuzzleSolved, isWon]);

  const keysDown = useRef(new Set<string>());
  const lastMoveTime = useRef<number>(0);
  const moveInterval = 120; // ms per tile movement

  useEffect(() => {
    let animationFrameId: number;

    const gameLoop = (timestamp: number) => {
      if (autoplayIndex !== null || showSettings || showLeaderboard || showTutorial || showScoreCard || isPuzzleSolved || isWon) {
        keysDown.current.clear();
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }
      if (timestamp - lastMoveTime.current >= moveInterval) {
        let moved = false;

        if (keysDown.current.has('ArrowUp')) {
          movePlayer({ x: 0, y: -1 });
          moved = true;
        } else if (keysDown.current.has('ArrowDown')) {
          movePlayer({ x: 0, y: 1 });
          moved = true;
        } else if (keysDown.current.has('ArrowLeft')) {
          movePlayer({ x: -1, y: 0 });
          moved = true;
        } else if (keysDown.current.has('ArrowRight')) {
          movePlayer({ x: 1, y: 0 });
          moved = true;
        }

        if (moved) {
          lastMoveTime.current = timestamp;
        }
      }
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationFrameId);
  }, [playerPos, blockPositions, autoplayIndex, showSettings, showLeaderboard, showTutorial, showScoreCard, isPuzzleSolved, isWon]);

  const handleUndo = () => {
    setAutoplayIndex(null);
    if (history.length === 0 || isWon) return;
    const targetState = history[history.length - 1];
    if (!targetState) return;
    setHistory(prev => prev.slice(0, -1));
    setPlayerPos(targetState.playerPos);
    setBlockPositions(targetState.blockPositions);
    setPushCount(targetState.pushCount);
    setLastAction('undo');
  };

  const handleReset = () => {
    setAutoplayIndex(null);
    setPlayerPos(levelConfig.startPos);
    setBlockPositions(levelConfig.blocks);
    setHistory([]);
    setPushCount(0);
    setSolveTime(null);
    setElapsedSeconds(0);
    startTimeRef.current = Date.now();
    setIsPuzzleSolved(false);
    setIsWon(false);
    setRewardedAmount(null);
    setShakeLevel('none');
    setLastAction('reset');
  };

  const handleShareResult = () => {
    setShowScoreCard(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) {
        return;
      }

      if (showSettings || showLeaderboard || showTutorial || showScoreCard) {
        return;
      }

      if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (autoplayIndex !== null) return;
        if (isModerator) {
          if (levelConfig.moves && levelConfig.moves.length > 0) {
            handleReset();
            setAutoplayIndex(0);
          } else {
            showToast({
              text: 'No recorded solution moves found for this puzzle.',
              appearance: 'neutral',
            });
          }
        }
        return;
      }

      if (autoplayIndex !== null) return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        if (!keysDown.current.has(e.key)) {
          keysDown.current.add(e.key);
          lastMoveTime.current = performance.now();

          switch (e.key) {
            case 'ArrowUp': movePlayer({ x: 0, y: -1 }); break;
            case 'ArrowDown': movePlayer({ x: 0, y: 1 }); break;
            case 'ArrowLeft': movePlayer({ x: -1, y: 0 }); break;
            case 'ArrowRight': movePlayer({ x: 1, y: 0 }); break;
          }
        }
      } else if (e.key.toLowerCase() === 'u') {
        e.preventDefault();
        handleUndo();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleReset();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (showSettings || showLeaderboard || showTutorial || showScoreCard) {
        return;
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        keysDown.current.delete(e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [playerPos, blockPositions, history, isWon, autoplayIndex, isModerator, levelConfig, showSettings, showLeaderboard, showTutorial, showScoreCard]);

  const handleTouchStart = (e: TouchEvent) => {
    if (autoplayIndex !== null || showSettings || showLeaderboard || showTutorial || showScoreCard || isPuzzleSolved || isWon) return;
    const touch = e.touches[0];
    if (touch) {
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (autoplayIndex !== null || showSettings || showLeaderboard || showTutorial || showScoreCard || isPuzzleSolved || isWon) return;
    if (!touchStartPos.current) return;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const touchEnd = { x: touch.clientX, y: touch.clientY };
    const dx = touchEnd.x - touchStartPos.current.x;
    const dy = touchEnd.y - touchStartPos.current.y;
    const threshold = 25;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > threshold) {
        movePlayer({ x: dx > 0 ? 1 : -1, y: 0 });
      }
    } else {
      if (Math.abs(dy) > threshold) {
        movePlayer({ x: 0, y: dy > 0 ? 1 : -1 });
      }
    }

    touchStartPos.current = null;
  };

  const handleCloseLeaderboard = () => {
    setShowLeaderboard(false);
    if (!isWon) {
      setShowSettings(true);
    }
  };

  const handleThemeSelect = async (themeId: ThemeId) => {
    if (onEquipTheme) {
      await onEquipTheme(themeId);
    } else {
      try {
        await trpc.shop.setActive.mutate({ themeId });
      } catch (err) {
        console.error('Failed to set active theme:', err);
      }
    }
  };

  const formatTime = (sec: number) => {
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const totalBlocks = levelConfig.destinations.length;
  const blocksInPlace = levelConfig.destinations.filter(destination =>
    blockPositions.some(block =>
      block.pos.x === destination.pos.x &&
      block.pos.y === destination.pos.y &&
      block.type === destination.type
    )
  ).length;
  const progressPercent = totalBlocks > 0 ? (blocksInPlace / totalBlocks) * 100 : 0;

  const baseThemeId = getBaseThemeId(activeTheme);
  const defaultStyles = THEME_STYLES[baseThemeId] || THEME_STYLES.neon;
  const styles = {
    bgClass: activeThemeStyle?.bgGradient || defaultStyles.bgClass,
    panelClass: activeThemeStyle?.panelClass || defaultStyles.panelClass,
    cellClass: activeThemeStyle?.cellClass || defaultStyles.cellClass,
    wallClass: activeThemeStyle?.wallClass || defaultStyles.wallClass,
  };

  return (
    <>
      {isWon ? (
        <div className={`flex min-h-screen flex-col items-center justify-center gap-6 ${styles.bgClass} px-4 relative overflow-hidden`}>
          {/* Floating Confetti Atmosphere */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-sm"
                style={{
                  left: `${(i * 4.2 + (i % 3) * 2)}%`,
                  top: '-10px',
                  backgroundColor: ['#38bdf8', '#fbbf24', '#a855f7', '#34d399', '#f43f5e', '#fb923c'][i % 6],
                  animation: `confetti-fall-anim ${2.5 + (i % 4) * 0.5}s ease-in infinite`,
                  animationDelay: `${(i % 6) * 0.4}s`,
                }}
              />
            ))}
          </div>

          <div className={`text-center ${styles.panelClass} p-6 sm:p-8 animate-float max-w-md w-full relative z-10 shadow-2xl`}>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 drop-shadow-md">You Won!</h1>
            
            {/* 3-Star Rating Animated Display */}
            <div className="flex items-center justify-center gap-3 my-3">
              {[1, 2, 3].map((starIdx) => {
                const isEarned = starIdx <= stars;
                return (
                  <div
                    key={starIdx}
                    className={`text-4xl sm:text-5xl transition-all duration-500 ${
                      isEarned
                        ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)] animate-star-pop'
                        : 'text-white/15 scale-90'
                    }`}
                    style={isEarned ? { animationDelay: `${(starIdx - 1) * 200}ms` } : undefined}
                  >
                    ★
                  </div>
                );
              })}
            </div>

            <p className="text-base font-extrabold text-cyan-400 mb-4 tracking-wide">
              {stars === 3 ? '🏆 Par Master! Optimal Solution!' : stars === 2 ? '⭐ Great Job! Solved in few pushes!' : '✓ Solved! Aim for Par next time!'}
            </p>

            {/* Shard and Streak Rewards */}
            <div className="flex flex-col gap-2 mb-5">
              {rewardedAmount !== null && rewardedAmount > 0 && (
                <div className="animate-pulse text-sm font-extrabold text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] bg-cyan-950/40 border border-cyan-500/30 rounded-2xl py-2 px-4 inline-flex items-center gap-1.5 justify-center">
                  <span className="text-cyan-400 text-base">✦</span>
                  <span>+{rewardedAmount} Neon Shards!</span>
                </div>
              )}

              {streakInfo && streakInfo.currentStreak > 0 && (
                <div className="text-xs font-extrabold text-red-300 bg-red-950/60 border border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.3)] rounded-2xl py-1.5 px-3 inline-flex items-center gap-2 justify-center">
                  <div className="w-4 h-4 bg-red-500/20 border border-red-400/40 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] flex items-center justify-center text-red-400 p-0.5 shrink-0">
                    <PuzzleShape shape={themeConfig?.['red-heart']?.shape || 'heart'} className="w-full h-full" />
                  </div>
                  <span>{streakInfo.currentStreak}-Day Streak!</span>
                  {streakInfo.streakBonus && streakInfo.streakBonus > 0 && (
                    <span className="text-yellow-400 font-mono font-bold">(+{streakInfo.streakBonus} ✦)</span>
                  )}
                </div>
              )}
            </div>

            {stats && (
              <div className="grid grid-cols-2 gap-4 border-t border-b border-white/10 py-3 my-4 font-mono text-sm text-white/85 bg-black/20 rounded-xl px-4 text-left w-full mx-auto">
                <div>
                  <div className="text-[10px] text-white/50 uppercase tracking-wider mb-2 border-b border-white/5 pb-1">Your Stats</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="text-white/60">Time:</span>
                      <span className="font-bold text-cyan-400">{solveTime ? formatTime(solveTime) : '-'}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-white/60">Moves:</span>
                      <span className="font-bold text-cyan-400">{history.length}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-white/60">Pushes:</span>
                      <span className="font-bold text-cyan-400">{pushCount} / {par}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-white/50 uppercase tracking-wider mb-2 border-b border-white/5 pb-1">World Records</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="text-white/60">Time:</span>
                      <span className="font-bold text-yellow-400">{stats.bestTime && stats.bestTime > 0 ? formatTime(stats.bestTime) : '-'}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-white/60">Moves:</span>
                      <span className="font-bold text-yellow-400">{stats.bestMoves && stats.bestMoves > 0 ? stats.bestMoves : '-'}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-white/60">Pushes:</span>
                      <span className="font-bold text-yellow-400">{stats.bestScore && stats.bestScore > 0 ? stats.bestScore : '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 w-full">
              {/* Share Score Image Card Button */}
              <button
                onClick={handleShareResult}
                className="rounded-xl theme-btn py-3.5 text-sm font-extrabold flex items-center justify-center gap-2 border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-102 active:scale-98 cursor-pointer"
              >
                <span>📸</span>
                <span>Share Verified Score Card</span>
              </button>

              <button
                onClick={handleReset}
                className="rounded-xl theme-btn py-3 text-base font-bold"
              >
                Play Again
              </button>
              {hasNextLevel && (
                <button
                  onClick={onNextLevel}
                  className="rounded-xl theme-btn py-3 text-base font-bold"
                >
                  Continue to Next Level
                </button>
              )}
              {puzzleId && (
                <button
                  onClick={handleOpenLeaderboard}
                  className="rounded-xl theme-btn py-3 text-base font-bold flex items-center justify-center gap-2"
                >
                  <span>View Leaderboard</span>
                  <span>🏆</span>
                </button>
              )}
              <button
                onClick={onReturnToMenu}
                className="rounded-xl theme-btn py-3 text-base font-bold"
              >
                Return to {difficulty ? 'Menu' : 'Campaign'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          tabIndex={-1}
          className={`flex min-h-screen flex-col ${styles.bgClass} px-2 sm:px-4 pt-3 pb-2 sm:pt-4 sm:pb-6 outline-none`}
        >
          {/* Top Row: Navigation and Live Stats HUD */}
          <div className="flex flex-col gap-2 mb-2 sm:mb-4 w-full max-w-4xl mx-auto">
            <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
              {/* Left: Menu and Puzzle title */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={onReturnToMenu}
                  className="rounded-full px-3 py-1 text-xs font-extrabold theme-btn flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all"
                >
                  ← Menu
                </button>
                <div className="flex flex-col">
                  <h1 className="text-xs sm:text-sm font-black text-white drop-shadow-md flex items-center gap-1.5">
                    <span>{getDisplayTitle()}</span>
                    {alreadyCompleted && (
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black" title="Completed!">
                        ✓
                      </span>
                    )}
                  </h1>
                  <span className="text-[10px] text-zinc-400 font-mono">Par: {par} pushes</span>
                </div>
              </div>

              {/* Center: Live Stats HUD Pill */}
              <div className="flex items-center gap-2.5 sm:gap-4 bg-black/60 backdrop-blur-md px-3.5 py-1 rounded-full border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)] select-none mx-auto sm:mx-0">
                {/* Timer */}
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-mono font-bold text-white">
                  <svg className="w-3.5 h-3.5 text-cyan-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <polyline points="12 7 12 12 15 14" />
                  </svg>
                  <span>{formatTime(elapsedSeconds)}</span>
                </div>
                <div className="w-px h-3 bg-white/20" />
                {/* Pushes / Par */}
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-mono font-bold">
                  <svg className="w-3.5 h-3.5 text-yellow-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m13 6 6 6-6 6" />
                  </svg>
                  <span className={pushCount <= par ? 'text-emerald-400 font-black' : 'text-zinc-200'}>
                    {pushCount} <span className="text-zinc-500 font-normal">/ {par}</span>
                  </span>
                </div>
                <div className="w-px h-3 bg-white/20" />
                {/* Targets */}
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-mono font-bold text-white">
                  <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span className={blocksInPlace === totalBlocks ? 'text-emerald-400 font-black' : 'text-white'}>
                    {blocksInPlace}/{totalBlocks}
                  </span>
                </div>
              </div>

              {/* Right Action buttons: Level Nav, Undo, Reset, Settings */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto sm:ml-0">
                {(hasPrevLevel || hasNextLevel) && (
                  <>
                    <button
                      onClick={onPrevLevel}
                      disabled={!hasPrevLevel || isWon}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold theme-btn flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title="Previous Puzzle"
                    >
                      ◀
                    </button>
                    <button
                      onClick={onNextLevel}
                      disabled={!hasNextLevel || isWon}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold theme-btn flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title="Next Puzzle"
                    >
                      ▶
                    </button>
                  </>
                )}
                <button
                  onClick={handleUndo}
                  disabled={history.length === 0 || isWon}
                  className="px-2.5 sm:px-3 h-7 sm:h-8 rounded-lg text-[11px] sm:text-xs font-bold theme-btn flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Undo move (U)"
                >
                  <svg className="w-3.5 h-3.5 text-white shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 14 4 9l5-5" />
                    <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />
                  </svg>
                  <span>Undo</span>
                </button>
                <button
                  onClick={handleReset}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold theme-btn flex items-center justify-center cursor-pointer"
                  title="Reset puzzle (R)"
                >
                  <svg className="w-3.5 h-3.5 text-white shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold theme-btn flex items-center justify-center cursor-pointer"
                  title="Settings"
                >
                  <svg className="w-3.5 h-3.5 text-white shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Progress Bar with centered fraction */}
            {totalBlocks > 0 && (
              <div className="w-full">
                <div className="relative h-2 w-full bg-black/45 rounded-full overflow-hidden border border-white/10 shadow-inner flex items-center justify-center">
                  <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div
            className="flex-1 flex items-center justify-center w-full overflow-visible px-3 py-1 touch-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <ThemeBoardRenderer
              gridSize={levelConfig.gridSize}
              walls={levelConfig.walls}
              destinations={levelConfig.destinations}
              blocks={blockPositions}
              playerPos={playerPos}
              activeTheme={activeTheme}
              themeConfig={themeConfig}
              isAnimated={true}
              prevBlocks={prevBlockPositions.current}
              prevPlayerPos={prevPlayerPos.current}
              activeThemeStyle={activeThemeStyle}
              activeTrail={activeTrail}
              lastAction={lastAction}
              activeCharacter={activeCharacter}
              shakeLevel={shakeLevel}
            />
          </div>
        </div>
      )}

      {/* Temporary Animated "Puzzle Complete" Text Popup */}
      {isPuzzleSolved && !isWon && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center pointer-events-none px-4">
          <h2 className="text-amber-400 font-black text-3xl sm:text-5xl lg:text-6xl tracking-tight uppercase animate-complete-banner flex items-center gap-3 select-none drop-shadow-[0_6px_20px_rgba(0,0,0,0.95)]">
            <span className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]">
              Puzzle Complete
            </span>
          </h2>
        </div>
      )}

      {/* Score Card Image Sharing Modal */}
      {showScoreCard && (
        <ScoreCardModal
          options={{
            title: getDisplayTitle(),
            puzzleId,
            username,
            pushes: pushCount,
            par,
            moves: history.length,
            solveTime: solveTime || elapsedSeconds,
            stars,
            streak: streakInfo?.currentStreak,
          }}
          onClose={() => setShowScoreCard(false)}
        />
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 pointer-events-auto">
          <div className="glass-panel max-w-md w-full p-6 rounded-3xl border border-cyan-500/30 text-white relative animate-float shadow-[0_0_50px_rgba(6,182,212,0.25)]">
            <div className="text-center mb-6">
              <span className="text-4xl">🏆</span>
              <h2 className="text-2xl font-black neon-text-title tracking-tight mt-2">Leaderboard</h2>
              <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest mt-1">Top Solutions</p>
            </div>

            {loadingLeaderboard ? (
              <div className="text-center text-zinc-400 py-12 flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-bold">Loading scoreboard...</span>
              </div>
            ) : leaderboardEntries.length === 0 ? (
              <div className="text-center text-zinc-500 py-12 text-sm font-medium">
                No completion records yet.<br />Be the first to secure a spot!
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="text-zinc-500 border-b border-white/10 pb-2">
                      <th className="py-2 pl-2">Rank</th>
                      <th className="py-2">User</th>
                      <th className="py-2 text-center">Pushes</th>
                      <th className="py-2 text-center">Moves</th>
                      <th className="py-2 text-right pr-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardEntries.map((entry, index) => {
                      const rankIcons = ['🥇', '🥈', '🥉'];
                      const rankDisplay = index < 3 ? rankIcons[index] : `${index + 1}`;
                      return (
                        <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 pl-2 text-sm font-bold text-zinc-300">{rankDisplay}</td>
                          <td className="py-3 font-extrabold text-white max-w-[120px] truncate">{entry.username}</td>
                          <td className="py-3 text-center text-cyan-400 font-bold">{entry.score}</td>
                          <td className="py-3 text-center text-zinc-300">{entry.moveCount}</td>
                          <td className="py-3 text-right pr-2 text-zinc-300">{formatTime(entry.solveTime)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="mt-6 flex justify-center w-full">
              <button
                onClick={handleCloseLeaderboard}
                className="w-full rounded-2xl theme-btn py-3 text-base font-bold transition-all hover:scale-102 active:scale-98 shadow-lg cursor-pointer"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 py-6 pointer-events-auto">
          <div className={`max-w-md w-full p-6 rounded-3xl border text-white relative animate-float shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar ${styles.panelClass}`}>
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white text-2xl font-black cursor-pointer bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-all z-10"
            >
              ×
            </button>
            <div className="text-center mb-6">
              <span className="text-4xl">⚙️</span>
              <h2 className="text-2xl font-black neon-text-title tracking-tight mt-2">Settings</h2>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 mb-4">
              <div>
                <h3 className="font-bold text-sm">Game Sound</h3>
                <p className="text-xs text-zinc-400">Toggle sound effects</p>
              </div>
              <button
                onClick={toggleMuted}
                className={`w-14 h-8 rounded-full transition-all duration-300 relative ${muted ? 'bg-zinc-700' : 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]'}`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-all duration-300 ${muted ? 'left-1' : 'left-7'}`}
                />
              </button>
            </div>

            {/* How to Play Guide Button */}
            <button
              onClick={() => {
                setShowSettings(false);
                setShowTutorial(true);
              }}
              className="w-full mb-3 py-3 rounded-2xl theme-btn text-center flex items-center justify-center cursor-pointer gap-2 font-bold transition-all hover:scale-102 active:scale-98 shadow-lg"
            >
              <span>📖</span>
              <span>How to Play</span>
            </button>

            {/* Leaderboard Button */}
            {puzzleId && (
              <button
                onClick={handleOpenLeaderboard}
                className="w-full mb-6 py-3 rounded-2xl theme-btn text-center flex items-center justify-center cursor-pointer gap-2 font-bold transition-all hover:scale-102 active:scale-98 shadow-lg"
              >
                <span>🏆</span>
                <span>Leaderboard</span>
              </button>
            )}

            {/* Theme Selector */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm px-1">Equipped Theme</h3>
              <div className="grid grid-cols-2 gap-2">
                {themes.filter((t) => purchasedThemes.includes(t.id)).map((theme) => {
                  const isActive = activeTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeSelect(theme.id)}
                      className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                        isActive
                          ? 'border-cyan-400 bg-cyan-950/35 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                          : 'border-white/10 bg-white/5 hover:border-white/25'
                      }`}
                    >
                      <span className="font-black text-xs block text-white">{theme.name}</span>
                      <span className="text-[10px] text-zinc-400 mt-1 block truncate">{theme.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Character Selector */}
            <div className="space-y-3 mt-4">
              <h3 className="font-bold text-sm px-1">Equipped Character</h3>
              <div className="grid grid-cols-2 gap-2">
                {characters.filter((c) => purchasedCharacters.includes(c.id)).map((char) => {
                  const isActive = activeCharacter === char.id;
                  return (
                    <button
                      key={char.id}
                      onClick={() => onEquipCharacter?.(char.id)}
                      className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                        isActive
                          ? 'border-cyan-400 bg-cyan-950/35 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                          : 'border-white/10 bg-white/5 hover:border-white/25'
                      }`}
                    >
                      <span className="font-black text-xs block text-white">{char.name}</span>
                      <span className="text-[10px] text-zinc-400 mt-1 block truncate">{char.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Modal */}
      {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}
    </>
  );
};
