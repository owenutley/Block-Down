import { redis } from '@devvit/web/server';
import { StoryProgress, STORY_CHAPTERS, sanitizeChamberTopology, isChamberAisleClear } from '../../shared/story';
import { getCuratedStoryChamber } from '../../shared/storyPuzzles';
import { getPuzzle, getPuzzleIdsByDifficulty } from './puzzle';
import { grantCampaignReward } from './shop';
import { refreshUserTTL } from './progress';
import { Puzzle } from '../../shared/types';

const STORY_PROGRESS_KEY = (username: string) => `user_story_progress:${username}`;

/**
 * Returns the player's saved Story Mode progress.
 */
export const getUserStoryProgress = async (username: string): Promise<StoryProgress> => {
  const defaultProgress: StoryProgress = {
    currentChapter: 1,
    currentChamber: 1,
    completedChambers: [],
    chamberStars: {},
    unlockedLore: ['ch1_intro'],
    unlockedRewards: [],
  };

  if (!username) return defaultProgress;

  try {
    const raw = await redis.get(STORY_PROGRESS_KEY(username));
    await refreshUserTTL(username);
    if (!raw) return defaultProgress;
    const parsed: Partial<StoryProgress> = JSON.parse(raw);
    return {
      currentChapter: parsed.currentChapter || 1,
      currentChamber: parsed.currentChamber || 1,
      completedChambers: parsed.completedChambers || [],
      chamberStars: parsed.chamberStars || {},
      unlockedLore: parsed.unlockedLore || ['ch1_intro'],
      unlockedRewards: parsed.unlockedRewards || [],
    };
  } catch (err) {
    console.error('Failed to read story progress:', err);
    return defaultProgress;
  }
};

/**
 * Saves a player's Story Mode progress to Redis.
 */
export const saveUserStoryProgress = async (
  username: string,
  progress: StoryProgress
): Promise<void> => {
  if (!username) return;
  try {
    await redis.set(STORY_PROGRESS_KEY(username), JSON.stringify(progress));
    await refreshUserTTL(username);
  } catch (err) {
    console.error('Failed to save story progress:', err);
  }
};

/**
 * Records completion of a chamber, calculates stars, unlocks next chamber,
 * and handles chapter rewards if milestones are reached.
 */
export const recordChamberCompletion = async (
  username: string,
  chapter: number,
  chamber: number,
  stars: number
): Promise<{
  progress: StoryProgress;
  newReward?: { id: string; name: string; type: 'character' | 'theme' };
}> => {
  const progress = await getUserStoryProgress(username);
  const chamberKey = `ch${chapter}_${chamber}`;

  if (!progress.completedChambers.includes(chamberKey)) {
    progress.completedChambers.push(chamberKey);
  }

  const existingStars = progress.chamberStars[chamberKey] || 0;
  progress.chamberStars[chamberKey] = Math.max(existingStars, Math.min(3, Math.max(1, stars)));

  // Unlock lore logs based on chapter milestones
  if (chapter === 1 && chamber >= 5 && !progress.unlockedLore.includes('ch1_mid')) {
    progress.unlockedLore.push('ch1_mid');
  }
  if (chapter === 1 && chamber === 10 && !progress.unlockedLore.includes('ch1_boss')) {
    progress.unlockedLore.push('ch1_boss');
  }
  if (chapter === 2 && chamber === 1 && !progress.unlockedLore.includes('ch2_intro')) {
    progress.unlockedLore.push('ch2_intro');
  }
  if (chapter === 2 && chamber === 10 && !progress.unlockedLore.includes('ch2_boss')) {
    progress.unlockedLore.push('ch2_boss');
  }
  if (chapter === 3 && chamber === 1 && !progress.unlockedLore.includes('ch3_intro')) {
    progress.unlockedLore.push('ch3_intro');
  }
  if (chapter === 3 && chamber === 10 && !progress.unlockedLore.includes('ch3_boss')) {
    progress.unlockedLore.push('ch3_boss');
  }
  if (chapter === 4 && chamber === 10 && !progress.unlockedLore.includes('ch4_boss')) {
    progress.unlockedLore.push('ch4_boss');
  }

  // Advance current chapter / chamber if this was the leading edge
  if (chapter === progress.currentChapter && chamber === progress.currentChamber) {
    if (chamber < 10) {
      progress.currentChamber = chamber + 1;
    } else if (chapter < STORY_CHAPTERS.length) {
      progress.currentChapter = chapter + 1;
      progress.currentChamber = 1;
    }
  }

  // Milestone rewards
  let newReward: { id: string; name: string; type: 'character' | 'theme' } | undefined = undefined;
  if (chamber === 10) {
    const chapterData = STORY_CHAPTERS.find((c) => c.chapterNumber === chapter);
    if (chapterData && chapterData.chapterReward.type !== 'currency') {
      const rewardId = chapterData.chapterReward.id;
      if (!progress.unlockedRewards.includes(rewardId)) {
        progress.unlockedRewards.push(rewardId);
        newReward = {
          id: rewardId,
          name: chapterData.chapterReward.name,
          type: chapterData.chapterReward.type,
        };

        if (username) {
          if (chapter === 2) {
            await grantCampaignReward(username, 'character', 'frost_bot');
            await grantCampaignReward(username, 'theme', 'winter');
          } else if (chapter === 3) {
            await grantCampaignReward(username, 'character', 'forest_bot');
            await grantCampaignReward(username, 'theme', 'forest');
          } else if (chapter === 4) {
            await grantCampaignReward(username, 'character', 'candy_bot');
            await grantCampaignReward(username, 'theme', 'candy');
          }
        }
      }
    }
  }

  await saveUserStoryProgress(username, progress);
  return { progress, newReward };
};

