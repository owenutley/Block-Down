/**
 * Puzzle difficulty levels
 */
export type PuzzleDifficulty = 'tutorial' | 'daily' | 'easy' | 'medium' | 'hard' | 'splash' | 'custom';

export type Position = { x: number; y: number };

export type PuzzleBlock = {
  id: string;
  color: string;
  x: number;
  y: number;
};

export type PuzzleTarget = {
  id: string;
  color: string;
  x: number;
  y: number;
};

export type PortalDirection = 'Up' | 'Down' | 'Left' | 'Right';

export type PuzzlePortal = {
  id: string;
  color: string;
  x: number;
  y: number;
  dir: PortalDirection;
};

/**
 * Individual puzzle structure
 */
export type Puzzle = {
  id: string;
  name: string;
  difficulty: PuzzleDifficulty;
  width: number;
  height: number;
  player: Position;
  walls: Position[];
  blocks: PuzzleBlock[];
  targets: PuzzleTarget[];
  portals?: PuzzlePortal[];
  createdAt: number; // Unix timestamp
  par?: number; // Target push count (saved par)
  playerMoves?: string[]; // Used for splash screen automated playback
  splashMovesCount?: number; // Used to customize the number of moves shown on the splash page
  author?: string;
  theme?: string;
  character?: string;
  postId?: string;
};

/**
 * Daily puzzle assignment
 */
export type DailyPuzzle = {
  date: string; // YYYY-MM-DD format
  puzzleId: string;
  difficulty: PuzzleDifficulty;
  assignedAt: number; // Unix timestamp
};

/**
 * Puzzle statistics
 */
export type PuzzleStats = {
  totalAttempts: number;
  totalCompletions: number;
  averageScore: number;
  bestScore: number;
};

/**
 * User puzzle progress
 */
export type UserPuzzleProgress = {
  puzzleId: string;
  attempts: number;
  completed: boolean;
  bestScore: number;
  lastAttemptedAt: number;
};

/**
 * Tutorial page structure for How To guide
 */
export type TutorialPage = {
  id: string;
  order: number;
  title: string;
  subtitle?: string;
  icon?: string;
  description: string;
  puzzle?: {
    width: number;
    height: number;
    player: Position;
    walls: Position[];
    blocks: PuzzleBlock[];
    targets: PuzzleTarget[];
    portals?: PuzzlePortal[];
    solutionMoves?: string[];
  };
};

export type AnalyticsEventName =
  | 'screen_view_daily'
  | 'screen_view_campaign'
  | 'screen_view_past_puzzles'
  | 'screen_view_puzzle_maker'
  | 'screen_view_shop'
  | 'screen_view_profile'
  | 'screen_view_howto'
  | 'game_start'
  | 'game_solve_completed'
  | 'game_undo_used'
  | 'game_reset_used'
  | 'maker_auto_generate'
  | 'maker_puzzle_playtested'
  | 'maker_puzzle_published'
  | 'shop_theme_purchased'
  | 'shop_trail_purchased'
  | 'theme_equipped'
  | 'streak_freeze_used'
  | 'daily_bonus_claimed';

export type AnalyticsFeatureStat = {
  name: string;
  category: 'screen' | 'gameplay' | 'creator' | 'economy';
  totalCount: number;
  todayCount: number;
};

export type DailyActiveUserPoint = {
  date: string;
  dau: number;
  eventsCount: number;
};

export type AnalyticsDashboardData = {
  totalUniquePlayers: number;
  todayDau: number;
  yesterdayDau: number;
  totalSolves: number;
  topFeatures: AnalyticsFeatureStat[];
  dauHistory: DailyActiveUserPoint[];
  lastUpdated: number;
};

export type WeeklyChallengePhase = 'creation' | 'solving' | 'finalized';

export type WeeklyLeaderboardEntry = {
  rank: number;
  puzzleId: string;
  puzzleName: string;
  author: string;
  difficultyScore: number;
  attempts: number;
  solves: number;
  solveRate: number;
  par: number;
  blocksCount: number;
  portalsCount: number;
  potentialReward: number;
};

export type WeeklyWinnerAward = {
  weekId: string;
  rank: 1 | 2 | 3;
  puzzleId: string;
  puzzleName: string;
  shardReward: number;
  difficultyScore: number;
  dateAwarded: string;
  claimed?: boolean;
};

export type PlayerWeeklyAwardsSummary = {
  totalAwards: number;
  trophies: {
    firstPlace: number;
    secondPlace: number;
    thirdPlace: number;
  };
  totalShardsEarned: number;
  history: WeeklyWinnerAward[];
};

export type WeeklyChallengeData = {
  weekId: string;
  phase: WeeklyChallengePhase;
  startTime: number;
  creationDeadline: number;
  endTime: number;
  isCreationOpen: boolean;
  timeRemainingMs: number;
  leaderboard: WeeklyLeaderboardEntry[];
  totalEntries: number;
  userEntry?: WeeklyLeaderboardEntry | null;
};

