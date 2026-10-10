import { describe, it, expect } from 'vitest';
import { calculateRelicProgress, getRelicPalette, RELIC_TIERS } from './relicProgress';

describe('Relic Progress Engine (6 Face Growth Pillars)', () => {
  it('initializes at Tier 0 (Raw Obsidian) with 0 progress for a new player', () => {
    const progress = calculateRelicProgress({
      dailyStreak: 0,
      dailyPuzzlesSolved: 0,
      campaignSolvedCount: 0,
      purchasedItemsCount: 0,
      weeklyAwardsCount: 0,
      puzzlesCreatedCount: 0,
    });

    expect(progress.overallProgress).toBe(0);
    expect(progress.activeTier).toBe(0);
    expect(progress.tierInfo.name).toBe(RELIC_TIERS[0].name);

    // All 6 faces should be unawakened
    expect(progress.faces.red.progressPercent).toBe(0);
    expect(progress.faces.red.hasRunes).toBe(false);
    expect(progress.faces.blue.hasGem).toBe(false);
    expect(progress.faces.yellow.hasMasterGlyph).toBe(false);
  });

  it('correctly updates individual faces based on their specific accomplishment', () => {
    const progress = calculateRelicProgress({
      dailyStreak: 30, // 100% on Red (Streak target: 30)
      dailyPuzzlesSolved: 5, // 50% on Blue when total daily released is 10 (target: 5)
      totalDailyPuzzlesCount: 10,
      campaignSolvedCount: 5, // 25% on Yellow (Campaign target: 20)
      purchasedItemsCount: 0, // 0% on Green
      weeklyAwardsCount: 0, // 0% on Orange
      puzzlesCreatedCount: 0, // 0% on Purple
    });

    // 🔴 Red face should have full mastery
    expect(progress.faces.red.progressPercent).toBe(100);
    expect(progress.faces.red.hasAscendedGlow).toBe(true);
    expect(progress.faces.red.hasMasterGlyph).toBe(true);
    expect(progress.faces.red.hasGem).toBe(true);
    expect(progress.faces.red.hasRunes).toBe(true);

    // 🔵 Blue face should have gem inlay (5/5 solved -> 100% or 5/10 target)
    expect(progress.faces.blue.targetValue).toBe(5);
    expect(progress.faces.blue.progressPercent).toBe(100);
    expect(progress.faces.blue.hasAscendedGlow).toBe(true);

    // 🟡 Yellow face should have runic channels
    expect(progress.faces.yellow.progressPercent).toBe(25);
    expect(progress.faces.yellow.hasRunes).toBe(true);
    expect(progress.faces.yellow.hasGem).toBe(false);

    // 🟢 Green face should remain dormant
    expect(progress.faces.green.progressPercent).toBe(0);
    expect(progress.faces.green.hasRunes).toBe(false);

    // Overall progress should be (100 + 100 + 25 + 0 + 0 + 0) / 6 = 38%
    expect(progress.overallProgress).toBe(38);
    expect(progress.activeTier).toBe(1);
  });

  it('reaches Tier 4 (Celestial Sovereign) when all 6 faces reach mastery with 1/2 daily target', () => {
    const progress = calculateRelicProgress({
      dailyStreak: 30, // Red max target: 30
      dailyPuzzlesSolved: 10, // Blue max target: 10 (1/2 of 20 total released)
      totalDailyPuzzlesCount: 20,
      campaignSolvedCount: 20, // Yellow max target: 20
      purchasedItemsCount: 6, // Green max target: 6
      weeklyAwardsCount: 5, // Orange max target: 5
      puzzlesCreatedCount: 20, // Purple max target: 20
    });

    expect(progress.overallProgress).toBe(100);
    expect(progress.activeTier).toBe(4);
    expect(progress.faces.red.hasAscendedGlow).toBe(true);
    expect(progress.faces.blue.hasAscendedGlow).toBe(true);
    expect(progress.faces.yellow.hasAscendedGlow).toBe(true);
    expect(progress.faces.green.hasAscendedGlow).toBe(true);
    expect(progress.faces.orange.hasAscendedGlow).toBe(true);
    expect(progress.faces.purple.hasAscendedGlow).toBe(true);
  });

  it('provides base palette for theme support', () => {
    const neon = getRelicPalette('neon');
    expect(neon.runicGlow).toBe('#06b6d4');
  });
});
