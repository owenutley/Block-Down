export type DailyDifficultyTier = 1 | 2 | 3 | 4 | 5 | 6;

export type DailyTierKey =
  | 'very-easy'
  | 'easy'
  | 'medium'
  | 'hard'
  | 'very-hard'
  | 'extreme';

export type DifficultyTierMeta = {
  tier: DailyDifficultyTier;
  key: DailyTierKey;
  name: string;
  shortName: string;
  colorHex: string;
  badgeBorder: string;
  badgeBg: string;
  badgeText: string;
  badgeGlow: string;
  minPushes: number;
  targetBlocks: number;
  shardsReward: number;
  generatorStage: number;
};

export const DIFFICULTY_TIERS: readonly DifficultyTierMeta[] = Object.freeze([
  {
    tier: 1,
    key: 'very-easy',
    name: 'Very Easy',
    shortName: 'V.Easy',
    colorHex: '#10b981',
    badgeBorder: 'border-emerald-500/50',
    badgeBg: 'bg-emerald-950/60',
    badgeText: 'text-emerald-400',
    badgeGlow: 'shadow-[0_0_12px_rgba(16,185,129,0.35)]',
    minPushes: 3,
    targetBlocks: 2,
    shardsReward: 5,
    generatorStage: 1,
  },
  {
    tier: 2,
    key: 'easy',
    name: 'Easy',
    shortName: 'Easy',
    colorHex: '#06b6d4',
    badgeBorder: 'border-cyan-500/50',
    badgeBg: 'bg-cyan-950/60',
    badgeText: 'text-cyan-400',
    badgeGlow: 'shadow-[0_0_12px_rgba(6,182,212,0.35)]',
    minPushes: 5,
    targetBlocks: 3,
    shardsReward: 10,
    generatorStage: 6,
  },
  {
    tier: 3,
    key: 'medium',
    name: 'Medium',
    shortName: 'Med',
    colorHex: '#3b82f6',
    badgeBorder: 'border-blue-500/50',
    badgeBg: 'bg-blue-950/60',
    badgeText: 'text-blue-400',
    badgeGlow: 'shadow-[0_0_12px_rgba(59,130,246,0.35)]',
    minPushes: 7,
    targetBlocks: 3,
    shardsReward: 15,
    generatorStage: 11,
  },
  {
    tier: 4,
    key: 'hard',
    name: 'Hard',
    shortName: 'Hard',
    colorHex: '#f59e0b',
    badgeBorder: 'border-amber-500/50',
    badgeBg: 'bg-amber-950/60',
    badgeText: 'text-amber-400',
    badgeGlow: 'shadow-[0_0_12px_rgba(245,158,11,0.35)]',
    minPushes: 9,
    targetBlocks: 4,
    shardsReward: 20,
    generatorStage: 16,
  },
  {
    tier: 5,
    key: 'very-hard',
    name: 'Very Hard',
    shortName: 'V.Hard',
    colorHex: '#8b5cf6',
    badgeBorder: 'border-purple-500/50',
    badgeBg: 'bg-purple-950/60',
    badgeText: 'text-purple-400',
    badgeGlow: 'shadow-[0_0_12px_rgba(139,92,246,0.35)]',
    minPushes: 12,
    targetBlocks: 5,
    shardsReward: 25,
    generatorStage: 21,
  },
  {
    tier: 6,
    key: 'extreme',
    name: 'Extreme',
    shortName: 'Ext',
    colorHex: '#f43f5e',
    badgeBorder: 'border-rose-500/50',
    badgeBg: 'bg-rose-950/60',
    badgeText: 'text-rose-400',
    badgeGlow: 'shadow-[0_0_12px_rgba(244,63,94,0.35)]',
    minPushes: 16,
    targetBlocks: 6,
    shardsReward: 30,
    generatorStage: 31,
  },
]);

/**
 * Returns metadata for a given tier level (1-6) or key ('very-easy', 'easy', etc.).
 * Falls back to Tier 3 (Medium) if unresolvable.
 */
export const getTierMeta = (tierOrKey: number | string | undefined | null): DifficultyTierMeta => {
  if (typeof tierOrKey === 'number') {
    const clamped = Math.max(1, Math.min(6, Math.floor(tierOrKey))) as DailyDifficultyTier;
    const found = DIFFICULTY_TIERS.find((t) => t.tier === clamped);
    if (found) return found;
  }

  if (typeof tierOrKey === 'string') {
    const lower = tierOrKey.toLowerCase().trim();
    if (lower === '1' || lower === 'very-easy' || lower === 'very easy') return DIFFICULTY_TIERS[0]!;
    if (lower === '2' || lower === 'easy') return DIFFICULTY_TIERS[1]!;
    if (lower === '3' || lower === 'medium' || lower === 'standard') return DIFFICULTY_TIERS[2]!;
    if (lower === '4' || lower === 'hard') return DIFFICULTY_TIERS[3]!;
    if (lower === '5' || lower === 'very-hard' || lower === 'very hard') return DIFFICULTY_TIERS[4]!;
    if (lower === '6' || lower === 'extreme') return DIFFICULTY_TIERS[5]!;
  }

  return DIFFICULTY_TIERS[2]!; // Medium default
};

/**
 * Derives the tier level (1-6) from puzzle attributes (par, blocks count, portals).
 */
export const calculatePuzzleTier = (puzzle: {
  par?: number | undefined;
  blocks?: unknown[] | undefined;
  portals?: unknown[] | undefined;
}): DailyDifficultyTier => {
  const blocks = puzzle.blocks?.length ?? 3;
  const par = puzzle.par ?? 5;
  const portals = Math.floor((puzzle.portals?.length ?? 0) / 2);

  // Direct tier mapping
  if (blocks <= 2 && par <= 4) return 1;
  if (blocks <= 3 && par <= 6 && portals === 0) return 2;
  if (blocks <= 3 && par <= 8) return 3;
  if (blocks <= 4 && par <= 10) return 4;
  if (blocks <= 5 && par <= 14) return 5;
  return 6;
};

/**
 * Cutoff daily puzzle number where 6-tier format takes effect.
 * Puzzles #1 through #162 use the legacy two-tier format (Warm-Up & Challenge).
 */
export const SIX_TIER_ROLLOUT_NUMBER = 163;

/**
 * Determines whether a given daily puzzle should use the new 6-tier format
 * or the legacy 2-tier format.
 */
export const isSixTierDaily = (
  dailyNumber?: number | null,
  formatVersion?: string | null
): boolean => {
  if (formatVersion === 'v2_six_tier') return true;
  if (formatVersion === 'v1_two_tier') return false;
  if (typeof dailyNumber === 'number' && dailyNumber > 0) {
    return dailyNumber >= SIX_TIER_ROLLOUT_NUMBER;
  }
  return false;
};

