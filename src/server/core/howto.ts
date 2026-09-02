import { redis } from '@devvit/web/server';
import { TutorialPage } from '../../shared/types';

const TUTORIAL_PAGES_KEY = 'tutorial:pages';

export const DEFAULT_TUTORIAL_PAGES: TutorialPage[] = [
  {
    id: 'tut-basics',
    order: 0,
    title: 'How to Play: The Basics',
    subtitle: 'Core Objective',
    icon: '🎯',
    description: 'You control the white glowing Core. Navigate around the grid to push colorful block shapes into their matching dashed target slots.',
    puzzle: {
      width: 5,
      height: 5,
      player: { x: 1, y: 2 },
      walls: [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 },
        { x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 },
      ],
      blocks: [{ id: 'b1', color: 'blue', x: 2, y: 2 }],
      targets: [{ id: 't1', color: 'blue', x: 4, y: 2 }],
      solutionMoves: ['Right'],
    },
  },
  {
    id: 'tut-ice-physics',
    order: 1,
    title: 'Ice-Slide Physics',
    subtitle: 'Inertia Movement',
    icon: '🧊',
    description: 'When you push a block, it slides with ice-like momentum and will not stop until it collides with a wall or another block! Plan stopping barriers before executing your push.',
    puzzle: {
      width: 6,
      height: 5,
      player: { x: 1, y: 1 },
      walls: [
        { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 },
        { x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 },
        { x: 5, y: 1 }, { x: 5, y: 3 },
      ],
      blocks: [{ id: 'b1', color: 'red', x: 2, y: 1 }],
      targets: [{ id: 't1', color: 'red', x: 4, y: 2 }],
      solutionMoves: ['Right', 'Down'],
    },
  },
  {
    id: 'tut-stars-rewards',
    order: 2,
    title: 'Star Ratings & Rewards',
    subtitle: 'Mastery & Economy',
    icon: '⭐',
    description: 'Every puzzle has an optimal Par push target. Fewer pushes earn higher star ratings and bonus Neon Shards (✦)! Use shards in the Shop to equip custom themes and character skins.',
  },
  {
    id: 'tut-daily-streaks',
    order: 3,
    title: 'Daily Streaks & Community',
    subtitle: 'Daily Routines',
    icon: '🔥',
    description: 'Play the Daily Puzzle every day to build your Daily Streak. Reach 3-day, 7-day, and 30-day streak milestones for massive shard payouts! Share your daily score card in post comments.',
  },
];

export async function getTutorialPages(): Promise<TutorialPage[]> {
  try {
    const raw = await redis.get(TUTORIAL_PAGES_KEY);
    if (!raw) {
      // Seed default tutorial pages into Redis
      await redis.set(TUTORIAL_PAGES_KEY, JSON.stringify(DEFAULT_TUTORIAL_PAGES));
      return DEFAULT_TUTORIAL_PAGES;
    }
    const pages = JSON.parse(raw) as TutorialPage[];
    return pages.sort((a, b) => a.order - b.order);
  } catch (err) {
    console.error('Failed to get tutorial pages from Redis:', err);
    return DEFAULT_TUTORIAL_PAGES;
  }
}

export async function saveTutorialPage(page: TutorialPage): Promise<TutorialPage[]> {
  const pages = await getTutorialPages();
  const index = pages.findIndex((p) => p.id === page.id);

  if (index >= 0) {
    pages[index] = { ...pages[index], ...page };
  } else {
    page.order = pages.length;
    pages.push(page);
  }

  const sorted = pages.map((p, idx) => ({ ...p, order: idx }));
  await redis.set(TUTORIAL_PAGES_KEY, JSON.stringify(sorted));
  return sorted;
}

export async function deleteTutorialPage(id: string): Promise<TutorialPage[]> {
  const pages = await getTutorialPages();
  const filtered = pages.filter((p) => p.id !== id).map((p, idx) => ({ ...p, order: idx }));
  await redis.set(TUTORIAL_PAGES_KEY, JSON.stringify(filtered));
  return filtered;
}

export async function reorderTutorialPages(pageIds: string[]): Promise<TutorialPage[]> {
  const pages = await getTutorialPages();
  const pageMap = new Map(pages.map((p) => [p.id, p]));

  const reordered: TutorialPage[] = [];
  pageIds.forEach((id, idx) => {
    const page = pageMap.get(id);
    if (page) {
      reordered.push({ ...page, order: idx });
      pageMap.delete(id);
    }
  });

  // Append any remaining pages not in pageIds
  Array.from(pageMap.values()).forEach((page) => {
    reordered.push({ ...page, order: reordered.length });
  });

  await redis.set(TUTORIAL_PAGES_KEY, JSON.stringify(reordered));
  return reordered;
}
