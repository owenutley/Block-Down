import React, { useState, useEffect, useRef, type TouchEvent } from 'react';
import { LevelConfig, GameDifficulty, Position, BlockData } from '../types';
import { playBlockPushSound, playPortalSound, playThudSound, playMatchSound, playUnmatchSound, playWinMelody, playUndoSound } from '../utils/audio';
import { startMusic, setMusicTheme, duckMusic, getMusicMuted } from '../utils/bgm';
import { calculateParPushes, calculateStars, getNextPosWithPortalsDetails, dirToVector, formatBlockPushEmojis } from '../utils/puzzle';
import { showToast, canRunAsUser } from '@devvit/web/client';
import { trpc } from '../trpc';
import { trackClientEvent } from '../utils/analytics';
import { ThemeId, ThemeConfig, getBaseThemeId, Theme, THEMES, GameCharacter } from '../../shared/themes';
import { ThemeBoardRenderer, THEME_STYLES } from './ThemeBoardRenderer';
import { TrailId, Trail, TRAILS } from '../../shared/trails';
import { TutorialModal } from './TutorialModal';
import { SettingsModal } from './SettingsModal';
import { ScoreCardModal } from './ScoreCardModal';
import { WelcomeModal } from './WelcomeModal';
import { MiniTutorialModal } from './MiniTutorialModal';
import { PuzzleShape } from './PuzzleShape';
import { LightWhispIcon } from './LightWhispIcon';
import { cn } from '../utils';
import { DailyTier, DailyTierInfo, DailyFormatVersion } from '../../shared/types';
import { DifficultyBadge } from './DifficultyBadge';
import { DailyTierDropdown } from './DailyTierDropdown';
import { getTierMeta } from '../../shared/difficultyTiers';
import { SplashLoader } from './SplashLoader';
import { StarParMeter } from './StarParMeter';
import { getShowCoordinates } from '../utils/boardCoordinates';

