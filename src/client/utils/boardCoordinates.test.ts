import { describe, it, expect, beforeEach } from 'vitest';
import {
  CHESS_FILES,
  getBoardFiles,
  getBoardRanks,
  getShowCoordinates,
  setShowCoordinates,
  COORDINATES_STORAGE_KEY,
} from './boardCoordinates';

// Mock localStorage for node test environment if not present
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: createLocalStorageMock(),
    writable: true,
  });
}

describe('boardCoordinates utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getBoardFiles', () => {
    it('returns a-i for standard 9x9 grid', () => {
      const files = getBoardFiles(9);
      expect(files).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']);
      expect(files.length).toBe(9);
    });

    it('returns a-g for 7x7 grid', () => {
      const files = getBoardFiles(7);
      expect(files).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
      expect(files.length).toBe(7);
    });

    it('caps files to maximum available letters', () => {
      const files = getBoardFiles(12);
      expect(files).toEqual(CHESS_FILES);
    });
  });

  describe('getBoardRanks', () => {
    it('returns 9 down to 1 for 9x9 grid (so row 1 is at the bottom)', () => {
      const ranks = getBoardRanks(9);
      expect(ranks).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1]);
      expect(ranks[0]).toBe(9);
      expect(ranks[ranks.length - 1]).toBe(1);
    });

    it('returns 7 down to 1 for 7x7 grid', () => {
      const ranks = getBoardRanks(7);
      expect(ranks).toEqual([7, 6, 5, 4, 3, 2, 1]);
      expect(ranks[0]).toBe(7);
      expect(ranks[ranks.length - 1]).toBe(1);
    });
  });

  describe('localStorage preference getShowCoordinates & setShowCoordinates', () => {
    it('defaults to true when nothing is stored', () => {
      expect(getShowCoordinates()).toBe(true);
    });

    it('persists false when toggled off', () => {
      setShowCoordinates(false);
      expect(localStorage.getItem(COORDINATES_STORAGE_KEY)).toBe('false');
      expect(getShowCoordinates()).toBe(false);
    });

    it('persists true when toggled back on', () => {
      setShowCoordinates(false);
      setShowCoordinates(true);
      expect(localStorage.getItem(COORDINATES_STORAGE_KEY)).toBe('true');
      expect(getShowCoordinates()).toBe(true);
    });
  });
});

