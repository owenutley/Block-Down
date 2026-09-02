import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getTutorialPages, saveTutorialPage, deleteTutorialPage, reorderTutorialPages, DEFAULT_TUTORIAL_PAGES } from './howto';
import { redis } from '@devvit/web/server';

vi.mock('@devvit/web/server', () => {
  let store: Record<string, string> = {};
  return {
    redis: {
      get: vi.fn(async (key: string) => store[key] || null),
      set: vi.fn(async (key: string, val: string) => {
        store[key] = val;
      }),
      del: vi.fn(async (key: string) => {
        delete store[key];
      }),
    },
  };
});

describe('howto tutorial core', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('seeds default tutorial pages when redis is empty', async () => {
    const pages = await getTutorialPages();
    expect(pages).toHaveLength(DEFAULT_TUTORIAL_PAGES.length);
    expect(pages[0]?.title).toBe('How to Play: The Basics');
  });

  it('saves new tutorial page', async () => {
    const newPage = {
      id: 'tut-test',
      order: 10,
      title: 'Test Title',
      subtitle: 'Test Subtitle',
      icon: '🧪',
      description: 'Test Description',
    };
    const pages = await saveTutorialPage(newPage);
    const found = pages.find((p) => p.id === 'tut-test');
    expect(found).toBeDefined();
    expect(found?.title).toBe('Test Title');
  });

  it('deletes tutorial page', async () => {
    const initial = await getTutorialPages();
    const targetId = initial[0]!.id;
    const remaining = await deleteTutorialPage(targetId);
    expect(remaining.find((p) => p.id === targetId)).toBeUndefined();
  });

  it('reorders tutorial pages', async () => {
    const initial = await getTutorialPages();
    const ids = initial.map((p) => p.id).reverse();
    const reordered = await reorderTutorialPages(ids);
    expect(reordered[0]?.id).toBe(ids[0]);
  });
});
