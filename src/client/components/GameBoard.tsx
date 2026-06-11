/* eslint-disable react-hooks/refs */
import React, { useState, useEffect, useRef } from 'react';
import { LevelConfig, GameDifficulty, Position, BlockData } from '../types';
import { playSlideSound, playThudSound, playMatchSound, playWinMelody, getMuted, setMuted } from '../utils/audio';
import { showToast } from '@devvit/web/client';
import { trpc } from '../trpc';
import { ThemeId, ThemeConfig, getBaseThemeId, Theme, THEMES, GameCharacter } from '../../shared/themes';
import { ThemeBoardRenderer, THEME_STYLES } from './ThemeBoardRenderer';
import { TrailId } from '../../shared/trails';

export const GameBoard = ({
  levelConfig,
  difficulty,
  onReturnToMenu,
  onWin,
  hasNextLevel,
  onNextLevel,
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
  onWin?: () => void;
  hasNextLevel?: boolean;
  onNextLevel?: () => void;
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
  const [history, setHistory] = useState<{ playerPos: Position; blockPositions: BlockData[]; pushCount: number }[]>([]);
  const [pushCount, setPushCount] = useState(0);
  const [lastAction, setLastAction] = useState<'push' | 'undo' | 'reset' | 'load' | 'move'>('load');
  const [solveTime, setSolveTime] = useState<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [muted, setMutedState] = useState(getMuted());
  const [stats, setStats] = useState<{ totalAttempts: number; totalCompletions: number; averageScore: number; bestScore: number; bestTime?: number; bestMoves?: number } | null>(null);
  const [rewardedAmount, setRewardedAmount] = useState<number | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [hasJoinedChannel, setHasJoinedChannel] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [autoplayIndex, setAutoplayIndex] = useState<number | null>(null);

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardEntries, setLeaderboardEntries] = useState<{ username: string; score: number; solveTime: number; moveCount: number }[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
    startTimeRef.current = Date.now();
    setIsPuzzleSolved(false);
    setIsWon(false);
    setRewardedAmount(null);
    setAutoplayIndex(null);
    setLastAction('load');
  }, [levelConfig]);

  const toggleMuted = () => {
    const newMuted = !muted;
    setMuted(newMuted);
    setMutedState(newMuted);
  };

  useEffect(() => {
    if (isWon && puzzleId) {
      trpc.puzzle.getStats.query(puzzleId)
        .then(setStats)
        .catch(err => console.error('Failed to load stats:', err));
    }
  }, [isWon, puzzleId]);

  useEffect(() => {
    // Check local storage first for fast response
    try {
      const joined = window.localStorage.getItem('block-down-subreddit-joined');
      if (joined === 'true') {
        setHasJoinedChannel(true);
        return;
      }
    } catch {}

    // Verify/fallback to backend subscription check
    trpc.subreddit.isSubscribed.query()
      .then((res) => {
        if (res.subscribed) {
          setHasJoinedChannel(true);
          try {
            window.localStorage.setItem('block-down-subreddit-joined', 'true');
          } catch {}
        }
      })
      .catch((err) => console.error('Failed to check subscription status:', err));
  }, []);

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
    // Use timeout and animation frame to ensure it runs after DOM has completely rendered
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
        const timeElapsed = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
        setSolveTime(timeElapsed);

        if (puzzleId) {
          trpc.puzzle.recordCompletion.mutate({
            puzzleId,
            score: pushCount,
            solveTime: timeElapsed,
            moveCount: history.length,
          })
          .then((res) => {
            if (res.rewardedAmount !== undefined) {
              setRewardedAmount(res.rewardedAmount);
            }
            refreshCurrency?.();
          })
          .catch(err => console.error('Failed to record completion:', err));
        }
      }
      const timer = setTimeout(() => {
        setIsWon(true);
        onWin?.();
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setIsPuzzleSolved(false);
      setIsWon(false);
    }
  }, [blockPositions, levelConfig, history.length, pushCount]);

  const difficultyLabels: Record<GameDifficulty, string> = {
    tutorial: 'Tutorial',
    daily: 'Daily Puzzle',
    easy: 'Easy Puzzles',
    medium: 'Medium Puzzle',
    hard: 'Hard Puzzles',
  };

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
    if (isPuzzleSolved) return;

    const newPos = { x: playerPos.x + direction.x, y: playerPos.y + direction.y };

    if (!canOccupy(newPos, false)) {
      playThudSound();
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
        return;
      }

      const destAtNew = destinationMap.get(positionKey(blockNewPos));
      if (destAtNew && destAtNew.type === block.type) {
        didBlockMatch = true;
      }

      newBlockPositions = [...blockPositions];
      newBlockPositions[blockIdx] = { ...block, pos: blockNewPos };
      isPush = true;
    }

    if (didBlockMatch) {
      playMatchSound();
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
      case 'up':
        direction = { x: 0, y: -1 };
        break;
      case 'down':
        direction = { x: 0, y: 1 };
        break;
      case 'left':
        direction = { x: -1, y: 0 };
        break;
      case 'right':
        direction = { x: 1, y: 0 };
        break;
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
      if (autoplayIndex !== null || showSettings || showLeaderboard) {
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
  }, [playerPos, blockPositions, autoplayIndex, showSettings, showLeaderboard]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcut interference if typing in input fields
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) {
        return;
      }

      if (showSettings || showLeaderboard) {
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
      } else if (e.key.toLowerCase() === 'w') {
        e.preventDefault();
        handleUndoFive();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleReset();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (showSettings || showLeaderboard) {
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
  }, [playerPos, blockPositions, history, isWon, autoplayIndex, isModerator, levelConfig, showSettings, showLeaderboard]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (autoplayIndex !== null || showSettings || showLeaderboard) return;
    const touch = e.touches[0];
    if (touch) {
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (autoplayIndex !== null || showSettings || showLeaderboard) return;
    if (!touchStartPos.current) return;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const touchEnd = { x: touch.clientX, y: touch.clientY };
    const dx = touchEnd.x - touchStartPos.current.x;
    const dy = touchEnd.y - touchStartPos.current.y;
    const threshold = 30;

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

  const handleUndo = () => {
    setAutoplayIndex(null);
    if (history.length === 0 || isWon) return;
    const lastState = history[history.length - 1];
    if (!lastState) return;
    setHistory(prev => prev.slice(0, -1));
    setPlayerPos(lastState.playerPos);
    setBlockPositions(lastState.blockPositions);
    setLastAction('undo');
    setPushCount(lastState.pushCount);
  };

  const handleUndoFive = () => {
    setAutoplayIndex(null);
    if (history.length === 0 || isWon) return;
    const stepsToUndo = Math.min(5, history.length);
    const targetState = history[history.length - stepsToUndo];
    if (!targetState) return;
    setHistory(prev => prev.slice(0, -stepsToUndo));
    setPlayerPos(targetState.playerPos);
    setBlockPositions(targetState.blockPositions);
    setPushCount(targetState.pushCount);
    setLastAction('undo');
  };

  const handleJoinChannel = async () => {
    setIsSubscribing(true);
    try {
      await trpc.subreddit.subscribe.mutate();
      window.localStorage.setItem('block-down-subreddit-joined', 'true');
      setHasJoinedChannel(true);
      showToast({
        text: 'Subscribed to this subreddit! Enable notifications in Reddit to get updates.',
        appearance: 'success',
      });
    } catch (error) {
      console.error('Failed to subscribe to subreddit', error);
      showToast({
        text: 'Unable to subscribe right now. Please try again later.',
        appearance: 'neutral',
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleReset = () => {
    setAutoplayIndex(null);
    setPlayerPos(levelConfig.startPos);
    setBlockPositions(levelConfig.blocks);
    setHistory([]);
    setPushCount(0);
    setSolveTime(null);
    startTimeRef.current = Date.now();
    setIsPuzzleSolved(false);
    setIsWon(false);
    setRewardedAmount(null);
    setLastAction('reset');
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
    return `${m}m ${s}s`;
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
        <div className={`flex min-h-screen flex-col items-center justify-center gap-8 ${styles.bgClass} px-4`}>
          <div className={`text-center ${styles.panelClass} p-8 animate-float`}>
            <h1 className="text-5xl font-black text-white mb-2 drop-shadow-md animate-float">You Won!</h1>
            <p className="text-xl text-cyan-400 mb-6 font-black tracking-wide">
              Solved in {pushCount} pushes!
            </p>
            {rewardedAmount !== null && rewardedAmount > 0 && (
              <div className="mb-6 animate-pulse text-base font-extrabold text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] bg-cyan-950/40 border border-cyan-500/30 rounded-2xl py-2 px-4 inline-flex items-center gap-1.5 justify-center">
                <span className="text-cyan-400 text-lg">✦</span>
                <span>+{rewardedAmount} Neon Shards!</span>
              </div>
            )}
            {stats && (
              <div className="grid grid-cols-2 gap-6 border-t border-b border-white/10 py-4 my-6 font-mono text-sm text-white/85 bg-black/20 rounded-xl px-4 text-left w-full max-w-sm mx-auto">
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
                      <span className="font-bold text-cyan-400">{pushCount}</span>
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
            {!hasJoinedChannel && (
              <div className="mb-4 w-full max-w-sm mx-auto">
                <button
                  onClick={handleJoinChannel}
                  disabled={isSubscribing}
                  className="w-full rounded-2xl bg-cyan-500/90 px-6 py-4 text-lg font-bold text-black transition hover:bg-cyan-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubscribing ? 'Subscribing...' : 'Subscribe to Subreddit'}
                </button>
                <p className="text-[10px] text-zinc-400 mt-1.5 text-center px-4">
                  By clicking, you subscribe to this subreddit to stay updated on new daily puzzles.
                </p>
              </div>
            )}
            <div className="flex flex-col gap-4 w-full">
              <button
                onClick={handleReset}
                className="rounded-xl theme-btn px-6 py-4 text-xl font-bold"
              >
                Play Again
              </button>
              {hasNextLevel && (
                <button
                  onClick={onNextLevel}
                  className="rounded-xl theme-btn px-6 py-4 text-xl font-bold"
                >
                  Continue to Next Level
                </button>
              )}
              {puzzleId && (
                <button
                  onClick={handleOpenLeaderboard}
                  className="rounded-xl theme-btn px-6 py-4 text-xl font-bold flex items-center justify-center gap-2"
                >
                  <span>View Leaderboard</span>
                  <span>🏆</span>
                </button>
              )}
              <button
                onClick={onReturnToMenu}
                className="rounded-xl theme-btn px-6 py-4 text-xl font-bold"
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
          className={`flex min-h-screen flex-col ${styles.bgClass} px-2 sm:px-4 pt-4 pb-2 sm:pt-4 sm:pb-6 outline-none`}
        >
          {/* Top Header Row: Title on Left, Action Buttons on Right */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4 mb-3 sm:mb-5 pr-0 md:pr-24">
            <h1 className="text-lg sm:text-2xl font-black text-white drop-shadow-md shrink-0">
              {difficulty ? difficultyLabels[difficulty] : 'Campaign'}
            </h1>
            <div className="flex gap-1.5 sm:gap-2 items-center justify-between w-full md:w-auto flex-wrap">
              <button
                onClick={onReturnToMenu}
                className="flex-1 md:flex-none md:w-20 rounded-lg py-1 text-xs sm:text-sm font-bold theme-btn text-center flex items-center justify-center cursor-pointer"
              >
                Menu
              </button>
              {puzzleId && (
                <button
                  onClick={handleOpenLeaderboard}
                  className="flex-1 md:flex-none md:w-28 rounded-lg py-1 text-xs sm:text-sm font-bold theme-btn text-center flex items-center justify-center cursor-pointer gap-1"
                >
                  <span>🏆</span>
                  <span>Leaderboard</span>
                </button>
              )}
              <button
                onClick={handleUndo}
                disabled={history.length === 0 || isWon}
                className="flex-1 md:flex-none md:w-20 rounded-lg py-1 text-xs sm:text-sm font-bold theme-btn text-center flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Undo
              </button>
              <button
                onClick={handleUndoFive}
                disabled={history.length === 0 || isWon}
                className="flex-1 md:flex-none md:w-20 rounded-lg py-1 text-xs sm:text-sm font-bold theme-btn text-center flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Undo 5
              </button>
              <button
                onClick={handleReset}
                className="flex-1 md:flex-none md:w-20 rounded-lg py-1 text-xs sm:text-sm font-bold theme-btn text-center flex items-center justify-center cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="flex-1 md:flex-none md:w-24 rounded-lg py-1 text-xs sm:text-sm font-bold theme-btn text-center flex items-center justify-center cursor-pointer gap-1"
                title="Settings"
              >
                <span>⚙️</span>
                <span>Settings</span>
              </button>
            </div>
          </div>

          {/* Progress Bar with centered fraction */}
          {totalBlocks > 0 && (
            <div className="w-full max-w-2xl mx-auto mb-2 sm:mb-6">
              <div className="relative h-5 w-full bg-black/45 rounded-full overflow-hidden border border-white/10 shadow-inner flex items-center justify-center">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                  style={{ width: `${progressPercent}%` }}
                />
                <span className="relative z-10 text-[10px] sm:text-xs font-bold text-white tracking-wider drop-shadow-md select-none">
                  {blocksInPlace} / {totalBlocks}
                </span>
              </div>
            </div>
          )}

          <div
            className="flex-1 flex items-center justify-center w-full overflow-hidden touch-none"
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
            />
          </div>
        </div>
      )}

      {showLeaderboard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 pointer-events-auto">
          <div className="glass-panel max-w-md w-full p-6 rounded-3xl border border-cyan-500/30 text-white relative animate-float shadow-[0_0_50px_rgba(6,182,212,0.25)]">
            <button
              onClick={() => setShowLeaderboard(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white text-2xl font-black cursor-pointer bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-all"
            >
              ×
            </button>
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
              <div className="max-h-[300px] overflow-y-auto pr-1">
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
                onClick={() => setShowLeaderboard(false)}
                className="w-full rounded-2xl theme-btn py-3 text-base font-bold transition-all hover:scale-102 active:scale-98 shadow-lg cursor-pointer"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 pointer-events-auto">
          <div className={`max-w-md w-full p-6 rounded-3xl border text-white relative animate-float shadow-2xl ${styles.panelClass}`}>
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white text-2xl font-black cursor-pointer bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-all"
            >
              ×
            </button>
            <div className="text-center mb-6">
              <span className="text-4xl">⚙️</span>
              <h2 className="text-2xl font-black neon-text-title tracking-tight mt-2">Settings</h2>
            </div>

            {/* Sound Toggle */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 mb-6">
              <div>
                <h3 className="font-bold text-sm">Game Sound</h3>
                <p className="text-xs text-zinc-400">Toggle all sound effects</p>
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

            {/* Theme Selector */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm px-1">Equipped Theme</h3>
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
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
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
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
    </>
  );
};