/**
 * Loads a chamber puzzle and applies topology sanitization
 * so that door and spawn cells are guaranteed to be clear of walls.
 */
export const getStoryChamberPuzzle = async (
  chapter: number,
  chamber: number
): Promise<Puzzle | null> => {
  // 1. Prefer handcrafted, verified curated story chambers
  const curated = getCuratedStoryChamber(chapter, chamber);
  if (curated) {
    return curated;
  }

  // 2. Fallback to dynamically sanitized puzzles from pool
  let difficulty: 'easy' | 'medium' | 'hard' = 'easy';
  if (chapter === 2) difficulty = 'medium';
  if (chapter === 3) difficulty = 'medium';
  if (chapter === 4) difficulty = 'hard';

  const ids = await getPuzzleIdsByDifficulty(difficulty);
  if (!ids || ids.length === 0) return null;

  // Search for a puzzle where the top doorway and bottom spawn are completely clear of targets, blocks, and walls
  let selectedPuzzle: Puzzle | null = null;
  const offset = (chapter - 1) * 3;

  for (let i = 0; i < ids.length; i++) {
    const candidateIdx = (offset + chamber - 1 + i) % ids.length;
    const candidateId = ids[candidateIdx];
    if (!candidateId) continue;
    const candidate = await getPuzzle(candidateId);
    if (!candidate) continue;

    if (isChamberAisleClear(candidate)) {
      selectedPuzzle = candidate;
      break;
    }
  }

  // Fallback to indexed puzzle if no perfectly clear candidate was found
  if (!selectedPuzzle) {
    const fallbackId = ids[(offset + chamber - 1) % ids.length];
    if (fallbackId) {
      selectedPuzzle = await getPuzzle(fallbackId);
    }
  }

  if (!selectedPuzzle) return null;

  // Apply chamber topology sanitization (clears (doorX, 0) and (doorX, height - 1))
  const sanitized = sanitizeChamberTopology(selectedPuzzle);

  // Set the chapter theme & spawn position
  const chapterConfig = STORY_CHAPTERS.find((c) => c.chapterNumber === chapter);
  const themeId = chapterConfig?.themeId || 'neon';
  const doorX = Math.floor(sanitized.width / 2);

  return {
    ...sanitized,
    name: `Chapter ${chapter} · Chamber ${chamber}`,
    theme: themeId,
    // Spawn player at bottom door threshold
    player: { x: doorX, y: sanitized.height - 1 },
  };
};
