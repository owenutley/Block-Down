import { ThemeId } from './themes';

export type RelicTier = 0 | 1 | 2 | 3 | 4;

export type RelicTierInfo = {
  tier: RelicTier;
  name: string;
  subtitle: string;
  description: string;
  minProgress: number;
};

export const RELIC_TIERS: Record<RelicTier, RelicTierInfo> = {
  0: {
    tier: 0,
    name: 'Raw Obsidian',
    subtitle: 'Cosmic Chiseled Foundation',
    description: 'A dormant ancient obsidian monolith. Each face awakens and extrudes in 3D relief as you make progress.',
    minProgress: 0,
  },
  1: {
    tier: 1,
    name: 'Stepped Relief',
    subtitle: 'Extruded Plates & Runes',
    description: 'Raised relief slabs and luminous runic conduits ignite along active faces.',
    minProgress: 20,
  },
  2: {
    tier: 2,
    name: 'Prismatic Gemstone',
    subtitle: '3D Raised Crystal Pyramids',
    description: 'True 3D gemstone pyramids project outward from progressed sides, catching light as they turn.',
    minProgress: 40,
  },
  3: {
    tier: 3,
    name: 'Master Engraved',
    subtitle: 'Corner Chevrons & Filigree Framing',
    description: 'Intricate stepped corner chevrons and luminous filigree frames radiate across high-mastery faces.',
    minProgress: 60,
  },
  4: {
    tier: 4,
    name: 'Celestial Sovereign',
    subtitle: 'Ascended Crown & Cosmic Aura',
    description: 'All 6 sides fully awakened with crowned corner brackets, starlight aura, and permanent Chronolith Ascended theme unlock.',
    minProgress: 80,
  },
};

export type FaceProgressKey = 'red' | 'blue' | 'yellow' | 'green' | 'orange' | 'purple';

export type FaceProgressInfo = {
  key: FaceProgressKey;
  faceName: 'front' | 'bottom' | 'top' | 'right' | 'left' | 'back';
  title: string;
  metricLabel: string;
  colorName: string;
  accentColor: string;
  currentValue: number;
  targetValue: number;
  progressPercent: number; // 0 to 100
  tier: 0 | 1 | 2 | 3 | 4;

  // Visual features for this specific face
  hasRunes: boolean; // >= 25% (Runic perimeter channels)
  hasGem: boolean; // >= 50% (Center gemstone inlay)
  hasMasterGlyph: boolean; // >= 75% (Master geometric circuit)
  hasAscendedGlow: boolean; // 100% (Golden filigree brackets)
  glowIntensity: number; // 0 to 1
  stageDescription: string;
};

export type RelicMilestoneBreakdown = {
  id: string;
  title: string;
  faceKey: FaceProgressKey;
  colorHex: string;
  category: string;
  progressText: string;
  pointsEarned: number;
  maxPoints: number;
  isCompleted: boolean;
  unlockedVisual: string;
};

export type RelicProgressState = {
  overallProgress: number; // 0 to 100 average of all 6 faces
  activeTier: RelicTier;
  tierInfo: RelicTierInfo;
  nextTierInfo: RelicTierInfo | null;
  progressToNextTier: number; // 0 to 100 within current tier
  cosmicParticlesCount: number;

  // 6 Individual Face Progressions (Tactile 3D Growth Chart)
  faces: Record<FaceProgressKey, FaceProgressInfo>;

  // Milestone breakdown
  milestones: RelicMilestoneBreakdown[];
};

export type PlayerProgressionRawData = {
  dailyStreak: number; // Red: Streak Setting (Target: 30)
  dailyPuzzlesSolved: number; // Blue: Daily Puzzle Solves (Target: 1/2 total daily puzzles)
  totalDailyPuzzlesCount?: number; // Total Daily Puzzles released so far
  campaignSolvedCount: number; // Yellow: Campaign Mastery (Target: 20)
  purchasedItemsCount: number; // Green: Purchased Items / Shop (Target: 6)
  weeklyAwardsCount: number; // Orange: Weekly Accomplishments (Target: 5)
  puzzlesCreatedCount: number; // Purple: Building Puzzles in Maker (Target: 20)

  // Extra optional fields for backwards compatibility
  totalPuzzlesSolved?: number;
  slideMatchSolvedCount?: number;
  slideMatchStars?: number;
  communitySolvedCount?: number;
  purchasedThemesCount?: number;
  purchasedTrailsCount?: number;
  purchasedCharactersCount?: number;
};

