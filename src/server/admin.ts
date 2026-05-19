import { reddit } from '@devvit/web/server';

const ADMIN_USERNAMES = ['Fit-Worldliness-1588'];

/**
 * Verify if the current user is an admin
 */
export const isAdmin = async (): Promise<boolean> => {
  try {
    const username = await reddit.getCurrentUsername();
    return ADMIN_USERNAMES.includes(username || '');
  } catch {
    return false;
  }
};

/**
 * Get current username
 */
export const getCurrentUsername = async (): Promise<string | null> => {
  try {
    const username = await reddit.getCurrentUsername();
    return username || null;
  } catch {
    return null;
  }
};
