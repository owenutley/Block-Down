import React, { useState, useEffect, useRef, type TouchEvent } from 'react';
import { LevelConfig, GameDifficulty, Position, BlockData } from '../types';
import { playBlockPushSound, playPortalSound, playThudSound, playMatchSound, playWinMelody } from '../utils/audio';
import { startMusic, setMusicTheme, duckMusic, getMusicMuted } from '../utils/bgm';
import { calculateParPushes, calculateStars, getNextPosWithPortalsDetails, dirToVector, formatBlockPushEmojis } from '../utils/puzzle';
import { showToast, canRunAsUser } from '@devvit/web/client';
import { trpc } from '../trpc';
import { ThemeId, ThemeConfig, getBaseThemeId, Theme, THEMES, GameCharacter } from '../../shared/themes';
import { ThemeBoardRenderer, THEME_STYLES } from './ThemeBoardRenderer';
import { TrailId } from '../../shared/trails';
import { TutorialModal } from './TutorialModal';
import { SettingsModal } from './SettingsModal';
import { ScoreCardModal } from './ScoreCardModal';
import { WelcomeModal } from './WelcomeModal';
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
  streak = 0,
  currency = 0,
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
  streak?: number;
  currency?: number;
}) => {
  const [playerPos, setPlayerPos] = useState<Position>(levelConfig.startPos);
  const [blockPositions, setBlockPositions] = useState<BlockData[]>(levelConfig.blocks);
  
  const getDisplayTitle = () => {
    if (title) return title;
    if (levelConfig?.author) {
      const authorName = levelConfig.author.startsWith('u/') ? levelConfig.author : `u/${levelConfig.author}`;
      return `${authorName}'s Challenge`;
    }
    if (levelConfig?.name) return levelConfig.name;
    if (difficulty === 'daily') {
      return `Daily Puzzle ${puzzleNumber && puzzleNumber > 0 ? '#' + puzzleNumber : ''}`;
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
  const [history, setHistory] = useState<{ playerPos: Position; blockPositions: BlockData[]; pushCount: number; blockPushHistory: string[] }[]>([]);
  const [blockPushHistory, setBlockPushHistory] = useState<string[]>([]);
  const [isPostingScore, setIsPostingScore] = useState(false);
  const [scorePosted, setScorePosted] = useState(false);
  const [pushCount, setPushCount] = useState(0);
  const [lastAction, setLastAction] = useState<'push' | 'undo' | 'reset' | 'load' | 'move' | 'teleport'>('load');
  const [solveTime, setSolveTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(activeTheme);
  const [currentCharacter, setCurrentCharacter] = useState<string>(activeCharacter);

  useEffect(() => {
    setCurrentTheme(activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    setCurrentCharacter(activeCharacter);
  }, [activeCharacter]);
  const [_stats, setStats] = useState<{ totalAttempts: number; totalCompletions: number; averageScore: number; bestScore: number; bestTime?: number; bestMoves?: number } | null>(null);
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

  const [isSubscribed, setIsSubscribed] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const checkSubscription = async () => {
    try {
      const res = await trpc.subreddit.isSubscribed.query();
      setIsSubscribed(res.subscribed);
    } catch (e) {
      console.error('Failed to check subscription:', e);
    }
  };

  useEffect(() => {
    void checkSubscription();
  }, []);

  const handleSubscribeSubreddit = async () => {
    try {
      setIsSubscribing(true);
      const res = await trpc.subreddit.subscribe.mutate();
      if (res?.success) {
        showToast({
          text: 'Subscribed! Retro Arcade theme and character unlocked!',
          appearance: 'success',
        });
        setIsSubscribed(true);
        refreshCurrency?.();
      }
    } catch (err) {
      console.error('Failed to subscribe:', err);
      showToast({
        text: 'Failed to subscribe to subreddit',
        appearance: 'neutral',
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  useEffect(() => {
    trpc.init.get.query()
      .then(res => {
        if (res.username) setUsername(res.username);
      })
      .catch(() => {});
  }, []);

  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const hasCheckedWelcomeRef = useRef(false);

  useEffect(() => {
    setAlreadyCompleted(false);
    trpc.campaign.get.query()
      .then((res) => {
        if (puzzleId && res.completedIds && res.completedIds.includes(puzzleId)) {
          setAlreadyCompleted(true);
        }
        if (!hasCheckedWelcomeRef.current) {
          hasCheckedWelcomeRef.current = true;
          const hasSolvedAny = Boolean(res.completedIds && res.completedIds.length > 0);
          if (!hasSolvedAny) {
            setShowWelcomeModal(true);
          }
        }
      })
      .catch((err: unknown) => console.error('Failed to load completed status:', err));
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
    setBlockPushHistory([]);
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
    setIsPostingScore(false);
    setScorePosted(false);
  }, [levelConfig]);

  // Sync background music theme with active theme
  useEffect(() => {
    setMusicTheme(currentTheme);
  }, [currentTheme]);

  // Autoplay on first user interaction in accordance with browser policies
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!getMusicMuted()) {
        startMusic();
      }
    };

    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  useEffect(() => {
    if (puzzleId) {
      trpc.puzzle.getStats.query(puzzleId)
        .then(setStats)
        .catch(err => console.error('Failed to load stats:', err));
    }
  }, [puzzleId, isWon]);

  // Record unique attempt on mount and award start bonus if applicable
  useEffect(() => {
    if (puzzleId) {
      trpc.puzzle.recordAttempt.mutate({ puzzleId })
        .then((res) => {
          if (res.startBonus && res.startBonus > 0) {
            showToast({ text: `Daily Challenge Started! +${res.startBonus} Shards` });
          }
        })
        .catch(err => console.error('Failed to record attempt:', err));
    }
  }, [puzzleId]);

  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  // Keep track of previous player and block positions across moves
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
        duckMusic(2500);
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

            // Re-fetch leaderboard to include user's newly recorded completion score
            trpc.puzzle.getLeaderboard.query(puzzleId)
              .then(setLeaderboardEntries)
              .catch(err => console.error('Failed to update leaderboard:', err));
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

  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAnimationTimers = () => {
    animationTimersRef.current.forEach(t => clearTimeout(t));
    animationTimersRef.current = [];
  };

  useEffect(() => {
    return () => {
      clearAnimationTimers();
    };
  }, []);

  const movePlayer = (direction: Position) => {
    if (isPuzzleSolved || isWon || isAnimating) return;

    // Check if character is standing on a portal and moving in the direction of the portal
    const portals = levelConfig.portals || [];
    const portalOnCurrentCell = portals.find(
      p => p.x === playerPos.x && p.y === playerPos.y
    );

    if (portalOnCurrentCell) {
      const portalVec = dirToVector(portalOnCurrentCell.dir);
      if (portalVec.x === -direction.x && portalVec.y === -direction.y) {
        const exitPortal = portals.find(
          p => p.color.toLowerCase() === portalOnCurrentCell.color.toLowerCase() && p.id !== portalOnCurrentCell.id
        );

        if (exitPortal) {
          const exitPos = { x: exitPortal.x, y: exitPortal.y };
          const isExitWallOrBound =
            exitPos.x < 0 || exitPos.x >= levelConfig.gridSize ||
            exitPos.y < 0 || exitPos.y >= levelConfig.gridSize ||
            wallSet.has(positionKey(exitPos));

          if (!isExitWallOrBound) {
            const blockIdxAtExit = blockMap.get(positionKey(exitPos));

            if (blockIdxAtExit !== undefined) {
              const block = blockPositions[blockIdxAtExit];
              if (block) {
                const exitDir = dirToVector(exitPortal.dir);
                const trajectory = getNextPosWithPortalsDetails(
                  block.pos,
                  exitDir,
                  levelConfig.gridSize,
                  wallSet,
                  blockPositions.map(b => b.pos),
                  portals
                );
                const blockNewPos = trajectory.finalPos;

                if (blockNewPos.x !== block.pos.x || blockNewPos.y !== block.pos.y) {
                  let didBlockMatch = false;
                  const destAtNew = destinationMap.get(positionKey(blockNewPos));
                  if (destAtNew && destAtNew.type === block.type) {
                    didBlockMatch = true;
                  }

                  // Save pristine history snapshot before move/animation
                  const nextPushHistory = [...blockPushHistory, block.type];
                  setBlockPushHistory(nextPushHistory);
                  setHistory(prev => [...prev, { playerPos, blockPositions, pushCount, blockPushHistory }]);
                  prevPlayerPos.current = playerPos;
                  prevBlockPositions.current = blockPositions;
                  setPlayerPos(exitPos);
                  setPushCount(prev => prev + 1);
                  setLastAction('teleport');

                  playBlockPushSound();

                  const runMultiPortalAnimation = async () => {
                    setIsAnimating(true);
                    const steps = trajectory.steps || [];

                    for (let i = 0; i < steps.length; i++) {
                      const step = steps[i];
                      if (!step) continue;

                      const dist = Math.abs(step.from.x - step.to.x) + Math.abs(step.from.y - step.to.y);
                      if (dist > 0) {
                        const slideDuration = Math.max(90, dist * 60);
                        setBlockPositions(prev =>
                          prev.map((b, idx) => (idx === blockIdxAtExit ? { ...b, pos: step.to, noTransition: false } : b))
                        );
                        await new Promise(resolve => {
                          const t = setTimeout(resolve, slideDuration);
                          animationTimersRef.current.push(t);
                        });
                      }

                      if (step.entryPortal && step.exitPortal) {
                        const exitCell = { x: step.exitPortal.x, y: step.exitPortal.y };
                        prevBlockPositions.current = prevBlockPositions.current.map((b, idx) =>
                          idx === blockIdxAtExit ? { ...b, pos: exitCell } : b
                        );
                        setBlockPositions(prev =>
                          prev.map((b, idx) => (idx === blockIdxAtExit ? { ...b, pos: exitCell, noTransition: true } : b))
                        );
                        await new Promise(resolve => {
                          const t = setTimeout(resolve, 50);
                          animationTimersRef.current.push(t);
                        });
                      }
                    }

                    // Set final block position
                    setBlockPositions(prev =>
                      prev.map((b, idx) => (idx === blockIdxAtExit ? { ...b, pos: blockNewPos, noTransition: false } : b))
                    );

                    if (didBlockMatch) {
                      const currentMatched = levelConfig.destinations.filter(destination =>
                        blockPositions.some(b =>
                          (b.pos.x === destination.pos.x && b.pos.y === destination.pos.y && b.type === destination.type)
                        )
                      ).length;
                      playMatchSound(currentMatched - 1);
                      setShakeLevel('sm');
                      setTimeout(() => setShakeLevel('none'), 140);
                    }

                    setIsAnimating(false);
                  };

                  void runMultiPortalAnimation();
                  return;
                } else {
                  playThudSound();
                  return;
                }
              }
            }

            // Simple player teleport without block push
            playPortalSound();
            setHistory(prev => [...prev, { playerPos, blockPositions, pushCount, blockPushHistory }]);
            setPlayerPos(exitPos);
            setLastAction('teleport');
            return;
          }
        }
      }
    }

    const newPos = { x: playerPos.x + direction.x, y: playerPos.y + direction.y };

    if (!canOccupy(newPos, false)) {
      playThudSound();
      return;
    }

    const blockIdx = blockMap.get(positionKey(newPos));
    if (blockIdx !== undefined) {
      const block = blockPositions[blockIdx];
      if (!block) return;
      const oldBlockPos = block.pos;
      const trajectory = getNextPosWithPortalsDetails(
        oldBlockPos,
        direction,
        levelConfig.gridSize,
        wallSet,
        blockPositions.map(b => b.pos),
        levelConfig.portals || []
      );
      const blockNewPos = trajectory.finalPos;

      // Only allow movement if the block actually moved
      if (blockNewPos.x === oldBlockPos.x && blockNewPos.y === oldBlockPos.y) {
        playThudSound();
        return;
      }

      let didBlockMatch = false;
      const destAtNew = destinationMap.get(positionKey(blockNewPos));
      if (destAtNew && destAtNew.type === block.type) {
        didBlockMatch = true;
      }

      // Save pristine state snapshot in history before any move/animation
      prevPlayerPos.current = playerPos;
      prevBlockPositions.current = blockPositions;

      const nextPushHistory = [...blockPushHistory, block.type];
      setBlockPushHistory(nextPushHistory);
      setHistory(prev => [...prev, { playerPos, blockPositions, pushCount, blockPushHistory }]);
      setPlayerPos(newPos);
      setPushCount(prev => prev + 1);
      setLastAction('push');

      playBlockPushSound();

      const runMultiPortalAnimation = async () => {
        setIsAnimating(true);
        const steps = trajectory.steps || [];

        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          if (!step) continue;

          const dist = Math.abs(step.from.x - step.to.x) + Math.abs(step.from.y - step.to.y);
          if (dist > 0) {
            const slideDuration = Math.max(90, dist * 60);
            setBlockPositions(prev =>
              prev.map((b, idx) => (idx === blockIdx ? { ...b, pos: step.to, noTransition: false } : b))
            );
            await new Promise(resolve => {
              const t = setTimeout(resolve, slideDuration);
              animationTimersRef.current.push(t);
            });
          }

          if (step.entryPortal && step.exitPortal) {
            const exitCell = { x: step.exitPortal.x, y: step.exitPortal.y };
            prevBlockPositions.current = prevBlockPositions.current.map((b, idx) =>
              idx === blockIdx ? { ...b, pos: exitCell } : b
            );
            setBlockPositions(prev =>
              prev.map((b, idx) => (idx === blockIdx ? { ...b, pos: exitCell, noTransition: true } : b))
            );
            await new Promise(resolve => {
              const t = setTimeout(resolve, 50);
              animationTimersRef.current.push(t);
            });
          }
        }

        // Finalize block position at destination
        setBlockPositions(prev =>
          prev.map((b, idx) => (idx === blockIdx ? { ...b, pos: blockNewPos, noTransition: false } : b))
        );

        if (didBlockMatch) {
          const currentMatched = levelConfig.destinations.filter(destination =>
            blockPositions.some(b =>
              (b.pos.x === destination.pos.x && b.pos.y === destination.pos.y && b.type === destination.type)
            )
          ).length;
          playMatchSound(currentMatched - 1);
          setShakeLevel('sm');
          setTimeout(() => setShakeLevel('none'), 140);
        }

        setIsAnimating(false);
      };

      void runMultiPortalAnimation();
      return;
    }

    // Normal player movement without pushing a block
    prevPlayerPos.current = playerPos;
    prevBlockPositions.current = blockPositions;

    setHistory(prev => [...prev, { playerPos, blockPositions, pushCount, blockPushHistory }]);
    setPlayerPos(newPos);
    setLastAction('move');
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
    if (!move) return;

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
  const animFrameIdRef = useRef<number | null>(null);

  const startAnimLoop = () => {
    if (animFrameIdRef.current !== null) return;

    const loop = (timestamp: number) => {
      if (keysDown.current.size === 0 || autoplayIndex !== null || showWelcomeModal || showSettings || showLeaderboard || showTutorial || showScoreCard || isPuzzleSolved || isWon || isAnimating) {
        keysDown.current.clear();
        if (animFrameIdRef.current !== null) {
          cancelAnimationFrame(animFrameIdRef.current);
          animFrameIdRef.current = null;
        }
        return;
      }

      if (timestamp - lastMoveTime.current >= moveInterval) {
        let moved = false;

        if (keysDown.current.has('ArrowUp')) {
          movePlayerRef.current({ x: 0, y: -1 });
          moved = true;
        } else if (keysDown.current.has('ArrowDown')) {
          movePlayerRef.current({ x: 0, y: 1 });
          moved = true;
        } else if (keysDown.current.has('ArrowLeft')) {
          movePlayerRef.current({ x: -1, y: 0 });
          moved = true;
        } else if (keysDown.current.has('ArrowRight')) {
          movePlayerRef.current({ x: 1, y: 0 });
          moved = true;
        }

        if (moved) {
          lastMoveTime.current = timestamp;
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
  };

  const stopAnimLoop = () => {
    if (animFrameIdRef.current !== null) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
  };

  const handleUndo = () => {
    setAutoplayIndex(null);
    if (history.length === 0 || isWon || isAnimating) return;
    const targetState = history[history.length - 1];
    if (!targetState) return;
    clearAnimationTimers();
    prevPlayerPos.current = playerPos;
    prevBlockPositions.current = blockPositions;
    setHistory(prev => prev.slice(0, -1));
    setPlayerPos(targetState.playerPos);
    setBlockPositions(targetState.blockPositions);
    setPushCount(targetState.pushCount);
    setBlockPushHistory(targetState.blockPushHistory || []);
    setLastAction('undo');
    setIsAnimating(false);
  };

  const handleReset = () => {
    setAutoplayIndex(null);
    clearAnimationTimers();
    setIsAnimating(false);
    prevPlayerPos.current = levelConfig.startPos;
    prevBlockPositions.current = levelConfig.blocks;
    setPlayerPos(levelConfig.startPos);
    setBlockPositions(levelConfig.blocks);
    setHistory([]);
    setBlockPushHistory([]);
    setPushCount(0);
    setSolveTime(null);
    setElapsedSeconds(0);
    startTimeRef.current = Date.now();
    setIsPuzzleSolved(false);
    setIsWon(false);
    setRewardedAmount(null);
    setShakeLevel('none');
    setLastAction('reset');
    setIsPostingScore(false);
    setScorePosted(false);
  };


  const handlePostScoreComment = async (e?: React.MouseEvent) => {
    if (isPostingScore || scorePosted) return;
    try {
      setIsPostingScore(true);
      if (!e?.nativeEvent) {
        showToast({
          text: 'Permission to post on your behalf was not granted.',
          appearance: 'neutral',
        });
        return;
      }
      const hasPermission = await canRunAsUser(e.nativeEvent);
      if (!hasPermission) {
        showToast({
          text: 'Permission to post on your behalf was not granted.',
          appearance: 'neutral',
        });
        return;
      }
      const emojiString = formatBlockPushEmojis(blockPushHistory);
      const res = await trpc.puzzle.postScoreComment.mutate({
        title: getDisplayTitle(),
        puzzleId,
        pushes: pushCount,
        par,
        moves: history.length,
        solveTime: solveTime || elapsedSeconds,
        stars,
        streak: streakInfo?.currentStreak,
        blockOrderEmojis: emojiString,
      });

      if (res.success) {
        setScorePosted(true);
        showToast({
          text: 'Score posted under --SCORES-- comment! 🏆',
          appearance: 'success',
        });
      } else {
        showToast({
          text: res.reason || 'Failed to post score comment.',
          appearance: 'neutral',
        });
      }
    } catch (err) {
      console.error('Error posting score comment:', err);
      showToast({
        text: 'Failed to post score comment to Reddit.',
        appearance: 'neutral',
      });
    } finally {
      setIsPostingScore(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) {
        return;
      }

      if (showWelcomeModal || showSettings || showLeaderboard || showTutorial || showScoreCard) {
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
          const wasEmpty = keysDown.current.size === 0;
          keysDown.current.add(e.key);
          if (wasEmpty) {
            lastMoveTime.current = performance.now();

            switch (e.key) {
              case 'ArrowUp': movePlayerRef.current({ x: 0, y: -1 }); break;
              case 'ArrowDown': movePlayerRef.current({ x: 0, y: 1 }); break;
              case 'ArrowLeft': movePlayerRef.current({ x: -1, y: 0 }); break;
              case 'ArrowRight': movePlayerRef.current({ x: 1, y: 0 }); break;
            }
            startAnimLoop();
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
      if (showWelcomeModal || showSettings || showLeaderboard || showTutorial || showScoreCard) {
        return;
      }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        keysDown.current.delete(e.key);
        if (keysDown.current.size === 0) {
          stopAnimLoop();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      stopAnimLoop();
    };
  }, [history, isWon, autoplayIndex, isModerator, levelConfig, showWelcomeModal, showSettings, showLeaderboard, showTutorial, showScoreCard]);

  const handleTouchStart = (e: TouchEvent) => {
    if (autoplayIndex !== null || showWelcomeModal || showSettings || showLeaderboard || showTutorial || showScoreCard || isPuzzleSolved || isWon) return;
    const touch = e.touches[0];
    if (touch) {
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    if (autoplayIndex !== null || showWelcomeModal || showSettings || showLeaderboard || showTutorial || showScoreCard || isPuzzleSolved || isWon) return;
    if (!touchStartPos.current) return;

    const touch = e.touches[0];
    if (!touch) return;

    const dx = touch.clientX - touchStartPos.current.x;
    const dy = touch.clientY - touchStartPos.current.y;
    const threshold = 50;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > threshold) {
        movePlayer({ x: dx > 0 ? 1 : -1, y: 0 });
        touchStartPos.current = { x: touch.clientX, y: touch.clientY };
      }
    } else {
      if (Math.abs(dy) > threshold) {
        movePlayer({ x: 0, y: dy > 0 ? 1 : -1 });
        touchStartPos.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (autoplayIndex !== null || showWelcomeModal || showSettings || showLeaderboard || showTutorial || showScoreCard || isPuzzleSolved || isWon) return;
    if (!touchStartPos.current) return;

    const touch = e.changedTouches[0];
    if (touch) {
      const dx = touch.clientX - touchStartPos.current.x;
      const dy = touch.clientY - touchStartPos.current.y;
      const threshold = 50;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > threshold) {
          movePlayer({ x: dx > 0 ? 1 : -1, y: 0 });
        }
      } else {
        if (Math.abs(dy) > threshold) {
          movePlayer({ x: 0, y: dy > 0 ? 1 : -1 });
        }
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
    setCurrentTheme(themeId);
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

  const handleCharacterSelect = async (charId: string) => {
    setCurrentCharacter(charId);
    if (onEquipCharacter) {
      await onEquipCharacter(charId);
    } else {
      try {
        await trpc.shop.setActiveCharacter.mutate({ characterId: charId });
      } catch (err) {
        console.error('Failed to set active character:', err);
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

  const effectiveTheme = currentTheme;
  const effectiveThemeStyle = themes?.find((t) => t.id === effectiveTheme) || activeThemeStyle;
  const baseThemeId = getBaseThemeId(effectiveTheme);
  const defaultStyles = THEME_STYLES[baseThemeId] || THEME_STYLES.neon;
  const styles = {
    bgClass: effectiveThemeStyle?.bgGradient || defaultStyles.bgClass,
    panelClass: effectiveThemeStyle?.panelClass || defaultStyles.panelClass,
    cellClass: effectiveThemeStyle?.cellClass || defaultStyles.cellClass,
    wallClass: effectiveThemeStyle?.wallClass || defaultStyles.wallClass,
  };

  return (
    <>
      {isWon ? (
        <div className={`flex min-h-[100dvh] max-h-[100dvh] flex-col items-center justify-center ${styles.bgClass} px-3 sm:px-4 py-3 relative overflow-y-auto no-scrollbar`}>
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

          <div className={`text-center ${styles.panelClass} p-4 sm:p-6 animate-float max-w-md w-full relative z-10 shadow-2xl flex flex-col gap-2 sm:gap-3 max-h-[96vh] overflow-y-auto no-scrollbar`}>
            <h1 className="text-3xl sm:text-5xl font-black text-white drop-shadow-md">You Won!</h1>
            
            {/* 3-Star Rating Animated Display */}
            <div className="flex items-center justify-center gap-2.5 my-0.5">
              {[1, 2, 3].map((starIdx) => {
                const isEarned = starIdx <= stars;
                return (
                  <div
                    key={starIdx}
                    className={`text-3xl sm:text-4xl transition-all duration-500 ${
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

            {/* Shard and Streak Rewards */}
            {(rewardedAmount !== null && rewardedAmount > 0) || (streakInfo && streakInfo.streakBonus !== undefined && streakInfo.streakBonus > 0) ? (
              <div className="flex flex-col gap-1 sm:gap-1.5 my-0.5">
                {rewardedAmount !== null && rewardedAmount > 0 && (
                  <div className="animate-pulse text-xs font-extrabold text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] bg-cyan-950/40 border border-cyan-500/30 rounded-xl py-1 px-3 inline-flex items-center gap-1.5 justify-center">
                    <span className="text-cyan-400 text-xs sm:text-sm">✦</span>
                    <span>+{rewardedAmount} Neon Shards!</span>
                  </div>
                )}

                {streakInfo && streakInfo.streakBonus !== undefined && streakInfo.streakBonus > 0 && (
                  <div className="text-xs font-extrabold text-red-300 bg-red-950/60 border border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.3)] rounded-xl py-1 px-3 inline-flex items-center gap-1.5 justify-center">
                    <div className="w-3.5 h-3.5 bg-red-500/20 border border-red-400/40 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] flex items-center justify-center text-red-400 p-0.5 shrink-0">
                      <PuzzleShape shape="fire" className="w-full h-full" />
                    </div>
                    <span>{streakInfo.currentStreak}-Day Streak Bonus!</span>
                    <span className="text-yellow-400 font-mono font-bold">(+{streakInfo.streakBonus} ✦)</span>
                  </div>
                )}
              </div>
            ) : null}

            {/* Leaderboard Section */}
            <div className="bg-black/30 border border-amber-500/30 rounded-xl p-2.5 sm:p-3 text-left">
              <div className="text-xs sm:text-xs font-extrabold text-amber-400 uppercase tracking-wider mb-1.5 border-b border-amber-500/20 pb-1 flex items-center justify-between">
                <span>🏆 Leaderboard</span>
                {puzzleId && <span className="text-[10px] text-zinc-400 lowercase font-normal">global</span>}
              </div>
              {loadingLeaderboard ? (
                <div className="py-2 text-center text-xs text-zinc-400 animate-pulse">
                  Loading leaderboard...
                </div>
              ) : leaderboardEntries.length > 0 ? (
                <div className="space-y-1">
                  {/* Top 3 entries */}
                  {leaderboardEntries.slice(0, 3).map((entry, idx) => {
                    const isYou = username && entry.username.toLowerCase() === username.toLowerCase();
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between px-2.5 py-1 rounded-lg text-xs transition-all ${
                          isYou
                            ? 'bg-cyan-500/20 border border-cyan-400/60 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                            : 'bg-white/5 border border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-bold text-amber-300 w-4 shrink-0 text-center text-xs">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                          </span>
                          <span className={`font-semibold truncate ${isYou ? 'text-cyan-300 font-bold' : 'text-zinc-200'}`}>
                            u/{entry.username}
                          </span>
                          {isYou && (
                            <span className="bg-cyan-500/30 text-cyan-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-cyan-400/40 shrink-0">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px] shrink-0 text-zinc-300">
                          <span><strong className="text-cyan-400">{entry.score}</strong>p</span>
                          <span><strong className="text-cyan-400">{entry.moveCount}</strong>m</span>
                          <span className="text-amber-300 font-bold">{formatTime(entry.solveTime)}</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* If current user is in leaderboard outside top 3 (Rank #4+) */}
                  {(() => {
                    if (!username) return null;
                    const userRankIdx = leaderboardEntries.findIndex(
                      e => e.username.toLowerCase() === username.toLowerCase()
                    );
                    if (userRankIdx >= 3 && leaderboardEntries[userRankIdx]) {
                      const userEntry = leaderboardEntries[userRankIdx]!;
                      return (
                        <>
                          <div className="text-center text-[9px] text-zinc-500 py-0.5 font-mono">•••</div>
                          <div className="flex items-center justify-between px-2.5 py-1 rounded-lg text-xs bg-cyan-500/20 border border-cyan-400/60 shadow-[0_0_12px_rgba(34,211,238,0.3)]">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-bold text-zinc-400 w-4 shrink-0 text-center font-mono text-[10px]">
                                #{userRankIdx + 1}
                              </span>
                              <span className="font-semibold text-cyan-300 truncate">
                                u/{userEntry.username}
                              </span>
                              <span className="bg-cyan-500/30 text-cyan-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-cyan-400/40 shrink-0">
                                YOU
                              </span>
                            </div>
                            <div className="flex items-center gap-2 font-mono text-[11px] shrink-0 text-zinc-300">
                              <span><strong className="text-cyan-400">{userEntry.score}</strong>p</span>
                              <span><strong className="text-cyan-400">{userEntry.moveCount}</strong>m</span>
                              <span className="text-amber-300 font-bold">{formatTime(userEntry.solveTime)}</span>
                            </div>
                          </div>
                        </>
                      );
                    }
                    return null;
                  })()}
                </div>
              ) : (
                /* Fallback displaying user's current run as #1 */
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-2.5 py-1 rounded-lg text-xs bg-cyan-500/20 border border-cyan-400/60 shadow-[0_0_12px_rgba(34,211,238,0.3)]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-amber-300 w-4 shrink-0 text-center text-xs">🥇</span>
                      <span className="font-semibold text-cyan-300 truncate">
                        u/{username || 'you'}
                      </span>
                      <span className="bg-cyan-500/30 text-cyan-300 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-cyan-400/40 shrink-0">
                        YOU
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px] shrink-0 text-zinc-300">
                      <span><strong className="text-cyan-400">{pushCount}</strong>p</span>
                      <span><strong className="text-cyan-400">{history.length}</strong>m</span>
                      <span className="text-amber-300 font-bold">{solveTime ? formatTime(solveTime) : '-'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Block Push Order Preview */}
            {blockPushHistory.length > 0 && (
              <div className="bg-black/40 border border-cyan-500/30 rounded-xl p-2 text-center my-0">
                <div className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider mb-0.5">
                  🧩 Block Push Order ({blockPushHistory.length})
                </div>
                <div className="text-xs sm:text-sm font-mono tracking-wider break-words max-h-12 overflow-y-auto no-scrollbar py-0.5 select-all">
                  {formatBlockPushEmojis(blockPushHistory)}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-1.5 w-full mt-1">
              <button
                onClick={handlePostScoreComment}
                disabled={isPostingScore || scorePosted}
                className="rounded-xl theme-btn py-2 sm:py-2.5 text-xs sm:text-sm font-extrabold cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] bg-gradient-to-r from-cyan-600 to-blue-600 border border-cyan-400/60 shadow-[0_0_18px_rgba(6,182,212,0.35)] disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {scorePosted ? 'Score Posted in Comments ✓' : isPostingScore ? 'Posting Score...' : 'Share Score in Comments'}
              </button>
              <button
                onClick={handleReset}
                className="rounded-xl theme-btn py-2 sm:py-2.5 text-xs sm:text-sm font-bold cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                Play Again
              </button>
              {hasNextLevel && (
                <button
                  onClick={onNextLevel}
                  className="rounded-xl theme-btn py-2 sm:py-2.5 text-xs sm:text-sm font-bold cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                >
                  Continue to Next Level
                </button>
              )}
              <button
                onClick={onReturnToMenu}
                className="rounded-xl theme-btn py-2 sm:py-2.5 text-xs sm:text-sm font-bold cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                Return to {difficulty ? 'Menu' : 'Campaign'}
              </button>
              {!isSubscribed && (
                <button
                  onClick={handleSubscribeSubreddit}
                  disabled={isSubscribing}
                  className="rounded-xl theme-btn py-2 sm:py-2.5 text-xs sm:text-sm font-extrabold cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 border border-purple-400/60 shadow-[0_0_18px_rgba(168,85,247,0.35)] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <span>{isSubscribing ? 'Subscribing...' : 'Subscribe for Retro Arcade Theme'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          tabIndex={-1}
          className={`flex h-[100dvh] w-full flex-col ${styles.bgClass} px-2 sm:px-4 pt-3 pb-2 sm:pt-4 sm:pb-6 outline-none overflow-hidden touch-none select-none overscroll-none`}
        >
          {/* Top Row: Navigation and Live Stats HUD */}
          <div className="flex flex-col gap-2 mb-2 sm:mb-4 w-full max-w-4xl mx-auto">
            {/* Row 1: Menu button, Puzzle Name, Streak & Credits */}
            <div className="flex items-center justify-between gap-2 w-full">
              {/* Left: Menu and Puzzle title */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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
                  {!levelConfig.author && (
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="text-zinc-400">Par: {par} pushes</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Streak and Credit Count */}
              <div className="flex items-center gap-2 shrink-0">
                {streak > 0 && (
                  <div className="flex items-center gap-1.5 bg-red-950/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.35)] select-none" title={`${streak} Day Streak!`}>
                    <div className="w-4 h-4 bg-red-500/20 border border-red-400/40 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] flex items-center justify-center text-red-400 p-0.5 shrink-0">
                      <PuzzleShape shape="fire" className="w-full h-full" />
                    </div>
                    <span className="text-red-300 font-black text-[11px] tracking-wide font-mono">
                      {streak}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)] hover:border-cyan-400/50 transition-all select-none" title="Credits / Neon Shards">
                  <span className="text-cyan-400 text-[13px] font-black animate-pulse drop-shadow-[0_0_3px_rgba(34,211,238,0.8)]">✦</span>
                  <span className="text-white font-extrabold text-[11px] tracking-wide font-mono">
                    {currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Row 2: Arrow Buttons (Left), Reset/Undo/Settings (Right) */}
            <div className="flex items-center justify-between w-full gap-2 mt-0.5 sm:mt-1">
              {/* Left: Arrow Buttons */}
              <div className="flex items-center justify-start gap-1 sm:gap-1.5">
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
              </div>

              {/* Right Action buttons: Undo, Reset, Settings */}
              <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                <button
                  onClick={handleUndo}
                  disabled={history.length === 0 || isWon || isAnimating}
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
                  className="px-2.5 sm:px-3 h-7 sm:h-8 rounded-lg text-[11px] sm:text-xs font-bold theme-btn flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Reset puzzle (R)"
                >
                  <svg className="w-3.5 h-3.5 text-white shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  <span>Reset</span>
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

            {/* Row 3: Live Stats HUD Pill (On its own line!) */}
            <div className="flex items-center justify-center w-full mt-0.5 sm:mt-1">
              <div className="flex items-center gap-2.5 sm:gap-4 bg-black/60 backdrop-blur-md px-3.5 py-1 rounded-full border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)] select-none">
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
            </div>
          </div>

          <div
            className="flex-1 flex items-center justify-center w-full overflow-visible px-3 py-1 touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <ThemeBoardRenderer
              gridSize={levelConfig.gridSize}
              walls={levelConfig.walls}
              destinations={levelConfig.destinations}
              blocks={blockPositions}
              portals={levelConfig.portals || []}
              playerPos={playerPos}
              activeTheme={currentTheme}
              themeConfig={themeConfig}
              isAnimated={true}
              prevBlocks={prevBlockPositions.current}
              prevPlayerPos={prevPlayerPos.current}
              activeThemeStyle={effectiveThemeStyle}
              activeTrail={activeTrail}
              lastAction={lastAction}
              activeCharacter={currentCharacter}
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
          onPostScore={handlePostScoreComment}
          isPostingScore={isPostingScore}
          scorePosted={scorePosted}
          onClose={() => setShowScoreCard(false)}
        />
      )}

      {/* Game Entry Welcome Modal */}
      {showWelcomeModal && (
        <WelcomeModal
          onPlayNow={() => setShowWelcomeModal(false)}
          onHowToPlay={() => {
            setShowWelcomeModal(false);
            setShowTutorial(true);
          }}
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
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        activeTheme={currentTheme}
        purchasedThemes={purchasedThemes}
        themes={themes}
        onEquipTheme={handleThemeSelect}
        activeCharacter={currentCharacter}
        purchasedCharacters={purchasedCharacters}
        characters={characters}
        onEquipCharacter={handleCharacterSelect}
        onHowToPlay={() => {
          setShowSettings(false);
          setShowTutorial(true);
        }}
        onOpenLeaderboard={puzzleId ? handleOpenLeaderboard : undefined}
        panelClass={styles.panelClass}
      />

      {/* Tutorial Modal */}
      {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} activeTheme={effectiveTheme} />}
    </>
  );
};
