import { reddit, context } from '@devvit/web/server';

const ADMIN_USERNAMES = ['Fit-Worldliness-1588'];

/**
 * Verify if the current user is an admin or moderator with proper permissions
 */
export const isAdmin = async (): Promise<boolean> => {
  try {
    // 1. Get the username safely
    const username = await reddit.getCurrentUsername();
    if (!username) return false;

    // 2. Developer override/exception
    if (ADMIN_USERNAMES.includes(username)) {
      return true;
    }

    // 3. Ensure we are inside a subreddit context
    const { subredditName } = context;
    if (!subredditName) return false;

    // 4. Fetch the user object to check specific mod permissions
    const user = await reddit.getCurrentUser();
    if (!user) return false;

    const permissions = await user.getModPermissionsForSubreddit(subredditName);

    // Check if user is a mod with proper permissions (all, config, or posts)
    return (
      permissions.includes('all') ||
      permissions.includes('config') ||
      permissions.includes('posts')
    );
  } catch (error) {
    console.error('Error checking moderator permissions:', error);
    return false;
  }
};

/**
 * Get current username safely
 */
export const getCurrentUsername = async (): Promise<string | null> => {
  try {
    const username = await reddit.getCurrentUsername();
    return username || null;
  } catch {
    return null;
  }
};