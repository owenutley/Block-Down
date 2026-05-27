import { reddit } from '@devvit/web/server';
import {
  assignDailyPuzzle,
  getAllPuzzles,
  getDailyPuzzle,
  getPuzzlesByDifficulty,
} from './puzzle';

const getTodayDate = (): string => {
  const date = new Date();
  return date.toISOString().split('T')[0] || '';
};

export const createPost = async () => {
  return await reddit.submitCustomPost({
    title: 'block-down',
  });
};

export const createDailyPost = async () => {
  const today = getTodayDate();

  let daily = await getDailyPuzzle(today);

  if (!daily) {
    const dailyPuzzles = await getPuzzlesByDifficulty('daily');
    const dateMarked = dailyPuzzles.find((p) => p.id === `daily-${today}` || p.id.endsWith(`-${today}`));
    const fallback = dateMarked || dailyPuzzles[0] || (await getAllPuzzles())[0];

    if (!fallback) {
      throw new Error('No puzzle available in the database to assign as the daily puzzle.');
    }

    await assignDailyPuzzle(fallback.id, today);
    daily = await getDailyPuzzle(today);
  }

  if (!daily) {
    throw new Error('Failed to resolve a daily puzzle after assignment.');
  }

  const title = `block-down daily puzzle — ${daily.puzzle.name || daily.puzzle.id} (${daily.date})`;
  return await reddit.submitCustomPost({ title });
};