export const calculateRelicProgress = (data: PlayerProgressionRawData): RelicProgressState => {
  // Normalize values with fallbacks
  const streakVal = Math.max(0, data.dailyStreak || 0);
  const dailySolvesVal = Math.max(0, data.dailyPuzzlesSolved ?? data.totalPuzzlesSolved ?? 0);
  const campaignVal = Math.max(0, data.campaignSolvedCount || 0);
  
  const shopCount =
    data.purchasedItemsCount ??
    Math.max(
      0,
      ((data.purchasedThemesCount ?? 1) - 1) +
      ((data.purchasedTrailsCount ?? 1) - 1) +
      ((data.purchasedCharactersCount ?? 1) - 1)
    );
  const weeklyVal = Math.max(0, data.weeklyAwardsCount || 0);
  const builderVal = Math.max(0, data.puzzlesCreatedCount ?? data.communitySolvedCount ?? 0);

  // Targets
  const streakTarget = 30; // 30-day streak for full red mastery
  const totalDailyReleased = data.totalDailyPuzzlesCount && data.totalDailyPuzzlesCount > 0
    ? data.totalDailyPuzzlesCount
    : 20;
  const dailyTarget = Math.max(1, Math.ceil(totalDailyReleased / 2)); // 1/2 total daily puzzles for full blue mastery
  const campaignTarget = 20; // 20 campaign levels
  const shopTarget = 6; // 6 unlocked items
  const weeklyTarget = 5; // 5 weekly trophies for full orange mastery
  const builderTarget = 20; // 20 puzzles built in maker for full purple mastery

  // Calculate percentages (0-100)
  const redPct = Math.min(100, Math.round((streakVal / streakTarget) * 100));
  const bluePct = Math.min(100, Math.round((dailySolvesVal / dailyTarget) * 100));
  const yellowPct = Math.min(100, Math.round((campaignVal / campaignTarget) * 100));
  const greenPct = Math.min(100, Math.round((shopCount / shopTarget) * 100));
  const orangePct = Math.min(100, Math.round((weeklyVal / weeklyTarget) * 100));
  const purplePct = Math.min(100, Math.round((builderVal / builderTarget) * 100));

  const getFaceTier = (pct: number): 0 | 1 | 2 | 3 | 4 => {
    if (pct >= 100) return 4;
    if (pct >= 75) return 3;
    if (pct >= 50) return 2;
    if (pct >= 25) return 1;
    return 0;
  };

  const getStageDesc = (pct: number): string => {
    if (pct >= 100) return 'Ascended Crown Brackets & Node Lights';
    if (pct >= 75) return 'Stepped Corner Chevrons & Filigree';
    if (pct >= 50) return '3D Raised Gemstone Pyramid';
    if (pct >= 25) return 'Stepped Relief Plate & Runes';
    return 'Dormant Cosmic Obsidian';
  };

  const buildFaceInfo = (
    key: FaceProgressKey,
    faceName: 'front' | 'bottom' | 'top' | 'right' | 'left' | 'back',
    title: string,
    metricLabel: string,
    colorName: string,
    accentColor: string,
    currentValue: number,
    targetValue: number,
    pct: number
  ): FaceProgressInfo => {
    const tier = getFaceTier(pct);
    return {
      key,
      faceName,
      title,
      metricLabel,
      colorName,
      accentColor,
      currentValue,
      targetValue,
      progressPercent: pct,
      tier,
      hasRunes: pct >= 25,
      hasGem: pct >= 50,
      hasMasterGlyph: pct >= 75,
      hasAscendedGlow: pct >= 100,
      glowIntensity: pct >= 25 ? Math.min(1, 0.3 + (pct / 100) * 0.7) : 0.1,
      stageDescription: getStageDesc(pct),
    };
  };

  const faces: Record<FaceProgressKey, FaceProgressInfo> = {
    red: buildFaceInfo(
      'red',
      'front',
      'Daily Streak',
      'Day Streak',
      'Crimson Red',
      '#ef4444',
      streakVal,
      streakTarget,
      redPct
    ),
    blue: buildFaceInfo(
      'blue',
      'bottom',
      'Daily Puzzles',
      'Daily Solves',
      'Sapphire Blue',
      '#3b82f6',
      dailySolvesVal,
      dailyTarget,
      bluePct
    ),
    yellow: buildFaceInfo(
      'yellow',
      'top',
      'Campaign Mastery',
      'Stages Cleared',
      'Solar Yellow',
      '#eab308',
      campaignVal,
      campaignTarget,
      yellowPct
    ),
    green: buildFaceInfo(
      'green',
      'right',
      'Shop & Items',
      'Items Owned',
      'Emerald Green',
      '#22c55e',
      shopCount,
      shopTarget,
      greenPct
    ),
    orange: buildFaceInfo(
      'orange',
      'left',
      'Weekly Awards',
      'Trophies Won',
      'Amber Orange',
      '#f97316',
      weeklyVal,
      weeklyTarget,
      orangePct
    ),
    purple: buildFaceInfo(
      'purple',
      'back',
      'Puzzle Builder',
      'Puzzles Created',
      'Amethyst Purple',
      '#a855f7',
      builderVal,
      builderTarget,
      purplePct
    ),
  };

  // Overall progress is average of all 6 faces
  const overallProgress = Math.min(
    100,
    Math.round((redPct + bluePct + yellowPct + greenPct + orangePct + purplePct) / 6)
  );

  let activeTier: RelicTier = 0;
  if (overallProgress >= 80) activeTier = 4;
  else if (overallProgress >= 60) activeTier = 3;
  else if (overallProgress >= 40) activeTier = 2;
  else if (overallProgress >= 20) activeTier = 1;

  const tierInfo = RELIC_TIERS[activeTier];
  const nextTier: RelicTier | null = activeTier < 4 ? ((activeTier + 1) as RelicTier) : null;
  const nextTierInfo = nextTier !== null ? RELIC_TIERS[nextTier] : null;

  const tierRange = nextTierInfo ? nextTierInfo.minProgress - tierInfo.minProgress : 20;
  const progressInTier = overallProgress - tierInfo.minProgress;
  const progressToNextTier = nextTierInfo
    ? Math.min(100, Math.max(0, Math.round((progressInTier / tierRange) * 100)))
    : 100;

  const cosmicParticlesCount = Math.floor(15 + (overallProgress / 100) * 35);

  const milestones: RelicMilestoneBreakdown[] = [
    {
      id: 'streak',
      title: 'Daily Streak',
      faceKey: 'red',
      colorHex: '#ef4444',
      category: 'Streak',
      progressText: `${streakVal}/${streakTarget} Days Active`,
      pointsEarned: redPct,
      maxPoints: 100,
      isCompleted: redPct >= 100,
      unlockedVisual: faces.red.stageDescription,
    },
    {
      id: 'daily',
      title: 'Daily Puzzles',
      faceKey: 'blue',
      colorHex: '#3b82f6',
      category: 'Daily',
      progressText: `${dailySolvesVal}/${dailyTarget} Puzzles Solved`,
      pointsEarned: bluePct,
      maxPoints: 100,
      isCompleted: bluePct >= 100,
      unlockedVisual: faces.blue.stageDescription,
    },
    {
      id: 'campaign',
      title: 'Campaign Mastery',
      faceKey: 'yellow',
      colorHex: '#eab308',
      category: 'Campaign',
      progressText: `${campaignVal}/${campaignTarget} Stages Cleared`,
      pointsEarned: yellowPct,
      maxPoints: 100,
      isCompleted: yellowPct >= 100,
      unlockedVisual: faces.yellow.stageDescription,
    },
    {
      id: 'shop',
      title: 'Purchased Items',
      faceKey: 'green',
      colorHex: '#22c55e',
      category: 'Shop',
      progressText: `${shopCount}/${shopTarget} Items Unlocked`,
      pointsEarned: greenPct,
      maxPoints: 100,
      isCompleted: greenPct >= 100,
      unlockedVisual: faces.green.stageDescription,
    },
    {
      id: 'weekly',
      title: 'Weekly Accomplishments',
      faceKey: 'orange',
      colorHex: '#f97316',
      category: 'Weekly',
      progressText: `${weeklyVal}/${weeklyTarget} Trophies Won`,
      pointsEarned: orangePct,
      maxPoints: 100,
      isCompleted: orangePct >= 100,
      unlockedVisual: faces.orange.stageDescription,
    },
    {
      id: 'builder',
      title: 'Puzzle Builder',
      faceKey: 'purple',
      colorHex: '#a855f7',
      category: 'Builder',
      progressText: `${builderVal}/${builderTarget} Puzzles Published`,
      pointsEarned: purplePct,
      maxPoints: 100,
      isCompleted: purplePct >= 100,
      unlockedVisual: faces.purple.stageDescription,
    },
  ];

  return {
    overallProgress,
    activeTier,
    tierInfo,
    nextTierInfo,
    progressToNextTier,
    cosmicParticlesCount,
    faces,
    milestones,
  };
};

export type RelicPalette = {
  baseStone: string;
  baseStoneHighlight: string;
  baseStoneShade: string;
  runicGlow: string;
  gemFill: string;
  goldAccent: string;
};

export const getRelicPalette = (_themeId: ThemeId = 'neon'): RelicPalette => {
  return {
    baseStone: '#1e293b',
    baseStoneHighlight: '#334155',
    baseStoneShade: '#0f172a',
    runicGlow: '#06b6d4',
    gemFill: '#38bdf8',
    goldAccent: '#fbbf24',
  };
};
