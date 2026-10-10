import { expect } from 'vitest';
import { test } from '../test';
import {
  getUserThemeStatus,
  getUserCharacterStatus,
  grantCampaignReward,
  checkAndGrantCampaignRewards,
  purchaseTheme,
  purchaseCharacter,
  checkAndGrantChronolithReward,
} from './shop';

test('Should grant campaign rewards and preserve them permanently', async () => {
  const username = 'reward-test-user';

  // Initially only has default 'neon'
  const themeStatus = await getUserThemeStatus(username);
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

  // Try purchasing chronolith theme directly
  const chronoRes = await purchaseTheme(username, 'chronolith');
  expect(chronoRes.success).toBe(false);
  expect(chronoRes.error).toContain('CAMPAIGN_EXCLUSIVE');
});

test('Should unlock Chronolith Ascended theme and Chronolith Sovereign character at 100% and retain both permanently if progress drops', async () => {
  const username = 'chronolith-master-user';

  // Initially 0% progress -> theme and character not unlocked
  let res = await checkAndGrantChronolithReward(username, 0);
  expect(res.unlocked).toBe(false);
  let themeStatus = await getUserThemeStatus(username);
  let charStatus = await getUserCharacterStatus(username);
  expect(themeStatus.purchasedThemes).not.toContain('chronolith');
  expect(charStatus.purchasedCharacters).not.toContain('chronolith');

  // Reaching 100% -> unlocks Chronolith theme and Sovereign character
  res = await checkAndGrantChronolithReward(username, 100);
  expect(res.unlocked).toBe(true);
  expect(res.newlyUnlocked).toBe(true);
  themeStatus = await getUserThemeStatus(username);
  charStatus = await getUserCharacterStatus(username);
  expect(themeStatus.purchasedThemes).toContain('chronolith');
  expect(charStatus.purchasedCharacters).toContain('chronolith');

  // If percentage drops to 80% later (e.g. streak resets), theme and character are permanently retained
  res = await checkAndGrantChronolithReward(username, 80);
  expect(res.unlocked).toBe(true);
  expect(res.newlyUnlocked).toBe(false);
  themeStatus = await getUserThemeStatus(username);
  charStatus = await getUserCharacterStatus(username);
  expect(themeStatus.purchasedThemes).toContain('chronolith');
  expect(charStatus.purchasedCharacters).toContain('chronolith');
});

