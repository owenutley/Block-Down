import { reddit, context } from '@devvit/web/server';

/**
 * Check if the current user is a moderator of the current subreddit.
 * Uses the Reddit API to verify moderator status rather than hardcoded usernames.
 */
export const isModerator = async (): Promise<boolean> => {
  try {
    const username = await reddit.getCurrentUsername();
    if (!username) return false;

    const subredditName = context.subredditName;
    if (!subredditName) return false;

    const modsListing = reddit.getModerators({ subredditName });
    const mods = await modsListing.all();
    return mods.some(
      (mod) => mod.username.toLowerCase() === username.toLowerCase()
    );
  } catch (error) {
    console.error('Error checking moderator status:', error);
    return false;
  }
};
