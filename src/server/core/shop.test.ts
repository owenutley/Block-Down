import { expect } from 'vitest';
import { test } from '../test';
import {
  getUserThemeStatus,
  getUserCharacterStatus,
  grantCampaignReward,
  checkAndGrantCampaignRewards,
  purchaseTheme,
  purchaseCharacter,
} from './shop';

test('Should grant campaign rewards and preserve them permanently', async () => {
  const username = 'reward-test-user';

  // Initially only has default 'neon'
  let themeStatus = await getUserThemeStatus(username);
  let charStatus = await getUserCharacterStatus(username);
  expect(themeStatus.purchasedThemes).toEqual(['neon']);
  expect(charStatus.purchasedCharacters).toEqual(['neon']);

  // Grant Easy campaign reward (Frost Bot / winter character)
  await grantCampaignReward(username, 'character', 'winter');
  charStatus = await getUserCharacterStatus(username);
  expect(charStatus.purchasedCharacters).toContain('winter');

  // Test checkAndGrantCampaignRewards for Easy tier
  const campaignPuzzles = [
    { id: 'easy-1', difficulty: 'easy' as const },
    { id: 'easy-2', difficulty: 'easy' as const },
    { id: 'medium-1', difficulty: 'medium' as const },
  ];

  // With incomplete Easy tier: no new rewards
  let unlocked = await checkAndGrantCampaignRewards(username, ['easy-1'], campaignPuzzles);
  expect(unlocked).toEqual([]);

  // Complete all Easy tier puzzles
  unlocked = await checkAndGrantCampaignRewards(username, ['easy-1', 'easy-2'], campaignPuzzles);
  charStatus = await getUserCharacterStatus(username);
  expect(charStatus.purchasedCharacters).toContain('winter');

  // Test permanence constraint: even if a new level 'easy-3' is added later to campaignPuzzles, reward is preserved
  const updatedCampaignPuzzles = [
    { id: 'easy-1', difficulty: 'easy' as const },
    { id: 'easy-2', difficulty: 'easy' as const },
    { id: 'easy-3', difficulty: 'easy' as const },
  ];
  await checkAndGrantCampaignRewards(username, ['easy-1', 'easy-2'], updatedCampaignPuzzles);
  charStatus = await getUserCharacterStatus(username);
  expect(charStatus.purchasedCharacters).toContain('winter');
});

test('Should block purchasing earnable campaign cosmetics with shards', async () => {
  const username = 'shard-buyer-user';

  // Try purchasing winter theme directly
  const themeRes = await purchaseTheme(username, 'winter');
  expect(themeRes.success).toBe(false);
  expect(themeRes.error).toContain('CAMPAIGN_EXCLUSIVE');

  // Try purchasing winter character directly
  const charRes = await purchaseCharacter(username, 'winter');
  expect(charRes.success).toBe(false);
  expect(charRes.error).toContain('CAMPAIGN_EXCLUSIVE');
});
