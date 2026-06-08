import { reddit, redis } from '@devvit/web/server';

const DEV_ACCOUNTS_KEY = 'dev_accounts';

/**
 * Get all developer accounts stored in Redis (excluding the primary owner)
 */
export const getDevAccounts = async (): Promise<string[]> => {
  try {
    const data = await redis.get(DEV_ACCOUNTS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed.map((username: string) => username.toLowerCase().trim());
    }
    return [];
  } catch (error) {
    console.error('Error fetching dev accounts from Redis:', error);
    return [];
  }
};

/**
 * Add a developer account to Redis
 */
export const addDevAccount = async (username: string): Promise<void> => {
  const normalized = username.toLowerCase().trim();
  if (!normalized || normalized === 'owenutley') return;

  const currentDevs = await getDevAccounts();
  if (!currentDevs.includes(normalized)) {
    currentDevs.push(normalized);
    await redis.set(DEV_ACCOUNTS_KEY, JSON.stringify(currentDevs));
  }
};

/**
 * Remove a developer account from Redis
 */
export const removeDevAccount = async (username: string): Promise<void> => {
  const normalized = username.toLowerCase().trim();
  if (!normalized) return;

  const currentDevs = await getDevAccounts();
  const updatedDevs = currentDevs.filter((dev) => dev !== normalized);
  await redis.set(DEV_ACCOUNTS_KEY, JSON.stringify(updatedDevs));
};

/**
 * Verify if the current user is an authorized developer
 */
export const isDev = async (): Promise<boolean> => {
  try {
    const username = await reddit.getCurrentUsername();
    console.log(`[Dev Authentication Check] Current Username: "${username}"`);
    if (!username) return false;

    const normalized = username.toLowerCase().trim();

    // 1. Primary Owner check
    if (normalized === 'owenutley' || normalized === 'fit-worldliness-1588') {
      return true;
    }

    // 2. Additional dev accounts check
    const additionalDevs = await getDevAccounts();
    return additionalDevs.includes(normalized);
  } catch (error) {
    console.error('Error verifying developer permissions:', error);
    return false;
  }
};
