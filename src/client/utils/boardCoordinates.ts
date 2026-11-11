export const COORDINATES_STORAGE_KEY = 'block_down_show_coordinates';

/**
 * Letters for columns (files) in chess notation.
 */
export const CHESS_FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'] as const;

/**
 * Returns the column letters for a board of the given grid size (e.g. ['a', ..., 'i']).
 */
export const getBoardFiles = (gridSize: number): string[] => {
  const size = Math.max(1, Math.min(gridSize, CHESS_FILES.length));
  return CHESS_FILES.slice(0, size);
};

/**
 * Returns the row numbers for a board of the given grid size from top to bottom,
 * where row 1 is at the bottom (standard chess notation, e.g. [9, 8, ..., 1]).
 */
export const getBoardRanks = (gridSize: number): number[] => {
  const size = Math.max(1, gridSize);
  return Array.from({ length: size }, (_, i) => size - i);
};

const getStorage = (): Storage | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  return null;
};

/**
 * Safely reads the user's coordinate display preference from localStorage.
 * Defaults to true.
 */
export const getShowCoordinates = (): boolean => {
  try {
    const storage = getStorage();
    if (!storage) return true;
    const val = storage.getItem(COORDINATES_STORAGE_KEY);
    return val !== 'false';
  } catch {
    return true;
  }
};

/**
 * Safely saves the user's coordinate display preference to localStorage.
 */
export const setShowCoordinates = (show: boolean): void => {
  try {
    const storage = getStorage();
    if (storage) {
      storage.setItem(COORDINATES_STORAGE_KEY, String(show));
    }
  } catch (e) {
    console.warn('Failed to save show coordinates setting to localStorage:', e);
  }
};