const formatCompactCurrency = (amount: number): string => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (amount >= 10000) {
    return `${(amount / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return amount.toLocaleString();
};

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
  purchasedTrails = ['none'],
  trails = TRAILS,
  onEquipTrail,
  streak = 0,
  currency = 0,
  isCampaign = false,
  dailyTier,
  dailyFormat = 'v1_two_tier',
  tiersData,
  allTiersData,
  onSwitchDailyTier,
  onPlayMainDaily,
  hasClaimedDailyShareReward,
  isStoryMode = false,
  storyChapter,
  storyChamber,
  onChamberComplete,
}: {
  levelConfig: LevelConfig;
  difficulty?: GameDifficulty;
  isCampaign?: boolean | undefined;
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
  purchasedTrails?: TrailId[] | undefined;
  trails?: Trail[] | undefined;
  onEquipTrail?: ((trailId: TrailId) => Promise<unknown> | undefined) | undefined;
  streak?: number;
  currency?: number;
  dailyTier?: DailyTier | undefined;
  dailyFormat?: DailyFormatVersion | undefined;
  tiersData?: { easy: DailyTierInfo; standard: DailyTierInfo } | null | undefined;
  allTiersData?: DailyTierInfo[] | undefined;
  onSwitchDailyTier?: ((tier: DailyTier) => void) | undefined;
  onPlayMainDaily?: (() => void) | undefined;
  hasClaimedDailyShareReward?: boolean | undefined;
  isStoryMode?: boolean | undefined;
  storyChapter?: number | undefined;
  storyChamber?: number | undefined;
  onChamberComplete?: (() => void) | undefined;
}) => {
  const [playerPos, setPlayerPos] = useState<Position>(levelConfig.startPos);
  const [blockPositions, setBlockPositions] = useState<BlockData[]>(levelConfig.blocks);
  const [claimedShareRewardToday, setClaimedShareRewardToday] = useState<boolean>(hasClaimedDailyShareReward || false);
  const [showCoordinates, setShowCoordinates] = useState<boolean>(() => getShowCoordinates());
  const [isDoorUnlocked, setIsDoorUnlocked] = useState(false);

  useEffect(() => {
    if (hasClaimedDailyShareReward !== undefined) {
      setClaimedShareRewardToday(hasClaimedDailyShareReward);
    } else {
      trpc.progress.hasClaimedShareReward.query()
        .then((claimed) => setClaimedShareRewardToday(claimed))
        .catch(() => {});
    }
  }, [hasClaimedDailyShareReward]);
  
  const getDisplayTitle = () => {
    if (isStoryMode && storyChapter && storyChamber) {
      return `Chapter ${storyChapter} · Chamber ${storyChamber}`;
    }
    if (title) return title;
    if (levelConfig?.author) {
      return 'Player Made Puzzle';
    }
    if (levelConfig?.name) return levelConfig.name;
    if (difficulty === 'daily') {
      if (dailyFormat === 'v1_two_tier') {
        if (dailyTier === 'easy') {
          return `Daily #${puzzleNumber && puzzleNumber > 0 ? puzzleNumber : ''} Warm-Up`;
        }
        return `Daily Puzzle ${puzzleNumber && puzzleNumber > 0 ? '#' + puzzleNumber : ''}`;
      }
      const tierMeta = getTierMeta(dailyTier || 'standard');
      const numStr = puzzleNumber && puzzleNumber > 0 ? `#${puzzleNumber} ` : '';
      return `Daily ${numStr}[${tierMeta.name}]`;
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

  const isShareable =
    !isCampaign &&
    difficulty !== 'easy' &&
    difficulty !== 'medium' &&
    difficulty !== 'hard' &&
    difficulty !== 'tutorial';

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
  const [currentTrail, setCurrentTrail] = useState<TrailId>(activeTrail);

  useEffect(() => {
    setCurrentTheme(activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    setCurrentCharacter(activeCharacter);
  }, [activeCharacter]);

  useEffect(() => {
    setCurrentTrail(activeTrail);
  }, [activeTrail]);
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
  const [showInteractiveTutorial, setShowInteractiveTutorial] = useState(false);
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
      .then((res) => setIsModerator(res.isModerator))
      .catch((err: unknown) => console.error('Failed to check moderator status:', err));
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

  useEffect(() => {
    trackClientEvent('game_start');
    if (puzzleId) {
      trpc.puzzle.recordAttempt.mutate({ puzzleId })
        .then((res) => {
          if (res.startBonus && res.startBonus > 0) {
            showToast({ text: `Daily Challenge Started! +${res.startBonus} Light Whisps` });
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
        if (isStoryMode) {
          setIsDoorUnlocked(true);
          playPortalSound();
        } else {
          playWinMelody();
        }
        trackClientEvent('game_solve_completed');
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
            if (res.unlockedStreakRewards && res.unlockedStreakRewards.length > 0) {
              const rewardNames = res.unlockedStreakRewards.map((r: { id: string; name: string }) => r.name).join(', ');
              showToast({ text: `🎉 Streak Milestone Unlocked: ${rewardNames}! Check your shop.`, appearance: 'success' });
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

      if (!isStoryMode) {
        const timer = setTimeout(() => {
          setIsWon(true);
          onWin?.();
        }, 2400);

        return () => {
          clearTimeout(timer);
        };
      }
    } else {
      setIsPuzzleSolved(false);
      setIsWon(false);
      setIsDoorUnlocked(false);
    }
  }, [blockPositions, levelConfig, history.length, pushCount, isPuzzleSolved, onWin, par, puzzleId, refreshCurrency, isStoryMode]);

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
    const doorX = Math.floor(levelConfig.gridSize / 2);

    if (isStoryMode && isDoorUnlocked) {
      const triggerDoorExit = () => {
        playPortalSound();
        if (onChamberComplete) {
          onChamberComplete();
        } else if (onNextLevel) {
          onNextLevel();
        } else if (onWin) {
          onWin();
        }
      };

      // User requirement: Must be at top-middle space (doorX, 0) AND move UP to trigger entering the door
      if (playerPos.x === doorX && playerPos.y === 0 && direction.x === 0 && direction.y === -1) {
        triggerDoorExit();
        return;
      }

      const targetPos = { x: playerPos.x + direction.x, y: playerPos.y + direction.y };

      // Free walk around the solved chamber (blocks are locked and passable).
      // Entering (doorX, 0) from any adjacent tile simply moves character onto (doorX, 0).
      if (canOccupy(targetPos, false)) {
        setPlayerPos(targetPos);
        return;
      }
    }

    if ((isPuzzleSolved && !isStoryMode) || isWon || isAnimating) return;

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
                  const destAtOld = destinationMap.get(positionKey(block.pos));
                  const destAtNew = destinationMap.get(positionKey(blockNewPos));
                  const wasBlockMatched = Boolean(destAtOld && destAtOld.type === block.type);
                  const isBlockMatched = Boolean(destAtNew && destAtNew.type === block.type);
                  const isFreshMatch = !wasBlockMatched && isBlockMatched;
                  const isUnmatched = wasBlockMatched && !isBlockMatched;

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

                    if (isFreshMatch) {
                      const finalBlockPositions = blockPositions.map((b, idx) =>
                        idx === blockIdxAtExit ? { ...b, pos: blockNewPos, noTransition: false } : b
                      );
                      const currentMatched = levelConfig.destinations.filter(destination =>
                        finalBlockPositions.some(b =>
                          b.pos.x === destination.pos.x && b.pos.y === destination.pos.y && b.type === destination.type
                        )
                      ).length;
                      playMatchSound(Math.max(0, currentMatched - 1));
                      setShakeLevel('sm');
                      setTimeout(() => setShakeLevel('none'), 140);
                    } else if (isUnmatched) {
                      playUnmatchSound();
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

      const destAtOld = destinationMap.get(positionKey(oldBlockPos));
      const destAtNew = destinationMap.get(positionKey(blockNewPos));
      const wasBlockMatched = Boolean(destAtOld && destAtOld.type === block.type);
      const isBlockMatched = Boolean(destAtNew && destAtNew.type === block.type);
      const isFreshMatch = !wasBlockMatched && isBlockMatched;
      const isUnmatched = wasBlockMatched && !isBlockMatched;

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

        if (isFreshMatch) {
          const finalBlockPositions = blockPositions.map((b, idx) =>
            idx === blockIdx ? { ...b, pos: blockNewPos, noTransition: false } : b
          );
          const currentMatched = levelConfig.destinations.filter(destination =>
            finalBlockPositions.some(b =>
              b.pos.x === destination.pos.x && b.pos.y === destination.pos.y && b.type === destination.type
            )
          ).length;
          playMatchSound(Math.max(0, currentMatched - 1));
          setShakeLevel('sm');
          setTimeout(() => setShakeLevel('none'), 140);
        } else if (isUnmatched) {
          playUnmatchSound();
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
      if (keysDown.current.size === 0 || autoplayIndex !== null || showWelcomeModal || showInteractiveTutorial || showSettings || showLeaderboard || showTutorial || showScoreCard || (isPuzzleSolved && !isStoryMode) || isWon || isAnimating) {
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
    trackClientEvent('game_undo_used');
    clearAnimationTimers();
    playUndoSound();
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
    trackClientEvent('game_reset_used');
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


  const handlePostScoreComment = async (e?: React.MouseEvent, userComment?: string) => {
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
        puzzleNumber,
        difficulty,
        dailyTier,
        pushes: pushCount,
        par,
        moves: history.length,
        solveTime: solveTime || elapsedSeconds,
        stars,
        streak: streakInfo?.currentStreak,
        blockOrderEmojis: emojiString,
        userComment: userComment && userComment.trim() ? userComment.trim() : undefined,
      });

      if (res.success) {
        setScorePosted(true);
        setClaimedShareRewardToday(true);
        if (res.shardsAwarded && res.shardsAwarded > 0) {
          refreshCurrency?.();
          showToast({
            text: `Score posted in comments! +${res.shardsAwarded} Light Whisps earned!`,
            appearance: 'success',
          });
        } else {
          showToast({
            text: 'Score posted in Reddit comments!',
            appearance: 'success',
          });
        }
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

      if (showWelcomeModal || showInteractiveTutorial || showSettings || showLeaderboard || showTutorial || showScoreCard) {
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
      if (showWelcomeModal || showInteractiveTutorial || showSettings || showLeaderboard || showTutorial || showScoreCard) {
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
  }, [history, isWon, autoplayIndex, isModerator, levelConfig, showWelcomeModal, showInteractiveTutorial, showSettings, showLeaderboard, showTutorial, showScoreCard]);

  const handleTouchStart = (e: TouchEvent) => {
    if (autoplayIndex !== null || showWelcomeModal || showInteractiveTutorial || showSettings || showLeaderboard || showTutorial || showScoreCard || (isPuzzleSolved && !isStoryMode) || isWon) return;
    const touch = e.touches[0];
    if (touch) {
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    if (autoplayIndex !== null || showWelcomeModal || showInteractiveTutorial || showSettings || showLeaderboard || showTutorial || showScoreCard || (isPuzzleSolved && !isStoryMode) || isWon) return;
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
    if (autoplayIndex !== null || showWelcomeModal || showInteractiveTutorial || showSettings || showLeaderboard || showTutorial || showScoreCard || (isPuzzleSolved && !isStoryMode) || isWon) return;
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

  const handleTrailSelect = async (trailId: TrailId) => {
    setCurrentTrail(trailId);
    if (onEquipTrail) {
      await onEquipTrail(trailId);
    } else {
      try {
        await trpc.shop.setActiveTrail.mutate({ trailId });
      } catch (err) {
        console.error('Failed to set active trail:', err);
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

            {/* Light Whisp and Streak Rewards */}
            {(rewardedAmount !== null && rewardedAmount > 0) || (streakInfo && streakInfo.streakBonus !== undefined && streakInfo.streakBonus > 0) ? (
              <div className="flex flex-col gap-1 sm:gap-1.5 my-0.5">
                {rewardedAmount !== null && rewardedAmount > 0 && (
                  <div className="animate-pulse text-xs font-extrabold text-cyan-300 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] bg-cyan-950/60 border border-cyan-500/40 rounded-xl py-1.5 px-3.5 inline-flex items-center gap-2 justify-center shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                    <LightWhispIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>+{rewardedAmount} Light Whisps!</span>
                  </div>
                )}

                {streakInfo && streakInfo.streakBonus !== undefined && streakInfo.streakBonus > 0 && (
                  <div className="text-xs font-extrabold text-red-300 bg-red-950/60 border border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.3)] rounded-xl py-1.5 px-3 inline-flex items-center gap-1.5 justify-center">
                    <div className="w-3.5 h-3.5 bg-red-500/20 border border-red-400/40 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] flex items-center justify-center text-red-400 p-0.5 shrink-0">
                      <PuzzleShape shape="fire" className="w-full h-full" />
                    </div>
                    <span>{streakInfo.currentStreak}-Day Streak Bonus!</span>
                    <span className="text-yellow-400 font-mono font-bold inline-flex items-center gap-1">
                      (+{streakInfo.streakBonus} <LightWhispIcon className="w-3.5 h-3.5 text-yellow-400 shrink-0" />)
                    </span>
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
              {isShareable && (
                <button
                  onClick={handlePostScoreComment}
                  disabled={isPostingScore || scorePosted}
                  className="rounded-xl theme-btn py-2 sm:py-2.5 text-xs sm:text-sm font-extrabold cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] bg-gradient-to-r from-cyan-600 to-blue-600 border border-cyan-400/60 shadow-[0_0_18px_rgba(6,182,212,0.35)] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <span>{scorePosted ? 'Score Posted in Comments ✓' : isPostingScore ? 'Posting Score...' : 'Post Score'}</span>
                  {!scorePosted && !isPostingScore && !claimedShareRewardToday && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-400/25 border border-amber-400/50 text-amber-300 text-[10px] font-black tracking-normal">
                      <LightWhispIcon className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                      <span>+50 Whisps</span>
                    </span>
                  )}
                </button>
              )}
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
          <div className="flex flex-col gap-1.5 sm:gap-2 mb-1.5 sm:mb-2.5 w-full max-w-4xl mx-auto">
            {/* Tier 1: Global Nav & Balances */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-2 w-full">
              {/* Left: Menu button & Difficulty Badge */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  onClick={onReturnToMenu}
                  className="rounded-xl px-2.5 sm:px-3 py-1 text-xs font-bold bg-zinc-900/80 border border-white/10 hover:border-cyan-400/50 text-white backdrop-blur-md shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <svg className="w-3.5 h-3.5 text-zinc-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Menu</span>
                </button>
                {difficulty !== 'daily' && (
                  <DifficultyBadge
                    tier={difficulty || 1}
                    size="sm"
                    showMetrics={true}
                    par={par}
                    blocksCount={levelConfig.blocks.length}
                    className="hidden xs:inline-flex"
                  />
                )}
              </div>

              {/* Right: Daily Streak Bonus & Light Whisps Currency */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {difficulty === 'daily' ? (
                  <div
                    className="flex items-center gap-1.5 bg-black/60 border border-red-500/35 px-2 py-1 sm:px-2.5 rounded-xl backdrop-blur-md shadow-[0_0_12px_rgba(239,68,68,0.2)] select-none shrink-0"
                    title={`Daily Streak Bonus: +${Math.min(150, Math.max(1, (streak || 0) + (alreadyCompleted ? 0 : 1)))} Light Whisps`}
                  >
                    <div className="w-3.5 h-3.5 bg-red-500/20 border border-red-400/40 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.5)] flex items-center justify-center text-red-400 p-0.5 shrink-0">
                      <PuzzleShape shape="fire" className="w-full h-full" />
                    </div>
                    {streak > 0 && (
                      <span className="text-red-300 font-black text-[11px] font-mono">
                        {streak}d
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-300 font-semibold hidden md:inline">Streak Bonus:</span>
                    <span className="text-yellow-400 font-black text-[11px] font-mono inline-flex items-center gap-0.5">
                      +{Math.min(150, Math.max(1, (streak || 0) + (alreadyCompleted ? 0 : 1)))}
                      <LightWhispIcon className="w-3 h-3 text-cyan-300 shrink-0" />
                    </span>
                  </div>
                ) : (
                  streak > 0 && (
                    <div className="flex items-center gap-1.5 bg-black/60 border border-red-500/35 px-2 py-1 sm:px-2.5 rounded-xl backdrop-blur-md shadow-[0_0_12px_rgba(239,68,68,0.2)] select-none shrink-0" title={`${streak} Day Streak!`}>
                      <div className="w-3.5 h-3.5 bg-red-500/20 border border-red-400/40 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.5)] flex items-center justify-center text-red-400 p-0.5 shrink-0">
                        <PuzzleShape shape="fire" className="w-full h-full" />
                      </div>
                      <span className="text-red-300 font-black text-[11px] font-mono">
                        {streak}d
                      </span>
                    </div>
                  )
                )}
                <div className="flex items-center gap-1.5 bg-black/60 border border-cyan-500/35 px-2 py-1 sm:px-3 sm:py-1 rounded-xl backdrop-blur-md shadow-[0_0_12px_rgba(6,182,212,0.15)] hover:border-cyan-400/60 transition-all select-none shrink-0" title={`${currency.toLocaleString()} Light Whisps`}>
                  <LightWhispIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-cyan-300 font-mono font-bold text-xs sm:text-sm">
                    <span className="inline sm:hidden">{formatCompactCurrency(currency)}</span>
                    <span className="hidden sm:inline">{currency.toLocaleString()}</span>
                  </span>
                  <span className="text-[10px] text-cyan-400/80 font-bold hidden sm:inline">Whisps</span>
                </div>
              </div>
            </div>

            {/* Tier 2: Controls & Actions */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-2 w-full mt-0.5">
              {/* Left: Quick Actions Control Strip */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {(hasPrevLevel || hasNextLevel) && (
                  <div className="flex items-center gap-0.5 bg-black/60 p-0.5 rounded-xl border border-white/10">
                    <button
                      onClick={onPrevLevel}
                      disabled={!hasPrevLevel || isWon}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                      title="Previous Puzzle"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={onNextLevel}
                      disabled={!hasNextLevel || isWon}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                      title="Next Puzzle"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Daily Tier Switcher (Daily v2 Dropdown or v1 toggle) */}
                {difficulty === 'daily' && dailyFormat === 'v1_two_tier' && tiersData && onSwitchDailyTier && (
                  <div className="flex items-center gap-0.5 bg-black/60 p-0.5 rounded-xl border border-white/10 shrink-0 h-7 sm:h-8">
                    <button
                      onClick={() => onSwitchDailyTier('easy')}
                      className={cn(
                        'px-2 h-full rounded-lg text-[9px] sm:text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer',
                        dailyTier === 'easy'
                          ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      )}
                      title="Play Easy Warm-Up"
                    >
                      <svg className="w-2.5 h-2.5 text-emerald-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span>Warm-Up</span>
                      {tiersData.easy.completed && (
                        <svg className="w-2.5 h-2.5 text-emerald-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => onSwitchDailyTier('standard')}
                      className={cn(
                        'px-2 h-full rounded-lg text-[9px] sm:text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer',
                        dailyTier !== 'easy'
                          ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      )}
                      title="Play Main Daily Challenge"
                    >
                      <svg className="w-2.5 h-2.5 text-cyan-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Challenge</span>
                      {tiersData.standard.completed && (
                        <svg className="w-2.5 h-2.5 text-cyan-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
                {difficulty === 'daily' && dailyFormat === 'v2_six_tier' && (allTiersData || tiersData) && onSwitchDailyTier && (
                  <DailyTierDropdown
                    selectedTier={dailyTier || 'standard'}
                    onSelectTier={(tier) => onSwitchDailyTier(tier)}
                    tiersData={allTiersData || tiersData}
                  />
                )}
              </div>

              {/* Right: Undo, Reset, Settings Action Controls */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <button
                  onClick={handleUndo}
                  disabled={history.length === 0 || isWon || isAnimating}
                  className="px-2 sm:px-2.5 h-7 sm:h-8 rounded-xl text-[11px] sm:text-xs font-bold bg-zinc-900/80 border border-white/10 hover:border-cyan-400/40 text-zinc-200 hover:text-white backdrop-blur-md shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Undo move (U)"
                >
                  <svg className="w-3.5 h-3.5 text-cyan-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 14 4 9l5-5" />
                    <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />
                  </svg>
                  <span className="hidden xs:inline">Undo</span>
                  {history.length > 0 && (
                    <span className="px-1 py-0.2 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[9px] font-mono font-black text-cyan-300">
                      {history.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  className="px-2 sm:px-2.5 h-7 sm:h-8 rounded-xl text-[11px] sm:text-xs font-bold bg-zinc-900/80 border border-white/10 hover:border-rose-400/40 text-zinc-200 hover:text-white backdrop-blur-md shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Reset puzzle (R)"
                >
                  <svg className="w-3.5 h-3.5 text-rose-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  <span className="hidden xs:inline">Reset</span>
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs font-bold bg-zinc-900/80 border border-white/10 hover:border-white/30 text-zinc-200 hover:text-white backdrop-blur-md shadow-sm transition-all flex items-center justify-center cursor-pointer"
                  title="Settings"
                >
                  <svg className="w-3.5 h-3.5 text-zinc-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Tier 3: Centered Cyberpunk Live Stats HUD */}
            <div className="flex items-center justify-center w-full mt-0.5 sm:mt-1">
              <div className="flex items-center gap-2.5 sm:gap-4 bg-black/60 backdrop-blur-md px-3.5 py-1 rounded-xl border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)] select-none">
                {/* Timer */}
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-mono font-bold text-white">
                  <svg className="w-3.5 h-3.5 text-cyan-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <polyline points="12 7 12 12 15 14" />
                  </svg>
                  <span>{formatTime(elapsedSeconds)}</span>
                </div>

                <div className="w-px h-3 bg-white/20" />

                {/* Targets */}
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-mono font-bold text-white" title="Targets Solved">
                  <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span className={blocksInPlace === totalBlocks ? 'text-emerald-400 font-black' : 'text-white'}>
                    {blocksInPlace}/{totalBlocks}
                  </span>
                </div>

                <div className="w-px h-3 bg-white/20" />

                {/* Interactive 3-Star Par Progression Meter */}
                <StarParMeter pushCount={pushCount} par={par} />
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
              activeTrail={currentTrail}
              lastAction={lastAction}
              activeCharacter={currentCharacter}
              shakeLevel={shakeLevel}
              showCoordinates={showCoordinates}
              isStoryMode={isStoryMode}
              isDoorUnlocked={isDoorUnlocked}
            />
          </div>

        </div>
      )}

      {/* Temporary Animated "Puzzle Complete" / "Gateway Unsealed" Text Popup */}
      {isPuzzleSolved && !isWon && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center pointer-events-none px-4">
          <h2 className="text-amber-400 font-black text-3xl sm:text-5xl lg:text-6xl tracking-tight uppercase animate-complete-banner flex flex-col items-center gap-2 select-none drop-shadow-[0_6px_20px_rgba(0,0,0,0.95)]">
            <span className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(245,158,11,0.8)]">
              {isStoryMode ? 'Gateway Unsealed' : 'Puzzle Complete'}
            </span>
            {isStoryMode && (
              <span className="text-xs sm:text-sm font-mono font-bold tracking-widest text-cyan-300 bg-cyan-950/80 border border-cyan-400/50 px-3 py-1 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.6)] animate-pulse">
                STEP THROUGH THE TOP DOORWAY ▲
              </span>
            )}
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
            difficulty,
            dailyTier,
          }}
          onPostScore={isShareable ? handlePostScoreComment : undefined}
          onPlayMainDaily={dailyTier === 'easy' ? onPlayMainDaily : undefined}
          isPostingScore={isPostingScore}
          scorePosted={scorePosted}
          isShareRewardAvailable={!claimedShareRewardToday}
          onClose={() => setShowScoreCard(false)}
        />
      )}

      {/* Game Entry Welcome Modal */}
      {showWelcomeModal && (
        <WelcomeModal
          onPlayNow={() => setShowWelcomeModal(false)}
          onHowToPlay={() => {
            setShowWelcomeModal(false);
            setShowInteractiveTutorial(true);
          }}
        />
      )}

      {/* Interactive Mini Tutorial Modal */}
      {showInteractiveTutorial && (
        <MiniTutorialModal
          onComplete={() => {
            setShowInteractiveTutorial(false);
            refreshCurrency?.();
          }}
          onSkip={() => setShowInteractiveTutorial(false)}
        />
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 pointer-events-auto">
          <div className="glass-panel max-w-md w-full p-6 rounded-3xl border border-cyan-500/30 text-white relative animate-float shadow-[0_0_50px_rgba(6,182,212,0.25)]">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V18H8v2h8v-2h-3v-2.1c1.94-.35 3.46-1.84 3.9-3.96C19.28 11.63 21 9.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
                </svg>
              </div>
              <h2 className="text-2xl font-black neon-text-title tracking-tight mt-2">Leaderboard</h2>
              <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest mt-1">Top Solutions</p>
            </div>

            {loadingLeaderboard ? (
              <div className="py-8 flex justify-center">
                <SplashLoader
                  compact
                  message="SYNCING LEADERBOARD..."
                />
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
        activeTrail={currentTrail}
        purchasedTrails={purchasedTrails}
        trails={trails}
        onEquipTrail={handleTrailSelect}
        onHowToPlay={() => {
          setShowSettings(false);
          setShowTutorial(true);
        }}
        onOpenLeaderboard={puzzleId ? handleOpenLeaderboard : undefined}
        panelClass={styles.panelClass}
        showCoordinates={showCoordinates}
        onToggleCoordinates={setShowCoordinates}
      />

      {/* Tutorial Modal */}
      {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} activeTheme={effectiveTheme} />}
    </>
  );
};
